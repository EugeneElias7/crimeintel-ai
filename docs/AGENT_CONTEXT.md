# AGENT_CONTEXT.md — Permanent Development Agent Context

> Locked master instructions for any engineering agent working on CrimeIntel AI.
> This file is the team's permanent development agent context (v1, 2026-08-11).
> If a task conflicts with this document, STOP and explain before proceeding.

Repository: https://github.com/EugeneElias7/crimeintel-ai
Project: CrimeIntel AI — Team Pixel Pirates
Hackathon: Intelligent Conversational AI for KSP Crime Database

---

## 0. Non-Negotiable Instruction

Before doing ANY coding, modification, refactoring, dependency installation, architecture change, or feature implementation, READ from the repository:

`/docs/PROJECT_CONTEXT.md`
`/docs/PRD.md`
`/docs/TRD.md`
`/docs/ARCHITECTURE.md`
`/docs/DATABASE_SCHEMA.md`
`/docs/AI_SPECIFICATION.md`
`/docs/API_CONTRACT.md`
`/docs/UI_DESIGN.md`
`/docs/MVP_SCOPE.md`
`/docs/ROADMAP.md`
`/docs/CATALYST_MIGRATION.md`
`/docs/DEMO_SCENARIOS.md`
`/docs/DEVELOPMENT_SETUP.md`

These documents are the project's source of truth. If the current task conflicts with these documents, STOP and explain the conflict before changing architecture or scope. Do not silently reinterpret the product. Do not invent requirements. Do not introduce technologies simply because they are convenient. Do not redesign existing architecture without explicit approval.

## 1. Product Identity

CrimeIntel AI is an AI-powered conversational crime intelligence platform. The central product feature is **CRIMA AI** — natural-language interaction with crime records: search, understand, summarize, find similar cases, retrieve evidence, answer basic analytics questions, and reference the records used. The project is a hackathon prototype using **SYNTHETIC/DEMO data only**. Never claim live/confidential KSP data. Never add real personal information to the repository.

## 2. Core Product Principle

**CRIMA AI IS THE PRIMARY PRODUCT FEATURE.** Everything else (Authentication, Dashboard, Case Explorer, Case Details, Evidence, Analytics, Reports, Administration, Notifications, Settings) supports it. Do not turn CrimeIntel AI into a generic police management system.

## 3. MVP Scope

P0 — MUST WORK: Authentication, Dashboard, CRIMA AI, Case Explorer, Case Details, Evidence Management, Basic Crime Analytics, Basic Reports, Administration.

CRIMA AI canonical queries (must remain supported): "Find vehicle theft cases in Bengaluru." / "Summarize CASE-1024." / "What evidence is associated with CASE-1024?" / "Find cases similar to CASE-1024." / "Which district has the highest number of theft cases?"

## 4. Out of Scope (unless project owner moves them into MVP)

Criminal Network, Predictive Policing, Facial Recognition, Mobile Application, Live KSP Database Integration, Confidential Police Data, Advanced Forensic Analysis, Complex Multi-Agent AI, OCR, Voice Assistant. Do not spend MVP time on them.

## 5. Development Strategy

CURRENT MODE: **LOCAL-FIRST.** Application must work locally before cloud deployment. All local infrastructure is designed so it can later be replaced by the corresponding Zoho Catalyst service. Sequence: LOCAL IMPLEMENTATION → WORKING LOCAL MVP → TESTING → CATALYST INTEGRATION → LIVE HACKATHON DEPLOYMENT.

## 6. Technology Stack

- Frontend: React, TypeScript, Tailwind CSS, Lucide React, Recharts, approved open-source motion libraries (see TRD/UI_DESIGN)
- Backend: Python, FastAPI, SQLAlchemy
- Local database: SQLite · Local auth: JWT provider · Local storage: filesystem
- Local AI: Sentence Transformers, FAISS (approved AI components per AI_SPECIFICATION.md)
- Cloud target: Zoho Catalyst — Slate/Web Hosting (frontend), AppSail (backend), Data Store (DB), Stratus (storage), Catalyst Authentication, QuickML (AI/RAG where appropriate), API Gateway where required
- Do not claim Catalyst services implemented until actually tested.

## 7. Local → Cloud Architecture

Business logic must NOT directly depend on SQLite, local filesystem, local JWT, FAISS implementation, or Catalyst SDK. Use interfaces, providers, repositories, adapters:

- Service → Repository Interface → SQLite Repository (later: Catalyst Data Store Repository)
- Evidence Service → Storage Interface → Local Storage Adapter (later: Stratus)
- Auth Service → Auth Provider → Local JWT (later: Catalyst Authentication)
- CRIMA AI → AI Provider / Retrieval abstraction → Local ST + FAISS (later: Cloud AI/RAG, QuickML)

Do not rewrite business logic merely because deployment changes.

## 8. CRIMA AI Architecture

Pipeline: User Query → Intent Detection → Query Processing → Structured/SQL Retrieval → Semantic Retrieval → Hybrid Ranking → Relevant Crime Records → Context Construction → Response Generation → Source Attribution → User.

Must be grounded in retrieved prototype data. Must not invent case IDs, evidence, suspects, dates, locations, or other crime facts. If information is not found, state clearly it was not found.

## 9. Synthetic Data

Realistic structure, completely fictional data: case search, categories, districts, dates, status, priority, suspects, victims, witnesses, evidence, timelines, related cases, analytics. Never real KSP records or PII.

## 10. UI Design — Theme Meridian (LOCKED)

Do not redesign the visual language. Background/content `#F6F8FB`, sidebar deep navy `#0B1220`, signature cyan `#06B6D4`, primary blue `#2563EB`. **No purple, no generic AI-purple gradients.** Inter typography, left-aligned headlines, tracked uppercase labels where specified, tabular numbers for KPI/data. Premium enterprise intelligence platform: clean, minimal, data-driven, high information density, strong hierarchy, responsive. Motion: 3D tilt cards, staggered entrances, shimmer skeletons, bouncing-dot typing indicator, chart animations via approved open-source libraries + Recharts + Lucide React. Always consult `/docs/UI_DESIGN.md` before UI work. The Figma design is the visual source of truth; do not independently redesign screens.

## 11. UI Structure

Approved screens: Login, Registration, Dashboard, CRIMA AI, Case Explorer, Case Details, Evidence, Analytics, Reports, Notifications, Administration, Settings. Do not add unrelated screens.

## 12. API-First Development

Frontend ↔ backend communicate through documented REST APIs (`/docs/API_CONTRACT.md`). For every API: define request/response schema, auth requirements, errors; update documentation on contract changes. Do not silently change or break an API used by another developer; document and notify the team.

## 13. Database Rules

Follow `/docs/DATABASE_SCHEMA.md`. SQLAlchemy models for local development; repository abstractions for data access. Maintain PKs, FKs, relationships, constraints, indexes, timestamps. Avoid duplicate representations of the same data.

## 14. Team Ownership (exactly 3 developers)

| Developer | Owns | Branch |
|---|---|---|
| Developer 1 — Eugene | /ai, CRIMA AI services/API/frontend, AI retrieval pipeline, AI evaluation | feature/crima-ai |
| Developer 2 | Dashboard, Analytics UI, Case Explorer, Case Details, Timeline, Related cases UI | feature/dashboard-cases |
| Developer 3 | Login, Registration, Auth, Roles, Admin, Users, Audit logs, Evidence, Reports | feature/auth-admin |

Do not modify another developer's core module unnecessarily; coordinate shared changes through the repository/API contract.

## 15. Git Rules

Main is protected in practice. Never develop features on main. Before starting: `git checkout main && git pull origin main`, create/use assigned feature branch. Review changed files, ensure unrelated files untouched, run tests/checks before committing. Prefixes: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`. Then `git add .`, commit with message, `git push origin <branch>`, open a Pull Request. Do not merge blindly.

## 16. Shared File Rule

Avoid simultaneous modification of shared files (package.json, requirements.txt, App.tsx, routing, global styles, shared types, API contracts, database schema). If a shared file must change: check other developers, smallest necessary change, inform the team, test integration. Prefer new modular files over editing shared files.

## 17. Before Coding

STEP 1 read docs → STEP 2 inspect existing code → STEP 3 check if functionality exists → STEP 4 identify cross-module dependencies → STEP 5 check API contracts → STEP 6 plan smallest implementation → STEP 7 implement. Never immediately rewrite existing code without understanding it.

## 18. Code Quality

Prefer: small modules, clear interfaces, reusable services, typed API contracts, centralized config, env vars, dependency injection where useful, explicit error handling, logging, testable functions. Avoid: hard-coded credentials/paths, duplicate logic, giant files/components, circular dependencies, hidden global state, unnecessary dependencies, temporary hacks presented as final architecture.

## 19. Security

Never commit passwords, API keys, client secrets, JWT secrets, Catalyst credentials, or `.env` files containing secrets. Use `.env`, commit only `.env.example`. Synthetic data only. Authz enforced at API boundaries.

## 20. Error Handling

No silent failures. Handle invalid requests, missing records, auth/authz failures, database errors, AI retrieval failures, file errors, network errors. Frontend needs loading, empty, error, retry states.

## 21. Testing

Backend: unit + integration + API tests. AI: retrieval, intent, grounding, canonical query tests. Frontend: component tests where appropriate + build verification. RUN the relevant tests before declaring completion. Never say "tests pass" unless actually executed.

## 22. AI-Specific Quality

CRIMA AI priorities: correct retrieval, grounded responses, source references, clear uncertainty, low hallucination risk. Never fabricate answers; empty retrieval → "no relevant records found".

## 23. Performance

No premature optimization, but avoid obviously expensive operations: rebuilding FAISS per query, loading models per request, querying every row unnecessarily, unnecessary rerenders, duplicate API requests. Model/index init handled appropriately for local architecture.

## 24. Documentation Rule

When implementation changes architecture or public API, update relevant docs only. Docs must reflect actual implementation. Use status terms accurately: **Implemented / In Development / Planned / Future**.

## 25. Roadmap Rule

Follow `/docs/ROADMAP.md`. Phase order: 0 Foundation → 1 Data → 2 Authentication → 3 Case Management → 4 CRIMA AI → 5 Dashboard/Analytics → 6 Reports → 7 Administration → 8 Integration → 9 Testing → 10 Catalyst Deployment → 11 Hackathon Submission. Parallel development allowed when dependencies satisfied.

## 26. Current Development Priority

**PHASE 1 — DATA FOUNDATION** (immediate objective): synthetic data generator, SQLAlchemy models, SQLite database, database seeding, ≥300 synthetic cases, relationships, database verification, FAISS index generation, semantic retrieval verification. After Phase 1, developers can work in parallel.

## 27. Do Not Overengineer

Hackathon prototype. Priority: WORKING → CORRECT → DEMONSTRABLE → TESTED → DEPLOYABLE, before COMPLEX → EXTENSIBLE → PERFECT.

## 28. When Asked to Implement a Task

Respond briefly with: 1) governing documentation, 2) relevant existing code, 3) files that will change, 4) dependencies, 5) smallest safe implementation. Then implement. Don't ask unnecessary questions when docs answer them; stop and identify genuine conflicts.

## 29. Definition of Done

✓ Implementation exists ✓ follows architecture ✓ follows MVP scope ✓ Theme Meridian for UI ✓ API contracts respected ✓ tests/checks run ✓ no secrets committed ✓ no unrelated features ✓ docs updated when necessary ✓ works locally. Do not claim completion based only on code generation.

## 30. Final Agent Report

Report: ### Implemented, ### Files Changed, ### Tests (exactly what ran + results), ### API Changes, ### Database Changes, ### Dependencies, ### Integration Notes, ### Remaining Work, ### Git (recommended commit message). Never claim cloud deployment unless actually performed and verified.

---

**Final principle:** CrimeIntel AI = conversational AI crime intelligence prototype. CRIMA AI is the center. Works locally first. Catalyst-ready. Theme Meridian locked. MVP locked. Docs are the source of truth. Three developers can work in parallel without breaking each other's modules. When uncertain: DO NOT INVENT — READ THE DOCUMENTATION, INSPECT THE CODE, FOLLOW THE EXISTING ARCHITECTURE, MAKE THE SMALLEST SAFE CHANGE, TEST IT.