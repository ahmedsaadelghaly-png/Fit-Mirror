"""Per-brand size charts (ingestion + use in sizing) and shopper fit feedback."""

import pytest

from app.core.exceptions import ValidationAppError
from app.models.product import ProductAudience
from app.models.user import UserRole
from app.services.size_chart_service import parse_csv

CHART_CSV = """size,chest,waist
S,80-88,62-70
M,88-96,70-78
L,96-104,78-86
"""


@pytest.fixture
def brand(make_user, make_store, auth_headers):
    owner = make_user(UserRole.BRAND_ADMIN)
    store = make_store(owner)
    return store, auth_headers(owner)


def _recommend(api, headers, product, **extra):
    return api.post(
        "/api/v1/sizing/recommend", json={"product_id": str(product.id), **extra}, headers=headers
    )


# --- Ingestion --------------------------------------------------------------------


def test_parse_csv_reads_ranges_and_aliases():
    rows = parse_csv("Size,Chest_cm,Hip\nS,80-88,\nM,88–96,90-98\n")
    assert rows == [
        {"size_label": "S", "chest_cm": [80.0, 88.0]},
        {"size_label": "M", "chest_cm": [88.0, 96.0], "hip_cm": [90.0, 98.0]},
    ]


@pytest.mark.parametrize(
    ("text", "message"),
    [
        ("chest,waist\n80-88,62-70", "'size' column"),
        ("size,shoulder\nS,40-42", "Unknown column"),
        ("size,chest\nS,eighty", "isn't a range"),
    ],
)
def test_parse_csv_explains_bad_input(text, message):
    with pytest.raises(ValidationAppError, match=message):
        parse_csv(text)


def test_brand_uploads_lists_replaces_and_deletes_a_chart(api, brand):
    _, headers = brand
    r = api.put("/api/v1/store/size-charts/tops", json={"csv": CHART_CSV}, headers=headers)
    assert r.status_code == 200, r.text
    assert [row["size_label"] for row in r.json()["rows"]] == ["S", "M", "L"]

    r = api.put(
        "/api/v1/store/size-charts/tops",
        json={"rows": [{"size_label": "One", "chest_cm": [80, 110]}]},
        headers=headers,
    )
    assert [row["size_label"] for row in r.json()["rows"]] == ["One"]
    assert len(api.get("/api/v1/store/size-charts", headers=headers).json()) == 1

    assert api.delete("/api/v1/store/size-charts/tops", headers=headers).status_code == 204
    assert api.get("/api/v1/store/size-charts", headers=headers).json() == []


@pytest.mark.parametrize(
    ("category", "body"),
    [
        ("footwear", {"csv": CHART_CSV}),
        ("tops", {"rows": [{"size_label": "S", "chest_cm": [90, 80]}]}),
        ("tops", {"rows": [{"size_label": "S"}]}),
        ("tops", {"csv": CHART_CSV, "rows": []}),
    ],
)
def test_invalid_charts_are_rejected(api, brand, category, body):
    _, headers = brand
    assert (
        api.put(f"/api/v1/store/size-charts/{category}", json=body, headers=headers).status_code
        == 422
    )


def test_shopper_cannot_upload_charts(api, make_user, auth_headers):
    r = api.put(
        "/api/v1/store/size-charts/tops",
        json={"csv": CHART_CSV},
        headers=auth_headers(make_user()),
    )
    assert r.status_code == 403


# --- Sizing with a brand chart ------------------------------------------------------


def test_brand_chart_drives_the_recommendation(
    api, brand, make_product, make_user, set_body_profile, auth_headers
):
    store, brand_headers = brand
    tee = make_product(store, sizes=("S", "M", "L"))
    shopper = make_user()
    # On the standard chart chest 92 / waist 74 is S; on this brand's chart it's M.
    set_body_profile(shopper, body_category="women", chest_cm=92, waist_cm=74)
    headers = auth_headers(shopper)

    assert _recommend(api, headers, tee).json()["size_chart"] == "standard"
    api.put("/api/v1/store/size-charts/tops", json={"csv": CHART_CSV}, headers=brand_headers)

    body = _recommend(api, headers, tee).json()
    assert body["size_chart"] == "brand"
    assert body["recommended_size_label"] == "M"
    assert "Test Store's size chart" in body["fit_note"]


def test_chart_with_unmatched_labels_falls_back_to_standard(
    api, brand, make_product, make_user, set_body_profile, auth_headers
):
    store, brand_headers = brand
    tee = make_product(store, sizes=("S", "M", "L"))
    api.put(
        "/api/v1/store/size-charts/tops",
        json={"rows": [{"size_label": "38", "chest_cm": [80, 90]}]},
        headers=brand_headers,
    )
    shopper = make_user()
    set_body_profile(shopper, body_category="women", chest_cm=92, waist_cm=74)
    assert _recommend(api, auth_headers(shopper), tee).json()["size_chart"] == "standard"


def test_kids_chart_by_height(api, brand, make_product, make_user, set_body_profile, auth_headers):
    store, brand_headers = brand
    top = make_product(store, audience=ProductAudience.GIRLS, sizes=("Small", "Medium", "Large"))
    api.put(
        "/api/v1/store/size-charts/tops",
        json={"csv": "size,height\nSmall,100-115\nMedium,115-130\nLarge,130-145\n"},
        headers=brand_headers,
    )
    parent = make_user()
    headers = auth_headers(parent)
    kid = api.post(
        "/api/v1/users/me/body-profiles",
        json={"name": "Lina", "body_category": "girls", "height_cm": 128},
        headers=headers,
    ).json()
    body = _recommend(api, headers, top, body_profile_id=kid["id"]).json()
    assert body["recommended_size_label"] == "Medium"
    assert body["size_chart"] == "brand"


# --- Fit feedback ---------------------------------------------------------------------


def _report(api, product, fit, make_user, auth_headers, size="M"):
    return api.post(
        "/api/v1/sizing/feedback",
        json={"product_id": str(product.id), "size_label": size, "fit": fit},
        headers=auth_headers(make_user()),
    )


def test_runs_small_feedback_moves_the_size_up(
    api, brand, make_product, make_user, set_body_profile, auth_headers
):
    store, brand_headers = brand
    tee = make_product(store, sizes=("S", "M", "L"))
    shopper = make_user()
    set_body_profile(shopper, body_category="women", chest_cm=98, waist_cm=82)  # standard M
    headers = auth_headers(shopper)

    for fit in ("small", "small"):
        _report(api, tee, fit, make_user, auth_headers)
    body = _recommend(api, headers, tee).json()
    assert body["recommended_size_label"] == "M"  # 2 reports: not enough yet
    assert body["fit_feedback"]["runs"] is None

    r = _report(api, tee, "small", make_user, auth_headers)
    assert r.json() == {"reports": 3, "small": 3, "true_to_size": 0, "large": 0, "runs": "small"}
    body = _recommend(api, headers, tee).json()
    assert body["recommended_size_label"] == "L"
    assert "3 of 3 shoppers say this runs small" in body["fit_note"]

    summary = api.get(f"/api/v1/store/products/{tee.id}/fit-feedback", headers=brand_headers)
    assert summary.json()["runs"] == "small"


def test_runs_large_at_the_smallest_size_says_so(
    api, brand, make_product, make_user, set_body_profile, auth_headers
):
    store, _ = brand
    tee = make_product(store, sizes=("S", "M"))
    for _ in range(3):
        _report(api, tee, "large", make_user, auth_headers, size="S")
    shopper = make_user()
    set_body_profile(shopper, body_category="women", chest_cm=84, waist_cm=66)  # XS -> S stocked
    body = _recommend(api, auth_headers(shopper), tee).json()
    assert body["recommended_size_label"] == "S"
    assert "smallest size already" in body["fit_note"]


def test_reporting_again_replaces_the_verdict(api, brand, make_product, make_user, auth_headers):
    store, _ = brand
    tee = make_product(store)
    headers = auth_headers(make_user())
    for fit in ("small", "large"):
        r = api.post(
            "/api/v1/sizing/feedback",
            json={"product_id": str(tee.id), "size_label": "M", "fit": fit},
            headers=headers,
        )
    assert r.json()["reports"] == 1 and r.json()["large"] == 1


def test_feedback_validation(api, brand, make_product, make_user, auth_headers):
    store, _ = brand
    tee = make_product(store)
    hidden = make_product(store, is_active=False)
    headers = auth_headers(make_user())
    bad_size = {"product_id": str(tee.id), "size_label": "XXXL", "fit": "small"}
    assert api.post("/api/v1/sizing/feedback", json=bad_size, headers=headers).status_code == 422
    bad_fit = {"product_id": str(tee.id), "size_label": "M", "fit": "tiny"}
    assert api.post("/api/v1/sizing/feedback", json=bad_fit, headers=headers).status_code == 422
    gone = {"product_id": str(hidden.id), "size_label": "M", "fit": "small"}
    assert api.post("/api/v1/sizing/feedback", json=gone, headers=headers).status_code == 404
