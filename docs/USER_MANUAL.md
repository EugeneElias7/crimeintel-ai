# USER MANUAL

## CrimeIntel AI — Intelligent Investigation Assistant

---

# TABLE OF CONTENTS

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [CRIMA AI Chat](#4-crima-ai-chat)
5. [Case Explorer](#5-case-explorer)
6. [Evidence Management](#6-evidence-management)
7. [Analytics](#7-analytics)
8. [Heat Maps](#8-heat-maps)
9. [Reports](#9-reports)
10. [Administration](#10-administration)
11. [Settings](#11-settings)
12. [FAQ](#12-faq)

---

# 1. INTRODUCTION

## What is CrimeIntel AI?

CrimeIntel AI is an AI-powered crime intelligence platform developed for the Karnataka State Police. It helps officers search, analyze, summarize, and manage criminal records using a conversational AI assistant called **CRIMA AI**.

## Key Features

- **CRIMA AI** — Ask questions in natural language: "Find theft cases near Majestic" or "Summarize case FIR-2026-000001"
- **Semantic Search** — AI understands meaning, not just keywords
- **Case Explorer** — Browse and view detailed case information
- **Evidence Management** — Upload and organize case evidence
- **Analytics** — View crime statistics and trends
- **Heat Maps** — Visualize crime hotspots on a map
- **Reports** — Generate case summaries

## User Roles

| Role | Permissions |
|---|---|
| **Officer** | View cases, upload evidence, use CRIMA AI, view analytics |
| **Inspector** | Officer permissions + edit cases, manage suspects/witnesses |
| **Admin** | Inspector permissions + user management, audit logs |
| **Super Admin** | Full system access |

---

# 2. GETTING STARTED

## Logging In

1. Open the CrimeIntel AI URL in your browser
2. Enter your **Email** and **Password**
3. Click **"Sign In"**

> **First time?** Contact your system administrator for credentials.

## Understanding the Interface

After logging in, you'll see:

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]  [Sidebar]                            [👤 User]  │
├──────────┬───────────────────────────────────────────────┤
│          │  Dashboard Content                             │
│  Sidebar │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│  ─────── │  │ KPI │ │ KPI │ │ KPI │ │ KPI │            │
│  📊 Dash │  └─────┘ └─────┘ └─────┘ └─────┘            │
│  🤖 CRIMA│                                               │
│  📁 Cases│  [Charts]                  [Recent Cases]    │
│  📎 Evid.│                                               │
│  📈 Analy│  [Quick Actions]                              │
│  🗺️ Heat │                                               │
│  ⚙️ Admin│                                               │
│  👤 Sett.│                                               │
└──────────┴───────────────────────────────────────────────┘
```

- **Sidebar** (left): Navigate between modules
- **Main area** (center): Module content
- **Top bar**: User menu, notifications

---

# 3. DASHBOARD

The dashboard is your home screen. It shows:

## KPI Cards
- **Total Cases** — All cases in the system
- **Open Cases** — Cases under investigation
- **Clearance Rate** — Percentage of cases resolved
- **My Cases** — Cases assigned to you (role-dependent)

## Charts
- **Crime Type Distribution** (Pie Chart) — Breakdown of cases by crime type
- **Monthly Trend** (Line Chart) — Cases filed per month

## Recent Cases
- Last 10 updated cases with quick links
- Click any case to open it in Case Explorer

## Quick Actions
- **🔍 Search Cases** — Opens the Case Explorer
- **🤖 Open CRIMA AI** — Opens the AI chat

---

# 4. CRIMA AI CHAT

CRIMA AI is your intelligent investigation assistant. It understands natural language and helps you find information quickly.

## How to Use

1. Click **"CRIMA AI"** in the sidebar
2. Type your question in the chat input at the bottom
3. Press **Enter** or click **Send**
4. CRIMA AI will respond with relevant information

## Example Queries

| Query Type | Example |
|---|---|
| Find cases | "Find theft cases in Bangalore" |
| Case details | "Show me case FIR-2026-000001" |
| Search suspects | "Find suspects named Ravi Kumar" |
| Summarize | "Summarize case FIR-2026-000001" |
| Statistics | "How many cases this month?" |
| Location | "Cases near MG Road" |
| Cross-reference | "Which suspects appear in multiple cases?" |

## Understanding Responses

Each response shows:
- **Answer text** — Natural language response
- **Case results** — Matching cases with confidence scores
- **Confidence badge** — 🟢 High (>80%), 🟡 Medium (60-80%), 🔴 Low (<60%)
- **Sources** — Clickable case IDs to open details

## Tips for Best Results

- Be specific: Include dates, locations, and names
- Use follow-up questions: "What about last month?"
- If no results: Try rephrasing your query
- For case details: Use the exact Case ID (e.g., FIR-2026-000001)

---

# 5. CASE EXPLORER

Browse and search all criminal cases.

## Searching Cases

1. Click **"Case Explorer"** in the sidebar
2. Use the **search bar** to search across case IDs, FIR numbers, and descriptions
3. Use **filters** to narrow down by:
   - Crime Type (theft, assault, murder, etc.)
   - Status (Open, Under Investigation, Closed, Filed)
   - District
   - Date Range
4. Click column headers to **sort**

## Viewing a Case

Click any case in the list to open the **Case Detail** view:

### FIR Information
- Case ID, FIR Number, Crime Type, Date Filed
- Location, District, GPS Coordinates
- Investigating Officer
- Full FIR Description

### Suspects
- Names, aliases, ages, photos
- Known associates
- Criminal history
- Status (Wanted, Arrested, Released, Convicted)

### Witnesses
- Names and contact information
- Statement summaries
- Credibility scores

### Timeline
- Chronological list of case events
- Each event shows: date, type, description, involved officer

### Evidence
- All evidence files linked to this case
- Click to open the Evidence Gallery

### Related Cases
- Cases with similar suspects, locations, or crime types
- Similarity score shown for each

---

# 6. EVIDENCE MANAGEMENT

Upload and manage case evidence files.

## Uploading Evidence

1. Click **"Evidence"** in the sidebar
2. Select a case from the dropdown
3. Either:
   - Drag and drop a file into the upload zone
   - Click "Browse Files" to select a file
4. Add an optional description
5. Mark as **Sensitive** if needed (Inspector+ only)
6. Click **"Upload"**

### Supported File Types

| Type | Max Size |
|---|---|
| PDF | 25 MB |
| JPEG / PNG | 25 MB |
| MP4 | 25 MB |

## Viewing Evidence

- Evidence is shown in a gallery grid
- Click any item to preview:
  - Images: Full-size preview
  - PDFs: Icon with download option
  - Videos: In-browser player
- Filter by file type using the filter buttons

---

# 7. ANALYTICS

View crime statistics and trends.

## Accessing Analytics

Click **"Analytics"** in the sidebar.

## What You'll See

| Widget | Description |
|---|---|
| KPI Cards | Total, Open, Closed cases, Clearance Rate |
| Crime Distribution | Pie chart of cases by crime type |
| Monthly Trends | Line chart of cases over time |
| Cases by District | Bar chart of cases by district |
| Status Breakdown | Bar chart of case statuses |

## Filtering

Use the **date range filter** at the top to change the time period:
- **7d** — Last 7 days
- **30d** — Last 30 days
- **12m** — Last 12 months
- **Custom** — Pick any date range

---

# 8. HEAT MAPS

Visualize crime incidents on an interactive map.

## Accessing Heat Maps

Click **"Heat Maps"** in the sidebar.

## Using the Map

- **Zoom** — Scroll to zoom in/out, or use +/- buttons
- **Pan** — Click and drag to move the map
- **Hotspots** — Areas with higher crime density appear in red
- **Click** a hotspot for details (case count, crime types)

## Filters

Use the right sidebar to filter:
- **Crime Type** — Select one or more types
- **Date Range** — Pick a date range
- **District** — Select a district

## Legend

```
🟦 Blue   — Low crime density
🟩 Green  — Moderate
🟨 Yellow — Elevated
🟧 Orange — High
🟥 Red    — Very high (hotspot)
```

---

# 9. REPORTS

Generate structured case reports.

## Case Report

1. Click **"Reports"** in the sidebar
2. Select a case from the dropdown
3. Click **"Generate Report"**
4. View the structured report with all case details
5. Click **"Print"** to print or save as PDF

## Summary Report

1. Click **"Reports"** > **Summary Report**
2. Select date range and optional district
3. Click **"Generate"**
4. View KPIs, charts, and data tables

---

# 10. ADMINISTRATION

Available only for Admin and Super Admin roles.

## User Management

1. Click **"Administration"** > **Users**
2. View all users in a table
3. Click **"Add User"** to create a new user
4. Click **Edit** (✏️) to modify a user
5. Click **Disable** to deactivate a user

### User Fields

| Field | Description |
|---|---|
| Display Name | Full name of the officer |
| Email | Login email address |
| Badge Number | KSP badge/ID number |
| Phone | Contact number |
| Role | Officer, Inspector, Admin, or Super Admin |
| Status | Active, Inactive, or Disabled |

## Audit Logs

1. Click **"Administration"** > **Audit Logs**
2. View all user actions with timestamps
3. Use filters to narrow down:
   - By user
   - By action type
   - By date range
4. Click any row to see full details

---

# 11. SETTINGS

Manage your profile and preferences.

## Profile

- Update your **Display Name**, **Phone**, and **Badge Number**
- Click **"Save"** to apply changes

## Security

- Change your password
- Requires: Current password + New password (min 8 chars, must include uppercase, lowercase, digit, special character)

## Notifications

Toggle which notifications you receive:
- 🔔 Case Assigned to You
- 🔔 Case Status Changed
- 🔔 Evidence Uploaded to Your Case

---

# 12. FAQ

**Q: I forgot my password. What do I do?**

Click "Forgot Password?" on the login page. A reset link will be sent to your registered email.

**Q: CRIMA AI doesn't understand my query. What should I do?**

Try rephrasing. Be specific with names, dates, and locations. Example: instead of "find cases", try "find theft cases in Bangalore from last month".

**Q: Can I download evidence files?**

Yes. Click on the evidence item in the gallery and use the download option.

**Q: How do I mark a case as closed?**

Inspectors and above can update case status from the Case Detail page by clicking the "Edit" button.

**Q: Who can see sensitive evidence?**

Only Inspectors and above. Officer-level users will see "Sensitive — Access Restricted" instead of the file.

**Q: Can I use CrimeIntel AI on my phone?**

The web interface is responsive and works on tablets. A mobile app is planned for a future release.

**Q: How is data secured?**

- All data is encrypted in transit (HTTPS/TLS)
- Authentication via Zoho Catalyst
- Role-based access control
- All actions are logged for audit

---

# END OF USER MANUAL
