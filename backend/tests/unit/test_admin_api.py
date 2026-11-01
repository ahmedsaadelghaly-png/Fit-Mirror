import pytest

from app.api.v1.endpoints import admin as admin_endpoints
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import UserRole

pytestmark = pytest.mark.unit


@pytest.mark.parametrize("role", [UserRole.SHOPPER, UserRole.BRAND_ADMIN])
def test_admin_routes_forbidden_for_non_admins(api, make_user, auth_headers, role):
    response = api.get("/api/v1/admin/users", headers=auth_headers(make_user(role)))
    assert response.status_code == 403


def test_admin_lists_and_filters_users(api, make_user, auth_headers):
    admin = make_user(UserRole.PLATFORM_ADMIN)
    make_user(UserRole.SHOPPER, email="alice@example.com")
    make_user(UserRole.BRAND_ADMIN, email="brand@example.com")

    by_role = api.get(
        "/api/v1/admin/users", params={"role": "brand_admin"}, headers=auth_headers(admin)
    ).json()
    by_text = api.get(
        "/api/v1/admin/users", params={"q": "ALICE"}, headers=auth_headers(admin)
    ).json()

    assert [u["email"] for u in by_role] == ["brand@example.com"]
    assert [u["email"] for u in by_text] == ["alice@example.com"]


def test_admin_promotes_and_deactivates_users(api, make_user, auth_headers):
    admin, shopper = make_user(UserRole.PLATFORM_ADMIN), make_user()

    promoted = api.patch(
        f"/api/v1/admin/users/{shopper.id}",
        json={"role": "brand_admin"},
        headers=auth_headers(admin),
    )
    assert promoted.json()["role"] == "brand_admin"

    api.patch(
        f"/api/v1/admin/users/{shopper.id}", json={"is_active": False}, headers=auth_headers(admin)
    )
    # The deactivated user's still-valid token stops working immediately.
    assert api.get("/api/v1/store/me", headers=auth_headers(shopper)).status_code == 401


def test_admin_cannot_lock_themselves_out(api, make_user, auth_headers):
    admin = make_user(UserRole.PLATFORM_ADMIN)
    response = api.patch(
        f"/api/v1/admin/users/{admin.id}", json={"is_active": False}, headers=auth_headers(admin)
    )
    assert response.status_code == 422


def test_admin_verifies_store_and_sees_stats(
    api, make_user, make_store, make_product, auth_headers
):
    admin = make_user(UserRole.PLATFORM_ADMIN)
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    make_product(store)
    make_product(store, is_active=False)

    stores = api.get("/api/v1/admin/stores", headers=auth_headers(admin)).json()
    assert stores[0]["product_count"] == 2
    assert stores[0]["is_verified"] is False

    verified = api.patch(
        f"/api/v1/admin/stores/{store.id}", json={"is_verified": True}, headers=auth_headers(admin)
    ).json()
    assert verified["is_verified"] is True

    stats = api.get("/api/v1/admin/stats", headers=auth_headers(admin)).json()
    assert stats["users_by_role"] == {"shopper": 0, "brand_admin": 1, "platform_admin": 1}
    assert stats["verified_stores"] == 1
    assert stats["total_products"] == 2
    assert stats["active_products"] == 1
    assert stats["tryon_jobs_by_status"]["pending"] == 0


def test_suspending_a_store_hides_its_products_from_shoppers(
    api, make_user, make_store, make_product, auth_headers
):
    admin, shopper = make_user(UserRole.PLATFORM_ADMIN), make_user()
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    make_product(store)

    assert len(api.get("/api/v1/catalog/products", headers=auth_headers(shopper)).json()) == 1

    suspended = api.patch(
        f"/api/v1/admin/stores/{store.id}", json={"is_suspended": True}, headers=auth_headers(admin)
    ).json()
    assert suspended["is_suspended"] is True
    assert suspended["is_verified"] is False  # untouched by a partial update
    assert api.get("/api/v1/catalog/products", headers=auth_headers(shopper)).json() == []


def _job(db, user, status, variant_id=None):
    job = TryOnJob(
        user_id=user.id,
        product_variant_id=variant_id,
        user_image_key="u.png",
        garment_image_key="g.png",
        status=status,
        error_message="AI service down" if status == TryOnJobStatus.FAILED else None,
    )
    db.add(job)
    db.commit()
    return job


def test_admin_job_list_includes_user_email_and_store_name(
    api, db, make_user, make_store, make_product, auth_headers
):
    admin = make_user(UserRole.PLATFORM_ADMIN)
    shopper = make_user(email="ada@example.com")
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)))
    _job(db, shopper, TryOnJobStatus.COMPLETED, product.variants[0].id)
    _job(db, shopper, TryOnJobStatus.FAILED)  # uploaded garment: no store

    jobs = api.get("/api/v1/admin/tryon-jobs", headers=auth_headers(admin)).json()

    assert {j["user_email"] for j in jobs} == {"ada@example.com"}
    assert sorted(j["store_name"] or "" for j in jobs) == ["", "Test Store"]


def test_admin_retries_failed_job_only(api, db, make_user, auth_headers, monkeypatch):
    enqueued = []
    monkeypatch.setattr(admin_endpoints.process_tryon_job, "delay", enqueued.append)
    admin, shopper = make_user(UserRole.PLATFORM_ADMIN), make_user()
    failed = _job(db, shopper, TryOnJobStatus.FAILED)
    done = _job(db, shopper, TryOnJobStatus.COMPLETED)

    retried = api.post(
        f"/api/v1/admin/tryon-jobs/{failed.id}/retry", headers=auth_headers(admin)
    ).json()
    assert retried["status"] == "pending"
    assert retried["error_message"] is None
    assert enqueued == [str(failed.id)]

    rejected = api.post(f"/api/v1/admin/tryon-jobs/{done.id}/retry", headers=auth_headers(admin))
    assert rejected.status_code == 422
