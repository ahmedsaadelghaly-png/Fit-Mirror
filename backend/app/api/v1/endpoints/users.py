import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.core.exceptions import NotFoundError
from app.models.user import BodyProfile, User
from app.schemas.user import BodyProfileRead, BodyProfileUpsert, UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFoundError("User not found.")
    return user


@router.get("/me/body-profile", response_model=BodyProfileRead)
def get_body_profile(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    profile = db.query(BodyProfile).filter(BodyProfile.user_id == uuid.UUID(user_id)).first()
    if not profile:
        raise NotFoundError("Body profile not set yet.")
    return profile


@router.put("/me/body-profile", response_model=BodyProfileRead)
def upsert_body_profile(
    payload: BodyProfileUpsert,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    profile = db.query(BodyProfile).filter(BodyProfile.user_id == uuid.UUID(user_id)).first()
    if not profile:
        profile = BodyProfile(user_id=uuid.UUID(user_id))
        db.add(profile)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
