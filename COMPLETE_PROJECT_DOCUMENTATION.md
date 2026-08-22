# CrimeIntel AI - Complete Project Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-08-18  
**Project Type:** AI-Powered Crime Intelligence Platform  
**Organization:** Karnataka State Police (KSP) Hackathon

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Backend Structure](#backend-structure)
5. [Frontend Structure](#frontend-structure)
6. [Database & Storage](#database--storage)
7. [API Endpoints](#api-endpoints)
8. [Key Services](#key-services)
9. [Middleware & Security](#middleware--security)
10. [Data Models](#data-models)
11. [File Structure Explained](#file-structure-explained)
12. [Setup & Deployment](#setup--deployment)

---

## 🎯 Project Overview

### What is CrimeIntel AI?

CrimeIntel AI is an **AI-powered Crime Intelligence Platform** designed for Karnataka State Police (KSP). It enables police officers to:

- 🔍 **Search & Query** criminal records using conversational AI
- 📊 **Analyze** crime patterns and trends
- 📝 **Manage** cases and evidence systematically
- 💬 **Interact** with an intelligent assistant called **CRIMA AI**
- 📍 **Track** crime locations and suspects on interactive maps
- 🔐 **Secure** sensitive law enforcement data

### Key Features

| Feature | Description |
|---------|-------------|
| **CRIMA AI Assistant** | Conversational AI for natural language crime queries |
| **Case Management** | Track cases, suspects, evidence, and investigations |
| **Evidence Tracking** | Manage and link evidence to cases |
| **Analytics Dashboard** | Crime statistics, trends, and heat maps |
| **Role-Based Access** | Admin, Officer, and Analyst roles with permissions |
| **Search & Retrieval** | Vector-based semantic search using embeddings |
| **Real-time Notifications** | Alert officers on case updates |
| **Audit Logging** | Track all actions for compliance |

---

## 🛠️ Technology Stack

### Frontend
```
├── React 19.2.7                    # UI Framework
├── TypeScript                      # Type safety
├── TailwindCSS + Vite 4.3.3       # Styling & Build tool
├── React Router DOM 7.18           # Client-side routing
├── React Hook Form 7.83            # Form management
├── Zustand 5.0.14                  # State management
├── Axios 1.18.1                    # HTTP client
├── Leaflet + React-Leaflet 5.0     # Interactive maps
├── Recharts 3.10.1                 # Data visualization
└── Lucide React 1.27               # Icons
```

### Backend
```
├── FastAPI                         # Web framework
├── Python 3.11+                    # Runtime
├── Pydantic                        # Data validation
├── Sentence Transformers           # Embeddings
├── FAISS                           # Vector search
├── JWT                             # Authentication
├── SQLAlchemy (optional)           # ORM
└── Uvicorn                         # ASGI server
```

### Cloud Infrastructure
```
├── Zoho Catalyst                   # Serverless platform
├── Catalyst Authentication         # User management
├── Catalyst Data Store             # NoSQL database
├── Catalyst File Store             # File storage
└── Cloud Functions                 # Compute
```

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/TS)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pages: Dashboard, Cases, Evidence, Analytics, Settings    │ │
│  │  Components: Cards, Forms, Maps, Charts, Modal             │ │
│  │  Services: API client, Auth, Case, Evidence               │ │
│  │  State: Zustand stores, Context API                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI/Python)                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Routers (9):                                                │ │
│  │  • auth_router         - User login, registration          │ │
│  │  • admin_router        - Admin management                  │ │
│  │  • case_router         - CRUD for cases                    │ │
│  │  • evidence_router     - CRUD for evidence                 │ │
│  │  • crima_router        - AI assistant queries              │ │
│  │  • analytics_router    - Analytics & statistics            │ │
│  │  • report_router       - Report generation                 │ │
│  │  • notification_router - Push notifications                │ │
│  │  • settings_router     - User settings                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Services (12): Business logic & orchestration               │ │
│  │  • auth_service        - JWT, token validation             │ │
│  │  • case_service        - Case operations                   │ │
│  │  • evidence_service    - Evidence management               │ │
│  │  • crima_service       - AI assistant logic                │ │
│  │  • embedding_service   - Text to embeddings                │ │
│  │  • faiss_service       - Vector similarity search          │ │
│  │  • intent_service      - Intent classification             │ │
│  │  • analytics_service   - Statistics computation            │ │
│  │  • audit_service       - Action logging                    │ │
│  │  • context_service     - Context management                │ │
│  │  • notification_service - Event notifications              │ │
│  │  • user_service        - User management                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Middleware (5): Request/response processing                │ │
│  │  • auth_middleware     - JWT verification                  │ │
│  │  • rate_limiter        - Request throttling                │ │
│  │  • csrf_middleware     - CSRF protection                   │ │
│  │  • logging_middleware  - Request logging                   │ │
│  │  • error_handler       - Exception handling                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Adapters (3): External service integration                 │ │
│  │  • catalyst_auth       - Catalyst Auth                     │ │
│  │  • catalyst_db         - Catalyst Data Store               │ │
│  │  • catalyst_fs         - Catalyst File Store               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Models (6): Data schemas & validation                      │ │
│  │  • user                - User profiles, login              │ │
│  │  • case                - Case details, suspects            │ │
│  │  • evidence            - Evidence items, attachments       │ │
│  │  • crima               - AI responses, context             │ │
│  │  • analytics           - Statistics, crime data            │ │
│  │  • common              - Shared responses, enums           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Catalyst Cloud Platform                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Service │  │ Data Store   │  │ File Store   │          │
│  │  (JWT/OAuth) │  │  (NoSQL DB)  │  │ (S3-like)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Frontend (React)
    ↓
HTTP Request → API Endpoint (Router)
    ↓
Middleware Processing (Auth, Rate Limit, CSRF)
    ↓
Route Handler
    ↓
Service Layer (Business Logic)
    ↓
Adapter Layer (Database/File Store)
    ↓
Catalyst Cloud Services
    ↓
Response → Frontend → User UI Update
```

---

## 📁 Backend Structure

### Root Backend Files

| File | Purpose |
|------|---------|
| **main.py** | FastAPI app initialization, middleware setup, router registration |
| **config.py** | Configuration settings from environment variables |
| **catalyst.json** | Catalyst project configuration |
| **.catalystrc** | Catalyst CLI configuration |
| **requirements.txt** | Python dependencies (pip packages) |
| **requirements-catalyst.txt** | Catalyst-specific dependencies |

### Backend Directories

#### 1. **models/** - Data Schemas & Validation
Define all data structures using Pydantic for type safety and validation.

| File | Contents |
|------|----------|
| **user.py** | `User`, `LoginRequest`, `LoginResponse`, `UserProfile` |
| **case.py** | `Case`, `CaseStatus`, `Suspect`, `OfficerInfo` |
| **evidence.py** | `Evidence`, `EvidenceType`, `Attachment` |
| **crima.py** | `CRIMAQuery`, `CRIMAResponse`, `ConversationContext` |
| **analytics.py** | `CrimeStatistics`, `HeatmapData`, `TrendAnalysis` |
| **common.py** | `SuccessResponse`, `ErrorResponse`, `PaginationParams` |

#### 2. **services/** - Business Logic Layer
Implement core functionality and orchestrate operations.

| File | Responsibility |
|------|-----------------|
| **auth_service.py** | User authentication, JWT token generation, password validation |
| **case_service.py** | CRUD operations for cases, case state management |
| **evidence_service.py** | Evidence creation, attachment handling, linking to cases |
| **user_service.py** | User profile management, role assignment |
| **crima_service.py** | CRIMA AI orchestration, query processing |
| **embedding_service.py** | Convert text to vector embeddings (Sentence Transformers) |
| **faiss_service.py** | Vector similarity search, index management |
| **intent_service.py** | Classify user queries into intents |
| **analytics_service.py** | Generate statistics, trends, heatmap data |
| **audit_service.py** | Log user actions for compliance |
| **context_service.py** | Manage conversation context for CRIMA |
| **notification_service.py** | Send notifications to users |

#### 3. **routers/** - API Endpoints
Define REST API routes and request handlers.

| File | Endpoints |
|------|-----------|
| **auth_router.py** | `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh` |
| **case_router.py** | `/cases` (GET, POST, PUT, DELETE), `/cases/{id}`, `/cases/{id}/suspects` |
| **evidence_router.py** | `/evidence` (CRUD), `/evidence/{id}/attachments` |
| **crima_router.py** | `/crima/query`, `/crima/chat`, `/crima/context` |
| **analytics_router.py** | `/analytics/stats`, `/analytics/heatmap`, `/analytics/trends` |
| **report_router.py** | `/reports/generate`, `/reports/{id}`, `/reports/export` |
| **admin_router.py** | `/admin/users`, `/admin/roles`, `/admin/audit-logs` |
| **notification_router.py** | `/notifications`, `/notifications/{id}`, `/notifications/subscribe` |
| **settings_router.py** | `/settings`, `/settings/preferences`, `/settings/security` |

#### 4. **middleware/** - Request Processing
Intercept and process requests/responses.

| File | Function |
|------|----------|
| **auth_middleware.py** | Extract & validate JWT tokens, attach user to request |
| **rate_limiter.py** | Enforce request rate limits (100 req/min default) |
| **csrf_middleware.py** | CSRF token validation for state-changing requests |
| **logging_middleware.py** | Log incoming requests and responses |
| **error_handler.py** | Catch exceptions and return formatted error responses |

#### 5. **adapters/** - External Service Integration
Abstract away cloud service details.

| File | Integrates |
|------|----------|
| **catalyst_auth.py** | Catalyst authentication service (login, token validation) |
| **catalyst_db.py** | Catalyst Data Store (NoSQL database operations) |
| **catalyst_fs.py** | Catalyst File Store (upload/download files) |

#### 6. **utils/** - Helper Functions
Reusable utility functions.

| File | Contents |
|------|----------|
| **constants.py** | Enums, magic strings, default values |
| **helpers.py** | Date formatting, string parsing, common utilities |
| **validators.py** | Custom Pydantic validators (email, phone, coordinates) |

#### 7. **functions/** - Serverless Cloud Functions
Functions deployed to Catalyst.

| Directory | Purpose |
|-----------|---------|
| **crimeintel-api-v2/** | Additional API endpoints (microservice) |
| **crimeintel-frontend/** | Frontend-specific cloud functions |

#### 8. **scripts/** - Automation & Setup
One-off scripts for deployment and data management.

| File | Purpose |
|------|---------|
| **seed_database.py** | Populate database with test data |
| **build_faiss_index.py** | Build FAISS vector index from existing embeddings |

#### 9. **tests/** - Unit Tests
Automated testing suite.

| File | Tests |
|------|-------|
| **conftest.py** | Pytest configuration, fixtures, mocks |
| **test_cases.py** | Case service tests |
| **test_crima.py** | CRIMA AI service tests |

---

## 💻 Frontend Structure

### Root Frontend Files

| File | Purpose |
|------|---------|
| **package.json** | NPM dependencies and scripts |
| **vite.config.ts** | Vite build configuration |
| **tsconfig.json** | TypeScript compiler settings |
| **index.html** | HTML entry point |

### Frontend Directories

#### 1. **src/pages/** - Route-Level Components
Full page components for each route.

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Overview, quick stats, recent cases |
| Cases | `/cases` | List all cases, search, filter |
| Case Detail | `/cases/:id` | View case details, suspects, evidence |
| Evidence | `/evidence` | Manage evidence items |
| Analytics | `/analytics` | Crime trends, heatmaps, statistics |
| CRIMA Chat | `/crima` | Interact with CRIMA AI assistant |
| Admin Panel | `/admin` | User management, role assignment |
| Settings | `/settings` | User preferences, security settings |

#### 2. **src/components/** - Reusable UI Components
Modular, reusable components.

| Component Category | Examples |
|-------------------|----------|
| Common | Header, Footer, Sidebar, Navbar |
| Cards | CaseCard, EvidenceCard, StatCard |
| Forms | LoginForm, CaseForm, EvidenceForm |
| Tables | CasesTable, UsersTable, AuditLogsTable |
| Maps | CrimeHeatmap, LocationMarker |
| Charts | TrendChart, StatisticsChart |
| Modals | ConfirmDialog, DetailsModal |
| Inputs | TextInput, DatePicker, FileUpload |

#### 3. **src/services/** - API Client Layer
Functions to communicate with backend.

| Service | Methods |
|---------|---------|
| **authService.ts** | login(), register(), logout(), refreshToken() |
| **caseService.ts** | getCases(), getCase(), createCase(), updateCase(), deleteCase() |
| **evidenceService.ts** | getEvidence(), uploadFile(), linkToCase() |
| **crimaService.ts** | sendQuery(), getConversation(), clearContext() |
| **analyticsService.ts** | getStats(), getHeatmap(), getTrends() |
| **notificationService.ts** | getNotifications(), markRead() |

#### 4. **src/hooks/** - Custom React Hooks
Encapsulated logic for components.

| Hook | Purpose |
|------|---------|
| **useAuth** | Auth state and login/logout |
| **useCases** | Case list management |
| **useEvidence** | Evidence management |
| **useFetch** | Generic data fetching with loading/error |
| **useNotifications** | Real-time notification handling |
| **useForm** | Form state and validation |

#### 5. **src/store/** - State Management (Zustand)
Global application state.

| Store | State |
|-------|-------|
| **authStore** | currentUser, isAuthenticated, token, roles |
| **caseStore** | cases, selectedCase, filters, loading |
| **evidenceStore** | evidence, selectedEvidence |
| **notificationStore** | notifications, unreadCount |
| **uiStore** | darkMode, sidebarOpen, language |

#### 6. **src/context/** - React Context API
Context providers for feature areas.

| Context | Provides |
|---------|----------|
| **AuthContext** | User authentication state |
| **ThemeContext** | Theme/styling configuration |
| **LanguageContext** | Localization/i18n |

#### 7. **src/types/** - TypeScript Interfaces
Type definitions for data structures.

```typescript
// Examples of types
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'officer' | 'analyst';
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  suspects: Suspect[];
  evidence: Evidence[];
  status: CaseStatus;
  createdAt: Date;
}

interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  caseId: string;
  attachments: Attachment[];
}
```

#### 8. **src/utils/** - Utility Functions
Helper functions for common tasks.

| Utility | Functions |
|---------|-----------|
| **formatters** | formatDate(), formatTime(), formatFileSize() |
| **validators** | validateEmail(), validatePhone(), isValidCoordinate() |
| **constants** | CASE_STATUSES, EVIDENCE_TYPES, USER_ROLES |
| **api** | buildQuery(), handleError(), retryRequest() |

#### 9. **src/assets/** - Static Files
Images, icons, fonts, styles.

```
assets/
├── images/      # PNG, JPG, SVG images
├── fonts/       # Custom fonts
└── icons/       # SVG icons
```

#### 10. **src/index.css** - Global Styles
TailwindCSS imports and global styles.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
```

---

## 🗄️ Database & Storage

### Data Store (Catalyst NoSQL)

**Table Naming Convention:** `ci_<entity_type>` (e.g., `ci_cases`, `ci_evidence`, `ci_users`)

#### Tables

| Table | Fields | Purpose |
|-------|--------|---------|
| **ci_users** | id, email, passwordHash, displayName, role, department, phone, active, createdAt, updatedAt | User accounts and profiles |
| **ci_cases** | id, caseNumber, title, description, status, assignedOfficer, suspects[], evidence[], createdAt, updatedAt, resolvedAt | Criminal cases |
| **ci_evidence** | id, caseId, type, description, photoUrl, attachments[], collectedDate, collectedBy, chain_of_custody[], createdAt | Physical/digital evidence |
| **ci_suspects** | id, caseIds[], name, alias, age, gender, photo, address, knownAssociates, criminalHistory, status | Suspect database |
| **ci_analytics** | id, date, crimeType, location, count, trend | Crime statistics |
| **ci_notifications** | id, userId, type, title, message, read, createdAt | User notifications |
| **ci_audit_logs** | id, userId, action, entityType, entityId, timestamp, changes | Action audit trail |
| **ci_embeddings** | id, caseId, text, embedding[], model | Vector embeddings for search |

### File Store (Catalyst File Storage)

**Storage Structure:**
```
/crimeintel/
├── /cases/
│   └── /{caseId}/
│       ├── /documents/
│       ├── /photos/
│       └── /evidence/
├── /evidence/
│   └── /{evidenceId}/
│       ├── /attachments/
│       └── /metadata/
├── /reports/
│   └── /{reportId}/
└── /uploads/
    └── /{userId}/
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /auth/login              - User login
POST   /auth/register           - New user registration
POST   /auth/logout             - User logout
POST   /auth/refresh            - Refresh JWT token
GET    /auth/me                 - Current user profile
```

### Cases
```
GET    /cases                   - List all cases (paginated)
POST   /cases                   - Create new case
GET    /cases/:id               - Get case details
PUT    /cases/:id               - Update case
DELETE /cases/:id               - Delete case
GET    /cases/:id/suspects      - Get case suspects
POST   /cases/:id/suspects      - Add suspect to case
```

### Evidence
```
GET    /evidence                - List all evidence
POST   /evidence                - Create evidence record
GET    /evidence/:id            - Get evidence details
PUT    /evidence/:id            - Update evidence
DELETE /evidence/:id            - Delete evidence
POST   /evidence/:id/attach     - Upload attachment
DELETE /evidence/:id/attach/:attachmentId - Remove attachment
```

### CRIMA AI
```
POST   /crima/query             - Send text query to CRIMA
GET    /crima/chat/:sessionId   - Get conversation history
POST   /crima/chat/:sessionId   - Send message in conversation
GET    /crima/context           - Get current context
DELETE /crima/context           - Clear conversation context
```

### Analytics
```
GET    /analytics/stats         - Crime statistics
GET    /analytics/heatmap       - Crime location heatmap
GET    /analytics/trends        - Crime trends over time
GET    /analytics/by-type       - Statistics by crime type
```

### Admin
```
GET    /admin/users             - List all users
POST   /admin/users             - Create user
PUT    /admin/users/:id         - Update user
DELETE /admin/users/:id         - Delete user
PUT    /admin/users/:id/role    - Assign role
GET    /admin/audit-logs        - View audit logs
```

### Notifications
```
GET    /notifications           - Get user notifications
GET    /notifications/:id       - Get notification details
PUT    /notifications/:id/read  - Mark as read
DELETE /notifications/:id       - Delete notification
POST   /notifications/subscribe - Subscribe to notifications
```

### Settings
```
GET    /settings                - Get user settings
PUT    /settings                - Update settings
GET    /settings/preferences    - Get preferences
PUT    /settings/preferences    - Update preferences
```

---

## 🔧 Key Services Explained

### 1. **Authentication Service**
**File:** `services/auth_service.py`

**Responsibilities:**
- User registration and validation
- JWT token generation and validation
- Password hashing and verification
- Token refresh and expiration handling

**Key Methods:**
```python
def register_user(email, password, display_name) → User
def login_user(email, password) → LoginResponse
def verify_token(token) → Dict
def refresh_token(refresh_token) → Token
```

### 2. **Case Service**
**File:** `services/case_service.py`

**Responsibilities:**
- Create, read, update, delete cases
- Manage case status lifecycle
- Link suspects and evidence to cases
- Track case assignment to officers

**Key Methods:**
```python
def create_case(case_data) → Case
def get_case(case_id) → Case
def list_cases(filters, pagination) → List[Case]
def update_case(case_id, updates) → Case
def add_suspect(case_id, suspect_data) → Case
def change_status(case_id, new_status) → Case
```

### 3. **Evidence Service**
**File:** `services/evidence_service.py`

**Responsibilities:**
- Record evidence from crime scenes
- Handle file attachments
- Maintain chain of custody
- Link evidence to cases

**Key Methods:**
```python
def create_evidence(evidence_data) → Evidence
def upload_attachment(evidence_id, file) → Attachment
def link_to_case(evidence_id, case_id) → Evidence
def get_evidence(evidence_id) → Evidence
def update_evidence(evidence_id, updates) → Evidence
```

### 4. **CRIMA Service**
**File:** `services/crima_service.py`

**Responsibilities:**
- Process natural language queries
- Classify user intent
- Generate embeddings for semantic search
- Manage conversation context

**Key Methods:**
```python
def process_query(query, context) → CRIMAResponse
def classify_intent(query) → Intent
def search_cases(query, top_k=5) → List[Case]
def generate_response(query, context, search_results) → str
def save_conversation(user_id, messages, context) → Conversation
```

### 5. **Embedding Service**
**File:** `services/embedding_service.py`

**Responsibilities:**
- Convert text to vector embeddings
- Use pre-trained Sentence Transformers
- Support multiple embedding models

**Key Methods:**
```python
def get_embedding(text: str) → np.ndarray
def get_batch_embeddings(texts: List[str]) → np.ndarray
def set_model(model_name: str) → None
def get_similarity(text1: str, text2: str) → float
```

### 6. **FAISS Service**
**File:** `services/faiss_service.py`

**Responsibilities:**
- Build and manage vector indices
- Perform similarity search
- Store/load indices from disk

**Key Methods:**
```python
def build_index(embeddings: np.ndarray) → Index
def search(query_embedding: np.ndarray, k: int) → List[Tuple[int, float]]
def add_embeddings(new_embeddings: np.ndarray) → None
def save_index(path: str) → None
def load_index(path: str) → None
```

### 7. **Analytics Service**
**File:** `services/analytics_service.py`

**Responsibilities:**
- Calculate crime statistics
- Generate heatmap data
- Analyze trends

**Key Methods:**
```python
def get_statistics(filters, date_range) → CrimeStatistics
def get_heatmap_data(date_range) → List[HeatmapPoint]
def analyze_trends(crime_type, period) → TrendAnalysis
def get_top_suspects() → List[Suspect]
def get_case_distribution() → Dict
```

### 8. **Audit Service**
**File:** `services/audit_service.py`

**Responsibilities:**
- Log all user actions
- Track data changes
- Generate audit reports

**Key Methods:**
```python
def log_action(user_id, action, entity_type, entity_id) → AuditLog
def log_change(user_id, entity_id, old_value, new_value) → ChangeLog
def get_audit_logs(filters, pagination) → List[AuditLog]
def generate_report(date_range) → AuditReport
```

### 9. **Notification Service**
**File:** `services/notification_service.py`

**Responsibilities:**
- Send notifications to users
- Manage notification preferences
- Support multiple channels

**Key Methods:**
```python
def send_notification(user_id, title, message, type) → Notification
def notify_case_update(case_id) → None
def notify_assignment(user_id, case_id) → None
def get_user_notifications(user_id, unread_only) → List[Notification]
def mark_as_read(notification_id) → Notification
```

---

## 🔐 Middleware & Security

### 1. **Authentication Middleware**
**File:** `middleware/auth_middleware.py`

**Purpose:** Verify JWT tokens on protected routes

```python
def get_current_user(request) → User:
    # Extract token from Authorization header
    # Verify token signature and expiration
    # Return user object
    
def require_role(*roles) → Callable:
    # Decorator to enforce role-based access
    # Only allows specified roles
    # Raises HTTPException 403 if unauthorized
```

### 2. **CSRF Middleware**
**File:** `middleware/csrf_middleware.py`

**Purpose:** Prevent Cross-Site Request Forgery attacks

```python
def csrf_protect(request) → None:
    # Validate CSRF token on state-changing requests
    # Skip for safe methods (GET, HEAD, OPTIONS)
    # Raise 403 on token mismatch
```

### 3. **Rate Limiter**
**File:** `middleware/rate_limiter.py`

**Purpose:** Prevent abuse and DDoS attacks

```python
@rate_limiter.limit("100/minute")
def protected_endpoint():
    # Max 100 requests per minute per IP
    # Returns 429 (Too Many Requests) when exceeded
```

### 4. **Logging Middleware**
**File:** `middleware/logging_middleware.py`

**Purpose:** Track all HTTP requests and responses

```python
def log_request(request) → None:
    # Log method, path, query params
    # Log response status and time
    # Support structured logging (JSON)
```

### 5. **Error Handler**
**File:** `middleware/error_handler.py`

**Purpose:** Catch exceptions and return consistent error responses

```python
def handle_validation_error(exc) → JSONResponse:
    # Return 422 with field validation errors
    
def handle_not_found(exc) → JSONResponse:
    # Return 404 with resource not found message
    
def handle_generic_error(exc) → JSONResponse:
    # Return 500 with generic error message
    # Log full exception details
```

### Security Best Practices

1. **JWT Authentication**
   - Token issued on login
   - Expires after configurable time (default 60 min)
   - Refresh token for extended sessions
   - HS256 algorithm with secret key

2. **Password Security**
   - Bcrypt hashing with salt
   - Minimum 8 characters
   - Validation for complexity

3. **CORS**
   - Whitelist allowed origins
   - Allow credentials on same-origin
   - Restrict methods and headers

4. **Rate Limiting**
   - 100 requests/minute per IP
   - Configurable via environment variable
   - Prevents brute force attacks

5. **Audit Logging**
   - Log all user actions
   - Track data modifications
   - Compliance with law enforcement regulations

---

## 📊 Data Models (Pydantic Schemas)

### User Model
```python
class User(BaseModel):
    id: str                              # Unique identifier
    email: str                           # User email
    display_name: str                    # Display name
    role: Literal["admin", "officer", "analyst"]
    department: Optional[str] = None     # Police department
    phone: Optional[str] = None          # Phone number
    active: bool = True                  # Account status
    created_at: datetime                 # Registration date
    updated_at: datetime                 # Last update
    last_login: Optional[datetime] = None
```

### Case Model
```python
class Case(BaseModel):
    id: str                              # Unique case ID
    case_number: str                     # Official case number
    title: str                           # Case title
    description: str                     # Detailed description
    status: Literal["open", "under_investigation", "solved", "closed"]
    suspects: List[Suspect]              # Associated suspects
    evidence: List[Evidence]             # Related evidence
    assigned_officer: OfficerInfo        # Assigned police officer
    location: Optional[Location] = None  # Crime location
    crime_type: str                      # Type of crime
    priority: Literal["low", "medium", "high", "critical"]
    created_at: datetime                 # Creation date
    updated_at: datetime                 # Last update
    resolved_at: Optional[datetime] = None
```

### Evidence Model
```python
class Evidence(BaseModel):
    id: str                              # Unique evidence ID
    case_id: str                         # Associated case
    type: Literal["physical", "digital", "documentary"]
    description: str                     # Evidence description
    collected_date: date                 # Collection date
    collected_by: str                    # Officer name
    location: Optional[Location] = None  # Collection location
    attachments: List[Attachment]        # Attached files
    chain_of_custody: List[CustodyRecord]  # Custody history
    tags: List[str] = []                 # Searchable tags
    created_at: datetime
    updated_at: datetime
```

### CRIMA Model
```python
class CRIMAQuery(BaseModel):
    query: str                           # User's natural language query
    session_id: Optional[str] = None     # Conversation session
    context: Optional[Dict] = None       # Additional context

class CRIMAResponse(BaseModel):
    response: str                        # AI-generated response
    confidence: float                    # Confidence score (0-1)
    cases: List[Case]                    # Relevant cases
    suggestions: List[str]               # Follow-up suggestions
    intent: Literal["search", "analyze", "summarize", "clarify"]
```

### Analytics Model
```python
class CrimeStatistics(BaseModel):
    total_cases: int                     # Total number of cases
    open_cases: int                      # Currently open cases
    solved_cases: int                    # Solved cases
    case_distribution: Dict[str, int]    # By crime type
    suspects_count: int                  # Total suspects
    evidence_count: int                  # Total evidence items
    resolution_rate: float               # % solved cases
    average_resolution_days: float       # Days to solve

class HeatmapPoint(BaseModel):
    latitude: float                      # Location coordinates
    longitude: float
    intensity: float                     # Number of crimes
    crime_type: str

class TrendAnalysis(BaseModel):
    crime_type: str
    period: str                          # "daily", "weekly", "monthly"
    data_points: List[Dict]              # Time-series data
    trend_direction: Literal["increasing", "decreasing", "stable"]
    growth_rate: Optional[float] = None
```

---

## 📂 File Structure Explained

### Critical Files to Know

| File | Priority | Why Important |
|------|----------|---------------|
| **main.py** | ⭐⭐⭐ | Entry point, app initialization, middleware setup |
| **config.py** | ⭐⭐⭐ | All configuration settings |
| **models/case.py** | ⭐⭐ | Core data structure for cases |
| **services/case_service.py** | ⭐⭐⭐ | Main business logic |
| **routers/case_router.py** | ⭐⭐ | API endpoints for cases |
| **middleware/auth_middleware.py** | ⭐⭐⭐ | Authentication for protected routes |
| **services/crima_service.py** | ⭐⭐⭐ | AI assistant orchestration |
| **adapters/catalyst_db.py** | ⭐⭐ | Database connection |
| **frontend/App.tsx** | ⭐⭐ | Main React app component |
| **frontend/src/services/** | ⭐⭐ | API client services |

### Environment Variables

**Create `.env` file in backend/:**

```bash
# Catalyst Configuration
CATALYST_PROJECT_ID=your_project_id
CATALYST_CLIENT_ID=your_client_id
CATALYST_CLIENT_SECRET=your_client_secret

# JWT Settings
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY_MINUTES=60
JWT_ALGORITHM=HS256

# CORS & Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_PER_MINUTE=100
MAX_UPLOAD_SIZE_MB=25

# Logging
LOG_LEVEL=INFO

# Database
DATA_STORE_TABLE_PREFIX=ci_

# Optional: AI Models
EMBEDDING_MODEL=all-MiniLM-L6-v2
INTENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
```

---

## 🚀 Setup & Deployment

### Local Development Setup

#### Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
pip install -r requirements-catalyst.txt

# 5. Create .env file
cp .env.example .env
# Edit .env with your Catalyst credentials

# 6. Run development server
uvicorn main:app --reload --port 8000
```

**API Documentation:** http://localhost:8000/api/v1/docs

#### Frontend

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file if needed
# Edit environment variables for API URL

# 4. Run development server
npm run dev
```

**Application:** http://localhost:5173

### Production Deployment

#### Catalyst Deployment

```bash
# 1. Install Catalyst CLI
npm install -g @zoho/catalyst-cli

# 2. Login to Catalyst
catalyst login

# 3. Deploy backend
cd backend
catalyst build
catalyst deploy

# 4. Deploy frontend
cd frontend
npm run build
catalyst deploy --type frontend
```

#### Build & Test Before Deploy

```bash
# Backend
cd backend
python -m pytest tests/  # Run tests
pylint services/        # Lint code
black .                 # Format code

# Frontend
cd frontend
npm run lint            # Lint code
npm run build           # Build optimized version
```

### Monitoring & Logs

- **Backend Logs:** Check Catalyst console
- **Frontend Logs:** Browser DevTools
- **Database Logs:** Catalyst Data Store dashboard
- **Error Tracking:** Implement Sentry integration (optional)

---

## 📝 Development Workflow

### Adding a New Feature

1. **Create Data Model** → `models/`
2. **Create Service** → `services/`
3. **Create Router/Endpoint** → `routers/`
4. **Create Frontend Component** → `frontend/src/components/`
5. **Create Frontend Service** → `frontend/src/services/`
6. **Add Tests** → `backend/tests/`
7. **Update Documentation**

### Code Style

- **Backend:** PEP 8 (use `black` formatter)
- **Frontend:** ESLint configuration in `package.json`
- **TypeScript:** Strict mode enabled
- **Comments:** Document complex logic

### Git Workflow

```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature
# Create Pull Request
```

---

## 📚 Documentation Files

| Document | Purpose |
|----------|---------|
| **API_SPECIFICATION.md** | Detailed API endpoints, request/response schemas |
| **DATABASE_DESIGN.md** | Entity relationships, table structures |
| **DEPLOYMENT_GUIDE.md** | Step-by-step deployment instructions |
| **USER_MANUAL.md** | End-user guide for police officers |
| **UI_UX_SPECIFICATION.md** | Design system, component specifications |
| **TESTING_REPORT.md** | Test coverage, results, quality metrics |
| **PERFORMANCE_REPORT.md** | Performance benchmarks, optimization tips |
| **PRD_CrimeIntel_AI.md** | Product requirements and feature list |
| **SDD_CrimeIntel_AI.md** | System design and architecture details |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow code style guidelines
4. Add tests for new features
5. Submit a pull request
6. Ensure CI/CD passes

---

## 📞 Support & Contact

- **Issues:** Create GitHub issue
- **Questions:** Check documentation
- **Security:** See SECURITY.md

---

## 📄 License

See LICENSE file for details.

---

**Last Updated:** 2026-08-18  
**Version:** 1.0.0  
**Status:** Active Development
