"""
Size Recommendation endpoints.

Phase 1 scope: route contracts only. Real logic will combine the user's
BodyProfile with per-brand size charts (Phase 4).
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import get_current_user_id

router = APIRouter()


class SizeRecommendationRequest(BaseModel):
    product_id: uuid.UUID


class SizeRecommendationResponse(BaseModel):
    product_id: uuid.UUID
    recommended_size_label: str
    confidence: float


@router.post("/recommend", response_model=SizeRecommendationResponse, status_code=501)
def recommend_size(
    payload: SizeRecommendationRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Not implemented in Phase 1 — contract reserved for the Size Recommendation engine."""
    raise HTTPException(
        status_code=501, detail="Size Recommendation is scheduled for a later phase."
    )
