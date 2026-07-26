# CrimeIntel AI

**Intelligent Conversational AI for KSP Crime Database**

CrimeIntel AI is an AI-powered Crime Intelligence Platform developed as a prototype for Karnataka State Police (KSP). It enables officers to search, analyze, summarize and manage criminal records using conversational AI through an intelligent assistant called **CRIMA AI**.

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Zoho Catalyst account (for deployment)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open `http://localhost:5173` for the app and `http://localhost:8000/docs` for API docs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, TailwindCSS |
| Backend | FastAPI (Python 3.11) |
| Cloud | Zoho Catalyst |
| Auth | Catalyst Authentication |
| Database | Catalyst Data Store (NoSQL) |
| Storage | Catalyst File Store |
| AI | Sentence Transformers, FAISS |
| Maps | Leaflet |
| Charts | Recharts |

---

## Project Structure

```
crimeintel-ai/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service modules
│   │   ├── context/       # React context providers
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── ...
├── backend/           # FastAPI server
│   ├── routers/       # API route handlers
│   ├── services/      # Business logic
│   ├── models/        # Pydantic schemas
│   ├── adapters/      # Catalyst SDK wrappers
│   └── ...
├── docs/              # Documentation
│   ├── PRD_CrimeIntel_AI.md
│   ├── SDD_CrimeIntel_AI.md
│   ├── UI_UX_SPECIFICATION.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPECIFICATION.md
│   └── ...
└── README.md
```

---

## Documentation

All project documentation is in the `docs/` directory:

| Document | Description |
|---|---|
| `PRD_CrimeIntel_AI.md` | Product Requirements Document |
| `SDD_CrimeIntel_AI.md` | Software Design Document |
| `UI_UX_SPECIFICATION.md` | UI/UX Design Specification |
| `DATABASE_DESIGN.md` | Database Schema & Data Dictionary |
| `API_SPECIFICATION.md` | REST API Documentation |

---

## Modules

| Module | Description |
|---|---|
| **CRIMA AI** | Conversational AI for natural language crime data queries |
| **Case Explorer** | Browse, search, and view case details (FIR, suspects, witnesses, timeline) |
| **Evidence** | Upload and manage case evidence files |
| **Analytics** | Crime statistics, trends, and distribution charts |
| **Heat Maps** | Geospatial crime visualization |
| **Reports** | Case and summary report generation |
| **Admin** | User management, audit logs, system configuration |

---

## License

MIT License — see [LICENSE](./LICENSE).

---

## Team

**Pixel Pirates** — KSP Hackathon 2026
