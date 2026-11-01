"""
AI Stylist endpoints.

Backed by the rule-based StylistService (outfit assembly from the caller's
wardrobe + occasion + weather). The contract is unchanged from the Phase 1
reservation, so a model-backed stylist can replace the service later.
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
