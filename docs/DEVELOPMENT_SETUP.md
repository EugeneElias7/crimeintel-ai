# DEVELOPMENT_SETUP.md — Local Development

> **CrimeIntel AI** — target environment: fully offline laptop demo
> Status: Phase 0 — instructions for the intended setup; scripts themselves arrive with Phase 1.

---

## 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend + AI |
| Node.js | 20+ | Frontend |
| Git | any recent | Version control |
| Internet | only for initial installs | Python/npm packages + one-time model download |

## 2. First-Time Setup (Windows PowerShell)

```powershell
# 1. Backend
python -m venv backend/.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# 2. Frontend
cd frontend
npm install
cd ..

# 3. Environment
Copy-Item .env.example .env   # edit as needed (defaults work out of the box)

# 4. Data + AI assets (Phase 1+)
python scripts/generate_synthetic_data.py     # creates data/crimeintel.db + storage files
python scripts/build_faiss_index.py           # creates data/indexes/cases.index
```

macOS/Linux equivalents: `source backend/.venv/bin/activate`; the same scripts run under `bash` (`scripts/setup.sh`, `scripts/dev.sh`).

## 3. Running the App (local)

Two terminals:

```powershell
# Terminal 1 — backend  (FastAPI on http://localhost:8000)
backend\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --port 8000

# Terminal 2 — frontend (Vite on http://localhost:5173)
cd frontend; npm run dev
```

Open http://localhost:5173. Frontend dev server proxies `/api` → backend. API docs at http://localhost:8000/api/v1/docs.

## 4. Environment Variables (`.env`)

All defaults are local-first; see `.env.example` for the full list:

```
DATABASE__PROVIDER=sqlite
DATABASE__URL=sqlite:///data/crimeintel.db
STORAGE__PROVIDER=local
STORAGE__ROOT=storage
AUTH__PROVIDER=local
AUTH__JWT_SECRET=change-me-in-prod
AI__PROVIDER=local
AI__EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
AI__FAISS_INDEX=data/indexes/cases.index
CORS_ORIGINS=http://localhost:5173
```

## 5. Testing

```powershell
# Backend (Phase 1+)
pytest tests/unit tests/integration

# AI evaluation (Phase 4+)
pytest tests/ai -m ai_eval

# Frontend (Phase 9+)
cd frontend; npm run test
```

## 6. Common Issues

| Issue | Fix |
|---|---|
| Model downloads slow | Run `build_faiss_index.py` once on a network; afterwards cached forever |
| Ports busy | Change `--port` and `VITE` proxy target env |
| Seeded passwords lost | Re-run seed script (idempotent/reset with `--reset`) |
| FAISS index stale after reseed | Re-run `build_faiss_index.py` |

## 7. Git Workflow (team)

1. Branch from `main`: `git checkout -b feature/<your-area>` (`feature/crima-ai`, `feature/dashboard-cases`, `feature/auth-admin`).
2. Commit with prefixes: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`.
3. Push, open a PR, request a teammate review; merge to `main` once green.
4. Never push directly to `main` after Phase 0.