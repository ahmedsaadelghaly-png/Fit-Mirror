"""File access rules, account deletion, data retention, children's photos."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from sqlalchemy import text

from app.core.dependencies import get_storage
from app.core.security import hash_password
from app.main import app
from app.models.product import ProductAudience
from app.models.saved_look import SavedLook
from app.models.store import Store
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import BodyProfile, User, UserRole
from app.services.data_retention_service import DataRetentionService
from app.workers.tasks.tryon_tasks import GENERATION_FAILED

TRYON = "/api/v1/tryon"
BATCH = "/api/v1/storage/download-urls"
PASSWORD = "CorrectHorse1!"


class FakeStorage:
    def __init__(self):
        self.deleted: list[str] = []
        self.deleted_prefixes: list[str] = []
        self.fail_on: set[str] = set()

    def generate_download_url(self, object_key, expires_in):
        return f"https://cdn.test/{object_key}"

    def delete_object(self, object_key):
        if object_key in self.fail_on:
            raise RuntimeError("storage down")
        self.deleted.append(object_key)

    def delete_prefix(self, prefix):
        self.deleted_prefixes.append(prefix)


@pytest.fixture
def storage():
    fake = FakeStorage()
    app.dependency_overrides[get_storage] = lambda: fake
    yield fake
    app.dependency_overrides.pop(get_storage, None)


def _job(db, user, *, days_old=0, status=TryOnJobStatus.COMPLETED, **keys):
    job = TryOnJob(
        user_id=user.id,
        user_image_key=keys.get("photo", f"user-photos/{user.id}/{uuid.uuid4().hex}.jpg"),
        garment_image_key=keys.get("garment", "seed-data/products/tee.jpg"),
        result_image_key=keys.get("result", f"tryon-results/{uuid.uuid4().hex}.png"),
        status=status,
        created_at=datetime.now(UTC) - timedelta(days=days_old),
    )
    db.add(job)
    db.commit()
    return job


def _readable(api, headers, *keys):
    r = api.post(BATCH, json={"object_keys": list(keys)}, headers=headers)
    assert r.status_code == 200, r.text
    return set(r.json()["download_urls"])


# --- File access -------------------------------------------------------------


def test_cannot_read_another_users_photo(api, make_user, auth_headers, storage):
    owner, other = make_user(), make_user()
    key = f"user-photos/{owner.id}/abc_me.jpg"

    assert _readable(api, auth_headers(owner), key) == {key}
    assert _readable(api, auth_headers(other), key) == set()

    r = api.get(f"{TRYON}/download-url", params={"object_key": key}, headers=auth_headers(other))
    assert r.status_code == 404


def test_try_on_results_are_private_to_the_job_owner(db, api, make_user, auth_headers, storage):
    owner, other = make_user(), make_user()
    key = _job(db, owner).result_image_key

    assert _readable(api, auth_headers(owner), key) == {key}
    assert _readable(api, auth_headers(other), key) == set()


def test_catalog_images_are_readable_by_everyone(
    db, api, make_user, make_store, make_product, auth_headers, storage
):
    brand = make_user(UserRole.BRAND_ADMIN)
    product = make_product(make_store(brand))
    key = f"user-photos/{brand.id}/abc_tee.jpg"
    product.primary_image_key = key
    db.commit()

    assert _readable(api, auth_headers(make_user()), key, "seed-data/products/a.jpg") == {
        key,
        "seed-data/products/a.jpg",
    }


def test_platform_admin_can_read_job_images(api, make_user, auth_headers, storage):
    key = f"user-photos/{make_user().id}/abc_me.jpg"
    assert _readable(api, auth_headers(make_user(UserRole.PLATFORM_ADMIN)), key) == {key}


def test_batch_returns_the_readable_keys_and_drops_the_rest(api, make_user, auth_headers, storage):
    me, other = make_user(), make_user()
    mine, theirs = f"user-photos/{me.id}/a.jpg", f"user-photos/{other.id}/b.jpg"
    assert _readable(api, auth_headers(me), mine, theirs) == {mine}


def test_try_on_rejects_someone_elses_photo(api, make_user, auth_headers):
    me, other = make_user(), make_user()
    with patch("app.services.tryon_service.process_tryon_job") as task:
        r = api.post(
            TRYON,
            json={
                "user_image_key": f"user-photos/{other.id}/a.jpg",
                "garment_image_key": "seed-data/products/tee.jpg",
            },
            headers=auth_headers(me),
        )
    assert r.status_code == 422
    task.delay.assert_not_called()


def test_try_on_rejects_someone_elses_photo_as_the_garment(api, make_user, auth_headers):
    me, other = make_user(), make_user()
    with patch("app.services.tryon_service.process_tryon_job"):
        r = api.post(
            TRYON,
            json={
                "user_image_key": f"user-photos/{me.id}/a.jpg",
                "garment_image_key": f"user-photos/{other.id}/b.jpg",
            },
            headers=auth_headers(me),
        )
    assert r.status_code == 422


def test_wardrobe_rejects_someone_elses_photo(api, make_user, auth_headers):
    me, other = make_user(), make_user()
    r = api.post(
        "/api/v1/wardrobe",
        json={"image_key": f"user-photos/{other.id}/a.jpg", "category": "tops"},
        headers=auth_headers(me),
    )
    assert r.status_code == 422


def test_store_cannot_publish_someone_elses_photo(
    api, make_user, make_store, make_product, auth_headers
):
    brand, victim = make_user(UserRole.BRAND_ADMIN), make_user()
    product = make_product(make_store(brand))
    stolen = f"user-photos/{victim.id}/a.jpg"
    headers = auth_headers(brand)

    r = api.patch(
        f"/api/v1/store/products/{product.id}",
        json={"primary_image_key": stolen},
        headers=headers,
    )
    assert r.status_code == 422

    own = f"user-photos/{brand.id}/a.jpg"
    r = api.patch(
        f"/api/v1/store/products/{product.id}", json={"primary_image_key": own}, headers=headers
    )
    assert r.status_code == 200, r.text


# --- Children ----------------------------------------------------------------


def test_try_on_is_refused_for_a_childs_profile(db, api, make_user, auth_headers):
    me = make_user()
    child = BodyProfile(user_id=me.id, name="Lina", body_category="GIRLS")
    db.add(child)
    db.commit()

    with patch("app.services.tryon_service.process_tryon_job") as task:
        r = api.post(
            TRYON,
            json={
                "user_image_key": f"user-photos/{me.id}/a.jpg",
                "garment_image_key": "seed-data/products/tee.jpg",
                "body_profile_id": str(child.id),
            },
            headers=auth_headers(me),
        )
    assert r.status_code == 422
    assert "children" in r.json()["message"]
    task.delay.assert_not_called()


def test_try_on_is_refused_for_childrens_products(
    api, make_user, make_store, make_product, auth_headers
):
    me = make_user()
    product = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)), audience=ProductAudience.GIRLS
    )
    with patch("app.services.tryon_service.process_tryon_job"):
        r = api.post(
            TRYON,
            json={
                "user_image_key": f"user-photos/{me.id}/a.jpg",
                "product_variant_id": str(product.variants[0].id),
            },
            headers=auth_headers(me),
        )
    assert r.status_code == 422


def test_childrens_profiles_cannot_hold_a_photo(api, make_user, auth_headers):
    me = make_user()
    headers = auth_headers(me)
    profiles = "/api/v1/users/me/body-profiles"
    api.put("/api/v1/users/me/body-profile", json={"height_cm": 170}, headers=headers)
    child = api.post(
        profiles, json={"name": "Sami", "body_category": "boys"}, headers=headers
    ).json()

    r = api.put(
        f"{profiles}/{child['id']}",
        json={"reference_image_key": f"user-photos/{me.id}/kid.jpg"},
        headers=headers,
    )
    assert r.status_code == 422


# --- Account deletion --------------------------------------------------------


def _account(make_user, role=UserRole.SHOPPER):
    return make_user(role, hashed_password=hash_password(PASSWORD))


def test_deletion_needs_the_password(api, make_user, auth_headers):
    r = api.post(
        "/api/v1/users/me/delete",
        json={"password": "wrong-password"},
        headers=auth_headers(_account(make_user)),
    )
    assert r.status_code == 422


def test_platform_admin_cannot_delete_their_account(api, make_user, auth_headers):
    admin = _account(make_user, UserRole.PLATFORM_ADMIN)
    r = api.post(
        "/api/v1/users/me/delete", json={"password": PASSWORD}, headers=auth_headers(admin)
    )
    assert r.status_code == 422


def test_deletion_signs_out_and_logging_in_cancels(db, api, make_user, auth_headers):
    user = _account(make_user)
    headers = auth_headers(user)

    r = api.post("/api/v1/users/me/delete", json={"password": PASSWORD}, headers=headers)
    assert r.status_code == 202, r.text
    scheduled = datetime.fromisoformat(r.json()["deletion_scheduled_for"])
    assert timedelta(days=29) < scheduled - datetime.now(UTC) <= timedelta(days=30)

    assert api.patch("/api/v1/users/me", json={"full_name": "X"}, headers=headers).status_code == (
        401
    )

    r = api.post("/api/v1/auth/login", json={"email": user.email, "password": PASSWORD})
    assert r.status_code == 200, r.text
    db.expire_all()
    assert db.get(User, user.id).deletion_requested_at is None


def test_account_is_erased_after_the_grace_period_only(db, make_user):
    storage = FakeStorage()
    due = make_user(deletion_requested_at=datetime.now(UTC) - timedelta(days=31))
    waiting = make_user(deletion_requested_at=datetime.now(UTC) - timedelta(days=29))
    result = _job(db, due).result_image_key

    assert DataRetentionService(db, storage).purge_deleted_accounts() == 1

    db.expire_all()
    assert db.get(User, due.id) is None
    assert db.get(User, waiting.id) is not None
    assert result in storage.deleted
    assert storage.deleted_prefixes == [f"user-photos/{due.id}/"]


def test_erasing_a_brand_removes_its_store(db, make_user, make_store, make_product):
    db.execute(text("PRAGMA foreign_keys=ON"))  # SQLite enforces cascades only on request
    brand = make_user(
        UserRole.BRAND_ADMIN, deletion_requested_at=datetime.now(UTC) - timedelta(days=31)
    )
    store = make_store(brand)
    store_id = store.id
    make_product(store)

    assert DataRetentionService(db, FakeStorage()).purge_deleted_accounts() == 1

    db.expire_all()
    assert db.query(Store).filter(Store.id == store_id).first() is None


def test_storage_failure_keeps_the_account_for_the_next_run(db, make_user):
    storage = FakeStorage()
    user = make_user(deletion_requested_at=datetime.now(UTC) - timedelta(days=31))
    job = _job(db, user)
    storage.fail_on.add(job.result_image_key)

    assert DataRetentionService(db, storage).purge_deleted_accounts() == 0
    assert db.get(User, user.id) is not None


# --- Retention ---------------------------------------------------------------


def test_old_tryons_are_deleted_with_their_images(db, make_user):
    storage = FakeStorage()
    user = make_user()
    old, recent = _job(db, user, days_old=91), _job(db, user, days_old=89)
    old_id, photo, result = old.id, old.user_image_key, old.result_image_key

    assert DataRetentionService(db, storage).purge_expired_tryons() == 1

    db.expire_all()
    assert db.get(TryOnJob, old_id) is None
    assert db.get(TryOnJob, recent.id) is not None
    assert set(storage.deleted) == {photo, result}


def test_saved_looks_are_kept(db, make_user):
    storage = FakeStorage()
    user = make_user()
    job = _job(db, user, days_old=200)
    db.add(SavedLook(user_id=user.id, tryon_job_id=job.id))
    db.commit()

    assert DataRetentionService(db, storage).purge_expired_tryons() == 0
    assert storage.deleted == []


def test_jobs_still_running_are_left_alone(db, make_user):
    storage = FakeStorage()
    _job(db, make_user(), days_old=200, status=TryOnJobStatus.PROCESSING)
    assert DataRetentionService(db, storage).purge_expired_tryons() == 0


def test_photo_used_elsewhere_survives(db, make_user):
    storage = FakeStorage()
    user = make_user()
    photo = f"user-photos/{user.id}/shared.jpg"
    old = _job(db, user, days_old=91, photo=photo)
    result = old.result_image_key
    _job(db, user, days_old=1, photo=photo)

    assert DataRetentionService(db, storage).purge_expired_tryons() == 1
    assert storage.deleted == [result]


def test_catalog_garments_are_never_deleted(db, make_user):
    storage = FakeStorage()
    job = _job(db, make_user(), days_old=91, garment="seed-data/products/tee.jpg")
    photo, result = job.user_image_key, job.result_image_key

    DataRetentionService(db, storage).purge_expired_tryons()
    assert set(storage.deleted) == {photo, result}


def test_a_failing_job_does_not_stop_the_others(db, make_user):
    storage = FakeStorage()
    user = make_user()
    bad, good = _job(db, user, days_old=91), _job(db, user, days_old=91)
    storage.fail_on.add(bad.result_image_key)

    assert DataRetentionService(db, storage).purge_expired_tryons() == 1
    db.expire_all()
    assert db.get(TryOnJob, bad.id) is not None
    assert db.get(TryOnJob, good.id) is None


def test_generation_failure_message_is_for_shoppers():
    assert "HTTP" not in GENERATION_FAILED and "try again" in GENERATION_FAILED
