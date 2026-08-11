"""Embedding service — Sentence Transformers wrapper (docs/AI_SPECIFICATION.md §4).

Lazy-loaded singleton; model cached on disk after first download. Must never be
loaded per-request (docs/AGENT_CONTEXT.md §23).
"""

from __future__ import annotations

import numpy as np
from functools import lru_cache

from backend.app.config import settings

_MODEL = None


def _load():
    global _MODEL
    if _MODEL is None:
        from sentence_transformers import SentenceTransformer

        _MODEL = SentenceTransformer(settings.ai_embedding_model)
    return _MODEL


def embed_texts(texts: list[str]) -> np.ndarray:
    """Return normalized float32 embeddings of shape (len(texts), dim)."""
    model = _load()
    vectors: np.ndarray = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return vectors.astype(np.float32)


def embed_query(text: str) -> np.ndarray:
    return embed_texts([text])[0]


@lru_cache(maxsize=1)
def embedding_dim() -> int:
    model = _load()
    getter = getattr(model, "get_embedding_dimension", None) or model.get_sentence_embedding_dimension
    return int(getter())


def unload() -> None:
    """Release the model (used by tests)."""
    global _MODEL
    _MODEL = None