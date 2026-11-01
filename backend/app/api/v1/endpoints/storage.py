"""
Storage endpoints shared by every app surface.

POST /storage/download-urls resolves many object keys in one request, so
an image grid (wardrobe, try-on history, catalog) costs one round trip
instead of one per image. Same trust model as GET /tryon/download-url: a
caller resolves keys it already received from its own scoped responses
(docs/STORAGE.md "Planned hardening").
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, StringConstraints

from app.core.dependencies import get_current_user_id, get_storage
from app.services.storage_service import StorageService
from app.storage.base import ObjectStorage

router = APIRouter()

MAX_KEYS_PER_REQUEST = 100

ObjectKey = Annotated[str, StringConstraints(min_length=1, max_length=512)]


class DownloadUrlsRequest(BaseModel):
    object_keys: list[ObjectKey] = Field(min_length=1, max_length=MAX_KEYS_PER_REQUEST)


class DownloadUrlsResponse(BaseModel):
    # One entry per distinct requested key.
    download_urls: dict[str, str]


@router.post("/download-urls", response_model=DownloadUrlsResponse)
def create_download_urls(
    payload: DownloadUrlsRequest,
    user_id: str = Depends(get_current_user_id),
    storage: ObjectStorage = Depends(get_storage),
):
    service = StorageService(storage)
    return DownloadUrlsResponse(
        download_urls={
            key: service.get_download_url(key) for key in dict.fromkeys(payload.object_keys)
        }
    )
