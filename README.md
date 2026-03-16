# RotaryConnect CRM

A browser-based CRM for Rotary club local business outreach campaigns. Track thousands of businesses, log every interaction, capture business needs, and coordinate volunteer street teams.

## Live Test Site

https://rotary-connect-crm.vercel.app

See [docs/TESTING.md](docs/TESTING.md) for login instructions and what to test.

## Quick Start

```bash
git clone https://github.com/TeleoServices/rotary-connect-crm.git
cd rotary-connect-crm
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for full development setup.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 7
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Auth**: Magic link (no passwords)
- **Deploy**: Vercel (auto-deploys from main)
- **Charts**: Recharts
- **Tables**: TanStack React Table (server-side pagination)

## Features

- **Business Directory** — Searchable, filterable data table with CSV import/export
- **Business Detail** — Tabbed layout with contact info, activity timeline, needs tracking
- **Interaction Logging** — Log calls, emails, visits, meetings with follow-up dates
- **Needs Tracker** — Kanban board and table view for business needs across all contacts
- **Templates & Scripts** — Email templates and call scripts with merge fields
- **Dashboard** — Real-time activity feed, stat cards, needs-by-category chart
- **Team Management** — Invite members via magic link, assign roles, activity leaderboard
- **Settings** — Organization config and data export

## Project Structure

```
src/
├── lib/           # Supabase client, env validation, types, sanitization
├── hooks/         # Data hooks (useBusinesses, useInteractions, useNeeds, etc.)
├── components/    # UI components by module (businesses/, needs/, interactions/, etc.)
├── pages/         # Route-level page components
└── styles/        # Global Tailwind CSS
```

## Documentation

- [Development Setup](docs/SETUP.md)
- [Test Site Access](docs/TESTING.md)
- [Architecture & Technical Decisions](docs/ARCHITECTURE.md)

## Contributing

1. All work happens on `main` — no feature branches
2. Follow the canonical Supabase call pattern (see `src/lib/supabase.ts`)
3. Use CSS namespace prefixes per module
4. Run `npm run build` before every commit
5. See `CLAUDE.md` for full build discipline rules

## License

Private — TELEO Services LLC
