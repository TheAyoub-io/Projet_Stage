from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import json

from ..models.database import get_db
from ..models.models import User, UserRole, Ticket, TicketMessage, TicketStatus, Notification
from ..auth.dependencies import get_current_user
from ..websockets import manager

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

class TicketCreate(BaseModel):
    subject: str
    description: str

class MessageCreate(BaseModel):
    message: str

class TicketUpdate(BaseModel):
    status: str

@router.get("/", response_model=List[Dict[str, Any]])
def get_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    else:
        tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    
    result = []
    for t in tickets:
        result.append({
            "id": t.id,
            "subject": t.subject,
            "status": t.status,
            "created_at": t.created_at,
            "user_id": t.user_id,
            "user_name": t.user.profile.full_name if t.user and t.user.profile else "Unknown"
        })
    return result

@router.post("/", response_model=Dict[str, Any])
async def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_ticket = Ticket(
        user_id=current_user.id,
        subject=ticket.subject,
        description=ticket.description,
        status=TicketStatus.OPEN
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    # Notify admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            title="Nouveau ticket",
            message=f"Nouveau ticket de {current_user.email}: {ticket.subject}",
            type="alert",
            related_id=new_ticket.id
        )
        db.add(notification)
    db.commit()

    for admin in admins:
        await manager.send_personal_message(
            json.dumps({"type": "NEW_TICKET", "message": f"Nouveau ticket de {current_user.email}: {ticket.subject}"}), 
            admin.id
        )
        
    return {"id": new_ticket.id, "subject": new_ticket.subject, "status": new_ticket.status}

@router.get("/{ticket_id}", response_model=Dict[str, Any])
def get_ticket_details(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
        
    if current_user.role != UserRole.ADMIN and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")
        
    messages = []
    for m in ticket.messages:
        messages.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.profile.full_name if m.sender.profile else m.sender.email,
            "sender_role": m.sender.role,
            "message": m.message,
            "created_at": m.created_at
        })
        
    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "created_at": ticket.created_at,
        "user_name": ticket.user.profile.full_name if ticket.user.profile else "Unknown",
        "messages": messages
    }

@router.post("/{ticket_id}/messages", response_model=Dict[str, Any])
async def add_ticket_message(ticket_id: int, message: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
        
    if current_user.role != UserRole.ADMIN and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")
        
    new_message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=message.message
    )
    db.add(new_message)
    
    # Optionally update status if an admin replies
    if current_user.role == UserRole.ADMIN and ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS
        
    db.commit()
    db.refresh(new_message)
    
    # Notify the other party
    recipient_id = ticket.user_id if current_user.role == UserRole.ADMIN else None
    
    if recipient_id:
        notification = Notification(
            user_id=recipient_id,
            title="Nouveau message",
            message=f"Nouvelle réponse sur votre ticket: {ticket.subject}",
            type="message",
            related_id=ticket.id
        )
        db.add(notification)
        db.commit()

        await manager.send_personal_message(
            json.dumps({"type": "TICKET_MESSAGE", "ticket_id": ticket.id, "message": "Nouvelle réponse sur votre ticket."}),
            recipient_id
        )
    else:
        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                title="Nouveau message",
                message=f"Nouveau message de {current_user.email} sur le ticket: {ticket.subject}",
                type="message",
                related_id=ticket.id
            )
            db.add(notification)
        db.commit()

        for admin in admins:
            await manager.send_personal_message(
                json.dumps({"type": "TICKET_MESSAGE", "ticket_id": ticket.id, "message": "Nouveau message d'un étudiant sur un ticket."}),
                admin.id
            )
            
    return {"status": "Message added"}

@router.put("/{ticket_id}/status", response_model=Dict[str, Any])
async def update_ticket_status(ticket_id: int, ticket_update: TicketUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
        
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
        
    try:
        new_status = TicketStatus(ticket_update.status)
        ticket.status = new_status
        
        notification = Notification(
            user_id=ticket.user_id,
            title="Mise à jour du ticket",
            message=f"Le statut de votre ticket '{ticket.subject}' a été modifié.",
            type="status_change",
            related_id=ticket.id
        )
        db.add(notification)
        db.commit()
        
        await manager.send_personal_message(
            json.dumps({"type": "TICKET_STATUS", "ticket_id": ticket.id, "message": f"Votre ticket est maintenant {new_status}"}),
            ticket.user_id
        )
        return {"status": ticket.status}
    except ValueError:
        raise HTTPException(status_code=400, detail="Statut invalide")
