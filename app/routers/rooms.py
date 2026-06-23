#from typing import List
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
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
def get_all_rooms(
    section: Optional[str] = Query(None, description="Filter by section: 'CPGE' or 'LYCEE'"),
    category: Optional[str] = Query(None, description="Filter by CPGE category: 'A', 'B', 'C', 'D'"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Return all rooms with their current occupants (admin only). Optionally filter by section and/or category."""
    query = db.query(Room)
    if section:
        query = query.filter(Room.student_section == section.upper())
    if category:
        query = query.filter(Room.category == category.upper())
    rooms = query.all()
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
            "student_section": room.student_section,
            "category": room.category,
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
                "gender_type": room.gender_type,
                "student_section": room.student_section,
                "category": room.category,
            })
            
    return available_rooms

import random

@router.post("/auto-assign")
def auto_assign_room(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Automatically assign an available room to an approved student, respecting gender and section constraints."""
    application = db.query(Application).filter(Application.user_id == current_user.id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
        
    if application.status != ApplicationStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved applications can be assigned a room.")
        
    if application.room_id is not None:
        raise HTTPException(status_code=400, detail="Room already assigned.")
    
    # Get student gender and section
    student_gender = current_user.profile.gender if current_user.profile else None
    if not student_gender:
        raise HTTPException(status_code=400, detail="Student gender not set in profile.")
    
    student_section = application.student_type  # 'CPGE' or 'Lycée Technique'
    # Normalize section
    is_cpge = str(student_section).upper() == "CPGE"
    section_filter = "CPGE" if is_cpge else "LYCEE"
        
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
        Room.student_section == section_filter,
        func.coalesce(occupancy_subquery.c.occupant_count, 0) < Room.capacity
    ).order_by(
        func.coalesce(occupancy_subquery.c.occupant_count, 0).desc()
    ).first()
            
    if not available_room:
        raise HTTPException(status_code=400, detail="No rooms matching your profile are currently available.")
        
    application.room_id = available_room.id
    db.commit()
    
    return {"message": "Room successfully assigned", "room_number": available_room.room_number}

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
            'section': r.student_section,
            'filières': set([a.filière for a in db.query(Application).filter(Application.room_id == r.id).all()])
        }

    for app in unassigned_apps:
        student_gender = app.user.profile.gender if app.user.profile else None
        if not student_gender:
            continue # skip students without gender
        
        # Determine section and CPGE category
        is_cpge = str(app.student_type).upper() == "CPGE"
        section_filter = "CPGE" if is_cpge else "LYCEE"
        
        cpge_category_filter = None
        if is_cpge:
            if "1ère année" in str(app.filière):
                cpge_category_filter = "A" if student_gender == "Male" else "C"
            elif "2ème année" in str(app.filière):
                cpge_category_filter = "B" if student_gender == "Male" else "D"
            
        candidate_rooms = []
        for rid, data in room_occupancy.items():
            if data['gender'] != student_gender: continue
            if data['section'] != section_filter: continue
            if data['current'] >= data['capacity']: continue
            
            if is_cpge and cpge_category_filter:
                if data['room'].category != cpge_category_filter:
                    continue
                    
            candidate_rooms.append(data)
                
        if not candidate_rooms:
            continue # No available rooms for this gender/section

        # Scoring: fill near-full rooms first, bonus if same filière
        best_room = None
        best_score = -1
        
        for r_data in candidate_rooms:
            score = r_data['current']
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
        "filiere": s.filière,
        "student_type": s.student_type,
        "gender": s.user.profile.gender if s.user and s.user.profile else None
    } for s in students]

@router.post("/{room_id}/assign/{application_id}")
def assign_student(room_id: int, application_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Manually assign a student to a room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not room or not application:
        raise HTTPException(status_code=404, detail="Room or Application not found")

    # Constraint 1: Section Match
    is_app_cpge = str(application.student_type).upper() == "CPGE"
    app_section = "CPGE" if is_app_cpge else "LYCEE"
    if app_section != room.student_section:
        raise HTTPException(status_code=400, detail=f"Impossible d'affecter un étudiant de la section {app_section} à une chambre {room.student_section}.")

    # Constraint 2: Gender Match
    student_gender = application.user.profile.gender if application.user and application.user.profile else None
    if not student_gender or student_gender != room.gender_type:
        raise HTTPException(status_code=400, detail="Le genre de l'étudiant ne correspond pas au genre de la chambre.")
        
    # Constraint 3: CPGE Category Match
    if is_app_cpge:
        cpge_category_filter = None
        if "1ère année" in str(application.filière):
            cpge_category_filter = "A" if student_gender == "Male" else "C"
        elif "2ème année" in str(application.filière):
            cpge_category_filter = "B" if student_gender == "Male" else "D"
            
        if cpge_category_filter and room.category != cpge_category_filter:
            raise HTTPException(status_code=400, detail=f"L'étudiant de ce niveau doit être affecté à la catégorie {cpge_category_filter}.")
        
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

