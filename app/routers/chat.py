from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
import json

from ..models.database import get_db
from ..models.models import ChatMessage, User, Application, UserRole
from ..auth.dependencies import get_current_user, get_current_admin, get_user_from_token
from ..schemas.chat import ChatMessageSchema, ChatMessageCreate

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        # application_id -> list of active websockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, application_id: int):
        await websocket.accept()
        if application_id not in self.active_connections:
            self.active_connections[application_id] = []
        self.active_connections[application_id].append(websocket)

    def disconnect(self, websocket: WebSocket, application_id: int):
        if application_id in self.active_connections:
            self.active_connections[application_id].remove(websocket)
            if not self.active_connections[application_id]:
                del self.active_connections[application_id]

    async def broadcast(self, message: str, application_id: int):
        if application_id in self.active_connections:
            for connection in self.active_connections[application_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.get("/{application_id}", response_model=List[ChatMessageSchema])
def get_chat_history(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure user has access to this application chat
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user.role != UserRole.ADMIN and app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    messages = db.query(ChatMessage).filter(ChatMessage.application_id == application_id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.websocket("/ws/{application_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    application_id: int,
    token: str = None,
    db: Session = Depends(get_db)
):
    # Authenticate user from query parameter token
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check access to application
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app or (user.role != UserRole.ADMIN and app.user_id != user.id):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, application_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Save to DB
            new_msg = ChatMessage(
                application_id=application_id,
                sender_id=user.id,
                message=message_data["message"]
            )
            db.add(new_msg)
            
            # Update app flag
            if user.role == UserRole.ADMIN:
                app.has_new_message = True # Mark for student
            else:
                # If student sends, maybe mark for admin (already tracked by queries usually)
                pass
            
            db.commit()
            db.refresh(new_msg)

            # Broadcast to others in the same application chat
            response = ChatMessageSchema.from_orm(new_msg).json()
            await manager.broadcast(response, application_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, application_id)
    except Exception as e:
        print(f"Error in websocket: {e}")
        manager.disconnect(websocket, application_id)
