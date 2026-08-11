# AI_SPECIFICATION.md — CRIMA AI

> **CrimeIntel AI** — Team Pixel Pirates
> Status: Phase 0 — design only. Implementation begins Phase 4 (see `ROADMAP.md`).

---

## 1. Purpose

CRIMA AI converts natural-language questions about the (synthetic) crime database into **evidence-grounded answers with source references**. It is the primary product feature.

## 2. Supported Intents

| Intent | Example query | Output |
|---|---|---|
| `case_search` | "Find vehicle theft cases in Bengaluru" | Filtered case list, count |
| `case_details` | "Show me details of CASE-1024" | Full case record + status |
| `case_summary` | "Summarize CASE-1024" | Structured summary (fact pattern, persons, status) |
| `similar_cases` | "Find cases similar to CASE-1024" | Top-k semantic matches + similarity scores |
| `evidence_retrieval` | "What evidence is associated with CASE-1024?" | Evidence list with types |
| `analytics_query` | "Which district has the highest number of theft cases?" | Computed answer + qualifying records |
| `greeting` | "Hi" | Conversational openers + suggested intents |
| `clarification` | ambiguity / missing params | Ask for the missing parameter (e.g. which district) |
| `out_of_scope` | predictive/network/OCR/facial questions | Polite refusal, redirection to supported intents |
| `small_talk` / unknown | | Neutral redirect to supported capabilities |

## 3. Query Processing Pipeline

```
raw query
  → normalize (lowercase, strip, spelling aliases)
  → intent detection (classifier + rule fallback)
  → parameter extraction (regex/pattern-based entity extraction)
  → retrieval (structured &/or semantic per intent)
  → context assembly
  → answer composition (grounded templates or LLM adapter)
  → source attribution + confidence
  → persist conversation
```

### 3.1 Intent detection
- Lightweight local classifier (keyword/pattern rules first; optional small fine-tuned classifier later).
- Rule fallback guarantees offline determinism: e.g. `similar` → `similar_cases`; `summar|overview` → `case_summary`; `evidence|exhibit|attach` → `evidence_retrieval`; `highest|most|compare|trend|count by` → `analytics_query`; `CASE-\d+` → detail/summary; district/category mentions with `find|search|list` → `case_search`.

### 3.2 Parameter extraction (heuristics, no external NLP service)
- Case number: regex `CASE-\d+`.
- District: lookup from fixed Karnataka district list + aliases ("Bengaluru" → "Bengaluru Urban").
- Category: keyword mapping ("stolen bike/vehicle" → `vehicle_theft`; "cheating/cyber" → `cybercrime`; etc.).
- Status: `open`/`under investigation`/`closed`/`archived` keywords.
- Dates/ranges: current-year assumption, "last 6 months", month names.
- Unknown but required param → `clarification` intent.

## 4. Embeddings

- Model: `sentence-transformers/all-MiniLM-L6-v2` (384-dim, ~90 MB, CPU-friendly, offline after download).
- Case document text: `title + category + district + locality + description + person names + notes` (concatenated, normalized).
- Query embedding uses the same model; no separate query encoder.
- Embedding service in `ai/embedding/`; lazy-loaded singleton; cached vectors.

## 5. Semantic Retrieval

- **Index:** FAISS `IndexFlatIP` (cosine via normalized vectors) built once by `scripts/build_faiss_index.py`.
- **Mapping:** vector id ↔ case id in `case_embeddings` table (`DATABASE_SCHEMA.md` §3.11).
- **Query:** normalize → embed → `index.search(query_vec, k=20)` → fetch cases via mapping → soft filter by any explicit params (district/category/status).
- **Rebuild:** recompute on reseed; `updated_at` lets incremental rebuild during dev.

## 6. Hybrid Retrieval Strategy

| Intent | Retrieval |
|---|---|
| `case_search` | Structured SQL filters + optional semantic boost |
| `case_details` / `case_summary` | SQL by case number |
| `similar_cases` | FAISS top-k (exclude the case itself) |
| `evidence_retrieval` | SQL by case id |
| `analytics_query` | Aggregation SQL |

## 7. Context Construction

For each retrieved case build a context chunk:

```
[CASE-1024] {title} | {category} | {district} | {status}
{description (truncated 600 chars)}
Persons: [suspect: X (arrested)], [victim: Y]
Evidence: 3 items (image, document)
```

Analytics answers carry the aggregate result plus a sample of qualifying case numbers. Total context stays small enough for template composition and any future LLM window.

## 8. Response Generation

- **Default (MVP): template-based composer** in `ai/generation/`. Each intent has a deterministic template that only slots in values retrieved from the DB/FAISS results. This guarantees: no hallucinations, fast (ms), fully offline.
- **Optional pluggable LLM adapter** (`AiProvider.answer()` interface): local LLM (e.g. Ollama) or QuickML later, given the context + a strict system prompt ("answer only from provided records; cite case numbers; if absent say so").
- No API key required for the MVP path.

## 9. Source Attribution

- Every answer returns `sources: [{case_number, case_id, title, district, score}]`.
- UI renders **source chips** under each answer; clicking opens the case detail.
- Analytics answers list the top contributing case numbers.
- System prompt (LLM path) requires inline citation of case numbers from sources only.

## 10. Hallucination Mitigation

1. Template composer never invents values (default path).
2. LLM adapter prompt: answer only from context; unknown → "no matching records".
3. Post-check (both paths): rendered case numbers must exist in retrieval results; otherwise answer is rejected and regenerated/refused.
4. Empty retrieval → explicit "no records found matching your question" + suggestions.
5. Banner in UI: "Demo environment — synthetic data only."

## 11. Confidence Handling

- `case_search`/`analytics_query`: deterministic, confidence `1.0` (or `0.9` if fuzzy matching used).
- `similar_cases`: FAISS scores normalized → per-result confidence + overall `1 - 1/k` style aggregate.
- Ambiguous params → `clarification` with confidence `low`.
- `out_of_scope` → confidence not shown; refusal message.
- UI: confidence badge only when < 0.85 to avoid noise.

## 12. Conversation History

- Sessions: `crima_conversations` + `crima_messages` (`DATABASE_SCHEMA.md` §3.9/.10).
- Context carried forward: last resolved case(s) — e.g. "What about its evidence?" resolves to previous CASE number.
- UI: conversation list (sidebar within CRIMA AI page), message scrollback, copy answer, feedback (thumbs up/down persisted to `crima_messages.feedback`).

## 13. Evaluation Metrics

Golden question set `tests/ai/golden_questions.json` (~30 queries covering all intents):

| Metric | Definition | MVP target |
|---|---|---|
| Intent accuracy | correct intent detected | ≥ 0.95 |
| Retrieval recall@k | golden relevant case in top-k | ≥ 0.85@10 |
| Answer accuracy | factual correctness (human-annotated for templates: automated equality) | ≥ 0.95 |
| Source accuracy | cited sources ⊆ gold sources | = 1.0 |
| No-hallucination rate | 0 invented case numbers | 100% |
| Latency p95 | time to answer | ≤ 3 s cold, ≤ 1.5 s warm |

## 14. Future QuickML Integration

- Wrap QuickML behind the existing `AiProvider` interface (same contract as local provider).
- Evaluate: embedding quality vs `all-MiniLM-L6-v2`, latency, cost, and data-residency fit.
- Nothing is claimed until a tested QuickML run demonstrates identical API contract behavior.
- See `CATALYST_MIGRATION.md`.

## 15. Current State

Design only. No AI code exists yet in the repository.