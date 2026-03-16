# RotaryConnect CRM — Development Setup

## Prerequisites

- Node.js 20+ (recommended: 22 via nvm)
- npm 10+
- A Supabase project (free tier works)
- Git

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/TeleoServices/rotary-connect-crm.git
cd rotary-connect-crm

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
```

## Environment Variables

Edit `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=RotaryConnect CRM
VITE_APP_VERSION=0.1.0
```

You can find these in your Supabase project dashboard under Settings > API.

## Database Setup

The database schema is managed through Supabase migrations. Apply them in order:

1. `001_create_tables.sql` — Core tables (businesses, interactions, business_needs, templates, team_members)
2. `002_rls_policies.sql` — Row-level security policies
3. `003_seed_templates.sql` — Starter email/script templates
4. `004_indexes_and_triggers.sql` — Performance indexes and updated_at triggers

Apply via the Supabase SQL Editor or CLI:
```bash
npx supabase db push
```

## Running Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Building for Production

```bash
npm run build
```

Output goes to the `dist/` directory.

## Type Generation

After any database schema change, regenerate TypeScript types:

```bash
npx supabase gen types typescript --linked > src/lib/types.ts
```

Do NOT hand-edit `src/lib/types.ts`.

## Deployment

The app auto-deploys to Vercel from the `main` branch. No manual deployment needed after the initial Vercel project setup.
