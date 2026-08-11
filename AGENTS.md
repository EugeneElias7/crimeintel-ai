# AGENTS.md — Instructions for Coding Agents

You are working on **CrimeIntel AI** (Team Pixel Pirates, hackathon: Intelligent Conversational AI for KSP Crime Database).

## Mandatory: read these before modifying ANY code

1. `docs/PROJECT_CONTEXT.md` — identity, constraints, team ownership
2. `docs/PRD.md` — product requirements
3. `docs/TRD.md` — technical requirements
4. `docs/ARCHITECTURE.md` — system design, layering, adapter rules
5. `docs/MVP_SCOPE.md` — what is in/out of scope
6. `docs/ROADMAP.md` — which phase is current, what to do next
7. `docs/API_CONTRACT.md` — REST contract (match it exactly)

Also consult when relevant: `docs/DATABASE_SCHEMA.md`, `docs/AI_SPECIFICATION.md`, `docs/UI_DESIGN.md`, `docs/CATALYST_MIGRATION.md`, `docs/DEVELOPMENT_SETUP.md`, `docs/GIT_REFERENCE.md` (command cheat sheet).

## How teammates' agents get these instructions

All instructions live in this repository. When any teammate opens this folder with opencode in their terminal, this `AGENTS.md` is auto-loaded and its mandatory reading list is followed — no individual setup needed. Keep instructions in-repo, commit, and `git push` so every agent works from the same source of truth.

## Permanent agent context

`docs/AGENT_CONTEXT.md` is the locked master instruction set (product identity, scope, architecture, team ownership, git rules, Definition of Done, reporting format). Agents MUST follow it; report per its Final Agent Report section.

## Hard rules

- Do NOT introduce new technologies, features, architecture, or scope without explicit approval.
- CRIMA AI is the primary product feature; everything else supports it.
- Synthetic/demo data only. Never real or confidential police data.
- Nothing Catalyst is deployed or claimed working until actually tested.
- Never claim implemented functionality that is not implemented.

## Architecture rules

- Services depend on repository/provider **interfaces** only: `CaseRepository`, `UserRepository`, `EvidenceRepository`, `AuditLogRepository`, `ReportRepository`, `ConversationRepository`, `StorageProvider`, `JwtProvider`, `AiProvider`.
- Adapters: SQLite/local FS/local JWT/local AI in `backend/app/adapters/` and `ai/`. Catalyst adapters are later swaps — same interfaces.
- API surface must match `docs/API_CONTRACT.md` (`/api/v1`).

## Git rules

- Never commit directly to `main` (exceptions: agent setup/config commits explicitly requested).
- Feature branches: `feature/crima-ai` (Eugene), `feature/dashboard-cases` (Dev 2), `feature/auth-admin` (Dev 3).
- Commit prefixes: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`.
- No secrets in code or commits. `.env` is in `.gitignore`.

## Team ownership

| Area | Branch |
|---|---|
| CRIMA AI (ai/, /api/v1/crima/*, CRIMA UI) | `feature/crima-ai` |
| Dashboard + Case Explorer + Analytics UI | `feature/dashboard-cases` |
| Auth + Admin + Evidence + Reports | `feature/auth-admin` |

## Working loop

1. `git checkout main && git pull`
2. Create/switch to your feature branch
3. Read the relevant docs (mandatory list above)
4. Implement in small commits
5. `git push -u origin <branch>` and open a PR to `main`

## Current status

Phase 1 (Data) is complete: synthetic dataset (320 cases), SQLAlchemy models, seed script, FAISS index + retrieval verified. See `docs/ROADMAP.md` — the next phase is **Phase 2 — Authentication** (`feature/auth-admin`): JWT provider + `/auth/*` endpoints + login UI.