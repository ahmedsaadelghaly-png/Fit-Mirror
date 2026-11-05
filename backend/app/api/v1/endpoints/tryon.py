import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_id, get_db, get_storage
from app.core.exceptions import NotFoundError
from app.models.user import User, UserRole
from app.repositories.tryon_repository import TryOnJobRepository
from app.schemas.tryon import TryOnJobAccepted, TryOnJobCreate, TryOnJobRead
from app.services.storage_access import StorageAccess
from app.services.storage_service import StorageService
from app.services.tryon_service import TryOnService
from app.storage.base import ObjectStorage

router = APIRouter()


def get_tryon_service(db: Session = Depends(get_db)) -> TryOnService:
    return TryOnService(TryOnJobRepository(db))


@router.post("/upload-url")
def create_upload_url(
    filename: str,
    content_type: str,
    user_id: str = Depends(get_current_user_id),
    storage: ObjectStorage = Depends(get_storage),
):
    """Returns a pre-signed URL the client uploads their photo to directly,
    before creating a try-on job with the resulting object key."""
    service = StorageService(storage)
    return service.create_upload_target(
        namespace="user-photos", owner_id=user_id, filename=filename, content_type=content_type
    )


@router.get("/download-url")
def create_download_url(
    object_key: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: ObjectStorage = Depends(get_storage),
):
    """Resolves any storage object key to a downloadable URL — the read-side
    counterpart to create_upload_url above (see docs/STORAGE.md "Upload flow").
    Every read API (wardrobe items, try-on jobs, body profile, products)
    returns opaque object keys, never a loadable URL; the frontend calls
    this once per key to render an actual <img>. Registered before
    get_tryon_job below — both are GET on this router, and a literal path
    must be matched before a dynamic `/{job_id}` one.

    404 unless the caller may read the key (see storage_access.py); 404
    rather than 403, so it can't be used to test whether a key exists.
    """
    is_admin = user.role == UserRole.PLATFORM_ADMIN
    if not StorageAccess(db).can_read(user.id, object_key, is_admin=is_admin):
        raise NotFoundError("File not found.")
    service = StorageService(storage)
    return {"download_url": service.get_download_url(object_key)}


@router.post("", response_model=TryOnJobAccepted, status_code=202)
def create_tryon_job(
    payload: TryOnJobCreate,
    user_id: str = Depends(get_current_user_id),
    service: TryOnService = Depends(get_tryon_service),
):
    """Creates a try-on job and enqueues it for async AI processing.
    Always responds immediately with status=PENDING — never blocks on AI inference."""
    job = service.create_job(uuid.UUID(user_id), payload)
    return TryOnJobAccepted(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=TryOnJobRead)
def get_tryon_job(
    job_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    service: TryOnService = Depends(get_tryon_service),
):
    """Poll this endpoint (or subscribe via websocket in a later phase) for job status."""
    return service.get_job(uuid.UUID(user_id), job_id)


@router.get("", response_model=list[TryOnJobRead])
def list_tryon_jobs(
    user_id: str = Depends(get_current_user_id),
    service: TryOnService = Depends(get_tryon_service),
):
    return service.list_jobs(uuid.UUID(user_id))
