"""
Unit tests for the ObjectStorage abstraction.

Exercises the interface contract with a lightweight in-memory fake, and
verifies S3ObjectStorage's key-building logic (the one piece of behavior
that doesn't require a live S3/MinIO connection to test).
"""

from datetime import timedelta

import pytest

from app.storage.base import ObjectStorage

pytestmark = pytest.mark.unit


class InMemoryObjectStorage(ObjectStorage):
    """Fake ObjectStorage used to prove StorageService/consumers only
    depend on the interface, never a concrete provider."""

    def __init__(self):
        self._objects: dict[str, bytes] = {}

    def generate_upload_url(self, object_key: str, content_type: str, expires_in: timedelta) -> str:
        return f"https://fake-upload/{object_key}?expires={int(expires_in.total_seconds())}"

    def generate_download_url(self, object_key: str, expires_in: timedelta) -> str:
        return f"https://fake-download/{object_key}"

    def object_exists(self, object_key: str) -> bool:
        return object_key in self._objects

    def delete_object(self, object_key: str) -> None:
        self._objects.pop(object_key, None)

    def build_object_key(self, *, namespace: str, owner_id: str, filename: str) -> str:
        return f"{namespace}/{owner_id}/{filename}"


def test_storage_service_uses_only_the_interface():
    from app.services.storage_service import StorageService

    storage = InMemoryObjectStorage()
    service = StorageService(storage)

    target = service.create_upload_target(
        namespace="user-photos", owner_id="user-1", filename="photo.jpg", content_type="image/jpeg"
    )

    assert target["object_key"] == "user-photos/user-1/photo.jpg"
    assert target["upload_url"].startswith("https://fake-upload/")
    assert target["expires_in_seconds"] > 0


def test_storage_service_resolves_a_download_url():
    from app.services.storage_service import StorageService

    storage = InMemoryObjectStorage()
    service = StorageService(storage)

    url = service.get_download_url("user-photos/user-1/photo.jpg")

    assert url == "https://fake-download/user-photos/user-1/photo.jpg"


def test_object_exists_reflects_stored_objects():
    storage = InMemoryObjectStorage()
    assert storage.object_exists("missing-key") is False

    storage._objects["present-key"] = b"data"
    assert storage.object_exists("present-key") is True

    storage.delete_object("present-key")
    assert storage.object_exists("present-key") is False


def test_s3_storage_builds_namespaced_collision_resistant_keys():
    from app.storage.s3_storage import S3ObjectStorage

    # __init__ would try to construct a real boto3 client; we only need the
    # pure key-building method, which has no I/O, so we call it unbound.
    key_a = S3ObjectStorage.build_object_key(
        None, namespace="user-photos", owner_id="user-1", filename="my photo.jpg"
    )
    key_b = S3ObjectStorage.build_object_key(
        None, namespace="user-photos", owner_id="user-1", filename="my photo.jpg"
    )

    assert key_a.startswith("user-photos/user-1/")
    assert key_a.endswith("_my_photo.jpg")
    assert key_a != key_b  # collision-resistant: unique suffix per call
