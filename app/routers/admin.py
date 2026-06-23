from typing import Optional, List
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
import time

# Simple in-memory cache for admin dashboard (cleared on reload)
ADMIN_CACHE = {}
CACHE_TTL = 300 # 5 minutes

def get_cached(key):
    if key in ADMIN_CACHE:
        val, expiry = ADMIN_CACHE[key]
        if time.time() < expiry:
            return val
    return None

def set_cache(key, val):
    ADMIN_CACHE[key] = (val, time.time() + CACHE_TTL)

from ..models.database import get_db
from ..models.models import User, Application, Profile, ApplicationStatus, Room, StatusHistory, UserRole, ChatMessage
from ..services.audit import record_audit_log
from ..services.notifications import create_notification
from ..schemas.application import (
    ApplicationResponse,
    ApplicationStatusUpdate,
    ApplicationWithProfile,
    ProfileResponse,
    PaginatedApplications,
)
from ..auth.dependencies import get_current_admin
from ..services.email import (
    send_application_approved,
    send_application_rejected,
    send_application_incomplete,
    send_application_waitlisted,
    send_custom_email,
    EMAILS_ENABLED
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.get("/applications", response_model=PaginatedApplications)
def list_applications(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=10000),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """List all applications with optional status filter and pagination."""
    query = db.query(Application).options(
        joinedload(Application.documents),
        joinedload(Application.user).joinedload(User.profile),
        joinedload(Application.history),
    )

    if status_filter:
        query = query.filter(Application.status == status_filter)

    # Order by: PENDING first, then by submitted_at descending
    query = query.order_by(
        case((Application.status == ApplicationStatus.PENDING, 0), else_=1),
        Application.submitted_at.desc()
    )

    total = query.count()
    applications = query.offset((page - 1) * limit).limit(limit).all()

    results = []
    for app in applications:
        profile = app.user.profile if app.user else None
        results.append(
            ApplicationWithProfile(
                id=app.id,
                user_id=app.user_id,
                student_type=app.student_type,
                filière=app.filière,
                grade_average=app.grade_average,
                status=app.status,
                submitted_at=app.submitted_at,
                admin_feedback=app.admin_feedback,
                has_new_message=app.has_new_message,
                is_paid=app.is_paid,
                room=app.room,
                documents=app.documents,
                history=app.history,
                student_email=app.user.email,
                profile=profile,
            )
        )

    return PaginatedApplications(
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
        items=results,
    )

@router.get("/applications/{application_id}", response_model=ApplicationWithProfile)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Get details for a single application."""
    app = db.query(Application).options(
        joinedload(Application.documents),
        joinedload(Application.user).joinedload(User.profile),
        joinedload(Application.history),
    ).filter(Application.id == application_id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    profile = app.user.profile if app.user else None
    return ApplicationWithProfile(
        id=app.id,
        user_id=app.user_id,
        student_type=app.student_type,
        filière=app.filière,
        grade_average=app.grade_average,
        status=app.status,
        submitted_at=app.submitted_at,
        documents=app.documents,
        student_email=app.user.email,
        profile=profile,
        has_new_message=app.has_new_message
    )

@router.patch("/applications/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Update an application's status to approved or rejected, then notify the student."""
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with id {application_id} not found"
        )

    application.status = update.status
    if update.admin_feedback:
        application.admin_feedback = update.admin_feedback

    if update.status == ApplicationStatus.APPROVED:
        # Automatic room assignment based on gender and section
        profile = db.query(Profile).filter(Profile.user_id == application.user_id).first()
        gender = profile.gender if profile else None
        
        if not gender or gender not in ['Male', 'Female']:
            application.admin_feedback = "Approuvé, mais affectation automatique impossible (Genre non spécifié)."
        else:
            is_cpge = application.student_type.value == "CPGE"
            section_filter = "CPGE" if is_cpge else "LYCEE"
            
            # Base query for rooms matching section and gender
            query = db.query(Room).filter(
                Room.student_section == section_filter,
                Room.gender_type == gender
            )
            
            # Apply specific sorting/filtering logic
            if is_cpge:
                categories = ['A', 'B'] if gender == 'Male' else ['C', 'D']
                query = query.filter(Room.category.in_(categories)).order_by(Room.category.asc(), Room.room_number.asc())
            else:
                query = query.order_by(Room.room_number.asc())
                
            rooms = query.all()
            room_assigned = False
            
            for room in rooms:
                # Count current occupants in this room
                occupancy = db.query(Application).filter(
                    Application.room_id == room.id
                ).count()
                
                if occupancy < room.capacity:
                    application.room_id = room.id
                    room_assigned = True
                    break
                    
            if not room_assigned:
                application.status = ApplicationStatus.WAITLISTED
                update.status = ApplicationStatus.WAITLISTED
                section_name = "CPGE" if is_cpge else "Lycée Technique"
                application.admin_feedback = f"Placé sur liste d'attente : Plus de places disponibles dans les pavillons {section_name} pour votre genre."

    db.commit()
    db.refresh(application)

    # Invalidate cache
    if "application_stats" in ADMIN_CACHE:
        del ADMIN_CACHE["application_stats"]
    if "application_analytics" in ADMIN_CACHE:
        del ADMIN_CACHE["application_analytics"]

    # 0. Record Audit Log
    record_audit_log(db, admin.id, f"UPDATE_STATUS_{update.status.value}", "admin", f"App ID: {application.id}")

    # 1. Create Status History Entry
    history_entry = StatusHistory(
        application_id=application.id,
        status=update.status,
        comment=update.admin_feedback
    )
    db.add(history_entry)

    # 2. Create Notification for the student
    notification_msg = f"Le statut de votre candidature est maintenant : {update.status.value}."
    if update.admin_feedback:
        notification_msg += f" Commentaire : {update.admin_feedback}"
    
    create_notification(
        db,
        application.user_id,
        "Mise à jour de votre candidature",
        notification_msg
    )

    # Send email notification
    student = application.user
    profile  = student.profile if student else None
    name     = profile.full_name if profile else student.email

    if update.status == ApplicationStatus.APPROVED:
        send_application_approved(student.email, name)
    elif update.status == ApplicationStatus.REJECTED:
        send_application_rejected(student.email, name)
    elif update.status == ApplicationStatus.INCOMPLETE:
        send_application_incomplete(student.email, name, application.admin_feedback or "Dossier incomplet. Veuillez vérifier.")
    elif update.status == ApplicationStatus.WAITLISTED:
        send_application_waitlisted(student.email, name)

    return application

@router.delete("/applications/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Delete an application."""
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with id {application_id} not found"
        )

    db.delete(application)
    db.commit()

    # Invalidate cache
    if "application_stats" in ADMIN_CACHE:
        del ADMIN_CACHE["application_stats"]
    if "application_analytics" in ADMIN_CACHE:
        del ADMIN_CACHE["application_analytics"]

    record_audit_log(db, admin.id, "DELETE_APPLICATION", "admin", f"Deleted App ID: {application_id}")

    return {"message": "Application successfully deleted"}


@router.get("/stats")
def get_application_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return accurate aggregate counts for all applications (no pagination)."""
    cached = get_cached("application_stats")
    if cached:
        return cached

    pending = db.query(Application).filter(Application.status == ApplicationStatus.PENDING).count()
    approved = db.query(Application).filter(Application.status == ApplicationStatus.APPROVED).count()
    rejected = db.query(Application).filter(Application.status == ApplicationStatus.REJECTED).count()
    incomplete = db.query(Application).filter(Application.status == ApplicationStatus.INCOMPLETE).count()
    waitlisted = db.query(Application).filter(Application.status == ApplicationStatus.WAITLISTED).count()

    total = pending + approved + rejected + incomplete + waitlisted

    result = {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "incomplete": incomplete,
        "waitlisted": waitlisted
    }
    set_cache("application_stats", result)
    return result


@router.get("/analytics")
def get_application_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return aggregated data for dashboard charts."""
    cached = get_cached("application_analytics")
    if cached:
        return cached

    # Group by Province
    province_stats = db.query(
        Profile.province, 
        func.count(Application.id).label('count')
    ).join(User, Profile.user_id == User.id)\
     .join(Application, User.id == Application.user_id)\
     .group_by(Profile.province).all()

    # Group by Filière
    filiere_stats = db.query(
        Application.filière,
        func.count(Application.id).label('count')
    ).group_by(Application.filière).all()

    # Group by Submission Date (last 30 days)
    import datetime
    thirty_days_ago = datetime.datetime.now() - datetime.timedelta(days=30)
    
    trends = db.query(
        func.date(Application.submitted_at).label('date'),
        func.count(Application.id).label('count')
    ).filter(Application.submitted_at >= thirty_days_ago)\
     .group_by(func.date(Application.submitted_at))\
     .order_by(func.date(Application.submitted_at)).all()

    result = {
        "by_province": [{"name": p[0], "value": p[1]} for p in province_stats if p[0]],
        "by_filiere": [{"name": f[0], "value": f[1]} for f in filiere_stats if f[0]],
        "trends": [{"date": str(t[0]), "count": t[1]} for t in trends]
    }
    set_cache("application_analytics", result)
    return result


# ─── Email Notification Service ───────────────────────────────────────────────

class EmailPayload(BaseModel):
    emails: List[str]
    message: str

@router.get("/email/status")
def get_email_status(admin: User = Depends(get_current_admin)):
    """Return whether the Email service is configured or in simulation mode."""
    return {"enabled": EMAILS_ENABLED, "simulated": not EMAILS_ENABLED}

@router.get("/email/inactive-students")
def get_inactive_students(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return students who registered but never submitted an application."""
    students = db.query(User).filter(User.role == UserRole.STUDENT).all()
    inactive = []
    for user in students:
        has_app = db.query(Application).filter(Application.user_id == user.id).count()
        if has_app == 0 and user.profile:
            inactive.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.profile.full_name,
                "phone": user.profile.phone,
                "registered_at": user.created_at.isoformat() if user.created_at else None
            })
    return inactive

@router.post("/email/send")
def send_bulk_email(
    payload: EmailPayload,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Send an Email to a list of email addresses."""
    if not payload.emails:
        raise HTTPException(status_code=400, detail="Aucune adresse e-mail fournie.")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Le message est vide.")

    sent = 0
    failed = 0
    for email in payload.emails:
        try:
            # Look up name
            user = db.query(User).filter(User.email == email).first()
            name = "Étudiant"
            if user:
                if user.profile and user.profile.full_name:
                    name = user.profile.full_name
                
                # Send email
                send_custom_email(to_email=email, full_name=name, message=payload.message)
                
                # Check if user has an application to add ChatMessage
                application = db.query(Application).filter(Application.user_id == user.id).first()
                if application:
                    chat_msg = ChatMessage(
                        application_id=application.id,
                        sender_id=admin.id,
                        message=payload.message
                    )
                    db.add(chat_msg)
                    application.has_new_message = True
                    db.commit()

                # Create in-app notification
                create_notification(
                    db=db,
                    user_id=user.id,
                    title="Message de l'administration",
                    message=payload.message,
                    notif_type="message"
                )
                sent += 1
        except Exception as e:
            failed += 1

    return {
        "sent": sent,
        "failed": failed,
        "simulated": not EMAILS_ENABLED
    }

