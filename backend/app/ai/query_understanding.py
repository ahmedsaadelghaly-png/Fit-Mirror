"""
Shopping query understanding: free text -> structured catalog filters.

- With ANTHROPIC_API_KEY set, Claude reads the query and returns a
  validated ShoppingIntent (structured outputs), including synonyms that
  widen recall ("something for a gala" -> gown, dress, formal). Server-side
  refusal fallbacks are on, so a declined request is retried on another
  Claude model before we give up on it.
- Otherwise — or if the call fails, times out, or is refused — the
  rule-based parser (app/services/shopping_service.parse_query) handles it.
Either way the result is the same ParsedQuery shape, so ranking and the
endpoint contract don't care which one ran.
"""

import logging
from decimal import Decimal
from functools import lru_cache
from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

Category = Literal["tops", "bottoms", "dresses", "outerwear", "footwear", "accessories"]
Audience = Literal["women", "men", "girls", "boys"]

SYSTEM_PROMPT = """You turn a shopper's request in a fashion store into search filters.

The catalog has these categories: tops, bottoms, dresses, outerwear, footwear, accessories.
Products are made for women, men, girls, boys, or unisex (adults).

Fill only what the request actually implies; leave the rest empty.
- category: the single best category, or null if the request spans several or none.
- audiences: who it's for. "for my daughter" -> girls; "kids" -> girls and boys.
- min_price / max_price: in the store currency, from phrases like "under $100".
- size: a size label if one is asked for ("size M" -> "M", "32 waist" -> "32").
- colors: colors asked for, as plain color words.
- keywords: garment words and style words to match against product titles and
  descriptions, including close synonyms that improve recall ("gala" -> gown,
  dress, formal; "trainers" -> sneaker). Singular, lowercase, at most 8.
- search_text: a short rewrite of what they want, for semantic search."""


class ShoppingIntent(BaseModel):
    category: Category | None = None
    audiences: list[Audience] = Field(default_factory=list)
    min_price: float | None = None
    max_price: float | None = None
    size: str | None = None
    colors: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    search_text: str = ""


@lru_cache
def _client() -> anthropic.Anthropic:
    # A shopper is waiting: short timeout, one retry, then the rule parser.
    return anthropic.Anthropic(
        api_key=settings.ANTHROPIC_API_KEY,
        timeout=settings.SHOPPING_LLM_TIMEOUT_SECONDS,
        max_retries=1,
    )


def llm_enabled() -> bool:
    return bool(settings.ANTHROPIC_API_KEY)


def understand(query: str, client: anthropic.Anthropic | None = None) -> ShoppingIntent | None:
    """Claude's reading of `query`, or None when unavailable/refused/failed
    (the caller then uses the rule-based parser)."""
    if client is None and not llm_enabled():
        return None
    try:
        response = (client or _client()).beta.messages.parse(
            model=settings.SHOPPING_LLM_MODEL,
            max_tokens=2048,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "low"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": query}],
            output_format=ShoppingIntent,
        )
    except anthropic.APIConnectionError:
        logger.warning("Shopping LLM unreachable; using rule-based parsing.")
        return None
    except anthropic.APIStatusError as exc:
        logger.warning("Shopping LLM error %s; using rule-based parsing.", exc.status_code)
        return None

    if response.stop_reason == "refusal" or response.parsed_output is None:
        logger.info("Shopping LLM gave no usable intent (%s).", response.stop_reason)
        return None
    return response.parsed_output


def to_decimal(value: float | None) -> Decimal | None:
    return None if value is None else Decimal(str(round(value, 2)))
