# UI_DESIGN.md

> **CrimeIntel AI** — design system (final: **Meridian** theme)
> Status: Phase 0 — approved design direction. Updated to remove placeholder defaults.

---

## 1. Design Direction

**"Meridian"** — a command-center intelligence console: deep-navy navigation, calm light content, cyan/blue accents, precision typography, subtle motion. Think Linear/Sentry-class SaaS polish — never the generic "AI default" look (no centered hero text, no default purple gradients).

Three pillars:
1. **Elegant, dense text** — left-aligned, well-set type hierarchy, generous line-height, no lorem-style filler in UI.
2. **Confident surfaces** — quiet borders, layered shadows, one accent color used with discipline.
3. **Living motion** — subtle 3D tilts, staggered entrances, animated loaders, chart animations — all from open-source libraries.

## 2. Approved UI Libraries (open-source)

| Library | Purpose |
|---|---|
| `motion` (framer-motion successor) | Page transitions, 3D tilt cards, staggered lists, micro-interactions |
| `recharts` | Smooth animated analytics charts (bar, donut, line, area) |
| `lucide-react` | Consistent thin-stroke icon set |

Base: React 18 + TypeScript + Tailwind CSS (unchanged).

## 3. Design Tokens

### Colors — Meridian palette

| Token | Value | Usage |
|---|---|---|
| `--color-ink-950` | `#0B1220` | Sidebar + header chrome (deep navy) |
| `--color-ink-900` | `#111A2C` | Dark hover states, dropdown menus |
| `--color-ink-600` | `#475569` | Secondary text |
| `--color-ink-400` | `#94A3B8` | Muted text, captions |
| `--color-bg` | `#F6F8FB` | App background (cool light) |
| `--color-surface` | `#FFFFFF` | Cards, tables, modals |
| `--color-border` | `#E2E8F0` | Borders, dividers (hairline weight) |
| `--color-primary-600` | `#2563EB` | Primary buttons, links, active nav accent |
| `--color-primary-500` | `#3B82F6` | Hovers |
| `--color-cyan-500` | `#06B6D4` | **Signature accent** — highlights, progress, AI elements |
| `--color-cyan-50` | `#ECFEFF` | AI message tint, selected states |
| `--color-success-600` | `#059669` | Closed/success |
| `--color-warning-600` | `#D97706` | Pending/warning |
| `--color-danger-600` | `#DC2626` | Errors, critical priority |
| `--color-chart-1..6` | `#2563EB` `#06B6D4` `#059669` `#D97706` `#7C3AED` `#E11D48` | Charts (consistent series order) |

### Case status colors

| Status | Color |
|---|---|
| open | blue `#2563EB` |
| under_investigation | amber `#D97706` |
| closed | green `#059669` |
| archived | slate `#64748B` |

### Priority colors

`low` slate → `medium` blue → `high` amber → `critical` red with filled badge.

### Typography

| Element | Spec |
|---|---|
| Font family | **Inter** for UI (400/500/600/700), `ui-monospace` for case numbers |
| Display / page title | 20–22 px, 600, `letter-spacing: -0.01em` |
| Section title | 15 px, 600 |
| Body | 14 px, 400, line-height 1.6 |
| Small / captions | 12 px, 400, uppercase tracking `0.04em` for labels |
| Numbers | tabular numerals (`font-variant-numeric: tabular-nums`) |

**Text rules (anti-generic):** no centered paragraphs; headlines left-aligned; labels uppercase+tracked; max line length ~70ch for descriptions.

### Shape / elevation / motion

- Radius: 10 px cards, 8 px buttons, 999 px badges.
- Spacing: 4 px scale (4/8/12/16/24/32/48).
- Shadows: `0 1px 2px rgba(11,18,32,.06), 0 4px 12px rgba(11,18,32,.06)` for cards; elevated modal `0 12px 40px rgba(11,18,32,.18)`.
- Motion timing: 150–250 ms ease-out for micro-interactions; 240–320 ms for page transitions; stagger 40–60 ms for lists.
- 3D accent: card tilt only on "feature" surfaces (CRIMA suggestion cards, KPI cards) — max 4° rotation + glow on hover, disabled when `prefers-reduced-motion`.

## 4. Layout

- **App shell:** fixed left sidebar (264 px, `ink-950`) + top header (64 px, white, hairline bottom border) + content on `--color-bg`.
- **Sidebar:** logo mark (shield in `cyan-500` on navy) + "CrimeIntel AI" wordmark; nav groups: *OVERVIEW* (Dashboard, CRIMA AI), *RECORDS* (Cases, Evidence, Analytics, Reports), *SYSTEM* (Admin, Settings). Active = `cyan-500` left rail + white text on `ink-900`; icons `lucide-react` 18 px, `ink-400` idle.
- **Header:** page title left; right side: global case-jump search (`CASE-1024`), notifications bell (cyan dot when unread, dropdown with animate-in), user menu (avatar initials, name, role, logout).
- **Persistent notice:** in CRIMA AI footer only — *"Demo environment — synthetic data only."* as quiet `ink-400` 12px line.

## 5. Screens

### Login
Full-screen `ink-950` with subtle radial cyan glow (CSS only), centered card (max 420 px) with logo, username/password, demo-credential hint box (admin/kavya). Card entrance: fade + 8 px rise. Error: red inline banner with shake-on-appear.

### Dashboard
- 4 KPI cards (Total, Open, Critical, Resolved this month): 3D-tilt on hover, delta chip, count in tabular numerals, chart sparkline.
- Charts row: **cases by district** (animated bar), **cases by category** (animated donut with center total). Hover tooltips (motion spring), legend below.
- Recent cases table (row hover `cyan-50`) + **recent activity** feed (icon timeline, `lucide` glyphs per action).
- "Ask CRIMA AI" primary CTA (cyan glow on hover).

### CRIMA AI (hero — most polished surface)
- Left rail: conversation list (compact, active row `ink-900` on navy? — content stays light; conversation rail uses white with `cyan-50` active.
- Main: chat thread with **user bubbles right** (`primary-600`, white text) and **assistant bubbles left** (white surface, hairline border) with intent tag chip + confidence badge (< 0.85 shown).
- **Source chips** under each answer: `CASE-1032 · 0.93` pill (cyan tint) → opens Case Detail. Slide-in animation on arrival.
- Right context panel (≥1280 px): sources as rich cards (case number mono, title, district, score bar), evidence summary, follow-up suggestions (3D-tilt chips).
- Composer: single-line textarea with auto-grow, send button (cyan), **suggested-question chips** above composer on empty thread; typing indicator: three bouncing dots (open-source CSS implementation).
- Empty state: 5 capability cards (the canonical question types) with tilt + glow.

### Case Explorer
- Filter bar: selects (district/category/status/priority) + date range + debounced search; result count line ("128 cases"); **Clear filters** link.
- Table: case # (mono, cyan link), Title, Category, District, Status badge, Priority badge, Occurred, Evidence count (`tabular-nums`). Row hover + click → detail. Pagination with jump.
- Loading: skeleton rows with shimmer (CSS keyframes), never spinners for tables.

### Case Detail
- Header band: case number mono large + title, badges (status/priority), edit (role-gated).
- Tabs: **Overview** (description prose + details grid), **Persons** (suspects/victims/witnesses as cards with status chips), **Timeline** (vertical line, `cyan-500` dots, actor + time), **Evidence** (card grid: type icon, name, size, download), **Similar Cases** (score-badged cards, tilt on hover).
- Delete confirm modal: red action, motion scale-in + backdrop fade.

### Evidence
- Drag-drop upload zone (dashed border → cyan border on hover-drag, animated icon), typed grid/table, click → side panel preview (metadata + actions), download/delete.

### Analytics
- Filter bar (district/category/date) + chart set: animated bar (district), donut (category), horizontal bars (status), **smooth area chart** (monthly trend; recharts default animation + custom tooltip), average resolution days KPI. Export chart as PNG (canvas) — P1.

### Reports
- Table of reports (title, type, status badge with animated "generating" pulse, date, author, download). Generate modal with type + param selects.

### Admin
- Tabs: **Users** (table + create/edit modal, role select, activate toggle with spring switch), **Audit Logs** (filterable table, mono timestamps), **Settings** (forms + dataset info card + AI toggle).

### Notifications / NotFound
- Bell dropdown (animated list, mark-read on click); 404: navy panel, animated shield icon, back-to-dashboard.

## 6. Responsive Behavior

- **≥1280 px:** full sidebar + context panel.
- **768–1279 px:** sidebar → icon rail (72 px); context panel → drawer.
- **<768 px:** mobile nav bar; tables scroll horizontally; charts stack. Desktop-first (mobile polish P1).

## 7. Loading States

- Route transitions: 200 ms fade/slide; top progress bar on navigation.
- Data views: shimmer skeletons matching final layout (no layout shift).
- Buttons: inline spinner (border-spin, open-source) + disabled.
- Charts: recharts built-in entrance animation.
- CRIMA: three-dot typing indicator + "CRIMA is thinking…" caption; skeleton for sources panel.

## 8. Error States

- Toast system top-right (motion slide-in, auto-dismiss 5 s): success (green check), error (red alert), info (cyan).
- API errors: friendly message + Retry where safe.
- Full-page error boundary with Reload.
- CRIMA failure bubble: danger-tinted assistant bubble + "Try rephrasing".

## 9. Empty States

Pattern: icon in soft circle (`cyan-50`), title, one-line hint, primary action ("Clear filters", "Ask CRIMA AI", "Upload evidence"). Enters with fade+rise.

## 10. Accessibility

- AA contrast (verified against Meridian tokens); focus rings `2px cyan-500`; labels visible; hit targets ≥ 40 px; semantic HTML + aria on icon buttons/chat; **all motion respects `prefers-reduced-motion`**.

## 11. Status

Design system **finalized** (Meridian approved 2026-08-11). No UI code exists yet — first screens land Phase 2+.