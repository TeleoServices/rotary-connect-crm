# RotaryConnect CRM — Architecture

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + TypeScript | Type-safe, component-based UI |
| Build | Vite 7 | Fast dev server and HMR |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first with pre-built accessible components |
| Backend | Supabase (hosted Postgres) | No server to maintain; built-in Auth, RLS, Realtime |
| Auth | Supabase Magic Link | No passwords for volunteer teams |
| Deploy | Vercel | Auto-deploys from main, SPA rewrites |
| Charts | Recharts | Simple bar charts for needs dashboard |
| Tables | TanStack React Table | Server-side pagination for 5,000+ rows |

## Key Design Decisions

### No Backend Server
Supabase provides Postgres, Auth, Row-Level Security, and Realtime subscriptions directly from the browser. This eliminates server maintenance, reduces deployment complexity, and keeps costs near zero for small clubs.

### Canonical Supabase Call Pattern
Every data call follows the same pattern — never throw, always return null/empty, log with context prefix. This ensures one failed query never blanks the entire page. See `src/lib/supabase.ts` header comment.

### Row-Level Security (RLS)
All tables have RLS enabled. Policies enforce role-based access:
- **Members**: Read all data, write interactions
- **Leads**: Write businesses and needs
- **Admins**: Full access to all tables including templates and team_members

### Error Boundaries
Every major section is wrapped in a React ErrorBoundary. A crash in the needs chart doesn't take down the dashboard. Each section fails independently.

### CSS Namespace Prefixes
Component CSS classes use module prefixes (dash-, biz-, need-, tpl-, team-, set-, lay-) to prevent collisions. Tailwind utility classes are the primary styling mechanism.

### Idempotent Migrations
All database migrations use IF NOT EXISTS and DO blocks. They can be re-run safely without dropping data. Migrations are additive only — never DROP.

### External Content Sanitization
CSV imports run through `sanitizeCSVField()` to prevent formula injection. Any user-provided HTML uses `sanitizeHTML()`. React's built-in escaping is preferred over dangerouslySetInnerHTML.

## Project Structure

```
src/
├── lib/           # Core utilities (Supabase client, env validation, types, sanitization)
├── hooks/         # Data hooks (useBusinesses, useInteractions, useNeeds, etc.)
├── components/    # UI components organized by module
│   ├── common/    # ErrorBoundary, LoadingSpinner
│   ├── layout/    # Sidebar, AppLayout
│   ├── businesses/# Table, Filters, QuickAdd, CSVImport
│   ├── interactions/ # ActivityForm, Timeline
│   └── needs/     # NeedForm, NeedCard, KanbanBoard
├── pages/         # Route-level components
└── styles/        # Global CSS (Tailwind base)
```

## Data Flow

1. User action triggers a hook function (e.g., `createBusiness`)
2. Hook calls Supabase with canonical pattern
3. On success: state updates, UI re-renders
4. On error: error logged with context, null returned, UI shows empty state
5. Real-time: Supabase Realtime subscription pushes changes to other connected clients

## Environment Variables

All env vars are validated at startup in `src/lib/env.ts`. Missing vars cause an immediate, descriptive error rather than a silent failure later.
