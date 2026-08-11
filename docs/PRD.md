# PRD — Product Requirements Document

> **CrimeIntel AI** — Team Pixel Pirates
> Status: Phase 0 — Foundation (documentation only)

---

## 1. Executive Summary

CrimeIntel AI is an AI-powered conversational crime intelligence platform for authorized police personnel, built for the **Intelligent Conversational AI for KSP Crime Database** hackathon. Its flagship feature, **CRIMA AI**, lets investigators ask natural-language questions and receive answers grounded in crime records — with source references on every response. The MVP is **local-first**: it runs entirely on a developer machine (React + FastAPI + SQLite + FAISS) and is architected so each local component can later be swapped for a Zoho Catalyst service with minimal code change.

## 2. Problem Statement

Investigators spend significant time digging through case records: finding relevant cases, reading long case files, comparing similar cases, and pulling evidence or statistics. Existing tools are form-heavy and not conversational. There is no safe, easy way to ask the crime database a question in natural language and get a grounded, sourced answer.

## 3. Background

- Hackathon context: KSP crime database + Zoho Catalyst platform.
- The team has no access to live police data — a synthetic/demo dataset is required.
- The team must prove product value and cloud-readiness, but the demo itself must run fully offline.

## 4. Vision

A conversational crime intelligence assistant that turns a crime database into a queryable knowledge base, allowing investigators to ask anything about cases and receive **accurate, evidence-grounded answers with source references**, dramatically reducing time-to-insight.

## 5. Goals (MVP)

| Goal | Metric target (demo) |
|---|---|
| Answer the 5 canonical question types correctly | 100% of canonical demo questions |
| Ground every answer in source records | 100% of answers show sources |
| Never invent case data | 0 hallucinated case numbers/facts |
| Fully local runnable | Single script to start on any dev laptop |
| Clean migration path to Catalyst | Adapter interfaces exercised by local impls |

## 6. Target Users

| Persona | Role | Needs |
|---|---|---|
| Investigator | PSI/CPI handling cases | Search, summarize, similar cases, evidence retrieval |
| Analyst | Crime analytics | Trend/geo/category queries, reports |
| Supervisor | Station/unit lead | Dashboard KPIs, reports, oversight |
| Administrator | System admin | Users, roles, audit logs, settings |

## 7. Personas

- **Inspector Kavya Rao (35, CPI, Bengaluru Urban):** investigates vehicle theft rings. Wants "Find vehicle theft cases in Bengaluru" and "What evidence is associated with CASE-1024?" without manual filters.
- **Analyst Arjun Nair (28):** answers district-level analytics questions, e.g. "Which district has the highest number of theft cases?"
- **Admin Shalini (40):** manages user accounts and reviews audit logs.
- **Hackathon judge:** wants to see the product run locally, end-to-end, with realistic demo data.

## 8. User Stories

1. As an investigator, I want to ask "Find vehicle theft cases in Bengaluru" so I can quickly list relevant cases.
2. As an investigator, I want to ask "Summarize CASE-1024" so I can grasp a case without reading the full file.
3. As an investigator, I want to ask "Find cases similar to CASE-1024" so I can spot related patterns.
4. As an investigator, I want to ask "What evidence is associated with CASE-1024?" so I can locate exhibits.
5. As an analyst, I want to ask "Which district has the highest number of theft cases?" so I can answer analytics questions instantly.
6. As an investigator, I want every CRIMA AI answer to show source records so I can verify claims.
7. As an investigator, I want to browse cases by filters (district, category, status) so I can explore manually.
8. As an investigator, I want to view a case's details, timeline, and persons so I can work a case.
9. As an investigator, I want to upload and download evidence for a case so records stay together.
10. As a supervisor, I want a dashboard with KPIs and charts so I can monitor workload.
11. As an analyst, I want to generate basic reports so I can share summaries.
12. As an admin, I want to manage users and roles so access is controlled.
13. As an admin, I want audit logs so actions are traceable.
14. As a user, I want the app to run entirely on my laptop so I can demo without cloud access.

## 9. Functional Requirements

### FR-1 Authentication (P0)
- Login with username/email + password (local JWT). Registration admin-gated.
- Role-based access control (admin, investigator, analyst, viewer).
- Token refresh; logout invalidates session.
- All APIs (except login) require a valid JWT.

### FR-2 Dashboard (P0)
- KPIs: total cases, open cases, critical cases, cases resolved this month.
- Charts: cases by district, cases by category, recent case activity.
- Recent cases list; quick links to CRIMA AI.

### FR-3 CRIMA AI (P0 — primary feature)
- Natural-language chat with conversation history.
- Supported intents: case search, case details/status, case summarization, similar cases, evidence retrieval, analytics queries.
- Every answer includes **source references** (case numbers) and confidence where applicable.
- Refuses gracefully when no records match; never fabricates data.
- Suggested follow-up questions.

### FR-4 Case Explorer & Details (P0)
- List with filters (district, category, status, priority, date range, search) and pagination.
- Case detail: summary, persons (suspects/victims/witnesses), timeline events, evidence list, similar cases.

### FR-5 Evidence Management (P0)
- Upload (documents/images), download, delete. Stored on local filesystem, referenced by metadata.

### FR-6 Analytics (P0)
- Cases by district, category, status, monthly trend; average resolution time.

### FR-7 Reports (P0)
- Generate basic reports (case summary, analytics snapshot) as downloadable files; list of past reports.

### FR-8 Administration (P0)
- User CRUD, role assignment, activate/deactivate.
- Audit log viewer (filterable by user/action/date).
- Settings (system config, dataset info).

### FR-9 Notifications (P1)
- In-app notifications (case assignment, report ready).

## 10. Non-functional Requirements

| Area | Requirement |
|---|---|
| Performance | CRIMA AI answer ≤ 3 s local; API p95 ≤ 300 ms for CRUD |
| Portability | Runs on Windows/macOS/Linux dev machines; one-command setup |
| Security | Passwords hashed (bcrypt/argon2); JWT; role checks server-side; audit logging |
| Privacy | Synthetic data only; no PII from real people |
| Maintainability | Layered architecture with adapter interfaces; typed frontend |
| Testability | Backend unit/integration tests; AI evaluation harness |
| Honesty | No claimed-but-unbuilt features; Catalyst "designed, not deployed" |

## 11. MVP Scope

- **P0 (must work):** Authentication, Dashboard, CRIMA AI, Case Explorer, Case Details, Evidence, Basic Analytics, Basic Reports, Administration.
- **P1 (should have):** Notifications, conversation history UI polish, export, refined AI evaluation metrics.
- **Future:** OCR, voice assistant, criminal network, predictive policing, facial recognition, mobile app, live KSP integration, advanced forensics, multi-agent AI.

Full breakdown: `MVP_SCOPE.md`.

## 12. Future Scope

- Catalyst deployment (AppSail, Data Store, Stratus, Catalyst Auth, QuickML evaluation).
- OCR on evidence images; voice input for CRIMA AI.
- Real KSP integration under proper agreements — never with demo data claims.
- Advanced analytics, network analysis, predictive modules (out of scope by default).

## 13. Success Metrics

- 5 canonical CRIMA AI questions answered correctly with sources (demo).
- 0 hallucinated case references across the golden question set.
- 100% P0 features working in local demo.
- ≤ 10 min setup from repo clone to running app.

## 14. Risks

| Risk | Mitigation |
|---|---|
| AI answers hallucinate | Template-grounded generation; refuse-on-empty; source chips; evaluation harness |
| Embedding model too heavy for laptops | Use all-MiniLM-L6-v2 (~90 MB); lazy load; cache index |
| Scope creep beyond MVP | This PRD is source of truth; feature requests need approval |
| Team overlap on files | Ownership map + feature branches per developer |
| Local→Catalyst lock-in | All infra behind repository/provider interfaces from day one |
| Demo data too small to be convincing | ≥ 300 synthetic cases, realistic distributions |

## 15. Assumptions

- Python 3.11+ and Node 20+ available on dev machines.
- No internet access needed at runtime (models cached locally on first run).
- Synthetic data is acceptable for demo/judging.
- Zoho Catalyst credentials may not exist during development — nothing requires them locally.
