"""
Shared FastAPI dependencies (dependency-injection wiring).

Keeping DI wiring in one place makes it trivial to swap implementations
(e.g. a different storage backend) without touching endpoint code.
"""

import uuid
from collections.abc import Callable, Generator
from functools import lru_cache

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import TokenType, decode_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.storage.base import ObjectStorage
from app.storage.s3_storage import S3ObjectStorage

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@lru_cache
def get_storage() -> ObjectStorage:
    """Returns the active object storage implementation.

    Swap this factory to change storage backends (e.g. GCS, Azure Blob)
    without touching any service or endpoint code.

    Cached as a process-wide singleton: constructing an S3ObjectStorage
    builds one or two boto3 clients (tens of milliseconds each), and the
    frontend calls GET /tryon/download-url once per rendered image. boto3
    clients are thread-safe, so sharing one across requests is safe.
    """
    return S3ObjectStorage()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """Decodes the access token and returns the authenticated user's ID.

    Does not touch the database — keeps auth cheap for every request.
    Endpoints needing the full user record should fetch it explicitly.
    """
    payload = decode_token(token, expected_type=TokenType.ACCESS)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Token missing subject claim.")
    return user_id


def get_current_user(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
) -> User:
    """Loads the authenticated user's row. Unlike get_current_user_id, this
    sees role changes and deactivations immediately rather than waiting for
    the access token to expire."""
    user = db.get(User, uuid.UUID(user_id))
    if not user or not user.is_active or user.deletion_requested_at:
        raise UnauthorizedError("Account not found or deactivated.")
    return user


def require_role(*allowed_roles: UserRole) -> Callable[..., User]:
    """Declarative role check — see docs/RBAC.md "Enforcement mechanism".

    Never a substitute for an ownership check: endpoints still scope their
    queries to the caller's own rows where the permission matrix says `own`.
    """

    def _dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise ForbiddenError("You do not have permission to perform this action.")
        return user

    return _dependency
