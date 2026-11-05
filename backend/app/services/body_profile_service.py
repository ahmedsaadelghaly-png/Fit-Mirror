"""
Body profiles, including family profiles: an account holds one primary
profile (the shopper's own) plus profiles for family members, e.g. each
child. Shape and category are validated together after merging a partial
update onto the stored profile: a body shape is only meaningful within its
category (a "pear" women's shape, a "husky" boys' fit).
"""

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.user import (
    BODY_SHAPES_BY_CATEGORY,
    KIDS_CATEGORIES,
    MAX_BODY_PROFILES_PER_USER,
    BodyProfile,
)
from app.schemas.user import BodyProfileCreate, BodyProfileUpsert


class BodyProfileService:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: uuid.UUID) -> BodyProfile | None:
        """The account's primary profile."""
        return (
            self.db.query(BodyProfile)
            .filter(BodyProfile.user_id == user_id, BodyProfile.is_primary)
            .first()
        )

    def list_profiles(self, user_id: uuid.UUID) -> list[BodyProfile]:
        return (
            self.db.query(BodyProfile)
            .filter(BodyProfile.user_id == user_id)
            .order_by(BodyProfile.is_primary.desc(), BodyProfile.created_at)
            .all()
        )

    def get_owned(self, user_id: uuid.UUID, profile_id: uuid.UUID) -> BodyProfile:
        profile = (
            self.db.query(BodyProfile)
            .filter(BodyProfile.id == profile_id, BodyProfile.user_id == user_id)
            .first()
        )
        if not profile:
            raise NotFoundError("Body profile not found.")
        return profile

    def resolve(self, user_id: uuid.UUID, profile_id: uuid.UUID | None) -> BodyProfile | None:
        """A chosen profile (must be the caller's), else the primary one."""
        return self.get_owned(user_id, profile_id) if profile_id else self.get(user_id)

    def upsert(self, user_id: uuid.UUID, payload: BodyProfileUpsert) -> BodyProfile:
        """Create-or-update the primary profile."""
        profile = self.get(user_id)
        if not profile:
            profile = BodyProfile(user_id=user_id, is_primary=True, name="Me")
            self.db.add(profile)
        return self._apply(profile, payload)

    def create(self, user_id: uuid.UUID, payload: BodyProfileCreate) -> BodyProfile:
        existing = self.list_profiles(user_id)
        if len(existing) >= MAX_BODY_PROFILES_PER_USER:
            raise ValidationAppError(
                f"An account can hold up to {MAX_BODY_PROFILES_PER_USER} body profiles."
            )
        # The first profile on an account is the shopper's own.
        profile = BodyProfile(user_id=user_id, is_primary=not existing)
        self.db.add(profile)
        return self._apply(profile, payload)

    def update(
        self, user_id: uuid.UUID, profile_id: uuid.UUID, payload: BodyProfileUpsert
    ) -> BodyProfile:
        return self._apply(self.get_owned(user_id, profile_id), payload)

    def delete(self, user_id: uuid.UUID, profile_id: uuid.UUID) -> None:
        profile = self.get_owned(user_id, profile_id)
        if profile.is_primary:
            raise ValidationAppError("Your own body profile can't be removed.")
        self.db.delete(profile)
        self.db.commit()

    def _apply(self, profile: BodyProfile, payload: BodyProfileUpsert) -> BodyProfile:
        changes = payload.model_dump(exclude_unset=True)
        if changes.get("name", "") is None:
            del changes["name"]  # a profile always has a name
        category_changed = "body_category" in changes and (
            changes["body_category"] != profile.body_category
        )
        reference_key = changes.get("reference_image_key")
        if reference_key and reference_key.split("/")[1:2] != [str(profile.user_id)]:
            # Object keys are namespaced by uploader (docs/STORAGE.md).
            self.db.rollback()
            raise ValidationAppError("Upload the reference photo from this account first.")
        for field in ("favorite_colors", "style_preferences"):
            if field in changes and changes[field] is None:
                changes[field] = []
        for field, value in changes.items():
            setattr(profile, field, value)

        category = profile.body_category
        if category in KIDS_CATEGORIES:
            if reference_key:
                self.db.rollback()
                raise ValidationAppError("Children's profiles can't hold a photo.")
            profile.reference_image_key = None
        if profile.body_shape:
            if category is None:
                self.db.rollback()
                raise ValidationAppError(
                    "Choose women, men, girls or boys before picking a body shape."
                )
            allowed = BODY_SHAPES_BY_CATEGORY[category]
            if profile.body_shape not in allowed:
                if category_changed and "body_shape" not in changes:
                    # Switching category drops a shape that no longer applies,
                    # rather than rejecting the whole update.
                    profile.body_shape = None
                else:
                    self.db.rollback()
                    raise ValidationAppError(
                        f"'{profile.body_shape}' isn't a {category.value} body shape. "
                        f"Choose one of: {', '.join(allowed)}."
                    )

        self.db.commit()
        self.db.refresh(profile)
        return profile
