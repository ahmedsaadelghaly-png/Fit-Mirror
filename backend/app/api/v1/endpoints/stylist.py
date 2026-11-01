"""
AI Stylist endpoints.

Backed by StylistService: outfits assembled from the caller's wardrobe,
steered by occasion, weather, favorite colors, and a taste/pairing model
learned from the shopper's likes and dislikes (POST .../feedback).
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.services.stylist_service import StylistService

router = APIRouter()


class OutfitSuggestionRequest(BaseModel):
    occasion: str | None = Field(default=None, max_length=200)
    weather: str | None = Field(default=None, max_length=200)


class OutfitSuggestionResponse(BaseModel):
    suggestion_id: uuid.UUID
    wardrobe_item_ids: list[uuid.UUID]
    rationale: str


class OutfitFeedbackRequest(BaseModel):
    liked: bool


@router.post("/suggestions/{suggestion_id}/feedback", status_code=204)
def give_outfit_feedback(
    suggestion_id: uuid.UUID,
    payload: OutfitFeedbackRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Like or dislike a suggestion (sending again replaces it). Shapes
    later suggestions; 404 for someone else's suggestion."""
    StylistService(db).record_feedback(uuid.UUID(user_id), suggestion_id, payload.liked)


@router.post("/suggestions", response_model=OutfitSuggestionResponse)
def get_outfit_suggestion(
    payload: OutfitSuggestionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    suggestion = StylistService(db).suggest(uuid.UUID(user_id), payload.occasion, payload.weather)
    return OutfitSuggestionResponse(
        suggestion_id=suggestion.suggestion_id,
        wardrobe_item_ids=suggestion.wardrobe_item_ids,
        rationale=suggestion.rationale,
    )
