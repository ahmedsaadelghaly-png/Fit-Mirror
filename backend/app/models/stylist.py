"""
AI Stylist history: every outfit suggested to a shopper, and their
reaction to it (liked / disliked). The reactions train that shopper's
taste and item-pairing model (StylistService).
"""

import uuid

from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OutfitSuggestionRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "outfit_suggestions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Wardrobe item ids (as strings) and, in the same order, each item's text
    # at suggestion time — so taste keeps learning from an outfit even after
    # its items are deleted from the wardrobe.
    item_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    item_texts: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    occasion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    weather: Mapped[str | None] = mapped_column(String(200), nullable=True)
    liked: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
