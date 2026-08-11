# ROADMAP.md

> **CrimeIntel AI** — implementation phases
> Status: **Phase 0 in progress** (this documentation + foundation setup)

---

## Phase 0 — Foundation ✅ in progress
- [x] Inspect/preserve repo
- [x] Create `/docs` (all 13 documents incl. development setup)
- [x] Establish repository structure
- [x] `.env.example`, `.gitignore`, `README.md`, `CONTRIBUTING.md`, dev setup docs
- [ ] Commit foundation to `main`
- **Exit:** clean, stable foundation commit on GitHub.

## Phase 1 — Data
- [ ] Synthetic dataset generator (`scripts/generate_synthetic_data.py`) — ≥ 300 cases, persons, evidence, events, users, audit entries
- [ ] SQLAlchemy models matching `DATABASE_SCHEMA.md`
- [ ] Seed script → `data/crimeintel.db`
- [ ] FAISS build script (`scripts/build_faiss_index.py`)
- **Owner:** shared (Eugene owns AI parts)

## Phase 2 — Authentication
- [ ] `UserRepository` interface + SQLite impl; JWT provider interface + local impl
- [ ] `/auth/*` endpoints; middleware; role decorators
- [ ] Login UI
- **Owner:** Developer 3 · branch `feature/auth-admin`

## Phase 3 — Case Management
- [ ] Case CRUD, persons, events endpoints + repositories
- [ ] Case Explorer + Case Detail UI (tabs, timeline)
- [ ] Evidence upload/download + UI
- **Owner:** Developer 2 (+ Dev 3 for evidence) · branch `feature/dashboard-cases`

## Phase 4 — CRIMA AI (primary feature)
- [ ] `ai/` package: embedding service, intent detection, parameter extraction
- [ ] FAISS retrieval + case_embeddings mapping
- [ ] Context builder + template response composer + source attribution
- [ ] `/crima/*` endpoints; conversation persistence
- [ ] CRIMA AI UI (chat, source chips, context panel)
- [ ] Golden question set + evaluation harness
- **Owner:** Developer 1 (Eugene) · branch `feature/crima-ai`

## Phase 5 — Dashboard & Analytics
- [ ] Dashboard endpoints + KPI/chart UI
- [ ] Analytics endpoints + charts
- **Owner:** Developer 2 · branch `feature/dashboard-cases`

## Phase 6 — Reports
- [ ] Report generation (case summary, analytics snapshot) + downloads
- **Owner:** Developer 3

## Phase 7 — Administration
- [ ] Admin users, audit logs, settings endpoints + UI
- [ ] Notifications (P1) if time permits
- **Owner:** Developer 3 · branch `feature/auth-admin`

## Phase 8 — Integration
- [ ] Wire all frontend pages to APIs; end-to-end demo flow
- [ ] CI workflow (lint + test) in `.github/workflows`
- [ ] `.github` issue/PR templates
- **Owner:** all

## Phase 9 — Testing
- [ ] Backend unit + integration tests; AI golden-set run
- [ ] Frontend smoke tests; performance check vs TRD targets
- [ ] QA against demo scenarios (`DEMO_SCENARIOS.md`)
- **Owner:** all

## Phase 10 — Catalyst Deployment (planned, gated)
- [ ] Evaluate QuickML vs local AI
- [ ] Implement Catalyst adapters (Data Store, Stratus, Auth) behind existing interfaces
- [ ] AppSail + Slate/Web hosting deployment **only after tested**
- **Gate:** no Catalyst claims until each adapter passes integration tests.

## Phase 11 — Hackathon Submission
- [ ] Final demo script, screenshots, README polish
- [ ] Submission write-up (truthful about what is implemented vs designed)
- **Owner:** all

---

## Working Rules (from Phase 1 onward)

- Work on feature branches: `feature/crima-ai`, `feature/dashboard-cases`, `feature/auth-admin`.
- PRs into `main`; require at least 1 review + passing checks.
- Commit prefixes: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`.
- Update docs when behavior changes; docs are source of truth.
