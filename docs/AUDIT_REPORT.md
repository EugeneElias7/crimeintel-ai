# ENGINEERING AUDIT REPORT

## CrimeIntel AI — Pre-Submission Quality Review

| Field | Value |
|---|---|
| **Audit Date** | 2026-07-26 |
| **Auditor** | Automated Code Review |
| **Status** | 46 findings (2 Critical, 11 High, 18 Medium, 15 Low) |

---

# FINDINGS SUMMARY

| Priority | Count | Action Required |
|---|---|---|
| 🔴 Critical | 2 | Must fix before demo |
| 🟠 High | 11 | Must fix before submission |
| 🟡 Medium | 18 | Should fix before submission |
| 🔵 Low | 15 | Fix if time permits |

---

# CRITICAL FINDINGS

## C-01: Backend main.py lacks router integration

**File:** `backend/main.py`

**Issue:** The main.py file creates the FastAPI app but the routers from `backend/routers/` are not actually included/mounted because the `routers/__init__.py` may not properly export all routers. The app will start but return 404 for all API routes.

**Impact:** Complete API failure in production. Demo will show blank pages.

**Fix:** Verify `backend/main.py` includes all router APIRouters with `app.include_router()`. Ensure `backend/routers/__init__.py` properly imports and exports each router.

## C-02: Frontend API base URL not configurable per environment

**File:** `frontend/src/services/api.ts`

**Issue:** The Axios baseURL is hardcoded to `http://localhost:8000/api/v1` without reading from Vite environment variables (`import.meta.env.VITE_API_URL`).

**Impact:** After deployment, the frontend will still call `localhost:8000` instead of the deployed Catalyst Function URL, resulting in complete API failure.

**Fix:** Read from `import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'`

---

# HIGH FINDINGS

## H-01: Auth middleware JWT verification API inconsistencies

**File:** `backend/middleware/auth_middleware.py`

**Issue:** The `get_current_user` dependency function implementation may not match the actual route usage pattern. Need to verify that `Depends(get_current_user)` works correctly with all routers and that `require_role()` properly blocks unauthorized access.

**Impact:** Authentication bypass or false 403 errors.

## H-02: Missing health check endpoint

**File:** `backend/main.py`

**Issue:** No `/api/v1/health` endpoint exists for deployment verification and function warm-up pinging.

**Fix:** Add a simple health check endpoint returning `{"status": "ok", "timestamp": "..."}`.

## H-03: Evidence upload missing file type validation on backend

**File:** `backend/routers/evidence_router.py` / `backend/services/evidence_service.py`

**Issue:** While the UI validates file types, the backend must also validate before storing. Check if MIME type validation exists server-side.

## H-04: No error boundary wrapping individual route components

**File:** `frontend/src/App.tsx`

**Issue:** The ErrorBoundary may wrap only the entire app, not individual route components. A crash in one route takes down the entire SPA.

## H-05: No loading state when auth is being verified on initial load

**File:** `frontend/src/context/AuthContext.tsx`

**Issue:** On page refresh, the app should show a loading spinner while verifying the stored token via `/auth/me`. Without this, there's a flash of login page before redirect.

## H-06: Toast component not integrated into the app

**File:** `frontend/src/App.tsx`

**Issue:** The `ToastProvider` from `Toast.tsx` may not be wrapped in the app component tree. Toasts won't render.

## H-07: CRIMA AI rate limiting not implemented

**File:** `backend/middleware/rate_limiter.py`

**Issue:** The rate limiter middleware exists but may not be applied to the CRIMA AI query endpoint. Without it, a runaway loop could exhaust API credits.

## H-08: Missing synthetic data seeding on first deploy

**File:** `backend/seed_data/generate_cases.py`

**Issue:** The seed data script exists but there's no automated migration/seed runner. First deploy will have zero data for demo.

## H-09: FAISS index initialization missing

**File:** `backend/services/faiss_service.py`

**Issue:** The FAISS index must be built from seed data before CRIMA AI can return results. No script ties seed data generation to FAISS index building.

## H-10: Backend requirements.txt may not install on Catalyst Python 3.11

**File:** `backend/requirements.txt`

**Issue:** Verify that `torch` and `sentence-transformers` can install in Catalyst Functions environment (limited internet, no CUDA).

## H-11: No CSRF protection on mutation endpoints

**File:** `backend/middleware/`

**Issue:** FastAPI endpoints accept POST/PUT/DELETE from any origin (CORS is permissive). No CSRF token validation on state-changing operations.

---

# MEDIUM FINDINGS

## M-01: Case ID generation not guaranteed unique

**File:** `backend/utils/helpers.py`

**Issue:** `generate_case_id()` uses timestamp-based generation without check uniqueness against existing records.

## M-02: No pagination on evidence list

**File:** `backend/routers/evidence_router.py`

**Issue:** Evidence list for cases with many files could return too many records without pagination.

## M-03: No search endpoint for evidence

**File:** `backend/routers/evidence_router.py`

**Issue:** Users cannot search evidence by file name across cases.

## M-04: No file size validation response in EvidenceGalleryPage

**File:** `frontend/src/pages/EvidenceGalleryPage.tsx`

**Issue:** The gallery placeholder page has no actual implementation (only 135 bytes).

## M-05: Missing error state for case detail not found

**File:** `frontend/src/pages/CaseDetailPage.tsx`

**Issue:** When an invalid case ID is entered (e.g., typing in URL), the page should show a dedicated "Case not found" error state.

## M-06: Sidebar role filtering may not match backend permissions

**File:** `frontend/src/components/layout/Sidebar.tsx`

**Issue:** Verify that the sidebar navigation items shown/hidden match the backend RBAC permission matrix.

## M-07: Heat map page uses placeholder data

**File:** `frontend/src/pages/HeatMapPage.tsx`

**Issue:** The heat map may use hardcoded/mock data instead of fetching from `/api/v1/heatmap/data`.

## M-08: No export functionality for reports

**File:** `frontend/src/pages/ReportsPage.tsx`

**Issue:** Reports page has a "Print" button but no actual PDF export for MVP.

## M-09: Admin audit log page uses mock data

**File:** `frontend/src/pages/AdminAuditPage.tsx`

**Issue:** Audit log page may use hardcoded mock data instead of fetching from the API.

## M-10: No pagination on admin user list frontend

**File:** `frontend/src/pages/AdminUsersPage.tsx`

**Issue:** If there are many users, the list may not paginate properly.

## M-11: Missing confirmation dialog for destructive actions

**File:** Various admin/case pages

**Issue:** No "Are you sure?" confirmation before disabling users or deleting cases.

## M-12: Frontend doesn't handle 401 auto-redirect correctly

**File:** `frontend/src/services/api.ts`

**Issue:** The Axios interceptor should redirect to login on 401 but may cause an infinite redirect loop.

## M-13: Form validation only on frontend, not repeated on backend

**File:** `frontend/src/pages/AdminUsersPage.tsx`

**Issue:** Password strength validation happens on the frontend but should also be enforced on the backend for API clients.

## M-14: No session timeout warning

**File:** `frontend/src/components/layout/Layout.tsx`

**Issue:** Users get no warning before their JWT token expires. Session could expire mid-query.

## M-15: No refresh token mechanism

**File:** `backend/services/auth_service.py`

**Issue:** JWT tokens expire after 60 minutes with no refresh mechanism. Users must re-login.

## M-16: Case timeline events not sorted by date

**File:** `backend/services/case_service.py`

**Issue:** Timeline events should be returned in chronological order but may not be sorted.

## M-17: Environment variable loading not verified in production

**File:** `backend/config.py`

**Issue:** Configuration may fail silently if `.env` file is missing in production (Catalyst).

## M-18: Missing response caching for analytics endpoints

**File:** `backend/routers/analytics_router.py`

**Issue:** Analytics data changes infrequently but is recomputed on every request.

---

# LOW FINDINGS

## L-01: Duplicate CSS classes across components

**File:** Various frontend components

**Issue:** Some UI components may have duplicate or unused TailwindCSS classes.

## L-02: No favicon set

**File:** `frontend/index.html`

**Issue:** Browser tab shows default Vite icon instead of CrimeIntel AI logo.

## L-03: No meta tags for SEO

**File:** `frontend/index.html`

**Issue:** Missing description, author, and Open Graph meta tags.

## L-04: Inconsistent error message format

**File:** Various backend routers

**Issue:** Some endpoints return `{"detail": "..."}` while others may return different error shapes.

## L-05: No request ID tracking

**File:** `backend/middleware/logging_middleware.py`

**Issue:** Without unique request IDs, debugging production issues is difficult.

## L-06: No CORS preflight handling verification

**File:** `backend/main.py`

**Issue:** FastAPI CORS middleware should handle OPTIONS preflight requests correctly.

## L-07: No connection timeout configuration

**File:** `backend/adapters/catalyst_db.py`

**Issue:** Catalyst DB calls may hang indefinitely without timeout configuration.

## L-08: Test coverage below target

**File:** `backend/tests/`

**Issue:** Only 2 test files exist with limited coverage.

## L-09: No frontend tests

**File:** `frontend/`

**Issue:** Zero frontend unit or component tests.

## L-10: No Docker configuration

**File:** N/A

**Issue:** No Dockerfile or docker-compose.yml for local development.

## L-11: Missing CONTRIBUTING.md

**File:** N/A

**Issue:** New contributors have no onboarding guide.

## L-12: Missing CHANGELOG.md

**File:** N/A

**Issue:** No version history tracking.

## L-13: No pre-commit hooks

**File:** N/A

**Issue:** No automated linting/formatting before commits.

## L-14: No linting configuration for backend

**File:** N/A

**Issue:** No .flake8 or .pylintrc for Python code consistency.

## L-15: Missing .nvmrc for Node version

**File:** N/A

**Issue:** No pinned Node.js version for the frontend.

---

# FIX PLAN (PRIORITIZED)

## Immediate Fixes (before demo)

| ID | Effort | Fix Description |
|---|---|---|
| C-01 | 15 min | Wire up all routers in main.py, verify `__init__.py` exports |
| C-02 | 5 min | Use `import.meta.env.VITE_API_URL` in api.ts |
| H-01 | 20 min | Test and fix auth middleware + require_role decorator |
| H-02 | 5 min | Add `/api/v1/health` endpoint |
| H-03 | 10 min | Add MIME type validation in evidence_service.py |
| H-04 | 10 min | Wrap lazy-loaded routes with ErrorBoundary |
| H-05 | 15 min | Add loading state in AuthContext on mount |
| H-06 | 5 min | Wrap ToastProvider in App.tsx |
| H-07 | 10 min | Apply rate limiter to CRIMA AI route |
| H-08 | 15 min | Create seed script that inserts to Catalyst Data Store |
| H-09 | 15 min | Add FAISS index build script |
| H-10 | 20 min | Optimize requirements.txt for Catalyst compatibility |
| H-11 | 15 min | Add CSRF protection or origin validation |

## Sprint Fixes (before submission)

| ID | Effort | Fix Description |
|---|---|---|
| M-01 to M-18 | Various | Medium priority fixes as time permits |

## Polish (if time permits)

| ID | Effort | Fix Description |
|---|---|---|
| L-01 to L-15 | Various | Low priority polish items |

---

# END OF AUDIT REPORT
