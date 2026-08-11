# frontend/

React + TypeScript + Tailwind CSS SPA (Vite). Planned structure (Phase 2+):

```
frontend/
├── src/
│   ├── pages/        # Login, Dashboard, CRIMA AI, Case Explorer, Case Detail,
│   │                 # Evidence, Analytics, Reports, Admin, NotFound
│   ├── components/   # layout (sidebar/header), ui primitives, chat, charts
│   ├── services/     # typed API client (per API_CONTRACT.md)
│   ├── types/        # shared domain types
│   └── main.tsx / App.tsx
├── index.html
├── vite.config.ts    # dev proxy /api -> http://localhost:8000
├── package.json
└── tailwind.config.ts
```

**Status: Phase 0 — empty scaffolding. No code yet.**
See `docs/UI_DESIGN.md` for the design system and screens.
