# TRD — Technical Requirements Document

> **CrimeIntel AI** — Team Pixel Pirates
> Status: Phase 0 — Foundation (documentation only)

---

## 1. Technology Stack

### 1.1 Local (MVP — what actually runs)

| Layer | Technology | Version note |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | React 18+, Vite bundler |
| Backend | FastAPI + Python | Python 3.11+ |
| Database | SQLite (via SQLAlchemy 2.x ORM) | Local file `data/crimeintel.db` |
| Auth | Local JWT (PyJWT) | HS256, access + refresh tokens |
| Object storage | Local filesystem | `storage/` directory |
| AI embedding | Sentence Transformers | `all-MiniLM-L6-v2` |
| AI retrieval | FAISS | Local index file `data/indexes/cases.index` |
| AI generation | Template/rule-based composer + optional local LLM adapter (e.g. Ollama) | Pluggable; default is template-based |
| Testing | pytest (backend), Vitest (frontend) | |

### 1.2 Cloud target (design only — NOT deployed)

| Layer | Zoho Catalyst target |
|---|---|
| Frontend | Catalyst Slate / Web Client Hosting |
| Backend | Catalyst AppSail |
| Database | Catalyst Data Store |
| Object storage | Catalyst Stratus |
| Auth | Catalyst Authentication |
| AI/RAG | Catalyst QuickML (to be evaluated) |

> **Rule:** Nothing in the cloud column is deployed or claimed working until actually tested (see `CATALYST_MIGRATION.md`).

## 2. Local Architecture

```
React SPA ──HTTP/JSON──▶ FastAPI ──▶ Service layer ──▶ Repository/Provider interfaces
                                                        ├── SQLiteRepository
                                                        ├── LocalStorageProvider
                                                        ├── LocalJwtProvider
                                                        └── LocalAiProvider (ST + FAISS)
```

- Single FastAPI process serves `/api/v1/*`; frontend dev server proxies `/api`.
- SQLite file at `data/crimeintel.db`; FAISS index at `data/indexes/`.
- Uploads on local filesystem under `storage/`.
- No external service required at runtime after model download.

## 3. Cloud Architecture (target)

```
Catalyst Slate/WebHost (React) ──▶ Catalyst AppSail (FastAPI)
                                      ├── Catalyst Data Store (NoSQL)
                                      ├── Catalyst Stratus (objects)
                                      ├── Catalyst Authentication (JWT)
                                      └── Catalyst QuickML (LLM/RAG — evaluate)
```

Only the **adapter implementations** change. Services, contracts, and UI stay.

## 4. Frontend Requirements

- React 18 + TypeScript strict mode + Tailwind.
- Pages: Login, Dashboard, Case Explorer, Case Detail, Evidence, Analytics, Reports, Admin (users, audit, settings), CRIMA AI, NotFound.
- API client with typed models; interceptors attach JWT, handle 401 refresh flow.
- State: React context for auth; local state for pages (no heavy global store required).
- Loading/error/empty states required on every data view (`UI_DESIGN.md`).
- Vite dev proxy: `/api` → `http://localhost:8000`.

## 5. Backend Requirements

- FastAPI app under `backend/app/main.py`, routers under `backend/app/routers/`.
- Layered: `routers → services → repository interfaces`; schemas (Pydantic) at the edge.
- SQLAlchemy models in `backend/app/models/`; SQLite repository in `backend/app/adapters/`.
- Middleware: auth (JWT), error handler, logging, rate limiting (basic), audit capture.
- Global API prefix `/api/v1`.
- All endpoints except `/auth/login` require `Authorization: Bearer <token>`.

## 6. AI Requirements

- Embeddings: `sentence-transformers/all-MiniLM-L6-v2` (lazy-loaded, cached).
- Index: FAISS flat index over case embedding vectors; mapping table in SQLite (`case_embeddings`).
- Intent detection: lightweight classifier + rule-based fallback (offline-safe).
- Retrieval: hybrid — structured SQL for filters/analytics + FAISS top-k for semantic similarity.
- Generation: template-based answer composer grounded in retrieved records; pluggable LLM adapter (interface) for later use.
- Sources: every answer returns the case records used.
- Hallucination control: never emit a case number not present in retrieval results; refuse when no match.

## 7. Database Requirements

- SQLite + SQLAlchemy; normalized schema per `DATABASE_SCHEMA.md`.
- WAL mode; foreign keys ON; indexes on filter columns.
- Seed: `scripts/generate_synthetic_data.py` → deterministic synthetic dataset (≥ 300 cases).

## 8. Storage Requirements

- Local filesystem adapter with base path `storage/` (configurable via `STORAGE_ROOT`).
- Files organized `storage/<case_id>/<uuid>_<filename>`.
- Only metadata in DB; bytes on disk; delete removes both.

## 9. Authentication Requirements

- Local JWT provider: access token (15 min) + refresh token (7 days).
- Passwords: bcrypt hashes; never stored in plain text.
- Roles: `admin`, `investigator`, `analyst`, `viewer`; server-side enforcement on every endpoint.
- Audit: login/logout/CRUD/CRIMA queries logged to `audit_logs`.

## 10. API Requirements

- REST, JSON, versioned `/api/v1`.
- Pagination: `page` / `page_size` (default 20, max 100) with `{ items, total, page, page_size }`.
- Error envelope: `{ "detail": { "code": "CASE_NOT_FOUND", "message": "..." } }` (or FastAPI default `detail` string).
- OpenAPI docs auto-generated at `/docs`.
- Full contract in `API_CONTRACT.md`.

## 11. Security Requirements

- JWT bearer auth on all endpoints except login.
- Role checks in routers/services — never trust the frontend.
- Passwords bcrypt-hashed; input validation via Pydantic.
- CORS restricted to dev origin(s).
- Audit trail for sensitive actions.
- No secrets in code; `.env` only, `.env.example` committed.

## 12. Performance Requirements

| Operation | Target |
|---|---|
| CRUD API p95 | ≤ 300 ms |
| Case list with filters | ≤ 300 ms |
| CRIMA AI query (cold model loaded) | ≤ 3 s |
| CRIMA AI query (warm) | ≤ 1.5 s |
| Embedding build (300 cases) | ≤ 5 min one-time |
| Frontend initial bundle | ≤ 400 KB gzip (excl. AI — AI is backend-only) |

## 13. Deployment Requirements

- Local: one-command setup + start (`scripts/setup.ps1` / `setup.sh`, `scripts/dev.ps1` / `dev.sh`).
- No Catalyst deployment in MVP. Catalyst readiness = all infra behind interfaces.
- Docker optional (not required for MVP).

## 14. Local-to-Catalyst Migration Strategy

| Local | Interface | Catalyst impl |
|---|---|---|
| SQLite (SQLAlchemy) | `CaseRepository`, `UserRepository`, … | Catalyst Data Store repository |
| Local filesystem | `StorageProvider` | Stratus storage provider |
| Local JWT | `JwtProvider` | Catalyst Authentication provider |
| FastAPI process | HTTP contract | AppSail hosting (same app) |
| React/Vite | Static bundle | Slate / Web hosting |
| ST + FAISS + templates | `AiProvider` | QuickML provider (evaluate) |

Migration = adding new adapter classes + env config switch. Services/UI unchanged. See `CATALYST_MIGRATION.md` for the step-by-step plan. Nothing Catalyst is claimed until tested.
