"""
Shopping Assistant engine.

1. Understand: a natural-language query ("black jacket under $100 in size
   M") becomes structured filters — category, audience, price bounds, size —
   plus search terms. Claude does this when ANTHROPIC_API_KEY is set
   (app/ai/query_understanding.py, adding synonyms for recall); otherwise,
   or if that call fails, the rule-based parse_query below does.
2. Retrieve: shopper-visible products matching the filters.
3. Rank: keyword hits plus the embedding similarity between the query and
   each product (app/ai/embeddings.py — local hashing, or Voyage AI).

The endpoint contract is unchanged whichever path ran.
"""

import re
import uuid
from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.ai.embeddings import cosine, embed_texts
from app.ai.query_understanding import ShoppingIntent, to_decimal, understand
from app.models.product import Product, ProductAudience

MAX_RESULTS = 10
MAX_SCANNED = 500
# How much the query/product embedding similarity (-1..1) counts against
# one keyword hit when ranking.
SEMANTIC_WEIGHT = 2.0

CATEGORY_SYNONYMS: dict[str, set[str]] = {
    "tops": {"top", "shirt", "tshirt", "t-shirt", "tee", "blouse", "sweater", "polo", "tank"},
    "bottoms": {"bottom", "jean", "pant", "trouser", "short", "skirt", "chino", "legging"},
    "dresses": {"dress", "gown"},
    "outerwear": {"outerwear", "jacket", "coat", "bomber", "blazer", "parka", "hoodie"},
    "footwear": {"footwear", "shoe", "sneaker", "boot", "sandal", "heel", "trainer", "loafer"},
    "accessories": {"accessory", "accessorie", "bag", "belt", "hat", "scarf", "cap", "jewelry"},
}

AUDIENCE_WORDS: dict[str, tuple[ProductAudience, ...]] = {
    **dict.fromkeys(("women", "woman", "ladies", "lady", "female"), (ProductAudience.WOMEN,)),
    **dict.fromkeys(("men", "man", "male", "gent"), (ProductAudience.MEN,)),
    **dict.fromkeys(("girl", "daughter"), (ProductAudience.GIRLS,)),
    **dict.fromkeys(("boy", "son"), (ProductAudience.BOYS,)),
    **dict.fromkeys(
        ("kid", "child", "children", "childrens", "toddler"),
        (ProductAudience.GIRLS, ProductAudience.BOYS),
    ),
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
    audiences: list[ProductAudience] = field(default_factory=list)
    terms: list[str] = field(default_factory=list)
    # What to embed for semantic ranking (the LLM's rewrite, else the query).
    search_text: str = ""
    understood_by: str = "rules"


@dataclass
class ShoppingAnswer:
    matched_product_ids: list[uuid.UUID]
    reply: str


def singularize(word: str) -> str:
    """Crude plural stripping: "dresses" -> "dress", "jeans" -> "jean", but
    "dress"/"glass" stay as they are."""
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word


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
        word = singularize(raw)
        if word in STOPWORDS:
            continue
        audience_key = raw if raw in AUDIENCE_WORDS else word  # "ladies" -> "ladie"
        if audience_key in AUDIENCE_WORDS:
            for audience in AUDIENCE_WORDS[audience_key]:
                if audience not in parsed.audiences:
                    parsed.audiences.append(audience)
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


def from_intent(intent: ShoppingIntent, query: str) -> ParsedQuery:
    """The LLM's structured reading of a query, as the engine's ParsedQuery."""
    terms: list[str] = []
    for raw in [*intent.keywords, *intent.colors]:
        for word in re.findall(r"[a-z][a-z-]*", raw.lower()):
            word = singularize(word)
            if word not in STOPWORDS and word not in terms:
                terms.append(word)
    return ParsedQuery(
        category=intent.category,
        min_price=to_decimal(intent.min_price),
        max_price=to_decimal(intent.max_price),
        size=intent.size.strip().upper() if intent.size and intent.size.strip() else None,
        audiences=[ProductAudience(audience) for audience in dict.fromkeys(intent.audiences)],
        terms=terms[:12],
        search_text=intent.search_text or query,
        understood_by="llm",
    )


def _product_text(product: Product) -> str:
    colors = " ".join(dict.fromkeys(v.color for v in product.variants if v.color))
    return f"{product.title} {product.description or ''} {product.category} {colors}"


class ShoppingService:
    def __init__(self, db: Session):
        self.db = db

    def ask(self, query: str) -> ShoppingAnswer:
        intent = understand(query)
        parsed = from_intent(intent, query) if intent else parse_query(query)
        parsed.search_text = parsed.search_text or query

        q = (
            self.db.query(Product)
            .options(selectinload(Product.variants))
            .filter(Product.visible_to_shoppers())
        )
        if parsed.category:
            q = q.filter(Product.category == parsed.category)
        if parsed.audiences:
            # Adult searches also match unisex items; our unisex items are
            # adult-sized, so kids' searches don't.
            allowed = list(parsed.audiences)
            if not set(allowed) <= {ProductAudience.GIRLS, ProductAudience.BOYS}:
                allowed.append(ProductAudience.UNISEX)
            q = q.filter(Product.audience.in_(allowed))
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

        vectors = embed_texts([parsed.search_text, *(_product_text(p) for p in candidates)])
        query_vector, product_vectors = vectors[0], dict(zip(candidates, vectors[1:], strict=True))

        ranked: list[tuple[int, float, Product]] = []
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
            score = hits + SEMANTIC_WEIGHT * cosine(query_vector, product_vectors[product])
            ranked.append((hits, score, product))

        ranked.sort(key=lambda entry: entry[1], reverse=True)
        if parsed.category and parsed.terms and any(hits for hits, _, _ in ranked):
            ranked = [entry for entry in ranked if entry[0] > 0]
        matches = [product for _, _, product in ranked[:MAX_RESULTS]]

        return ShoppingAnswer([p.id for p in matches], self._reply(query, parsed, matches))

    @staticmethod
    def _reply(query: str, parsed: ParsedQuery, matches: list[Product]) -> str:
        filters = []
        if parsed.audiences:
            filters.append(" & ".join(a.value for a in parsed.audiences))
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
