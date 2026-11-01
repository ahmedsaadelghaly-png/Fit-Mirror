"""
Body profile updates, including the category/shape rules: a body shape is
only meaningful within its category (a "pear" women's shape, a "husky"
boys' fit), so shape and category are validated together after merging
the partial update onto the stored profile.
"""

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ValidationAppError
from app.models.user import BODY_SHAPES_BY_CATEGORY, BodyProfile
from app.schemas.user import BodyProfileUpsert


class BodyProfileService:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: uuid.UUID) -> BodyProfile | None:
        return self.db.query(BodyProfile).filter(BodyProfile.user_id == user_id).first()

    def upsert(self, user_id: uuid.UUID, payload: BodyProfileUpsert) -> BodyProfile:
        profile = self.get(user_id)
        if not profile:
            profile = BodyProfile(user_id=user_id)
            self.db.add(profile)

        changes = payload.model_dump(exclude_unset=True)
        category_changed = "body_category" in changes and (
            changes["body_category"] != profile.body_category
        )
        reference_key = changes.get("reference_image_key")
        if reference_key and reference_key.split("/")[1:2] != [str(user_id)]:
            # Object keys are namespaced by uploader (docs/STORAGE.md).
            self.db.rollback()
            raise ValidationAppError("Upload the reference photo from this account first.")
        for field in ("favorite_colors", "style_preferences"):
            if field in changes and changes[field] is None:
                changes[field] = []
        for field, value in changes.items():
            setattr(profile, field, value)

        category = profile.body_category
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
