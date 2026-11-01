"""
Size Recommendation endpoints.

Backed by the rule-based SizingService (BodyProfile measurements matched
against a standard size chart, restricted to the product's stocked sizes).
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.services.sizing_service import SizingService

router = APIRouter()


class SizeRecommendationRequest(BaseModel):
    product_id: uuid.UUID
    # Whose size: one of the caller's family profiles. Defaults to their own.
    body_profile_id: uuid.UUID | None = None


class SizeRecommendationResponse(BaseModel):
    product_id: uuid.UUID
    recommended_size_label: str
    confidence: float
    fit_note: str
    body_profile_id: uuid.UUID | None
    profile_name: str | None


@router.post("/recommend", response_model=SizeRecommendationResponse)
def recommend_size(
    payload: SizeRecommendationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    result = SizingService(db).recommend(
        uuid.UUID(user_id), payload.product_id, payload.body_profile_id
    )
    return SizeRecommendationResponse(
        product_id=result.product_id,
        recommended_size_label=result.recommended_size_label,
        confidence=result.confidence,
        fit_note=result.fit_note,
        body_profile_id=result.body_profile_id,
        profile_name=result.profile_name,
    )
