"""Embeddings and the AI Stylist's feedback loop (taste + pairing model)."""

import random
import uuid

import httpx
import pytest

from app.ai import embeddings
from app.ai.embeddings import HashingEmbedder, VoyageEmbedder, cosine, embed_texts
from app.core.config import settings
from app.models.stylist import OutfitSuggestionRecord
from app.models.wardrobe import WardrobeItem
from app.services.stylist_service import StylistService
from tests.unit.test_ai_features import _add_items

# --- Embeddings ---------------------------------------------------------------------


def test_hashing_embedder_is_deterministic_and_normalized():
    a, b = HashingEmbedder().embed(["Navy wool blazer", "Navy wool blazer"])
    assert a == b
    assert abs(cosine(a, a) - 1.0) < 1e-9


def test_hashing_embedder_puts_shared_vocabulary_closer():
    blazer, wool_blazer, sneaker = HashingEmbedder().embed(
        ["navy blazer", "navy wool blazers", "white running sneakers"]
    )
    assert cosine(blazer, wool_blazer) > cosine(blazer, sneaker)


def test_voyage_embedder_sends_texts_and_reorders_by_index(monkeypatch):
    monkeypatch.setattr(settings, "VOYAGE_API_KEY", "pa-test")
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers["Authorization"]
        seen["body"] = request.read()
        return httpx.Response(
            200,
            json={"data": [{"index": 1, "embedding": [0, 2]}, {"index": 0, "embedding": [3, 0]}]},
        )

    embedder = VoyageEmbedder(httpx.Client(transport=httpx.MockTransport(handler)))
    assert embedder.embed(["first", "second"]) == [[1.0, 0.0], [0.0, 1.0]]
    assert seen["auth"] == "Bearer pa-test"
    assert b'"input":["first","second"]' in seen["body"].replace(b" ", b"")


def test_failing_hosted_embedder_falls_back_to_hashing():
    class Broken:
        name = "broken"

        def embed(self, texts):
            raise httpx.ConnectError("down")

    vectors = embed_texts(["red dress", "blue jeans"], Broken())
    assert vectors == HashingEmbedder().embed(["red dress", "blue jeans"])


def test_default_embedder_is_local_without_a_key(monkeypatch):
    monkeypatch.setattr(settings, "VOYAGE_API_KEY", "")
    embeddings.get_embedder.cache_clear()
    assert isinstance(embeddings.get_embedder(), HashingEmbedder)
    embeddings.get_embedder.cache_clear()


# --- Feedback loop ----------------------------------------------------------------------


@pytest.fixture
def wardrobe(db, make_user):
    user = make_user()
    ids = _add_items(
        db,
        user,
        [
            ("tops", "Navy Linen Shirt"),
            ("tops", "Neon Graphic Tee"),
            ("bottoms", "Beige Chinos"),
            ("bottoms", "Ripped Black Jeans"),
        ],
    )
    return user, ids


def _picks(db, user, count=12):
    picks = []
    for seed in range(count):
        suggestion = StylistService(db, rng=random.Random(seed)).suggest(user.id, "weekend", None)
        picks.append(set(suggestion.wardrobe_item_ids))
    return picks


def test_every_suggestion_is_recorded(db, wardrobe):
    user, ids = wardrobe
    suggestion = StylistService(db, rng=random.Random(0)).suggest(user.id, "weekend", None)
    record = db.get(OutfitSuggestionRecord, suggestion.suggestion_id)
    assert record.user_id == user.id and record.occasion == "weekend"
    assert {str(i) for i in suggestion.wardrobe_item_ids} == set(record.item_ids)


def test_likes_and_dislikes_steer_later_outfits(db, wardrobe):
    user, ids = wardrobe
    service = StylistService(db, rng=random.Random(0))
    liked = OutfitSuggestionRecord(
        user_id=user.id,
        item_ids=[str(ids["Navy Linen Shirt"]), str(ids["Beige Chinos"])],
        item_texts=["Navy Linen Shirt tops", "Beige Chinos bottoms"],
        liked=True,
    )
    disliked = OutfitSuggestionRecord(
        user_id=user.id,
        item_ids=[str(ids["Neon Graphic Tee"]), str(ids["Ripped Black Jeans"])],
        item_texts=["Neon Graphic Tee tops", "Ripped Black Jeans bottoms"],
        liked=False,
    )
    db.add_all([liked, disliked])
    db.commit()

    liked_outfit = {ids["Navy Linen Shirt"], ids["Beige Chinos"]}
    assert all(pick == liked_outfit for pick in _picks(db, user))
    suggestion = service.suggest(user.id, "weekend", None)
    assert "outfits you've liked" in suggestion.rationale


def test_without_feedback_the_occasion_rules_decide(db, wardrobe):
    # "weekend" favors tees and jeans — the baseline the feedback test overrides.
    user, ids = wardrobe
    baseline = {ids["Neon Graphic Tee"], ids["Ripped Black Jeans"]}
    assert all(pick == baseline for pick in _picks(db, user))


def test_liking_an_outfit_generalizes_to_similar_pieces(db, make_user):
    user = make_user()
    ids = _add_items(
        db,
        user,
        [
            ("tops", "Navy Linen Shirt"),
            ("tops", "Navy Linen Overshirt"),
            ("tops", "Neon Graphic Tee"),
            ("bottoms", "Jeans"),
        ],
    )
    # Liked an outfit with a linen shirt, disliked one with the graphic tee;
    # then the liked shirt is deleted from the wardrobe.
    db.add_all(
        [
            OutfitSuggestionRecord(
                user_id=user.id,
                item_ids=[str(ids["Navy Linen Shirt"])],
                item_texts=["Navy Linen Shirt tops"],
                liked=True,
            ),
            OutfitSuggestionRecord(
                user_id=user.id,
                item_ids=[str(ids["Neon Graphic Tee"])],
                item_texts=["Neon Graphic Tee tops"],
                liked=False,
            ),
        ]
    )
    db.commit()
    db.query(WardrobeItem).filter(WardrobeItem.id == ids["Navy Linen Shirt"]).delete()
    db.commit()

    # The taste learned from the deleted shirt now favors the similar
    # overshirt (never rated itself) over the tee the keyword rules prefer.
    assert all(ids["Navy Linen Overshirt"] in pick for pick in _picks(db, user))


def test_feedback_endpoint(api, db, make_user, auth_headers, wardrobe):
    user, _ = wardrobe
    headers = auth_headers(user)
    suggestion = api.post(
        "/api/v1/stylist/suggestions", json={"occasion": "weekend"}, headers=headers
    ).json()

    r = api.post(
        f"/api/v1/stylist/suggestions/{suggestion['suggestion_id']}/feedback",
        json={"liked": True},
        headers=headers,
    )
    assert r.status_code == 204
    db.expire_all()
    record = db.get(OutfitSuggestionRecord, uuid.UUID(suggestion["suggestion_id"]))
    assert record.liked is True

    r = api.post(
        f"/api/v1/stylist/suggestions/{suggestion['suggestion_id']}/feedback",
        json={"liked": False},
        headers=auth_headers(make_user()),
    )
    assert r.status_code == 404
