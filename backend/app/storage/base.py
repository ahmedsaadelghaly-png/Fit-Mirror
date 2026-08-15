"""
Object storage abstraction.

The rest of the application depends only on this interface, never on a
concrete provider. This is what makes storage swappable (S3, GCS, Azure Blob,
local disk for tests) without touching services or endpoints.
"""

from abc import ABC, abstractmethod
from datetime import timedelta


class ObjectStorage(ABC):
    @abstractmethod
    def generate_upload_url(self, object_key: str, content_type: str, expires_in: timedelta) -> str:
        """Returns a pre-signed URL the client can PUT a file to directly."""
        raise NotImplementedError

    @abstractmethod
    def generate_download_url(self, object_key: str, expires_in: timedelta) -> str:
        """Returns a pre-signed (or public) URL to read/download an object."""
        raise NotImplementedError

    @abstractmethod
    def object_exists(self, object_key: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def delete_object(self, object_key: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def build_object_key(self, *, namespace: str, owner_id: str, filename: str) -> str:
        """Builds a consistent, collision-resistant storage key."""
        raise NotImplementedError
