# backend/

FastAPI application (Python 3.11+). Planned structure (Phase 1+):

```
backend/
├── app/
│   ├── main.py            # FastAPI app factory
│   ├── config.py          # env-driven settings
│   ├── middleware/        # auth, error handler, logging, audit, rate limit
│   ├── routers/           # /api/v1 endpoints per API_CONTRACT.md
│   ├── services/          # business logic (never touches adapters directly)
│   ├── repositories/      # interfaces (CaseRepository, UserRepository, ...)
│   ├── adapters/          # SQLite + later Catalyst Data Store impls
│   ├── models/            # SQLAlchemy models (DATABASE_SCHEMA.md)
│   └── schemas/           # Pydantic request/response models
├── requirements.txt
└── requirements-dev.txt
```

**Status: Phase 0 — empty scaffolding. No code yet.**
See `docs/API_CONTRACT.md` for the API contract and `docs/ARCHITECTURE.md` for layering rules.
