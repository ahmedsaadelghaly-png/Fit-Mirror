import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.schemas.saved_look import SavedLookCreate, SavedLookRead
from app.services.saved_look_service import SavedLookService

router = APIRouter()


def get_saved_look_service(db: Session = Depends(get_db)) -> SavedLookService:
    return SavedLookService(db)


@router.get("", response_model=list[SavedLookRead])
def list_saved_looks(
    user_id: str = Depends(get_current_user_id),
    service: SavedLookService = Depends(get_saved_look_service),
):
    return service.list_looks(uuid.UUID(user_id))


@router.post("", response_model=SavedLookRead, status_code=201)
def save_look(
    payload: SavedLookCreate,
    user_id: str = Depends(get_current_user_id),
    service: SavedLookService = Depends(get_saved_look_service),
):
    """Bookmarks one of the caller's own completed try-on jobs. 404 for
    someone else's job, 422 if it hasn't completed, 409 if already saved."""
    return service.save(uuid.UUID(user_id), payload)


@router.delete("/{look_id}", status_code=204)
def delete_saved_look(
    look_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    service: SavedLookService = Depends(get_saved_look_service),
):
    service.delete(uuid.UUID(user_id), look_id)
