# data/

Runtime + seed data (local-first).

| Path | Content | Git |
|---|---|---|
| `seed/` | deterministic synthetic dataset definitions (JSON) | committed |
| `crimeintel.db` | generated SQLite database | ignored |
| `indexes/cases.index` | generated FAISS index | ignored |

Generation: `scripts/generate_synthetic_data.py` → `data/crimeintel.db`
FAISS: `scripts/build_faiss_index.py` → `data/indexes/cases.index`

**Status: Phase 0 — empty. Generator lands in Phase 1.**
See `docs/DATABASE_SCHEMA.md` §5 for the synthetic data strategy.
