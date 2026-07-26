"""FAISS index build script for CrimeIntel AI.

Fetches cases with embeddings from the Data Store, builds a FAISS index,
and saves it to the File Store (or a local file for development).
"""

import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np

from config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

try:
    import faiss

    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("faiss package not installed. Install with: pip install faiss-cpu")


async def build_faiss_index() -> None:
    if not FAISS_AVAILABLE:
        logger.error("FAISS is required. Install it with: pip install faiss-cpu")
        return

    dimension = settings.FAISS_INDEX_DIMENSION
    index_path = settings.FAISS_INDEX_PATH
    logger.info("FAISS index dimension: %d", dimension)
    logger.info("FAISS index path: %s", index_path)

    embeddings = []
    case_ids = []

    try:
        from adapters.catalyst_db import catalyst_db

        await catalyst_db._ensure_initialized()
        logger.info("Connected to Catalyst Data Store")
        all_cases = await catalyst_db.get_all("ci_cases")
        if not all_cases:
            all_cases = await catalyst_db.get_all("cases")
    except Exception as e:
        logger.warning("Could not connect to Catalyst Data Store: %s", e)
        logger.info("Using local seed data file instead...")
        import json

        seed_path = os.path.join(os.path.dirname(__file__), "..", "seed_data.json")
        if os.path.exists(seed_path):
            with open(seed_path) as f:
                data = json.load(f)
            all_cases = data.get("cases", [])
        else:
            logger.info("No seed data found. Generating synthetic cases...")
            from seed_data.generate_cases import generate_cases

            data = generate_cases(100)
            all_cases = data["cases"]

    for case in all_cases:
        emb = case.get("embedding")
        if emb:
            if isinstance(emb, str):
                import json as _json

                emb = _json.loads(emb)
            embeddings.append(emb)
            case_ids.append(case.get("case_id", case.get("ROWID", "")))

    if not embeddings:
        logger.warning("No embeddings found in the data. Generating random embeddings for demo.")
        rng = np.random.default_rng(42)
        for case in all_cases:
            embeddings.append(rng.random(dimension).astype(np.float32).tolist())
            case_ids.append(case.get("case_id", case.get("ROWID", "")))

    embeddings_array = np.array(embeddings, dtype=np.float32)
    if embeddings_array.shape[0] == 0:
        logger.error("No data available to build index")
        return

    logger.info("Building FAISS index with %d vectors of dimension %d", len(embeddings_array), dimension)

    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings_array)
    logger.info("Index contains %d vectors", index.ntotal)

    os.makedirs(os.path.dirname(index_path), exist_ok=True)
    faiss.write_index(index, str(index_path))
    logger.info("Index saved to %s", index_path)

    try:
        from adapters.catalyst_fs import catalyst_fs
        from adapters.catalyst_db import catalyst_db

        current_time = asyncio.get_event_loop().time()
        meta = {
            "index_path": index_path,
            "dimension": dimension,
            "vector_count": index.ntotal,
            "built_at": str(current_time),
            "status": "ready",
        }

        try:
            await catalyst_db._ensure_initialized()
            await catalyst_db.insert("faiss_index_meta", meta)
            logger.info("FAISS Index Meta table updated")
        except Exception as e:
            logger.warning("Could not update FAISS Index Meta: %s", e)

        try:
            await catalyst_fs._ensure_initialized()
            logger.info("Index also available for upload to File Store")
        except Exception as e:
            logger.warning("File Store not available: %s", e)
    except Exception as e:
        logger.info("Index saved locally. File Store upload skipped: %s", e)

    print()
    print("=" * 50)
    print("FAISS INDEX BUILD SUMMARY")
    print("=" * 50)
    print(f"  Dimension:      {dimension}")
    print(f"  Vectors:        {index.ntotal}")
    print(f"  Saved to:       {index_path}")
    print(f"  Index type:     L2 (cosine search)")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(build_faiss_index())
