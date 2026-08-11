# scripts/

Helper scripts (arrive with their phases per `docs/ROADMAP.md`):

| Script | Phase | Status | Purpose |
|---|---|---|---|
| `generate_synthetic_data.py` | 1 | ✅ implemented | deterministic synthetic dataset → `data/seed/*.json` (committed) |
| `seed_database.py` | 1 | ✅ implemented | `data/seed/*.json` → `data/crimeintel.db` + storage evidence files |
| `build_faiss_index.py` | 1/4 | ✅ implemented | builds `data/indexes/cases.index` (+ id map json) |
| `setup.ps1` / `setup.sh` | 1 | Planned | create venv, install deps, copy `.env` |
| `dev.ps1` / `dev.sh` | 2+ | Planned | start backend + frontend together |
| `run_tests.ps1` / `.sh` | 9 | Planned | backend + AI evaluation |

Usage: `python scripts/<name>.py --help`.
