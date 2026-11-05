"""Shop filter: adults see unisex items too; children's items stay separate."""

import pytest

from app.models.product import ProductAudience
from app.models.user import UserRole

URL = "/api/v1/catalog/products"


@pytest.fixture
def titles(api, make_user, make_store, make_product, auth_headers):
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    for audience in ProductAudience:
        make_product(store, title=audience.value, audience=audience)
    headers = auth_headers(make_user())

    def _titles(audience: str) -> set[str]:
        response = api.get(URL, params={"audience": audience}, headers=headers)
        assert response.status_code == 200, response.text
        return {product["title"] for product in response.json()}

    return _titles


def test_men_and_women_include_unisex(titles):
    assert titles("men") == {"men", "unisex"}
    assert titles("women") == {"women", "unisex"}


def test_childrens_filters_exclude_adult_sized_unisex(titles):
    assert titles("girls") == {"girls"}
    assert titles("boys") == {"boys"}


def test_unisex_filter_stays_exact(titles):
    assert titles("unisex") == {"unisex"}
