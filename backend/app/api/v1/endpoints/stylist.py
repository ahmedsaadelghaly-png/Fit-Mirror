"""
AI Stylist endpoints.

Phase 1 scope: route contracts only, so the frontend and mobile teams can
build against a stable API surface. Real recommendation logic (outfit
generation from wardrobe + occasion + weather) is implemented in Phase 3.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import get_current_user_id

router = APIRouter()


class OutfitSuggestionRequest(BaseModel):
    occasion: str | None = None
    weather: str | None = None


class OutfitSuggestionResponse(BaseModel):
    suggestion_id: uuid.UUID
    wardrobe_item_ids: list[uuid.UUID]
    rationale: str


@router.post("/suggestions", response_model=OutfitSuggestionResponse, status_code=501)
def get_outfit_suggestion(
    payload: OutfitSuggestionRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Not implemented in Phase 1 — contract reserved for the AI Stylist service."""
    raise HTTPException(status_code=501, detail="AI Stylist is scheduled for a later phase.")
