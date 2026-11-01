"""
AI Stylist engine.

Assembles one outfit from the caller's own wardrobe: a base (dress, or
top + bottom), footwear, an outer layer when the weather or occasion calls
for one, and an accessory. Each candidate item is scored by:

- occasion fit — keyword rules (formality, clashes, weather) plus the
  embedding similarity between the item and the occasion;
- favorite colors from the body profile;
- learned taste — every suggestion is stored, and the shopper's likes and
  dislikes form a taste vector (liked items minus disliked items, in
  embedding space) that pulls similar pieces up;
- learned compatibility — each pick is scored against the pieces already
  chosen: pairs resembling pairs from liked outfits score up, pairs like
  those in disliked outfits score down.

Ties are broken randomly, so asking again gives a different outfit.
Embeddings come from app/ai/embeddings.py (local hashing, or Voyage AI).
"""

import random
import re
import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.ai.embeddings import Vector, cosine, embed_texts, mean, normalize
from app.core.exceptions import NotFoundError
from app.models.stylist import OutfitSuggestionRecord
from app.models.user import BodyProfile
from app.models.wardrobe import WardrobeItem
from app.services.shopping_service import singularize

# Occasion -> (formality bucket, keywords in an item label that suit it).
OCCASION_STYLES: dict[str, tuple[str, set[str]]] = {
    "work": (
        "smart",
        {"blazer", "shirt", "oxford", "chino", "trouser", "loafer", "blouse", "pencil"},
    ),
    "office": ("smart", {"blazer", "shirt", "oxford", "chino", "trouser", "loafer", "blouse"}),
    "interview": ("formal", {"blazer", "suit", "shirt", "trouser", "oxford", "loafer"}),
    "wedding": ("formal", {"suit", "dress", "gown", "heel", "blazer", "silk", "tie"}),
    "formal": ("formal", {"suit", "dress", "gown", "heel", "blazer", "silk", "tie"}),
    "party": ("dressy", {"dress", "silk", "satin", "heel", "sequin", "leather"}),
    "date": ("dressy", {"dress", "silk", "shirt", "heel", "leather", "knit"}),
    "dinner": ("dressy", {"dress", "shirt", "blazer", "loafer", "heel", "knit"}),
    "gym": ("active", {"legging", "jogger", "sneaker", "trainer", "sport", "tank", "short"}),
    "workout": ("active", {"legging", "jogger", "sneaker", "trainer", "sport", "tank", "short"}),
    "casual": ("casual", {"tee", "t-shirt", "jean", "denim", "sneaker", "hoodie", "sweatshirt"}),
    "weekend": ("casual", {"tee", "t-shirt", "jean", "denim", "sneaker", "hoodie", "sweatshirt"}),
    "beach": ("casual", {"short", "linen", "sandal", "tank", "swim"}),
}

# Labels that clash with a formality bucket.
CLASHES: dict[str, set[str]] = {
    "formal": {"hoodie", "jogger", "sneaker", "sweatshirt", "short", "legging", "tank"},
    "smart": {"hoodie", "jogger", "sweatshirt", "legging", "tank"},
    "dressy": {"hoodie", "jogger", "sweatshirt", "legging"},
    "active": {"suit", "blazer", "heel", "silk", "loafer", "oxford"},
    "casual": set(),
}

COLD_WORDS = {
    "cold",
    "cool",
    "chilly",
    "freezing",
    "snow",
    "winter",
    "windy",
    "rain",
    "rainy",
    "wet",
}
HOT_WORDS = {"hot", "warm", "sunny", "summer", "humid"}

# Favorite-color preferences (body profile) -> label words that express them.
COLOR_WORDS: dict[str, set[str]] = {
    "pastel": {"pastel", "pink", "lilac", "mint", "blush", "lavender"},
    "bold-print": {"print", "graphic", "pattern", "floral", "stripe", "polka"},
    "navy": {"navy", "indigo"},
    "beige": {"beige", "camel", "sand", "cream", "tan"},
    "burgundy": {"burgundy", "wine", "maroon", "oxblood"},
}


# How many recent reactions shape the taste model, and how much each signal weighs.
FEEDBACK_WINDOW = 50
OCCASION_WEIGHT = 1.0
TASTE_WEIGHT = 2.0
PAIRING_WEIGHT = 2.0
# Direct per-item signal: each like/dislike of an outfit containing the item.
AFFINITY_WEIGHT = 1.5
MAX_AFFINITY = 3


@dataclass
class OutfitSuggestion:
    suggestion_id: uuid.UUID
    wardrobe_item_ids: list[uuid.UUID]
    rationale: str


@dataclass
class TasteModel:
    """Learned from the shopper's liked/disliked outfits."""

    taste: Vector | None
    liked_pairs: list[Vector]
    disliked_pairs: list[Vector]
    # Wardrobe item id -> (#liked outfits it was in) - (#disliked ones).
    affinity: dict[uuid.UUID, int]

    @property
    def is_trained(self) -> bool:
        return bool(self.taste or self.liked_pairs or self.disliked_pairs)


def _pair(a: Vector, b: Vector) -> Vector:
    return normalize([x + y for x, y in zip(a, b, strict=True)])


def _item_text(item: WardrobeItem) -> str:
    return f"{item.label or ''} {item.category}".strip()


def _words(text: str | None) -> set[str]:
    words = set(re.findall(r"[a-z][a-z-]*", (text or "").lower()))
    # Crude singularization so "jeans"/"sneakers" match "jean"/"sneaker".
    return words | {singularize(w) for w in words}


def _describe(item: WardrobeItem) -> str:
    return item.label or f"your {item.category.rstrip('s')}"


class StylistService:
    def __init__(self, db: Session, rng: random.Random | None = None):
        self.db = db
        self.rng = rng or random.Random()

    def suggest(
        self, user_id: uuid.UUID, occasion: str | None, weather: str | None
    ) -> OutfitSuggestion:
        items = self.db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).all()
        if not items:
            return OutfitSuggestion(
                uuid.uuid4(),
                [],
                "Your wardrobe is empty — add a few pieces (a top, a bottom, and shoes are a "
                "great start) and I'll put outfits together from them.",
            )

        favorite_color_words = self._favorite_color_words(user_id)
        vectors = dict(
            zip(
                (item.id for item in items),
                embed_texts([_item_text(item) for item in items]),
                strict=True,
            )
        )
        model = self._taste_model(user_id)
        occasion_words = _words(occasion)
        weather_words = _words(weather)
        style_key = next((key for key in OCCASION_STYLES if key in occasion_words), "casual")
        formality, keywords = OCCASION_STYLES[style_key]
        is_cold = bool(weather_words & COLD_WORDS)
        is_hot = bool(weather_words & HOT_WORDS)

        by_category: dict[str, list[WardrobeItem]] = {}
        for item in items:
            by_category.setdefault(item.category.lower(), []).append(item)

        occasion_vector = embed_texts(
            [" ".join([occasion or "", weather or "", *sorted(keywords)])]
        )[0]

        def pick(category: str, chosen: list[WardrobeItem]) -> WardrobeItem | None:
            candidates = by_category.get(category)
            if not candidates:
                return None

            def score(item: WardrobeItem) -> float:
                label_words = _words(item.label)
                value = 2.0 * len(label_words & keywords) - 3.0 * len(
                    label_words & CLASHES[formality]
                )
                if is_hot and label_words & {"wool", "knit", "sweater", "coat", "boot"}:
                    value -= 1.5
                if label_words & favorite_color_words:
                    value += 1.0
                vector = vectors[item.id]
                value += OCCASION_WEIGHT * cosine(vector, occasion_vector)
                if model.taste:
                    value += TASTE_WEIGHT * cosine(vector, model.taste)
                affinity = model.affinity.get(item.id, 0)
                value += AFFINITY_WEIGHT * max(-MAX_AFFINITY, min(MAX_AFFINITY, affinity))
                for other in chosen:
                    value += PAIRING_WEIGHT * self._pairing(model, vector, vectors[other.id])
                return value + self.rng.random()  # random tie-break between equals

            return max(candidates, key=score)

        outfit: list[WardrobeItem] = []
        prefers_dress = formality in {"formal", "dressy"}
        dress = pick("dresses", [])
        top = pick("tops", [])
        bottom = pick("bottoms", [top] if top else [])
        if dress and (prefers_dress or not (top and bottom)):
            outfit.append(dress)
        else:
            outfit.extend(item for item in (top, bottom) if item)

        if shoes := pick("footwear", outfit):
            outfit.append(shoes)
        layer = pick("outerwear", outfit)
        if layer and (is_cold or (formality in {"formal", "smart"} and not is_hot)):
            outfit.append(layer)
        if formality != "active" and (accessory := pick("accessories", outfit)):
            outfit.append(accessory)

        if not outfit:
            # Wardrobe only has categories outside the outfit template.
            outfit = [self.rng.choice(items)]

        rationale = self._rationale(outfit, occasion, style_key, is_cold, is_hot, by_category)
        if model.is_trained:
            rationale += " I leaned toward pieces like the outfits you've liked."
        record = OutfitSuggestionRecord(
            user_id=user_id,
            item_ids=[str(item.id) for item in outfit],
            item_texts=[_item_text(item) for item in outfit],
            occasion=(occasion or None) and occasion[:200],
            weather=(weather or None) and weather[:200],
        )
        self.db.add(record)
        self.db.commit()
        return OutfitSuggestion(record.id, [item.id for item in outfit], rationale)

    def record_feedback(self, user_id: uuid.UUID, suggestion_id: uuid.UUID, liked: bool) -> None:
        record = (
            self.db.query(OutfitSuggestionRecord)
            .filter(
                OutfitSuggestionRecord.id == suggestion_id,
                OutfitSuggestionRecord.user_id == user_id,
            )
            .first()
        )
        if not record:
            raise NotFoundError("Suggestion not found.")
        record.liked = liked
        self.db.commit()

    def _taste_model(self, user_id: uuid.UUID) -> TasteModel:
        rated = (
            self.db.query(OutfitSuggestionRecord)
            .filter(
                OutfitSuggestionRecord.user_id == user_id,
                OutfitSuggestionRecord.liked.is_not(None),
            )
            .order_by(OutfitSuggestionRecord.updated_at.desc())
            .limit(FEEDBACK_WINDOW)
            .all()
        )
        liked_items: list[Vector] = []
        disliked_items: list[Vector] = []
        liked_pairs: list[Vector] = []
        disliked_pairs: list[Vector] = []
        affinity: dict[uuid.UUID, int] = {}
        # Embedded from the texts saved with each suggestion, so the taste
        # model carries over to similar pieces, even ones added later.
        all_texts = [text for record in rated for text in record.item_texts]
        text_vectors = dict(zip(all_texts, embed_texts(all_texts), strict=True))
        for record in rated:
            for raw in record.item_ids:
                item_id = uuid.UUID(raw)
                affinity[item_id] = affinity.get(item_id, 0) + (1 if record.liked else -1)
            outfit = [text_vectors[text] for text in record.item_texts]
            (liked_items if record.liked else disliked_items).extend(outfit)
            pairs = liked_pairs if record.liked else disliked_pairs
            pairs.extend(_pair(a, b) for i, a in enumerate(outfit) for b in outfit[i + 1 :])

        liked_mean, disliked_mean = mean(liked_items), mean(disliked_items)
        if liked_mean and disliked_mean:
            taste = normalize([a - b for a, b in zip(liked_mean, disliked_mean, strict=True)])
        elif liked_mean:
            taste = normalize(liked_mean)
        elif disliked_mean:
            taste = normalize([-x for x in disliked_mean])
        else:
            taste = None
        return TasteModel(taste, liked_pairs, disliked_pairs, affinity)

    @staticmethod
    def _pairing(model: TasteModel, a: Vector, b: Vector) -> float:
        """How much (a, b) resembles pairs from liked outfits, minus disliked ones."""
        if not (model.liked_pairs or model.disliked_pairs):
            return 0.0
        pair = _pair(a, b)
        liked = max((cosine(pair, p) for p in model.liked_pairs), default=0.0)
        disliked = max((cosine(pair, p) for p in model.disliked_pairs), default=0.0)
        return liked - disliked

    def _favorite_color_words(self, user_id: uuid.UUID) -> set[str]:
        colors = (
            self.db.query(BodyProfile.favorite_colors)
            .filter(BodyProfile.user_id == user_id, BodyProfile.is_primary)
            .scalar()
        )
        words: set[str] = set()
        for color in colors or []:
            words |= COLOR_WORDS.get(color, {color})
        return words

    @staticmethod
    def _rationale(
        outfit: list[WardrobeItem],
        occasion: str | None,
        style_key: str,
        is_cold: bool,
        is_hot: bool,
        by_category: dict[str, list[WardrobeItem]],
    ) -> str:
        context = f"For {occasion.strip()}" if occasion and occasion.strip() else "For an easy day"
        if is_cold:
            context += " in cooler weather"
        elif is_hot:
            context += " in the heat"

        names = [_describe(item) for item in outfit]
        if len(names) == 1:
            body = f"try {names[0]}."
        else:
            body = f"try {', '.join(names[:-1])} with {names[-1]}."

        tips = []
        if is_cold and not any(i.category.lower() == "outerwear" for i in outfit):
            tips.append("You don't have outerwear saved yet — a jacket would complete this.")
        if not by_category.get("footwear"):
            tips.append("Add some shoes to your wardrobe so I can finish the look.")
        if style_key in {"formal", "interview", "wedding"} and not any(
            i.category.lower() in {"dresses", "outerwear"} for i in outfit
        ):
            tips.append("A blazer or dress would make this feel more formal.")

        return " ".join([f"{context}, {body}", *tips])
