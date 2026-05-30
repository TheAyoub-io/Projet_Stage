from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..models.models import Application, Room

def get_application_trends(db: Session, days: int = 30):
    """Calculates daily submission volume for the last X days."""
    since_date = datetime.now() - timedelta(days=days)
    trends = db.query(
        func.date(Application.submitted_at).label('date'),
        func.count(Application.id).label('count')
    ).filter(Application.submitted_at >= since_date)\
     .group_by(func.date(Application.submitted_at))\
     .order_by(func.date(Application.submitted_at)).all()

    return [{"date": str(t[0]), "count": t[1]} for t in trends]

def get_occupancy_metrics(db: Session):
    """Calculates room occupancy rates per pavilion/gender type."""
    metrics = db.query(
        Room.gender_type,
        func.count(Application.id).label('occupied_beds'),
        func.sum(Room.capacity).label('total_capacity')
    ).outerjoin(Application, Room.id == Application.room_id)\
     .group_by(Room.gender_type).all()

    return [
        {
            "pavilion": m[0],
            "occupied": m[1],
            "total": int(m[2]) if m[2] else 0,
            "rate": (m[1] / m[2] * 100) if m[2] and m[2] > 0 else 0
        }
        for m in metrics
    ]
