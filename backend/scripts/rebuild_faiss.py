"""Rebuild FAISS index fallback - RAG sync helper.
Usage: python scripts/rebuild_faiss.py
"""
import asyncio
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

async def main():
    from adapters.sqlite_db import sqlite_db
    from services.embedding_service import EmbeddingService
    from services.faiss_service import FAISSService
    await sqlite_db._ensure_initialized()
    all_cases = await sqlite_db.get_all("Cases")
    emb_service = EmbeddingService()
    await emb_service.load_model()
    embeddings = []
    for case in all_cases or []:
        cid = case.get("case_id") or case.get("ROWID")
        text = f"{case.get('crime_type','')} {case.get('location','')} {case.get('district','')} {case.get('description','')} {case.get('status','')}"
        emb = await emb_service.generate(text)
        embeddings.append((cid, emb))
    await FAISSService().build_index(embeddings)
    print(f"Rebuilt FAISS with {len(embeddings)} vectors")

if __name__ == "__main__":
    asyncio.run(main())
