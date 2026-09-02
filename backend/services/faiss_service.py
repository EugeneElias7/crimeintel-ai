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

    async def add(self, case_id: str, embedding: List[float]) -> None:
        """Add a single vector to index (RAG sync)."""
        try:
            await self.load_index()
            import faiss
            if self._index is None:
                self._index = faiss.IndexFlatL2(self.dimension)
                self._id_mapping = {}
            vec = np.array([embedding], dtype=np.float32)
            # normalize
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            # append id mapping
            next_idx = self._index.ntotal
            self._index.add(vec)
            if self._id_mapping is None:
                self._id_mapping = await self.get_id_mapping()
            self._id_mapping[next_idx] = case_id
            # persist
            os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)
            faiss.write_index(self._index, settings.FAISS_INDEX_PATH)
            mapping_path = settings.FAISS_INDEX_PATH.replace(".bin", "_mapping.json")
            # json keys as strings for consistency with build script
            with open(mapping_path, "w") as f:
                json.dump({str(k): v for k, v in self._id_mapping.items()}, f)
            logger.info("FAISS add: case_id=%s idx=%d total=%d", case_id, next_idx, self._index.ntotal)
        except Exception as e:
            logger.warning("FAISS add failed for %s: %s", case_id, e)

    async def update(self, case_id: str, embedding: List[float]) -> None:
        """Update vector for case_id by rebuilding mapping (remove+add with rebuild fallback)."""
        try:
            mapping = await self.get_id_mapping()
            # find idx for case_id
            target_idx = None
            for idx, cid in mapping.items():
                if cid == case_id:
                    target_idx = idx
                    break
            if target_idx is None:
                await self.add(case_id, embedding)
                return
            # For IndexFlatL2 we cannot in-place update; rebuild index without old and add new
            await self.remove(case_id)
            await self.add(case_id, embedding)
            logger.info("FAISS update: case_id=%s", case_id)
        except Exception as e:
            logger.warning("FAISS update failed for %s: %s", case_id, e)

    async def remove(self, case_id: str) -> None:
        """Remove vector for case_id by rebuilding index."""
        try:
            await self.load_index()
            import faiss
            mapping = await self.get_id_mapping()
            if not mapping:
                return
            # find idx
            target_idx = None
            for idx, cid in mapping.items():
                if cid == case_id:
                    target_idx = idx
                    break
            if target_idx is None:
                return
            # Need to rebuild index from remaining vectors
            # We can extract vectors by needing to store them: rebuild from DB embeddings fallback
            # For simplicity, remove mapping entry and rebuild via build script logic if needed
            # Try to reconstruct remaining vectors from current index if possible
            if self._index is not None and self._index.ntotal > 0:
                # Reconstruct all vectors
                ntotal = self._index.ntotal
                dim = self.dimension
                all_vecs = []
                remaining_mapping: Dict[int, str] = {}
                new_idx = 0
                for idx in range(ntotal):
                    if idx == target_idx:
                        continue
                    try:
                        vec = self._index.reconstruct(idx)  # works for Flat
                    except Exception:
                        continue
                    all_vecs.append(vec)
                    remaining_mapping[new_idx] = mapping[idx]
                    new_idx += 1
                # rebuild
                new_index = faiss.IndexFlatL2(dim)
                if all_vecs:
                    arr = np.array(all_vecs, dtype=np.float32)
                    new_index.add(arr)
                self._index = new_index
                self._id_mapping = remaining_mapping
                os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)
                faiss.write_index(self._index, settings.FAISS_INDEX_PATH)
                mapping_path = settings.FAISS_INDEX_PATH.replace(".bin", "_mapping.json")
                with open(mapping_path, "w") as f:
                    json.dump({str(k): v for k, v in self._id_mapping.items()}, f)
                logger.info("FAISS remove: case_id=%s new_total=%d", case_id, self._index.ntotal)
        except Exception as e:
            logger.warning("FAISS remove failed for %s: %s", case_id, e)

    async def get_metadata(self) -> Dict[str, Dict[str, str]]:
        """Return case_id -> {district, crime_type} for metadata filtering."""
        try:
            from adapters.sqlite_db import sqlite_db
            all_cases = await sqlite_db.get_all("Cases")
            meta: Dict[str, Dict[str, str]] = {}
            for c in all_cases or []:
                cid = c.get("case_id") or c.get("ROWID")
                if cid:
                    meta[cid] = {"district": (c.get("district") or ""), "crime_type": (c.get("crime_type") or "")}
            return meta
        except Exception:
            return {}
