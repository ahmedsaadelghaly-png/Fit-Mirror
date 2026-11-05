"""
Security utilities: password hashing and JWT token creation/verification.
"""

from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedError


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain_password.encode(), salt).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except ValueError:  # not a bcrypt hash
        return False


def create_token(
    subject: str, token_type: TokenType, extra_claims: dict[str, Any] | None = None
) -> str:
    now = datetime.now(UTC)
    expires_delta = (
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        if token_type == TokenType.ACCESS
        else timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": subject,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise UnauthorizedError("Invalid or expired token.") from exc

    if payload.get("type") != expected_type.value:
        raise UnauthorizedError("Invalid token type.")

    return payload
