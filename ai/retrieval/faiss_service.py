"""FAISS retrieval — index build + search (docs/AI_SPECIFICATION.md §5).

Vector id == CaseEmbedding.id (data/crimeintel.db mapping table).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from backend.app.config import settings
from ai.embedding.embedding_service import embed_query, embed_texts, embedding_dim

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SearchHit:
    case_id: int
    score: float


class CaseVectorIndex:
    """Wraps a FAISS flat index plus its id->case_id map file."""

    def __init__(self, index_path: str | Path | None = None):
        self.index_path = Path(index_path or settings.ai_faiss_index)
        self._index = None
        self._vectors: np.ndarray | None = None
        self._ids: list[int] = []
        self._count = 0
        if self.index_path.exists():
            self._load()

    def _load(self) -> None:
        import faiss

        self._index = faiss.read_index(str(self.index_path))
        meta_path = self.index_path.with_suffix(".json")
        if meta_path.exists():
            with meta_path.open("r", encoding="utf-8") as fh:
                meta = json.load(fh)
            self._ids = [int(i) for i in meta["ids"]]
            # vector ids are 0..n-1 in index order
            stored = np.zeros((len(self._ids), embedding_dim()), dtype=np.float32)
            stored[...] = self._index.reconstruct_n(0, self._index.ntotal)
            self._vectors = stored
            self._count = len(self._ids)
        else:
            self._count = self._index.ntotal
            self._ids = list(range(self._count))
            self._vectors = np.asarray(self._index.reconstruct_n(0, self._count), dtype=np.float32)

    @property
    def is_ready(self) -> bool:
        return self._index is not None

    @property
    def count(self) -> int:
        return self._count

    def search(self, query_text: str, top_k: int = 5) -> list[SearchHit]:
        if not self.is_ready:
            raise RuntimeError("FAISS index not loaded — run scripts/build_faiss_index.py first")
        q = embed_query(query_text)
        distances, indices = self._index.search(q.reshape(1, -1), top_k)
        hits: list[SearchHit] = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0 or int(idx) >= len(self._ids):
                continue
            hits.append(SearchHit(case_id=self._ids[int(idx)], score=float(dist)))
        return hits


def build_index(
    texts: list[str],
    ids: list[int],
    index_path: str | Path | None = None,
) -> CaseVectorIndex:
    """Embed `texts` and write a new flat FAISS index + JSON id map.

    `ids` are the CaseEmbedding.id values in the same order as the vectors.
    """
    import faiss

    path = Path(index_path or settings.ai_faiss_index)
    path.parent.mkdir(parents=True, exist_ok=True)

    logger.info("Embedding %d documents with %s ...", len(texts), settings.ai_embedding_model)
    vectors = embed_texts(texts)
    if len(vectors) != len(ids):
        raise ValueError("texts and ids must have the same length")

    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    faiss.write_index(index, str(path))

    meta_path = path.with_suffix(".json")
    with meta_path.open("w", encoding="utf-8") as fh:
        json.dump({"model": settings.ai_embedding_model, "ids": ids}, fh)

    logger.info("Wrote index with %d vectors to %s", len(ids), path)
    return CaseVectorIndex(path)