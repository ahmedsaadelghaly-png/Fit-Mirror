import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.schemas.wardrobe import WardrobeItemCreate, WardrobeItemRead
from app.services.wardrobe_service import WardrobeService

router = APIRouter()


def get_wardrobe_service(db: Session = Depends(get_db)) -> WardrobeService:
    return WardrobeService(db)


@router.post("", response_model=WardrobeItemRead, status_code=201)
def add_wardrobe_item(
    payload: WardrobeItemCreate,
    user_id: str = Depends(get_current_user_id),
    service: WardrobeService = Depends(get_wardrobe_service),
):
    return service.add_item(uuid.UUID(user_id), payload)


@router.get("", response_model=list[WardrobeItemRead])
def list_wardrobe_items(
    user_id: str = Depends(get_current_user_id),
    service: WardrobeService = Depends(get_wardrobe_service),
):
    return service.list_items(uuid.UUID(user_id))


@router.delete("/{item_id}", status_code=204)
def delete_wardrobe_item(
    item_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    service: WardrobeService = Depends(get_wardrobe_service),
):
    service.delete_item(uuid.UUID(user_id), item_id)
