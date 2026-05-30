from sqlalchemy.orm import Session
from ..models.models import Notification

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "status_change",
    related_id: int = None
):
    """
    Centralized service to create notifications in the database.
    Can be extended to send emails or SMS in the future.
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        related_id=related_id
    )
    db.add(notification)
    db.commit()
    return notification
