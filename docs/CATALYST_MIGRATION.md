# CATALYST_MIGRATION.md

> **CrimeIntel AI** — Local → Zoho Catalyst migration plan
> Status: Phase 0 — **design only. Nothing Catalyst is implemented, deployed, or claimed.**

---

## 1. Migration Principle

The application is built **local-first**, with every infrastructure concern behind a repository/provider interface (`ARCHITECTURE.md` §7–8). Catalyst migration is therefore an **adapter-swap**, not a rewrite:

> Replace the leaf node, keep the service.

## 2. Mapping

| Local (today, to build) | Interface | Catalyst (target) | Change required |
|---|---|---|---|
| SQLite + SQLAlchemy | `CaseRepository`, `UserRepository`, `EvidenceRepository`, `AuditLogRepository`, `ReportRepository`, `ConversationRepository` | Catalyst Data Store | New repository classes using Catalyst SDK |
| Local filesystem (`storage/`) | `StorageProvider` (`put/get/delete`) | Catalyst Stratus | New provider class |
| PyJWT local tokens | `JwtProvider` (`issue/verify`) | Catalyst Authentication | New provider class + auth middleware rewire |
| FastAPI on uvicorn | HTTP app | Catalyst AppSail | Package/upload; env-driven config |
| React + Vite static SPA | Static bundle | Catalyst Slate / Web Client Hosting | Build output upload; API base URL env |
| Sentence Transformers + FAISS + template composer | `AiProvider` (`embed/search/answer`) | Catalyst QuickML (evaluate) | New provider class; only if quality/cost proves out |

## 3. Config-Driven Selection

`.env` keys switch implementations without code changes:

```
DATABASE__PROVIDER=sqlite   # later: catalyst
STORAGE__PROVIDER=local     # later: stratus
AUTH__PROVIDER=local        # later: catalyst
AI__PROVIDER=local          # later: quickml
```

A provider factory reads these keys and returns the matching implementation. Services only ever see interfaces.

## 4. Step-by-Step Plan (Phase 10, gated)

1. **Contract freeze:** ensure all local adapters pass integration tests with identical behavior.
2. **Data Store repository:** implement `*CatalystRepository` classes behind the same interfaces; map rows ⇄ Catalyst table records.
3. **Stratus provider:** implement `put/get/delete` behind `StorageProvider`; key = `storage/{case_id}/{filename}`.
4. **Catalyst Auth:** implement `JwtProvider` backed by Catalyst auth (obtain/validate tokens); keep interface identical.
5. **AppSail:** containerize backend, set env keys, deploy to test stage.
6. **Slate/Web Hosting:** build frontend with `VITE_API_BASE_URL` pointing at AppSail, deploy.
7. **QuickML evaluation:** compare embedding quality + latency + cost vs `all-MiniLM-L6-v2` on the golden question set, using the same AI evaluation harness. Adopt only if it meets `AI_SPECIFICATION.md` targets.
8. **End-to-end test:** run the entire `DEMO_SCENARIOS.md` suite against Catalyst.

## 5. Honesty Rules

- **Nothing is considered "complete" until actually tested end-to-end on Catalyst.**
- This document describes the plan and target state; it is NOT a record of completed integration.
- Any doc/README claiming Catalyst support must link to the tested run/evidence.
- The hackathon submission must clearly separate *implemented* (local) from *designed* (Catalyst) if Phase 10 is not finished.

## 6. Risks

| Risk | Note |
|---|---|
| Data Store is NoSQL, schema is relational | Keep entities flat; joins emulated in repository code |
| Catalyst Auth token mechanics differ | Keep `JwtProvider` surface narrow (issue/verify/identity) |
| QuickML quality/latency | Evaluation gate; local AI remains the fallback forever |
| SDK availability offline | Catalyst work only happens with credentials + docs at hand; local app never requires SDK |