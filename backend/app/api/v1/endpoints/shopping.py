"""
Shopping Assistant endpoints.

Backed by the rule-based ShoppingService (natural-language query parsed
into catalog filters + ranked text search). Matched products can be
fetched with GET /catalog/products?ids=...
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.services.shopping_service import ShoppingService

router = APIRouter()


class ShoppingQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ShoppingQueryResponse(BaseModel):
    matched_product_ids: list[uuid.UUID]
    reply: str


@router.post("/ask", response_model=ShoppingQueryResponse)
def ask_shopping_assistant(
    payload: ShoppingQueryRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    answer = ShoppingService(db).ask(payload.query)
    return ShoppingQueryResponse(matched_product_ids=answer.matched_product_ids, reply=answer.reply)
