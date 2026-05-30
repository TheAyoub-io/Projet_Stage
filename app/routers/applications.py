import os
import uuid
import shutil
from datetime import date
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.models import User, Profile, Application, Document, StudentType, DocumentType, ChatMessage, UserRole, StatusHistory, ApplicationStatus
from ..schemas.application import ApplicationStatusResponse, ApplicationResponse, ProfileResponse, ProfileUpdate, ChatMessageCreate, ChatMessageResponse
from ..auth.dependencies import get_current_user
from ..services.documents import save_document
from ..services.audit import record_audit_log
from ..services.notifications import create_notification

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)

import stripe

ALLOWED_PROVINCES = ["Azilal", "Fkih Ben Salah", "Khénifra", "Khouribga", "Beni Mellal"]
UPLOAD_DIR = "uploads"
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
stripe.api_key = STRIPE_SECRET_KEY

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create-payment-intent")
async def create_payment_intent():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe Secret Key not configured in backend.")
    try:
        # Create a PaymentIntent with amount and currency
        # Amount is in cents (or smallest currency unit). For MAD 150, it is 15000.
        intent = stripe.PaymentIntent.create(
            amount=15000,
            currency='mad',
            automatic_payment_methods={'enabled': True},
        )
        return {"clientSecret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def submit_application(
    full_name: str = Form(...),
    cin: str = Form(...),
    phone: str = Form(...),
    date_of_birth: date = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    province: str = Form(...),
    student_type: StudentType = Form(...),
    filière: str = Form(...),
    grade_average: Decimal = Form(...),
    cin_copy: UploadFile = File(...),
    transcript: UploadFile = File(...),
    fee_receipt: Optional[UploadFile] = File(None),
    payment_id: Optional[str] = Form(None),
    residency_cert: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Geographic Validation
    if province not in ALLOWED_PROVINCES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Province must be within Beni Mellal-Khénifra region: {', '.join(ALLOWED_PROVINCES)}"
        )
    
    # 2. Check if user already applied
    existing_app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an application."
        )

    # 3. Create or update profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        # Also need to check if CIN is used by someone else
        cin_exists = db.query(Profile).filter(Profile.cin == cin).first()
        if cin_exists:
            raise HTTPException(status_code=400, detail="CIN already in use")
            
        profile = Profile(
            user_id=current_user.id,
            full_name=full_name,
            cin=cin,
            phone=phone,
            date_of_birth=date_of_birth,
            address=address,
            city=city,
            province=province
        )
        db.add(profile)
    else:
        profile.full_name = full_name
        profile.phone = phone
        profile.date_of_birth = date_of_birth
        profile.address = address
        profile.city = city
        profile.province = province
        
    db.commit() # commit profile first
    db.refresh(profile)

    # 4. Create Application
    application = Application(
        user_id=current_user.id,
        student_type=student_type,
        filière=filière,
        grade_average=grade_average
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # 5. Handle File Uploads via Service
    save_document(cin_copy, application.id, DocumentType.CIN_COPY, db)
    save_document(transcript, application.id, DocumentType.TRANSCRIPT, db)
    
    if fee_receipt:
        save_document(fee_receipt, application.id, DocumentType.FEE_RECEIPT, db)
    elif payment_id:
        db.add(Document(application_id=application.id, document_type=DocumentType.FEE_RECEIPT, file_url=f"stripe://{payment_id}"))
    
    if residency_cert:
        save_document(residency_cert, application.id, DocumentType.RESIDENCY_CERT, db)
        
    db.commit()
    db.refresh(application)

    # Record Audit Log
    record_audit_log(db, current_user.id, "SUBMIT_APPLICATION", "applications", f"Application ID: {application.id}")
    
    # 6. Initial Status History
    db.add(StatusHistory(
        application_id=application.id,
        status=ApplicationStatus.PENDING,
        comment="Candidature soumise avec succès."
    ))
    # 7. Notification for student
    create_notification(
        db,
        current_user.id,
        "Candidature reçue",
        "Votre dossier a été bien reçu et est en cours de traitement."
    )
    
    return application

@router.get("/my-status", response_model=ApplicationStatusResponse)
def get_my_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    application = db.query(Application).filter(Application.user_id == current_user.id).first()
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    
    if not application:
        return ApplicationStatusResponse(
            message="No application found. Please submit an application.",
            application=None,
            profile=profile
        )
        
    return ApplicationStatusResponse(
        message="Application retrieved successfully.",
        application=application,
        profile=profile
    )

@router.put("/profile", response_model=ProfileResponse)
def update_my_profile(
    update_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allow students to update contact information without resubmitting application."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    
    if update_data.phone is not None:
        profile.phone = update_data.phone
    if update_data.address is not None:
        profile.address = update_data.address
    if update_data.city is not None:
        profile.city = update_data.city
        
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/withdraw", status_code=status.HTTP_200_OK)
def withdraw_application(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Student withdraws (deletes) their own pending application.
    Approved or rejected applications cannot be withdrawn.
    """
    from ..models.models import ApplicationStatus  # local import avoids circular ref

    application = db.query(Application).filter(Application.user_id == current_user.id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No application found to withdraw."
        )

    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot withdraw an application with status '{application.status.value}'. "
                   "Only pending applications can be withdrawn."
        )

    # Explicitly remove child documents first (SQLite won't auto-cascade without PRAGMA)
    for doc in application.documents:
        db.delete(doc)
    db.flush()

    db.delete(application)
    db.commit()
    return {"message": "Your application has been successfully withdrawn."}

@router.put("/update", response_model=ApplicationResponse, status_code=status.HTTP_200_OK)
async def update_application(
    full_name: str = Form(...),
    cin: str = Form(...),
    phone: str = Form(...),
    date_of_birth: date = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    province: str = Form(...),
    student_type: StudentType = Form(...),
    filière: str = Form(...),
    grade_average: Decimal = Form(...),
    cin_copy: Optional[UploadFile] = File(None),
    transcript: Optional[UploadFile] = File(None),
    fee_receipt: Optional[UploadFile] = File(None),
    payment_id: Optional[str] = Form(None),
    residency_cert: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.models import ApplicationStatus
    
    # 1. Geographic Validation
    if province not in ALLOWED_PROVINCES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Province must be within Beni Mellal-Khénifra region: {', '.join(ALLOWED_PROVINCES)}"
        )
    
    # 2. Check if application exists and is pending
    application = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
        
    if application.status not in [ApplicationStatus.PENDING, ApplicationStatus.REJECTED, ApplicationStatus.INCOMPLETE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update an application with status '{application.status.value}'. Only pending, rejected, or incomplete applications can be updated."
        )

    # If it was rejected or incomplete and they update it, it goes back to pending review
    if application.status in [ApplicationStatus.REJECTED, ApplicationStatus.INCOMPLETE]:
        application.status = ApplicationStatus.PENDING

    # 3. Update Profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
        
    # Check CIN uniqueness if changed
    if profile.cin != cin:
        cin_exists = db.query(Profile).filter(Profile.cin == cin).first()
        if cin_exists:
            raise HTTPException(status_code=400, detail="CIN already in use")
            
    profile.full_name = full_name
    profile.cin = cin
    profile.phone = phone
    profile.date_of_birth = date_of_birth
    profile.address = address
    profile.city = city
    profile.province = province
    
    # 4. Update Application
    application.student_type = student_type
    application.filière = filière
    application.grade_average = grade_average
    
    # 5. Handle File Uploads via Service (Optional updates)
    def update_document(doc_type, upload_file):
        if not upload_file:
            return

        # Check if document already exists
        existing_doc = next((d for d in application.documents if d.document_type == doc_type), None)

        # We reuse save_document which adds to session, but if it exists we just update url
        from ..services.documents import validate_file_extension
        ext = validate_file_extension(upload_file.filename)
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        if existing_doc:
            existing_doc.file_url = file_path
        else:
            db.add(Document(application_id=application.id, document_type=doc_type, file_url=file_path))

    update_document(DocumentType.CIN_COPY, cin_copy)
    update_document(DocumentType.TRANSCRIPT, transcript)

    if fee_receipt:
        update_document(DocumentType.FEE_RECEIPT, fee_receipt)
    elif payment_id:
        existing_doc = next((d for d in application.documents if d.document_type == DocumentType.FEE_RECEIPT), None)
        if existing_doc:
            existing_doc.file_url = f"stripe://{payment_id}"
        else:
            db.add(Document(application_id=application.id, document_type=DocumentType.FEE_RECEIPT, file_url=f"stripe://{payment_id}"))

    update_document(DocumentType.RESIDENCY_CERT, residency_cert)

    db.commit()
    db.refresh(application)
    
    # Status history entry
    db.add(StatusHistory(
        application_id=application.id,
        status=ApplicationStatus.PENDING,
        comment="Candidature mise à jour par l'étudiant."
    ))
    # Notification for student
    create_notification(
        db,
        current_user.id,
        "Dossier mis à jour",
        "Les modifications apportées à votre dossier ont été enregistrées."
    )
    
    return application


@router.get("/{app_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role != UserRole.ADMIN and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to access these messages.")

    if current_user.role == UserRole.ADMIN:
        application.has_new_message = False
        db.commit()

    messages = db.query(ChatMessage).filter(ChatMessage.application_id == app_id).order_by(ChatMessage.created_at.asc()).all()
    # ... rest of formatting ...
    response_items = []
    for msg in messages:
        sender_profile = db.query(Profile).filter(Profile.user_id == msg.sender_id).first()
        sender_name = sender_profile.full_name if sender_profile else msg.sender.email
        response_items.append({
            "id": msg.id,
            "application_id": msg.application_id,
            "sender_id": msg.sender_id,
            "sender_role": msg.sender.role.value,
            "sender_name": sender_name,
            "message": msg.message,
            "created_at": msg.created_at
        })
    return response_items


@router.post("/{app_id}/messages", response_model=ChatMessageResponse)
def send_chat_message(
    app_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role != UserRole.ADMIN and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to send messages here.")

    if current_user.role == UserRole.STUDENT:
        application.has_new_message = True
        
    msg = ChatMessage(
        application_id=app_id,
        sender_id=current_user.id,
        message=payload.message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    db.refresh(application)

    # Create Notification for the receiver
    receiver_id = application.user_id if current_user.role == UserRole.ADMIN else db.query(User).filter(User.role == UserRole.ADMIN).first().id
    
    notif_title = "Nouveau message de support" if current_user.role == UserRole.ADMIN else f"Nouveau message de {current_user.profile.full_name if current_user.profile else current_user.email}"
    
    create_notification(
        db,
        receiver_id,
        notif_title,
        payload.message[:100] + ("..." if len(payload.message) > 100 else ""),
        "message",
        application.id
    )
    db.refresh(msg)

    sender_profile = db.query(Profile).filter(Profile.user_id == msg.sender_id).first()
    sender_name = sender_profile.full_name if sender_profile else msg.sender.email

    return {
        "id": msg.id,
        "application_id": msg.application_id,
        "sender_id": msg.sender_id,
        "sender_role": msg.sender.role.value,
        "sender_name": sender_name,
        "message": msg.message,
        "created_at": msg.created_at
    }
