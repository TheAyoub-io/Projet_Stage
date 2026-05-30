from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from ..models.models import StudentType, ApplicationStatus, DocumentType

class RoomResponse(BaseModel):
    id: int
    room_number: str
    capacity: int
    gender_type: str
    
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: int
    document_type: DocumentType
    file_url: str
    
    model_config = ConfigDict(from_attributes=True)

class StatusHistoryResponse(BaseModel):
    id: int
    status: ApplicationStatus
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProfileResponse(BaseModel):
    full_name: str
    cin: str
    phone: str
    date_of_birth: date
    address: str
    city: str
    province: str

    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    student_type: StudentType
    filière: str
    grade_average: Decimal
    status: ApplicationStatus
    submitted_at: datetime
    room_id: Optional[int] = None
    admin_feedback: Optional[str] = None
    has_new_message: bool = False
    is_paid: bool = False
    room: Optional[RoomResponse] = None
    documents: List[DocumentResponse] = []
    history: List[StatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ApplicationStatusResponse(BaseModel):
    application: Optional[ApplicationResponse] = None
    profile: Optional[ProfileResponse] = None
    message: str

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    admin_feedback: Optional[str] = None

class ApplicationWithProfile(BaseModel):
    id: int
    user_id: int
    student_type: StudentType
    filière: str
    grade_average: Decimal
    status: ApplicationStatus
    submitted_at: datetime
    room_id: Optional[int] = None
    admin_feedback: Optional[str] = None
    has_new_message: bool = False
    is_paid: bool = False
    room: Optional[RoomResponse] = None
    documents: List[DocumentResponse] = []
    history: List[StatusHistoryResponse] = []
    student_email: str
    profile: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedApplications(BaseModel):
    """Paginated wrapper returned by GET /admin/applications."""
    total: int
    page: int
    limit: int
    pages: int
    items: List[ApplicationWithProfile]


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    application_id: int
    sender_id: int
    sender_role: str
    sender_name: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
