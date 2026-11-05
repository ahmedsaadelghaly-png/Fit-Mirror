"""GET /store/analytics: totals for the caller's store, within the window."""

from datetime import UTC, datetime, timedelta

from app.models.saved_look import SavedLook
from app.models.sizing import FitFeedback, FitVerdict
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import UserRole

URL = "/api/v1/store/analytics"


def _tryon(db, shopper, variant, *, days_old=1, status=TryOnJobStatus.COMPLETED):
    job = TryOnJob(
        user_id=shopper.id,
        product_variant_id=variant.id,
        user_image_key=f"user-photos/{shopper.id}/me.jpg",
        garment_image_key="seed-data/products/tee.jpg",
        status=status,
        created_at=datetime.now(UTC) - timedelta(days=days_old),
    )
    db.add(job)
    db.commit()
    return job


def test_totals_top_products_and_sizes(db, api, make_user, make_store, make_product, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN)
    store = make_store(brand)
    tee, jacket = make_product(store, title="Tee"), make_product(store, title="Jacket")
    ann, ben = make_user(), make_user()

    saved = _tryon(db, ann, tee.variants[1])
    _tryon(db, ann, tee.variants[1])
    _tryon(db, ben, tee.variants[0], status=TryOnJobStatus.FAILED)
    _tryon(db, ben, jacket.variants[1])
    db.add(SavedLook(user_id=ann.id, tryon_job_id=saved.id))
    db.add(FitFeedback(user_id=ann.id, product_id=tee.id, size_label="M", fit=FitVerdict.SMALL))
    db.commit()

    r = api.get(URL, headers=auth_headers(brand))
    assert r.status_code == 200, r.text
    body = r.json()
    assert (body["tryons"], body["shoppers"], body["completed"], body["saved_looks"]) == (
        4,
        2,
        3,
        1,
    )
    assert [(p["title"], p["tryons"], p["shoppers"]) for p in body["top_products"]] == [
        ("Tee", 3, 2),
        ("Jacket", 1, 1),
    ]
    assert [(s["size_label"], s["tryons"]) for s in body["size_demand"]] == [("M", 3), ("S", 1)]
    assert body["fit_counts"][FitVerdict.SMALL.value] == 1
    assert sum(body["fit_counts"].values()) == 1


def test_never_exposes_who_tried_on(db, api, make_user, make_store, make_product, auth_headers):
    brand, shopper = make_user(UserRole.BRAND_ADMIN), make_user()
    _tryon(db, shopper, make_product(make_store(brand)).variants[0])

    response = api.get(URL, headers=auth_headers(brand)).text
    assert str(shopper.id) not in response and shopper.email not in response


def test_window_excludes_older_tryons(db, api, make_user, make_store, make_product, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN)
    variant = make_product(make_store(brand)).variants[0]
    _tryon(db, make_user(), variant, days_old=10)
    headers = auth_headers(brand)

    assert api.get(URL, params={"days": 7}, headers=headers).json()["tryons"] == 0
    assert api.get(URL, params={"days": 30}, headers=headers).json()["tryons"] == 1


def test_other_stores_are_not_counted(db, api, make_user, make_store, make_product, auth_headers):
    mine, theirs = make_user(UserRole.BRAND_ADMIN), make_user(UserRole.BRAND_ADMIN)
    make_store(mine)
    _tryon(db, make_user(), make_product(make_store(theirs)).variants[0])

    assert api.get(URL, headers=auth_headers(mine)).json()["tryons"] == 0


def test_window_cannot_outlast_retention(api, make_user, make_store, auth_headers):
    brand = make_user(UserRole.BRAND_ADMIN)
    make_store(brand)
    assert api.get(URL, params={"days": 91}, headers=auth_headers(brand)).status_code == 422


def test_shoppers_are_refused(api, make_user, auth_headers):
    assert api.get(URL, headers=auth_headers(make_user())).status_code == 403
