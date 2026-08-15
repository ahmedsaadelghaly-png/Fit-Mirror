import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.wardrobe import WardrobeItem
from app.schemas.wardrobe import WardrobeItemCreate


class WardrobeService:
    def __init__(self, db: Session):
        self.db = db

    def add_item(self, user_id: uuid.UUID, payload: WardrobeItemCreate) -> WardrobeItem:
        item = WardrobeItem(user_id=user_id, **payload.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_items(self, user_id: uuid.UUID) -> list[WardrobeItem]:
        return self.db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).all()

    def delete_item(self, user_id: uuid.UUID, item_id: uuid.UUID) -> None:
        item = (
            self.db.query(WardrobeItem)
            .filter(WardrobeItem.id == item_id, WardrobeItem.user_id == user_id)
            .first()
        )
        if not item:
            raise NotFoundError("Wardrobe item not found.")
        self.db.delete(item)
        self.db.commit()
