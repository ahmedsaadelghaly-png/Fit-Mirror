import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.user import BodyProfileRead, BodyProfileUpsert, UserRead
from app.services.body_profile_service import BodyProfileService

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFoundError("User not found.")
    return user


@router.get("/me/body-profile", response_model=BodyProfileRead)
def get_body_profile(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    profile = BodyProfileService(db).get(uuid.UUID(user_id))
    if not profile:
        raise NotFoundError("Body profile not set yet.")
    return profile


@router.put("/me/body-profile", response_model=BodyProfileRead)
def upsert_body_profile(
    payload: BodyProfileUpsert,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Partial upsert. `body_shape` must belong to `body_category` (see
    BODY_SHAPES_BY_CATEGORY); changing only the category clears a shape
    that no longer applies."""
    return BodyProfileService(db).upsert(uuid.UUID(user_id), payload)
