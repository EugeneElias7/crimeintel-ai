# PROJECT_CONTEXT.md

> **CrimeIntel AI — Project Source of Truth (Foundation)**
> Last updated: Phase 0 — Foundation

---

## 1. Project Identity

| Field | Value |
|---|---|
| Product name | CrimeIntel AI |
| Primary feature | **CRIMA AI** — intelligent conversational AI for the KSP (Karnataka State Police) crime database |
| Team | **Pixel Pirates** (3 developers) |
| Hackathon | KSP / Zoho Catalyst hackathon |
| GitHub | https://github.com/EugeneElias7/crimeintel-ai |
| Repository root | `CrimeIntelAI/` (local root: `C:\D drive\Crima AI`) |
| Status | **Phase 0 — Foundation**. Documentation complete. No application features implemented yet. |

## 2. Vision

CrimeIntel AI is an AI-powered conversational crime intelligence platform for **authorized police personnel**.

CRIMA AI lets an investigator ask natural-language questions about crime records and receive **evidence-grounded answers** — case searches, summaries, similar cases, evidence retrieval, and basic crime analytics — with the source records referenced in every answer.

## 3. Core Product Principle

> **CRIMA AI IS THE PRIMARY PRODUCT FEATURE. Everything else supports CRIMA AI.**

The platform is **not** a generic police management system. Supporting modules (Authentication, Dashboard, Case Explorer, Evidence, Analytics, Reports, Administration, Notifications, Settings) exist so that an investigator can reach, trust, and verify the records CRIMA AI answers from.

## 4. Goals

1. Deliver a working **local-first MVP** that answers the 5 canonical CRIMA AI question types reliably.
2. Demonstrate the full investigation workflow: authenticate → explore cases → ask CRIMA AI → verify answers against source records.
3. Prove the architecture: every infrastructure concern sits behind an interface so that **SQLite → Zoho Catalyst Data Store**, **local FS → Stratus**, **local JWT → Catalyst Auth**, **FastAPI → AppSail**, **React → Slate/Web Hosting**, **local AI → QuickML** are later swaps, not rewrites.
4. Ship a hackathon-ready demo using **synthetic data only** — no confidential or live police records, ever.

## 5. Target Users

- **Primary:** KSP investigators/PSI/CPI who investigate and manage crime cases.
- **Secondary:** analysts (crime analytics), supervisors (dashboard, reports), system administrators.
- **Demo audience:** hackathon judges — the platform must work fully offline on a local machine.

## 6. Scope

### In scope (MVP, P0)
- Authentication (local JWT)
- Dashboard
- CRIMA AI (case search, case details, summarization, similar cases, evidence retrieval, basic analytics queries)
- Case Explorer + Case Details
- Evidence Management
- Basic Crime Analytics
- Basic Reports
- Administration (users, roles, audit logs)

### Explicitly out of scope (do not implement without approval)
- Criminal network analysis
- Predictive policing
- Facial recognition
- Mobile application
- Live KSP database integration
- Confidential police data
- Advanced forensics
- Complex multi-agent AI
- OCR (future enhancement only)
- Voice assistant (future enhancement only)

## 7. Constraints & Principles

| Constraint | Rule |
|---|---|
| Data | **Synthetic/demo data only.** Never claim live or confidential KSP records. |
| Local-first | Everything must run on a developer laptop with no cloud account. |
| Deployment | **Do NOT deploy to Zoho Catalyst yet.** Design for it, don't run it. |
| Abstraction | Business logic must not depend on SQLite, local filesystem, local JWT, FAISS, or Catalyst SDKs directly. Use **repository/provider/adapter interfaces**. |
| Truth | This document set is the **source of truth**. No new technologies, features, architecture, or scope without approval. |
| Git | `main` stays stable after foundation. Feature branches + PRs. Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). |
| Honesty | Do not claim implemented functionality that is not implemented. Catalyst integration is "designed", never "complete", until tested. |

## 8. Technology Principles

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python
- **Database:** SQLite (local) → Catalyst Data Store (cloud)
- **Storage:** Local filesystem → Catalyst Stratus (cloud)
- **Auth:** Local JWT → Catalyst Authentication (cloud)
- **AI:** Sentence Transformers + FAISS (approved local components) → QuickML (cloud, to be evaluated)
- Every layer behind an interface; local and Catalyst implementations are siblings.

## 9. Team Ownership

| Developer | Owns | Repo areas |
|---|---|---|
| **Developer 1 — Eugene** | CRIMA AI | `ai/`, CRIMA AI routers (`/api/v1/crima/*`), CRIMA AI UI, FAISS/embeddings/intent/context/response pipeline |
| **Developer 2** | Dashboard + Case Explorer | Dashboard KPIs/charts, Case Explorer, Case Details, timeline, Analytics UI |
| **Developer 3** | Authentication + Administration + Evidence + Reports | Login/register, JWT, roles, admin users, audit logs, evidence, reports |

**Working branches:** `feature/crima-ai`, `feature/dashboard-cases`, `feature/auth-admin`.

## 10. Required Reading for Any Coding Agent

Before modifying code, read in order:

1. `/docs/PROJECT_CONTEXT.md` (this file)
2. `/docs/PRD.md`
3. `/docs/TRD.md`
4. `/docs/ARCHITECTURE.md`
5. `/docs/MVP_SCOPE.md`
6. `/docs/ROADMAP.md`
7. `/docs/API_CONTRACT.md`

Do not introduce new technologies, features, architecture, or scope without explicit approval.
