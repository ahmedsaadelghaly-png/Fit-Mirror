"""
Outbound email. Two senders behind one interface:

- LogEmailSender (EMAIL_BACKEND=log, the default) writes each message to
  the application log — local dev and CI never need a mail server, and the
  reset link is right there in the backend log.
- SmtpEmailSender (EMAIL_BACKEND=smtp) delivers through SMTP_HOST.

Endpoints send after their database work has committed, via FastAPI
BackgroundTasks, so a slow or failing mail server never fails the request
(see send_email_safely). A durable outbox + dispatcher is the planned next
step (docs/NOTIFICATIONS.md).
"""

import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage as MimeMessage
from functools import lru_cache
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmailMessage:
    to: str
    subject: str
    body: str
    reply_to: str | None = None


class EmailSender(Protocol):
    def send(self, message: EmailMessage) -> None: ...


class LogEmailSender:
    def send(self, message: EmailMessage) -> None:
        logger.info(
            "Email not sent (EMAIL_BACKEND=log) — to=%s subject=%r\n%s",
            message.to,
            message.subject,
            message.body,
        )


class SmtpEmailSender:
    def send(self, message: EmailMessage) -> None:
        mime = MimeMessage()
        mime["From"] = settings.EMAIL_FROM
        mime["To"] = message.to
        mime["Subject"] = message.subject
        if message.reply_to:
            mime["Reply-To"] = message.reply_to
        mime.set_content(message.body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(mime)


@lru_cache
def get_email_sender() -> EmailSender:
    if settings.EMAIL_BACKEND == "smtp":
        if not settings.SMTP_HOST:
            raise RuntimeError("EMAIL_BACKEND=smtp requires SMTP_HOST.")
        return SmtpEmailSender()
    return LogEmailSender()


def send_email_safely(sender: EmailSender, message: EmailMessage) -> None:
    """Background-task entry point: log delivery failures, never raise."""
    try:
        sender.send(message)
    except Exception:
        logger.exception("Failed to send email to %s (%s)", message.to, message.subject)
