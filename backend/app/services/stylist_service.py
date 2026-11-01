"""
AI Stylist engine (rule-based v1).

Assembles one outfit from the caller's own wardrobe: a base (dress, or
top + bottom), footwear, an outer layer when the weather or occasion calls
for one, and an accessory. Items are ranked by how well their labels fit
the requested occasion; ties are broken randomly so asking again gives a
different outfit. An embedding/LLM-based stylist can replace this behind
the same endpoint contract (ROADMAP Phase 3).
"""

import random
import re
import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

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


@dataclass
class OutfitSuggestion:
    suggestion_id: uuid.UUID
    wardrobe_item_ids: list[uuid.UUID]
    rationale: str


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
        occasion_words = _words(occasion)
        weather_words = _words(weather)
        style_key = next((key for key in OCCASION_STYLES if key in occasion_words), "casual")
        formality, keywords = OCCASION_STYLES[style_key]
        is_cold = bool(weather_words & COLD_WORDS)
        is_hot = bool(weather_words & HOT_WORDS)

        by_category: dict[str, list[WardrobeItem]] = {}
        for item in items:
            by_category.setdefault(item.category.lower(), []).append(item)

        def pick(category: str) -> WardrobeItem | None:
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
                return value + self.rng.random()  # random tie-break between equals

            return max(candidates, key=score)

        outfit: list[WardrobeItem] = []
        prefers_dress = formality in {"formal", "dressy"}
        dress = pick("dresses")
        top, bottom = pick("tops"), pick("bottoms")
        if dress and (prefers_dress or not (top and bottom)):
            outfit.append(dress)
        else:
            outfit.extend(item for item in (top, bottom) if item)

        if shoes := pick("footwear"):
            outfit.append(shoes)
        layer = pick("outerwear")
        if layer and (is_cold or (formality in {"formal", "smart"} and not is_hot)):
            outfit.append(layer)
        if formality != "active" and (accessory := pick("accessories")):
            outfit.append(accessory)

        if not outfit:
            # Wardrobe only has categories outside the outfit template.
            outfit = [self.rng.choice(items)]

        return OutfitSuggestion(
            uuid.uuid4(),
            [item.id for item in outfit],
            self._rationale(outfit, occasion, style_key, is_cold, is_hot, by_category),
        )

    def _favorite_color_words(self, user_id: uuid.UUID) -> set[str]:
        colors = (
            self.db.query(BodyProfile.favorite_colors)
            .filter(BodyProfile.user_id == user_id)
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
