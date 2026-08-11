# CrimeIntel AI

AI-powered conversational crime intelligence platform for authorized police personnel — **CRIMA AI** lets investigators ask natural-language questions about crime records and get evidence-grounded answers with source references.

> **Hackathon:** Intelligent Conversational AI for KSP Crime Database — Team **Pixel Pirates**
> **Status:** Phase 0 — Foundation (documentation + structure only. No application features implemented yet.)
> **Data:** Synthetic/demo data only. No live or confidential police records.

## Features (P0 target)

- **CRIMA AI (primary):** case search, case details, summarization, similar cases, evidence retrieval, basic analytics questions — every answer references its source records
- Authentication (local JWT, roles: admin / investigator / analyst / viewer)
- Dashboard, Case Explorer, Case Details, Evidence Management
- Analytics, Reports, Administration (users, audit logs, settings)

## Local-First, Catalyst-Ready

Everything runs on a laptop: React + FastAPI + SQLite + local storage + Sentence Transformers/FAISS.
All infrastructure sits behind repository/provider interfaces so SQLite→Catalyst Data Store, local FS→Stratus, JWT→Catalyst Auth, FastAPI→AppSail, React→Slate/Web Hosting, local AI→QuickML are adapter swaps, not rewrites.

## Quick Start (after Phase 1 scripts land)

```powershell
python -m venv backend/.venv
backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd frontend; npm install; cd ..
Copy-Item .env.example .env
python scripts/generate_synthetic_data.py
python scripts/build_faiss_index.py
uvicorn backend.app.main:app --reload --port 8000   # terminal 1
cd frontend; npm run dev                            # terminal 2
```

Full instructions: [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md)

## Documentation (source of truth)

| Document | Purpose |
|---|---|
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | Identity, vision, constraints, team ownership |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/TRD.md`](docs/TRD.md) | Technical requirements |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System, components, CRIMA pipeline, adapters |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Prototype schema + synthetic data strategy |
| [`docs/AI_SPECIFICATION.md`](docs/AI_SPECIFICATION.md) | CRIMA AI pipeline, intents, evaluation |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | REST API contract |
| [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md) | Design system and screens |
| [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md) | P0 / P1 / Future scope |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phases 0–11 |
| [`docs/CATALYST_MIGRATION.md`](docs/CATALYST_MIGRATION.md) | Local→Catalyst plan (designed, not deployed) |
| [`docs/DEMO_SCENARIOS.md`](docs/DEMO_SCENARIOS.md) | 7 demo scenarios |
| [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md) | Local dev instructions |

**Agents must read** `PROJECT_CONTEXT`, `PRD`, `TRD`, `ARCHITECTURE`, `MVP_SCOPE`, `ROADMAP`, `API_CONTRACT` before touching code.

## Team

| Developer | Area | Branch |
|---|---|---|
| Eugene | CRIMA AI (pipeline, retrieval, generation, UI/API) | `feature/crima-ai` |
| Dev 2 | Dashboard + Case Explorer | `feature/dashboard-cases` |
| Dev 3 | Auth + Admin + Evidence + Reports | `feature/auth-admin` |

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the git workflow.