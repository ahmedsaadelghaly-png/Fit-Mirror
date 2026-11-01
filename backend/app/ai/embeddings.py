"""
Text embeddings for the AI Stylist and Shopping Assistant.

Two embedders behind one interface:

- HashingEmbedder (default): local feature hashing of words and character
  trigrams into a fixed-size vector. No model, no network, deterministic —
  it captures shared vocabulary and spelling ("tee"/"t-shirt" partially),
  not meaning.
- VoyageEmbedder (VOYAGE_API_KEY set): Voyage AI's hosted embedding
  models, which do capture meaning ("gala" ~ "black tie").

Embeddings are computed per request, never stored, so every vector in a
comparison comes from the same embedder; if a Voyage call fails, that
request falls back to hashing as a whole (embed_texts).
"""

import hashlib
import logging
import math
import re
from collections import OrderedDict
from functools import lru_cache
from typing import Protocol

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

Vector = list[float]
HASH_DIM = 512
_WORD = re.compile(r"[a-z0-9]+")


class TextEmbedder(Protocol):
    name: str

    def embed(self, texts: list[str]) -> list[Vector]: ...


def normalize(vector: Vector) -> Vector:
    norm = math.sqrt(sum(x * x for x in vector))
    return [x / norm for x in vector] if norm else vector


def cosine(a: Vector, b: Vector) -> float:
    """Cosine similarity of two already-normalized vectors."""
    return sum(x * y for x, y in zip(a, b, strict=True))


def mean(vectors: list[Vector]) -> Vector | None:
    if not vectors:
        return None
    size = len(vectors)
    return [sum(column) / size for column in zip(*vectors, strict=True)]


def _singular(word: str) -> str:
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word


class HashingEmbedder:
    name = "hashing-v1"

    def embed(self, texts: list[str]) -> list[Vector]:
        return [self._embed_one(text) for text in texts]

    @staticmethod
    def _embed_one(text: str) -> Vector:
        vector = [0.0] * HASH_DIM
        for word in (_singular(w) for w in _WORD.findall(text.lower())):
            features = [(f"w:{word}", 1.0)]
            padded = f"#{word}#"
            features += [(f"c:{padded[i : i + 3]}", 0.3) for i in range(len(padded) - 2)]
            for feature, weight in features:
                digest = hashlib.blake2b(feature.encode(), digest_size=8).digest()
                index = int.from_bytes(digest[:4], "little") % HASH_DIM
                sign = 1.0 if digest[4] & 1 else -1.0
                vector[index] += sign * weight
        return normalize(vector)


class VoyageEmbedder:
    URL = "https://api.voyageai.com/v1/embeddings"

    def __init__(self, client: httpx.Client | None = None):
        self.model = settings.VOYAGE_EMBED_MODEL
        self.name = f"voyage:{self.model}"
        self.client = client or httpx.Client(timeout=20)

    def embed(self, texts: list[str]) -> list[Vector]:
        response = self.client.post(
            self.URL,
            headers={"Authorization": f"Bearer {settings.VOYAGE_API_KEY}"},
            json={"input": texts, "model": self.model},
        )
        response.raise_for_status()
        data = sorted(response.json()["data"], key=lambda item: item["index"])
        return [normalize(item["embedding"]) for item in data]


@lru_cache
def get_embedder() -> TextEmbedder:
    return VoyageEmbedder() if settings.VOYAGE_API_KEY else HashingEmbedder()


_CACHE: "OrderedDict[tuple[str, str], Vector]" = OrderedDict()
_CACHE_SIZE = 5000


def embed_texts(texts: list[str], embedder: TextEmbedder | None = None) -> list[Vector]:
    """Embeds `texts` with one embedder (memoized per text). A hosted
    embedder that fails falls back to hashing for the whole call, so the
    vectors stay comparable with each other."""
    embedder = embedder or get_embedder()
    try:
        return _embed_cached(embedder, texts)
    except (httpx.HTTPError, KeyError, ValueError):
        if isinstance(embedder, HashingEmbedder):
            raise
        logger.warning("Embedder %s failed; using local hashing for this request.", embedder.name)
        return _embed_cached(HashingEmbedder(), texts)


def _embed_cached(embedder: TextEmbedder, texts: list[str]) -> list[Vector]:
    missing = list(dict.fromkeys(t for t in texts if (embedder.name, t) not in _CACHE))
    if missing:
        for text, vector in zip(missing, embedder.embed(missing), strict=True):
            _CACHE[(embedder.name, text)] = vector
            if len(_CACHE) > _CACHE_SIZE:
                _CACHE.popitem(last=False)
    return [_CACHE[(embedder.name, t)] for t in texts]
