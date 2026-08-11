# ARCHITECTURE.md

> **CrimeIntel AI** — Team Pixel Pirates
> Status: Phase 0 — Foundation (design only, nothing implemented yet)

---

## 1. System Architecture

```mermaid
flowchart LR
    U[Investigator / Analyst / Admin] -->|Browser| F[React SPA + Tailwind]
    F -->|HTTPS/JSON /api/v1| B[FastAPI Backend]
    B --> S[Service Layer]
    S --> R[Repository / Provider Interfaces]
    R --> SQL[SQLite Repository]
    R --> STO[Local Storage Provider]
    R --> JWT[Local JWT Provider]
    R --> AI[AI Provider: ST + FAISS + Composer]
    AI --> IDX[(FAISS index)]
    SQL --> DB[(crimeintel.db)]
    STO --> FSD[(storage/ dir)]
```

Local today. Later: replace the leaf nodes with Catalyst Data Store, Stratus, Catalyst Auth, QuickML — the interfaces stay.

## 2. Component Architecture

```mermaid
flowchart TB
    subgraph frontend["Frontend (React + TS)"]
        P[Pages] --> C[Components]
        P --> SV[Services / API client]
        SV --> T[Types/Models]
        AX[Auth Context] --> SV
    end
    subgraph backend["Backend (FastAPI)"]
        RT[Router layer - HTTP/validation]
        MW[Middleware: auth, errors, logging, audit]
        SRV[Service layer - business logic]
        REP[Repository Interfaces]
        AD[Local Adapters: SQLite, FS, JWT, AI]
    end
    RT --> MW --> SRV --> REP --> AD
    frontend -->|REST| RT
```

Ownership mapping: `ai/` (Eugene, CRIMA AI), `frontend/src/pages` for dashboard/cases (Dev 2), `backend/app/routers` auth/admin/evidence/reports (Dev 3).

## 3. Data Flow (typical requests)

**Case list (structured):**

```mermaid
sequenceDiagram
    participant UI
    participant RT as /api/v1/cases
    participant SRV as CaseService
    participant REP as CaseRepository(SQLite)
    UI->>RT: GET /cases?district=..&category=..&page=2
    RT->>SRV: list_cases(filters)
    SRV->>REP: find(filters)
    REP-->>SRV: rows + total
    SRV-->>RT: paged DTOs
    RT-->>UI: { items, total, page, page_size }
```

**CRIMA AI query (semantic):** see Pipeline section below.

## 4. CRIMA AI Pipeline

```mermaid
flowchart LR
    Q[User query] --> I[Intent Detection]
    I --> E[Parameter Extraction: case id / district / category / dates]
    E --> B{Branch by intent}
    B -->|analytics| SQLQ[Structured SQL query]
    B -->|case search/detail| SQLQ
    B -->|similar cases| EMB[Embed query with Sentence Transformers]
    B -->|summary/evidence| SQLQ
    SQLQ --> C[Build context]
    EMB --> FAISS[FAISS top-k retrieval]
    FAISS --> C
    C --> GEN[Response Composer - grounded templates]
    GEN --> SC[Source attribution + confidence]
    SC --> OUT[Answer to UI with source chips]
```

Every branch returns **source records**; the composer cannot reference records that were not retrieved. Refusal path when zero matches.

## 5. Local Architecture

- Single machine: `scripts/dev.ps1`/`dev.sh` starts backend (uvicorn on :8000) and frontend (Vite on :5173, proxy `/api`).
- SQLite `data/crimeintel.db`, FAISS `data/indexes/cases.index`, uploads `storage/`.
- Embedding model cached under `~/.cache` (Hugging Face) — one-time download.
- No cloud account, no internet at runtime required.

## 6. Target Catalyst Architecture

```mermaid
flowchart LR
    Slate[Catalyst Slate / Web Hosting - React]
    AppSail[Catalyst AppSail - FastAPI]
    DS[Catalyst Data Store]
    STR[Catalyst Stratus]
    CA[Catalyst Authentication]
    QML[Catalyst QuickML - evaluate]
    Slate --> AppSail --> DS
    AppSail --> STR
    AppSail --> CA
    AppSail --> QML
```

FastAPI app is containerized/uploaded as-is; data store repository replaces SQLite repository via config switch.

## 7. Integration Points

| Interface | Local impl | Catalyst impl |
|---|---|---|
| `UserRepository`, `CaseRepository`, `EvidenceRepository`, `AuditLogRepository`, `ReportRepository`, `ConversationRepository` | SQLAlchemy/SQLite | Catalyst Data Store |
| `StorageProvider` (`put`, `get`, `delete`) | local filesystem | Stratus |
| `JwtProvider` (`issue`, `verify`) | PyJWT | Catalyst Auth |
| `AiProvider` (`embed`, `search`, `answer`) | ST + FAISS + composer | QuickML (evaluate) |

Configuration via `.env`: `DATABASE__PROVIDER=sqlite`, `STORAGE__PROVIDER=local`, `AUTH__PROVIDER=local`, `AI__PROVIDER=local`.

## 8. Adapter/Provider Architecture

```mermaid
flowchart TB
    SRV[Service]
    SRV --> IF1[CaseRepository <<interface>>]
    SRV --> IF2[StorageProvider <<interface>>]
    SRV --> IF3[JwtProvider <<interface>>]
    SRV --> IF4[AiProvider <<interface>>]
    IF1 --> S1[SqliteCaseRepository]
    IF1 -.later.-> S2[CatalystCaseRepository]
    IF2 --> P1[LocalFileStorageProvider]
    IF2 -.later.-> P2[StratusStorageProvider]
    IF3 --> J1[LocalJwtProvider]
    IF3 -.later.-> J2[CatalystAuthProvider]
    IF4 --> A1[LocalAiProvider]
    IF4 -.later.-> A2[QuickMlAiProvider]
```

Selection: a factory reads `*__PROVIDER` env vars and returns the correct implementation. **Services only ever see interfaces.**

## 9. Repository Structure (target)

```
CrimeIntelAI/
├── docs/            # source of truth (this document set)
├── frontend/        # React + TS + Tailwind
├── backend/         # FastAPI app
├── ai/              # CRIMA AI pipeline (embeddings, intent, retrieval, generation)
├── data/            # seed data, generated .db, FAISS indexes
├── storage/         # uploaded evidence (local FS)
├── scripts/         # setup, seed, dev, test helpers
├── tests/           # backend / AI / integration tests
└── .github/         # templates + CI (Phase 8+)
```

## 10. Current Implementation State

**Nothing is implemented.** This repository currently contains documentation and directory scaffolding only (Phase 0). See `ROADMAP.md` for what comes next.