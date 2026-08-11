# UI_DESIGN.md

> **CrimeIntel AI** — design system and screen guidance
> Status: Phase 0 — design only. This document follows the approved Figma design direction; where the Figma file is not yet transferred to the repo, the tokens below are the working defaults and must be reconciled with the Figma file when available.

---

## 1. Design Direction

Professional, calm, trustworthy law-enforcement intelligence product. Light content area, deep navy sidebar, blue primary actions, generous whitespace, data-dense but scannable tables. CRIMA AI gets a distinct chat experience with prominent source references — it is the hero feature.

## 2. Design Tokens

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-ink-900` | `#0F172A` | Sidebar background, primary dark text |
| `--color-ink-600` | `#475569` | Secondary text |
| `--color-ink-400` | `#94A3B8` | Muted text |
| `--color-bg` | `#F1F5F9` | App background |
| `--color-surface` | `#FFFFFF` | Cards, tables, modals |
| `--color-border` | `#E2E8F0` | Borders, dividers |
| `--color-primary-600` | `#2563EB` | Primary buttons, links, active nav |
| `--color-primary-50` | `#EFF6FF` | Selected row, soft accents |
| `--color-success-600` | `#16A34A` | Closed/success |
| `--color-warning-600` | `#D97706` | Pending/warning |
| `--color-danger-600` | `#DC2626` | Errors, critical priority |
| `--color-chart-1..5` | blue, teal, violet, amber, rose | Charts |

### Case status colors

| Status | Color |
|---|---|
| open | blue (`--color-primary-600`) |
| under_investigation | amber (`--color-warning-600`) |
| closed | green (`--color-success-600`) |
| archived | slate/gray |

### Priority colors

`low` slate · `medium` blue · `high` amber · `critical` red (with badge)

### Typography

| Element | Spec |
|---|---|
| Font family | Inter (fallback: system sans) |
| Display / page title | 20–24 px, 600 weight |
| Section title | 16 px, 600 |
| Body | 14 px, 400 |
| Small / captions | 12 px, 400 |
| Tables | 14 px / 13 px, tabular numerals for numbers |
| Monospace | case numbers in `ui-monospace`, 13 px |

### Shape / spacing

- Border radius: 8 px (cards), 6 px (buttons/inputs), 999 px (badges/chips).
- Spacing scale: 4 px base (4/8/12/16/24/32/48).
- Shadows: soft `0 1px 3px rgba(15,23,42,.08)`; elevation for modals/dropdowns slightly stronger.
- Grid: 12-column max-width 1400 px content.

## 3. Layout

- **App shell:** fixed left sidebar (260 px, ink-900) + top header (64 px, white) + scrollable content area (`--color-bg`).
- **Sidebar:** logo area "CrimeIntel AI" + shield mark; nav sections: *Overview* (Dashboard, CRIMA AI), *Records* (Cases, Evidence, Analytics, Reports), *System* (Admin, Settings). Active item = white text + primary accent bar; badge for unread notifications.
- **Header:** page title + search (jump to case, e.g. `CASE-1024`), notifications bell, user menu (name, role, logout).
- **Footer area / system notice:** persistent small banner in CRIMA AI page: *"Demo environment — synthetic data only."*

## 4. Screens

### Login
Centered card on ink-900 background; sign-in mark; fields: username, password; error banner for bad credentials; demo credentials hint (admin/investigator) for the hackathon demo.

### Dashboard
- 4 KPI cards (Total cases, Open, Critical, Resolved this month) with delta hints.
- Charts row: cases by district (bar), cases by category (donut).
- Recent cases table + recent activity feed.
- Quick action: "Ask CRIMA AI" button (primary call-to-action).

### CRIMA AI (hero)
- Left: conversation list (resume sessions). Main: chat thread.
- Right (≥ 1280 px): **Context panel** — sources from the last answer as clickable case cards (case number, title, district, score), evidence summary, and follow-up suggestion chips.
- Message bubbles: user right (primary), assistant left (surface) with intent tag (`case_search`, etc.) and confidence badge when < 0.85.
- Sources rendered under assistant answers as chips: `CASE-1032 · 0.93` → opens Case Detail.
- Composer: textarea + send; suggested-question chips above composer when thread is empty; typing indicator while waiting; feedback thumbs up/down per assistant message.
- Empty state: capability cards (the 5 canonical question types).

### Case Explorer
- Filter bar (district select, category select, status select, priority, date range, free-text search) + result count.
- Table: Case # (mono link), Title, Category, District, Status badge, Priority badge, Occurred date, Evidence count. Row click → Case Detail. Pagination footer.
- Empty state: "No cases match your filters" + clear-filters button.
- Loading skeletons for rows.

### Case Detail
- Header: case number + title, status/priority badges, edit button.
- Tabs: **Overview** (description, details grid: district, locality, dates, assigned to, created by), **Persons** (suspects/victims/witnesses cards with status), **Timeline** (vertical timeline of events with actor + time), **Evidence** (grid of evidence cards: type icon, name, size, download), **Similar Cases** (cards with similarity score).
- Delete case (confirm modal) for authorized roles.

### Evidence
- Gallery/list of evidence for a case; type icons; upload button (drag-drop); metadata side panel on click; download; delete with confirm.

### Analytics
- Filters (district, category, date range) + chart set: cases by district, by category, by status, monthly trend; average resolution time KPI.

### Reports
- List of generated reports (title, type, status, date, author) + "Generate report" modal (type + filter params); download when ready.

### Admin
- Tabs: **Users** (table + create/edit modal + role select + activate/deactivate), **Audit Logs** (filterable table: timestamp, user, action, entity, IP), **Settings** (forms: app name, dataset label, AI toggle).

### Notifications
- Bell dropdown: unread list, mark-read on click; link to "all notifications".

### 404 / NotFound
- Friendly centered state with link back to Dashboard.

## 5. Responsive Behavior

- **≥ 1280 px:** full sidebar + context panel in CRIMA AI.
- **768–1279 px:** sidebar collapses to icon rail (64 px); CRIMA context panel becomes collapsible drawer.
- **< 768 px:** bottom nav for primary sections; tables scroll horizontally; charts stack vertically. (MVP targets desktop-first; mobile polish is P1.)

## 6. Loading States

- Route-level: full-page spinner (primary color, small).
- Data views: skeleton rows/cards (animated shimmer), never blank.
- Buttons: inline spinner + disabled while submitting.
- CRIMA AI: "CRIMA is thinking…" typing indicator with animated dots; context panel shows skeleton while sources load.

## 7. Error States

- Toast system (top-right, auto-dismiss 5 s): success/info/error variants (`--color-success`/`--color-danger`).
- API errors: friendly message + retry button where idempotent.
- Full-page error boundary with "Reload" action.
- CRIMA AI failures: assistant message bubble in danger tint: "Sorry, I couldn't process that request. Try rephrasing." + nothing fabricated.

## 8. Empty States

- Consistent pattern: icon (slate), short title, one-line hint, primary action button when applicable ("Clear filters", "Ask CRIMA AI", "Upload evidence").

## 9. Accessibility Baseline

- AA contrast on text; focus rings (`:focus-visible` 2px primary); form labels always visible; buttons ≥ 40 px hit area; semantic HTML + `aria` labels on icon buttons and chat controls.

## 10. Current State

No UI code exists yet. Tokens above are defaults pending Figma reconciliation.