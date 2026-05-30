from sqlalchemy.orm import Session
from ..models.models import AuditLog
from fastapi import Request

def record_audit_log(
    db: Session,
    user_id: int,
    action: str,
    module: str,
    description: str = None,
    request: Request = None
):
    ip_address = None
    if request:
        # Try to get real IP if behind proxy
        ip_address = request.headers.get("x-forwarded-for") or request.client.host
        if description:
            user_agent = request.headers.get("user-agent", "Unknown")
            description = f"{description} | UA: {user_agent} | Path: {request.url.path}"

    log = AuditLog(
        user_id=user_id,
        action=action,
        module=module,
        description=description,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
