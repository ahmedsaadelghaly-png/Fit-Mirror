import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.user import BodyProfileCreate, BodyProfileRead, BodyProfileUpsert, UserRead
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


# --- Family profiles ---------------------------------------------------------
# One account, several body profiles (the shopper plus e.g. each child).
# The primary profile is the one /me/body-profile above reads and writes.


@router.get("/me/body-profiles", response_model=list[BodyProfileRead])
def list_body_profiles(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Primary profile first, then family members in the order added."""
    return BodyProfileService(db).list_profiles(uuid.UUID(user_id))


@router.post("/me/body-profiles", response_model=BodyProfileRead, status_code=201)
def create_body_profile(
    payload: BodyProfileCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return BodyProfileService(db).create(uuid.UUID(user_id), payload)


@router.get("/me/body-profiles/{profile_id}", response_model=BodyProfileRead)
def get_family_body_profile(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return BodyProfileService(db).get_owned(uuid.UUID(user_id), profile_id)


@router.put("/me/body-profiles/{profile_id}", response_model=BodyProfileRead)
def update_family_body_profile(
    profile_id: uuid.UUID,
    payload: BodyProfileUpsert,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return BodyProfileService(db).update(uuid.UUID(user_id), profile_id, payload)


@router.delete("/me/body-profiles/{profile_id}", status_code=204)
def delete_family_body_profile(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """The primary profile can't be deleted (422)."""
    BodyProfileService(db).delete(uuid.UUID(user_id), profile_id)
