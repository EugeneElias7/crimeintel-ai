# API_CONTRACT.md

> **CrimeIntel AI** — REST API contract, version `/api/v1`
> Status: Phase 0 — contract defined, not implemented

---

## 0. Conventions

- Base URL: `/api/v1` (dev: `http://localhost:8000/api/v1`).
- All endpoints require `Authorization: Bearer <access_token>` **unless marked 🔓**.
- Errors: HTTP status + `{"detail": {"code": "...", "message": "..."}}`. Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`.
- Pagination params: `page` (1-based), `page_size` (default 20, max 100). Response: `{ "items": [], "total": n, "page": p, "page_size": s }`.
- Timestamps ISO-8601 UTC. Content-Type `application/json` (multipart for uploads).
- Roles: `admin` ⊃ `investigator` ⊃ `analyst` ⊃ `viewer` for permission checks. Listed permissions are minimums.

---

## 1. Authentication APIs

### POST /auth/login 🔓
Authenticate and receive tokens.

- **Request:** `{ "username": "kavya", "password": "..." }`
- **Response 200:** `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "expires_in": 900, "user": { "id": 1, "username": "kavya", "full_name": "...", "role": "investigator" } }`
- **Errors:** `401 UNAUTHORIZED` (bad credentials or inactive user), `422 VALIDATION_ERROR`

### POST /auth/refresh 🔓
- **Request:** `{ "refresh_token": "..." }`
- **Response 200:** `{ "access_token": "...", "token_type": "bearer", "expires_in": 900 }`
- **Errors:** `401 UNAUTHORIZED` (expired/invalid)

### POST /auth/logout
- **Request:** `{}` (bearer token)
- **Response 204** — server-side invalidation (token blacklist in local MVP)
- **Errors:** `401 UNAUTHORIZED`

### GET /auth/me
- **Response 200:** `{ "id": 1, "username": "kavya", "full_name": "...", "email": "...", "role": "investigator", "last_login_at": "..." }`
- **Errors:** `401 UNAUTHORIZED`

### PUT /auth/change-password
- **Request:** `{ "current_password": "...", "new_password": "..." }`
- **Response 200:** `{ "message": "password changed" }`
- **Errors:** `400 BAD_REQUEST` (wrong current password), `401 UNAUTHORIZED`

---

## 2. Case APIs

### GET /cases
List with filters. Permission: all authenticated.

- **Query params:** `district`, `category`, `status`, `priority`, `search` (text), `from` (occurred_at), `to`, `page`, `page_size`, `sort` (`occurred_at|created_at|updated_at`, `-` for desc)
- **Response 200:** `{ "items": [ { "id": 4, "case_number": "CASE-1024", "title": "...", "category": "vehicle_theft", "district": "Bengaluru Urban", "status": "under_investigation", "priority": "high", "occurred_at": "...", "created_at": "...", "evidence_count": 3 } ], "total": 127, "page": 1, "page_size": 20 }`
- **Errors:** `401`, `422 VALIDATION_ERROR`

### GET /cases/{id}
- **Response 200:** full case: `{ "id": 4, "case_number": "CASE-1024", "title": "...", "description": "...", "category": "...", "district": "...", "locality": "...", "status": "...", "priority": "...", "reported_at": "...", "occurred_at": "...", "resolved_at": null, "created_by": {...}, "assigned_to": {...} | null, "persons": [ { "id": 9, "role": "suspect", "full_name": "...", "status": "arrested" } ], "evidence": [ { "id": 2, "name": "...", "evidence_type": "image" } ], "events": [ { "id": 1, "event_type": "case_created", "description": "...", "occurred_at": "..." } ] }`
- **Errors:** `401`, `404 NOT_FOUND`

### GET /cases/{id}/similar
- **Query params:** `limit` (default 5, max 10)
- **Response 200:** `{ "case_number": "CASE-1024", "similar": [ { "case_id": 12, "case_number": "CASE-1032", "title": "...", "district": "...", "category": "...", "score": 0.87 } ] }`
- **Errors:** `401`, `404`, `503` (index not built)

### POST /cases
Permission: `investigator`+.

- **Request:** `{ "title": "...", "description": "...", "category": "...", "district": "...", "locality": "...", "status": "open", "priority": "medium", "reported_at": "...", "occurred_at": "...", "assigned_to": 3 | null }`
- **Response 201:** created case (as GET /cases/{id})
- **Errors:** `401`, `403 FORBIDDEN`, `422`

### PUT /cases/{id}
Permission: `investigator`+.

- **Request:** partial fields as POST. **Response 200:** updated case.
- **Errors:** `401`, `403`, `404`, `422`

### DELETE /cases/{id}
Permission: `investigator`+ (audited).

- **Response 204.** Errors: `401`, `403`, `404`

### POST /cases/{id}/events
Permission: `investigator`+.

- **Request:** `{ "event_type": "note_added", "description": "...", "occurred_at": "..." }`
- **Response 201:** `{ "id": 8, "case_id": 4, "event_type": "note_added", "description": "...", "occurred_at": "...", "created_at": "..." }`
- **Errors:** `401`, `403`, `404`, `422`

---

## 3. Evidence APIs

### GET /cases/{case_id}/evidence
- **Response 200:** `{ "items": [ { "id": 2, "name": "cctv_frame.jpg", "description": "...", "evidence_type": "image", "file_size": 204800, "mime_type": "image/jpeg", "uploaded_by": { "id": 1, "full_name": "..." }, "created_at": "..." } ], "total": 3 }`
- **Errors:** `401`, `404`

### POST /cases/{case_id}/evidence
Permission: `investigator`+. Multipart/form-data.

- **Request fields:** `file` (binary), `name` (optional, defaults to filename), `description`, `evidence_type`
- **Response 201:** evidence object as above (incl. `storage_path` omitted).
- **Errors:** `401`, `403`, `404`, `413` (too large, limit 25 MB), `422`

### GET /evidence/{id}/download
- **Response 200:** binary stream (`Content-Disposition: attachment`). Audited.
- **Errors:** `401`, `404`

### DELETE /evidence/{id}
Permission: `investigator`+. Audited. Removes metadata + stored file.

- **Response 204.** Errors: `401`, `403`, `404`

---

## 4. Dashboard APIs

### GET /dashboard/summary
- **Response 200:** `{ "total_cases": 300, "open_cases": 154, "under_investigation": 41, "critical_cases": 12, "resolved_this_month": 23, "total_evidence": 740, "recent_activity": [ { "id": 1, "action": "create", "entity_type": "case", "entity_id": 5, "user": "kavya", "created_at": "..." } ] }`
- **Errors:** `401`

### GET /dashboard/cases-by-district
- **Response 200:** `{ "items": [ { "district": "Bengaluru Urban", "count": 88 } ] }`
- **Errors:** `401`

### GET /dashboard/cases-by-category
- **Response 200:** `{ "items": [ { "category": "vehicle_theft", "count": 54 } ] }`
- **Errors:** `401`

### GET /dashboard/recent-cases
- **Query params:** `limit` (default 8). **Response 200:** list like GET /cases items (no pagination envelope; `items` only).
- **Errors:** `401`

---

## 5. Analytics APIs

### GET /analytics/cases-by-district
- **Query params:** `category`, `from`, `to`, `status`
- **Response 200:** `{ "items": [ { "district": "...", "count": 88 } ] }`

### GET /analytics/cases-by-category
- **Query params:** `district`, `from`, `to`, `status`
- **Response 200:** `{ "items": [ { "category": "...", "count": 54 } ] }`

### GET /analytics/cases-by-status
- **Response 200:** `{ "items": [ { "status": "open", "count": 154 } ] }`

### GET /analytics/monthly-trend
- **Query params:** `months` (default 12)
- **Response 200:** `{ "items": [ { "month": "2026-01", "count": 21 } ] }`

### GET /analytics/average-resolution-days
- **Query params:** `category`, `district`
- **Response 200:** `{ "average_days": 34.2, "closed_count": 89 }`

All: `401` on failure; `422` on bad params.

---

## 6. Reports APIs

### GET /reports
- **Query params:** `page`, `page_size`
- **Response 200:** `{ "items": [ { "id": 1, "title": "...", "report_type": "analytics_snapshot", "status": "ready", "created_at": "...", "created_by": "arjun" } ], "total": 4, "page": 1, "page_size": 20 }`
- **Errors:** `401`

### POST /reports
Permission: `analyst`+.

- **Request:** `{ "title": "...", "report_type": "case_summary" | "analytics_snapshot" | "district_summary", "params": { "district": "...", "category": "...", "from": "...", "to": "..." } }`
- **Response 201:** `{ "id": 1, "title": "...", "report_type": "...", "status": "generating", "created_at": "..." }`
- **Errors:** `401`, `403`, `422`

### GET /reports/{id}/download
- **Response 200:** PDF/CSV stream. **Errors:** `401`, `404`, `409` (still generating)

### DELETE /reports/{id}
Permission: creator or `admin`. Audited.

- **Response 204.** Errors: `401`, `403`, `404`

---

## 7. Admin APIs

Permission: `admin` unless noted.

### GET /admin/users
- **Query params:** `role`, `status` (`active`/`inactive`), `search`, `page`, `page_size`
- **Response 200:** `{ "items": [ { "id": 1, "username": "kavya", "full_name": "...", "email": "...", "role": "investigator", "is_active": 1, "last_login_at": "..." } ], "total": 6, "page": 1, "page_size": 20 }`
- **Errors:** `401`, `403`

### POST /admin/users
- **Request:** `{ "username": "...", "full_name": "...", "email": "...", "password": "...", "role": "investigator" }`
- **Response 201:** user (no password hash). **Errors:** `401`, `403`, `409` (username/email exists), `422`

### PUT /admin/users/{id}
- **Request:** `{ "full_name": "...", "email": "...", "role": "...", "is_active": 1 }`
- **Response 200:** updated user. **Errors:** `401`, `403`, `404`, `409`, `422`

### POST /admin/users/{id}/reset-password
- **Request:** `{ "new_password": "..." }`. **Response 200:** `{ "message": "password reset" }`
- **Errors:** `401`, `403`, `404`

### GET /admin/audit-logs
- **Query params:** `user_id`, `action`, `entity_type`, `from`, `to`, `page`, `page_size`
- **Response 200:** `{ "items": [ { "id": 1, "user": "kavya", "action": "ai_query", "entity_type": "crima", "entity_id": 4, "details": "{}", "ip_address": "127.0.0.1", "created_at": "..." } ], "total": 512, "page": 1, "page_size": 20 }`
- **Errors:** `401`, `403`

### GET /admin/settings
- **Response 200:** `{ "app_name": "CrimeIntel AI", "dataset_name": "Synthetic KSP Demo v1", "dataset_size": 300, "ai_enabled": true, "embedding_model": "sentence-transformers/all-MiniLM-L6-v2" }`
- **Errors:** `401`, `403`

### PUT /admin/settings
- **Request:** `{ "app_name": "...", "dataset_name": "...", "ai_enabled": true }` (partial)
- **Response 200:** updated settings. **Errors:** `401`, `403`, `422`

---

## 8. CRIMA AI APIs

### POST /crima/chat
Send a message and get the grounded answer.

- **Request:** `{ "conversation_id": 5 | null, "message": "Find vehicle theft cases in Bengaluru" }`
- **Response 200:**
```json
{
  "conversation_id": 5,
  "message": {
    "id": 41,
    "role": "assistant",
    "content": "I found 12 vehicle theft cases in Bengaluru Urban. Most recent: CASE-1032 ...",
    "intent": "case_search",
    "confidence": 0.97,
    "sources": [
      { "case_id": 12, "case_number": "CASE-1032", "title": "...", "district": "Bengaluru Urban", "score": 0.93 },
      { "case_id": 14, "case_number": "CASE-1041", "title": "...", "district": "Bengaluru Urban", "score": 0.90 }
    ],
    "suggestions": ["Summarize CASE-1032", "What evidence is associated with CASE-1032?"],
    "created_at": "..."
  }
}
```
- **Errors:** `401`, `422`, `503` (AI pipeline not initialized), `429 RATE_LIMITED`

### GET /crima/conversations
- **Response 200:** `{ "items": [ { "id": 5, "title": "Vehicle theft Bengaluru", "message_count": 8, "updated_at": "..." } ], "total": 3 }`
- **Errors:** `401`

### GET /crima/conversations/{id}
- **Response 200:** `{ "id": 5, "title": "...", "messages": [ { "id": 40, "role": "user", "content": "...", "intent": "case_search", "sources": null, "created_at": "..." }, ... ] }`
- **Errors:** `401`, `404`

### DELETE /crima/conversations/{id}
- **Response 204.** Errors: `401`, `404`

### POST /crima/feedback
- **Request:** `{ "message_id": 41, "feedback": 1 | -1 }`
- **Response 200:** `{ "message": "feedback recorded" }`. **Errors:** `401`, `404`, `422`

---

## 9. Notifications APIs (P1)

### GET /notifications
- **Query params:** `unread_only` (bool), `page`, `page_size`
- **Response 200:** `{ "items": [ { "id": 1, "title": "...", "message": "...", "notification_type": "case_assignment", "is_read": 0, "created_at": "..." } ], "total": 5, "unread": 2 }`
- **Errors:** `401`

### POST /notifications/{id}/read
- **Response 200:** `{ "message": "marked read" }`. **Errors:** `401`, `404`

---

## 10. Status Codes Summary

| Code | Meaning |
|---|---|
| 200 / 201 / 204 | Success |
| 400 | Bad request / business rule violation |
| 401 | Missing/invalid token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate username/email) |
| 413 | Upload too large |
| 422 | Validation error |
| 429 | Rate limited (CRIMA chat) |
| 503 | Dependency not ready (AI index/model) |

## 11. Current State

Contract defined only. No endpoint is implemented yet.