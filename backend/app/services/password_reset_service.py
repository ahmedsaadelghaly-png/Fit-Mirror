"""
Password reset: an emailed single-use link, valid for
PASSWORD_RESET_EXPIRE_MINUTES. Only the token's SHA-256 is stored. Asking
for a new link invalidates older unused ones, and a completed reset sets
users.password_changed_at, which makes every earlier refresh token invalid
(other sessions end at their next token refresh).
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ValidationAppError
from app.core.security import hash_password
from app.models.account_support import PasswordResetToken
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailMessage

INVALID_LINK_MESSAGE = "This reset link is invalid or has expired. Request a new one."


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class PasswordResetService:
    def __init__(self, db: Session):
        self.db = db

    def request_reset(self, email: str) -> EmailMessage | None:
        """The reset email to send, or None when there's no active account
        (callers answer the same either way, so emails can't be probed)."""
        user = UserRepository(self.db).get_by_email(email)
        if not user or not user.is_active:
            return None

        now = datetime.now(UTC)
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
        ).update({PasswordResetToken.used_at: now})
        token = secrets.token_urlsafe(32)
        self.db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=_hash(token),
                expires_at=now + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
            )
        )
        self.db.commit()

        link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={token}"
        return EmailMessage(
            to=user.email,
            subject="Reset your FitMirror password",
            body=(
                f"Hi {user.full_name or 'there'},\n\n"
                "We received a request to reset your FitMirror password. Use this link "
                f"within {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes:\n\n{link}\n\n"
                "If you didn't ask for this, you can ignore this email — your password "
                "won't change.\n\n— FitMirror AI"
            ),
        )

    def reset(self, token: str, new_password: str) -> None:
        record = (
            self.db.query(PasswordResetToken)
            .filter(PasswordResetToken.token_hash == _hash(token))
            .first()
        )
        now = datetime.now(UTC)
        if (
            not record
            or record.used_at is not None
            or _as_utc(record.expires_at) <= now
            or not record.user.is_active
        ):
            raise ValidationAppError(INVALID_LINK_MESSAGE)

        record.user.hashed_password = hash_password(new_password)
        record.user.password_changed_at = now
        record.used_at = now
        self.db.commit()


def _as_utc(value: datetime) -> datetime:
    # SQLite (unit tests) returns naive datetimes; Postgres returns aware ones.
    return value if value.tzinfo else value.replace(tzinfo=UTC)
