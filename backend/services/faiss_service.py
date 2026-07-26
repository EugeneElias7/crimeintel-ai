import json
import logging
import os
import tempfile
from typing import Dict, List, Optional, Tuple

import numpy as np

from config import settings

logger = logging.getLogger(__name__)


class FAISSService:
    _instance: Optional["FAISSService"] = None
    _index = None
    _id_mapping: Optional[Dict[int, str]] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, dimension: int = 384) -> None:
        if not getattr(self, "_initialized", False):
            self.dimension = dimension
            self._index = None
            self._id_mapping = None
            self._initialized = True

    async def load_index(self) -> None:
        if self._index is not None:
            return

        import faiss

        index_path = settings.FAISS_INDEX_PATH
        if os.path.exists(index_path):
            try:
                self._index = faiss.read_index(index_path)
                logger.info("FAISS index loaded from %s", index_path)
                return
            except Exception as e:
                logger.warning("Failed to load FAISS index from %s: %s", index_path, e)

        logger.info("Creating new FAISS index with dimension %d", self.dimension)
        self._index = faiss.IndexFlatL2(self.dimension)

    async def search(
        self, query_vector: List[float], k: int = 10
    ) -> List[Tuple[int, float]]:
        await self.load_index()

        if self._index is None or self._index.ntotal == 0:
            return []

        query_np = np.array([query_vector], dtype=np.float32)
        distances, indices = self._index.search(query_np, k)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1:
                continue
            similarity = float(1.0 / (1.0 + distances[0][i]))
            results.append((int(idx), similarity))

        return results

    async def build_index(
        self, case_embeddings: List[Tuple[str, List[float]]]
    ) -> None:
        import faiss

        if not case_embeddings:
            raise ValueError("No embeddings provided to build index")

        vectors = []
        id_mapping: Dict[int, str] = {}

        for i, (case_id, embedding) in enumerate(case_embeddings):
            vec = np.array(embedding, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            vectors.append(vec)
            id_mapping[i] = case_id

        self._id_mapping = id_mapping
        vectors_np = np.array(vectors, dtype=np.float32)

        self._index = faiss.IndexFlatL2(self.dimension)
        self._index.add(vectors_np)

        os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)
        faiss.write_index(self._index, settings.FAISS_INDEX_PATH)
        logger.info(
            "FAISS index built with %d vectors and saved to %s",
            len(vectors),
            settings.FAISS_INDEX_PATH,
        )

        mapping_path = settings.FAISS_INDEX_PATH.replace(".bin", "_mapping.json")
        with open(mapping_path, "w") as f:
            json.dump(id_mapping, f)

    async def get_id_mapping(self) -> Dict[int, str]:
        if self._id_mapping is not None:
            return self._id_mapping

        mapping_path = settings.FAISS_INDEX_PATH.replace(".bin", "_mapping.json")
        if os.path.exists(mapping_path):
            try:
                with open(mapping_path, "r") as f:
                    raw = json.load(f)
                self._id_mapping = {int(k): v for k, v in raw.items()}
                return self._id_mapping or {}
            except Exception as e:
                logger.warning("Failed to load ID mapping: %s", e)

        return {}
