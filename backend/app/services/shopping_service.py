"""
Shopping Assistant engine (rule-based v1).

Turns a natural-language query ("black jacket under $100 in size M") into
structured catalog filters — category, price bounds, size — plus free-text
terms, then ranks active products by how many terms they match. An LLM or
embedding search can replace the parsing/ranking later without changing
the endpoint contract (ROADMAP Phase 5).
"""

import re
import uuid
from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product

MAX_RESULTS = 10
MAX_SCANNED = 500

CATEGORY_SYNONYMS: dict[str, set[str]] = {
    "tops": {"top", "shirt", "tshirt", "t-shirt", "tee", "blouse", "sweater", "polo", "tank"},
    "bottoms": {"bottom", "jean", "pant", "trouser", "short", "skirt", "chino", "legging"},
    "dresses": {"dress", "gown"},
    "outerwear": {"outerwear", "jacket", "coat", "bomber", "blazer", "parka", "hoodie"},
    "footwear": {"footwear", "shoe", "sneaker", "boot", "sandal", "heel", "trainer", "loafer"},
    "accessories": {"accessory", "accessorie", "bag", "belt", "hat", "scarf", "cap", "jewelry"},
}

STOPWORDS = set(
    "a an the and or for with in on of to me my i want need looking find show some any "
    "something please can you get buy under below over above less more than size cheap max "
    "min around about is are that this what have".split()
)

PRICE_MAX = re.compile(
    r"(?:under|below|less than|cheaper than|max|up to|<)\s*\$?\s*(\d+(?:\.\d+)?)"
)
PRICE_MIN = re.compile(r"(?:over|above|more than|at least|min|>)\s*\$?\s*(\d+(?:\.\d+)?)")
SIZE = re.compile(r"\bsize\s+([a-z0-9]{1,4})\b")


@dataclass
class ParsedQuery:
    category: str | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    size: str | None = None
    terms: list[str] = field(default_factory=list)


@dataclass
class ShoppingAnswer:
    matched_product_ids: list[uuid.UUID]
    reply: str


def _singular(word: str) -> str:
    return word[:-1] if word.endswith("s") and len(word) > 3 else word


def parse_query(query: str) -> ParsedQuery:
    text = query.lower()
    parsed = ParsedQuery()

    if match := PRICE_MAX.search(text):
        parsed.max_price = Decimal(match.group(1))
    if match := PRICE_MIN.search(text):
        parsed.min_price = Decimal(match.group(1))
    if match := SIZE.search(text):
        parsed.size = match.group(1).upper()

    # Strip the parsed fragments so their numbers/words aren't searched as terms.
    for pattern in (PRICE_MAX, PRICE_MIN, SIZE):
        text = pattern.sub(" ", text)

    for raw in re.findall(r"[a-z][a-z-]*", text):
        word = _singular(raw)
        if word in STOPWORDS:
            continue
        category = next((c for c, words in CATEGORY_SYNONYMS.items() if word in words), None)
        if category and parsed.category is None:
            parsed.category = category
            # Keep specific garment words ("jacket") as terms; drop the
            # generic category word itself ("outerwear").
            if word not in {"top", "bottom", "outerwear", "footwear", "accessory", "accessorie"}:
                parsed.terms.append(word)
        elif word not in parsed.terms:
            parsed.terms.append(word)
    return parsed


class ShoppingService:
    def __init__(self, db: Session):
        self.db = db

    def ask(self, query: str) -> ShoppingAnswer:
        parsed = parse_query(query)

        q = (
            self.db.query(Product)
            .options(selectinload(Product.variants))
            .filter(Product.visible_to_shoppers())
        )
        if parsed.category:
            q = q.filter(Product.category == parsed.category)
        if parsed.max_price is not None:
            q = q.filter(Product.price <= parsed.max_price)
        if parsed.min_price is not None:
            q = q.filter(Product.price >= parsed.min_price)
        if parsed.terms and not parsed.category:
            # Narrow in SQL when there's no category to lean on. Terms are
            # [a-z-] only (see parse_query), so no LIKE wildcards to escape.
            q = q.filter(
                or_(
                    *(
                        column.ilike(f"%{term}%")
                        for term in parsed.terms
                        for column in (Product.title, Product.description, Product.category)
                    )
                )
            )
        candidates = q.order_by(Product.created_at.desc()).limit(MAX_SCANNED).all()

        ranked: list[tuple[int, Product]] = []
        for product in candidates:
            if parsed.size and not any(
                v.size_label.upper() == parsed.size and v.stock_quantity > 0
                for v in product.variants
            ):
                continue
            haystack = " ".join(
                [product.title, product.description or "", product.category]
                + [v.color or "" for v in product.variants]
            ).lower()
            hits = sum(1 for term in parsed.terms if term in haystack)
            # With a category, terms only rank; without one, they must match.
            if parsed.terms and hits == 0 and not parsed.category:
                continue
            ranked.append((hits, product))

        ranked.sort(key=lambda pair: pair[0], reverse=True)
        if parsed.category and parsed.terms and any(hits for hits, _ in ranked):
            ranked = [pair for pair in ranked if pair[0] > 0]
        matches = [product for _, product in ranked[:MAX_RESULTS]]

        return ShoppingAnswer([p.id for p in matches], self._reply(query, parsed, matches))

    @staticmethod
    def _reply(query: str, parsed: ParsedQuery, matches: list[Product]) -> str:
        filters = []
        if parsed.category:
            filters.append(parsed.category)
        if parsed.size:
            filters.append(f"in size {parsed.size}")
        if parsed.min_price is not None:
            filters.append(f"over ${parsed.min_price:g}")
        if parsed.max_price is not None:
            filters.append(f"under ${parsed.max_price:g}")
        scope = f" ({', '.join(filters)})" if filters else ""

        if not matches:
            return (
                f'I couldn\'t find anything for "{query.strip()}"{scope}. '
                "Try fewer words, a broader category, or a higher budget."
            )

        listed = "; ".join(f"{p.title} — {p.currency} {p.price:.2f}" for p in matches[:3])
        more = f", plus {len(matches) - 3} more" if len(matches) > 3 else ""
        noun = "match" if len(matches) == 1 else "matches"
        return f"I found {len(matches)} {noun}{scope}: {listed}{more}."
