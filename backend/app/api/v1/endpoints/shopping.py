"""
Shopping Assistant endpoints.

Phase 1 scope: route contracts only. Real conversational/search logic
(NL product search, cart building, recommendations) lands in a later phase.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import get_current_user_id

router = APIRouter()


class ShoppingQueryRequest(BaseModel):
    query: str


class ShoppingQueryResponse(BaseModel):
    matched_product_ids: list[uuid.UUID]
    reply: str


@router.post("/ask", response_model=ShoppingQueryResponse, status_code=501)
def ask_shopping_assistant(
    payload: ShoppingQueryRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Not implemented in Phase 1 — contract reserved for the Shopping Assistant."""
    raise HTTPException(
        status_code=501, detail="Shopping Assistant is scheduled for a later phase."
    )
