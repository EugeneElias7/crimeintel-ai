# scripts/

Helper scripts (arrive with their phases per `docs/ROADMAP.md`):

| Script | Phase | Purpose |
|---|---|---|
| `setup.ps1` / `setup.sh` | 1 | create venv, install deps, copy `.env` |
| `generate_synthetic_data.py` | 1 | seed `data/crimeintel.db` + storage files |
| `build_faiss_index.py` | 1/4 | build `data/indexes/cases.index` |
| `dev.ps1` / `dev.sh` | 2+ | start backend + frontend together |
| `run_tests.ps1` / `.sh` | 9 | backend + AI evaluation |

**Status: Phase 0 — empty.**
