"""
Shared FastAPI dependencies (dependency-injection wiring).

Keeping DI wiring in one place makes it trivial to swap implementations
(e.g. a different storage backend) without touching endpoint code.
"""

from collections.abc import Generator

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import TokenType, decode_token
from app.db.session import SessionLocal
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


def get_storage() -> ObjectStorage:
    """Returns the active object storage implementation.

    Swap this factory to change storage backends (e.g. GCS, Azure Blob)
    without touching any service or endpoint code.
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
