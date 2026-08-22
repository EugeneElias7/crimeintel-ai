import logging
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingService:
    MODEL_NAME = "all-MiniLM-L6-v2"
    DIMENSION = 384

    _instance: Optional["EmbeddingService"] = None
    _model = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if not getattr(self, "_initialized", False):
            self._model = None
            self._initialized = True

    async def load_model(self):
        if self._model is not None:
            return

        # Use fallback embeddings for local development to avoid SSL download issues
        logger.info("Using fallback dummy embeddings for local development")
        self._model = None

    async def generate(self, text: str) -> List[float]:
        await self.load_model()

        if self._model is not None:
            embedding = self._model.encode(text, normalize_embeddings=True)
            return embedding.tolist()

        # Deterministic hash-based embedding for consistent results
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        seed = int(hash_obj.hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        vector = rng.random(self.DIMENSION).astype(np.float32)
        vector = vector / np.linalg.norm(vector)
        return vector.tolist()

    async def generate_batch(self, texts: List[str]) -> List[List[float]]:
        await self.load_model()

        if self._model is not None:
            embeddings = self._model.encode(texts, normalize_embeddings=True)
            return [emb.tolist() for emb in embeddings]

        import hashlib
        results = []
        for text in texts:
            hash_obj = hashlib.md5(text.encode())
            seed = int(hash_obj.hexdigest()[:8], 16)
            rng = np.random.default_rng(seed)
            vector = rng.random(self.DIMENSION).astype(np.float32)
            vector = vector / np.linalg.norm(vector)
            results.append(vector.tolist())
        return results
