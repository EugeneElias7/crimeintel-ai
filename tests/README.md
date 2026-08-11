# tests/

Test suites (arrive with their phases):

| Dir | Scope | Phase |
|---|---|---|
| `unit/` | backend services/repositories/adapters | 1+ |
| `integration/` | API contract tests (httpx against app) | 2+ |
| `ai/` | golden question set + evaluation harness | 4 |

Golden set: `tests/ai/golden_questions.json` (see `docs/AI_SPECIFICATION.md` §13).

**Status: Phase 0 — empty.**
