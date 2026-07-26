# API SPECIFICATION

## CrimeIntel AI — REST API Documentation

| Field | Value |
|---|---|
| **Base URL** | `https://{catalyst-host}/api/v1` |
| **Protocol** | HTTPS |
| **Content-Type** | `application/json` |
| **Auth Scheme** | Bearer JWT |

---

# TABLE OF CONTENTS

1. [Authentication APIs](#1-authentication-apis)
2. [User APIs](#2-user-apis)
3. [Case APIs](#3-case-apis)
4. [Suspect APIs](#4-suspect-apis)
5. [Witness APIs](#5-witness-apis)
6. [Evidence APIs](#6-evidence-apis)
7. [CRIMA AI APIs](#7-crima-ai-apis)
8. [Analytics APIs](#8-analytics-apis)
9. [Heat Map APIs](#9-heat-map-apis)
10. [Report APIs](#10-report-apis)
11. [Notification APIs](#11-notification-apis)
12. [Settings APIs](#12-settings-apis)
13. [Administration APIs](#13-administration-apis)
14. [Common Response Formats](#14-common-response-formats)
15. [Error Codes](#15-error-codes)

---

# 1. AUTHENTICATION APIS

## 1.1 Login

Authenticates user credentials and returns JWT token.

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/auth/login` | No | All |

### Request

```json
{
  "email": "arun.kumar@ksp.gov.in",
  "password": "SecurePass123!"
}
```

### Validation Rules

| Field | Rule |
|---|---|
| email | Valid email format, max 200 chars, required |
| password | Min 8 chars, required |

### Response 200 — Success

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "user_id": "usr_abc123",
      "display_name": "SI Arun Kumar",
      "email": "arun.kumar@ksp.gov.in",
      "role": "officer",
      "badge_number": "KSP-2024-0789",
      "photo_url": null
    }
  },
  "message": "Login successful"
}
```

### Response 401 — Invalid Credentials

```json
{
  "detail": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

### Response 423 — Account Locked

```json
{
  "detail": "Account temporarily locked due to multiple failed attempts. Try again in 5 minutes.",
  "code": "ACCOUNT_LOCKED"
}
```

## 1.2 Logout

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/auth/logout` | Yes | All |

### Response 200

```json
{
  "message": "Logged out successfully"
}
```

## 1.3 Get Current User

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/auth/me` | Yes | All |

### Response 200

```json
{
  "data": {
    "user_id": "usr_abc123",
    "display_name": "SI Arun Kumar",
    "email": "arun.kumar@ksp.gov.in",
    "role": "officer",
    "badge_number": "KSP-2024-0789",
    "phone": "9876543210",
    "photo_url": null,
    "status": "active",
    "permissions": ["cases:read", "evidence:upload", "crima:query"],
    "created_at": "2026-01-15T10:30:00Z"
  },
  "message": "ok"
}
```

## 1.4 Change Password

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/auth/change-password` | Yes | All |

### Request

```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!",
  "confirm_password": "NewPass456!"
}
```

### Response 200

```json
{
  "message": "Password changed successfully"
}
```

### Response 400

```json
{
  "detail": "Current password is incorrect",
  "code": "INVALID_CURRENT_PASSWORD"
}
```

## 1.5 Request Password Reset

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/auth/reset-password` | No | All |

### Request

```json
{
  "email": "arun.kumar@ksp.gov.in"
}
```

### Response 200

```json
{
  "message": "Password reset link sent to registered email"
}
```

---

# 2. USER APIS

## 2.1 List Users (Admin)

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/admin/users` | Yes | Admin, Super Admin |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| page | int | No | Page number (default: 1) |
| limit | int | No | Items per page (default: 20, max: 100) |
| search | string | No | Search by name or email |
| role | string | No | Filter by role |
| status | string | No | Filter by status |

### Response 200

```json
{
  "data": [
    {
      "user_id": "usr_abc123",
      "display_name": "SI Arun Kumar",
      "email": "arun.kumar@ksp.gov.in",
      "role": "officer",
      "badge_number": "KSP-2024-0789",
      "status": "active",
      "last_login": "2026-07-25T14:30:00Z",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 3
}
```

## 2.2 Create User (Admin)

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/admin/users` | Yes | Admin, Super Admin |

### Request

```json
{
  "display_name": "SI Priya Sharma",
  "email": "priya.sharma@ksp.gov.in",
  "password": "TempPass123!",
  "role": "officer",
  "badge_number": "KSP-2024-0456",
  "phone": "9876543211"
}
```

### Response 201

```json
{
  "data": {
    "user_id": "usr_def456",
    "display_name": "SI Priya Sharma",
    "email": "priya.sharma@ksp.gov.in",
    "role": "officer",
    "status": "active"
  },
  "message": "User created successfully"
}
```

### Response 409

```json
{
  "detail": "A user with this email already exists",
  "code": "EMAIL_EXISTS"
}
```

## 2.3 Update User (Admin)

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/admin/users/{user_id}` | Yes | Admin, Super Admin |

### Request

```json
{
  "display_name": "Insp. Priya Sharma",
  "role": "inspector",
  "status": "active",
  "badge_number": "KSP-2024-0456"
}
```

### Response 200

```json
{
  "data": {
    "user_id": "usr_def456",
    "display_name": "Insp. Priya Sharma",
    "role": "inspector",
    "status": "active"
  },
  "message": "User updated successfully"
}
```

## 2.4 Disable User (Super Admin)

| Method | URL | Auth | Roles |
|---|---|---|---|
| DELETE | `/api/v1/admin/users/{user_id}` | Yes | Super Admin |

### Response 200

```json
{
  "message": "User disabled successfully"
}
```

---

# 3. CASE APIS

## 3.1 List Cases

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/cases` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| page | int | No | Page number (default: 1) |
| limit | int | No | Items per page (default: 20, max: 100) |
| crime_type | string | No | Filter by crime type |
| status | string | No | Filter by status |
| district | string | No | Filter by district |
| date_from | date | No | Start date (YYYY-MM-DD) |
| date_to | date | No | End date (YYYY-MM-DD) |
| officer_id | string | No | Filter by investigating officer |
| sort_by | string | No | Field to sort by (date_filed, status, crime_type) |
| sort_order | string | No | asc or desc (default: desc) |

### Response 200

```json
{
  "data": [
    {
      "case_id": "FIR-2026-000001",
      "fir_number": "KSP-BLR-2026-0789",
      "crime_type": "theft",
      "status": "under_investigation",
      "date_filed": "2026-07-15",
      "location": "Majestic, Bangalore",
      "district": "Bangalore Urban",
      "officer": {
        "user_id": "usr_abc123",
        "display_name": "SI Arun Kumar"
      },
      "priority": "high",
      "evidence_count": 3,
      "suspect_count": 2,
      "created_at": "2026-07-15T09:30:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "pages": 8
}
```

## 3.2 Search Cases

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/cases/search` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| q | string | Yes | Search query (searches case ID, FIR number, location, description) |
| page | int | No | Page number |
| limit | int | No | Items per page |

### Response 200

Same format as List Cases.

## 3.3 Get Case Detail

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/cases/{case_id}` | Yes | All |

### Response 200

```json
{
  "data": {
    "case_id": "FIR-2026-000001",
    "fir_number": "KSP-BLR-2026-0789",
    "crime_type": "theft",
    "status": "under_investigation",
    "date_filed": "2026-07-15",
    "date_closed": null,
    "location": "Majestic, Bangalore",
    "latitude": 12.9767,
    "longitude": 77.5713,
    "district": "Bangalore Urban",
    "description": "Complainant reported theft of mobile phone at Majestic bus stand...",
    "officer": {
      "user_id": "usr_abc123",
      "display_name": "SI Arun Kumar",
      "badge_number": "KSP-2024-0789"
    },
    "priority": "high",
    "suspects": [
      {
        "suspect_id": "sus_001",
        "name": "Ravi Kumar",
        "alias": "Ravi",
        "age": 28,
        "status": "wanted"
      }
    ],
    "witnesses": [
      {
        "witness_id": "wit_001",
        "name": "Suresh Patel",
        "status": "recorded"
      }
    ],
    "evidence_count": 3,
    "timeline_events": [
      {
        "event_id": "evt_001",
        "event_date": "2026-07-15T09:30:00Z",
        "event_type": "fir_registered",
        "description": "FIR registered at Majestic Police Station"
      }
    ],
    "created_at": "2026-07-15T09:30:00Z",
    "updated_at": "2026-07-20T14:00:00Z"
  },
  "message": "ok"
}
```

### Response 404

```json
{
  "detail": "Case FIR-2026-000001 not found",
  "code": "CASE_NOT_FOUND"
}
```

## 3.4 Create Case

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/cases` | Yes | Inspector, Admin, Super Admin |

### Request

```json
{
  "fir_number": "KSP-BLR-2026-0790",
  "crime_type": "assault",
  "date_filed": "2026-07-20",
  "location": "Indiranagar, Bangalore",
  "latitude": 12.9719,
  "longitude": 77.6412,
  "district": "Bangalore Urban",
  "description": "Physical assault reported at Indiranagar main road...",
  "officer_id": "usr_abc123",
  "priority": "medium"
}
```

### Response 201

```json
{
  "data": {
    "case_id": "FIR-2026-000002",
    "fir_number": "KSP-BLR-2026-0790",
    "status": "open",
    "created_at": "2026-07-26T10:00:00Z"
  },
  "message": "Case created successfully"
}
```

## 3.5 Update Case

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/cases/{case_id}` | Yes | Inspector, Admin, Super Admin |

### Request

```json
{
  "status": "under_investigation",
  "priority": "high",
  "description": "Updated case description with new findings..."
}
```

### Response 200

```json
{
  "data": {
    "case_id": "FIR-2026-000002",
    "status": "under_investigation",
    "updated_at": "2026-07-26T11:00:00Z"
  },
  "message": "Case updated successfully"
}
```

## 3.6 Delete Case (Soft Delete)

| Method | URL | Auth | Roles |
|---|---|---|---|
| DELETE | `/api/v1/cases/{case_id}` | Yes | Admin, Super Admin |

### Response 200

```json
{
  "message": "Case FIR-2026-000002 has been archived"
}
```

## 3.7 Get Case Timeline

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/cases/{case_id}/timeline` | Yes | All |

### Response 200

```json
{
  "data": [
    {
      "event_id": "evt_001",
      "event_date": "2026-07-15T09:30:00Z",
      "event_type": "fir_registered",
      "description": "FIR registered at Majestic Police Station",
      "officer": {
        "user_id": "usr_abc123",
        "display_name": "SI Arun Kumar"
      }
    }
  ],
  "message": "ok"
}
```

## 3.8 Add Timeline Event

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/cases/{case_id}/timeline` | Yes | Inspector, Admin, Super Admin |

### Request

```json
{
  "event_date": "2026-07-25T16:00:00Z",
  "event_type": "suspect_identified",
  "description": "Suspect identified through CCTV footage analysis"
}
```

### Response 201

```json
{
  "data": {
    "event_id": "evt_002",
    "event_date": "2026-07-25T16:00:00Z",
    "event_type": "suspect_identified"
  },
  "message": "Timeline event added"
}
```

## 3.9 Get Related Cases

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/cases/{case_id}/related` | Yes | All |

### Response 200

```json
{
  "data": [
    {
      "case_id": "FIR-2026-000005",
      "crime_type": "theft",
      "status": "open",
      "similarity_score": 0.87,
      "shared_suspects": ["Ravi Kumar"],
      "location": "Majestic, Bangalore"
    }
  ],
  "message": "ok"
}
```

---

# 4. SUSPECT APIS

## 4.1 Search Suspects

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/suspects` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| q | string | No | Search by name or alias |
| case_id | string | No | Filter by case |
| status | string | No | Filter by status |
| page | int | No | Page number |
| limit | int | No | Items per page |

### Response 200

```json
{
  "data": [
    {
      "suspect_id": "sus_001",
      "case_id": "FIR-2026-000001",
      "name": "Ravi Kumar",
      "alias": "Ravi",
      "age": 28,
      "status": "wanted",
      "case_crime_type": "theft"
    }
  ],
  "total": 12,
  "page": 1,
  "pages": 1
}
```

## 4.2 Get Suspect Detail

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/suspects/{suspect_id}` | Yes | All |

## 4.3 Add Suspect to Case

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/cases/{case_id}/suspects` | Yes | Inspector, Admin, Super Admin |

### Request

```json
{
  "name": "Ravi Kumar",
  "alias": "Ravi",
  "age": 28,
  "gender": "male",
  "address": "MG Road, Bangalore",
  "status": "wanted"
}
```

### Response 201

```json
{
  "data": {
    "suspect_id": "sus_002",
    "name": "Ravi Kumar",
    "status": "wanted"
  },
  "message": "Suspect added to case"
}
```

## 4.4 Update Suspect

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/suspects/{suspect_id}` | Yes | Inspector, Admin, Super Admin |

## 4.5 Remove Suspect

| Method | URL | Auth | Roles |
|---|---|---|---|
| DELETE | `/api/v1/suspects/{suspect_id}` | Yes | Admin, Super Admin |

---

# 5. WITNESS APIS

## 5.1 List Witnesses for Case

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/cases/{case_id}/witnesses` | Yes | All |

### Response 200

```json
{
  "data": [
    {
      "witness_id": "wit_001",
      "name": "Suresh Patel",
      "contact": "9876543212",
      "statement_summary": "Saw the accused fleeing the scene...",
      "credibility_score": 0.85,
      "status": "verified"
    }
  ],
  "message": "ok"
}
```

## 5.2 Add Witness

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/cases/{case_id}/witnesses` | Yes | Inspector, Admin, Super Admin |

## 5.3 Update Witness

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/witnesses/{witness_id}` | Yes | Inspector, Admin, Super Admin |

## 5.4 Delete Witness

| Method | URL | Auth | Roles |
|---|---|---|---|
| DELETE | `/api/v1/witnesses/{witness_id}` | Yes | Admin, Super Admin |

---

# 6. EVIDENCE APIS

## 6.1 List Evidence for Case

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/evidence/case/{case_id}` | Yes | All |

### Response 200

```json
{
  "data": [
    {
      "evidence_id": "evi_001",
      "case_id": "FIR-2026-000001",
      "file_name": "cctv_footage.mp4",
      "file_type": "mp4",
      "file_size": 5242880,
      "file_url": "https://filestore.catalyst/...",
      "description": "CCTV footage from Majestic bus stand",
      "sensitive": false,
      "uploaded_by": {
        "user_id": "usr_abc123",
        "display_name": "SI Arun Kumar"
      },
      "uploaded_at": "2026-07-16T10:00:00Z"
    }
  ],
  "message": "ok"
}
```

## 6.2 Get Evidence Detail

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/evidence/{evidence_id}` | Yes | All |

## 6.3 Upload Evidence

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/evidence` | Yes | Officer, Inspector, Admin, Super Admin |

### Request (multipart/form-data)

| Field | Type | Required | Description |
|---|---|---|---|
| file | File | Yes | File to upload (max 25MB) |
| case_id | string | Yes | Case to link evidence to |
| description | string | No | Evidence description |
| sensitive | boolean | No | Flag for restricted access |

### Response 201

```json
{
  "data": {
    "evidence_id": "evi_002",
    "file_name": "crime_scene_photo.jpg",
    "file_type": "jpeg",
    "file_size": 2097152,
    "file_url": "https://filestore.catalyst/...",
    "uploaded_at": "2026-07-26T12:00:00Z"
  },
  "message": "Evidence uploaded successfully"
}
```

### Response 413

```json
{
  "detail": "File size exceeds maximum allowed size of 25 MB",
  "code": "FILE_TOO_LARGE"
}
```

## 6.4 Delete Evidence

| Method | URL | Auth | Roles |
|---|---|---|---|
| DELETE | `/api/v1/evidence/{evidence_id}` | Yes | Inspector, Admin, Super Admin |

---

# 7. CRIMA AI APIS

## 7.1 Send Query

| Method | URL | Auth | Roles |
|---|---|---|---|
| POST | `/api/v1/crima/query` | Yes | All |

### Request

```json
{
  "text": "Find theft cases near Majestic in the last 3 months",
  "context": [
    {"role": "user", "text": "Show me recent cases"},
    {"role": "assistant", "text": "Here are the recent cases...", "cases": ["FIR-2026-000001"]}
  ]
}
```

### Request Validation

| Field | Rule |
|---|---|
| text | Required, max 500 characters |
| context | Optional, max 10 previous exchanges |

### Response 200

```json
{
  "data": {
    "response": "I found 12 cases matching your query. Here are the top 5:\n\n1. **FIR-2026-000789** — Theft at Majestic Bus Stand\n   📅 15-Jun-2026 | 🎯 Confidence: **94%**\n\n2. **FIR-2026-000567** — Chain Snatching at Majestic Road\n   📅 02-May-2026 | 🎯 Confidence: **87%**",
    "results": [
      {
        "case_id": "FIR-2026-000789",
        "crime_type": "theft",
        "location": "Majestic Bus Stand, Bangalore",
        "date_filed": "2026-06-15",
        "status": "under_investigation",
        "confidence": 0.94,
        "summary": "Mobile phone theft reported at Majestic bus stand..."
      }
    ],
    "intent": "case_search",
    "confidence_avg": 0.87,
    "total_found": 12,
    "sources": ["FIR-2026-000789", "FIR-2026-000567", "FIR-2026-000345"],
    "entities": {
      "crime_type": "theft",
      "location": "Majestic",
      "date_range": {"from": "2026-04-26", "to": "2026-07-26"}
    }
  },
  "message": "ok"
}
```

### Response 200 — No Results

```json
{
  "data": {
    "response": "I could not find any cases matching your query. Please try rephrasing or expanding your search criteria.",
    "results": [],
    "intent": "case_search",
    "confidence_avg": 0,
    "total_found": 0,
    "sources": [],
    "entities": {}
  },
  "message": "ok"
}
```

### Response 200 — Low Confidence

```json
{
  "data": {
    "response": "I found some potential matches, but with low confidence:\n\n1. **FIR-2026-000123** — Theft ⚠️ Confidence: 45%\n\nWould you like me to refine the search? Try adding more details like date, location, or suspect name.",
    "results": [...],
    "intent": "case_search",
    "confidence_avg": 0.45,
    "total_found": 3,
    "sources": ["FIR-2026-000123"]
  },
  "message": "ok"
}
```

## 7.2 Get Chat History

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/crima/history` | Yes | All |

### Response 200

```json
{
  "data": [
    {
      "role": "user",
      "text": "Find theft cases near Majestic",
      "timestamp": "2026-07-26T10:30:00Z"
    },
    {
      "role": "assistant",
      "text": "I found 12 cases...",
      "results_count": 5,
      "timestamp": "2026-07-26T10:30:02Z"
    }
  ],
  "message": "ok"
}
```

## 7.3 Clear Chat History

| Method | URL | Auth | Roles |
|---|---|---|---|
| DELETE | `/api/v1/crima/history` | Yes | All |

### Response 200

```json
{
  "message": "Chat history cleared"
}
```

---

# 8. ANALYTICS APIS

## 8.1 Overview (KPI Cards)

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/analytics/overview` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| from | date | No | Start date (default: 12 months ago) |
| to | date | No | End date (default: today) |

### Response 200

```json
{
  "data": {
    "total_cases": 1234,
    "open_cases": 342,
    "closed_cases": 789,
    "filed_cases": 103,
    "clearance_rate": 72.3,
    "avg_resolution_days": 45,
    "period": {
      "from": "2025-07-26",
      "to": "2026-07-26"
    }
  },
  "message": "ok"
}
```

## 8.2 Crime Distribution

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/analytics/distribution` | Yes | All |

### Response 200

```json
{
  "data": [
    {"crime_type": "theft", "count": 456, "percentage": 36.9},
    {"crime_type": "assault", "count": 234, "percentage": 19.0},
    {"crime_type": "cybercrime", "count": 189, "percentage": 15.3},
    {"crime_type": "robbery", "count": 145, "percentage": 11.8},
    {"crime_type": "murder", "count": 67, "percentage": 5.4},
    {"crime_type": "fraud", "count": 89, "percentage": 7.2},
    {"crime_type": "other", "count": 54, "percentage": 4.4}
  ],
  "message": "ok"
}
```

## 8.3 Monthly Trends

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/analytics/trends` | Yes | All |

### Response 200

```json
{
  "data": [
    {"month": "2026-01", "total": 98, "open": 45, "closed": 53},
    {"month": "2026-02", "total": 112, "open": 52, "closed": 60},
    {"month": "2026-03", "total": 105, "open": 48, "closed": 57}
  ],
  "message": "ok"
}
```

## 8.4 By District

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/analytics/by-district` | Yes | All |

### Response 200

```json
{
  "data": [
    {"district": "Bangalore Urban", "count": 345},
    {"district": "Bangalore Rural", "count": 234},
    {"district": "Mysore", "count": 189},
    {"district": "Hubli", "count": 145}
  ],
  "message": "ok"
}
```

## 8.5 By Officer (Admin+)

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/analytics/by-officer` | Yes | Admin, Super Admin |

---

# 9. HEAT MAP APIS

## 9.1 Get Heat Map Data

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/heatmap/data` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| from | date | No | Start date |
| to | date | No | End date |
| crime_type | string | No | Filter by crime type |
| district | string | No | Filter by district |

### Response 200

```json
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [77.5713, 12.9767]
        },
        "properties": {
          "case_id": "FIR-2026-000001",
          "crime_type": "theft",
          "date_filed": "2026-07-15",
          "intensity": 0.85
        }
      }
    ]
  },
  "message": "ok"
}
```

---

# 10. REPORT APIS

## 10.1 Case Report

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/reports/case/{case_id}` | Yes | All |

### Response 200

```json
{
  "data": {
    "report_type": "case_detail",
    "generated_at": "2026-07-26T12:00:00Z",
    "case": {
      "case_id": "FIR-2026-000001",
      "fir_number": "KSP-BLR-2026-0789",
      "crime_type": "theft",
      "status": "under_investigation",
      "date_filed": "2026-07-15",
      "location": "Majestic, Bangalore",
      "description": "...",
      "officer": "SI Arun Kumar"
    },
    "suspects": [...],
    "witnesses": [...],
    "evidence_summary": "3 files (1 video, 2 images)",
    "timeline": [...]
  },
  "message": "ok"
}
```

## 10.2 Summary Report

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/reports/summary` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| from | date | Yes | Start date |
| to | date | Yes | End date |
| district | string | No | Filter by district |

---

# 11. NOTIFICATION APIS

## 11.1 List Notifications

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/notifications` | Yes | All |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| unread_only | boolean | No | Show only unread (default: false) |

### Response 200

```json
{
  "data": [
    {
      "notification_id": "notif_001",
      "type": "case_assigned",
      "message": "Case FIR-2026-000789 has been assigned to you",
      "link": "/cases/FIR-2026-000789",
      "read": false,
      "created_at": "2026-07-26T09:00:00Z"
    }
  ],
  "unread_count": 3,
  "message": "ok"
}
```

## 11.2 Mark Notification as Read

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/notifications/{notification_id}/read` | Yes | All |

### Response 200

```json
{
  "message": "Notification marked as read"
}
```

## 11.3 Mark All Notifications as Read

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/notifications/read-all` | Yes | All |

---

# 12. SETTINGS APIS

## 12.1 Get Profile

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/settings/profile` | Yes | All |

### Response 200

```json
{
  "data": {
    "user_id": "usr_abc123",
    "display_name": "SI Arun Kumar",
    "email": "arun.kumar@ksp.gov.in",
    "phone": "9876543210",
    "badge_number": "KSP-2024-0789",
    "photo_url": null
  },
  "message": "ok"
}
```

## 12.2 Update Profile

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/settings/profile` | Yes | All |

### Request

```json
{
  "display_name": "SI Arun Kumar",
  "phone": "9876543210",
  "badge_number": "KSP-2024-0789"
}
```

## 12.3 Get Preferences

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/settings/preferences` | Yes | All |

### Response 200

```json
{
  "data": {
    "notifications": {
      "case_assigned": true,
      "status_change": true,
      "evidence_uploaded": false
    },
    "theme": "light"
  },
  "message": "ok"
}
```

## 12.4 Update Preferences

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/settings/preferences` | Yes | All |

---

# 13. ADMINISTRATION APIS

## 13.1 Get Audit Logs

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/admin/audit-logs` | Yes | Admin, Super Admin |

### Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| page | int | No | Page number |
| limit | int | No | Items per page |
| user_id | string | No | Filter by user |
| action | string | No | Filter by action type |
| module | string | No | Filter by module |
| from | datetime | No | Start date |
| to | datetime | No | End date |

### Response 200

```json
{
  "data": [
    {
      "log_id": "log_001",
      "user": {
        "user_id": "usr_abc123",
        "display_name": "SI Arun Kumar"
      },
      "action": "case_view",
      "module": "cases",
      "details": {"case_id": "FIR-2026-000001"},
      "ip_address": "192.168.1.100",
      "timestamp": "2026-07-26T10:30:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "pages": 63
}
```

## 13.2 Get System Settings

| Method | URL | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/admin/settings` | Yes | Admin, Super Admin |

### Response 200

```json
{
  "data": {
    "session_timeout_minutes": 60,
    "password_min_length": 8,
    "max_upload_size_mb": 25,
    "rate_limit_per_minute": 100,
    "maintenance_mode": false
  },
  "message": "ok"
}
```

## 13.3 Update System Settings

| Method | URL | Auth | Roles |
|---|---|---|---|
| PUT | `/api/v1/admin/settings` | Yes | Admin, Super Admin |

---

# 14. COMMON RESPONSE FORMATS

## Success Response

```json
{
  "data": { ... },
  "message": "Human-readable message"
}
```

## Paginated Response

```json
{
  "data": [ ... ],
  "total": 156,
  "page": 1,
  "pages": 8,
  "message": "ok"
}
```

## Error Response

```json
{
  "detail": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

## Validation Error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    },
    {
      "loc": ["body", "password"],
      "msg": "String should have at least 8 characters",
      "type": "string_too_short"
    }
  ]
}
```

---

# 15. ERROR CODES

| HTTP Code | Error Code | Description |
|---|---|---|
| 400 | INVALID_INPUT | Malformed request body |
| 400 | INVALID_CREDENTIALS | Wrong email or password |
| 400 | INVALID_CURRENT_PASSWORD | Wrong current password |
| 400 | WEAK_PASSWORD | Password doesn't meet policy |
| 400 | INVALID_DATE_RANGE | From date after to date |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 401 | TOKEN_EXPIRED | JWT has expired |
| 403 | FORBIDDEN | Insufficient role/permissions |
| 404 | NOT_FOUND | Resource not found |
| 404 | CASE_NOT_FOUND | Case ID doesn't exist |
| 404 | USER_NOT_FOUND | User ID doesn't exist |
| 409 | EMAIL_EXISTS | Email already registered |
| 409 | FIR_EXISTS | FIR number already exists |
| 413 | FILE_TOO_LARGE | Upload exceeds size limit |
| 415 | UNSUPPORTED_FILE_TYPE | File type not allowed |
| 422 | VALIDATION_ERROR | Pydantic validation failed |
| 423 | ACCOUNT_LOCKED | Account temporarily locked |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 502 | CATALYST_ERROR | Catalyst service failure |

---

# END OF API SPECIFICATION
