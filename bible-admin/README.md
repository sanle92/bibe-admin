# Bible Admin

Independent admin dashboard for the Bible Study Workspace. It shares the same Supabase backend as the user PWA but has its own auth, routing, layout, components, stores, and theme.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- TanStack Query
- Zustand
- React Router
- Framer Motion
- Recharts
- Supabase

## Setup

```bash
npm install
cp .env.example .env.local
# fill in Supabase credentials
npm run dev
```

## Build

```bash
npm run build
```

## Architecture

- `src/components` — UI components and layout (not shared with user app)
- `src/pages` — Admin pages (not shared with user app)
- `src/stores` — Auth, theme, UI stores
- `src/services` — API layer including Supabase client
- `src/utils` — Shared utility helpers
- `src/types` — TypeScript types (can be shared)

This admin app is intentionally separate from the user PWA. Only types, utilities, the Supabase client, database schema, and constants should be shared between the two apps.
