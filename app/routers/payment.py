import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from ..models.database import get_db
from ..models.models import User, Application, ApplicationStatus
from ..auth.dependencies import get_current_user
from ..schemas.payment import PaymentLinkResponse

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/payments", tags=["Payments"])

ADMISSION_FEE_AMOUNT = 50000  # 500.00 MAD in cents

@router.post("/create-checkout-session", response_model=PaymentLinkResponse)
async def create_checkout_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if student is approved and needs to pay
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.status != ApplicationStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved students can pay admission fees")

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'mad',
                        'product_data': {
                            'name': 'Frais d\'Inscription Internat',
                            'description': f'Admission fee for {current_user.profile.full_name}',
                        },
                        'unit_amount': ADMISSION_FEE_AMOUNT,
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?payment=success",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/dashboard?payment=cancel",
            client_reference_id=str(app.id),
            customer_email=current_user.email,
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    payload = await request.body()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        application_id = session.get('client_reference_id')
        
        if application_id:
            # Update application or mark as paid
            app = db.query(Application).filter(Application.id == int(application_id)).first()
            if app:
                app.is_paid = True

                from ..models.models import StatusHistory
                history = StatusHistory(
                    application_id=app.id,
                    status=app.status,
                    comment="Frais d'inscription payés via Stripe"
                )
                db.add(history)
                db.commit()

    return {"status": "success"}
