# DEMO_SCENARIOS.md

> **CrimeIntel AI** — demo scenarios with synthetic data only
> Status: Phase 0 — script definition; verified during Phase 9 QA

---

## Scenario 1 — Conversational Case Search

**Story:** Investigator opens CRIMA AI, asks a natural-language question.
**Steps:**
1. Log in as `kavya` (investigator).
2. Open CRIMA AI.
3. Ask: *"Find vehicle theft cases in Bengaluru."*
4. Verify: list of vehicle theft cases in Bengaluru Urban returned, count shown, **source chips** for each case.
5. Click `CASE-10XX` chip → Case Detail opens for that case.

## Scenario 2 — Case Summary

**Steps:**
1. In CRIMA AI ask: *"Summarize CASE-1024."*
2. Verify: structured summary (title, category, district, status, persons, key facts) drawn only from that case record.
3. Verify confidence badge and source reference to CASE-1024 only.

## Scenario 3 — Evidence Retrieval

**Steps:**
1. Ask: *"What evidence is associated with CASE-1024?"*
2. Verify: evidence list with types (image/document) linked to the case.
3. From Evidence tab on Case Detail, download an evidence file and confirm contents/banner integrity.
4. Verify audit log records the download (admin account).

## Scenario 4 — Similar Case Retrieval

**Steps:**
1. Ask: *"Find cases similar to CASE-1024."*
2. Verify: 3–5 similar cases with similarity scores, sorted desc, CASE-1024 excluded.
3. Open one similar case and compare fields (district/category overlap).

## Scenario 5 — Analytics Question

**Steps:**
1. Ask: *"Which district has the highest number of theft cases?"*
2. Verify: answer names the district with the count + top contributing case numbers as sources.
3. Cross-check the answer against Analytics page chart (cases by district with theft filter).

## Scenario 6 — Full Investigation Workflow (feature tour)

**Steps:**
1. Dashboard: review KPIs and charts.
2. Case Explorer: filter district = Mysuru, status = open → list.
3. Open a case: read overview, check persons (suspect arrested), view timeline.
4. Add a note event; return to CRIMA AI: *"How many open cases are in Mysuru?"* — answer reflects the state.
5. Generate an analytics snapshot report; download it.

## Scenario 7 — Guardrails (no-hallucination)

**Steps:**
1. Ask: *"Summarize CASE-9999."* (nonexistent) → expect "No records found" refusal, no fabricated data.
2. Ask: *"Predict next month's crimes."* (out of scope) → polite refusal redirecting to supported intents.
3. Ask with an invented case about CRIMA referencing fake facts → verify every cited case number links to a real record.

---

## Demo Credentials (synthetic)

| Username | Role |
|---|---|
| `admin` | administrator |
| `kavya` | investigator |
| `arjun` | analyst |
| `viewer` | viewer |

Passwords: seeded, printed by the seed script output / documented in `docs/DEVELOPMENT_SETUP.md`.

## Success Criteria Per Scenario
- All P0 features exercised.
- Every CRIMA AI answer has sources; zero hallucinated references (Scenario 7 verified).
- Full offline run on a laptop.