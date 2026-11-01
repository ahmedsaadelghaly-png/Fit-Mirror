import pytest

from app.models.product import ProductAudience
from app.models.user import BodyCategory, UserRole
from app.services.shopping_service import parse_query

pytestmark = pytest.mark.unit


# --- Body profile: category + shape rules -----------------------------------


def _put_profile(api, headers, **body):
    return api.put("/api/v1/users/me/body-profile", json=body, headers=headers)


def test_profile_accepts_a_shape_from_its_category(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    response = _put_profile(api, headers, body_category="men", body_shape="trapezoid")
    assert response.status_code == 200
    assert response.json()["body_category"] == "men"
    assert response.json()["body_shape"] == "trapezoid"


def test_profile_rejects_a_shape_from_another_category(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    response = _put_profile(api, headers, body_category="boys", body_shape="hourglass")
    assert response.status_code == 422
    assert "slim, regular, husky" in response.json()["message"]


def test_profile_requires_a_category_before_a_shape(api, make_user, auth_headers):
    response = _put_profile(api, auth_headers(make_user()), body_shape="pear")
    assert response.status_code == 422


def test_switching_category_clears_a_shape_that_no_longer_applies(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    _put_profile(api, headers, body_category="women", body_shape="pear")

    switched = _put_profile(api, headers, body_category="girls").json()

    assert switched["body_category"] == "girls"
    assert switched["body_shape"] is None


def test_partial_update_keeps_existing_category_and_shape(api, make_user, auth_headers):
    headers = auth_headers(make_user())
    _put_profile(api, headers, body_category="women", body_shape="hourglass")

    updated = _put_profile(api, headers, waist_cm=70).json()

    assert (updated["body_category"], updated["body_shape"], updated["waist_cm"]) == (
        "women",
        "hourglass",
        70,
    )


# --- Kids sizing ------------------------------------------------------------


def _recommend(api, headers, product):
    return api.post(
        "/api/v1/sizing/recommend", json={"product_id": str(product.id)}, headers=headers
    )


def test_kids_items_are_sized_by_height(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    child = make_user()
    set_body_profile(child, body_category=BodyCategory.GIRLS, body_shape="regular", height_cm=118)
    top = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)),
        audience=ProductAudience.GIRLS,
        sizes=("4Y", "6Y", "8Y", "10Y"),
    )

    body = _recommend(api, auth_headers(child), top).json()

    assert body["recommended_size_label"] == "8Y"  # 6Y fits up to 116 cm
    assert "118 cm" in body["fit_note"]


def test_husky_fit_sizes_up_one(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    child = make_user()
    set_body_profile(child, body_category=BodyCategory.BOYS, body_shape="husky", height_cm=112)
    cardigan = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)),
        audience=ProductAudience.BOYS,
        sizes=("110-116", "122-128", "134-140"),
    )

    body = _recommend(api, auth_headers(child), cardigan).json()

    assert body["recommended_size_label"] == "122-128"
    assert "husky" in body["fit_note"]


def test_kids_item_needs_a_kids_profile(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    adult = make_user()
    set_body_profile(adult, body_category=BodyCategory.WOMEN, chest_cm=90, height_cm=165)
    top = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)), audience=ProductAudience.GIRLS, sizes=("6Y",)
    )

    response = _recommend(api, auth_headers(adult), top)

    assert response.status_code == 422
    assert "girls' item" in response.json()["message"]


def test_adult_item_with_kids_profile_is_explained(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    child = make_user()
    set_body_profile(child, body_category=BodyCategory.BOYS, height_cm=120, chest_cm=60)
    tee = make_product(make_store(make_user(UserRole.BRAND_ADMIN)))

    response = _recommend(api, auth_headers(child), tee)

    assert response.status_code == 422
    assert "cut for adults" in response.json()["message"]


def test_adult_body_shape_adds_a_fit_tip(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(
        shopper, body_category=BodyCategory.WOMEN, body_shape="pear", waist_cm=72, hip_cm=104
    )
    skirt = make_product(make_store(make_user(UserRole.BRAND_ADMIN)), category="bottoms")

    body = _recommend(api, auth_headers(shopper), skirt).json()

    assert "pear shape" in body["fit_note"]


# --- Shopping Assistant audience --------------------------------------------


def test_parse_query_understands_audience_words():
    assert parse_query("dress for my daughter").audiences == [ProductAudience.GIRLS]
    assert parse_query("men's jacket").audiences == [ProductAudience.MEN]
    assert parse_query("ladies top").audiences == [ProductAudience.WOMEN]
    assert set(parse_query("kids tops").audiences) == {ProductAudience.GIRLS, ProductAudience.BOYS}


def test_shopping_filters_by_audience(api, make_user, make_store, make_product, auth_headers):
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    girls_top = make_product(store, title="Smock Top", audience=ProductAudience.GIRLS)
    make_product(store, title="Plain Tee")  # unisex, adult-sized
    womens_top = make_product(store, title="Silk Blouse", audience=ProductAudience.WOMEN)

    kids = api.post(
        "/api/v1/shopping/ask", json={"query": "tops for kids"}, headers=auth_headers(make_user())
    ).json()
    women = api.post(
        "/api/v1/shopping/ask", json={"query": "women's tops"}, headers=auth_headers(make_user())
    ).json()

    assert kids["matched_product_ids"] == [str(girls_top.id)]
    assert str(womens_top.id) in women["matched_product_ids"]
    assert str(girls_top.id) not in women["matched_product_ids"]


def test_waist_sized_jeans_get_an_accurate_pear_tip(
    api, make_user, make_store, make_product, set_body_profile, auth_headers
):
    shopper = make_user()
    set_body_profile(
        shopper, body_category=BodyCategory.WOMEN, body_shape="pear", waist_cm=81, hip_cm=104
    )
    jeans = make_product(
        make_store(make_user(UserRole.BRAND_ADMIN)), category="bottoms", sizes=("30", "32", "34")
    )

    note = _recommend(api, auth_headers(shopper), jeans).json()["fit_note"]

    assert "go by waist" in note
    assert "sized to your hips" not in note


def test_dress_is_recognized_as_a_category():
    # Regression: the singularizer used to turn "dress" into "dres".
    assert parse_query("women's dress").category == "dresses"
    assert parse_query("red dresses").category == "dresses"
