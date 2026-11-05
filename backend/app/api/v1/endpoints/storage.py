"""
Storage endpoints shared by every app surface.

POST /storage/download-urls resolves many object keys in one request, so
an image grid (wardrobe, try-on history, catalog) costs one round trip
instead of one per image. Same rules as GET /tryon/download-url
(storage_access.py): a key the caller may not read is left out of the
response, so one stale key doesn't blank a whole grid.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, get_storage
from app.models.user import User, UserRole
from app.services.storage_access import StorageAccess
from app.services.storage_service import StorageService
from app.storage.base import ObjectStorage

router = APIRouter()

MAX_KEYS_PER_REQUEST = 100

ObjectKey = Annotated[str, StringConstraints(min_length=1, max_length=512)]


class DownloadUrlsRequest(BaseModel):
    object_keys: list[ObjectKey] = Field(min_length=1, max_length=MAX_KEYS_PER_REQUEST)


class DownloadUrlsResponse(BaseModel):
    # One entry per distinct requested key the caller may read.
    download_urls: dict[str, str]


@router.post("/download-urls", response_model=DownloadUrlsResponse)
def create_download_urls(
    payload: DownloadUrlsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: ObjectStorage = Depends(get_storage),
):
    service = StorageService(storage)
    readable = StorageAccess(db).readable_keys(
        user.id, payload.object_keys, is_admin=user.role == UserRole.PLATFORM_ADMIN
    )
    return DownloadUrlsResponse(
        download_urls={key: service.get_download_url(key) for key in readable}
    )
