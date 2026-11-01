"""Saved Looks, body-profile style preferences, store business info."""

import random

from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import UserRole
from app.services.stylist_service import StylistService
from tests.unit.test_ai_features import _add_items


def _job(db, user, status=TryOnJobStatus.COMPLETED):
    job = TryOnJob(
        user_id=user.id,
        user_image_key=f"user-photos/{user.id}/me.jpg",
        garment_image_key="seed-data/products/tee.jpg",
        status=status,
        result_image_key="tryon-results/r.png" if status == TryOnJobStatus.COMPLETED else None,
    )
    db.add(job)
    db.commit()
    return job


# --- Saved Looks ---------------------------------------------------------------


def test_save_list_delete_look(api, db, make_user, auth_headers):
    user = make_user()
    headers = auth_headers(user)
    job = _job(db, user)

    created = api.post(
        "/api/v1/saved-looks",
        json={"tryon_job_id": str(job.id), "label": "Date night"},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["result_image_key"] == "tryon-results/r.png"
    assert body["garment_image_key"] == "seed-data/products/tee.jpg"
    assert body["label"] == "Date night"

    looks = api.get("/api/v1/saved-looks", headers=headers).json()
    assert [look["id"] for look in looks] == [body["id"]]

    again = api.post("/api/v1/saved-looks", json={"tryon_job_id": str(job.id)}, headers=headers)
    assert again.status_code == 409

    assert api.delete(f"/api/v1/saved-looks/{body['id']}", headers=headers).status_code == 204
    assert api.get("/api/v1/saved-looks", headers=headers).json() == []


def test_cannot_save_unfinished_or_foreign_job(api, db, make_user, auth_headers):
    owner, other = make_user(), make_user()
    pending = _job(db, owner, TryOnJobStatus.PENDING)
    foreign = _job(db, other)
    headers = auth_headers(owner)

    r = api.post("/api/v1/saved-looks", json={"tryon_job_id": str(pending.id)}, headers=headers)
    assert r.status_code == 422
    r = api.post("/api/v1/saved-looks", json={"tryon_job_id": str(foreign.id)}, headers=headers)
    assert r.status_code == 404


def test_cannot_delete_someone_elses_look(api, db, make_user, auth_headers):
    owner, other = make_user(), make_user()
    job = _job(db, owner)
    look = api.post(
        "/api/v1/saved-looks", json={"tryon_job_id": str(job.id)}, headers=auth_headers(owner)
    ).json()

    r = api.delete(f"/api/v1/saved-looks/{look['id']}", headers=auth_headers(other))
    assert r.status_code == 404


# --- Style preferences ------------------------------------------------------------


def test_style_preferences_round_trip(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    r = api.put(
        "/api/v1/users/me/body-profile",
        json={
            "preferred_fit": "relaxed",
            "favorite_colors": ["navy", "beige"],
            "style_preferences": ["minimalist"],
        },
        headers=headers,
    )
    assert r.status_code == 200, r.text
    assert r.json()["favorite_colors"] == ["navy", "beige"]

    # A measurement-only update keeps the preferences.
    r = api.put("/api/v1/users/me/body-profile", json={"height_cm": 170}, headers=headers)
    assert r.json()["preferred_fit"] == "relaxed"
    assert r.json()["style_preferences"] == ["minimalist"]

    r = api.put("/api/v1/users/me/body-profile", json={"favorite_colors": None}, headers=headers)
    assert r.json()["favorite_colors"] == []


def test_reference_photo_must_be_own_upload(api, make_user, auth_headers):
    user, other = make_user(), make_user()
    headers = auth_headers(user)
    own = f"user-photos/{user.id}/abc_me.jpg"
    r = api.put("/api/v1/users/me/body-profile", json={"reference_image_key": own}, headers=headers)
    assert r.json()["reference_image_key"] == own
    r = api.put(
        "/api/v1/users/me/body-profile",
        json={"reference_image_key": f"user-photos/{other.id}/x.jpg"},
        headers=headers,
    )
    assert r.status_code == 422


def test_unknown_preferred_fit_rejected(api, make_user, auth_headers):
    r = api.put(
        "/api/v1/users/me/body-profile",
        json={"preferred_fit": "baggy-ish"},
        headers=auth_headers(make_user()),
    )
    assert r.status_code == 422


def test_stylist_prefers_favorite_colors(db, make_user, set_body_profile):
    user = make_user()
    set_body_profile(user, favorite_colors=["burgundy"])
    ids = _add_items(db, user, [("tops", "Plain Tee"), ("tops", "Wine Knit Tee")])

    for seed in range(5):
        suggestion = StylistService(db, rng=random.Random(seed)).suggest(user.id, "weekend", None)
        assert ids["Wine Knit Tee"] in suggestion.wardrobe_item_ids


# --- Store business info ------------------------------------------------------------


def test_store_business_info_update(api, make_user, make_store, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN)
    make_store(brand)
    headers = auth_headers(brand)

    r = api.patch(
        "/api/v1/store/me",
        json={
            "category": "womenswear",
            "description": "Slow fashion from Lisbon.",
            "social_links": {"website": "https://atelier.example", "instagram": "@atelier"},
            "logo_image_key": f"user-photos/{brand.id}/abc_logo.png",
        },
        headers=headers,
    )
    assert r.status_code == 200, r.text
    store = api.get("/api/v1/store/me", headers=headers).json()
    assert store["category"] == "womenswear"
    assert store["social_links"] == {
        "website": "https://atelier.example/",
        "instagram": "@atelier",
        "tiktok": None,
    }
    assert store["logo_image_key"].endswith("abc_logo.png")

    # Partial: only clears what is sent; name can't be nulled.
    r = api.patch(
        "/api/v1/store/me", json={"name": None, "social_links": {"instagram": ""}}, headers=headers
    )
    assert r.json()["name"] == "Test Store"
    assert r.json()["social_links"]["instagram"] is None
    assert r.json()["social_links"]["website"] == "https://atelier.example/"


def test_store_logo_must_be_uploaded_by_owner(api, make_user, make_store, auth_headers):
    brand, other = make_user(UserRole.BRAND_ADMIN), make_user()
    make_store(brand)
    r = api.patch(
        "/api/v1/store/me",
        json={"logo_image_key": f"user-photos/{other.id}/private.png"},
        headers=auth_headers(brand),
    )
    assert r.status_code == 422


def test_shopper_cannot_update_store(api, make_user, auth_headers):
    r = api.patch("/api/v1/store/me", json={"name": "x"}, headers=auth_headers(make_user()))
    assert r.status_code == 403
