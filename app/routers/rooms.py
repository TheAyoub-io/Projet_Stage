#from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.models import Room, Application, ApplicationStatus, User
from ..auth.dependencies import get_current_user, get_current_admin
#from ..schemas.application import ApplicationResponse # Or create a Room schema

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)

@router.get("/all")
def get_all_rooms(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Return all rooms with their current occupants (admin only)."""
    rooms = db.query(Room).all()
    result = []
    
    for room in rooms:
        # Fetch occupants (applications linked to this room)
        apps = db.query(Application).filter(Application.room_id == room.id).all()
        occupants = []
        for app in apps:
            if not app.user:
                continue
            profile = app.user.profile
            occupants.append({
                "id": app.id,
                "student_name": profile.full_name if profile else app.user.email,
                "student_email": app.user.email,
                "filiere": app.filière
            })
            
        result.append({
            "id": room.id,
            "room_number": room.room_number,
            "capacity": room.capacity,
            "gender_type": room.gender_type,
            "occupants": occupants,
            "occupancy_rate": (len(occupants) / room.capacity) * 100 if room.capacity > 0 else 0
        })
            
    return result

@router.get("/available")
def get_available_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return rooms that have available capacity."""
    # Simple logic: capacity > current applications linked to this room
    rooms = db.query(Room).all()
    available_rooms = []
    
    for room in rooms:
        occupants_count = db.query(Application).filter(Application.room_id == room.id).count()
        if occupants_count < room.capacity:
            available_rooms.append({
                "id": room.id,
                "room_number": room.room_number,
                "capacity": room.capacity,
                "available_beds": room.capacity - occupants_count,
                "gender_type": room.gender_type
            })
            
    return available_rooms

import random

@router.post("/auto-assign")
def auto_assign_room(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Automatically assign an available room to an approved student, respecting gender constraints."""
    application = db.query(Application).filter(Application.user_id == current_user.id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
        
    if application.status != ApplicationStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved applications can be assigned a room.")
        
    if application.room_id is not None:
        raise HTTPException(status_code=400, detail="Room already assigned.")
    
    # Get student gender
    student_gender = current_user.profile.gender if current_user.profile else None
    if not student_gender:
        raise HTTPException(status_code=400, detail="Student gender not set in profile.")
        
    from sqlalchemy import func
    
    # Efficiently find rooms with current occupancy
    occupancy_subquery = db.query(
        Application.room_id,
        func.count(Application.id).label('occupant_count')
    ).group_by(Application.room_id).subquery()

    available_room = db.query(Room).outerjoin(
        occupancy_subquery, Room.id == occupancy_subquery.c.room_id
    ).filter(
        Room.gender_type == student_gender,
        func.coalesce(occupancy_subquery.c.occupant_count, 0) < Room.capacity
    ).order_by(
        # 1. Prioritize rooms where people from the same filière already exist (requires joining application again, simple version below prioritizes mostly full rooms)
        func.coalesce(occupancy_subquery.c.occupant_count, 0).desc()
    ).first()
            
    if not available_room:
        raise HTTPException(status_code=400, detail="No rooms matching your gender are currently available.")
        
    assigned_room = available_room
    
    application.room_id = assigned_room.id
    db.commit()
    
    return {"message": "Room successfully assigned", "room_number": assigned_room.room_number}

@router.post("/auto-assign-all")
def auto_assign_all_students(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Automatically assigns rooms to ALL approved, unassigned students, grouping by filière when possible."""
    from sqlalchemy import func
    
    unassigned_apps = db.query(Application).join(User).filter(
        Application.status == ApplicationStatus.APPROVED,
        Application.room_id == None
    ).order_by(Application.filière).all()

    if not unassigned_apps:
        return {"message": "No unassigned approved students found.", "assigned_count": 0}

    assigned_count = 0

    # Cache room capacities and current occupants
    rooms = db.query(Room).all()
    room_occupancy = {}
    for r in rooms:
        count = db.query(Application).filter(Application.room_id == r.id).count()
        room_occupancy[r.id] = {
            'room': r,
            'current': count,
            'capacity': r.capacity,
            'gender': r.gender_type,
            'filières': set([a.filière for a in db.query(Application).filter(Application.room_id == r.id).all()])
        }

    for app in unassigned_apps:
        student_gender = app.user.profile.gender if app.user.profile else None
        if not student_gender:
            continue # skip students without gender
            
        candidate_rooms = []
        for rid, data in room_occupancy.items():
            if data['gender'] == student_gender and data['current'] < data['capacity']:
                candidate_rooms.append(data)
                
        if not candidate_rooms:
            continue # No available rooms for this gender

        # Scoring candidate rooms for smart clustering
        # 1. Score +10 if room has students from same filière
        # 2. Score + current occupants to fill half-empty rooms before making new ones completely full
        best_room = None
        best_score = -1
        
        for r_data in candidate_rooms:
            score = r_data['current'] # Prioritize filling almost full rooms
            if app.filière in r_data['filières']:
                score += 10
            
            if score > best_score:
                best_score = score
                best_room = r_data

        if best_room:
            app.room_id = best_room['room'].id
            best_room['current'] += 1
            best_room['filières'].add(app.filière)
            assigned_count += 1

    db.commit()
    return {"message": f"Successfully assigned {assigned_count} students to rooms.", "assigned_count": assigned_count}

@router.get("/unassigned-students")
def get_unassigned_students(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Return approved students who don't have a room assigned yet (admin only)."""
    students = db.query(Application).filter(
        Application.status == ApplicationStatus.APPROVED,
        Application.room_id == None
    ).all()
    
    return [{
        "id": s.id,
        "student_name": s.user.profile.full_name if s.user and s.user.profile else s.user.email,
        "filiere": s.filière
    } for s in students]

@router.post("/{room_id}/assign/{application_id}")
def assign_student(room_id: int, application_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Manually assign a student to a room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not room or not application:
        raise HTTPException(status_code=404, detail="Room or Application not found")
        
    # Check capacity
    occupants_count = db.query(Application).filter(Application.room_id == room.id).count()
    if occupants_count >= room.capacity:
        raise HTTPException(status_code=400, detail="Room is already at full capacity")
        
    application.room_id = room.id
    db.commit()
    return {"message": "Student assigned to room"}

@router.delete("/{room_id}/remove/{application_id}")
def remove_student(room_id: int, application_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Remove a student from a room."""
    application = db.query(Application).filter(Application.id == application_id, Application.room_id == room_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Student not found in this room")
        
    application.room_id = None
    db.commit()
    return {"message": "Student removed from room"}
