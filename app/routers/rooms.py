#from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.models import Room, Application, ApplicationStatus, User
from ..auth.dependencies import get_current_user
#from ..schemas.application import ApplicationResponse # Or create a Room schema

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)

@router.get("/all")
def get_all_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all rooms with their current occupants for the visual layout viewer."""
    rooms = db.query(Room).all()
    result = []
    
    for room in rooms:
        # Fetch occupants (applications linked to this room)
        apps = db.query(Application).filter(Application.room_id == room.id).all()
        occupants = []
        for app in apps:
            occupants.append({
                "id": app.id,
                "student_name": app.user.profile.full_name if app.user.profile else "Unknown",
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
        func.coalesce(occupancy_subquery.c.occupant_count, 0).desc()
    ).first()
            
    if not available_room:
        raise HTTPException(status_code=400, detail="No rooms matching your gender are currently available.")
        
    assigned_room = available_room
    
    application.room_id = assigned_room.id
    db.commit()
    
    return {"message": "Room successfully assigned", "room_number": assigned_room.room_number}

@router.get("/unassigned-students")
def get_unassigned_students(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return approved students who don't have a room assigned yet."""
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
def assign_student(room_id: int, application_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def remove_student(room_id: int, application_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove a student from a room."""
    application = db.query(Application).filter(Application.id == application_id, Application.room_id == room_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Student not found in this room")
        
    application.room_id = None
    db.commit()
    return {"message": "Student removed from room"}
