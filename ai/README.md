# ai/

CRIMA AI pipeline (owned by Eugene). Planned structure (Phase 4+):

```
ai/
├── embedding/    # Sentence Transformers wrapper (lazy load, cache)
├── intent/       # intent detection + parameter extraction
├── retrieval/    # FAISS index build/query + hybrid retrieval
├── generation/   # template composer + pluggable LLM adapter
└── __init__.py
```

Everything is consumed through the `AiProvider` interface defined in
`backend/app/repositories/` (see `docs/ARCHITECTURE.md` §8).

**Status: Phase 0 — empty scaffolding. No code yet.**
Full design: `docs/AI_SPECIFICATION.md`.
