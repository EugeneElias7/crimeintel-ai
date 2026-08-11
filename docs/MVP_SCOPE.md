# MVP_SCOPE.md

> **CrimeIntel AI** — scope separation
> Status: Phase 0 — definition only

---

## P0 — Must Have (hackathon demo gate)

| # | Feature | Detail |
|---|---|---|
| P0-1 | Authentication | Local JWT login, refresh, logout; role-based access (admin, investigator, analyst, viewer); admin-gated user creation |
| P0-2 | Dashboard | KPIs, cases by district/category charts, recent cases, recent activity |
| P0-3 | CRIMA AI | Chat with conversation history; intents: case search, case details, summarization, similar cases, evidence retrieval, analytics queries; source references on every answer; confidence; suggested follow-ups; hallucination guard |
| P0-4 | Case Explorer | Filtered/paginated case list; search |
| P0-5 | Case Details | Overview, persons, timeline, evidence, similar cases tabs |
| P0-6 | Evidence Management | Upload/download/delete on local filesystem; metadata in DB |
| P0-7 | Basic Analytics | Cases by district/category/status, monthly trend, average resolution time (charts + API) |
| P0-8 | Basic Reports | Generate case summary / analytics snapshot reports; list + download |
| P0-9 | Administration | User CRUD + roles + activate/deactivate; audit log viewer; settings |
| P0-10 | Foundation | Repo structure, docs (done in Phase 0), synthetic dataset (≥ 300 cases), seed + FAISS build scripts, `.env.example`, dev setup scripts |

**Exit criteria:** 5 canonical CRIMA AI questions answered with sources; all P0 features demoable offline on a laptop.

## P1 — Should Have (if time permits)

- Notifications (in-app; assignment + report-ready)
- CRIMA AI: context panel polish, feedback capture + simple analytics of feedback
- Analytics: export charts as images; comparison queries
- Reports: PDF export quality, district summary report
- Conversation export / copy answer
- Frontend unit tests + improved empty/error states
- Rate limiting hardening on CRIMA chat
- Token refresh flow polish (silent refresh)
- Mobile-friendly pass (desktop-first MVP)

## Future (explicitly out of MVP — needs approval to implement)

- OCR on evidence images
- Voice assistant (speech-to-text + TTS)
- Criminal network analysis
- Predictive policing
- Facial recognition
- Mobile application
- Live KSP database integration
- Confidential/real police data
- Advanced forensics
- Complex multi-agent AI
- Catalyst deployment & QuickML evaluation (roadmap Phase 10 — planned, not MVP)
- Docker packaging

## Decision Rules

1. A feature not listed in P0/P1 is **out of scope** by default.
2. Adding scope requires team agreement + this document updated.
3. Nothing labeled "Future" may slip into P0 silently — the PRD/AI spec must be updated first.
