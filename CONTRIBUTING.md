# Contributing — CrimeIntel AI

> Team Pixel Pirates — hackathon project. 3 developers, `main` stays stable.

## 1. Source of Truth

Read before any code change:

1. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md)
2. [`docs/PRD.md`](docs/PRD.md)
3. [`docs/TRD.md`](docs/TRD.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md)
6. [`docs/ROADMAP.md`](docs/ROADMAP.md)
7. [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

Do not introduce new technologies, features, architecture, or scope without explicit approval.

## 2. Ownership

| Area | Branch | Owner |
|---|---|---|
| CRIMA AI (AI pipeline, FAISS, intent, CRIMA API/UI) | `feature/crima-ai` | Eugene |
| Dashboard + Case Explorer + Analytics UI | `feature/dashboard-cases` | Dev 2 |
| Auth + Admin + Evidence + Reports | `feature/auth-admin` | Dev 3 |

## 3. Workflow

1. `git checkout main && git pull && git checkout -b feature/<area>`
2. Implement in small logical commits (see prefixes below).
3. `git push -u origin <branch>`
4. Open a Pull Request into `main`, request review from a teammate.
5. Merge only when: at least 1 review, tests pass (where they exist), docs updated if behavior changed.

## 4. Commit Message Convention

```
feat: add case filter by district
fix: correct JWT expiry check
docs: update API contract for /crima/chat
refactor: extract storage provider interface
test: add golden question coverage for summarization
chore: bump frontend deps
```

## 5. Code Rules

- Backend: services never call adapters directly — interfaces only (see `ARCHITECTURE.md` §8).
- No secrets in code or commits; use `.env` (copy from `.env.example`).
- Synthetic data only — never commit anything resembling real personal data.
- Do NOT claim (in code, docs, or PR text) that Catalyst integration works unless it is actually tested.

## 6. Definition of Done

- Code follows `API_CONTRACT.md` / `DATABASE_SCHEMA.md`.
- Tests added/updated (`pytest` for backend, `tests/ai` for CRIMA AI evaluation).
- Lint/typecheck clean (commands defined per phase in `ROADMAP.md`).
- Docs updated where relevant.
- Demo-verifiable locally (`docs/DEVELOPMENT_SETUP.md`).