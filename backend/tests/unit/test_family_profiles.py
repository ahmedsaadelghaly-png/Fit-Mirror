"""Family profiles (several body profiles per account) and catalog try-ons."""

from unittest.mock import patch

from app.models.product import ProductAudience
from app.models.user import MAX_BODY_PROFILES_PER_USER, UserRole

PROFILES = "/api/v1/users/me/body-profiles"


def test_first_profile_is_primary_and_family_profiles_follow(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    api.put("/api/v1/users/me/body-profile", json={"height_cm": 168}, headers=headers)

    r = api.post(
        PROFILES, json={"name": "Lina", "body_category": "girls", "height_cm": 128}, headers=headers
    )
    assert r.status_code == 201, r.text
    assert r.json()["is_primary"] is False

    listed = api.get(PROFILES, headers=headers).json()
    assert [(p["name"], p["is_primary"]) for p in listed] == [("Me", True), ("Lina", False)]
    # The single-profile endpoint keeps reading the shopper's own profile.
    assert api.get("/api/v1/users/me/body-profile", headers=headers).json()["height_cm"] == 168


def test_update_and_delete_family_profile(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    kid = api.post(PROFILES, json={"name": "Omar", "body_category": "boys"}, headers=headers).json()
    # With no profile yet, the first one created is the shopper's own.
    assert kid["is_primary"] is True
    child = api.post(PROFILES, json={"name": "Sami", "body_category": "boys"}, headers=headers)
    child_id = child.json()["id"]

    r = api.put(
        f"{PROFILES}/{child_id}", json={"body_shape": "husky", "height_cm": 120}, headers=headers
    )
    assert r.json()["body_shape"] == "husky"
    r = api.put(f"{PROFILES}/{child_id}", json={"body_shape": "pear"}, headers=headers)
    assert r.status_code == 422

    assert api.delete(f"{PROFILES}/{kid['id']}", headers=headers).status_code == 422
    assert api.delete(f"{PROFILES}/{child_id}", headers=headers).status_code == 204
    assert len(api.get(PROFILES, headers=headers).json()) == 1


def test_profiles_are_private_to_their_account(api, make_user, auth_headers):
    owner, other = make_user(), make_user()
    kid = api.post(PROFILES, json={"name": "Lina"}, headers=auth_headers(owner)).json()
    for method in ("get", "put", "delete"):
        kwargs = {"json": {"height_cm": 100}} if method == "put" else {}
        r = getattr(api, method)(f"{PROFILES}/{kid['id']}", headers=auth_headers(other), **kwargs)
        assert r.status_code == 404


def test_profile_limit(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    for i in range(MAX_BODY_PROFILES_PER_USER):
        assert api.post(PROFILES, json={"name": f"P{i}"}, headers=headers).status_code == 201
    assert api.post(PROFILES, json={"name": "One more"}, headers=headers).status_code == 422


def test_sizing_for_a_chosen_family_profile(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(shopper, body_category="women", chest_cm=92, waist_cm=76, hip_cm=98)
    headers = auth_headers(shopper)
    kid = api.post(
        PROFILES, json={"name": "Lina", "body_category": "girls", "height_cm": 128}, headers=headers
    ).json()
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    dress = make_product(
        store, title="Smock Top", audience=ProductAudience.GIRLS, sizes=("6-7Y", "8Y", "9-10Y")
    )

    # Own (adult) profile -> explained 422; Lina's profile -> a size.
    r = api.post("/api/v1/sizing/recommend", json={"product_id": str(dress.id)}, headers=headers)
    assert r.status_code == 422
    r = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(dress.id), "body_profile_id": kid["id"]},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    assert r.json()["recommended_size_label"] == "8Y"
    assert r.json()["profile_name"] == "Lina"


def test_sizing_rejects_someone_elses_profile(
    api, make_user, make_store, make_product, auth_headers
):
    other = make_user()
    stranger_kid = api.post(PROFILES, json={"name": "X"}, headers=auth_headers(other)).json()
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)))
    r = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(product.id), "body_profile_id": stranger_kid["id"]},
        headers=auth_headers(make_user()),
    )
    assert r.status_code == 404


# --- Catalog try-on --------------------------------------------------------------


def test_catalog_tryon_records_product_and_falls_back_to_product_photo(
    api, db, make_user, make_store, make_product, auth_headers
):
    shopper = make_user()
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)), title="Rust Bomber")
    product.primary_image_key = "seed-data/products/bomber.jpg"
    db.commit()
    variant = product.variants[1]
    headers = auth_headers(shopper)

    with patch("app.services.tryon_service.process_tryon_job.delay"):
        r = api.post(
            "/api/v1/tryon",
            json={
                "user_image_key": f"user-photos/{shopper.id}/me.jpg",
                "product_variant_id": str(variant.id),
            },
            headers=headers,
        )
    assert r.status_code == 202, r.text

    jobs = api.get("/api/v1/tryon", headers=headers).json()
    assert jobs[0]["garment_image_key"] == "seed-data/products/bomber.jpg"
    assert jobs[0]["product_title"] == "Rust Bomber"
    assert jobs[0]["size_label"] == variant.size_label
    assert jobs[0]["created_at"]


def test_catalog_tryon_rejects_hidden_product(
    api, db, make_user, make_store, make_product, auth_headers
):
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)), is_active=False)
    shopper = make_user()
    with patch("app.services.tryon_service.process_tryon_job.delay"):
        r = api.post(
            "/api/v1/tryon",
            json={
                "user_image_key": f"user-photos/{shopper.id}/me.jpg",
                "product_variant_id": str(product.variants[0].id),
            },
            headers=auth_headers(shopper),
        )
    assert r.status_code == 404
