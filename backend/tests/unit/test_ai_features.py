import random

import pytest

from app.models.user import UserRole
from app.models.wardrobe import WardrobeItem, WardrobeItemSource
from app.services.shopping_service import parse_query
from app.services.stylist_service import StylistService

pytestmark = pytest.mark.unit


# --- Size recommendation -----------------------------------------------------


def test_sizing_picks_chart_size_from_measurements(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(shopper, chest_cm=98, waist_cm=82)
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)), sizes=("S", "M", "L"))

    body = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(product.id)},
        headers=auth_headers(shopper),
    ).json()

    assert body["recommended_size_label"] == "M"
    assert body["confidence"] >= 0.9


def test_sizing_sizes_for_largest_measurement_with_lower_confidence(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(shopper, chest_cm=105, waist_cm=75)  # chest L, waist S
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)))

    body = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(product.id)},
        headers=auth_headers(shopper),
    ).json()

    assert body["recommended_size_label"] == "L"
    assert body["confidence"] < 0.9
    assert "waist" in body["fit_note"]


def test_sizing_only_recommends_stocked_sizes(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(shopper, chest_cm=98)  # M
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)), sizes=("S", "L"))

    body = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(product.id)},
        headers=auth_headers(shopper),
    ).json()

    assert body["recommended_size_label"] == "L"  # tie -> the roomier size
    assert "loose" in body["fit_note"]


def test_sizing_handles_numeric_waist_sizes(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(shopper, waist_cm=82)  # ~32.3in
    jeans = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)),
        category="bottoms",
        sizes=("30", "32", "34", "36"),
    )

    body = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(jeans.id)},
        headers=auth_headers(shopper),
    ).json()

    assert body["recommended_size_label"] == "32"


def test_sizing_asks_for_measurements_when_profile_missing(
    api, make_user, make_store, make_product, auth_headers
):
    product = make_product(make_store(make_user(UserRole.BRAND_ADMIN)))
    response = api.post(
        "/api/v1/sizing/recommend",
        json={"product_id": str(product.id)},
        headers=auth_headers(make_user()),
    )
    assert response.status_code == 422
    assert "chest" in response.json()["message"]


# --- AI Stylist --------------------------------------------------------------


def _add_items(db, user, items):
    created = []
    for category, label in items:
        item = WardrobeItem(
            user_id=user.id,
            source=WardrobeItemSource.UPLOADED,
            category=category,
            label=label,
            image_key=f"k/{label}",
        )
        db.add(item)
        created.append(item)
    db.commit()
    return {item.label: item.id for item in created}


def test_stylist_builds_formal_outfit_with_layer(db, make_user):
    user = make_user()
    ids = _add_items(
        db,
        user,
        [
            ("tops", "Grey Hoodie"),
            ("tops", "White Oxford Shirt"),
            ("bottoms", "Navy Trousers"),
            ("footwear", "Running Sneakers"),
            ("footwear", "Brown Loafers"),
            ("outerwear", "Wool Blazer"),
        ],
    )

    suggestion = StylistService(db, rng=random.Random(0)).suggest(user.id, "job interview", None)

    assert set(suggestion.wardrobe_item_ids) == {
        ids["White Oxford Shirt"],
        ids["Navy Trousers"],
        ids["Brown Loafers"],
        ids["Wool Blazer"],
    }
    assert "job interview" in suggestion.rationale


def test_stylist_adds_outerwear_only_when_cold_for_casual(db, make_user):
    user = make_user()
    ids = _add_items(
        db, user, [("tops", "Tee"), ("bottoms", "Jeans"), ("outerwear", "Puffer Coat")]
    )
    service = StylistService(db, rng=random.Random(0))

    warm = service.suggest(user.id, "weekend", "sunny")
    cold = service.suggest(user.id, "weekend", "cold and rainy")

    assert ids["Puffer Coat"] not in warm.wardrobe_item_ids
    assert ids["Puffer Coat"] in cold.wardrobe_item_ids


def test_stylist_endpoint_handles_empty_wardrobe(api, make_user, auth_headers):
    response = api.post(
        "/api/v1/stylist/suggestions", json={"occasion": "party"}, headers=auth_headers(make_user())
    )
    assert response.status_code == 200
    assert response.json()["wardrobe_item_ids"] == []
    assert "empty" in response.json()["rationale"]


# --- Shopping Assistant ------------------------------------------------------


def test_parse_query_extracts_filters():
    parsed = parse_query("Black jackets under $100 in size M")
    assert parsed.category == "outerwear"
    assert parsed.max_price == 100
    assert parsed.size == "M"
    assert "black" in parsed.terms
    assert "jacket" in parsed.terms


def test_shopping_ask_ranks_and_filters_catalog(
    api, make_user, make_store, make_product, auth_headers
):
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    bomber = make_product(
        store, title="Black Bomber Jacket", category="outerwear", price=89, color="Black"
    )
    make_product(store, title="Wool Overcoat", category="outerwear", price=240, color="Camel")
    make_product(store, title="Black Tee", category="tops", price=20, color="Black")
    make_product(
        store, title="Hidden Jacket", category="outerwear", price=50, color="Black", is_active=False
    )

    body = api.post(
        "/api/v1/shopping/ask",
        json={"query": "black jacket under $100"},
        headers=auth_headers(make_user()),
    ).json()

    assert body["matched_product_ids"] == [str(bomber.id)]
    assert "Black Bomber Jacket" in body["reply"]


def test_shopping_ask_explains_empty_result(api, make_user, auth_headers):
    body = api.post(
        "/api/v1/shopping/ask",
        json={"query": "gold sequin gown"},
        headers=auth_headers(make_user()),
    ).json()
    assert body["matched_product_ids"] == []
    assert "couldn't find" in body["reply"]


def test_catalog_returns_active_products_in_requested_order(
    api, make_user, make_store, make_product, auth_headers
):
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    first, second = make_product(store, title="A"), make_product(store, title="B")
    hidden = make_product(store, title="C", is_active=False)

    body = api.get(
        "/api/v1/catalog/products",
        params=[("ids", str(second.id)), ("ids", str(first.id)), ("ids", str(hidden.id))],
        headers=auth_headers(make_user()),
    ).json()

    assert [p["id"] for p in body] == [str(second.id), str(first.id)]
