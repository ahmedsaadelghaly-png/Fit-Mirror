"""
Auth business logic. Depends only on the repository abstraction and
security helpers — no FastAPI or ORM session leakage into the API layer.
"""

import uuid
from datetime import UTC, datetime

from app.core.exceptions import ConflictError, UnauthorizedError, ValidationAppError
from app.core.security import TokenType, create_token, decode_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def register(
        self,
        email: str,
        password: str,
        full_name: str | None,
        role: UserRole = UserRole.SHOPPER,
    ) -> User:
        if self.user_repository.get_by_email(email):
            raise ConflictError("A user with this email already exists.")

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=True,
        )
        return self.user_repository.add(user)

    def authenticate(self, email: str, password: str) -> User:
        user = self.user_repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password.")
        if not user.is_active:
            raise UnauthorizedError("This account has been deactivated.")
        return user

    @staticmethod
    def issue_tokens(user: User) -> TokenResponse:
        access_token = create_token(str(user.id), TokenType.ACCESS, {"role": user.role.value})
        refresh_token = create_token(str(user.id), TokenType.REFRESH)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
        user = self.user_repository.get(uuid.UUID(payload["sub"]))
        if not user or not user.is_active:
            raise UnauthorizedError("Invalid refresh token.")
        if _issued_before_password_change(payload, user):
            raise UnauthorizedError("Your password was changed. Please log in again.")
        return self.issue_tokens(user)

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> TokenResponse:
        """Signs out other sessions (their refresh tokens predate the change)
        and returns fresh tokens so this one carries on."""
        if not verify_password(current_password, user.hashed_password):
            raise ValidationAppError("Your current password is incorrect.")
        user.hashed_password = hash_password(new_password)
        user.password_changed_at = datetime.now(UTC)
        self.user_repository.update(user)
        return self.issue_tokens(user)


def _issued_before_password_change(payload: dict, user: User) -> bool:
    changed_at = user.password_changed_at
    if changed_at is None:
        return False
    if changed_at.tzinfo is None:  # SQLite (tests) returns naive datetimes
        changed_at = changed_at.replace(tzinfo=UTC)
    # `iat` has whole-second precision; tokens from the same second stay valid.
    return int(payload.get("iat", 0)) < int(changed_at.timestamp())
