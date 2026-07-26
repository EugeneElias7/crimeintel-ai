# PRODUCT REQUIREMENTS DOCUMENT

## CrimeIntel AI — Intelligent Conversational AI for KSP Crime Database

| Field | Value |
|---|---|
| **Project Name** | CrimeIntel AI |
| **Version** | 1.0 (MVP) |
| **Team** | Pixel Pirates |
| **Hackathon Theme** | Intelligent Conversational AI for KSP Crime Database |
| **Document Status** | Draft |

---

# DOCUMENT CONTROL

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-07-26 | Pixel Pirates | Initial Draft |

## Authors

| Name | Role |
|---|---|
| Pixel Pirates Team | Product Management, Architecture, Development |

## Reviewers

| Name | Role |
|---|---|
| Hackathon Mentor | Technical Review |
| UI/UX Lead | Design Review |

## Approvals

| Name | Role | Date |
|---|---|---|
| TBD | Product Owner | TBD |

---

# 1. EXECUTIVE SUMMARY

CrimeIntel AI is an AI-powered Crime Intelligence Platform developed as a hackathon prototype for the Karnataka State Police (KSP). The platform introduces **CRIMA AI**, a conversational AI assistant that enables police officers to search, retrieve, summarize, and analyze criminal records through natural language queries.

The prototype addresses the core problem that police officers spend significant time manually searching through case files, FIRs, evidence logs, and witness statements — often across disconnected systems. CrimeIntel AI demonstrates how semantic search, AI-powered summarization, and conversational interfaces can reduce case retrieval time, uncover hidden connections between cases, and provide actionable intelligence through analytics and heat maps.

Built on **Zoho Catalyst** with a **React + TypeScript** frontend and **FastAPI** backend, the system uses **Sentence Transformers** for semantic embeddings and **FAISS** for vector similarity search. The MVP includes six core modules: Authentication, CRIMA AI Chat, Case Explorer, Evidence Management, Analytics & Heat Maps, and Administration.

The prototype is designed to be demonstrated at a national-level hackathon, showcasing how modern AI can augment — not replace — existing police workflows.

---

# 2. PROJECT BACKGROUND

Karnataka State Police manages a vast repository of criminal records spanning FIRs, charge sheets, evidence documentation, witness statements, suspect profiles, and historical crime data. Currently, officers access this data through:

- Physical file records maintained at individual police stations
- Basic digital databases with keyword-only search capabilities
- Siloed departmental systems with no cross-referencing

When an officer needs to investigate a case, they must manually sift through physical files, run basic keyword searches, and make phone calls to other stations to check for related cases. This fragmented workflow leads to:

- **Slow investigations** — 30–40% of time spent on information retrieval
- **Missed connections** — Related cases across jurisdictions go unnoticed
- **Inconsistent data** — No standardized format for digital records
- **High cognitive load** — Officers must mentally correlate disparate pieces of information

The CrimeIntel AI prototype was conceived during the KSP Hackathon to demonstrate how conversational AI can reimagine this workflow.

---

# 3. PROBLEM STATEMENT

> Police officers lack a unified, intelligent interface to search, connect, and analyze criminal records across disparate systems. Existing tools require manual effort, keyword-specific queries, and multiple system logins — slowing investigations and causing critical case connections to be missed.

### Core Problems

| # | Problem | Impact |
|---|---|---|
| P1 | No natural language search | Officers must know exact keywords, database fields, or query syntax |
| P2 | Disconnected data silos | FIRs, evidence, witnesses, and suspects live in separate systems |
| P3 | Manual cross-referencing | No automated linking between related cases, suspects, or modus operandi |
| P4 | No intelligent summarization | Officers must read full case files to understand key facts |
| P5 | No crime pattern visibility | Trends, hotspots, and repeat offenders invisible without manual analysis |

---

# 4. EXISTING SYSTEM

The current system used by KSP for crime record management consists of:

| Component | Description |
|---|---|
| **Physical Records** | Paper-based FIRs, charge sheets, and case diaries stored at stations |
| **Basic Digital Database** | Keyword-searchable digital repository for FIR records |
| **Siloed Department Systems** | Separate databases for forensics, evidence, and law & order |
| **Manual Coordination** | Phone calls, emails, and physical visits to check related cases |
| **Static Reports** | Monthly/quarterly crime reports compiled manually |

---

# 5. EXISTING SYSTEM LIMITATIONS

| Limitation | Detail |
|---|---|
| **Keyword-only search** | Cannot understand synonyms, phonetic variations (e.g., "Ravi" vs "Ravindra"), or context |
| **No cross-case linking** | An officer cannot easily find all cases involving a known suspect across jurisdictions |
| **No summarization** | Every query returns full case files — no executive summaries |
| **No geospatial analysis** | Crime locations recorded but not visualized on maps |
| **No trend detection** | Crime patterns emerge only after manual data compilation |
| **No conversational interface** | System requires training on query syntax and database schemas |
| **Slow retrieval** | Cross-jurisdiction queries require manual coordination |

---

# 6. PROPOSED SOLUTION

CrimeIntel AI addresses these limitations through:

| Solution Component | Description |
|---|---|
| **CRIMA AI Assistant** | Conversational AI that understands natural language queries about cases, suspects, evidence, and crime patterns |
| **Semantic Search Engine** | Sentence Transformers + FAISS for intent-aware retrieval that goes beyond keyword matching |
| **Unified Case Explorer** | Single view across FIRs, evidence, suspects, and case timeline |
| **Analytics Dashboard** | Visual crime statistics, clearance rates, trend charts |
| **Heat Maps** | Geospatial visualization of crime incidents across Karnataka |
| **Role-Based Access** | Secure authentication with Officer, Inspector, Admin, and Super Admin roles |

---

# 7. VISION

> An intelligent investigation assistant that empowers every Karnataka police officer to search, analyze, and connect criminal intelligence through natural conversation — making investigations faster, smarter, and more effective.

---

# 8. MISSION

To build a secure, scalable, AI-powered crime intelligence platform, starting as a hackathon prototype, that demonstrates how conversational AI can transform law enforcement workflows — with a clear path to production deployment on Zoho Catalyst.

---

# 9. GOALS

| # | Goal | Target |
|---|---|---|
| G1 | Reduce case information retrieval time | < 10 seconds for 90% of queries |
| G2 | Enable natural language querying | > 90% query understanding accuracy |
| G3 | Demonstrate cross-case connections | Auto-suggest related cases for any given query |
| G4 | Provide crime location heat maps | Visual heat map generation within MVP |
| G5 | Deliver a working prototype | Fully functional demo within hackathon timeline |

---

# 10. OBJECTIVES

| # | Objective | Measurement |
|---|---|---|
| OBJ-1 | Implement semantic search over criminal records | Precision@10 ≥ 85% on test queries |
| OBJ-2 | Build conversational AI with context awareness | Users can ask 3+ follow-up questions without rephrasing |
| OBJ-3 | Create unified case view with evidence linking | All evidence for a case visible within 2 clicks |
| OBJ-4 | Develop analytics dashboard with 4+ visual widgets | Bar charts, trend lines, pie charts, KPI cards |
| OBJ-5 | Implement geospatial crime heat map | Incidents plotted with severity-based heat overlay |
| OBJ-6 | Achieve secure authentication with role-based access | 4 roles with distinct permissions |
| OBJ-7 | Deploy fully on Zoho Catalyst | Zero external cloud dependencies |

---

# 11. SUCCESS CRITERIA

| Criterion | Definition | Target |
|---|---|---|
| **Functional Completeness** | All MVP features implemented and working | 100% of Must Have items |
| **Query Response Time** | End-to-end latency for a CRIMA AI query | < 3 seconds |
| **Search Accuracy** | Relevant results in top 10 for semantic queries | > 85% Precision@10 |
| **Stability** | Zero crashes during demo session | 30 min demo without errors |
| **Usability** | First-time user can complete core tasks without training | Task completion rate > 80% |
| **Deployment** | System accessible via Catalyst-hosted URL | Public demo URL available |

---

# 12. SCOPE

## 12.1 In Scope (MVP)

| Module | Description |
|---|---|
| **Authentication** | Login, logout, password reset, role-based access (Officer, Inspector, Admin, Super Admin) |
| **CRIMA AI Chat** | Conversational interface for natural language queries about cases, suspects, evidence, and crime data |
| **Case Explorer** | Browse, search, filter, and view case details including FIR, suspects, witnesses, timeline |
| **Evidence Management** | Upload evidence files, view evidence gallery, link evidence to cases |
| **Analytics Dashboard** | Case statistics, clearance rates, crime type distribution, monthly trends |
| **Heat Maps** | Geospatial visualization of crime incidents with severity heat overlay |
| **User Management** | Admin panel for managing users, roles, and permissions |
| **Settings** | Profile management, notification preferences, system configuration |
| **REST API** | Backend API for all CRUD operations, search, and AI queries |
| **AI Pipeline** | Semantic embedding generation, FAISS indexing, similarity search |

## 12.2 Out of Scope (MVP)

| Item | Reason |
|---|---|
| OCR / Document Scanning | Requires computer vision pipeline; designated as future enhancement |
| Voice Search / Speech-to-Text | Increases scope complexity; text-only MVP |
| Mobile Native Applications | Web-responsive design sufficient for prototype |
| Predictive Crime Analytics | Requires historical ML training and validation data |
| Real-Time Notifications | Requires push notification infrastructure |
| Third-Party Integration | No integration with external KSP legacy systems |
| Multi-Language Support | English-only MVP; Kannada as future enhancement |
| Facial Recognition | Beyond prototype scope; separate domain |

## 12.3 Future Scope

| Feature | Target Phase |
|---|---|
| OCR for scanned FIRs and handwritten notes | Phase 2 |
| Voice-enabled querying for field officers | Phase 3 |
| Predictive crime analytics and hotspot forecasting | Phase 3 |
| Multi-language support (Kannada, Hindi) | Phase 3 |
| Mobile application (React Native) | Phase 3 |
| Real-time push notifications | Phase 4 |
| Legacy system data migration tools | Phase 4 |

---

# 13. STAKEHOLDERS

| Stakeholder | Role | Interest |
|---|---|---|
| **Karnataka State Police** | Client / End-User Organization | Improved investigation efficiency |
| **Investigating Officers** | Primary End Users | Faster case information retrieval |
| **Inspectors / Senior Officers** | Secondary End Users | Cross-case analysis, reporting |
| **System Administrators** | Platform Maintainers | User management, system health |
| **Hackathon Judges** | Evaluators | Technical merit, innovation, usability |
| **Pixel Pirates (Team)** | Developers | Build and deliver the prototype |
| **Hackathon Mentors** | Advisors | Technical guidance, scope management |
| **Zoho Catalyst Team** | Platform Provider | Infrastructure support |
| **Citizens of Karnataka (Indirect)** | Beneficiaries | Improved policing outcomes |

---

# 14. USER PERSONAS

## Persona 1: Investigation Officer

| Attribute | Detail |
|---|---|
| **Name** | SI Arun Kumar |
| **Role** | Sub-Inspector at a city police station |
| **Age** | 34 |
| **Experience** | 8 years |
| **Tech Proficiency** | Moderate — can use basic computer applications |
| **Responsibilities** | Register FIRs, investigate cases, collect evidence, file charge sheets |
| **Goals** | Find relevant case information quickly; identify suspects from past records; prepare case summaries |
| **Pain Points** | Spends hours searching physical files; cannot easily query across jurisdictions; must manually summarize cases |
| **Expected Benefits** | Ask CRIMA AI in plain language: "Show me all cases involving chain snatching in the last month" and get instant results |

## Persona 2: Crime Analyst

| Attribute | Detail |
|---|---|
| **Name** | Ms. Priya Sharma |
| **Role** | Crime Analyst at KSP HQ |
| **Age** | 29 |
| **Experience** | 5 years |
| **Tech Proficiency** | High — comfortable with data analysis tools |
| **Responsibilities** | Analyze crime trends, prepare reports, identify crime patterns |
| **Goals** | Spot emerging crime trends; identify repeat offenders; provide intelligence inputs |
| **Pain Points** | Manually compiles data from multiple stations; no tool for geospatial analysis; trend detection is reactive |
| **Expected Benefits** | Use analytics dashboard and heat maps to identify hotspots; ask CRIMA AI for trend analysis |

## Persona 3: Senior Officer

| Attribute | Detail |
|---|---|
| **Name** | DCP Raghavendra Rao |
| **Role** | Deputy Commissioner of Police |
| **Age** | 48 |
| **Experience** | 22 years |
| **Tech Proficiency** | Low — prefers summaries over detailed data |
| **Responsibilities** | Oversee investigations, allocate resources, review case progress |
| **Goals** | Get quick overviews of high-priority cases; monitor crime statistics; review team performance |
| **Pain Points** | Too many cases to review individually; reports take too long to compile; no real-time visibility |
| **Expected Benefits** | Open CRIMA AI and ask: "Summarize this week's top 5 priority cases" or view dashboard for clearance rates |

## Persona 4: Administrator

| Attribute | Detail |
|---|---|
| **Name** | Mr. Suresh Patil |
| **Role** | IT Administrator, KSP |
| **Age** | 41 |
| **Experience** | 15 years in IT, 5 years with police systems |
| **Tech Proficiency** | High |
| **Responsibilities** | Manage user accounts, monitor system usage, ensure data security, manage permissions |
| **Goals** | Control access to sensitive data; audit user activity; ensure system availability |
| **Pain Points** | Manual user provisioning; no audit trail; no visibility into system usage |
| **Expected Benefits** | Use admin panel to manage users, view audit logs, monitor system health |

---

# 15. USER JOURNEY

## Primary Journey: Officer Investigating a Case

```
1. Officer logs in via Catalyst Authentication
2. Lands on Dashboard — sees recent cases, statistics, notifications
3. Opens CRIMA AI Chat
4. Types: "Find all cases involving two-wheeler theft near Majestic in the last 3 months"
5. CRIMA AI processes the query:
   a. Detects intent (search cases with filters)
   b. Embeds query using Sentence Transformers
   c. Searches FAISS index for similar cases
   d. Returns top-matching cases with relevance scores
6. Officer clicks on a case → Case Explorer opens
7. Case view shows: FIR details, suspects, witnesses, evidence, timeline
8. Officer asks follow-up: "Which suspect appears in multiple cases?"
9. CRIMA AI performs cross-case analysis and identifies repeat suspects
10. Officer uploads new evidence via Evidence Management
11. Views analytics dashboard to see crime trends in the area
12. Opens heat map to visualize incident locations
13. Logs out securely
```

---

# 16. USER STORIES

## Module: Authentication

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-AUTH-01 | As an officer, I want to log in with my credentials so that I can access the system securely. | AC1: Login with valid email/password grants access. AC2: Invalid credentials show error message. AC3: 3 failed attempts lock account for 5 minutes. |
| US-AUTH-02 | As an officer, I want to log out so that my session is terminated. | AC1: Logout clears session. AC2: Redirected to login page. |
| US-AUTH-03 | As an admin, I want to manage user roles so that officers have appropriate access levels. | AC1: Admin can create/edit/delete users. AC2: Admin can assign Officer, Inspector, Admin, or Super Admin roles. |
| US-AUTH-04 | As a user, I want to reset my password so that I can regain access if I forget it. | AC1: Password reset via registered email. AC2: Reset link expires in 24 hours. |

## Module: Dashboard

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-DASH-01 | As an officer, I want to see a summary of key metrics so that I can understand the current state at a glance. | AC1: Dashboard shows total cases, open cases, clearance rate, and recent activity. AC2: Numbers update in real-time. |
| US-DASH-02 | As an officer, I want to see recent cases on the dashboard so that I can quickly access active investigations. | AC1: Dashboard shows last 10 updated cases. AC2: Clicking a case opens Case Explorer. |
| US-DASH-03 | As an officer, I want to see quick-action buttons so that I can start common tasks quickly. | AC1: Buttons for "New Search", "View Cases", "Open CRIMA AI" are visible. |

## Module: CRIMA AI Chat

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-CRIMA-01 | As an officer, I want to ask questions in natural language so that I don't need to learn query syntax. | AC1: Query "Show cases from last week" works. AC2: Query "Find suspects named Kumar" works. AC3: Query "Summarize case FIR-2024-123" works. |
| US-CRIMA-02 | As an officer, I want CRIMA AI to understand follow-up questions so that I can refine my search conversationally. | AC1: After first query, "What about in Bangalore?" refines location filter. AC2: "Show me more details" expands last result. |
| US-CRIMA-03 | As an officer, I want CRIMA AI to show confidence levels so that I can assess result reliability. | AC1: Each result shows a confidence percentage. AC2: Results below 60% confidence are flagged. |
| US-CRIMA-04 | As an officer, I want CRIMA AI to cite sources so that I can verify information. | AC1: Each response includes case IDs and source references. AC2: Clickable links open the referenced case. |
| US-CRIMA-05 | As an officer, I want CRIMA AI to suggest related cases so that I discover connections I might have missed. | AC1: When viewing a case, "Related Cases" section shows cross-referenced matches. |
| US-CRIMA-06 | As an officer, I want CRIMA AI to summarize case information so that I don't have to read entire files. | AC1: "Summarize case X" returns: crime type, date, location, key suspects, status, and evidence count. |
| US-CRIMA-07 | As an officer, I want to see my chat history so that I can refer back to previous queries. | AC1: Chat history is saved per session. AC2: User can scroll through conversation history. |

## Module: Case Explorer

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-CASE-01 | As an officer, I want to browse all cases so that I can explore the case database. | AC1: Paginated list shows case ID, type, date, status, location. AC2: Sort by date, status, or type. |
| US-CASE-02 | As an officer, I want to search cases so that I can find specific records. | AC1: Search by case ID, suspect name, victim name, or FIR number. AC2: Results update as user types (debounced). |
| US-CASE-03 | As an officer, I want to view case details so that I can understand the full case context. | AC1: Case view shows FIR details, suspects, witnesses, evidence, timeline. AC2: Each section is expandable/collapsible. |
| US-CASE-04 | As an officer, I want to see case timelines so that I can track investigation progress. | AC1: Timeline view shows case events in chronological order. AC2: Each event has date, description, and officer. |
| US-CASE-05 | As an officer, I want to filter cases by status so that I can focus on active investigations. | AC1: Filter by Open, Under Investigation, Closed, Filed. AC2: Multiple filters can be combined. |

## Module: Evidence Management

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-EVI-01 | As an officer, I want to upload evidence files so that they are stored digitally. | AC1: Upload supports PDF, JPEG, PNG, MP4 (max 25MB). AC2: Evidence is linked to a specific case. |
| US-EVI-02 | As an officer, I want to view evidence for a case so that I can access all materials. | AC1: Evidence gallery shows thumbnails for documents, images, and videos. AC2: Click to preview/download. |
| US-EVI-03 | As an officer, I want to search evidence so that I can find specific files. | AC1: Search by evidence name, type, or upload date. |
| US-EVI-04 | As an officer, I want to see evidence metadata so that I know when and by whom it was uploaded. | AC1: Each evidence item shows: file name, type, size, upload date, uploaded by, linked case. |

## Module: Analytics & Heat Maps

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-ANA-01 | As a senior officer, I want to see crime statistics so that I can assess overall crime trends. | AC1: Dashboard shows total cases by type (pie chart). AC2: Monthly case trend (line chart). AC3: Clearance rate (KPI card). AC4: Cases by district (bar chart). |
| US-ANA-02 | As a crime analyst, I want to see crime heat maps so that I can identify hotspots. | AC1: Map shows crime incidents as heat overlay. AC2: Color intensity indicates crime density. AC3: Zoom and pan controls. AC4: Filter by crime type and date range. |
| US-ANA-03 | As an officer, I want to see my performance metrics so that I can track my case load. | AC1: My Cases count, clear rate, average resolution time shown. |

## Module: Administration

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-ADMIN-01 | As an admin, I want to manage users so that I can control system access. | AC1: List all users with role, status, last login. AC2: Add/edit/disable users. |
| US-ADMIN-02 | As an admin, I want to view audit logs so that I can track system activity. | AC1: Log shows: user, action, timestamp, IP address. AC2: Searchable and filterable. |
| US-ADMIN-03 | As an admin, I want to manage system settings so that the platform operates correctly. | AC1: Configure session timeout, password policy, max upload size. |

## Module: Settings

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-SET-01 | As a user, I want to update my profile so that my information is current. | AC1: Edit name, email, phone, badge number. AC2: Change password. |
| US-SET-02 | As a user, I want to configure notification preferences so that I receive relevant alerts. | AC1: Toggle email/in-app notifications for case updates. |

---

# 17. FUNCTIONAL REQUIREMENTS

## 17.1 Authentication Module

| Field | Detail |
|---|---|
| **Module ID** | M-AUTH |
| **Purpose** | Provide secure access control to the CrimeIntel AI platform |
| **Description** | Handles user login, logout, session management, password reset, and role-based access control. Uses Zoho Catalyst Authentication as the identity provider. Supports four roles: Officer, Inspector, Admin, Super Admin. |
| **Inputs** | Email, password, role assignments |
| **Outputs** | Auth token, user session, role-based permissions |
| **Business Rules** | BR1: Only Admin/Super Admin can create new users. BR2: Password must be 8+ chars with uppercase, lowercase, digit, special char. BR3: Session expires after 60 minutes of inactivity. BR4: 3 failed login attempts → 5-minute lockout. BR5: Role determines module access (see Role-Permission Matrix). |
| **Dependencies** | Zoho Catalyst Authentication service |
| **Error Conditions** | EC1: Invalid credentials → 401 Unauthorized. EC2: Locked account → 423 Locked. EC3: Expired session → 401 with redirect to login. EC4: Insufficient permissions → 403 Forbidden. |
| **Acceptance Criteria** | AC1: Valid login creates session within 2 seconds. AC2: Invalid login shows error in 1 second. AC3: Role-based access restricts unauthorized pages. AC4: Admin can create/edit/disable users. |

### Role-Permission Matrix

| Module | Officer | Inspector | Admin | Super Admin |
|---|---|---|---|---|
| Dashboard | View | View | View | View |
| CRIMA AI Chat | Full | Full | Full | Full |
| Case Explorer | View | View + Edit | View + Edit | Full |
| Evidence | View + Upload | Full | Full | Full |
| Analytics | View | View | View | View |
| Heat Maps | View | View | View | View |
| User Management | — | — | Full | Full |
| Audit Logs | — | — | View | Full |
| Settings | Own Profile | Own Profile | System | System |
| Admin Panel | — | — | Full | Full |

## 17.2 Dashboard Module

| Field | Detail |
|---|---|
| **Module ID** | M-DASH |
| **Purpose** | Provide a central landing page with key metrics and quick access to system modules |
| **Description** | The dashboard is the first screen after login. It displays KPI cards, recent cases, quick-action buttons, and role-relevant widgets. Data is fetched from the backend with real-time updates. |
| **Inputs** | User role, authentication token |
| **Outputs** | Dashboard widgets with case statistics and recent activity |
| **Business Rules** | BR1: Dashboard content adapts to user role. BR2: KPI cards refresh every 60 seconds. BR3: Maximum 10 recent cases shown. |
| **Dependencies** | M-AUTH (for role), Backend API (for statistics) |
| **Error Conditions** | EC1: API failure → show cached/fallback data. EC2: No data → show empty state with guidance. |
| **Acceptance Criteria** | AC1: Dashboard loads within 3 seconds. AC2: All KPI cards display correct values. AC3: Quick-action buttons navigate correctly. AC4: Recent cases list is accurate. |

### Dashboard Widgets

| Widget | Description | Data Source |
|---|---|---|
| Total Cases | Count of all cases in the system | Cases API |
| Open Cases | Count of cases with "Under Investigation" status | Cases API |
| Clearance Rate | % of cases resolved (Closed + Filed) | Cases API |
| Recent Cases | Last 10 updated cases with quick links | Cases API |
| Quick Actions | Buttons: New Search, View Cases, Open CRIMA AI | Static |
| Crime Type Distribution | Pie chart of cases by crime type | Analytics API |
| Monthly Trend | Line chart of cases over last 12 months | Analytics API |
| My Cases (Officer) | Count and status of cases assigned to logged-in user | Cases API |

## 17.3 CRIMA AI Chat Module

| Field | Detail |
|---|---|
| **Module ID** | M-CRIMA |
| **Purpose** | Provide a conversational AI interface for querying the crime database in natural language |
| **Description** | CRIMA AI is the core innovation of the platform. Users type natural language questions, and the system processes them through an AI pipeline: intent detection → semantic embedding → FAISS similarity search → result ranking → response generation. The assistant can answer questions about cases, suspects, evidence, and crime statistics. It supports follow-up questions, maintains conversation context, and cites sources for every answer. |
| **Inputs** | Natural language text query, conversation history, user role |
| **Outputs** | Natural language response with case references, links, confidence scores |
| **Business Rules** | BR1: Queries limited to 500 characters. BR2: Maximum 10 results returned per query. BR3: Results below 60% confidence are flagged as "Low Confidence". BR4: Conversation history maintained for current session only (not persisted across sessions in MVP). BR5: CRIMA AI cannot create/modify records (read-only). BR6: Explicit data queries always cite the source case ID. BR7: If CRIMA AI cannot answer, it responds: "I cannot find information matching your query. Please try rephrasing or contact your system administrator." |
| **Supported Query Types** | QT1: Case search ("Find cases involving chain snatching"). QT2: Case detail ("Show me case FIR-2024-123"). QT3: Suspect search ("Find suspects named Kumar"). QT4: Evidence search ("What evidence is in case 456?"). QT5: Summarization ("Summarize case FIR-2024-123"). QT6: Statistics ("How many cases this month?"). QT7: Cross-reference ("Which suspects appear in multiple cases?"). QT8: Location-based ("Cases near MG Road in the last month"). QT9: Date-range ("Cases from January to March 2024"). QT10: Status-based ("Open cases assigned to me"). |
| **Dependencies** | M-CASE (for case data), M-EVI (for evidence data), AI Pipeline (Sentence Transformers + FAISS), Analytics API |
| **Error Conditions** | EC1: Query too long → "Please limit your query to 500 characters." EC2: No results found → "I could not find any matching records. Try rephrasing." EC3: AI pipeline failure → "I encountered a technical issue. Please try again." EC4: Ambiguous query → "I found multiple interpretations. Please be more specific." |
| **Acceptance Criteria** | AC1: Query "Find theft cases in Bangalore" returns relevant cases within 3 seconds. AC2: Follow-up "What about last month?" maintains context. AC3: "Summarize case X" returns a 3-5 line summary. AC4: Results show confidence scores. AC5: Sources are clickable and link to Case Explorer. AC6: 10 conversation exchanges maintain coherent context. AC7: Chat history is scrollable. |

### CRIMA AI Conversation Flow

```
User Query
    │
    ▼
[ 1. Intent Classification ]
    ├── case_search
    ├── case_detail
    ├── suspect_search
    ├── evidence_search
    ├── summarization
    ├── statistics
    ├── cross_reference
    └── location_query
    │
    ▼
[ 2. Query Enrichment ]
    ├── Extract entities (names, dates, locations, case IDs)
    └── Apply conversation context (refine filters from history)
    │
    ▼
[ 3. Semantic Embedding ]
    ├── Sentence Transformer encodes query to 384-dim vector
    └── (or 768-dim depending on model)
    │
    ▼
[ 4. FAISS Similarity Search ]
    ├── k-NN search on FAISS index
    └── Returns top-k case IDs with similarity scores
    │
    ▼
[ 5. Result Retrieval & Ranking ]
    ├── Fetch full case data from Catalyst Data Store
    ├── Apply role-based filtering
    └── Rank by: similarity + recency + relevance
    │
    ▼
[ 6. Response Generation ]
    ├── Build natural language response with template
    ├── Include confidence scores
    └── Add clickable source references
    │
    ▼
User Response Displayed
```

## 17.4 Case Explorer Module

| Field | Detail |
|---|---|
| **Module ID** | M-CASE |
| **Purpose** | Provide a comprehensive interface for browsing, searching, and viewing criminal cases |
| **Description** | The Case Explorer is the central repository for all case data. It supports paginated browsing, advanced search, filtering, and detailed case views. Each case includes: FIR details, suspects (name, photo, alias, known associates), witnesses (name, statement summary), evidence list (linked to M-EVI), and case timeline. |
| **Inputs** | Search query, filter parameters, case ID |
| **Outputs** | Case list, case detail view, case timeline |
| **Business Rules** | BR1: Case list paginated at 20 items per page. BR2: Search supports: case ID, FIR number, suspect name, victim name, crime type, date range, location. BR3: Role-based access: Officer = view-only, Inspector = view + edit, Admin = full. BR4: Soft delete only (cases marked inactive, not removed). BR5: Case ID is auto-generated format: FIR-YYYY-NNNNNN. |
| **Dependencies** | M-AUTH (for permissions), Catalyst Data Store (for persistence) |
| **Error Conditions** | EC1: Case not found → "Case with ID X does not exist." EC2: No search results → "No cases match your search criteria." EC3: Insufficient permissions → "You do not have access to this case." |
| **Acceptance Criteria** | AC1: Case list loads within 3 seconds (50 records). AC2: Search returns results within 2 seconds. AC3: Case detail shows all sections (FIR, Suspects, Witnesses, Evidence, Timeline). AC4: Sorting and filtering work correctly. AC5: Pagination works correctly. |

### Case Detail Sections

| Section | Fields | Display Type |
|---|---|---|
| **FIR Information** | Case ID, FIR Number, Date Filed, Crime Type, Location, Status, Investigating Officer, Description | Form layout |
| **Suspects** | Name, Alias, Photo, Age, Gender, Address, Known Associates, Criminal History | Card list |
| **Witnesses** | Name, Contact, Statement Summary, Credibility Score | Table |
| **Evidence** | File Name, Type, Upload Date, Uploaded By | Gallery grid |
| **Timeline** | Date, Event, Description, Officer | Chronological list |
| **Related Cases** | Case ID, Crime Type, Status, Similarity Score | Card list |

## 17.5 Evidence Management Module

| Field | Detail |
|---|---|
| **Module ID** | M-EVI |
| **Purpose** | Enable digital uploading, storage, and retrieval of case evidence files |
| **Description** | Officers can upload evidence files (documents, images, videos) and link them to specific cases. Evidence is stored in Zoho Catalyst File Store and metadata is stored in Catalyst Data Store. Supports preview for images/PDFs and metadata display. |
| **Inputs** | File upload (PDF, JPEG, PNG, MP4), case ID, evidence description |
| **Outputs** | Stored evidence with metadata, file preview URL |
| **Business Rules** | BR1: Maximum file size: 25 MB. BR2: Supported formats: PDF, JPEG, PNG, MP4. BR3: Evidence must be linked to an existing case. BR4: File renamed on upload to UUID-based name to prevent collisions. BR5: Officer can only upload evidence for cases they can access. BR6: Evidence can be marked as "Sensitive" requiring Inspector+ to view. |
| **Dependencies** | M-CASE (for case linking), M-AUTH (for permissions), Catalyst File Store |
| **Error Conditions** | EC1: File too large → "Maximum file size is 25 MB." EC2: Unsupported format → "Supported formats: PDF, JPEG, PNG, MP4." EC3: Upload fails → "Upload failed. Please try again." EC4: Case not found → "Cannot link evidence to a non-existent case." |
| **Acceptance Criteria** | AC1: File upload completes within 10 seconds (for 5MB file). AC2: Uploaded file appears in evidence gallery immediately. AC3: Evidence metadata is accurate. AC4: File preview works for images and PDFs. AC5: Evidence can be downloaded. |

### Evidence Metadata

| Field | Type | Description |
|---|---|---|
| Evidence ID | String | Auto-generated UUID |
| File Name | String | Original file name |
| File Type | String | PDF / JPEG / PNG / MP4 |
| File Size | Number | Size in bytes |
| Case ID | String | Linked case reference |
| Description | String | User-provided description |
| Sensitive | Boolean | Flag for restricted access |
| Uploaded By | String | User ID |
| Uploaded At | Datetime | Upload timestamp |
| File URL | String | Catalyst File Store URL |

## 17.6 Analytics Module

| Field | Detail |
|---|---|
| **Module ID** | M-ANALYTICS |
| **Purpose** | Provide crime analytics and data visualization for strategic decision-making |
| **Description** | The analytics dashboard displays KPIs, charts, and trends derived from case data. Includes: total cases, open/closed breakdown, clearance rate, crime type distribution, monthly trends, and district-wise distribution. |
| **Inputs** | Date range filter, crime type filter, district filter |
| **Outputs** | KPI cards, pie chart, bar chart, line chart |
| **Business Rules** | BR1: Analytics computed from case data at query time (no pre-aggregation in MVP). BR2: All officers can view analytics (role-independent). BR3: Date range defaults to last 12 months. BR4: Charts show tooltip on hover with exact values. |
| **Dependencies** | M-CASE (for data), Backend Analytics API |
| **Error Conditions** | EC1: No data for filter → "No data available for selected filters." EC2: API error → "Unable to load analytics. Please try again later." |
| **Acceptance Criteria** | AC1: All charts render within 3 seconds. AC2: Filter changes update charts within 2 seconds. AC3: Data labels and tooltips are accurate. AC4: KPI cards match case data. |

### Analytics Widgets

| Widget | Type | Description |
|---|---|---|
| Total Cases | KPI Card | Total number of cases |
| Open Cases | KPI Card | Cases with status "Under Investigation" |
| Closed Cases | KPI Card | Cases with status "Closed" |
| Clearance Rate | KPI Card | (Closed + Filed) / Total * 100 |
| Crime Type Distribution | Pie Chart | Cases grouped by crime type |
| Monthly Case Trend | Line Chart | Cases per month over selected period |
| Cases by District | Bar Chart | Cases grouped by district/location |
| Status Breakdown | Bar Chart | Cases by status (Open, Investigation, Closed, Filed) |

## 17.7 Heat Map Module

| Field | Detail |
|---|---|
| **Module ID** | M-HEATMAP |
| **Purpose** | Provide geospatial visualization of crime incidents to identify hotspots |
| **Description** | Interactive map (using a web mapping library) showing crime incidents as a heat overlay. Color intensity represents crime density. Users can zoom, pan, and filter by crime type, date range, and district. |
| **Inputs** | Map bounds, zoom level, filter parameters |
| **Outputs** | Interactive heat map with crime density overlay |
| **Business Rules** | BR1: Incidents plotted using latitude/longitude from case data. BR2: Heat map radius scales with zoom level. BR3: Color gradient: Blue (low density) → Yellow (medium) → Red (high density). BR4: Click on heat point shows tooltip with case count and crime types. BR5: Filter changes regenerate heat map. |
| **Dependencies** | M-CASE (for location data), Mapping library (Leaflet or MapLibre) |
| **Error Conditions** | EC1: No incidents for filter → "No crime incidents match your filter." EC2: Map fails to load → "Unable to load map. Check your internet connection." |
| **Acceptance Criteria** | AC1: Map loads within 4 seconds. AC2: Heat overlay renders correctly. AC3: Zoom and pan work smoothly. AC4: Filters update heat map in < 3 seconds. AC5: Tooltip shows correct information on click. |

## 17.8 Notifications Module

| Field | Detail |
|---|---|
| **Module ID** | M-NOTIF |
| **Purpose** | Provide in-app notifications for case updates and system alerts |
| **Description** | Displays a notification bell with unread count badge. Notifications include: case assigned, case status changed, evidence uploaded, and system announcements. MVP supports in-app notifications only (no email/push). |
| **Inputs** | Notification events from backend |
| **Outputs** | Notification list with read/unread status |
| **Business Rules** | BR1: Notifications stored for 30 days then auto-deleted. BR2: Maximum 100 unread notifications. BR3: Clicking a notification navigates to relevant module. BR4: Mark as read on click or via "Mark All Read". |
| **Dependencies** | M-AUTH (for user context), Backend Notification API |
| **Error Conditions** | EC1: Notification fetch fails → notification bell shows red dot with error tooltip. |
| **Acceptance Criteria** | AC1: New notifications appear within 10 seconds of event. AC2: Unread count badge updates correctly. AC3: Click navigates to correct module. AC4: "Mark All Read" works. |

### Notification Types

| Type | Example Message | Click Action |
|---|---|---|
| Case Assigned | "Case FIR-2024-567 assigned to you" | Open Case Explorer |
| Status Change | "Case FIR-2024-123 status changed to Closed" | Open Case Explorer |
| Evidence Uploaded | "New evidence added to Case FIR-2024-456" | Open Evidence tab |
| System Announcement | "System maintenance scheduled for Sunday 2 AM" | — |

## 17.9 Administration Module

| Field | Detail |
|---|---|
| **Module ID** | M-ADMIN |
| **Purpose** | Provide system administration capabilities for user and system management |
| **Description** | Admin panel with user management, role assignment, audit logs, and system configuration. Accessible only to Admin and Super Admin roles. |
| **Inputs** | User data, role assignments, configuration parameters |
| **Outputs** | User list, audit log, system configuration |
| **Business Rules** | BR1: Only Admin and Super Admin can access. BR2: Audit logs cannot be deleted (append-only). BR3: User disable is a soft operation (user data preserved). BR4: Cannot delete the last Super Admin. |
| **Dependencies** | M-AUTH (for permissions), Catalyst Data Store |
| **Error Conditions** | EC1: Non-admin user tries to access → 403 Forbidden. EC2: Cannot delete last admin → validation error. |
| **Acceptance Criteria** | AC1: User list loads within 3 seconds. AC2: Create/edit/disable user works correctly. AC3: Audit log shows all actions with timestamps. AC4: Audit log searchable by user, action, and date. |

### Administration Sections

| Section | Description |
|---|---|
| **User Management** | List, create, edit, disable users. Assign roles. |
| **Audit Log** | Searchable log of all user actions: login, case view, evidence upload, etc. |
| **System Configuration** | Session timeout, password policy, max upload size, maintenance mode toggle. |

## 17.10 Settings Module

| Field | Detail |
|---|---|
| **Module ID** | M-SETTINGS |
| **Purpose** | Allow users to manage their profile and preferences |
| **Description** | User settings page where officers can update their profile information, change password, and configure notification preferences. |
| **Inputs** | Profile data, password, preferences |
| **Outputs** | Updated user profile, updated preferences |
| **Business Rules** | BR1: Email cannot be changed (used as login ID). BR2: Password change requires current password verification. BR3: Notification preferences saved per user. |
| **Dependencies** | M-AUTH |
| **Error Conditions** | EC1: Incorrect current password → validation error. EC2: Email already exists → duplicate error. |
| **Acceptance Criteria** | AC1: Profile updates save correctly. AC2: Password change works with validation. AC3: Notification preferences persist. |

### Settings Sections

| Section | Fields |
|---|---|
| **Profile** | Display Name, Phone, Badge Number, Profile Photo |
| **Security** | Current Password, New Password, Confirm Password |
| **Notifications** | Case assigned (on/off), Status change (on/off), Evidence uploaded (on/off) |

---

# 18. NON-FUNCTIONAL REQUIREMENTS

## 18.1 Performance

| Requirement | Target |
|---|---|
| Login response time | < 2 seconds |
| Dashboard load time | < 3 seconds |
| CRIMA AI query response time | < 3 seconds (excluding embedding generation) |
| Semantic search (FAISS) | < 500ms per query |
| Case list load (50 records) | < 3 seconds |
| Heat map generation | < 4 seconds |
| File upload (5MB) | < 10 seconds |
| API response time (95th percentile) | < 2 seconds |
| Concurrent users | Support 50 simultaneous users (MVP) |

## 18.2 Security

| Requirement | Detail |
|---|---|
| Authentication | Zoho Catalyst Authentication |
| Session Management | JWT-based tokens, 60 min expiry |
| Password Policy | Min 8 chars, uppercase, lowercase, digit, special character |
| Role-Based Access | 4 roles with distinct permission matrices |
| Data Encryption | At rest: Catalyst Data Store encryption. In transit: HTTPS/TLS |
| Audit Logging | All user actions logged with timestamp and IP |
| Input Validation | Server-side validation on all API inputs |
| CSRF Protection | Token-based CSRF protection |
| XSS Prevention | Output encoding, Content Security Policy headers |
| Rate Limiting | 100 API requests per minute per user |

## 18.3 Availability

| Requirement | Target |
|---|---|
| Uptime | 99.5% during hackathon demo period |
| Planned Downtime | Maintenance window announced 24 hours in advance |
| Failure Recovery | Auto-restart via Catalyst Functions |

## 18.4 Reliability

| Requirement | Detail |
|---|---|
| Error Handling | Graceful error messages for all failure modes |
| Data Integrity | All database writes validated before commit |
| Backup | Daily automated backup of Catalyst Data Store |
| Rollback | Version-tagged deployments for quick rollback |

## 18.5 Maintainability

| Requirement | Detail |
|---|---|
| Code Standards | ESLint + Prettier for frontend, Flake8 + Black for backend |
| Documentation | API docs via Swagger/OpenAPI, README for setup |
| Logging | Structured logging (JSON format) for all backend services |
| Modularity | Frontend: Feature-based folder structure. Backend: Module-based routers |

## 18.6 Scalability

| Requirement | Detail |
|---|---|
| Horizontal Scaling | Catalyst Functions auto-scale with demand |
| Data Growth | FAISS index rebuild scheduled for < 100K embeddings |
| Database | Catalyst Data Store scales automatically |

## 18.7 Accessibility

| Requirement | Detail |
|---|---|
| WCAG Compliance | Target WCAG 2.1 AA |
| Keyboard Navigation | All actions accessible via keyboard |
| Screen Reader | Semantic HTML, ARIA labels on interactive elements |
| Color Contrast | Minimum 4.5:1 contrast ratio for text |
| Focus Indicators | Visible focus rings on all interactive elements |

## 18.8 Usability

| Requirement | Detail |
|---|---|
| Learning Curve | First-time user can complete core tasks without training |
| Consistency | Consistent UI patterns, terminology, and behavior across modules |
| Feedback | Visual feedback for all user actions (loading, success, error) |
| Error Messages | Clear, actionable error messages in plain language |
| Help | Inline tooltips and contextual help for complex features |

---

# 19. AI REQUIREMENTS

## 19.1 Conceptual Overview

CRIMA AI is the conversational interface that bridges natural language with structured crime data. It is NOT a generative LLM that produces novel text. Instead, it is a **retrieval-augmented system** that:

1. **Understands the user's intent** — Classifies the query type (search, detail, summarize, etc.)
2. **Extracts entities** — Identifies names, dates, locations, case IDs, and crime types from the query
3. **Embeds the query** — Converts the natural language query into a dense vector using Sentence Transformers
4. **Retrieves relevant data** — Searches the FAISS vector index for semantically similar cases
5. **Ranks and filters** — Applies relevance scoring, recency weighting, and role-based filters
6. **Generates a response** — Constructs a natural language response using templates and the retrieved data
7. **Maintains context** — Stores conversation history to support follow-up questions

## 19.2 Natural Language Queries

| Query Type | Example | Behavior |
|---|---|---|
| Case Search | "Find chain snatching cases in Bangalore" | Semantic search → ranked case list |
| Case Detail | "Show details of case FIR-2024-123" | Fetch by case ID → full case view |
| Suspect Search | "Find suspects named Kumar" | Search suspects table → matching results |
| Summarization | "Summarize case FIR-2024-456" | Retrieve case → generate 3-5 line summary |
| Statistics | "How many theft cases last month?" | Analytics query → computed result |
| Cross-Reference | "Which suspects appear in multiple cases?" | Cross-case suspect matching → list |

## 19.3 Semantic Search

The semantic search pipeline:

```
User Query Text
    │
    ▼
Sentence Transformer Model
    │   (all-MiniLM-L6-v2 or similar)
    ▼
384-dim or 768-dim Embedding Vector
    │
    ▼
FAISS Index (L2 distance / Inner Product)
    │
    ▼
Top-k Similar Case IDs (k=10)
    │
    ▼
Retrieve Full Case Data from Catalyst Data Store
    │
    ▼
Rank & Filter by Relevance + Role + Recency
    │
    ▼
Return Results
```

## 19.4 Similar Case Retrieval

- FAISS index built from embeddings of case descriptions, FIR text, and suspect names
- Index rebuilt when new cases are added (batch re-indexing)
- Similarity measured using cosine similarity (normalized embeddings)
- Returns top-k results with similarity scores (0.0 – 1.0)

## 19.5 Summarization

- Summarization is **extractive**, not generative
- A case summary includes:
  - Crime type, date, location
  - Key suspects (up to 3)
  - Case status
  - Evidence count
  - Brief description (first 200 chars of FIR)
- Template-based generation from structured fields

## 19.6 Conversation Flow & Context

- Context maintained as a sliding window of last 5 exchanges
- Context includes: previous queries, identified entities, returned case IDs
- Follow-up queries refine previous results:
  - "Show me cases in Bangalore" → result set filtered to Bangalore
  - "What about last month?" → date filter applied to previous result set
  - "Tell me more about case 3" → detail view of 3rd result

## 19.7 Hallucination Mitigation

| Strategy | Implementation |
|---|---|
| **No generative LLM** | All responses derived from retrieved structured data |
| **Source citation** | Every response includes case ID references |
| **Confidence threshold** | Results below 60% confidence flagged explicitly |
| **Fallback response** | "I cannot find information matching your query" instead of guessing |
| **Template-based generation** | No free-form text generation; responses use validated templates |

## 19.8 Limitations (MVP)

| Limitation | Detail |
|---|---|
| No generative AI | CRIMA AI retrieves and presents existing data, does not generate novel text |
| No real-time learning | Model is static during MVP; no online learning |
| No voice support | Text-only interface |
| Single language | English only |
| Context limited | 5-turn conversation memory (no long-term session persistence) |
| Batch re-indexing | FAISS index requires manual or scheduled rebuild after new data ingestion |

---

# 20. TECHNOLOGY STACK

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 18 | Component-based architecture, large ecosystem, hackathon-friendly |
| **Frontend Language** | TypeScript | Type safety reduces runtime errors, better developer experience |
| **Styling** | TailwindCSS | Rapid UI development, utility-first, consistent design system |
| **State Management** | React Context + Hooks | Sufficient for MVP scope; avoids Redux overhead |
| **API Client** | Axios | Promise-based HTTP client, interceptors for auth tokens |
| **Backend Framework** | FastAPI | Async Python, automatic OpenAPI docs, high performance |
| **Backend Language** | Python 3.11+ | Rich AI/ML ecosystem (Sentence Transformers, FAISS, NumPy) |
| **Cloud Platform** | Zoho Catalyst | Mandated by hackathon; provides Auth, Data Store, File Store, Hosting |
| **Authentication** | Catalyst Auth | Pre-built identity management, social login support |
| **Database** | Catalyst Data Store | NoSQL document store, REST API access, auto-scaling |
| **File Storage** | Catalyst File Store | Secure file upload, CDN delivery, access control |
| **Serverless Functions** | Catalyst Functions | Python serverless functions for API backend |
| **Vector Search** | FAISS | Industry-standard similarity search, CPU-optimized, fast |
| **Embeddings** | Sentence Transformers | State-of-the-art sentence embeddings, lightweight (all-MiniLM-L6-v2) |
| **Mapping** | Leaflet (React-Leaflet) | Open-source, lightweight, no API key required |
| **Charts** | Recharts / Chart.js | React-native chart libraries, customizable, responsive |
| **HTTP Server** | Uvicorn | ASGI server for FastAPI |
| **API Documentation** | Swagger UI (Auto) | Generated by FastAPI via OpenAPI specification |

---

# 21. ZOHO CATALYST SERVICE MAPPING

| Application Component | Catalyst Service | Usage |
|---|---|---|
| User Identity & Auth | **Catalyst Authentication** | Login, logout, password reset, session management |
| Case Records | **Catalyst Data Store** | Table: Cases — FIR details, suspects, witnesses, timeline |
| Evidence Metadata | **Catalyst Data Store** | Table: Evidence — file metadata, case links |
| User Profiles | **Catalyst Data Store** | Table: Users — profile info, role, preferences |
| Audit Logs | **Catalyst Data Store** | Table: AuditLog — user actions, timestamps |
| Analytics Cache | **Catalyst Data Store** | Table: Analytics — pre-computed aggregations |
| Notifications | **Catalyst Data Store** | Table: Notifications — user notifications |
| FAISS Index File | **Catalyst File Store** | Serialized FAISS index file storage/retrieval |
| Evidence Files | **Catalyst File Store** | Uploaded evidence (PDF, images, videos) |
| Backend API | **Catalyst Functions** | Python FastAPI deployed as serverless functions |
| Frontend App | **Catalyst Hosting** | React build deployed as static site |
| AI Embedding Pipeline | **Catalyst Functions** | Serverless function for embedding generation |
| App Monitoring | **Catalyst Logs** | Application logs, error tracking |

---

# 22. HIGH-LEVEL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         React SPA (TailwindCSS + TS)          │  │
│  │  ┌─────┐ ┌──────┐ ┌──────┐ ┌─────────────┐  │  │
│  │  │Auth │ │CRIMA │ │Case  │ │ Analytics   │  │  │
│  │  │Module│ │AI    │ │Expl. │ │ + Heatmap   │  │  │
│  │  └─────┘ └──────┘ └──────┘ └─────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────┐
│               ZOHO CATALYST CLOUD                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │        CATALYST FUNCTIONS (FastAPI)          │   │
│  │  ┌──────┐ ┌──────┐ ┌───────┐ ┌─────────┐   │   │
│  │  │Auth  │ │Case  │ │Evid. │ │CRIMA AI │   │   │
│  │  │Router│ │Router│ │Router│ │ Router  │   │   │
│  │  └──────┘ └──────┘ └───────┘ └─────────┘   │   │
│  │  ┌──────┐ ┌──────┐ ┌───────┐ ┌─────────┐   │   │
│  │  │Anal. │ │Admin │ │Notif. │ │Embed.   │   │   │
│  │  │Router│ │Router│ │Router │ │Service  │   │   │
│  │  └──────┘ └──────┘ └───────┘ └─────────┘   │   │
│  └──────────────────────────────────────────────┘   │
│                     │                                │
│         ┌───────────┼────────────┐                   │
│         ▼           ▼            ▼                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │Catalyst  │ │Catalyst  │ │Catalyst  │             │
│  │Data Store│ │File Store│ │  Auth    │             │
│  │(NoSQL)   │ │(Files)   │ │Service   │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              AI PIPELINE                       │   │
│  │  ┌────────────────┐  ┌────────────────────┐   │   │
│  │  │Sentence        │  │ FAISS Vector       │   │   │
│  │  │Transformers    │──▶ Search Index       │   │   │
│  │  └────────────────┘  └────────────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

# 23. HIGH-LEVEL DATA FLOW

```
User Action                Frontend                  Backend                    Catalyst
───────────                ────────                  ───────                    ────────
                                                                                
[Login]                    Login Form                Auth Router                Catalyst Auth
                           ─────────                 ──────────                 ────────────
                           Send credentials ──────▶  Validate auth ──────────▶  Verify identity
                           ◀── JWT token ──────────  Return JWT ◀────────────  Token issued
                           Store token in memory
                                                                                
[CRIMA AI Query]           Chat Interface            CRIMA AI Router            Data Store + FAISS
                           ──────────────            ───────────────            ─────────────────
                           User types query ──────▶  1. Intent classify
                                                     2. Extract entities
                                                     3. Generate embedding ──▶  Load model
                                                     4. Search FAISS ────────▶  Similarity search
                                                     5. Fetch case data ─────▶  Data Store query
                                                     6. Build response
                           ◀── Response + sources ◀
                                                                                
[View Case]                Case Explorer             Case Router               Data Store
                           ─────────────             ───────────               ──────────
                           Request case ID ───────▶  Query by ID ────────────▶  Get record
                           ◀── Case data ◀────────  Return data ◀────────────  Record found
                                                                                
[Upload Evidence]          Evidence Upload           Evidence Router           File Store + Data Store
                           ───────────────           ───────────────           ──────────────────────
                           Upload file ──────────▶  1. Validate file ───────▶  Store file
                                                     2. Create metadata ─────▶  Save record
                           ◀── Upload success ◀───  Return evidence ID
                                                                                
[View Analytics]           Analytics Dashboard       Analytics Router          Data Store
                           ───────────────────       ───────────────           ──────────
                           Request stats ─────────▶  Aggregate query ────────▶  Compute stats
                           ◀── Chart data ◀────────  Return formatted data
```

---

# 24. HIGH-LEVEL DATABASE OVERVIEW

The system uses Zoho Catalyst Data Store (NoSQL document store). Major entities:

| Entity | Description | Key Fields |
|---|---|---|
| **User** | System user profile | ID, Name, Email, Role, BadgeNumber, Status |
| **Case** | Criminal case record | ID, FIRNumber, CrimeType, Date, Location, Status, OfficerID, Description |
| **Suspect** | Case suspect | ID, CaseID, Name, Alias, Photo, Age, Gender, Address |
| **Witness** | Case witness | ID, CaseID, Name, Contact, Statement, Credibility |
| **Evidence** | Case evidence file | ID, CaseID, FileName, FileType, Size, URL, Sensitive |
| **CaseTimeline** | Case timeline event | ID, CaseID, Date, Event, Description, OfficerID |
| **Notification** | User notification | ID, UserID, Type, Message, Read, Link, CreatedAt |
| **AuditLog** | User action audit | ID, UserID, Action, Module, Details, Timestamp, IP |
| **FAISSIndex** | Index metadata | ID, Version, CreatedAt, FileURL, Status |

No formal relationships enforced (NoSQL), but references maintained via CaseID foreign keys in application logic.

---

# 25. API OVERVIEW

The backend exposes REST APIs under the following categories. All APIs are prefixed with `/api/v1`.

| Category | Base Path | Key Endpoints |
|---|---|---|
| **Authentication** | `/api/v1/auth` | POST /login, POST /logout, POST /reset-password |
| **Cases** | `/api/v1/cases` | GET /, GET /{id}, POST /, PUT /{id}, DELETE /{id}, GET /search |
| **Evidence** | `/api/v1/evidence` | GET /{id}, POST /, DELETE /{id}, GET /case/{caseId} |
| **CRIMA AI** | `/api/v1/crima` | POST /query, GET /history |
| **Analytics** | `/api/v1/analytics` | GET /overview, GET /trends, GET /distribution, GET /clearance |
| **Heat Map** | `/api/v1/heatmap` | GET /data?type=&from=&to=&district= |
| **Notifications** | `/api/v1/notifications` | GET /, PUT /{id}/read, PUT /read-all |
| **Admin** | `/api/v1/admin` | GET /users, POST /users, PUT /users/{id}, GET /audit-logs |
| **Settings** | `/api/v1/settings` | GET /profile, PUT /profile, PUT /password, GET /preferences, PUT /preferences |

---

# 26. DASHBOARD OVERVIEW

## Dashboard Layout (Conceptual)

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  CrimeIntel AI                           [Notif] 👤  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────┐  │
│  │ Total Cases │ │ Open Cases  │ │ Clearance   │ │ My    │  │
│  │    1,234    │ │     342     │ │    72.3%    │ │Cases  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────┘  │
│                                                              │
│  ┌─────────────────────────┐ ┌──────────────────────────────┐│
│  │  Crime Type Distribution│ │  Monthly Case Trend          ││
│  │     [Pie Chart]         │ │     [Line Chart]             ││
│  └─────────────────────────┘ └──────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Recent Cases                                           │ │
│  │  ┌────────┬────────┬────────┬────────┬──────────────┐  │ │
│  │  │ Case ID│ Type   │ Status │ Date   │ Location     │  │ │
│  │  ├────────┼────────┼────────┼────────┼──────────────┤  │ │
│  │  │FIR-2024│ Theft  │ Open   │ 01-07  │ Bangalore    │  │ │
│  │  │FIR-2024│ Assault│ Closed │ 28-06  │ Mysore       │  │ │
│  │  │ ...    │ ...    │ ...    │ ...    │ ...          │  │ │
│  │  └────────┴────────┴────────┴────────┴──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────┐                            │
│  │  Quick Actions               │                            │
│  │  [🔍 New Search] [📂 Cases]  │                            │
│  │  [🤖 Open CRIMA AI]          │                            │
│  └──────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────┘
```

---

# 27. MVP DEFINITION — MOSCOW PRIORITIZATION

## Must Have (Core MVP)

| Module | Features |
|---|---|
| Authentication | Login, logout, role-based access |
| CRIMA AI | Natural language query, semantic search, result display, confidence scores, source citations |
| Case Explorer | Browse cases, case detail view (FIR, suspects, witnesses, timeline), search |
| Evidence Management | Upload, view gallery, metadata display |
| Dashboard | KPI cards, recent cases, quick actions |
| Analytics | Total/open/closed counts, clearance rate, crime type pie chart, monthly trend |
| Heat Map | Geospatial visualization with filters |
| User Management | Admin list/create/users, role assignment |
| Settings | Profile update, password change |

## Should Have

| Module | Features |
|---|---|
| CRIMA AI | Follow-up questions with context, summarization |
| Case Explorer | Advanced filters (date, status, type, location), sort |
| Analytics | District-wise distribution, status breakdown |
| Notifications | In-app notification bell, unread badge |
| Admin | Audit log viewer |
| Heat Map | Crime type filter, date range filter |

## Could Have

| Module | Features |
|---|---|
| CRIMA AI | Cross-case suspect matching | v |
| Case Explorer | Case timeline visualization |
| Evidence | Sensitive evidence flagging |
| Dashboard | Role-based widget customization |
| Admin | System configuration (session timeout, password policy) |
| Settings | Notification preferences |

## Won't Have (MVP)

| Feature | Reason |
|---|---|
| OCR / Document Scanning | Requires computer vision — future phase |
| Voice Search | Requires audio processing — future phase |
| Predictive Analytics | Requires ML training — future phase |
| Mobile Native App | Responsive web sufficient |
| Real-Time Push Notifications | Requires push infrastructure |
| Third-Party Integrations | Out of scope for prototype |
| Multi-Language Support | English-only MVP |

---

# 28. RISKS

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Catalyst platform limitations (Data Store query speed, Function cold starts) | Medium | High | Early spike testing; keep queries simple; use caching where possible |
| R2 | Sentence Transformers model size/latency exceeds Catalyst Function limits | Medium | High | Test model loading in Catalyst Functions; consider smaller model (all-MiniLM-L6-v2) |
| R3 | FAISS index rebuild too slow for real-time data changes | Medium | Medium | Batch indexing; reindex on schedule, not per-insert |
| R4 | Team capacity insufficient for all MVP features | Medium | High | Strict MoSCoW prioritization; cut "Could Have" first |
| R5 | Insufficient realistic data for demo | High | Medium | Generate synthetic data with realistic Indian names, locations, crimes |
| R6 | Security vulnerabilities in prototype code | Low | High | Input validation, auth checks, code review before demo |
| R7 | Integration issues between React and Catalyst Auth | Medium | Medium | Spike test authentication flow early |

---

# 29. ASSUMPTIONS

| # | Assumption |
|---|---|
| A1 | KSP will provide sample data or approve use of synthetic data for the prototype |
| A2 | Zoho Catalyst free tier or hackathon credits will cover infrastructure costs |
| A3 | Hackathon timeline is 4–8 weeks for planning, development, and deployment |
| A4 | The development team has basic familiarity with React, FastAPI, and Zoho Catalyst |
| A5 | Judges will evaluate a live demo, so deployment stability is critical |
| A6 | Network connectivity at demo venue is sufficient for Catalyst access |
| A7 | Sentence Transformers can be deployed within Catalyst Functions (Python runtime) |
| A8 | FAISS CPU-only index is sufficient for prototype-scale data (< 100K vectors) |

---

# 30. CONSTRAINTS

| # | Constraint | Impact |
|---|---|---|
| C1 | Must use Zoho Catalyst as the exclusive cloud platform | No AWS, Azure, or GCP services |
| C2 | Must not use real PII until data-sharing agreements are in place | All demo data must be synthetic |
| C3 | Hackathon timeline limits scope | Must cut features if timeline slips |
| C4 | Team size and availability | Parallel workstreams limited |
| C5 | Budget: zero or minimal | Must use free tiers and hackathon credits |
| C6 | Catalyst Data Store is NoSQL (not relational) | No joins; application-level relationship management |

---

# 31. FUTURE ENHANCEMENTS

| Enhancement | Description | Priority |
|---|---|---|
| **OCR** | Optical Character Recognition for scanned FIRs, handwritten notes, and physical documents. Would enable text extraction from uploaded document images. | Phase 2 |
| **Voice Search** | Speech-to-text integration allowing officers to query CRIMA AI using voice input. Critical for field officers who cannot type. | Phase 3 |
| **Predictive Crime Analytics** | ML models to predict crime hotspots, identify emerging patterns, and forecast resource needs based on historical data. | Phase 3 |
| **Mobile Application** | Native mobile app (React Native) for on-the-go access by field officers. | Phase 3 |

---

# 32. DEVELOPMENT ROADMAP

| Phase | Duration | Activities | Deliverables |
|---|---|---|---|
| **Planning** | Week 1 | Requirements gathering, architecture design, technology spike, project setup | PRD, SRS, System Design, Database Design |
| **Design** | Week 1–2 | UI/UX wireframes, design system, API contract, database schema | Design Spec, OpenAPI Spec, Figma mockups |
| **Development — Sprint 1** | Week 2–3 | Auth module, Case Explorer, API foundations, database setup | Working auth + case CRUD |
| **Development — Sprint 2** | Week 3–4 | CRIMA AI pipeline (embeddings, FAISS, query processing), Evidence module | Working semantic search + evidence upload |
| **Development — Sprint 3** | Week 4–5 | Analytics, Heat Maps, Dashboard, Notifications, Admin panel | Feature-complete MVP |
| **Testing** | Week 5 | Integration testing, performance testing, bug fixes, synthetic data loading | Test report, bug tracker |
| **Deployment** | Week 5–6 | Catalyst deployment, domain setup, SSL, demo environment | Live demo URL |
| **Demo Prep** | Week 6 | Demo script preparation, rehearsal, backup plan | Demo script, contingency plan |

---

# 33. GLOSSARY

| Term | Definition |
|---|---|
| **CRIMA AI** | Conversational AI assistant within CrimeIntel AI. Name derived from "Crime Intelligence Assistant." |
| **Catalyst Data Store** | Zoho Catalyst's NoSQL document database service. |
| **Catalyst File Store** | Zoho Catalyst's file/object storage service. |
| **Catalyst Functions** | Zoho Catalyst's serverless compute platform for running backend code. |
| **FAISS** | Facebook AI Similarity Search — a library for efficient similarity search and clustering of dense vectors. |
| **FIR** | First Information Report — the initial report filed with police regarding a crime. |
| **Heat Map** | A geospatial visualization showing crime density using color gradients. |
| **KSP** | Karnataka State Police. |
| **MVP** | Minimum Viable Product — the smallest set of features that delivers value. |
| **MoSCoW** | Prioritization method: Must Have, Should Have, Could Have, Won't Have. |
| **NoSQL** | Non-relational database (Catalyst Data Store). |
| **OCR** | Optical Character Recognition — extracting text from images/scanned documents. |
| **Semantic Search** | Search that understands the meaning and intent behind a query, not just keywords. |
| **Sentence Transformers** | Python framework for state-of-the-art sentence, text, and image embeddings. |
| **SRS** | Software Requirements Specification. |
| **PRD** | Product Requirements Document. |

---

# END OF PRODUCT REQUIREMENTS DOCUMENT

**Document Version:** 1.0
**Status:** Draft
**Next Steps:** Review by team and mentor → UI/UX Design → Development
