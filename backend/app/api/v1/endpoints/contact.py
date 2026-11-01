"""
Public contact form. Every message lands in the support inbox
(contact_messages, worked through at /admin/contact-messages) and is
forwarded to SUPPORT_EMAIL with the sender as Reply-To.
"""

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.account_support import ContactMessage
from app.schemas.auth import MessageResponse
from app.schemas.contact import ContactCreate
from app.services.email_service import (
    EmailMessage,
    EmailSender,
    get_email_sender,
    send_email_safely,
)

router = APIRouter()


@router.post("", response_model=MessageResponse, status_code=201)
def submit_contact_message(
    payload: ContactCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    sender: EmailSender = Depends(get_email_sender),
):
    db.add(ContactMessage(**payload.model_dump()))
    db.commit()
    background_tasks.add_task(
        send_email_safely,
        sender,
        EmailMessage(
            to=settings.SUPPORT_EMAIL,
            subject=f"Contact form: {payload.name}",
            body=f"From: {payload.name} <{payload.email}>\n\n{payload.message}",
            reply_to=payload.email,
        ),
    )
    return MessageResponse(message=f"Thanks, {payload.name} — we'll get back to you soon.")
