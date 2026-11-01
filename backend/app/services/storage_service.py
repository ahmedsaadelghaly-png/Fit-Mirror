"""
Storage service: thin domain layer over ObjectStorage that applies
platform-specific rules (namespacing, expiry policy) uniformly.
"""

from datetime import timedelta

from app.core.exceptions import ValidationAppError
from app.storage.base import ObjectStorage

UPLOAD_URL_EXPIRY = timedelta(minutes=15)
DOWNLOAD_URL_EXPIRY = timedelta(hours=1)

# Every upload on the platform is a photo (user photos, garments, logos).
# The presigned PUT is bound to this content type, so allowing anything
# else would let a client store e.g. text/html on the bucket's origin.
ALLOWED_UPLOAD_CONTENT_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})


class StorageService:
    def __init__(self, storage: ObjectStorage):
        self.storage = storage

    def create_upload_target(
        self, *, namespace: str, owner_id: str, filename: str, content_type: str
    ) -> dict:
        if content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
            raise ValidationAppError(
                f"Unsupported file type '{content_type}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_UPLOAD_CONTENT_TYPES))}."
            )
        object_key = self.storage.build_object_key(
            namespace=namespace, owner_id=owner_id, filename=filename
        )
        upload_url = self.storage.generate_upload_url(object_key, content_type, UPLOAD_URL_EXPIRY)
        return {
            "object_key": object_key,
            "upload_url": upload_url,
            "expires_in_seconds": int(UPLOAD_URL_EXPIRY.total_seconds()),
        }

    def get_download_url(self, object_key: str) -> str:
        return self.storage.generate_download_url(object_key, DOWNLOAD_URL_EXPIRY)
