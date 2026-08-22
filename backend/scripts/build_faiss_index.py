"""FAISS index build script for CrimeIntel AI.

Fetches cases from the local SQLite database, generates embeddings,
builds a FAISS index, and saves it locally.
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

    from adapters.sqlite_db import sqlite_db
    from services.embedding_service import EmbeddingService

    await sqlite_db._ensure_initialized()
    logger.info("Connected to SQLite database")

    all_cases = await sqlite_db.get_all("Cases")
    if not all_cases:
        logger.error("No cases found in database. Run seed_database.py first.")
        return

    logger.info("Found %d cases in database", len(all_cases))

    embedding_service = EmbeddingService()
    await embedding_service.load_model()

    embeddings = []
    case_ids = []

    for case in all_cases:
        case_id = case.get("case_id") or case.get("ROWID")
        if not case_id:
            continue

        text_to_embed = f"{case.get('crime_type', '')} {case.get('location', '')} {case.get('description', '')} {case.get('district', '')}"
        embedding = await embedding_service.generate(text_to_embed)

        embeddings.append(embedding)
        case_ids.append(case_id)

    if not embeddings:
        logger.error("No embeddings generated")
        return

    embeddings_array = np.array(embeddings, dtype=np.float32)
    logger.info("Generated %d embeddings of dimension %d", len(embeddings_array), dimension)

    logger.info("Building FAISS index...")
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings_array)
    logger.info("Index contains %d vectors", index.ntotal)

    os.makedirs(os.path.dirname(index_path), exist_ok=True)
    faiss.write_index(index, str(index_path))
    logger.info("Index saved to %s", index_path)

    mapping_path = index_path.replace(".bin", "_mapping.json")
    import json
    id_mapping = {str(i): case_id for i, case_id in enumerate(case_ids)}
    with open(mapping_path, "w") as f:
        json.dump(id_mapping, f)
    logger.info("ID mapping saved to %s", mapping_path)

    try:
        meta_table = settings.DATA_STORE_TABLE_PREFIX + "faiss_index_meta"
        meta_data = {
            "ROWID": "faiss_index_meta_001",
            "index_path": index_path,
            "dimension": dimension,
            "vector_count": index.ntotal,
            "built_at": str(asyncio.get_event_loop().time()),
            "status": "ready",
        }
        await sqlite_db.insert(meta_table, meta_data)
        logger.info("FAISS Index Meta table updated")
    except Exception as e:
        logger.warning("Could not update FAISS Index Meta: %s", e)

    print()
    print("=" * 50)
    print("FAISS INDEX BUILD SUMMARY")
    print("=" * 50)
    print(f"  Dimension:      {dimension}")
    print(f"  Vectors:        {index.ntotal}")
    print(f"  Saved to:       {index_path}")
    print(f"  Mapping saved:  {mapping_path}")
    print(f"  Index type:     L2 (cosine search)")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(build_faiss_index())