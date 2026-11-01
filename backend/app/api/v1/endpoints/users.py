import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_id, get_db
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import ChangePasswordRequest, TokenResponse
from app.schemas.user import (
    BodyProfileCreate,
    BodyProfileRead,
    BodyProfileUpsert,
    UserRead,
    UserUpdate,
)
from app.services.auth_service import AuthService
from app.services.body_profile_service import BodyProfileService

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFoundError("User not found.")
    return user


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Profile details the user can edit themselves (today: their name)."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/password", response_model=TokenResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """422 if `current_password` is wrong. Returns fresh tokens for this
    session; every other session ends at its next token refresh."""
    return AuthService(UserRepository(db)).change_password(
        user, payload.current_password, payload.new_password
    )


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
