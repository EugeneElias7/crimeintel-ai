# UI/UX DESIGN SPECIFICATION

## CrimeIntel AI — Intelligent Conversational AI for KSP Crime Database

| Field | Value |
|---|---|
| **Project** | CrimeIntel AI |
| **Version** | 1.0 |
| **Based On** | PRD v1.0, SDD v1.0 |
| **Status** | Final |

---

# TABLE OF CONTENTS

1. [Design Philosophy](#1-design-philosophy)
2. [Information Architecture](#2-information-architecture)
3. [Navigation Flow](#3-navigation-flow)
4. [Screen Flow](#4-screen-flow)
5. [Design System](#5-design-system)
6. [Component Library](#6-component-library)
7. [Screen Specifications](#7-screen-specifications)
8. [Loading, Empty & Error States](#8-loading-empty--error-states)
9. [Accessibility](#9-accessibility)
10. [Responsive Behavior](#10-responsive-behavior)

---

# 1. DESIGN PHILOSOPHY

## Principles

| # | Principle | Description |
|---|---|---|
| P1 | **Clarity over Novelty** | Police officers need immediate comprehension. Every screen must communicate its purpose within 2 seconds. No experimental UI patterns. |
| P2 | **Conversation-First** | CRIMA AI is the primary interface for data retrieval. Traditional search/filter UI is secondary. The chat should feel like asking a colleague, not running a database query. |
| P3 | **Authority & Trust** | Dark blue primary palette conveys authority. Clean typography, generous whitespace, and structured layouts communicate reliability. Every data point is sourced and clickable. |
| P4 | **Progressive Disclosure** | Dashboards show summaries. Officers drill down for details. Information is layered — never overwhelming. |
| P5 | **Mobile-Ready, Desktop-First** | Primary use is at a station workstation (desktop). Responsive down to tablet for field use. Mobile is not a target for MVP. |

## Design Tone

| Attribute | Value |
|---|---|
| Voice | Professional, direct, neutral |
| Emotional response | Trust, clarity, efficiency |
| Visual density | Moderate — information-rich but scannable |
| Interaction feedback | Immediate, subtle (color changes, micro-animations < 200ms) |

---

# 2. INFORMATION ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        SITE MAP (Role-Filtered)                           │
│                                                                           │
│  ┌─────┐                                                                  │
│  │Login│                                                                  │
│  └──┬──┘                                                                  │
│     ▼                                                                     │
│  ┌─────────┐                                                             │
│  │Dashboard│ ──────────────────────────────────┐                         │
│  └────┬────┘                                   │                         │
│       │                                        │                         │
│  ┌────▼────┐  ┌──────────┐  ┌──────────┐  ┌────▼────┐  ┌─────────────┐  │
│  │CRIMA AI │  │   Case   │  │ Evidence │  │Analytics│  │  Heat Map   │  │
│  │  Chat   │  │ Explorer │  │          │  │         │  │             │  │
│  └─────────┘  └────┬─────┘  └────┬─────┘  └─────────┘  └─────────────┘  │
│                    │              │                                       │
│              ┌─────▼─────┐  ┌────▼─────┐                                 │
│              │Case Detail│  │Evidence  │                                 │
│              │           │  │Gallery   │                                 │
│              │─ Suspects │  └──────────┘                                 │
│              │─ Witnesses│                                               │
│              │─ Timeline │                                               │
│              │─ Evidence │                                               │
│              └───────────┘                                               │
│                                                                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐                           │
│  │ Admin:     │  │ Settings   │  │ Reports  │                           │
│  │ Users      │  │            │  │          │                           │
│  │ Audit Logs │  │─ Profile   │  │─ Case    │                           │
│  │ Config     │  │─ Password  │  │─ Summary │                           │
│  └────────────┘  │─ Prefs    │  └──────────┘                           │
│                  └──────────┘                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Content Hierarchy (Per Screen)

| Screen | Primary Content | Secondary Content | Tertiary |
|---|---|---|---|
| Dashboard | KPI Cards (4 values) | Recent Cases Table | Quick Actions |
| CRIMA AI | Chat Message List | Chat Input | Source References |
| Case List | Search Bar + Filters | Case Table | Pagination |
| Case Detail | FIR Information | Suspects + Witnesses | Timeline + Evidence |
| Evidence | Case Selector | Evidence Gallery | Upload Button |
| Analytics | KPI Row | Charts (2x2 grid) | Date Filter |
| Heat Map | Full-Width Map | Filter Panel | Legend |
| Admin Users | User Table | Create/Edit Modal | Search |
| Admin Audit | Audit Log Table | Filter | Export |
| Settings | Profile Form | Password Form | Preferences Toggle |

---

# 3. NAVIGATION FLOW

## Sidebar Navigation

```
┌──────────────────────────────────────────┐
│  ┌──────┐                                │
│  │ Logo │  CrimeIntel AI                 │
│  └──────┘                                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  📊  Dashboard                    │  │
│  ├────────────────────────────────────┤  │
│  │  🤖  CRIMA AI                     │  │
│  ├────────────────────────────────────┤  │
│  │  📁  Case Explorer                │  │
│  ├────────────────────────────────────┤  │
│  │  📎  Evidence                     │  │
│  ├────────────────────────────────────┤  │
│  │  📈  Analytics                    │  │
│  ├────────────────────────────────────┤  │
│  │  🗺️  Heat Maps                    │  │
│  ├────────────────────────────────────┤  │
│  │  📄  Reports                      │  │  ◀── Admin+ only
│  ├────────────────────────────────────┤  │
│  │  ⚙️  Administration               │  │  ◀── Admin+ only
│  │     ├── Users                     │  │
│  │     └── Audit Logs                │  │
│  ├────────────────────────────────────┤  │
│  │  👤  Settings                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  👤 SI Arun Kumar                 │  │
│  │     Officer                        │  │
│  │  [Logout]                          │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Navigation Rules

| Rule | Behavior |
|---|---|
| Active state | Highlighted sidebar item + blue left border indicator |
| Role filtering | Admin+ items hidden from Officer/Inspector (sidebar items removed) |
| Mobile collapse | Sidebar collapses to icon-only on < 1024px; hamburger toggle |
| Deep links | Clicking a case from dashboard → navigates to Case Detail |
| Breadcrumbs | Case Detail and Evidence Gallery show breadcrumb: Cases > FIR-2024-123 |

---

# 4. SCREEN FLOW

```
┌──────────┐     ┌────────────┐
│  Login   │────▶│ Dashboard  │────▶ CRIMA AI Chat
└──────────┘     └────────────┘       │
      │                │              │
      │                ▼              ▼
      │           Case Explorer   Case Explorer
      │                │              │
      │                ▼              ▼
      │           Case Detail    Case Detail
      │                │
      │                ▼
      │           Evidence Gallery
      │
      │                ▼
      │           Analytics / Heat Map
      │
      │                ▼
      │           Reports
      │
      │                ▼
      │           Admin / Settings
      │
      ▼
  [Logout] ─────▶ Login (session cleared)
```

---

# 5. DESIGN SYSTEM

## 5.1 Color Palette

### Primary Colors

```css
/* Police Authority Blue Theme */
--color-primary-50:  #EFF6FF
--color-primary-100: #DBEAFE
--color-primary-200: #BFDBFE
--color-primary-300: #93C5FD
--color-primary-400: #60A5FA
--color-primary-500: #1D4ED8   /* Primary brand color */
--color-primary-600: #1E40AF
--color-primary-700: #1E3A8A
--color-primary-800: #172554
--color-primary-900: #0F172A
```

### Neutral Colors

```css
--color-neutral-50:  #F8FAFC
--color-neutral-100: #F1F5F9
--color-neutral-200: #E2E8F0
--color-neutral-300: #CBD5E1
--color-neutral-400: #94A3B8
--color-neutral-500: #64748B
--color-neutral-600: #475569
--color-neutral-700: #334155
--color-neutral-800: #1E293B
--color-neutral-900: #0F172A
```

### Semantic Colors

```css
--color-success:     #059669   /* Green — case closed, success */
--color-warning:     #D97706   /* Amber — pending, low confidence */
--color-danger:      #DC2626   /* Red — error, critical priority */
--color-info:        #0284C7   /* Blue — information */
--color-confidence-high:  #059669  /* Green > 80% */
--color-confidence-medium: #D97706  /* Amber 60-80% */
--color-confidence-low:    #DC2626  /* Red < 60% */
```

### Dark Mode Overrides

```css
/* Dark mode — enable via class "dark" on <html> */
.dark {
  --color-bg-primary:    #0F172A
  --color-bg-secondary:  #1E293B
  --color-bg-tertiary:   #334155
  --color-text-primary:  #F1F5F9
  --color-text-secondary:#94A3B8
  --color-border:        #334155
}
```

### Color Usage Map

| Element | Light | Dark |
|---|---|---|
| Page background | Neutral-50 | Neutral-900 |
| Card/Surface | White | Neutral-800 |
| Sidebar | Primary-900 | Primary-900 |
| Primary button | Primary-500 | Primary-400 |
| Text primary | Neutral-900 | Neutral-50 |
| Text secondary | Neutral-500 | Neutral-400 |
| Border | Neutral-200 | Neutral-700 |
| Hover row | Primary-50 | Primary-900/50 |

## 5.2 Typography

### Font Family

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 2.25rem (36px) | 700 | 1.2 | Page titles (Dashboard, CRIMA AI) |
| Heading 1 | 1.5rem (24px) | 700 | 1.3 | Section headers |
| Heading 2 | 1.25rem (20px) | 600 | 1.4 | Card titles, modal headers |
| Heading 3 | 1.125rem (18px) | 600 | 1.4 | Subsection headers |
| Body | 0.938rem (15px) | 400 | 1.6 | Paragraphs, table cells |
| Body Small | 0.813rem (13px) | 400 | 1.5 | Metadata, timestamps |
| Caption | 0.75rem (12px) | 500 | 1.4 | Badges, labels, KPI values |
| Monospace | 0.875rem (14px) | 400 | 1.5 | Case IDs, FIR numbers |

## 5.3 Spacing

```css
/* Tailwind spacing scale — using rem values */
--space-1:  0.25rem  /* 4px */
--space-2:  0.5rem   /* 8px */
--space-3:  0.75rem  /* 12px */
--space-4:  1rem     /* 16px */
--space-5:  1.25rem  /* 20px */
--space-6:  1.5rem   /* 24px */
--space-8:  2rem     /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
```

### Spacing Patterns

| Pattern | Value |
|---|---|
| Page padding | 6 (24px) left/right, 8 (32px) top/bottom |
| Card padding | 6 (24px) |
| Section gap | 8 (32px) |
| Element gap (vertical) | 4 (16px) |
| Element gap (horizontal) | 3 (12px) |
| Table cell padding | 3 (12px) vertical, 4 (16px) horizontal |

## 5.4 Grid

```css
/* Layout grid */
--grid-cols: 12
--grid-gap: 6 (24px)

/* Sidebar width: 260px desktop, 64px collapsed */
/* Main content: calc(100vw - sidebar-width) */
```

### Common Grid Patterns

| Layout | Breakpoint | Columns |
|---|---|---|
| KPI Row | ≥ 1024px | 4 equal columns |
| Charts (2x2) | ≥ 1024px | 2 columns, equal |
| Form (single column) | All | 1 column, max-w-2xl |
| Case List | ≥ 1024px | Full-width table |
| Evidence Gallery | ≥ 768px | 3-4 column grid |

## 5.5 Border Radius

```css
--radius-sm:    0.25rem  /* 4px — badges, small elements */
--radius-md:    0.5rem   /* 8px — cards, inputs, buttons */
--radius-lg:    0.75rem  /* 12px — modals, large cards */
--radius-full:  9999px    /* pills, avatars */
```

## 5.6 Shadows

```css
--shadow-sm:    0 1px 2px rgba(0,0,0,0.05)
--shadow-md:    0 4px 6px rgba(0,0,0,0.07)
--shadow-lg:    0 10px 15px rgba(0,0,0,0.1)
--shadow-card:  0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
```

## 5.7 Icons

- **Library:** Lucide React (consistent, lightweight, tree-shakeable)
- **Size:** 16px (inline), 20px (buttons), 24px (nav items)
- **Style:** Outline, stroke-width 2
- **All icons use currentColor** for theme compatibility

---

# 6. COMPONENT LIBRARY

## 6.1 Button

### Variants

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | Primary-500 | White | None | Primary-600 |
| Secondary | White | Neutral-700 | Neutral-300 | Neutral-100 bg |
| Danger | Danger | White | None | Danger-700 |
| Ghost | Transparent | Neutral-600 | None | Neutral-100 bg |
| Outline | Transparent | Primary-500 | Primary-300 | Primary-50 bg |

### Sizes

| Size | Height | Padding | Font |
|---|---|---|---|
| sm | 32px | 8px 12px | 13px |
| md | 40px | 12px 20px | 15px |
| lg | 48px | 16px 28px | 15px |

### States

```css
/* All buttons */
enabled → hover → active → disabled (opacity-50, cursor-not-allowed)
loading: show spinner icon + hide text / keep text + small spinner prefix
```

## 6.2 Input / Form Field

```css
/* Structure */
┌──────────────────────────────────────────┐
│  Label (14px, semibold, Neutral-700)      │
│  ┌────────────────────────────────────┐  │
│  │  Icon  Input text...               │  │
│  │  ────────────────────────────────── │  │
│  │  border: Neutral-300, radius: md   │  │
│  │  focus: ring-2 primary-200         │  │
│  └────────────────────────────────────┘  │
│  Helper text (12px, Neutral-400)         │
│  Error text (12px, Danger)               │
└──────────────────────────────────────────┘
```

### States

| State | Border | Background |
|---|---|---|
| Default | Neutral-300 | White |
| Focus | Primary-500 + ring | White |
| Error | Danger | Danger-50 |
| Disabled | Neutral-200 | Neutral-100 |
| Read Only | Neutral-200 | Neutral-50 |

### Validation Feedback

- Inline validation on blur
- Submit validation on form submit
- Error: red border + error icon + error message below
- Success: green border + check icon

## 6.3 Table

```css
┌─────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Search...                                    [Filter] [Export] │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────┬──────────┬────────┬────────┬──────────┬────────────────┐  │ │
│  │CaseID│ Crime    │ Status │ Date   │ Location │ Officer        │  │ │
│  ├──────┼──────────┼────────┼────────┼──────────┼────────────────┤  │ │
│  │FIR…  │ Theft    │ █ Open │01-07   │ Bangalore│ SI Arun Kumar  │  │ │
│  │FIR…  │ Assault  │ █ Clsd │28-06   │ Mysore   │ Insp. Priya    │  │ │
│  │ ...  │ ...      │ ...    │ ...    │ ...      │ ...            │  │ │
│  └──────┴──────────┴────────┴────────┴──────────┴────────────────┘  │ │
│                                                                      │
│  Row hover: Primary-50 background                                    │
│  Striped: every-other-row Neutral-50 bg                              │
│  Sortable headers: click to sort asc/desc                            │
│                                                                      │
│  Empty state: "No cases found" with illustration                     │
└──────────────────────────────────────────────────────────────────────┘
```

## 6.4 Card

```css
┌────────────────────────────────────────┐
│  White bg, shadow-card, radius-lg      │
│  padding: 6 (24px)                     │
│                                        │
│  ┌──────────────┐                      │
│  │  Icon + Title│  Action button       │
│  └──────────────┘                      │
│                                        │
│  ── Divider (Neutral-100) ──          │
│                                        │
│  Content area                          │
│  ─────────────────────────────         │
│  Label: Value                          │
│  Label: Value                          │
└────────────────────────────────────────┘
```

## 6.5 Chat Message (CRIMA AI)

```css
┌──────────────────────────────────────────┐
│  User Message (right-aligned)            │
│  ┌────────────────────────────────────┐  │
│  │  Find theft cases near Majestic    │  │
│  │  in last 3 months                  │  │
│  │  10:32 AM                          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  CRIMA Response (left-aligned)          │
│  ┌────────────────────────────────────┐  │
│  │  🤖 CRIMA AI                       │  │
│  │                                     │  │
│  │  I found 12 cases matching your    │  │
│  │  query. Here are the top 5:        │  │
│  │                                     │  │
│  │  1. FIR-2024-789 — Theft, Majestic │  │
│  │     📅 15-Jun-2024                 │  │
│  │     🎯 Confidence: 94%             │  │
│  │                                     │  │
│  │  2. FIR-2024-567 — Chain Snatching │  │
│  │     📅 02-May-2024                 │  │
│  │     🎯 Confidence: 87%             │  │
│  │                                     │  │
│  │  [View all 12 cases →]             │  │
│  │                                     │  │
│  │  🔗 Sources: FIR-2024-789, FIR-...│  │
│  │  10:32 AM                          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Type your question...    [Send] ▶ │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## 6.6 KPI Card

```css
┌──────────────────────┐
│  Total Cases          │
│  1,234                │  ← 36px bold
│  ▲ 12.3% from last   │  ← trend indicator (green/red)
│     month             │
│  📁 Icon              │
└──────────────────────┘
```

## 6.7 Modal / Dialog

```css
┌──────────────────────────────────────────────┐
│  Overlay: bg-black/50 backdrop-blur-sm        │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │  Dialog (center screen, max-w-lg)      │  │
│  │                                        │  │
│  │  Title                   [X] Close     │  │
│  │  ──────────────────────────────────    │  │
│  │                                        │  │
│  │  Content area (form, confirmation,     │  │
│  │  details, etc.)                        │  │
│  │                                        │  │
│  │  ──────────────────────────────────    │  │
│  │  [Cancel]              [Confirm]       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## 6.8 Badge / Status Pill

| Variant | Background | Text | Usage |
|---|---|---|---|
| Open | Blue-100 | Blue-700 | Status: Under Investigation |
| Closed | Green-100 | Green-700 | Status: Closed |
| Filed | Neutral-100 | Neutral-700 | Status: Filed |
| Critical | Red-100 | Red-700 | Priority: Critical |
| High Confidence | Green-100 | Green-700 | AI confidence > 80% |
| Medium Confidence | Amber-100 | Amber-700 | AI confidence 60-80% |
| Low Confidence | Red-100 | Red-700 | AI confidence < 60% |

## 6.9 Status Indicator

```css
/* Dots next to status text */
.dot-open:      ●  #3B82F6  (blue)
.dot-closed:    ●  #10B981  (green)
.dot-invest:    ●  #F59E0B  (amber)
.dot-filed:     ●  #6B7280  (gray)
.dot-critical:  ●  #EF4444  (red)
```

---

# 7. SCREEN SPECIFICATIONS

## 7.1 Login Screen

| Element | Specification |
|---|---|
| Layout | Centered card, max-w-md, on neutral gradient background |
| Branding | CrimeIntel AI logo + tagline: "Intelligent Investigation Assistant" at top |
| Fields | Email (type=email), Password (type=password, show/hide toggle) |
| Actions | "Sign In" button (full width, primary), "Forgot Password?" link |
| Footer | "Powered by Pixel Pirates | KSP Hackathon 2026" |
| Error States | "Invalid credentials" inline error; account locked message |
| Loading | Button shows spinner, inputs disabled during submission |
| Responsive | Full-width card on mobile, centered card on desktop |

## 7.2 Registration Screen (Admin Only)

| Element | Specification |
|---|---|
| Access | Only accessible via Admin panel (no public registration) |
| Fields | Display Name, Email, Badge Number, Phone, Role (dropdown) |
| Actions | "Create User" (primary), "Cancel" (secondary) |
| Validation | Email unique, badge number format, required fields |
| Success | Toast: "User created successfully" + redirect to user list |

## 7.3 Dashboard Screen

| Element | Specification |
|---|---|
| Layout | 4 KPI cards in a row → 2x2 chart grid below → Recent cases table |
| KPI Cards | Total Cases, Open Cases, Clearance Rate, My Cases (or role-appropriate) |
| Charts | Crime Type Distribution (pie), Monthly Trend (line) |
| Table | Recent Cases (last 10), columns: Case ID, Crime Type, Status, Date, Location |
| Quick Actions | Buttons: "🔍 New Search" → Case Explorer, "🤖 Open CRIMA AI" → Chat |
| Loading | Skeleton cards (pulsing gray rectangles) for KPI, chart skeleton |
| Empty | "No data available" for first-time use |
| Refresh | Auto-refresh every 60 seconds; manual refresh button |

## 7.4 Case Explorer Screen

### List View

| Element | Specification |
|---|---|
| Header | "Case Explorer" title + "New Case" button (Inspector+) |
| Search | Full-width search bar with icon; 300ms debounce; searches across case ID, FIR, suspect, location |
| Filters | Dropdowns: Crime Type, Status, District, Date Range (from-to) |
| Table | Columns: Case ID, Crime Type, Status (colored badge), Date Filed, Location, Officer |
| Sort | Click column header to sort asc/desc; indicator arrow shown |
| Pagination | Bottom: "Showing 1-20 of 145" + page numbers + prev/next |
| Empty | "No cases found" illustration + "Try adjusting your search filters" |
| Row click | Navigates to Case Detail |

### Detail View

| Element | Specification |
|---|---|
| Back | "← Back to Cases" breadcrumb link |
| Header | Case ID + Status badge + Edit button (Inspector+) |
| Sections (tabs or accordion) | FIR Info, Suspects, Witnesses, Timeline, Evidence |
| FIR Info | Card with: FIR Number, Crime Type, Date, Location, District, Lat/Lng, Officer, Description |
| Suspects | Card grid: photo (or placeholder), name, alias, age, status badge |
| Witnesses | Table: name, contact, statement summary (truncated), credibility score |
| Timeline | Chronological list with date, event type icon, description |
| Evidence | Gallery grid (3 columns) with thumbnails + "View All Evidence" link |
| Related Cases | Bottom section: card list of related cases with similarity score |

## 7.5 Evidence Management Screen

| Element | Specification |
|---|---|
| Case Selector | Dropdown to select which case to view evidence for |
| Upload | Drag-and-drop zone + "Browse Files" button; shows progress bar |
| Gallery | Grid: 3 columns (desktop), 2 (tablet). Each card: thumbnail + file name + type icon + size |
| Preview | Click thumbnail → lightbox modal: preview image/PDF, metadata sidebar |
| Filters | By file type (All, PDF, Image, Video) |
| Empty | "No evidence uploaded yet" illustration + "Upload your first file" CTA |

## 7.6 Reports Screen

| Element | Specification |
|---|---|
| Layout | Two sections: "Case Report" and "Summary Report" |
| Case Report | Select case → generate structured report view → print/export |
| Summary Report | Select date range + district → generate summary with KPIs, charts, tables |
| Report View | Clean print-friendly layout: header with KSP logo, case details, data tables |
| Actions | "Print" (opens print dialog), "Export PDF" (placeholder for MVP) |

## 7.7 Analytics Screen

| Element | Specification |
|---|---|
| Header | "Analytics" title + date range filter (presets: 7d, 30d, 12m, custom) |
| KPI Row | 4 cards: Total Cases, Open, Closed, Clearance Rate (same as dashboard) |
| Charts (2x2 grid) | Top-left: Crime Distribution (pie), Top-right: Monthly Trend (line) |
|  | Bottom-left: Cases by District (bar), Bottom-right: Status Breakdown (bar) |
| Filters | Crime type dropdown, district dropdown |
| Tooltip | Hover on chart elements → show exact values |
| Loading | Chart skeleton (gray rectangle with pulse) |
| Empty | "No data for selected period" |

## 7.8 Heat Map Screen

| Element | Specification |
|---|---|
| Layout | Full-width map (80% of screen height) + right filter sidebar (280px) |
| Map | Leaflet with OpenStreetMap tiles; India-centered; Karnataka state zoom |
| Heat Layer | Gradient overlay: Blue → Yellow → Red based on crime density |
| Filters | Crime type (multi-select), Date range (from-to), District |
| Interaction | Zoom (scroll + buttons), Pan, Click on hotspot → tooltip: count + types |
| Legend | Gradient scale with labels: Low → Medium → High |
| Loading | Map placeholder with spinner |
| Empty | "No incidents match your filter" |

## 7.9 CRIMA AI Chat Screen

| Element | Specification |
|---|---|
| Layout | Two panels: Chat (left, 60%) + Context Panel (right, 40%) |
| Chat Header | "CRIMA AI" title + "Clear Chat" button |
| Message List | Scrollable; user messages right-aligned (blue bg), AI messages left (white bg) |
| Message Format | Text + confidence badges + clickable source links |
| Typing Indicator | Animated dots when CRIMA AI is processing |
| Chat Input | Fixed bottom: textarea (auto-resize, max 4 lines) + Send button |
| Context Panel | Shows: current query context, identified entities, active filters |
| Empty | "Ask me anything about cases, suspects, or crime data" + example queries |
| Loading | Message bubble with shimmer animation for AI response |
| Error | "I encountered an error. Please try rephrasing your question." |

## 7.10 Admin: Users Screen

| Element | Specification |
|---|---|
| Header | "User Management" + "Add User" button |
| Table | Columns: Name, Email, Role (badge), Status (active/inactive), Last Login, Actions |
| Actions | Edit (pencil icon), Disable (toggle), Reset Password |
| Create/Edit | Modal with form: Name, Email, Badge #, Phone, Role dropdown, Status toggle |
| Search | Search by name or email |
| Pagination | Same as Case Explorer |
| Empty | "No users found" |

## 7.11 Admin: Audit Log Screen

| Element | Specification |
|---|---|
| Header | "Audit Logs" + "Export" button |
| Filters | Date range, User dropdown, Action type dropdown |
| Table | Columns: Timestamp, User, Action, Module, Details, IP Address |
| Details | Expandable row: click for full detail JSON |
| Search | Search across action description or user name |
| Pagination | Standard pagination |

## 7.12 Settings Screen

| Element | Specification |
|---|---|
| Tabs/Sections | Profile, Security, Notifications |
| Profile | Display Name, Phone, Badge Number, Profile Photo (upload) |
| Security | Current Password, New Password, Confirm New Password |
| Notifications | Toggle switches: Case Assigned, Status Change, Evidence Uploaded |

---

# 8. LOADING, EMPTY & ERROR STATES

## 8.1 Loading States

| Component | Loading State |
|---|---|
| KPI Card | Gray rectangle skeleton, 120x80px, pulse animation |
| Table | 5 rows of skeleton cells, each row 40px height |
| Chart | Chart-sized rectangle skeleton (300x200px) |
| Card | Skeleton: title bar (60% width) + body (100% width) |
| Chat Message | Bubble-shaped skeleton, pulsing |
| Map | Full map placeholder with spinner overlay |
| Button | Spinner icon replacing button text or alongside |
| Page | Top-level: centered spinner with "Loading..." text |
| File Upload | Progress bar (determinate) + file name + percentage |

## 8.2 Empty States

| Screen | Empty Message | Illustration |
|---|---|---|
| Case List | "No cases found. Try adjusting your filters." | Folder icon |
| Evidence Gallery | "No evidence uploaded for this case." | Upload icon |
| CRIMA AI (first visit) | "Ask me anything about crime data." + 3 example queries | Robot icon |
| Analytics | "No data available for the selected period." | Chart icon |
| Heat Map | "No incidents match your filter criteria." | Map pin icon |
| Notifications | "No new notifications." | Bell icon |
| Search Results | "No results match your search." | Search icon |

## 8.3 Error States

| Scenario | Error UI |
|---|---|
| Network offline | Top banner: "You are offline. Some features may be unavailable." |
| API 500 | Toast: "Server error. Please try again." + retry button |
| API 401 | Redirect to login + toast: "Session expired." |
| API 403 | Toast: "You don't have permission." |
| API 404 | Empty state: "Not found." |
| Form validation | Inline: red border + error text below each invalid field |
| File upload fail | Toast: "Upload failed. Check file size/type." |
| CRIMA AI fail | Chat message: "I encountered an issue. Please try again." + retry |

---

# 9. ACCESSIBILITY

| Requirement | Implementation |
|---|---|
| Semantic HTML | `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>` |
| ARIA Labels | All icons: `aria-hidden="true"` or `aria-label`; buttons: descriptive labels |
| Keyboard Nav | Tab through form fields; Enter to submit; Escape to close modals |
| Focus Indicators | Visible `ring-2 ring-primary-400` on all focusable elements |
| Color Contrast | All text ≥ 4.5:1 against backgrounds (checked for both themes) |
| Screen Reader | Dynamic content updates announced via `aria-live="polite"` |
| Reduced Motion | `prefers-reduced-motion: reduce` — disable animations |
| Form Labels | Every input has `<label>` (not placeholder-only) |

---

# 10. RESPONSIVE BEHAVIOR

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Desktop | ≥ 1280px | Full layout: sidebar expanded, 12-column grid |
| Small Desktop | 1024–1279px | Sidebar collapsed (icons only), charts 2 columns |
| Tablet | 768–1023px | Sidebar hidden (hamburger menu), single column charts, table horizontal scroll |
| Mobile | < 768px | Full-width single column, stacked navigation, stacked KPI cards, table converts to card list |

## Responsive Table Strategy

| Breakpoint | Behavior |
|---|---|
| ≥ 1024px | Standard table with all columns |
| 768–1023px | Table with horizontal scroll (overflow-x: auto) |
| < 768px | Convert to card list: each row becomes a stacked card with key-value pairs |

---

# END OF UI/UX SPECIFICATION
