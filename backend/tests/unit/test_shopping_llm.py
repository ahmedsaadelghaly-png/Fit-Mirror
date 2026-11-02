"""Shopping Assistant: Claude query understanding (fake client) + semantic ranking."""

from decimal import Decimal
from types import SimpleNamespace

import anthropic
import httpx
import pytest

from app.ai import query_understanding
from app.ai.query_understanding import ShoppingIntent, understand
from app.core.config import settings
from app.models.product import ProductAudience
from app.models.user import UserRole
from app.services import shopping_service
from app.services.shopping_service import ShoppingService, from_intent


class FakeMessages:
    def __init__(self, result=None, error=None):
        self.result, self.error, self.calls = result, error, []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.result


def fake_client(result=None, error=None):
    messages = FakeMessages(result, error)
    return SimpleNamespace(beta=SimpleNamespace(messages=messages)), messages


def parsed(intent, stop_reason="end_turn"):
    return SimpleNamespace(parsed_output=intent, stop_reason=stop_reason)


GALA = ShoppingIntent(
    category="dresses",
    audiences=["women"],
    max_price=200,
    colors=["Red"],
    keywords=["gown", "evening dress", "formal"],
    search_text="formal evening gown for a gala",
)


# --- understand() -------------------------------------------------------------------


def test_understand_sends_a_structured_low_effort_request_with_fallbacks(monkeypatch):
    monkeypatch.setattr(settings, "SHOPPING_LLM_MODEL", "claude-opus-5-5")
    client, messages = fake_client(parsed(GALA))

    assert understand("something red for a gala, under $200", client) == GALA
    call = messages.calls[0]
    assert call["model"] == "claude-opus-5-5"
    assert call["output_format"] is ShoppingIntent
    assert call["output_config"] == {"effort": "low"}
    assert call["fallbacks"] == "default"
    assert call["betas"] == ["server-side-fallback-2026-07-01"]
    assert call["messages"] == [{"role": "user", "content": "something red for a gala, under $200"}]


@pytest.mark.parametrize(
    "client",
    [
        fake_client(parsed(None, stop_reason="refusal"))[0],
        fake_client(parsed(None))[0],
        fake_client(error=anthropic.APIConnectionError(request=httpx.Request("POST", "http://x")))[
            0
        ],
        fake_client(
            error=anthropic.InternalServerError(
                "boom",
                response=httpx.Response(500, request=httpx.Request("POST", "http://x")),
                body=None,
            )
        )[0],
    ],
)
def test_understand_returns_none_when_claude_cannot_help(client):
    assert understand("a jacket", client) is None


def test_no_key_means_no_llm_call(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    assert understand("a jacket") is None


def test_intent_maps_onto_engine_filters():
    query = from_intent(GALA, "something red for a gala")
    assert query.category == "dresses"
    assert query.audiences == [ProductAudience.WOMEN]
    assert query.max_price == Decimal("200")
    assert query.terms == ["gown", "evening", "dress", "formal", "red"]
    assert query.understood_by == "llm"


# --- End-to-end through the service --------------------------------------------------


@pytest.fixture
def catalog(make_user, make_store, make_product):
    store = make_store(make_user(UserRole.BRAND_ADMIN))
    gown = make_product(
        store,
        title="Red Evening Gown",
        category="dresses",
        price=149,
        color="Red",
        audience=ProductAudience.WOMEN,
        description="Floor-length satin gown.",
    )
    sundress = make_product(
        store, title="Cotton Sundress", category="dresses", price=49, color="Yellow"
    )
    tee = make_product(store, title="Classic Tee", category="tops", price=20)
    return gown, sundress, tee


def test_llm_synonyms_find_what_the_rules_miss(db, catalog, monkeypatch):
    gown, _, _ = catalog
    query = "something for a gala"

    monkeypatch.setattr(shopping_service, "understand", lambda q: None)
    assert ShoppingService(db).ask(query).matched_product_ids == []

    monkeypatch.setattr(shopping_service, "understand", lambda q: GALA)
    answer = ShoppingService(db).ask(query)
    assert answer.matched_product_ids[0] == gown.id


def test_semantic_similarity_breaks_keyword_ties(db, catalog, monkeypatch):
    gown, sundress, _ = catalog
    monkeypatch.setattr(shopping_service, "understand", lambda q: None)
    # Both dresses match the category; the embedding prefers the evening gown.
    answer = ShoppingService(db).ask("evening dress")
    assert answer.matched_product_ids[:2] == [gown.id, sundress.id]


def test_client_is_built_from_settings(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "sk-test")
    query_understanding._client.cache_clear()
    client = query_understanding._client()
    assert client.api_key == "sk-test" and client.max_retries == 1
    query_understanding._client.cache_clear()
