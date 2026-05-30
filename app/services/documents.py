import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from ..models.models import Document, DocumentType

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_file_extension(filename: str):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return ext

def save_document(upload_file: UploadFile, application_id: int, doc_type: DocumentType, db: Session) -> Document:
    ext = validate_file_extension(upload_file.filename)
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    doc = Document(
        application_id=application_id,
        document_type=doc_type,
        file_url=file_path
    )
    db.add(doc)
    return doc
