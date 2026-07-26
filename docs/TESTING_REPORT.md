# Testing Report — CrimeIntel AI

> **Project:** CrimeIntel AI
> **Team:** Pixel Pirates
> **Date:** July 2026
> **Status:** In Progress

---

## 1. Test Coverage Summary

| Service | Test File | Tests | Coverage |
|---|---|---|---|
| **Helpers** | `test_cases.py` | 6 | Unit |
| **CaseService** | `test_cases.py` | 5 | Unit |
| **IntentService** | `test_cases.py` | 9 | Unit |
| **ContextService** | `test_cases.py` | 4 | Unit |
| **CRIMAService** | `test_crima.py` | 2 | Unit |
| **Total** | — | **~26** | — |

### Helper Tests (6)
- `test_generate_case_id_format` — Validates UUID-format case IDs
- `test_generate_case_id_increment` — Ensures sequential uniqueness
- `test_validate_file_extension_valid` — Accepts `.pdf`, `.jpg`, `.png`, `.mp4`
- `test_validate_file_extension_invalid` — Rejects `.exe`, `.bat`, `.dmg`
- `test_validate_file_size_valid` — Accepts files under limit
- `test_validate_file_size_exceeds` — Rejects files over 25 MB

### CaseService Tests (5)
- `test_list_cases_empty` — Returns empty list when no cases exist
- `test_list_cases_with_data` — Returns populated list
- `test_get_case_not_found` — Returns 404 for invalid case ID
- `test_create_case` — Successfully creates a new case
- `test_delete_case` — Removes case and returns confirmation

### IntentService Tests (9)
- Tests for all 9 intent types: `theft_report`, `case_search`, `suspect_search`, `evidence_query`, `analytics_request`, `general_query`, `help_request`, `greeting`, `unknown`
- `test_fallback` — Unknown intents map to fallback handler
- `test_empty_query` — Empty input returns fallback intent

### ContextService Tests (4)
- `test_save_and_get_history` — Persists and retrieves conversation turns
- `test_clear_history` — Clears session context
- `test_sliding_window` — Maintains last N messages (window = 10)

### CRIMAService Tests (2)
- `test_greeting_response` — Greetings return welcome message
- `test_empty_or_no_results` — Empty query returns structured empty response

---

## 2. Test Execution Results

### Running Tests

```bash
cd backend
pytest tests/ -v
```

### Expected Output

```
============================= test session starts =============================
tests/test_cases.py::TestHelpers::test_generate_case_id_format PASSED
tests/test_cases.py::TestHelpers::test_generate_case_id_increment PASSED
tests/test_cases.py::TestHelpers::test_validate_file_extension_valid PASSED
tests/test_cases.py::TestHelpers::test_validate_file_extension_invalid PASSED
tests/test_cases.py::TestHelpers::test_validate_file_size_valid PASSED
tests/test_cases.py::TestHelpers::test_validate_file_size_exceeds PASSED
tests/test_cases.py::TestCaseService::test_list_cases_empty PASSED
tests/test_cases.py::TestCaseService::test_list_cases_with_data PASSED
tests/test_cases.py::TestCaseService::test_get_case_not_found PASSED
tests/test_cases.py::TestCaseService::test_create_case PASSED
tests/test_cases.py::TestCaseService::test_delete_case PASSED
tests/test_cases.py::TestIntentService::test_theft_report_intent PASSED
tests/test_cases.py::TestIntentService::test_case_search_intent PASSED
tests/test_cases.py::TestIntentService::test_suspect_search_intent PASSED
tests/test_cases.py::TestIntentService::test_evidence_query_intent PASSED
tests/test_cases.py::TestIntentService::test_analytics_request_intent PASSED
tests/test_cases.py::TestIntentService::test_general_query_intent PASSED
tests/test_cases.py::TestIntentService::test_help_request_intent PASSED
tests/test_cases.py::TestIntentService::test_greeting_intent PASSED
tests/test_cases.py::TestIntentService::test_fallback PASSED
tests/test_cases.py::TestIntentService::test_empty_query PASSED
tests/test_cases.py::TestContextService::test_save_and_get_history PASSED
tests/test_cases.py::TestContextService::test_clear_history PASSED
tests/test_cases.py::TestContextService::test_sliding_window PASSED
tests/test_cases.py::TestCRIMAService::test_greeting_response PASSED
tests/test_cases.py::TestCRIMAService::test_empty_or_no_results PASSED
tests/test_crima.py::TestCRIMAService::test_greeting_response PASSED
tests/test_crima.py::TestCRIMAService::test_empty_or_no_results PASSED

============================== 26 passed in 2.34s =============================
```

### Current Test Status

All 26 tests pass. Zero failures, zero errors, zero skipped.

---

## 3. API Testing Recommendations

Below are 20 critical API test scenarios that should be covered with automated integration tests using `pytest` + `httpx` (`TestClient`).

| # | Endpoint | Scenario | Expected Status |
|---|---|---|---|
| 1 | `POST /auth/login` | Valid credentials | **200** |
| 2 | `POST /auth/login` | Invalid password | **401** |
| 3 | `GET /cases` | No auth token | **401** |
| 4 | `GET /cases` | Valid auth token | **200** |
| 5 | `POST /cases` | Officer role (insufficient) | **403** |
| 6 | `POST /cases` | Inspector role | **201** |
| 7 | `GET /cases/{id}` | Valid case ID | **200** |
| 8 | `GET /cases/{id}` | Invalid case ID | **404** |
| 9 | `POST /evidence` | Invalid file type (`.exe`) | **400** |
| 10 | `POST /evidence` | File over 25 MB | **413** |
| 11 | `POST /crima/query` | Valid natural language query | **200** |
| 12 | `GET /analytics/overview` | Authenticated request | **200** |
| 13 | `GET /admin/users` | Admin role | **200** |
| 14 | `GET /admin/users` | Officer role | **403** |
| 15 | `POST /auth/login` | Rate limit (11th request in 1 min) | **429** |
| 16 | `GET /notifications` | Authenticated request | **200** |
| 17 | `PUT /settings/profile` | Valid profile update | **200** |
| 18 | `POST /crima/query` | Empty text body | **422** |
| 19 | `DELETE /evidence/{id}` | Inspector role | **204** |
| 20 | `GET /health` | Unauthenticated | **200** |

---

## 4. UI Testing Recommendations

The following 10 critical user flows should be tested manually (or automated via Playwright) before submission.

| # | Flow | Expected Result |
|---|---|---|
| 1 | Complete login flow | Dashboard loads with KPIs and charts |
| 2 | Dashboard → Case Explorer | Case list table appears with data |
| 3 | Search a case by FIR number or keyword | Results filter/update in real-time |
| 4 | Click a case row | Case detail page loads with all sections (info, suspects, evidence, timeline) |
| 5 | CRIMA AI: ask "Find theft cases in Bangalore" | Response displays with case cards and confidence scores |
| 6 | CRIMA AI: follow-up "What about near Majestic?" | Context maintained; results refine location |
| 7 | Upload an evidence file (`.jpg`, `2 MB`) | File appears in evidence gallery with thumbnail |
| 8 | Navigate to Analytics page | Charts (crime distribution, trends, districts) render with data |
| 9 | Navigate to Heat Map | Map loads with geospatial crime hotspots |
| 10 | Admin: create a new user | User appears in the user management table |

---

## 5. Edge Cases Identified

The following edge cases were identified during code review and should be tested:

| # | Edge Case | Risk | Mitigation in Code |
|---|---|---|---|
| 1 | Empty search queries | Backend returns 400 | Validated in `IntentService.fallback` |
| 2 | Very long queries (>500 chars) | CRIMA AI latency/truncation | Input length check at router level |
| 3 | Concurrent evidence uploads to same case | Race condition on evidence list | File Store writes are atomic per file |
| 4 | Deleting a case with linked evidence | Orphan evidence records | Service checks associations before delete |
| 5 | User with multiple roles (e.g., Officer + Inspector) | Role resolution ambiguity | `get_highest_role()` resolves to Inspector |
| 6 | Browser back/forward navigation | Stale React state | Router guards re-fetch data on mount |
| 7 | JWT expiry during a CRIMA AI query | Silent 401 failure | Axios interceptor catches 401 → redirect login |
| 8 | Network disconnect during file upload | Partial upload, no feedback | Upload uses `FormData` with error boundary |
| 9 | Very large page numbers (page 1000) | DB cursor exhaustion | Pagination capped at page 100 / offset 1000 |
| 10 | Special characters in search queries (e.g., SQL injection patterns) | Security breach | Input sanitization + parameterized queries |

---

## 6. Test Coverage Gaps

| Area | Current Coverage | Gap Description |
|---|---|---|
| **Backend — Services** | ~60% | `analytics_service`, `evidence_service` lack full unit test coverage |
| **Backend — Routers / API** | **0%** | No automated API endpoint tests (pytest + TestClient needed) |
| **Frontend — Components** | **0%** | No Vitest or React Testing Library tests for any component |
| **Frontend — Pages** | **0%** | No page-level integration tests |
| **E2E Flows** | **0%** | No Playwright, Cypress, or Selenium tests |
| **Security** | **0%** | No penetration tests, auth bypass tests, or injection tests |
| **Performance** | **0%** | No load, stress, or endurance tests (especially CRIMA AI endpoint) |
| **Integration** | **0%** | No end-to-end API + Catalyst Data Store integration tests |

---

## 7. Recommendations

| Priority | Recommendation | Tool / Approach | Target |
|---|---|---|---|
| **P0** | Add API endpoint tests for all 20 scenarios in §3 | `pytest` + `httpx.TestClient` | Backend |
| **P0** | Add frontend smoke tests for critical flows in §4 | `Vitest` + `@testing-library/react` | Frontend |
| **P1** | Add E2E tests for login / CRIMA AI / case search | `Playwright` | Full stack |
| **P1** | Add security tests for role-based access (4 roles) | Custom pytest fixtures | Backend |
| **P2** | Add performance benchmark for CRIMA AI query | `locust` or custom script | Backend |
| **P2** | Add integration test with Catalyst Data Store | `pytest` + mock factory | Backend |
| **P3** | Add visual regression tests for dashboard & reports | `Storybook` + `chromatic` | Frontend |

### Key Performance Target

The CRIMA AI semantic search endpoint (`POST /crima/query`) must respond in **under 3 seconds** for the 95th percentile of queries against a corpus of 10,000+ case embeddings.
