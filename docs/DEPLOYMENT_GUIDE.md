# DEPLOYMENT GUIDE

## CrimeIntel AI — Zoho Catalyst Deployment

---

# TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Catalyst Project Setup](#3-catalyst-project-setup)
4. [Data Store Configuration](#4-data-store-configuration)
5. [File Store Configuration](#5-file-store-configuration)
6. [Authentication Configuration](#6-authentication-configuration)
7. [Backend Deployment](#7-backend-deployment)
8. [Frontend Deployment](#8-frontend-deployment)
9. [AI Pipeline Setup](#9-ai-pipeline-setup)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Troubleshooting](#11-troubleshooting)

---

# 1. PREREQUISITES

## Required Accounts & Tools

| Item | Description | Link |
|---|---|---|
| Zoho Catalyst Account | Free tier or Hackathon credits | https://catalyst.zoho.com/ |
| Node.js | v18+ for frontend build | https://nodejs.org/ |
| Python | 3.11+ for backend | https://python.org |
| Git | For version control | https://git-scm.com |
| Catalyst CLI | For command-line deployment | Install via Catalyst Console |

## System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 2 GB | 4 GB |
| Disk Space | 1 GB | 2 GB |
| Internet | Broadband | Broadband |
| OS | Windows 10+, macOS 12+, Ubuntu 20+ | Any |

---

# 2. ENVIRONMENT SETUP

## Clone Repository

```bash
git clone <repository-url>
cd crimeintel-ai
```

## Frontend Setup

```bash
cd frontend
npm install
```

## Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## Environment Variables

Create `backend/.env`:

```ini
# Catalyst Configuration
CATALYST_PROJECT_ID=your_project_id
CATALYST_CLIENT_ID=your_client_id
CATALYST_CLIENT_SECRET=your_client_secret

# JWT Configuration
JWT_SECRET=your-random-secret-key-min-32-chars
JWT_EXPIRY_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-domain.catalysthost.com

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# Upload Limits
MAX_UPLOAD_SIZE_MB=25

# Logging
LOG_LEVEL=INFO

# Data Store
DATA_STORE_TABLE_PREFIX=ci_
```

---

# 3. CATALYST PROJECT SETUP

## Create Catalyst Project

1. Log in to [Catalyst Console](https://console.catalyst.zoho.com/)
2. Click **"New Project"**
3. Enter project name: `CrimeIntelAI`
4. Select region (choose closest to Karnataka: **Mumbai** or **Singapore**)
5. Select **"App Type: Web App"**
6. Click **"Create"**

## Get API Credentials

1. Navigate to **Project Settings** > **API & Credentials**
2. Note down:
   - **Project ID**
   - **Client ID**
   - **Client Secret**
3. Add these to your `backend/.env` file

## Install Catalyst CLI

```bash
# Download from Catalyst Console > CLI
# Or use npm
npm install -g zoho-catalyst-cli
```

```bash
# Authenticate CLI
catalyst login
# Follow browser-based OAuth flow
```

---

# 4. DATA STORE CONFIGURATION

## Create Tables

Use one of these methods:

### Method 1: Catalyst Console (Manual)

Navigate to **Data Store** > **Tables** and create these tables:

| Table Name | Primary Key |
|---|---|
| `ci_users` | USER_ID |
| `ci_cases` | CASE_ID |
| `ci_suspects` | SUSPECT_ID |
| `ci_witnesses` | WITNESS_ID |
| `ci_evidence_metadata` | EVIDENCE_ID |
| `ci_case_timeline` | EVENT_ID |
| `ci_notifications` | NOTIFICATION_ID |
| `ci_audit_logs` | LOG_ID |
| `ci_faiss_index_meta` | VERSION_ID |
| `ci_embedding_cache` | CACHE_ID |

Refer to `docs/DATABASE_DESIGN.md` for the exact column definitions for each table.

### Method 2: Using the Table Creator Script

Run the migration script (create this or run manually):

```bash
cd backend
python scripts/create_tables.py
```

---

# 5. FILE STORE CONFIGURATION

## Create Buckets

Navigate to **File Store** > **Buckets** and create:

| Bucket Name | Purpose | Access Control |
|---|---|---|
| `evidence-files` | Uploaded evidence documents/images/videos | Private (app-level access) |
| `faiss-index` | FAISS vector index files | Private (system access) |
| `exports` | Generated report exports | Private (app-level access) |

## Folder Structure (Auto-created by app)

```
evidence-files/
  └── {case_id}/
      └── {uuid}.{ext}

faiss-index/
  ├── index_v{version}.faiss
  └── id_mapping_v{version}.json

exports/
  └── reports/
      └── {uuid}.pdf
```

---

# 6. AUTHENTICATION CONFIGURATION

## Configure Catalyst Auth

1. Navigate to **Authentication** in Catalyst Console
2. Configure **Login Methods**: Email & Password
3. Set **Password Policy**:
   - Minimum length: 8
   - Require uppercase, lowercase, digit, special character
4. Configure **Session**:
   - Token expiry: 60 minutes
   - Refresh token: Enabled (for future use)

## Seed Initial Admin User

Run the seed script to create initial users:

```bash
cd backend
python seed_data/generate_cases.py
python scripts/seed_users.py
```

This creates:
- 1 Super Admin account
- 4 Officer/Inspector accounts (for demo)

---

# 7. BACKEND DEPLOYMENT

## Package Backend

```bash
cd backend

# Install dependencies to a local folder
pip install -r requirements.txt -t ./dependencies

# Create deployment package
# The Catalyst Function will use main.py as entry point
```

## Deploy via Catalyst CLI

```bash
# Navigate to backend directory
cd backend

# Initialize Catalyst Function
catalyst init

# Select:
# - Component: Function
# - Runtime: Python 3.11
# - Function name: crimeintel-api

# Deploy
catalyst deploy

# Or for specific function only
catalyst deploy --project crimeintel-api
```

## Function Configuration

Set these in Catalyst Console for the function:

| Setting | Value |
|---|---|
| **Name** | crimeintel-api |
| **Runtime** | Python 3.11 |
| **Memory** | 1024 MB |
| **Timeout** | 30 seconds |
| **Environment Variables** | Load from backend/.env |

## Scheduled Indexer Function (Optional)

```bash
# Create a separate function for FAISS index rebuild
catalyst init

# Select Function, name: crimeintel-indexer
# Set schedule: Every 1 hour
```

---

# 8. FRONTEND DEPLOYMENT

## Build Frontend

```bash
cd frontend

# Set production API URL
# Edit src/services/api.ts or use environment variable
VITE_API_URL=https://{function-url}/api/v1

# Build
npm run build

# Output: frontend/dist/
```

## Deploy to Catalyst Hosting

### Via CLI

```bash
cd frontend

# Initialize hosting
catalyst init

# Select:
# - Component: Hosting
# - Type: SPA
# - Build output: dist/

# Deploy
catalyst deploy
```

### Via Console

1. Navigate to **Hosting** in Catalyst Console
2. Click **"Upload"**
3. Select the `frontend/dist/` folder
4. Configure:
   - **Index file**: index.html
   - **Error page**: index.html (for SPA routing)
   - **Cache**: 1 hour for static assets

## Configure Custom Domain (Optional)

1. Navigate to **Hosting** > **Domains**
2. Add custom domain: `crimaintel.ksp.gov.in`
3. Configure CNAME record in DNS
4. Enable SSL (auto-provisioned by Catalyst)

---

# 9. AI PIPELINE SETUP

## Sentence Transformer Model

The model (`all-MiniLM-L6-v2`) is downloaded at runtime on the first cold start.

**Important:** The model is ~80MB. Ensure the function has:
- Sufficient memory (1024 MB)
- Adequate timeout (30 seconds for first load)

**Warm-up Strategy:**

Create a scheduled ping to keep the function warm:

```
Schedule: Every 5 minutes
Endpoint: GET /api/v1/health
```

This prevents cold start delays during the demo.

## FAISS Index Initialization

Run the index builder after seeding data:

```bash
cd backend

# Generate embeddings for all cases
python scripts/build_faiss_index.py

# This will:
# 1. Fetch all cases from Data Store
# 2. Generate embeddings using Sentence Transformer
# 3. Build FAISS index
# 4. Upload index file to File Store
# 5. Save index metadata to Data Store
```

## Verify AI Pipeline

```bash
curl -X POST https://{function-url}/api/v1/crima/query \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"text": "Find theft cases in Bangalore"}'
```

Expected response: List of matching cases with confidence scores.

---

# 10. POST-DEPLOYMENT VERIFICATION

## Health Check

```bash
curl https://{function-url}/api/v1/health
# Expected: {"status": "ok", "timestamp": "..."}
```

## Test Suite

```bash
cd backend
pytest tests/ -v
# Expected: All tests passing
```

## Manual Verification Checklist

| # | Test Case | Expected Result |
|---|---|---|
| 1 | Load frontend URL | Login page displays |
| 2 | Login with officer credentials | Dashboard loads within 3 seconds |
| 3 | Ask CRIMA AI "Find theft cases" | Returns matching cases with confidence |
| 4 | Browse cases list | Paginated list loads |
| 5 | Open case detail | All sections visible (FIR, suspects, witnesses) |
| 6 | Upload evidence | File uploads and appears in gallery |
| 7 | View analytics | Charts render with data |
| 8 | View heat map | Map shows crime hotspots |
| 9 | Admin: Create user | User appears in list |
| 10 | Settings: Update profile | Profile saves correctly |

---

# 11. TROUBLESHOOTING

## Common Issues

| Issue | Cause | Solution |
|---|---|---|
| **CORS error** | Frontend origin not in ALLOWED_ORIGINS | Update ALLOWED_ORIGINS in .env |
| **Auth failure** | Catalyst Auth not configured | Check Authentication settings in console |
| **Function timeout** | Model loading too slow | Ping function every 5 minutes to keep warm |
| **FAISS not found** | Index not built | Run `scripts/build_faiss_index.py` |
| **File upload fails** | File Store bucket not created | Create buckets in Catalyst Console |
| **"Table not found"** | Data Store tables not created | Create all tables via Console or migration script |
| **502 Bad Gateway** | Function crashed | Check Catalyst Logs for error trace |

## Logs

```bash
# View application logs
catalyst logs --function crimeintel-api

# View access logs
catalyst logs --hosting crimeintel-frontend
```

## Rollback

```bash
# Rollback function to previous version
catalyst rollback --function crimeintel-api --version {previous_version}
```

---

# END OF DEPLOYMENT GUIDE
