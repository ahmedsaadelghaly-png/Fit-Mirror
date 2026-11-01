import pytest

from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import UserRole

pytestmark = pytest.mark.unit


def test_shopper_cannot_create_a_store(api, make_user, auth_headers):
    shopper = make_user(UserRole.SHOPPER)
    response = api.post(
        "/api/v1/store", json={"name": "Nope", "slug": "nope"}, headers=auth_headers(shopper)
    )
    assert response.status_code == 403
    assert response.json()["error_code"] == "forbidden"


def test_brand_admin_creates_exactly_one_store(api, make_user, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN)
    first = api.post("/api/v1/store", json={"name": "A", "slug": "a"}, headers=auth_headers(brand))
    second = api.post("/api/v1/store", json={"name": "B", "slug": "b"}, headers=auth_headers(brand))
    assert first.status_code == 201
    assert second.status_code == 409


def test_deactivated_user_is_rejected_even_with_valid_token(api, make_user, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN, is_active=False)
    response = api.get("/api/v1/store/me", headers=auth_headers(brand))
    assert response.status_code == 401


def test_product_and_variant_crud_round_trip(api, make_user, make_store, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN)
    make_store(brand)
    headers = auth_headers(brand)

    created = api.post(
        "/api/v1/store/products",
        json={"title": "Linen Shirt", "category": "tops", "price": "49.00"},
        headers=headers,
    )
    assert created.status_code == 201
    product_id = created.json()["id"]

    updated = api.patch(
        f"/api/v1/store/products/{product_id}",
        json={"price": "39.00", "is_active": False},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["price"] == "39.00"
    assert updated.json()["is_active"] is False
    assert updated.json()["title"] == "Linen Shirt"  # untouched by a partial update

    variant = api.post(
        f"/api/v1/store/products/{product_id}/variants",
        json={"size_label": "M", "sku": "LIN-M", "stock_quantity": 4},
        headers=headers,
    )
    assert variant.status_code == 201
    variant_id = variant.json()["id"]

    duplicate = api.post(
        f"/api/v1/store/products/{product_id}/variants",
        json={"size_label": "L", "sku": "LIN-M"},
        headers=headers,
    )
    assert duplicate.status_code == 409

    restocked = api.patch(
        f"/api/v1/store/products/{product_id}/variants/{variant_id}",
        json={"stock_quantity": 10},
        headers=headers,
    )
    assert restocked.json()["stock_quantity"] == 10

    detail = api.get(f"/api/v1/store/products/{product_id}", headers=headers).json()
    assert [v["sku"] for v in detail["variants"]] == ["LIN-M"]

    assert (
        api.delete(
            f"/api/v1/store/products/{product_id}/variants/{variant_id}", headers=headers
        ).status_code
        == 204
    )
    assert api.delete(f"/api/v1/store/products/{product_id}", headers=headers).status_code == 204
    assert api.get("/api/v1/store/products", headers=headers).json() == []


def test_brand_cannot_touch_another_brands_product(
    api, make_user, make_store, make_product, auth_headers
):
    owner, intruder = make_user(UserRole.BRAND_ADMIN), make_user(UserRole.BRAND_ADMIN)
    product = make_product(make_store(owner))
    make_store(intruder)

    response = api.patch(
        f"/api/v1/store/products/{product.id}",
        json={"price": "1.00"},
        headers=auth_headers(intruder),
    )
    assert response.status_code == 404  # 404, not 403: don't confirm it exists


def test_dashboard_summary_counts_jobs_for_own_store_only(
    api, db, make_user, make_store, make_product, auth_headers
):
    brand, other_brand, shopper = (
        make_user(UserRole.BRAND_ADMIN),
        make_user(UserRole.BRAND_ADMIN),
        make_user(),
    )
    mine = make_product(make_store(brand))
    theirs = make_product(make_store(other_brand))

    statuses = [TryOnJobStatus.COMPLETED, TryOnJobStatus.COMPLETED, TryOnJobStatus.FAILED]
    for status in statuses:
        db.add(
            TryOnJob(
                user_id=shopper.id,
                product_variant_id=mine.variants[0].id,
                user_image_key="u",
                garment_image_key="g",
                status=status,
            )
        )
    db.add(
        TryOnJob(
            user_id=shopper.id,
            product_variant_id=theirs.variants[0].id,
            user_image_key="u",
            garment_image_key="g",
            status=TryOnJobStatus.COMPLETED,
        )
    )
    db.commit()

    summary = api.get("/api/v1/store/me/summary", headers=auth_headers(brand)).json()
    assert summary == {
        "total_products": 1,
        "total_tryon_jobs": 3,
        "completed_tryon_jobs": 2,
        "failed_tryon_jobs": 1,
    }


def test_upload_url_rejects_non_image_content_types(api, make_user, auth_headers):
    shopper = make_user()
    response = api.post(
        "/api/v1/tryon/upload-url",
        params={"filename": "x.html", "content_type": "text/html"},
        headers=auth_headers(shopper),
    )
    assert response.status_code == 422


def test_archived_products_are_hidden_from_shoppers(
    api, make_user, make_store, make_product, auth_headers
):
    brand, shopper = make_user(UserRole.BRAND_ADMIN), make_user()
    product = make_product(make_store(brand), title="Retired Jacket", category="outerwear")

    archived = api.patch(
        f"/api/v1/store/products/{product.id}",
        json={"is_archived": True},
        headers=auth_headers(brand),
    )
    assert archived.json()["is_archived"] is True
    assert archived.json()["is_active"] is True  # archiving is independent of active

    catalog = api.get("/api/v1/catalog/products", headers=auth_headers(shopper)).json()
    assert catalog == []
    shopping = api.post(
        "/api/v1/shopping/ask", json={"query": "jacket"}, headers=auth_headers(shopper)
    ).json()
    assert shopping["matched_product_ids"] == []
    # ...but the brand still sees it in their own catalog.
    own = api.get("/api/v1/store/products", headers=auth_headers(brand)).json()
    assert [p["id"] for p in own] == [str(product.id)]
