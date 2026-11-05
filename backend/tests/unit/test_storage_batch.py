"""POST /storage/download-urls — many object keys, one request."""

import pytest

from app.core.dependencies import get_storage
from app.main import app


class FakeStorage:
    def __init__(self):
        self.calls: list[str] = []

    def generate_download_url(self, object_key, expires_in):
        self.calls.append(object_key)
        return f"https://bucket.test/{object_key}?sig=1"


@pytest.fixture
def storage():
    fake = FakeStorage()
    app.dependency_overrides[get_storage] = lambda: fake
    yield fake
    app.dependency_overrides.pop(get_storage, None)


def test_resolves_each_distinct_key_once(api, make_user, auth_headers, storage):
    r = api.post(
        "/api/v1/storage/download-urls",
        json={"object_keys": ["seed-data/1.jpg", "seed-data/2.jpg", "seed-data/1.jpg"]},
        headers=auth_headers(make_user()),
    )
    assert r.status_code == 200, r.text
    assert r.json()["download_urls"] == {
        "seed-data/1.jpg": "https://bucket.test/seed-data/1.jpg?sig=1",
        "seed-data/2.jpg": "https://bucket.test/seed-data/2.jpg?sig=1",
    }
    assert sorted(storage.calls) == ["seed-data/1.jpg", "seed-data/2.jpg"]


@pytest.mark.parametrize("keys", [[], [f"k/{i}.jpg" for i in range(101)], [""]])
def test_rejects_empty_or_oversized_batches(api, make_user, auth_headers, storage, keys):
    r = api.post(
        "/api/v1/storage/download-urls",
        json={"object_keys": keys},
        headers=auth_headers(make_user()),
    )
    assert r.status_code == 422


def test_requires_auth(api, storage):
    r = api.post("/api/v1/storage/download-urls", json={"object_keys": ["a.jpg"]})
    assert r.status_code == 401
