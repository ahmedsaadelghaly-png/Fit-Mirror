"""
Who may read which storage object.

Keys alone prove nothing: everything anyone uploads lands under
`user-photos/<uploader>/`, including brand catalog photos, and try-on
results have no owner in their key at all. So a key is readable when:

- the caller uploaded it (their id is the key's second segment);
- it is demo data (`seed-data/`);
- it is published on the catalog (product, variant or store logo); or
- it appears on one of the caller's own try-on jobs.

Platform admins can read everything (try-on job monitoring).

Every path that stores a client-supplied key checks it here first, so a
private photo can't be made readable by attaching it to a job, a wardrobe
item or a product.
"""

import uuid
from collections.abc import Iterable

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.product import Product, ProductVariant
from app.models.store import Store
from app.models.tryon_job import TryOnJob

PUBLIC_PREFIXES = ("seed-data/",)


def is_owned_by(object_key: str, user_id: uuid.UUID | str) -> bool:
    return object_key.split("/")[1:2] == [str(user_id)]


class StorageAccess:
    def __init__(self, db: Session):
        self.db = db

    def readable_keys(
        self, user_id: uuid.UUID, object_keys: Iterable[str], *, is_admin: bool = False
    ) -> set[str]:
        keys = set(object_keys)
        if is_admin:
            return keys

        readable = {
            key for key in keys if key.startswith(PUBLIC_PREFIXES) or is_owned_by(key, user_id)
        }
        remaining = keys - readable
        if remaining:
            readable |= self._published(remaining)
            remaining -= readable
        if remaining:
            readable |= self._on_own_jobs(user_id, remaining)
        return readable

    def can_read(self, user_id: uuid.UUID, object_key: str, *, is_admin: bool = False) -> bool:
        return object_key in self.readable_keys(user_id, [object_key], is_admin=is_admin)

    def _published(self, keys: set[str]) -> set[str]:
        columns = (
            Product.primary_image_key,
            ProductVariant.garment_image_key,
            Store.logo_image_key,
        )
        found: set[str] = set()
        for column in columns:
            found.update(row[0] for row in self.db.query(column).filter(column.in_(keys)).all())
        return found

    def _on_own_jobs(self, user_id: uuid.UUID, keys: set[str]) -> set[str]:
        jobs = (
            self.db.query(
                TryOnJob.user_image_key, TryOnJob.garment_image_key, TryOnJob.result_image_key
            )
            .filter(
                TryOnJob.user_id == user_id,
                or_(
                    TryOnJob.user_image_key.in_(keys),
                    TryOnJob.garment_image_key.in_(keys),
                    TryOnJob.result_image_key.in_(keys),
                ),
            )
            .all()
        )
        return keys.intersection(key for job in jobs for key in job)
