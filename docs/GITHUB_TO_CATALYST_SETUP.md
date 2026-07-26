# GitHub → Zoho Catalyst: End-to-End Setup Guide

This guide walks through creating the GitHub repo, pushing CrimeIntel AI code, creating a Zoho Catalyst project, and deploying.

---

## Step 1: Create GitHub Repository

```bash
# 1. Go to https://github.com/new
# 2. Create a new repository called "crimeintel-ai" (public or private)
# 3. Do NOT initialize with README, .gitignore, or license (we already have them)

# 4. In your local terminal, navigate to the project
cd C:\D drive\Datathon

# 5. Initialize git
git init

# 6. Add all files
git add .

# 7. Commit
git commit -m "Initial commit: CrimeIntel AI MVP v1.0"

# 8. Link to your GitHub repo (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/crimeintel-ai.git

# 9. Push
git branch -M main
git push -u origin main
```

---

## Step 2: Create Zoho Catalyst Project

1. Go to **https://console.catalyst.zoho.com/**
2. Click **"New Project"**
3. Name: `CrimeIntelAI`
4. Region: **Mumbai** (closest to Karnataka — lowest latency for KSP)
5. App Type: **Web App**
6. Click **Create**

### Get API Credentials

```
Catalyst Console → Project Settings → API & Credentials
```

Copy these three values:

| Credential | Where to find it |
|---|---|
| `CATALYST_PROJECT_ID` | Settings → Project Info → Project ID |
| `CATALYST_CLIENT_ID` | Settings → API & Credentials → Client ID |
| `CATALYST_CLIENT_SECRET` | Settings → API & Credentials → Client Secret |

---

## Step 3: Configure Catalyst Services

### 3a. Create Data Store Tables

**Console:** Catalyst Console → Data Store → Tables

Create these 10 tables. For each table, click **"Create Table"** and enter the name and primary key.

| # | Table Name | Primary Key |
|---|---|---|
| 1 | `ci_users` | USER_ID |
| 2 | `ci_cases` | CASE_ID |
| 3 | `ci_suspects` | SUSPECT_ID |
| 4 | `ci_witnesses` | WITNESS_ID |
| 5 | `ci_evidence_metadata` | EVIDENCE_ID |
| 6 | `ci_case_timeline` | EVENT_ID |
| 7 | `ci_notifications` | NOTIFICATION_ID |
| 8 | `ci_audit_logs` | LOG_ID |
| 9 | `ci_faiss_index_meta` | VERSION_ID |
| 10 | `ci_embedding_cache` | CACHE_ID |

For column definitions, refer to `docs/DATABASE_DESIGN.md` Section 3.

### 3b. Create File Store Buckets

**Console:** Catalyst Console → File Store → Buckets

| Bucket Name | Purpose |
|---|---|
| `evidence-files` | Store uploaded evidence (PDFs, images, videos) |
| `faiss-index` | Store FAISS vector index files |
| `exports` | Store generated reports |

### 3c. Configure Authentication

**Console:** Catalyst Console → Authentication

1. Enable **Email & Password** login method
2. Set password policy:
   - Min length: **8**
   - Require: uppercase, lowercase, digit, special character
3. Session: token expiry **60 minutes**

---

## Step 4: Install Catalyst CLI & Authenticate

```bash
# Install CLI
npm install -g zoho-catalyst-cli

# Login (opens browser for OAuth)
catalyst login

# Verify
catalyst whoami
```

---

## Step 5: Configure Environment Variables

Create `backend/.env` on your local machine (this file is in `.gitignore` — never commit it):

```ini
CATALYST_PROJECT_ID=your_project_id_from_step_2
CATALYST_CLIENT_ID=your_client_id_from_step_2
CATALYST_CLIENT_SECRET=your_client_secret_from_step_2
JWT_SECRET=generate-a-random-32-char-string-here!
JWT_EXPIRY_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173,https://crimeintelai-12345.catalysthost.com
RATE_LIMIT_PER_MINUTE=100
MAX_UPLOAD_SIZE_MB=25
LOG_LEVEL=INFO
DATA_STORE_TABLE_PREFIX=ci_
```

> **Note:** The `ALLOWED_ORIGINS` must include both your local dev URL **and** your Catalyst hosting URL. The hosting URL is visible in Catalyst Console → Hosting after deployment (usually `https://{project}-{id}.catalysthost.com`).

---

## Step 6: Deploy Backend (Catalyst Functions)

```bash
cd backend

# Initialize as Catalyst Function
catalyst init

# Interactive prompts:
# ? Select component: Function
# ? Function name: crimeintel-api
# ? Runtime: Python 3.11
# ? Memory: 1024 MB
# ? Timeout: 30 seconds

# This creates catalyst-config.json and catalyst-function.json

# Set environment variables (inject your .env values)
catalyst variable:create CATALYST_PROJECT_ID --value "your_value"
catalyst variable:create CATALYST_CLIENT_ID --value "your_value"
catalyst variable:create CATALYST_CLIENT_SECRET --value "your_value"
catalyst variable:create JWT_SECRET --value "your_value"
catalyst variable:create ALLOWED_ORIGINS --value "https://crimeintelai-12345.catalysthost.com"
# ... repeat for all env vars

# Deploy
catalyst deploy --project crimeintel-api --force
```

**Your API will be available at:**
```
https://{project}-{id}.catalystfunctions.com/crimeintel-api/api/v1/health
```

Test it:
```bash
curl https://{project}-{id}.catalystfunctions.com/crimeintel-api/api/v1/health
# Expected: {"status": "ok", "timestamp": "..."}
```

---

## Step 7: Deploy Frontend (Catalyst Hosting)

```bash
cd frontend

# 1. Set the production API URL before building
# Create frontend/.env (NOT committed):
echo "VITE_API_URL=https://{project}-{id}.catalystfunctions.com/crimeintel-api/api/v1" > .env

# 2. Build
npm run build

# 3. Initialize hosting
catalyst init

# Interactive prompts:
# ? Select component: Hosting
# ? Type: SPA (Single Page Application)
# ? Build output directory: dist/

# 4. Deploy
catalyst deploy --project crimeintel-frontend --force
```

**Your app will be available at:**
```
https://{project}-{id}.catalysthost.com
```

---

## Step 8: Seed Data & Build FAISS Index

After both backend and frontend are deployed:

### Option A: Run locally (pointing to deployed Catalyst)

```bash
cd backend

# Ensure .env has deployed credentials
python scripts/seed_database.py

python scripts/build_faiss_index.py
```

### Option B: Trigger via API (after deploying)

The backend exposes these endpoints (if you added them):
```
POST /admin/seed    → triggers data seeding
POST /admin/rebuild-index → triggers FAISS rebuild
```

---

## Step 9: Verify End-to-End

```bash
# 1. Health check
curl https://{project}-{id}.catalystfunctions.com/crimeintel-api/api/v1/health
# → {"status": "ok", "timestamp": "..."}

# 2. Login (test credentials)
curl -X POST https://{project}-{id}.catalystfunctions.com/crimeintel-api/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ksp.gov.in","password":"Admin123!"}'
# → {"data": {"access_token": "...", "user": {...}}}

# 3. Open the app in browser
open https://{project}-{id}.catalysthost.com
```

---

## Step 10: Set Up CI/CD (Optional)

The `.github/workflows/deploy.yml` already exists. To use it:

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:

| Secret Name | Value |
|---|---|
| `CATALYST_PROJECT_ID` | From Step 2 |
| `CATALYST_CLIENT_ID` | From Step 2 |
| `CATALYST_CLIENT_SECRET` | From Step 2 |
| `JWT_SECRET` | Generate a random string |
| `CATALYST_FUNCTION_NAME` | `crimeintel-api` |
| `CATALYST_HOSTING_NAME` | `crimeintel-frontend` |

3. Go to **Actions** → **Deploy to Catalyst** → **Run workflow**

---

## Architecture After Deployment

```
User's Browser
    │
    ▼
https://crimeintel-abc123.catalysthost.com
    │  (React SPA)
    │
    │  API calls to:
    ▼
https://crimeintel-abc123.catalystfunctions.com/crimeintel-api/api/v1/
    │  (FastAPI on Catalyst Functions)
    │
    ├──► Catalyst Data Store (10 tables)
    ├──► Catalyst File Store (3 buckets)
    ├──► Catalyst Authentication (JWT)
    └──► AI Pipeline (Sentence Transformers + FAISS in-process)
```

---

## Troubleshooting: GitHub → Catalyst Connection

| Symptom | Cause | Fix |
|---|---|---|
| `catalyst login` fails | Not authenticated | Run `catalyst login` again |
| CORS error in browser | ALLOWED_ORIGINS missing hosting URL | Update env var and redeploy |
| Function times out (502) | Model loading too slow | Set timeout to 30s, memory to 1024MB |
| "Table not found" | Tables not created | Create all 10 tables in Data Store |
| 401 on all API calls | JWT_SECRET mismatch | Check JWT_SECRET env var |
| Blank page in browser | SPA routing not configured | Add the SPA redirect script (already in index.html) |
| File upload fails | File Store bucket missing | Create `evidence-files` bucket |
