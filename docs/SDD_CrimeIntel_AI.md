# SOFTWARE DESIGN DOCUMENT

## CrimeIntel AI — Intelligent Conversational AI for KSP Crime Database

| Field | Value |
|---|---|
| **Project** | CrimeIntel AI |
| **Version** | 1.0 |
| **Team** | Pixel Pirates |
| **Based On** | PRD v1.0 |
| **Document Status** | Draft |

---

# TABLE OF CONTENTS

1. [Design Goals](#1-design-goals)
2. [System Architecture](#2-system-architecture)
3. [Component Diagram](#3-component-diagram)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [AI Module Architecture](#6-ai-module-architecture)
7. [Zoho Catalyst Architecture](#7-zoho-catalyst-architecture)
8. [Authentication Flow](#8-authentication-flow)
9. [Module Interaction Diagram](#9-module-interaction-diagram)
10. [Navigation Flow](#10-navigation-flow)
11. [Data Flow Diagram](#11-data-flow-diagram)
12. [Sequence Diagrams](#12-sequence-diagrams)
13. [Component Responsibilities](#13-component-responsibilities)
14. [Database Design](#14-database-design)
15. [API Design](#15-api-design)
16. [Security Design](#16-security-design)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [Logging Strategy](#18-logging-strategy)
19. [Performance Considerations](#19-performance-considerations)
20. [Scalability Considerations](#20-scalability-considerations)
21. [Folder Structure](#21-folder-structure)
22. [Coding Standards](#22-coding-standards)
23. [Development Workflow](#23-development-workflow)
24. [Testing Strategy](#24-testing-strategy)
25. [Deployment Architecture](#25-deployment-architecture)

---

# 1. DESIGN GOALS

| # | Goal | Rationale |
|---|---|---|
| DG-1 | **Modularity** | Each module (Auth, Cases, CRIMA AI, Analytics) must be independently developable and testable. Enables parallel workstreams within the team. |
| DG-2 | **Practical MVP Scope** | Every design decision must serve the hackathon timeline. Over-engineering is explicitly avoided. No enterprise middleware, no microservices — simple serverless architecture. |
| DG-3 | **Catalyst-Native** | All services must run on Zoho Catalyst. No external cloud dependencies. Design must respect Catalyst's NoSQL model, Function cold starts, and File Store access patterns. |
| DG-4 | **Offline-Capable AI Pipeline** | The AI embedding + search pipeline must operate entirely within Catalyst Functions without external API calls (no OpenAI, no cloud GPUs). Sentence Transformers + FAISS CPU only. |
| DG-5 | **Role-Enforced Security** | Every API endpoint and frontend route must enforce role-based access. Four roles: Officer, Inspector, Admin, Super Admin. |
| DG-6 | **Demo-Ready Stability** | Error states, loading states, and empty states must all be handled gracefully. The prototype must survive a live demo without crashes. |

---

# 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Browser)                                │   │
│  │  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐   │   │
│  │  │ Auth    │ │ Dashboard  │ │ CRIMA AI │ │ Case     │ │ Admin   │   │   │
│  │  │ Module  │ │ Module     │ │ Module   │ │ Explorer │ │ Module  │   │   │
│  │  └─────────┘ └────────────┘ └──────────┘ └──────────┘ └─────────┘   │   │
│  │  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────────┐   │   │
│  │  │Evidence │ │ Analytics  │ │ Settings │ │ Shared Components   │   │   │
│  │  │Module   │ │ Module     │ │ Module   │ │ (Layout, Sidebar,    │   │   │
│  │  └─────────┘ └────────────┘ └──────────┘ │ Table, Card, Chart)  │   │   │
│  │                                            └──────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS / REST JSON
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CATALYST CLOUD LAYER                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Catalyst Functions (FastAPI Server)                      │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐   │   │
│  │  │ Auth     │ │ Case     │ │ Evidence │ │ CRIMA AI │ │Analytics│   │   │
│  │  │ Router   │ │ Router   │ │ Router   │ │ Router   │ │ Router  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐   │   │
│  │  │ Admin    │ │ Notif    │ │ Settings │ │ AI Pipeline          │   │   │
│  │  │ Router   │ │ Router   │ │ Router   │ │ ┌──────────────────┐ │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ │ │Sentence Transform│ │   │   │
│  │                                          │ │all-MiniLM-L6-v2  │ │   │   │
│  │  ┌──────────────────────────────┐        │ └────────┬─────────┘ │   │   │
│  │  │ Middleware                    │        │          ▼           │   │   │
│  │  │ ┌─────────┐ ┌──────────────┐ │        │ ┌──────────────────┐ │   │   │
│  │  │ │ Auth    │ │ Error Handler│ │        │ │ FAISS Index     │ │   │   │
│  │  │ │Middleware│ │              │ │        │ │ (CPU, L2 dist)  │ │   │   │
│  │  │ └─────────┘ └──────────────┘ │        │ └──────────────────┘ │   │   │
│  │  │ ┌─────────┐ ┌──────────────┐ │        └──────────────────────┘   │   │
│  │  │ │Logging  │ │ Rate Limiter │ │                                    │   │
│  │  │ └─────────┘ └──────────────┘ │                                    │   │
│  │  └──────────────────────────────┘                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐              │
│         ▼                          ▼                          ▼              │
│  ┌──────────────┐      ┌──────────────────┐      ┌────────────────────┐     │
│  │Catalyst      │      │Catalyst          │      │Catalyst            │     │
│  │Data Store    │      │File Store        │      │Authentication      │     │
│  │(NoSQL Tables)│      │(Evidence Files,  │      │(Identity Provider) │     │
│  │              │      │ FAISS Index)     │      │                    │     │
│  │Tables:       │      │                  │      │ - Login/Logout     │     │
│  │ - Users      │      │Buckets:          │      │ - Password Reset   │     │
│  │ - Cases      │      │ - evidence       │      │ - Session Mgmt     │     │
│  │ - Suspects   │      │ - faiss-index    │      │ - RBAC Claims      │     │
│  │ - Witnesses  │      │ - exports        │      │                    │     │
│  │ - Evidence   │      └──────────────────┘      └────────────────────┘     │
│  │ - Timeline   │                                                        │
│  │ - Notif      │                                                        │
│  │ - AuditLog   │                                                        │
│  └──────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| API Pattern | REST (JSON) | Simpler than GraphQL for MVP; Catalyst Functions serve REST endpoints |
| Frontend-Backend Communication | Direct HTTPS calls from React to Catalyst Function URL | No need for API Gateway in MVP; Catalyst provides Function URLs |
| State Management | React Context + useReducer | No need for Redux/Zustand given limited component tree depth |
| Server Architecture | Monolithic FastAPI within a single Catalyst Function | Microservices add latency and complexity; MVP fits in one function |
| AI Pipeline | In-process within the same Catalyst Function | Avoids cold-start cascade across multiple functions |
| Vector Store | FAISS index file on Catalyst File Store, loaded into memory at function init | Simple persistence; index rebuilt via scheduled task |
| Mapping Library | Leaflet via react-leaflet | No API key needed; lightweight; sufficient for heat map demo |

---

# 3. COMPONENT DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React SPA)                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  App (Router)                                                    │   │
│  │  ┌───────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐   │   │
│  │  │ Auth  │ │ Dashboard │ │ CRIMA AI │ │ Case   │ │ Evidence │   │   │
│  │  │ Page  │ │ Page      │ │ Chat Page│ │Explorer│ │ Page     │   │   │
│  │  └───────┘ └───────────┘ └──────────┘ └────────┘ └──────────┘   │   │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │   │
│  │  │Analytics│ │ Heat Map │ │ Admin    │ │ Settings           │   │   │
│  │  │ Page   │ │ Page     │ │ Page     │ │ Page               │   │   │
│  │  └────────┘ └──────────┘ └──────────┘ └────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Shared Components                                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ Layout   │ │ Sidebar  │ │ Navbar   │ │ Table  │ │ Card   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ Modal    │ │ Button   │ │ Input    │ │ Badge  │ │ Spinner│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │   │
│  │  │EmptyState│ │ Error    │ │ Toast    │ │ ProtectedRoute     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Services / Hooks                                                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ api.ts   │ │ auth.ts  │ │ crima.ts │ │ case.ts│ │ evid.ts│  │   │
│  │  │(Axios    │ │ (hooks)  │ │ (service)│ │(service│ │(service│  │   │
│  │  │instance) │ │          │ │          │ │ )      │ │ )      │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐                    │   │
│  │  │analytics │ │ notif.ts │ │ AuthContext   │                    │   │
│  │  │.ts       │ │(service) │ │ Provider      │                    │   │
│  │  └──────────┘ └──────────┘ └──────────────┘                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI on Catalyst Functions)               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                                 │   │
│  │  CORS → Auth Middleware → Rate Limiter → Request Logger → Router  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  API Routers                                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ /auth    │ │ /cases   │ │ /evidence│ │/crima  │ │/analyt │  │   │
│  │  │ router   │ │ router   │ │ router   │ │ router │ │ router │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │   │
│  │  │ /admin   │ │ /notif   │ │/settings │ │ WebSocket (future) │  │   │
│  │  │ router   │ │ router   │ │ router   │ │                    │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Service Layer                                                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │   │
│  │  │ CaseSvc  │ │ EvidSvc  │ │ AuthSvc  │ │ CRIMASvc           │  │   │
│  │  │          │ │          │ │          │ │ ┌────────────────┐ │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ │ │ EmbeddingSvc   │ │  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │ FAISSSvc       │ │  │   │
│  │  │Analytics │ │ UserSvc  │ │ NotifSvc │ │ │ IntentSvc      │ │  │   │
│  │  │Svc       │ │          │ │          │ │ │ ContextSvc     │ │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ │ └────────────────┘ │  │   │
│  │  ┌──────────┐ ┌──────────┐              └────────────────────┘  │   │
│  │  │ReportSvc │ │AuditSvc  │                                       │   │
│  │  └──────────┘ └──────────┘                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Data Access Layer                                               │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐  │   │
│  │  │ DB Client  │ │ FileStore  │ │ FAISS      │ │ Embedding    │  │   │
│  │  │ (Catalyst  │ │ Client     │ │ Manager    │ │ Model        │  │   │
│  │  │  DataStore)│ │            │ │            │ │ (Singleton)  │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 4. FRONTEND ARCHITECTURE

## 4.1 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 | Component model, hooks, wide ecosystem |
| Language | TypeScript 5 | Type safety prevents runtime errors in API payloads |
| Styling | TailwindCSS 3 | Utility-first; no CSS file overhead; consistent design |
| State Management | React Context + useReducer | Sufficient for MVP; avoids Redux boilerplate |
| Routing | React Router v6 | Standard; lazy loading for route-based code splitting |
| HTTP Client | Axios | Interceptors for auth token injection; request/response transforms |
| Charts | Recharts 2 | React-native; composable; lightweight |
| Maps | react-leaflet + leaflet.heat | Open-source; no API key needed for demo |
| UI Primitives | Headless UI (Radix) | Accessible, unstyled primitives; TailwindCSS-compatible |
| Build Tool | Vite | Fast HMR; instant server start; optimized builds |

## 4.2 Application State Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      AuthContext                                  │
│  Manages: user object, token, role, isAuthenticated, login/logout│
│  Persisted: token in memory (httpOnly cookie for production)     │
│  Provided: wrapped around entire <App>                           │
└──────────────────────────┬───────────────────────────────────────┘
                           │ consumes
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Per-Page State (useReducer)                  │
│                                                                  │
│  CaseListState: { cases[], loading, error, page, filter }       │
│  CaseDetailState: { case, suspects[], witnesses[], evidence[] } │
│  CRIMAState: { messages[], loading, context, history[] }        │
│  AnalyticsState: { kpis, trends, distribution, loading }        │
│  EvidenceState: { files[], uploading, preview }                 │
│  AdminState: { users[], auditLogs[], config }                   │
└──────────────────────────────────────────────────────────────────┘
```

## 4.3 Route Map

| Route | Page Component | Roles | Lazy Load |
|---|---|---|---|
| `/login` | LoginPage | All (unauthenticated) | No |
| `/` | DashboardPage | All authenticated | Yes |
| `/crima` | CRIMAIChatPage | All authenticated | Yes |
| `/cases` | CaseListPage | All authenticated | Yes |
| `/cases/:id` | CaseDetailPage | All authenticated | Yes |
| `/evidence` | EvidenceListPage | Officer+ | Yes |
| `/evidence/:caseId` | EvidenceGalleryPage | Officer+ | Yes |
| `/analytics` | AnalyticsPage | All authenticated | Yes |
| `/heatmap` | HeatMapPage | All authenticated | Yes |
| `/admin/users` | AdminUsersPage | Admin+ | Yes |
| `/admin/audit` | AdminAuditPage | Admin+ | Yes |
| `/admin/settings` | AdminSettingsPage | Admin+ | Yes |
| `/settings` | SettingsPage | All authenticated | Yes |
| `*` | NotFoundPage | All | No |

## 4.4 Component Tree (Simplified)

```
<App>
  <AuthProvider>
    <Router>
      <Layout>                          // Sidebar + Navbar + <Outlet>
        <Sidebar />                     // Navigation menu (role-filtered)
        <Navbar />                      // User info, notifications, logout
        <main>
          <Outlet />                    // Route-based page component
            <DashboardPage>
              <KpiCard /> x4
              <RecentCasesTable />
              <QuickActions />
              <CrimeTypePieChart />
              <MonthlyTrendChart />
            </DashboardPage>
            <CRIMAIChatPage>
              <ChatMessages />
              <ChatInput />
              <SourceReferences />
            </CRIMAIChatPage>
            <CaseListPage>
              <SearchBar />
              <FilterPanel />
              <CaseTable /> / <CaseCard />
              <Pagination />
            </CaseListPage>
            ...
        </main>
      </Layout>
    </Router>
  </AuthProvider>
</App>
```

## 4.5 Key Frontend Design Decisions

| Decision | Choice | Why |
|---|---|---|
| Component Library | None (custom + Headless UI) | Avoids weight of Material UI/Ant Design for MVP |
| CSS Architecture | TailwindCSS utility classes only | No CSS modules; consistent design tokens |
| Form Handling | React Hook Form | Lightweight; performant re-renders; validation |
| Data Fetching | Custom hooks + Axios | TanStack Query would be ideal but adds bundle size; custom hooks are sufficient for ~20 API calls |
| Code Splitting | React.lazy + Suspense per route | Instant initial load; routes loaded on demand |
| Error Boundaries | Per-page ErrorBoundary component | Prevents one broken page from crashing entire SPA |
| Auth Token Storage | Module-level variable (memory) | Avoids XSS via localStorage; acceptable for demo; production would use httpOnly cookies |

---

# 5. BACKEND ARCHITECTURE

## 5.1 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | FastAPI | Async Python; auto OpenAPI docs; Pydantic validation |
| Runtime | Python 3.11+ | Catalyst Functions support; NumPy/FAISS compatibility |
| Server | Uvicorn (embedded in Catalyst Function) | ASGI; FastAPI native |
| ORM / DB Client | Catalyst Data Store SDK | Direct REST-based client; no ORM needed |
| File Client | Catalyst File Store SDK | Direct upload/download |
| Auth Client | Catalyst Auth SDK | Token verification; user profile |
| Validation | Pydantic v2 | Built into FastAPI; strict type enforcement |
| AI/NLP | sentence-transformers (all-MiniLM-L6-v2) | Lightweight; 384-dim embeddings; CPU-friendly |
| Vector Search | FAISS (CPU) | Industry standard; flat index for < 100K vectors |
| Async | asyncio | FastAPI native; concurrent DB and AI pipeline calls |

## 5.2 Application Structure (Backend)

```
backend/
├── main.py                        # FastAPI app, middleware, router includes
├── config.py                      # Environment variables, Catalyst client init
├── middleware/
│   ├── auth.py                    # JWT verification, role extraction
│   ├── error_handler.py           # Global exception handler
│   ├── logging_middleware.py      # Request/response logging
│   └── rate_limiter.py            # Simple in-memory rate limiter
├── routers/
│   ├── auth_router.py             # /api/v1/auth/*
│   ├── case_router.py             # /api/v1/cases/*
│   ├── evidence_router.py         # /api/v1/evidence/*
│   ├── crima_router.py            # /api/v1/crima/*
│   ├── analytics_router.py        # /api/v1/analytics/*
│   ├── report_router.py           # /api/v1/reports/*
│   ├── admin_router.py            # /api/v1/admin/*
│   ├── notification_router.py     # /api/v1/notifications/*
│   └── settings_router.py         # /api/v1/settings/*
├── services/
│   ├── auth_service.py            # Auth business logic
│   ├── case_service.py            # Case CRUD + search
│   ├── evidence_service.py        # Evidence upload + gallery
│   ├── crima_service.py           # CRIMA AI orchestration
│   ├── intent_service.py          # Intent classification
│   ├── embedding_service.py       # Sentence Transformer wrapper
│   ├── faiss_service.py           # FAISS index management
│   ├── context_service.py         # Conversation context management
│   ├── analytics_service.py       # Aggregation queries
│   ├── report_service.py          # Report generation
│   ├── user_service.py            # User management
│   ├── notification_service.py    # Notification business logic
│   └── audit_service.py           # Audit logging
├── models/
│   ├── user.py                    # User Pydantic model
│   ├── case.py                    # Case, Suspect, Witness, Event models
│   ├── evidence.py                # Evidence model
│   ├── crima.py                   # Query, Response, Context models
│   ├── analytics.py               # Analytics response models
│   └── common.py                  # Pagination, Error, Status models
├── adapters/
│   ├── catalyst_db.py             # Catalyst Data Store wrapper
│   ├── catalyst_fs.py             # Catalyst File Store wrapper
│   └── catalyst_auth.py           # Catalyst Auth wrapper
├── utils/
│   ├── validators.py              # Custom Pydantic validators
│   ├── helpers.py                 # Misc utility functions
│   └── constants.py               # Enums, roles, status codes
└── tests/
    ├── test_auth.py
    ├── test_cases.py
    ├── test_crima.py
    ├── test_analytics.py
    └── test_services.py
```

## 5.3 Request Lifecycle

```
HTTP Request
    │
    ▼
CORS Middleware
    │  (Allow React origin)
    ▼
Auth Middleware
    │  (Extract JWT from Authorization header)
    │  (Verify with Catalyst Auth SDK)
    │  (Attach user + role to request.state)
    ▼
Rate Limiter
    │  (Check request count per user/min)
    │  (Return 429 if exceeded)
    ▼
Logging Middleware
    │  (Log: method, path, user_id, duration, status)
    ▼
Router → Service → Adapter → Catalyst API
    │                        │
    │                        ▼
    │                   Response from Data Store / File Store
    │                        │
    ◄────────────────────────┘
    │
    ▼
Response (JSON)
```

---

# 6. AI MODULE ARCHITECTURE

## 6.1 CRIMA AI Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CRIMA AI PIPELINE                               │
│                                                                       │
│  User Query (text)                                                    │
│      │                                                                │
│      ▼                                                                │
│  ┌─────────────────────┐                                              │
│  │  1. Intent Service  │  Classify: search | detail | summarize       │
│  │                     │  | stats | cross-ref | evidence              │
│  └──────────┬──────────┘                                              │
│             ▼                                                         │
│  ┌─────────────────────┐                                              │
│  │  2. Entity Extract  │  Named entities: [case_id, person, location, │
│  │                     │  date, crime_type]                           │
│  └──────────┬──────────┘                                              │
│             ▼                                                         │
│  ┌─────────────────────┐                                              │
│  │  3. Context Merge   │  Merge with conversation context (last 5     │
│  │                     │  exchanges). Resolve pronouns/references.    │
│  └──────────┬──────────┘                                              │
│             ├────────────────────────────────────┐                    │
│             ▼                                     ▼                   │
│  ┌─────────────────────┐              ┌─────────────────────┐         │
│  │  4a. Structured     │              │  4b. Semantic       │         │
│  │  Query Path         │              │  Search Path        │         │
│  │  (detail, stats,    │              │  (search, cross-ref) │         │
│  │   specific ID)      │              │                     │         │
│  └──────────┬──────────┘              └──────────┬──────────┘         │
│             │                                    │                    │
│             ▼                                    ▼                    │
│  ┌─────────────────────┐              ┌─────────────────────┐         │
│  │  Direct DB Query    │              │  Sentence Transformer│         │
│  │  (Catalyst DStore)  │              │  (384-dim vector)    │         │
│  └──────────┬──────────┘              └──────────┬──────────┘         │
│             │                                    │                    │
│             │                                    ▼                    │
│             │                     ┌─────────────────────┐             │
│             │                     │  FAISS Similarity   │             │
│             │                     │  Search (k=10)      │             │
│             │                     └──────────┬──────────┘             │
│             │                                    │                    │
│             └──────────┬─────────────────────────┘                    │
│                        ▼                                              │
│  ┌────────────────────────────────────────────┐                       │
│  │  5. Result Fusion & Ranking               │                       │
│  │  - Merge structured + semantic results    │                       │
│  │  - Apply role-based filtering             │                       │
│  │  - Rank by: similarity * 0.6 + recency * 0.4 │                    │
│  │  - Calculate confidence scores            │                       │
│  └──────────────────┬─────────────────────────┘                       │
│                     ▼                                                 │
│  ┌────────────────────────────────────────────┐                       │
│  │  6. Response Builder                      │                       │
│  │  - Select template based on intent        │                       │
│  │  - Fill template with retrieved data      │                       │
│  │  - Format confidence badges               │                       │
│  │  - Add clickable source references        │                       │
│  │  - Handle "no results" and low confidence │                       │
│  └──────────────────┬─────────────────────────┘                       │
│                     ▼                                                 │
│  ┌────────────────────────────────────────────┐                       │
│  │  7. Context Store                         │                       │
│  │  - Save query + response to conversation  │                       │
│  │  - Update entity references for follow-up │                       │
│  └────────────────────────────────────────────┘                       │
│                     │                                                 │
│                     ▼                                                 │
│  Response to User (JSON + rendered chat message)                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6.2 Sentence Transformer Integration

| Parameter | Value |
|---|---|
| Model | `all-MiniLM-L6-v2` |
| Embedding Dimension | 384 |
| Model Size | ~80 MB (on disk) |
| Inference Time | ~50–100ms per query (CPU) |
| Load Strategy | Singleton — loaded once at Function cold start; cached in global scope |
| Framework | `sentence-transformers` via `transformers` + `torch` (CPU) |

**Loading Strategy (Cold Start Optimization):**

```python
# Pseudocode — not for implementation
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        _embedding_model.eval()  # inference mode
    return _embedding_model
```

**Important Consideration:** Catalyst Functions have cold starts. The model (~80MB) must be loaded from File Store or bundled with the Function. If cold start exceeds 10 seconds, implement a warm-up trigger (a scheduled "ping" every 5 minutes).

## 6.3 FAISS Index Management

| Parameter | Value |
|---|---|
| Index Type | `IndexFlatL2` (brute force, exact) |
| Metric | L2 distance |
| Dimensions | 384 |
| Max Vectors (MVP) | 10,000 |
| Query time (10K vectors) | < 10ms |
| Index Persistence | Serialized to Catalyst File Store |
| Rebuild Trigger | On new case creation (batch, hourly or on-demand) |
| ID Mapping | FAISS index ID → Case UUID mapping stored in Data Store |

**Index Build Flow:**

```
1. Query all cases from Data Store (with embedding field populated)
2. Extract embedding vectors → numpy array (n x 384)
3. FAISS.normalize_L2(vectors)
4. index = faiss.IndexFlatL2(384)
5. index.add(vectors)
6. faiss.write_index(index, filepath)
7. Upload file to Catalyst File Store
8. Update index metadata record (version, timestamp, vector count)
```

## 6.4 Intent Classification Strategy

Rather than an ML-based intent classifier (which would add complexity), intent is determined via **rule-based pattern matching** combined with entity extraction:

| Intent Pattern | Keywords / Structure |
|---|---|
| `case_search` | "find", "search", "show", "list", "cases", "incidents" + crime type/location |
| `case_detail` | "show case", "details of", "case FIR-", "tell me about case" + case ID |
| `suspect_search` | "suspect", "accused", "named", "wanted" + person name |
| `evidence_search` | "evidence", "files", "documents", "what evidence" + case ID |
| `summarization` | "summarize", "summary", "brief", "overview of case" + case ID |
| `statistics` | "how many", "count", "stats", "statistics", "trend", "percentage" |
| `cross_reference` | "appears in multiple", "common suspects", "linked cases", "related to" |
| `location_query` | "near", "in [city]", "around [area]", "at [location]" |
| `greeting` | "hello", "hi", "hey", "good morning" |

**Fallback:** If no pattern matches strongly (>70% confidence), default to semantic search with the full query text.

---

# 7. ZOHO CATALYST ARCHITECTURE

## 7.1 Service Mapping

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ZOHO CATALYST PROJECT                              │
│                                                                            │
│  ┌────────────────────────────────────────────┐                          │
│  │  Catalyst Hosting                         │                          │
│  │  ├── SPA: React Build (/build)             │                          │
│  │  └── Custom Domain: crimaintel.ksp.gov.in  │                          │
│  └────────────────────────────────────────────┘                          │
│                                                                            │
│  ┌────────────────────────────────────────────┐                          │
│  │  Catalyst Functions (Python 3.11)          │                          │
│  │  ├── crimeintel-api (Single Function)       │                          │
│  │  │   ├── FastAPI app with all routers       │                          │
│  │  │   ├── AI pipeline (model + FAISS)        │                          │
│  │  │   ├── Memory: 1024 MB                    │                          │
│  │  │   ├── Timeout: 30 seconds                │                          │
│  │  │   └── Runtime: Python 3.11               │                          │
│  │  └── crimeintel-indexer (Scheduled)         │                          │
│  │      ├── FAISS index rebuild job            │                          │
│  │      ├── Schedule: Every 1 hour             │                          │
│  │      └── Memory: 1024 MB                    │                          │
│  └────────────────────────────────────────────┘                          │
│                                                                            │
│  ┌────────────────────────────────────────────┐                          │
│  │  Catalyst Data Store (NoSQL Tables)        │                          │
│  │  ├── Users                                  │                          │
│  │  ├── Cases                                  │                          │
│  │  ├── Suspects                               │                          │
│  │  ├── Witnesses                              │                          │
│  │  ├── Evidence_Metadata                      │                          │
│  │  ├── Case_Timeline                          │                          │
│  │  ├── Notifications                          │                          │
│  │  ├── Audit_Logs                             │                          │
│  │  ├── FAISS_Index_Meta                       │                          │
│  │  └── User_Sessions                          │                          │
│  └────────────────────────────────────────────┘                          │
│                                                                            │
│  ┌────────────────────────────────────────────┐                          │
│  │  Catalyst File Store (Buckets)             │                          │
│  │  ├── evidence-files/                        │                          │
│  │  │   ├── {case_id}/{uuid}.{ext}            │                          │
│  │  ├── faiss-index/                           │                          │
│  │  │   ├── index_v1.faiss                    │                          │
│  │  │   └── id_mapping.json                   │                          │
│  │  └── exports/                               │                          │
│  │      └── reports/{uuid}.pdf                │                          │
│  └────────────────────────────────────────────┘                          │
│                                                                            │
│  ┌────────────────────────────────────────────┐                          │
│  │  Catalyst Authentication                   │                          │
│  │  ├── Login / Logout                        │                          │
│  │  ├── Password Reset                        │                          │
│  │  ├── Session Management                    │                          │
│  │  └── User Directory                        │                          │
│  └────────────────────────────────────────────┘                          │
│                                                                            │
│  ┌────────────────────────────────────────────┐                          │
│  │  Catalyst Logs                             │                          │
│  │  ├── Application logs from Functions        │                          │
│  │  └── Access logs from Hosting              │                          │
│  └────────────────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Catalyst Data Store Limitations & Mitigations

| Limitation | Mitigation |
|---|---|
| No native joins | Application-level joins via multiple queries sorted by foreign key |
| No aggregation queries | Aggregation performed in Python after fetching records (acceptable for < 10K records) |
| Maximum row size | Keep evidence metadata lean; store file URLs, not file content |
| No indexing on arbitrary fields | Use application-level sorting/filtering; pre-sort on insert |
| Throttling limits | Cache frequent queries; batch writes where possible |

---

# 8. AUTHENTICATION FLOW

## 8.1 Login Flow

```
┌──────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│  Browser │          │  React   │          │Catalyst  │          │ Catalyst │
│  (User)  │          │  SPA     │          │ Functions│          │   Auth   │
└────┬─────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │                     │
     │  Enter credentials  │                     │                     │
     │────────────────────▶│                     │                     │
     │                     │  POST /auth/login   │                     │
     │                     │  {email, password}  │                     │
     │                     │────────────────────▶│                     │
     │                     │                     │  Catalyst Auth      │
     │                     │                     │  Verify credentials │
     │                     │                     │────────────────────▶│
     │                     │                     │                     │
     │                     │                     │  ◀──────────────────│
     │                     │                     │  {access_token,     │
     │                     │                     │   refresh_token,    │
     │                     │                     │   user_profile}     │
     │                     │                     │                     │
     │                     │  1. Validate token  │                     │
     │                     │  2. Fetch user role │                     │
     │                     │     from Users table│                     │
     │                     │  3. Generate app    │                     │
     │                     │     session JWT     │                     │
     │                     │  4. Log to AuditLog│                     │
     │                     │                     │                     │
     │                     │  ◀──────────────────│                     │
     │                     │  {app_jwt, user,    │                     │
     │                     │   role, permissions}│                     │
     │                     │                     │                     │
     │  Store JWT in       │                     │                     │
     │  memory (var)       │                     │                     │
     │  Redirect to /      │                     │                     │
     │◀────────────────────│                     │                     │
     │                     │                     │                     │
```

## 8.2 Token Validation (Every Request)

```
Request with Authorization: Bearer <app_jwt>
    │
    ▼
Auth Middleware
    │
    ├── Decode JWT (verify signature, expiry)
    │
    ├── Extract: user_id, role, permissions
    │
    ├── Attach to request.state.user
    │
    ├── Check role-required decorator on route
    │   └── If insufficient: 403 Forbidden
    │
    └── Pass to route handler
```

## 8.3 Role-Based Access Control (Route Level)

```python
# Pseudocode decorator pattern
@router.get("/admin/users")
@requires_role(["admin", "super_admin"])
async def list_users(request: Request):
    ...
```

**Frontend enforcement:** `ProtectedRoute` component checks user role before rendering route; unauthorized routes redirect to `/` with a toast message.

---

# 9. MODULE INTERACTION DIAGRAM

```
┌──────────────┐      ┌──────────────┐      ┌────────────────┐
│  AuthModule  │◀────▶│  AuthContext │──────│  All Frontend  │
│  (Login/     │      │  (Provider)  │ uses │  Pages         │
│   Logout)    │      └──────────────┘      └────────────────┘
└──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway (FastAPI)                         │
│                                                                      │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐    │
│  │ Auth    │ │ Case    │ │ Evidence │ │ CRIMA   │ │Analytics │    │
│  │ Router  │ │ Router  │ │ Router   │ │ AI      │ │ Router   │    │
│  │         │ │         │ │          │ │ Router  │ │          │    │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘    │
│       │           │           │            │            │           │
│       ▼           ▼           ▼            ▼            ▼           │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐ │
│  │ AuthSvc │ │ CaseSvc │ │ EvidSvc  │ │ CRIMASvc   │ │Analytics │ │
│  └─────────┘ └─────────┘ └──────────┘ └─────┬──────┘ │ Svc      │ │
│                                              │        └──────────┘ │
│                                              ▼                      │
│                                  ┌─────────────────────┐           │
│                                  │  IntentSvc          │           │
│                                  │  EmbeddingSvc       │           │
│                                  │  FAISSSvc           │           │
│                                  │  ContextSvc         │           │
│                                  └─────────────────────┘           │
│                                              │                      │
│       ┌──────────────────────────────────────┼──────┐              │
│       ▼              ▼              ▼        ▼      ▼              │
│  ┌─────────┐ ┌──────────────┐ ┌──────────────┐  ┌──────────────┐  │
│  │ Catalyst│ │ Catalyst     │ │ Catalyst     │  │ FAISS Index  │  │
│  │ Data    │ │ File Store   │ │ Auth         │  │ (in memory)  │  │
│  │ Store   │ │              │ │              │  │              │  │
│  └─────────┘ └──────────────┘ └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 10. NAVIGATION FLOW

```
┌──────────────┐
│   /login     │
│  (Login Page)│
└──────┬───────┘
       │ Authenticated
       ▼
┌──────────────┐
│      /       │──────────────▶  /crima
│  Dashboard   │──────────────▶  /cases
│              │──────────────▶  /analytics
└──────┬───────┘──────────────▶  /heatmap
       │                        /evidence
       │                        /settings
       │
       │  Role-Based Branches
       │
       ├── Officer/Inspector ──▶  /cases/:id  (view + edit for inspector)
       │
       ├── Admin ───────────────▶  /admin/users
       │                         /admin/audit
       │                         /admin/settings
       │
       ├── Super Admin ─────────▶  All admin routes + all data
       │
       ▼
┌──────────────┐
│   /logout    │
│  (Clear JWT) │
│  Redirect /  │
└──────────────┘
```

**Sidebar Navigation (Role-Filtered):**

| Nav Item | Icon | Officer | Inspector | Admin | Super Admin |
|---|---|---|---|---|---|
| Dashboard | 📊 | ✓ | ✓ | ✓ | ✓ |
| CRIMA AI | 🤖 | ✓ | ✓ | ✓ | ✓ |
| Case Explorer | 📁 | ✓ | ✓ | ✓ | ✓ |
| Evidence | 📎 | ✓ | ✓ | ✓ | ✓ |
| Analytics | 📈 | ✓ | ✓ | ✓ | ✓ |
| Heat Maps | 🗺️ | ✓ | ✓ | ✓ | ✓ |
| Admin Panel | ⚙️ | ✗ | ✗ | ✓ | ✓ |
| Settings | 👤 | ✓ | ✓ | ✓ | ✓ |

---

# 11. DATA FLOW DIAGRAM

## 11.1 Context Diagram (Level 0)

```
┌─────────┐         ┌──────────────────────────────────────┐         ┌─────────┐
│ Officer │◀═══════▶│          CrimeIntel AI               │◀═══════▶│Catalyst │
│         │         │                                      │         │ Cloud   │
└─────────┘         │  ┌────────────────────────────────┐  │         └─────────┘
                    │  │   CrimeIntel AI System          │  │
┌─────────┐         │  │  - Authenticate                │  │
│Inspector│◀═══════▶│  │  - Query Cases (CRIMA AI)      │  │
│         │         │  │  - Browse Cases                 │  │
└─────────┘         │  │  - Manage Evidence             │  │
                    │  │  - View Analytics               │  │
┌─────────┐         │  │  - View Heat Maps              │  │
│  Admin  │◀═══════▶│  │  - Generate Reports            │  │
│         │         │  │  - Manage Users (Admin)         │  │
└─────────┘         │  │  - Audit Logs (Admin)           │  │
                    │  └────────────────────────────────┘  │
                    └──────────────────────────────────────┘
```

## 11.2 Data Flow Diagram (Level 1)

```
                                  ┌───────────────┐
                                  │  User         │
                                  │  Credentials  │
                                  └───────┬───────┘
                                          ▼
┌───────────┐    Login/Logout    ┌──────────────────┐    Auth Request    ┌───────────┐
│  Browser  │◀══════════════════▶│  Auth Router     │◀══════════════════▶│ Catalyst  │
│  (React)  │                   └──────────────────┘                    │   Auth    │
│           │                   ┌──────────────────┐    Query           └───────────┘
│           │◀══════════════════▶│  CRIMA AI Router │◀══════════════════▶┌───────────┐
│           │  CRIMA Query/Resp  └──────────────────┘   Embed + Search  │Sentence   │
│           │                   ┌──────────────────┐                    │Transform  │
│           │◀══════════════════▶│  Case Router     │◀══════════════════▶├───────────┤
│           │  Case CRUD        └──────────────────┘                    │  FAISS    │
│           │                   ┌──────────────────┐                    └───────────┘
│           │◀══════════════════▶│ Evidence Router  │◀══════════════════▶┌───────────┐
│           │  File Upload/View └──────────────────┘   Store/Retrieve   │ Catalyst  │
│           │                   ┌──────────────────┐                    │ FileStore │
│           │◀══════════════════▶│ Analytics Router │◀══════════════════▶└───────────┘
│           │  Chart Data       └──────────────────┘                    ┌───────────┐
│           │                   ┌──────────────────┐                    │ Catalyst  │
│           │◀══════════════════▶│  Admin Router    │◀══════════════════▶│ DataStore │
│           │  User/Config/Logs └──────────────────┘                    └───────────┘
└───────────┘
```

---

# 12. SEQUENCE DIAGRAMS

## 12.1 Login Sequence

```
User          Browser              AuthContext          FastAPI              Catalyst Auth     Catalyst DataStore
 │              │                     │                   │                     │                    │
 │  Enter creds  │                     │                   │                     │                    │
 │─────────────▶│                     │                   │                     │                    │
 │              │  POST /auth/login   │                   │                     │                    │
 │              │  {email, password}  │                   │                     │                    │
 │              │─────────────────────│──────────────────▶│                     │                    │
 │              │                     │                   │  Verify creds       │                    │
 │              │                     │                   │────────────────────▶│                    │
 │              │                     │                   │                     │                    │
 │              │                     │                   │  ◀─────────────────│                    │
 │              │                     │                   │  {token, profile}   │                    │
 │              │                     │                   │                     │                    │
 │              │                     │                   │  Query user role    │                    │
 │              │                     │                   │───────────────────────────────────────────▶│
 │              │                     │                   │                     │                    │
 │              │                     │                   │  ◀─────────────────────────────────────────│
 │              │                     │                   │  {role, badge_no}   │                    │
 │              │                     │                   │                     │                    │
 │              │                     │                   │  Generate app JWT   │                    │
 │              │                     │                   │  Log to audit       │                    │
 │              │                     │                   │                     │                    │
 │              │                     │  ◀───────────────│                     │                    │
 │              │                     │  {jwt, user, role}│                     │                    │
 │              │                     │                     │                     │                    │
 │              │  Store JWT          │                     │                     │                    │
 │              │  Update AuthContext  │                     │                     │                    │
 │              │◀────────────────────│                     │                     │                    │
 │              │                     │                     │                     │                    │
 │  Show Dashboard                    │                     │                     │                    │
 │◀──────────────────────────────────│                     │                     │                    │
```

## 12.2 Search Case Sequence

```
User          Browser              FastAPI              Catalyst DataStore
 │              │                     │                     │
 │  Search "chain snatching"          │                     │
 │─────────────▶│                     │                     │
 │              │  GET /cases/search  │                     │
 │              │  ?q=chain+snatching │                     │
 │              │  &page=1&limit=20   │                     │
 │              │────────────────────▶│                     │
 │              │                     │                     │
 │              │                     │  Validate auth      │
 │              │                     │  Parse query params │
 │              │                     │  Query DataStore    │
 │              │                     │   (filter by crime  │
 │              │                     │    type, location,  │
 │              │                     │    date range)      │
 │              │                     │────────────────────▶│
 │              │                     │                     │
 │              │                     │  ◀──────────────────│
 │              │                     │  Matching cases[]   │
 │              │                     │                     │
 │              │                     │  Apply role filter  │
 │              │                     │  Format response    │
 │              │                     │                     │
 │              │  ◀──────────────────│                     │
 │              │  {cases, total,     │                     │
 │              │   page, pages}      │                     │
 │              │                     │                     │
 │  Show case list                    │                     │
 │◀─────────────│                     │                     │
```

## 12.3 Chat with CRIMA AI Sequence

```
User          Browser              FastAPI              IntentSvc     EmbedSvc     FAISSSvc     DataStore
 │              │                     │                   │             │            │             │
 │  "Find theft  │                     │                   │             │            │             │
 │   cases near  │                     │                   │             │            │             │
 │   Majestic"   │                     │                   │             │            │             │
 │─────────────▶│                     │                   │             │            │             │
 │              │  POST /crima/query  │                   │             │            │             │
 │              │  {text, context[]}  │                   │             │            │             │
 │              │────────────────────▶│                   │             │            │             │
 │              │                     │  Classify intent  │             │            │             │
 │              │                     │──────────────────▶│             │            │             │
 │              │                     │  ◀────────────────│             │            │             │
 │              │                     │  {intent, entities}             │            │             │
 │              │                     │                   │             │            │             │
 │              │                     │  For search intent:             │            │             │
 │              │                     │  Generate embedding│            │            │             │
 │              │                     │────────────────────────────────▶│            │             │
 │              │                     │                   │             │            │             │
 │              │                     │  ◀────────────────────────────────│            │             │
 │              │                     │  {vector: [384]}  │             │            │             │
 │              │                     │                   │             │            │             │
 │              │                     │  Search FAISS     │             │            │             │
 │              │                     │───────────────────────────────────────────────▶│             │
 │              │                     │                   │             │            │             │
 │              │                     │  ◀───────────────────────────────────────────────│             │
 │              │                     │  {indices, scores}│             │            │             │
 │              │                     │                   │             │            │             │
 │              │                     │  Fetch case data  │             │            │             │
 │              │                     │  for top-k results│             │            │             │
 │              │                     │──────────────────────────────────────────────────────────────▶│
 │              │                     │                   │             │            │             │
 │              │                     │  ◀────────────────────────────────────────────────────────────│
 │              │                     │  {cases[]}       │             │            │             │
 │              │                     │                   │             │            │             │
 │              │                     │  Build response   │             │            │             │
 │              │                     │  Update context   │             │            │             │
 │              │                     │                   │             │            │             │
 │              │  ◀──────────────────│                   │             │            │             │
 │              │  {response,         │                   │             │            │             │
 │              │   cases[],          │                   │             │            │             │
 │              │   confidence,       │                   │             │            │             │
 │              │   sources[]}        │                   │             │            │             │
 │              │                     │                   │             │            │             │
 │  Show chat    │                     │                   │             │            │             │
 │  message +    │                     │                   │             │            │             │
 │  case cards   │                     │                   │             │            │             │
 │◀─────────────│                     │                   │             │            │             │
```

## 12.4 Generate Report Sequence

```
User          Browser              FastAPI              ReportSvc      DataStore
 │              │                     │                   │              │
 │  Request report                    │                   │              │
 │  for case X                        │                   │              │
 │─────────────▶│                     │                   │              │
 │              │  GET /reports/case  │                   │              │
 │              │  ?case_id=FIR-123   │                   │              │
 │              │────────────────────▶│                   │              │
 │              │                     │  Validate auth    │              │
 │              │                     │  Check case access│              │
 │              │                     │──────────────────────────────────▶│
 │              │                     │                   │              │
 │              │                     │  Fetch all case   │              │
 │              │                     │  data (FIR,       │              │
 │              │                     │  suspects,        │              │
 │              │                     │  witnesses,       │              │
 │              │                     │  evidence,        │              │
 │              │                     │  timeline)        │              │
 │              │                     │──────────────────────────────────▶│
 │              │                     │                   │              │
 │              │                     │  ◀────────────────────────────────│
 │              │                     │  {full case data} │              │
 │              │                     │                   │              │
 │              │                     │  Build report     │              │
 │              │                     │  Generate PDF     │              │
 │              │                     │  (or structured   │              │
 │              │                     │   JSON)           │              │
 │              │                     │                   │              │
 │              │  ◀──────────────────│                   │              │
 │              │  {report_data}      │                   │              │
 │              │                     │                   │              │
 │  Show report                       │                   │              │
 │  (printable view)                  │                   │              │
 │◀─────────────│                     │                   │              │
```

## 12.5 View Analytics Sequence

```
User          Browser              FastAPI              AnalyticsSvc     DataStore
 │              │                     │                   │               │
 │  Open Analytics                    │                   │               │
 │  Dashboard                         │                   │               │
 │─────────────▶│                     │                   │               │
 │              │  GET /analytics/    │                   │               │
 │              │  overview?from=     │                   │               │
 │              │  2025-01&to=2025-12 │                   │               │
 │              │────────────────────▶│                   │               │
 │              │                     │  Validate auth    │               │
 │              │                     │  Parse date range │               │
 │              │                     │──────────────────▶│               │
 │              │                     │  Compute:         │               │
 │              │                     │  - Total cases    │               │
 │              │                     │  - Open/closed    │               │
 │              │                     │  - Clearance rate │               │
 │              │                     │──────────────────────────────────▶│
 │              │                     │                   │   Query all   │
 │              │                     │                   │   cases in    │
 │              │                     │                   │   date range  │
 │              │                     │  ◀────────────────────────────────│
 │              │                     │  {cases[]}       │               │
 │              │                     │                   │               │
 │              │                     │  Compute KPIs     │               │
 │              │                     │  Build:           │               │
 │              │                     │  - Pie chart data │               │
 │              │                     │  - Trend line     │               │
 │              │                     │  - Bar chart      │               │
 │              │                     │  - KPI cards      │               │
 │              │                     │                   │               │
 │              │  ◀──────────────────│                   │               │
 │              │  {kpis, distribution, trends,          │               │
 │              │   by_district}                           │               │
 │              │                     │                   │               │
 │  Render charts                     │                   │               │
 │◀─────────────│                     │                   │               │
```

---

# 13. COMPONENT RESPONSIBILITIES

## 13.1 Authentication

| Responsibility | Description |
|---|---|
| User Login | Accept credentials, verify via Catalyst Auth, issue JWT |
| User Logout | Invalidate session, clear token |
| Password Reset | Initiate Catalyst Auth password reset flow |
| Session Validation | Verify JWT on every request; reject expired tokens |
| Role Extraction | Map Catalyst Auth user to application role (Officer/Inspector/Admin/Super Admin) |
| First-Login Setup | Create user record in Users table on first login |

## 13.2 Dashboard

| Responsibility | Description |
|---|---|
| KPI Aggregation | Fetch and display total cases, open cases, clearance rate |
| Recent Cases | Fetch last 10 updated cases for quick access |
| Quick Actions | Provide navigation shortcuts to key modules |
| Role-Adaptive View | Show/hide widgets based on user role |
| Auto-Refresh | Poll backend every 60 seconds for updated KPI values |

## 13.3 Case Explorer

| Responsibility | Description |
|---|---|
| Case Listing | Paginated, filterable list of all cases |
| Case Search | Full-text and field-specific search (case ID, suspect, FIR number) |
| Case Detail | Comprehensive view of FIR, suspects, witnesses, evidence, timeline |
| Case CRUD | Create, update, close cases (role-permission dependent) |
| Case Timeline | Chronological display of case events |
| Related Cases | Show cross-referenced cases based on shared suspects or MO |

## 13.4 Evidence

| Responsibility | Description |
|---|---|
| File Upload | Upload evidence files to Catalyst File Store |
| File Validation | Check file type, size, virus scan (future) |
| Evidence Gallery | Grid/thumbnail view of evidence for a case |
| Evidence Metadata | Store and display file name, type, size, uploader, date |
| Evidence Search | Search evidence by name, type, case ID |
| Sensitive Flag | Mark evidence as sensitive (Inspector+ only to view) |

## 13.5 Reports

| Responsibility | Description |
|---|---|
| Case Report | Generate structured report for a single case |
| Summary Report | Generate crime summary for a date range / district |
| Report Export | Export as structured JSON/HTML (PDF in future) |

## 13.6 Analytics

| Responsibility | Description |
|---|---|
| KPI Computation | Calculate total, open, closed, clearance rate from case data |
| Crime Distribution | Group cases by crime type for pie chart |
| Monthly Trends | Aggregate cases by month for trend line |
| District Distribution | Group cases by district for bar chart |
| Status Breakdown | Count cases by status (Open, Investigation, Closed, Filed) |
| Filtering | Apply date range, crime type, and district filters to all analytics |

## 13.7 CRIMA AI

| Responsibility | Description |
|---|---|
| Query Reception | Accept natural language query from user |
| Intent Classification | Determine user intent (search, detail, summarize, etc.) |
| Entity Extraction | Identify case IDs, names, locations, dates, crime types from query |
| Context Management | Maintain conversation context across turns |
| Semantic Embedding | Generate query embedding via Sentence Transformer |
| Vector Search | Search FAISS index for semantically similar cases |
| Result Fusion | Merge structured query results with semantic search results |
| Response Generation | Build natural language response using templates |
| Confidence Scoring | Calculate and display confidence for each result |
| Source Citation | Include clickable case ID references in every response |
| Low-Confidence Handling | Flag results below 60% confidence explicitly |

## 13.8 Administration

| Responsibility | Description |
|---|---|
| User CRUD | Create, read, update, disable user accounts |
| Role Assignment | Assign Officer, Inspector, Admin, Super Admin roles |
| Audit Log Viewing | Searchable log of all user actions |
| System Configuration | Manage session timeout, password policy, upload limits |
| User Status | Track active/inactive/disabled user status |

## 13.9 Settings

| Responsibility | Description |
|---|---|
| Profile Management | Edit display name, phone, badge number, profile photo |
| Password Change | Change password with current password verification |
| Notification Preferences | Configure email/in-app notification toggles |

## 13.10 Notifications

| Responsibility | Description |
|---|---|
| Notification Creation | Create notification records on case assignment, status change, evidence upload |
| Notification Delivery | In-app notification bell with unread badge |
| Mark Read | Individual and bulk mark-as-read |
| Auto-Cleanup | Delete notifications older than 30 days |

---

# 14. DATABASE DESIGN

## 14.1 Entity List

| Entity | Table Name | Description | Data Volume (MVP) |
|---|---|---|---|
| User | `Users` | System users with profile and role | 10–50 |
| Case | `Cases` | Criminal case records (FIR data) | 500–2,000 |
| Suspect | `Suspects` | Suspects linked to cases | 1,000–4,000 |
| Witness | `Witnesses` | Witnesses linked to cases | 1,000–4,000 |
| Evidence Metadata | `Evidence_Metadata` | File metadata for uploaded evidence | 2,000–5,000 |
| Case Timeline | `Case_Timeline` | Chronological events per case | 2,000–10,000 |
| Notification | `Notifications` | In-app notifications per user | 500–2,000 |
| Audit Log | `Audit_Logs` | User action audit trail | 5,000–20,000 |
| FAISS Index Meta | `FAISS_Index_Meta` | FAISS index version tracking | 10–50 (versions) |
| Embedding Cache | `Embedding_Cache` | Case embeddings for FAISS rebuild | 500–2,000 |

## 14.2 Data Dictionary

### Users

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| USER_ID | String (UUID) | 36 | Y | Primary key |
| DISPLAY_NAME | String | 100 | Y | Full name |
| EMAIL | String | 200 | Y | Login ID (from Catalyst Auth) |
| ROLE | Enum | — | Y | officer / inspector / admin / super_admin |
| BADGE_NUMBER | String | 50 | N | KSP badge number |
| PHONE | String | 20 | N | Contact number |
| PHOTO_URL | String | 500 | N | Profile photo URL |
| STATUS | Enum | — | Y | active / inactive / disabled |
| CREATED_AT | DateTime | — | Y | Auto-generated |
| UPDATED_AT | DateTime | — | Y | Auto-generated |

### Cases

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| CASE_ID | String | 50 | Y | Primary key (format: FIR-YYYY-NNNNNN) |
| FIR_NUMBER | String | 50 | Y | Original FIR number |
| CRIME_TYPE | Enum | — | Y | theft / assault / murder / robbery / cybercrime / etc. |
| STATUS | Enum | — | Y | open / under_investigation / closed / filed |
| DATE_FILED | Date | — | Y | Date FIR was registered |
| DATE_CLOSED | Date | — | N | Date case was closed |
| LOCATION | String | 200 | Y | Crime location description |
| LATITUDE | Float | — | N | Geolocation lat |
| LONGITUDE | Float | — | N | Geolocation lng |
| DISTRICT | String | 100 | Y | District name |
| DESCRIPTION | Text | 5000 | Y | Case description / FIR text |
| OFFICER_ID | String | 36 | Y | FK → Users.USER_ID (investigating officer) |
| PRIORITY | Enum | — | N | low / medium / high / critical |
| EMBEDDING | String (JSON) | — | N | Serialized 384-dim vector |
| CREATED_AT | DateTime | — | Y | Auto-generated |
| UPDATED_AT | DateTime | — | Y | Auto-generated |

### Suspects

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| SUSPECT_ID | String (UUID) | 36 | Y | Primary key |
| CASE_ID | String | 50 | Y | FK → Cases.CASE_ID |
| NAME | String | 150 | Y | Full name |
| ALIAS | String | 150 | N | Known aliases / nicknames |
| PHOTO_URL | String | 500 | N | Suspect photo |
| AGE | Integer | — | N | Age at time of crime |
| GENDER | Enum | — | N | male / female / other |
| ADDRESS | String | 500 | N | Residential address |
| IDENTIFICATION_MARKS | String | 500 | N | Distinguishing features |
| KNOWN_ASSOCIATES | String (JSON) | 2000 | N | Array of known associate names |
| CRIMINAL_HISTORY | String | 2000 | N | Prior record summary |
| STATUS | Enum | — | Y | wanted / arrested / released / convicted |

### Witnesses

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| WITNESS_ID | String (UUID) | 36 | Y | Primary key |
| CASE_ID | String | 50 | Y | FK → Cases.CASE_ID |
| NAME | String | 150 | Y | Full name |
| CONTACT | String | 100 | N | Phone or email |
| STATEMENT_SUMMARY | Text | 2000 | N | Key points from witness statement |
| CREDIBILITY_SCORE | Float | — | N | 0.0 – 1.0 (officer-assigned) |
| STATUS | Enum | — | Y | pending / recorded / verified |

### Evidence Metadata

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| EVIDENCE_ID | String (UUID) | 36 | Y | Primary key |
| CASE_ID | String | 50 | Y | FK → Cases.CASE_ID |
| FILE_NAME | String | 255 | Y | Original file name |
| FILE_TYPE | Enum | — | Y | pdf / jpeg / png / mp4 |
| FILE_SIZE | Integer | — | Y | Size in bytes |
| FILE_URL | String | 1000 | Y | Catalyst File Store URL |
| DESCRIPTION | String | 500 | N | Evidence description |
| SENSITIVE | Boolean | — | N | Flag for restricted access |
| UPLOADED_BY | String | 36 | Y | FK → Users.USER_ID |
| UPLOADED_AT | DateTime | — | Y | Auto-generated |

### Case Timeline

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| EVENT_ID | String (UUID) | 36 | Y | Primary key |
| CASE_ID | String | 50 | Y | FK → Cases.CASE_ID |
| EVENT_DATE | DateTime | — | Y | Date/time of event |
| EVENT_TYPE | Enum | — | Y | fir_registered / suspect_identified / evidence_collected / witness_recorded / arrest_made / charge_sheet_filed / status_change / case_closed |
| DESCRIPTION | String | 2000 | Y | Event description |
| OFFICER_ID | String | 36 | N | FK → Users.USER_ID |

### Notifications

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| NOTIFICATION_ID | String (UUID) | 36 | Y | Primary key |
| USER_ID | String | 36 | Y | FK → Users.USER_ID |
| TYPE | Enum | — | Y | case_assigned / status_change / evidence_uploaded / system_announcement |
| MESSAGE | String | 500 | Y | Notification text |
| LINK | String | 500 | N | Deep link to relevant module |
| READ | Boolean | — | N | Read/unread flag |
| CREATED_AT | DateTime | — | Y | Auto-generated |

### Audit Logs

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| LOG_ID | String (UUID) | 36 | Y | Primary key |
| USER_ID | String | 36 | Y | FK → Users.USER_ID |
| ACTION | String | 100 | Y | Action performed (e.g., case_view, case_update, evidence_upload, login, logout) |
| MODULE | String | 50 | Y | Module name (cases, evidence, admin, etc.) |
| DETAILS | String (JSON) | 2000 | N | Additional context (case ID, etc.) |
| IP_ADDRESS | String | 45 | N | Client IP |
| TIMESTAMP | DateTime | — | Y | Action timestamp |

### FAISS Index Meta

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| VERSION_ID | String (UUID) | 36 | Y | Primary key |
| VERSION | Integer | — | Y | Monotonic version number |
| VECTOR_COUNT | Integer | — | Y | Number of vectors in index |
| INDEX_FILE_URL | String | 1000 | Y | FAISS index file URL |
| MAPPING_FILE_URL | String | 1000 | Y | ID mapping JSON file URL |
| STATUS | Enum | — | Y | building / ready / failed |
| CREATED_AT | DateTime | — | Y | Auto-generated |

### Embedding Cache

| Field | Type | Length | Required | Description |
|---|---|---|---|---|
| CACHE_ID | String (UUID) | 36 | Y | Primary key |
| CASE_ID | String | 50 | Y | FK → Cases.CASE_ID |
| EMBEDDING | String (JSON) | — | Y | Serialized 384-dim vector |
| MODEL_VERSION | String | 50 | Y | all-MiniLM-L6-v2 |
| GENERATED_AT | DateTime | — | Y | Auto-generated |

## 14.3 Entity Relationships

```
┌─────────┐      1:N      ┌──────────┐
│  Users  │◀──────────────│  Cases   │
│         │               │          │
│ USER_ID │──┐            │ CASE_ID  │──┐
└─────────┘  │            └──────────┘  │
             │                 │         │
             │ 1:N           1:N        │ 1:N
             │                 │         │
             ▼                 ▼         ▼
      ┌───────────┐    ┌──────────┐   ┌────────────────┐
      │Audit_Logs │    │ Suspects │   │Evidence_Metadata│
      └───────────┘    └──────────┘   └────────────────┘
                             │
                           1:N
                             │
                             ▼
                      ┌──────────┐
                      │Witnesses │
                      └──────────┘

┌─────────┐      1:N      ┌──────────┐
│  Users  │◀──────────────│ Notif.   │
└─────────┘               └──────────┘

┌─────────┐      1:N      ┌──────────────┐
│  Cases  │◀──────────────│ Case_Timeline│
└─────────┘               └──────────────┘

┌─────────┐      1:1      ┌──────────────────┐
│  Cases  │◀──────────────│ Embedding_Cache  │
└─────────┘               └──────────────────┘
```

## 14.4 Data Ownership

| Entity | Created By | Owned By | Can Delete |
|---|---|---|---|
| Users | Admin | System | Admin |
| Cases | Inspector/Officer | Investigating Officer | Admin |
| Suspects | Inspector/Officer | Case Owner | Inspector+ |
| Witnesses | Inspector/Officer | Case Owner | Inspector+ |
| Evidence | Officer+ | Uploader / Case Owner | Inspector+ |
| Case Timeline | System (auto) | Case | System |
| Notifications | System (auto) | Recipient User | System (after 30d) |
| Audit Logs | System (auto) | System | None (append-only) |
| FAISS Index | Indexer Job | System | System |

---

# 15. API DESIGN

## 15.1 Base Conventions

| Convention | Standard |
|---|---|
| Base URL | `/api/v1` |
| Protocol | HTTPS |
| Content-Type | `application/json` |
| Auth Header | `Authorization: Bearer <jwt>` |
| Pagination | `?page=1&limit=20` → response includes `{ data[], total, page, pages }` |
| Error Format | `{ "detail": "message", "code": "ERROR_CODE" }` |
| Success Format | `{ "data": {...}, "message": "ok" }` |

## 15.2 API Endpoint Catalog

### Authentication APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | No | All | Login with email/password |
| POST | `/api/v1/auth/logout` | Yes | All | Logout current session |
| POST | `/api/v1/auth/reset-password` | No | All | Request password reset |
| GET | `/api/v1/auth/me` | Yes | All | Get current user profile + role |
| PUT | `/api/v1/auth/change-password` | Yes | All | Change password (requires current password) |

### Case APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/cases` | Yes | All | List cases (paginated, filterable) |
| GET | `/api/v1/cases/search` | Yes | All | Full-text search cases |
| GET | `/api/v1/cases/{case_id}` | Yes | All | Get case detail |
| POST | `/api/v1/cases` | Yes | Inspector+ | Create new case |
| PUT | `/api/v1/cases/{case_id}` | Yes | Inspector+ | Update case |
| DELETE | `/api/v1/cases/{case_id}` | Yes | Admin+ | Soft-delete case |
| GET | `/api/v1/cases/{case_id}/timeline` | Yes | All | Get case timeline |
| POST | `/api/v1/cases/{case_id}/timeline` | Yes | Inspector+ | Add timeline event |
| GET | `/api/v1/cases/{case_id}/related` | Yes | All | Get related cases |

### Suspect APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/suspects` | Yes | All | Search suspects |
| GET | `/api/v1/suspects/{suspect_id}` | Yes | All | Get suspect detail |
| POST | `/api/v1/cases/{case_id}/suspects` | Yes | Inspector+ | Add suspect to case |
| PUT | `/api/v1/suspects/{suspect_id}` | Yes | Inspector+ | Update suspect |
| DELETE | `/api/v1/suspects/{suspect_id}` | Yes | Admin+ | Remove suspect |

### Evidence APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/evidence/case/{case_id}` | Yes | All | List evidence for case |
| GET | `/api/v1/evidence/{evidence_id}` | Yes | All | Get evidence metadata + download URL |
| POST | `/api/v1/evidence` | Yes | Officer+ | Upload evidence file |
| DELETE | `/api/v1/evidence/{evidence_id}` | Yes | Inspector+ | Delete evidence |

### CRIMA AI APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/api/v1/crima/query` | Yes | All | Send natural language query to CRIMA AI |
| GET | `/api/v1/crima/history` | Yes | All | Get current session chat history |
| DELETE | `/api/v1/crima/history` | Yes | All | Clear current session history |

### Analytics APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/analytics/overview` | Yes | All | KPI cards (total, open, closed, clearance rate) |
| GET | `/api/v1/analytics/distribution` | Yes | All | Crime type distribution data |
| GET | `/api/v1/analytics/trends` | Yes | All | Monthly case trend data |
| GET | `/api/v1/analytics/by-district` | Yes | All | Cases grouped by district |
| GET | `/api/v1/analytics/clearance` | Yes | All | Clearance rate breakdown |
| GET | `/api/v1/analytics/by-officer` | Yes | All | Cases grouped by officer (Admin+) |

### Heat Map APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/heatmap/data` | Yes | All | GeoJSON points for heat map |

### Report APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/reports/case/{case_id}` | Yes | All | Generate case report |
| GET | `/api/v1/reports/summary` | Yes | All | Generate period summary report |

### Admin APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/admin/users` | Yes | Admin+ | List all users |
| POST | `/api/v1/admin/users` | Yes | Admin+ | Create new user |
| PUT | `/api/v1/admin/users/{user_id}` | Yes | Admin+ | Update user |
| DELETE | `/api/v1/admin/users/{user_id}` | Yes | Super Admin | Disable user |
| GET | `/api/v1/admin/audit-logs` | Yes | Admin+ | Search audit logs |
| GET | `/api/v1/admin/settings` | Yes | Admin+ | Get system configuration |
| PUT | `/api/v1/admin/settings` | Yes | Admin+ | Update system configuration |

### Notification APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/notifications` | Yes | All | Get user notifications |
| PUT | `/api/v1/notifications/{notif_id}/read` | Yes | All | Mark notification as read |
| PUT | `/api/v1/notifications/read-all` | Yes | All | Mark all notifications as read |

### Settings APIs

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/settings/profile` | Yes | All | Get user profile |
| PUT | `/api/v1/settings/profile` | Yes | All | Update user profile |
| GET | `/api/v1/settings/preferences` | Yes | All | Get notification preferences |
| PUT | `/api/v1/settings/preferences` | Yes | All | Update notification preferences |

## 15.3 API Validation Rules

| Field | Rule |
|---|---|
| Email | Valid email format, max 200 chars |
| Password | Min 8 chars: 1 uppercase, 1 lowercase, 1 digit, 1 special |
| Case ID | Format: `FIR-{YYYY}-{6-digit}` |
| Latitude | Range: -90 to 90 |
| Longitude | Range: -180 to 180 |
| File Upload | Max 25 MB; types: PDF, JPEG, PNG, MP4 |
| Pagination | page ≥ 1, limit between 1–100 |
| Date Range | from ≤ to; max range 365 days |

## 15.4 HTTP Status Codes

| Code | Usage |
|---|---|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 413 | Payload Too Large (file size) |
| 422 | Unprocessable Entity (Pydantic validation) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

# 16. SECURITY DESIGN

## 16.1 Authentication

| Mechanism | Implementation |
|---|---|
| Identity Provider | Zoho Catalyst Authentication |
| Token Format | JWT (signed with Catalyst secret) |
| Token Storage | In-memory (frontend) — not localStorage or sessionStorage |
| Token Expiry | 60 minutes |
| Refresh Token | Not implemented for MVP (acceptable for demo) |
| Password Policy | Min 8 chars, uppercase + lowercase + digit + special |

## 16.2 Authorization (RBAC)

**Four roles defined:**

| Role | Level | Description |
|---|---|---|
| Officer | 1 | View cases, upload evidence, use CRIMA AI |
| Inspector | 2 | Officer + edit cases, manage suspects/witnesses, delete evidence |
| Admin | 3 | Inspector + user management, audit logs, system config |
| Super Admin | 4 | Full system access, delete users, all data |

**Enforcement Points:**

1. **Frontend:** `ProtectedRoute` component checks role before rendering route
2. **Backend:** `@requires_role([...])` decorator on every endpoint
3. **Data:** Service layer filters results based on user role (e.g., sensitive evidence hidden from Officer)

## 16.3 Session Management

| Aspect | Approach |
|---|---|
| Session Start | On login — JWT issued and stored in memory |
| Session Continuation | JWT sent in `Authorization: Bearer` header on every request |
| Session End | On logout — JWT discarded; no server-side session to invalidate (MVP) |
| Inactivity Timeout | 60 minutes; frontend monitors activity, prompts re-login |
| Concurrent Sessions | No restriction for MVP |

## 16.4 Input Validation

| Layer | Validation |
|---|---|
| Frontend | React Hook Form client-side validation (immediate feedback) |
| Backend | Pydantic models with strict type checking and custom validators |
| API | FastAPI's built-in request validation |
| Database | Catalyst Data Store schema validation (string lengths, enums) |
| File Upload | Check MIME type, file extension, file size before processing |

## 16.5 Output Security

| Measure | Implementation |
|---|---|
| XSS Prevention | React's auto-escaping; Content Security Policy headers |
| CORS | Restricted to known origins (React SPA domain) |
| Rate Limiting | 100 requests/min/user; 429 response on exceed |
| Error Messages | No stack traces in production error responses |

## 16.6 Audit Logging

Every significant user action is logged to the `Audit_Logs` table:

| Action Type | Logged Data |
|---|---|
| Login / Logout | user_id, action, IP, timestamp |
| Case View / Search | user_id, action, case_id(s), module |
| Case Create / Update | user_id, action, case_id, changed fields |
| Evidence Upload / Delete | user_id, action, evidence_id, case_id, file_name |
| CRIMA AI Query | user_id, action, query_text, result_count |
| User Management | admin_user_id, action, target_user_id, role_change |
| Settings Change | user_id, action, changed fields |

---

# 17. ERROR HANDLING STRATEGY

## 17.1 Error Classification

| Category | HTTP Code | Example | User Message |
|---|---|---|---|
| Validation | 400 / 422 | Invalid email format | "Please enter a valid email address." |
| Authentication | 401 | Expired token | "Your session has expired. Please log in again." |
| Authorization | 403 | Insufficient role | "You do not have permission to perform this action." |
| Not Found | 404 | Case ID doesn't exist | "Case FIR-2024-999 not found." |
| Conflict | 409 | Duplicate FIR number | "A case with this FIR number already exists." |
| Rate Limit | 429 | Too many requests | "Too many requests. Please wait before trying again." |
| Server Error | 500 | Unexpected exception | "Something went wrong. Please try again or contact support." |

## 17.2 Frontend Error Handling

```
Error Boundary (per page)
    │
    ├── Catch render errors
    │   └── Show fallback UI with "Retry" button
    │
    ├── API Error Interceptor (Axios)
    │   ├── 401 → Clear auth, redirect to /login
    │   ├── 403 → Show "Access Denied" toast
    │   ├── 404 → Show "Not Found" inline message
    │   ├── 429 → Show "Rate Limited" toast with retry-after
    │   └── 500 → Show "Server Error" toast with auto-retry (3 attempts)
    │
    └── Network Error
        └── Show "Connection Lost" banner with reconnect button
```

## 17.3 Backend Error Handling

```
Global Exception Handler (FastAPI)
    │
    ├── HTTPException → Return structured JSON error
    │
    ├── ValidationError → Return 422 with field-level errors
    │   { "detail": [ { "loc": ["body", "email"], "msg": "field required" } ] }
    │
    ├── Catalyst API Error → Catch and wrap with 502
    │   { "detail": "Database service unavailable", "code": "CATALYST_ERROR" }
    │
    └── Unhandled Exception → Log full trace, return 500
        { "detail": "Internal server error" }
```

---

# 18. LOGGING STRATEGY

## 18.1 Log Levels

| Level | Usage |
|---|---|
| ERROR | Unhandled exceptions, Catalyst API failures, authentication failures |
| WARNING | Rate limit threshold, low confidence AI responses, deprecated API usage |
| INFO | User actions (login, logout, case create, evidence upload, CRIMA query) |
| DEBUG | Request/response payloads, AI pipeline timings (development only) |

## 18.2 Log Format (Structured JSON)

```json
{
  "timestamp": "2026-07-26T10:30:00Z",
  "level": "INFO",
  "module": "crima_service",
  "action": "crima_query",
  "user_id": "usr_abc123",
  "request_id": "req_xyz789",
  "duration_ms": 342,
  "metadata": {
    "query_length": 45,
    "intent": "case_search",
    "result_count": 5,
    "confidence_avg": 0.87
  }
}
```

## 18.3 Log Storage

| Log Type | Storage | Retention |
|---|---|---|
| Application Logs | Catalyst Logs (auto) | 30 days |
| Audit Logs (user actions) | Audit_Logs table (Data Store) | Permanent (MVP) |
| Error Logs | Catalyst Logs + log file in File Store | 90 days |

---

# 19. PERFORMANCE CONSIDERATIONS

## 19.1 Performance Budget

| Operation | Budget | Measurement |
|---|---|---|
| API response (p95) | 2 seconds | End-to-end (Catalyst Function → Data Store → Response) |
| CRIMA AI query | 3 seconds | Includes embedding + FAISS + DB fetch |
| Embedding generation | 200ms | Per query (CPU, all-MiniLM-L6-v2) |
| FAISS search (10K) | 10ms | CPU, IndexFlatL2 |
| Page load (initial) | 4 seconds | React SPA first load (with lazy routes) |
| Page load (subsequent) | 1 second | After initial chunk cached |
| File upload (5MB) | 10 seconds | Catalyst File Store upload time |

## 19.2 Optimization Strategies

| Strategy | Application | Expected Gain |
|---|---|---|
| Lazy route loading | Frontend: `React.lazy()` per route | 60% reduction in initial bundle size |
| FAISS in-memory cache | Backend: Load index at cold start, keep in memory | Eliminates 500ms+ file read per query |
| Embedding caching | Backend: Cache case embeddings in Data Store | Avoids re-embedding on index rebuild |
| Pagination limits | API: Default 20, max 100 per page | Prevents large data transfer |
| Debounced search | Frontend: 300ms debounce on search input | Reduces API calls by 70% during typing |
| Connection pooling | Backend: Reuse Catalyst SDK connections | Reduces handshake overhead |
| Minimal payloads | API: Return only requested fields | 40% reduction in response size |

## 19.3 Catalyst Function Cold Start

| Factor | Impact | Mitigation |
|---|---|---|
| Model loading (80MB) | 3–8 seconds cold start | Keep function warm (ping every 5 min); lazy load model on first request |
| FAISS index loading | 0.5–1 second | Load with model; keep in global scope |
| No external DB connection pool | Minimal impact | Catalyst Data Store is HTTP-based; no persistent connection needed |

---

# 20. SCALABILITY CONSIDERATIONS

| Dimension | MVP Scale | Projected Growth | Strategy |
|---|---|---|---|
| Data Volume | 2,000 cases | 100,000 / year | Optimize queries; add pagination; consider pre-aggregation for analytics |
| Users | 50 | 5,000 | Catalyst Auth scales horizontally |
| Concurrent Users | 10–20 | 500 | Catalyst Functions auto-scale; rate limiting protects backend |
| File Storage | 5,000 files | 500,000 | Catalyst File Store auto-scales; folder partitioning by case |
| FAISS Index | 10K vectors | 500K vectors | Switch from IndexFlatL2 to IndexIVFFlat (approximate) for sub-linear search |
| Embedding Computation | 10 req/min | 100 req/min | Queue-based processing; batch embedding generation |

---

# 21. FOLDER STRUCTURE

## 21.1 Frontend

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── manifest.json
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Router + Layout + Providers
│   ├── vite-env.d.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/                 # Shared UI components
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Pagination.tsx
│   │   ├── charts/
│   │   │   ├── PieChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   └── BarChart.tsx
│   │   ├── map/
│   │   │   ├── HeatMap.tsx
│   │   │   └── MapControls.tsx
│   │   ├── crima/
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── SourceReference.tsx
│   │   └── auth/
│   │       └── ProtectedRoute.tsx
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CRIMAIChatPage.tsx
│   │   ├── CaseListPage.tsx
│   │   ├── CaseDetailPage.tsx
│   │   ├── EvidencePage.tsx
│   │   ├── EvidenceGalleryPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── HeatMapPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   ├── AdminAuditPage.tsx
│   │   ├── AdminSettingsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCases.ts
│   │   ├── useEvidence.ts
│   │   ├── useCRIMA.ts
│   │   ├── useAnalytics.ts
│   │   ├── useNotifications.ts
│   │   └── useDebounce.ts
│   │
│   ├── services/
│   │   ├── api.ts                  # Axios instance + interceptors
│   │   ├── authService.ts
│   │   ├── caseService.ts
│   │   ├── evidenceService.ts
│   │   ├── crimaService.ts
│   │   ├── analyticsService.ts
│   │   ├── adminService.ts
│   │   └── notificationService.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── case.ts
│   │   ├── evidence.ts
│   │   ├── crima.ts
│   │   ├── analytics.ts
│   │   └── api.ts
│   │
│   └── utils/
│       ├── constants.ts
│       ├── formatters.ts
│       ├── validators.ts
│       └── helpers.ts
│
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 21.2 Backend

```
backend/
├── main.py                         # FastAPI app init, middleware, router mounts
├── config.py                       # Env vars, Catalyst client init
├── requirements.txt
├── runtime.txt                     # Python 3.11 for Catalyst
│
├── middleware/
│   ├── __init__.py
│   ├── auth_middleware.py
│   ├── error_handler.py
│   ├── logging_middleware.py
│   └── rate_limiter.py
│
├── routers/
│   ├── __init__.py
│   ├── auth_router.py
│   ├── case_router.py
│   ├── evidence_router.py
│   ├── crima_router.py
│   ├── analytics_router.py
│   ├── report_router.py
│   ├── admin_router.py
│   ├── notification_router.py
│   └── settings_router.py
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── case_service.py
│   ├── evidence_service.py
│   ├── crima_service.py
│   ├── intent_service.py
│   ├── embedding_service.py
│   ├── faiss_service.py
│   ├── context_service.py
│   ├── analytics_service.py
│   ├── report_service.py
│   ├── user_service.py
│   ├── notification_service.py
│   └── audit_service.py
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── case.py
│   ├── evidence.py
│   ├── crima.py
│   ├── analytics.py
│   ├── notifications.py
│   └── common.py
│
├── adapters/
│   ├── __init__.py
│   ├── catalyst_db.py              # Catalyst Data Store wrapper
│   ├── catalyst_fs.py              # Catalyst File Store wrapper
│   └── catalyst_auth.py            # Catalyst Auth wrapper
│
├── utils/
│   ├── __init__.py
│   ├── constants.py                # Enums, role constants, status codes
│   ├── validators.py               # Custom Pydantic validators
│   └── helpers.py                  # ID generation, date helpers, etc.
│
├── seed_data/
│   ├── generate_cases.py           # Synthetic data generator
│   └── seed_data.json              # Pre-generated seed data
│
└── tests/
    ├── __init__.py
    ├── conftest.py                  # Shared fixtures
    ├── test_auth.py
    ├── test_cases.py
    ├── test_evidence.py
    ├── test_crima.py
    ├── test_analytics.py
    └── test_services.py
```

## 21.3 FAISS Indexer (Separate Catalyst Function)

```
indexer/
├── main.py                         # Scheduled function entry
├── config.py
├── requirements.txt
├── services/
│   ├── embedding_service.py        # Same as backend (shared logic)
│   └── faiss_service.py
└── utils/
    └── constants.py
```

---

# 22. CODING STANDARDS

## 22.1 General

| Standard | Rule |
|---|---|
| Language | TypeScript (Frontend), Python 3.11+ (Backend) |
| Indentation | 2 spaces (TypeScript), 4 spaces (Python) |
| Line Length | 100 characters |
| Semicolons | Required (TypeScript) |
| Quotes | Single quotes (TypeScript), Double quotes (Python) |
| Trailing Commas | Yes (both) |
| File Naming | `camelCase.ts` (React components: `PascalCase.tsx`) |
| | `snake_case.py` (Python files) |

## 22.2 TypeScript / React

| Rule | Standard |
|---|---|
| Component Type | Functional components with hooks |
| Props Interface | Define `interface Props {}` per component |
| State Management | `useState` for local, `useReducer` for complex, Context for shared |
| Exports | Named exports for components, default exports for pages |
| Imports Order | 1. React/external libs, 2. Components, 3. Hooks, 4. Services, 5. Types, 6. Utils |
| No `any` | Use `unknown` + type guard instead |
| Accessibility | ARIA labels on interactive elements |

## 22.3 Python / FastAPI

| Rule | Standard |
|---|---|
| Type Hints | Required on all function signatures |
| Docstrings | Google-style for all public functions |
| Imports Order | 1. stdlib, 2. third-party, 3. local |
| Async | Use `async def` for all route handlers |
| Pydantic | All request/response models as Pydantic BaseModel |
| Service Pattern | Routes thin → call service layer → service calls adapter |
| Error Raising | Raise `HTTPException` with status code and detail message |

---

# 23. DEVELOPMENT WORKFLOW

## 23.1 Git Workflow (Trunk-Based for Hackathon)

```
main  ─────●─────────●──────────●──────────●─────────
           │         │          │          │
           │  feat/  │  feat/   │  feat/   │  fix/
           │  auth   │  cases   │  crima   │  evidence-
           │         │          │          │  upload
           │         │          │          │
           └─────────┘──────────┘──────────┘─────────
                    (short-lived feature branches)
```

**Branch Strategy:**
- `main` — Always deployable; merged after code review
- `feat/<module>` — Feature branches for parallel work
- `fix/<bug>` — Bug fix branches
- Direct commits to `main` allowed for minor fixes (hackathon pragmatism)

## 23.2 Daily Workflow

```
1. git pull origin main
2. git checkout -b feat/my-module
3. Code → Test → Commit (multiple times)
4. git push origin feat/my-module
5. Create PR (merge to main)
6. Team review → Merge
7. Auto-deploy to Catalyst
```

## 23.3 Task Board

Use GitHub Projects or a simple task board with columns:
- **Backlog** → **To Do** → **In Progress** → **Review** → **Done**

---

# 24. TESTING STRATEGY

## 24.1 Testing Levels

| Level | Focus | Tools | Who |
|---|---|---|---|
| Unit | Services, utilities, models | pytest (backend), Vitest (frontend) | Developer |
| Integration | API endpoints, DB interactions | pytest + httpx (FastAPI TestClient) | Developer |
| E2E | Critical user flows (login, search, CRIMA query) | Playwright | QA / Developer |
| Manual | Demo flow, edge cases, UI polish | Manual | Entire team |

## 24.2 Test Coverage Targets (MVP)

| Layer | Target | Critical Paths |
|---|---|---|
| Backend Services | 80% | Auth, Case CRUD, CRIMA pipeline, Analytics |
| Backend API Routes | 90% | All endpoints (happy path + error cases) |
| Frontend Components | 60% | Shared components, CRIMA chat, Case detail |
| E2E | 5 critical flows | Login, Search case, CRIMA query, Upload evidence, View analytics |

## 24.3 Key Test Scenarios

| Scenario | Type | Description |
|---|---|---|
| Successful login | Integration | Valid credentials return JWT |
| Failed login | Integration | Invalid credentials return 401 |
| Role-based access | Integration | Officer cannot access admin routes |
| Case CRUD | Integration | Create, read, update, delete cases |
| Sematic search | Integration | CRIMA query returns relevant results |
| Empty search | Integration | CRIMA query with no match returns appropriate message |
| Evidence upload | Integration | File upload stores correctly |
| Evidence file size limit | Integration | Over 25MB returns 413 |
| Analytics aggregation | Integration | KPI values match raw data |
| Heat map data | Integration | GeoJSON points have valid coordinates |
| Unauthorized access | Integration | Missing token returns 401 |
| Rate limiting | Integration | Exceeding limit returns 429 |

## 24.4 Test Data

- Use the `seed_data/generate_cases.py` script to generate 500–1000 realistic synthetic cases
- Synthetic data includes: Indian names (suspects, witnesses, officers), Bangalore/Mysore locations, real crime types (theft, assault, cybercrime, etc.)
- Embeddings are generated for all seed cases and indexed in FAISS

---

# 25. DEPLOYMENT ARCHITECTURE

## 25.1 Deployment Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ZOHO CATALYST DEPLOYMENT                              │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  CI/CD Pipeline (Manual Trigger)                                 │    │
│  │                                                                   │    │
│  │  git push main                                                    │    │
│  │       │                                                           │    │
│  │       ▼                                                           │    │
│  │  1. npm run build (frontend)                                      │    │
│  │  2. Output: frontend/dist/                                        │    │
│  │  3. Upload to Catalyst Hosting                                    │    │
│  │       │                                                           │    │
│  │  4. pip install -r requirements.txt (backend)                     │    │
│  │  5. Package backend/ as Catalyst Function                         │    │
│  │  6. Deploy to Catalyst Functions                                  │    │
│  │       │                                                           │    │
│  │  7. Seed synthetic data (first deploy only)                       │    │
│  │  8. Build & upload FAISS index                                    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  Catalyst Hosting            │  │  Catalyst Functions              │  │
│  │  ┌────────────────────────┐  │  │  ┌───────────────────────────┐  │  │
│  │  │ crimaintel.ksp.gov.in  │  │  │  │ /api/* → FastAPI          │  │  │
│  │  │ └── React SPA           │  │  │  │ Memory: 1024 MB           │  │  │
│  │  │ └── index.html → /      │  │  │  │ Timeout: 30s             │  │  │
│  │  │ └── static/ → assets    │  │  │  │ Runtime: Python 3.11      │  │  │
│  │  └────────────────────────┘  │  │  │                           │  │  │
│  └──────────────────────────────┘  │  │  │ /indexer (scheduled)    │  │  │
│                                    │  │  │ └── FAISS rebuild       │  │  │
│  ┌──────────────────────────────┐  │  │  │ └── Every 1 hour        │  │  │
│  │  Environment Variables       │  │  │  └───────────────────────────┘  │  │
│  │  ┌────────────────────────┐  │  │  └──────────────────────────────────┘  │
│  │  │ CATALYST_PROJECT_ID    │  │  │                                         │
│  │  │ CATALYST_CLIENT_ID     │  │  │  ┌──────────────────────────────────┐  │
│  │  │ CATALIST_CLIENT_SECRET │  │  │  │  Data Store Tables               │  │
│  │  │ DATA_STORE_TABLE_PREFIX│  │  │  │  └── ci_cases, ci_users, etc.    │  │
│  │  │ JWT_SECRET             │  │  │  └──────────────────────────────────┘  │
│  │  │ FAISS_INDEX_VERSION    │  │  │                                         │
│  │  └────────────────────────┘  │  │  ┌──────────────────────────────────┐  │
│  └──────────────────────────────┘  │  │  File Store Buckets              │  │
│                                    │  │  └── evidence-files/             │  │
│  ┌──────────────────────────────┐  │  │  └── faiss-index/                │  │
│  │  Monitoring                 │  │  │  └── exports/                    │  │
│  │  ┌────────────────────────┐  │  │  └──────────────────────────────────┘  │
│  │  │ Catalyst Logs          │  │  │                                         │
│  │  │ └── Application logs   │  │  │  ┌──────────────────────────────────┐  │
│  │  │ └── Access logs        │  │  │  │  Catalyst Authentication         │  │
│  │  │ └── Error tracking     │  │  │  │  └── User directory              │  │
│  │  └────────────────────────┘  │  │  │  └── Login/logout pages         │  │
│  └──────────────────────────────┘  │  │  └── Password reset              │  │
│                                    │  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

## 25.2 Deployment Checklist

| Step | Action | Responsible |
|---|---|---|
| 1 | Build React app (`npm run build`) | Frontend |
| 2 | Upload `/dist` to Catalyst Hosting | Frontend |
| 3 | Configure custom domain / SSL | Admin |
| 4 | Bundle backend + dependencies for Catalyst Function | Backend |
| 5 | Set environment variables in Catalyst Console | Admin |
| 6 | Deploy Catalyst Function | Backend |
| 7 | Create Data Store tables (via Catalyst Console or SDK) | Backend |
| 8 | Create File Store buckets | Backend |
| 9 | Configure Catalyst Authentication (user directory) | Admin |
| 10 | Run seed data script | Backend |
| 11 | Build initial FAISS index | Backend |
| 12 | Configure indexer scheduled function | Backend |
| 13 | Test full login → CRIMA query → Case view flow | QA |
| 14 | Test role-based access | QA |
| 15 | Demo walkthrough | Team |

## 25.3 Environment Configuration

| Variable | Description | Source |
|---|---|---|
| `CATALYST_PROJECT_ID` | Zoho Catalyst project ID | Catalyst Console |
| `CATALYST_CLIENT_ID` | OAuth client ID | Catalyst Console |
| `CATALYST_CLIENT_SECRET` | OAuth client secret | Catalyst Console |
| `DATA_STORE_TABLE_PREFIX` | Prefix for table names (e.g., `ci_`) | Team convention |
| `JWT_SECRET` | Secret for signing app JWTs | Generated |
| `JWT_EXPIRY_MINUTES` | Token expiry in minutes | 60 |
| `FAISS_INDEX_VERSION` | Current FAISS index version | Auto-managed |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | Deployment URL |
| `RATE_LIMIT_PER_MINUTE` | Max requests per user per minute | 100 |
| `MAX_UPLOAD_SIZE_MB` | Max evidence file size in MB | 25 |
| `LOG_LEVEL` | Logging level | INFO (prod), DEBUG (dev) |

---

# END OF SOFTWARE DESIGN DOCUMENT

**Document Version:** 1.0
**Status:** Draft
**Next Steps:** Review by development team → UI/UX Design → Implementation
