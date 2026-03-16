# RotaryConnect CRM — Claude Code Build Prompt (v2 — Hardened)

> **How to use this file:** Open your terminal, `mkdir rotary-connect-crm && cd rotary-connect-crm`, run `claude`, and paste this entire prompt. Claude Code will scaffold the project, create the GitHub repo, deploy the test site, and build iteratively through each milestone. You can then continue the conversation to refine features.

---

## CRITICAL BUILD DISCIPLINE — READ FIRST (Lines 1–30)

These rules override all defaults. Violations cause silent failures.

```
## Git Discipline
NEVER create worktree branches. ALWAYS commit directly to main.
Commit format: git add -A && git commit -m "[scope]: description" && git push origin main
Scopes: scaffold, db, ui, api, auth, deploy, docs, test, polish
Verify after every push: git log --oneline -3

## Supabase Call Pattern (Canonical — no deviations)
Every Supabase call in the app follows this pattern:
  const { data, error } = await supabase.from('table').select('*');
  if (error) { console.error('Context:', error.message); return null; }
NEVER throw from a Supabase call. ALWAYS return null/empty and handle gracefully in the UI.
Document this pattern in src/lib/supabase.ts header comment.

## Migration Discipline
ALL migrations must be idempotent. Wrap ALTERs in DO blocks with exception handling.
Never DROP and recreate. Always additive.

## Environment Variables
NEVER hardcode Supabase URLs, keys, or any secret. Always reference import.meta.env.
Validate all required env vars at app startup in src/lib/supabase.ts with clear error messages.

## CSS Namespace Protection
Prefix all component CSS by module: dash-, biz-, need-, tpl-, team-, set-
No generic class names (.card, .header, .container) outside of shadcn/ui.
```

---

## Project Overview

Build a full-stack CRM web application called **"RotaryConnect"** for a Rotary club's local business outreach campaign. The club needs to contact thousands of local businesses, track every interaction, capture business needs, and coordinate a street team of volunteers — all from a shared, browser-based tool that any team member can access without installing software.

**This will be tested by external users immediately.** The build must produce a live test site URL on the first milestone and keep it deployed throughout.

---

## Milestone 0 — Repo + Test Site Infrastructure (Do This FIRST)

Before writing any application code, set up the full infrastructure.

### Step 1: Initialize Git and GitHub Repo
```bash
git init
echo "node_modules/\ndist/\n.env\n.env.local\n*.local" > .gitignore
echo "# RotaryConnect CRM\n\nLocal business outreach CRM for Rotary clubs.\n\n## Setup\n\nSee docs/SETUP.md for installation and deployment instructions." > README.md
git add -A && git commit -m "[scaffold]: initial repo setup"
gh repo create rotary-connect-crm --public --source=. --push
git log --oneline -3
```

### Step 2: Scaffold the Project
```bash
npm create vite@latest . -- --template react-ts
# Install core dependencies
npm install @supabase/supabase-js react-router-dom @tanstack/react-table recharts lucide-react
npm install -D tailwindcss @tailwindcss/vite
# Install shadcn/ui
npx shadcn@latest init
```

### Step 3: Create Environment Config
Create `.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=RotaryConnect
VITE_APP_VERSION=0.1.0
```

Create `src/lib/env.ts`:
```typescript
/**
 * Environment variable validation.
 * Fails fast at startup with clear error messages.
 * NEVER import env vars directly — always use this module.
 */
function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Copy .env.example to .env.local and fill in your Supabase credentials.`
    );
  }
  return value;
}

export const ENV = {
  SUPABASE_URL: requireEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('VITE_SUPABASE_ANON_KEY'),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'RotaryConnect',
} as const;
```

### Step 4: Deploy Test Site to Vercel
```bash
npm install -g vercel
vercel link --yes
vercel env add VITE_SUPABASE_URL        # paste the Supabase project URL
vercel env add VITE_SUPABASE_ANON_KEY   # paste the anon key
vercel --prod
```

Capture the deployed URL and add it to README.md under a "## Live Test Site" heading.

### Step 5: Create Supabase Project
```bash
npx supabase init
npx supabase login
# Link to existing project or create new:
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Step 6: Commit and Push
```bash
git add -A && git commit -m "[scaffold]: project scaffold with Vite, Supabase, Tailwind, Vercel deploy"
git push origin main
git log --oneline -3
```

### Verification — Milestone 0
```bash
# Repo exists on GitHub
gh repo view rotary-connect-crm --json url -q '.url'

# Build compiles
npm run build 2>&1 | tail -5

# Test site is live (replace with your actual Vercel URL)
curl -s -o /dev/null -w "%{http_code}" https://rotary-connect-crm.vercel.app
# Expected: 200

# Environment validated
grep -c "VITE_SUPABASE_URL" .env.example
# Expected: 1
```

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Fast, component-driven, easy to extend |
| **UI Framework** | Tailwind CSS + shadcn/ui | Professional look, rapid development |
| **Backend / API** | Supabase (hosted Postgres + Auth + Realtime) | Zero-server deployment, RLS, real-time sync |
| **Auth** | Supabase Auth (email magic link) | No passwords — volunteers click a link |
| **Hosting** | Vercel | Auto-deploy from GitHub main branch, preview deploys on PRs |
| **Email Templates** | React Email + Resend (future) | For now: copy-to-clipboard with merge fields filled |

### Architecture Note — No Proxy/Gateway Layer
Because Supabase is accessed directly from the browser via its JS client (with RLS enforcing security), there is **no backend server and no proxy/gateway layer**. The frontend talks directly to Supabase. This means:
- Every security rule lives in RLS policies, NOT in application code
- There are no custom API endpoints to keep in sync with proxy routes
- If a custom backend is ever added later, the Proxy/Gateway Architecture discipline from the build instructions must be followed at that time

---

## Database Schema

Design and apply via Supabase migrations. **All migrations must be idempotent.**

### `businesses` (Master List)
```sql
CREATE TABLE IF NOT EXISTS businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  industry        TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT DEFAULT 'XX',
  zip             TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  contact_name    TEXT,
  contact_title   TEXT,
  source          TEXT,
  status          TEXT DEFAULT 'new'
    CHECK (status IN ('new','contacted','engaged','needs_identified','partner','declined','dormant')),
  assigned_to     UUID REFERENCES auth.users(id),
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance at 5,000+ rows
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_assigned ON businesses(assigned_to);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses USING gin(to_tsvector('english', name));
```

### `interactions` (Street Team Activity Log)
```sql
CREATE TABLE IF NOT EXISTS interactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  type            TEXT NOT NULL
    CHECK (type IN ('call','email','visit','meeting','event','note','other')),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  subject         TEXT,
  notes           TEXT,
  outcome         TEXT,
  follow_up_date  DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_business ON interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_followup ON interactions(follow_up_date) WHERE follow_up_date IS NOT NULL;
```

### `business_needs` (The Most Crucial Feature)
```sql
CREATE TABLE IF NOT EXISTS business_needs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category        TEXT NOT NULL
    CHECK (category IN (
      'workforce','marketing','technology','funding','mentorship',
      'networking','space','compliance','training','community_engagement','other')),
  description     TEXT NOT NULL,
  priority        TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  status          TEXT DEFAULT 'identified'
    CHECK (status IN ('identified','researching','solution_proposed','resolved','deferred')),
  identified_by   UUID REFERENCES auth.users(id),
  identified_date DATE DEFAULT CURRENT_DATE,
  resolution      TEXT,
  resolved_date   DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_needs_business ON business_needs(business_id);
CREATE INDEX IF NOT EXISTS idx_needs_category ON business_needs(category);
CREATE INDEX IF NOT EXISTS idx_needs_status ON business_needs(status);
```

### `templates` (Email & Script Templates)
```sql
CREATE TABLE IF NOT EXISTS templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL
    CHECK (type IN ('email_initial','email_followup','email_thankyou',
                    'script_bltr','script_tcc','script_phone','other')),
  name            TEXT NOT NULL,
  subject         TEXT,
  body            TEXT NOT NULL,
  merge_fields    TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  version         INT DEFAULT 1,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### `team_members` (Auth Profile Extension)
```sql
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  role            TEXT DEFAULT 'member'
    CHECK (role IN ('admin','lead','member')),
  team            TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### Row-Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read everything
CREATE POLICY IF NOT EXISTS "Authenticated users can read businesses"
  ON businesses FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can read interactions"
  ON interactions FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can read needs"
  ON business_needs FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can read templates"
  ON templates FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can read team"
  ON team_members FOR SELECT TO authenticated USING (true);

-- Members can insert interactions and needs
CREATE POLICY IF NOT EXISTS "Members can insert interactions"
  ON interactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Members can insert needs"
  ON business_needs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = identified_by);

-- Members can update their own interactions
CREATE POLICY IF NOT EXISTS "Members can update own interactions"
  ON interactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Leads and admins can insert/update businesses
CREATE POLICY IF NOT EXISTS "Leads can manage businesses"
  ON businesses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE id = auth.uid() AND role IN ('admin','lead') AND is_active = true
    )
  );

-- Members can update businesses assigned to them
CREATE POLICY IF NOT EXISTS "Members can update assigned businesses"
  ON businesses FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());

-- Members can insert new businesses
CREATE POLICY IF NOT EXISTS "Members can insert businesses"
  ON businesses FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins can manage everything
CREATE POLICY IF NOT EXISTS "Admins full access templates"
  ON templates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY IF NOT EXISTS "Admins full access team"
  ON team_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Users can read/update their own team profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON team_members FOR UPDATE TO authenticated
  USING (id = auth.uid());
```

### `updated_at` Auto-Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_businesses') THEN
    CREATE TRIGGER set_updated_at_businesses
      BEFORE UPDATE ON businesses
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_templates') THEN
    CREATE TRIGGER set_updated_at_templates
      BEFORE UPDATE ON templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
```

---

## Canonical Supabase Call Pattern

Document this in a block comment at the top of `src/lib/supabase.ts`. Every hook and page must follow it.

```typescript
/**
 * =============================================
 * SUPABASE CALL PATTERN — ALL CALLS FOLLOW THIS
 * =============================================
 *
 * READS:
 *   const { data, error } = await supabase.from('table').select('*');
 *   if (error) { console.error('[context]:', error.message); return null; }
 *   return data;
 *
 * WRITES:
 *   const { data, error } = await supabase.from('table').insert({ ... }).select().single();
 *   if (error) { console.error('[context]:', error.message); return null; }
 *   return data;
 *
 * RULES:
 *   - NEVER throw from a Supabase call
 *   - ALWAYS return null/[] on error
 *   - ALWAYS log with context prefix: '[BusinessDetail]:', '[NeedsTracker]:', etc.
 *   - UI components handle null gracefully with empty states, NEVER blank screens
 *   - One flaky query must never crash the entire page — isolate failures
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';
import type { Database } from './types';

export const supabase = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
```

---

## Error Handling — Graceful Degradation

Every external call (Supabase, future APIs) follows this pattern. No exceptions.

```typescript
// In hooks — example from useBusinesses.ts
async function fetchBusinesses(filters: BusinessFilters): Promise<Business[]> {
  try {
    let query = supabase.from('businesses').select('*');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('[fetchBusinesses]:', error.message);
      return [];  // Never throw — return empty, UI shows "No businesses found"
    }
    return data ?? [];
  } catch (err: any) {
    console.error('[fetchBusinesses] unexpected:', err.message);
    return [];
  }
}
```

**The rule:** One failed query should never blank the entire dashboard. Each data section loads independently and shows its own error/empty state.

---

## External Content Security

Any data entering the system from outside must be sanitized before rendering.

```typescript
// src/lib/sanitize.ts

/**
 * Sanitize external content before rendering in the UI or including in templates.
 * Apply to: CSV imports, any future API integrations, user-submitted rich text.
 */
export function sanitizeHTML(dirty: string): string {
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML;
}

/**
 * Sanitize CSV field values during import.
 * Strips formula injection attempts (=, +, -, @, \t, \r prefixes).
 */
export function sanitizeCSVField(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;  // Prefix with single quote to neutralize
  }
  return value.trim();
}
```

Apply `sanitizeCSVField` to every cell during CSV import.
Apply `sanitizeHTML` to any user-provided content rendered via `dangerouslySetInnerHTML` (prefer avoiding `dangerouslySetInnerHTML` entirely — use React's built-in escaping).

---

## CSS Namespace Protection

Every component module uses a prefix. No generic class names outside of shadcn/ui's design system.

| Module | Prefix | Example Classes |
|---|---|---|
| Dashboard | `dash-` | `dash-stat-card`, `dash-activity-feed`, `dash-chart-container` |
| Businesses | `biz-` | `biz-table`, `biz-filter-sidebar`, `biz-quick-add` |
| Business Detail | `bizd-` | `bizd-header`, `bizd-timeline`, `bizd-tab-content` |
| Interactions | `int-` | `int-form`, `int-timeline-entry`, `int-type-badge` |
| Needs | `need-` | `need-kanban`, `need-card`, `need-priority-badge` |
| Templates | `tpl-` | `tpl-editor`, `tpl-preview`, `tpl-merge-toolbar` |
| Team | `team-` | `team-table`, `team-invite-form`, `team-leaderboard` |
| Settings | `set-` | `set-form`, `set-category-list` |
| Layout | `lay-` | `lay-sidebar`, `lay-header`, `lay-mobile-nav` |

When using Tailwind exclusively in JSX, this is less critical — but any custom CSS in `globals.css` or component `.css` files MUST use these prefixes.

---

## Application Pages & Features

### 1. Dashboard (`/`)
- **Summary cards**: Total businesses, contacted this week, needs identified, pending follow-ups
- **My assignments**: Businesses assigned to the logged-in user with next action due
- **Recent activity feed**: Real-time stream of team interactions (Supabase Realtime)
- **Needs breakdown**: Bar chart of business needs by category (use Recharts)
- **Each section loads independently** — if the needs query fails, the activity feed still loads

### 2. Business Directory (`/businesses`)
- **Searchable, sortable, filterable data table** with columns: Name, Industry, Status, Assigned To, Last Contact, Needs Count, Tags
- **Filters sidebar**: Status, industry, tags, assigned team member, contacted/not, has needs
- **Bulk actions**: Assign to member, change status, add tag, export CSV
- **Quick-add button**: Slide-over panel to add a new business
- **CSV import**: Upload a CSV of businesses with interactive column mapping. **Apply `sanitizeCSVField` to every imported value.**
- **Server-side pagination**: Supabase `.range()` for 5,000+ row performance

### 3. Business Detail (`/businesses/:id`)
- **Header**: Business name, status badge, industry, contact info, edit button
- **Tabbed layout**:
  - **Overview**: All business fields, tags, notes
  - **Activity Timeline**: Chronological list of all interactions, "Add Interaction" form at top:
    - Date picker (defaults to today)
    - Type selector (call / email / visit / meeting / event / note)
    - Subject line
    - Notes (textarea — no rich text needed for v1)
    - Outcome
    - Follow-up date
    - Save → inserts into `interactions` table
  - **Needs**: List of identified needs with category/priority/status. "Add Need" form:
    - Category dropdown
    - Description textarea
    - Priority selector
    - Status tracker
  - **Emails**: Select template → auto-fill merge fields from business data → copy to clipboard

### 4. Needs Tracker (`/needs`)
- **Master view of ALL business needs** across every business
- **Kanban board view**: Columns = status (Identified → Researching → Solution Proposed → Resolved / Deferred)
- **Table view** with filters: Category, priority, status, date range
- **Aggregate analytics**: "Top 5 need categories", "Needs by priority"
- **Export**: CSV download for Rotary leadership reporting

### 5. Templates & Scripts (`/templates`)
- **List of all templates** grouped by type
- **Template editor**: Textarea with merge field insertion toolbar (`{{business_name}}`, `{{contact_name}}`, `{{rotary_member_name}}`, `{{specific_need}}`)
- **Preview pane**: Shows template rendered with sample data
- **"Use Template" flow**: Select business → merge fields auto-fill → copy to clipboard

Pre-seed the following starter templates (include full text in migration seed file):

**Email — Initial Outreach**
Subject: Supporting Local Businesses — [Rotary Club Name]
Body: Introduction, purpose of outreach (listen and connect), request for 15-min conversation, warm close.

**Email — Follow-Up**
Subject: Following Up — {{business_name}} + [Rotary Club Name]
Body: Reference earlier message, restate value prop (no strings attached), request specific availability.

**Email — Thank You (Post-Meeting)**
Subject: Thank You, {{contact_name}} — Great Conversation
Body: Express gratitude, reference specific needs identified ({{specific_need}}), promise follow-up resources.

**Script — BLTR Story** (Business Leaders Transforming Rotary)
Focus: Business leader who brought professional skills into Rotary, resulting in supplier savings, youth mentorship, and international impact. Close with "we want to understand what YOUR business needs."

**Script — TCC Story** (The Comfort of Connection)
Focus: Post-pandemic isolation, monthly roundtables that led to cross-referrals, joint grant applications, and genuine community. Close with "I just want to listen. What's going on with your business?"

**Script — Initial Phone Contact**
Flow: Ask for contact by name → introduce self and Rotary initiative → clarify "not a sales call" → request 15-min conversation → if unavailable, leave name/number and mention follow-up email.

*(Full template text is provided in the seed migration file — see `supabase/migrations/003_seed_templates.sql`)*

### 6. Team Management (`/team`) — Admin only
- List of team members with role, team/zone, active status
- Invite new members (triggers Supabase magic link)
- Assign/reassign businesses in bulk
- Activity leaderboard: interactions logged per member this week/month

### 7. Settings (`/settings`)
- Organization name, default state/city
- Need categories management (add custom categories)
- Status pipeline customization
- Data export (full database dump as CSV/JSON)

---

## Non-Functional Requirements

1. **Mobile-responsive**: Street team uses this on phones. Every page works on 375px screens. Test in Chrome DevTools mobile view.
2. **Offline-friendly interaction form**: Use React state to let team members draft notes offline. Show a "Saved locally — will sync when online" indicator. Sync on reconnection.
3. **Real-time collaboration**: Supabase Realtime subscriptions on businesses and interactions tables. When one member updates, others see it within seconds.
4. **Performance**: TanStack Table with server-side pagination via Supabase `.range()`. Must handle 5,000+ businesses without lag.
5. **Accessibility**: WCAG 2.1 AA — proper labels, keyboard nav, color contrast ratios ≥ 4.5:1.
6. **Error boundaries**: React error boundaries around each major section. A crash in the Needs chart should never take down the entire Dashboard.

---

## Project Structure

```
rotary-connect-crm/
├── README.md
├── PROGRESS.md                   # Living build log — entry after every milestone
├── CLAUDE.md                     # Agent instructions (if Claude Code is used for maintenance)
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                   # Vercel config — SPA rewrites
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_rls_policies.sql
│       ├── 003_seed_templates.sql
│       └── 004_indexes.sql
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   ├── env.ts                # Environment validation — fail-fast
│   │   ├── supabase.ts           # Client init + canonical call pattern docs
│   │   ├── sanitize.ts           # CSV and HTML sanitization
│   │   ├── types.ts              # Generated from Supabase schema
│   │   └── utils.ts              # Date formatting, merge field rendering, etc.
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBusinesses.ts
│   │   ├── useInteractions.ts
│   │   ├── useNeeds.ts
│   │   ├── useTemplates.ts
│   │   ├── useTeam.ts
│   │   └── useRealtime.ts        # Supabase Realtime subscription hook
│   ├── components/
│   │   ├── layout/               # Sidebar, Header, MobileNav
│   │   ├── businesses/           # Table, Filters, QuickAdd, CSVImport
│   │   ├── interactions/         # ActivityForm, Timeline
│   │   ├── needs/                # NeedForm, KanbanBoard, NeedCard
│   │   ├── templates/            # TemplateEditor, TemplatePreview, MergeFieldToolbar
│   │   ├── dashboard/            # StatCards, ActivityFeed, NeedsChart
│   │   ├── team/                 # MemberTable, InviteForm, Leaderboard
│   │   ├── common/               # ErrorBoundary, LoadingSpinner, EmptyState, OfflineIndicator
│   │   └── ui/                   # shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Businesses.tsx
│   │   ├── BusinessDetail.tsx
│   │   ├── NeedsTracker.tsx
│   │   ├── Templates.tsx
│   │   ├── Team.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   └── styles/
│       └── globals.css
├── public/
│   └── rotary-logo.svg
└── docs/
    ├── SETUP.md                  # Dev setup instructions for contributors
    ├── TESTING.md                # Test site access instructions for external testers
    └── ARCHITECTURE.md           # Technical decisions and patterns
```

---

## Protected File Registry

When modifying any of these files, run the FULL regression verification block — not just a compile check.

```
### Protected Files (full regression required if modified)
- src/lib/supabase.ts        — client init, call pattern, auth state
- src/lib/env.ts             — environment validation
- src/lib/types.ts           — database types (schema contract)
- src/App.tsx                — routing, auth guard, layout wrapper
- src/hooks/useAuth.ts       — authentication flow
- supabase/migrations/*      — database schema (production data at risk)
- vercel.json                — deployment config
- .env.example               — documents required env vars
```

---

## Implementation Milestones

Build in this exact order. **Never skip steps or build out of order.** Each milestone has a blast radius map, coupling checklist, and verification block.

---

### Milestone 0: Infrastructure (described above)
**Deliverable:** Empty app shell deployed to Vercel with working auth login page.

---

### Milestone 1: Database + Auth

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| supabase/migrations/001_create_tables.sql | create | → types.ts must be regenerated |
| supabase/migrations/002_rls_policies.sql | create | → all queries respect RLS |
| supabase/migrations/003_seed_templates.sql | create | → Templates page expects this data |
| supabase/migrations/004_indexes.sql | create | → performance at scale |
| src/lib/types.ts | generate | → every hook imports these types |
| src/hooks/useAuth.ts | create | → Login page, auth guard in App.tsx |
| src/pages/Login.tsx | create | → first page users see |
| src/App.tsx | modify | → auth guard wraps all routes |

#### Implementation
1. Run all migration files against Supabase
2. Generate TypeScript types: `npx supabase gen types typescript --linked > src/lib/types.ts`
3. Build magic link auth flow (login, logout, session persistence)
4. Auth guard: unauthenticated users see Login, authenticated users see the app shell
5. Auto-create team_members row on first login via Supabase trigger or client-side check

#### Coupling Checklist
- [ ] All migrations idempotent (IF NOT EXISTS, DO blocks)
- [ ] RLS policies tested: member can read, lead can write businesses, admin can manage templates
- [ ] TypeScript types match actual schema (regenerate, don't hand-write)
- [ ] Auth redirect works: `/login` → magic link → redirect to `/`
- [ ] Session persists on page refresh

#### Verification
```bash
# Migrations applied
npx supabase db diff | head -20  # Should show no drift

# Types generated
test -f src/lib/types.ts && echo "Types exist" || echo "MISSING"

# Build compiles with new types
npm run build 2>&1 | tail -10

# Auth flow works (manual check — open test site, request magic link)
echo "MANUAL: Open test site URL, enter email, check for magic link, verify login"

# Commit
git add -A && git commit -m "[db]: schema, RLS, types, auth flow" && git push origin main
git log --oneline -3
```

---

### Milestone 2: Business Directory

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| src/hooks/useBusinesses.ts | create | → Businesses page, Dashboard, BusinessDetail |
| src/pages/Businesses.tsx | create | → routing in App.tsx |
| src/components/businesses/* | create | → Businesses page imports all |
| src/lib/sanitize.ts | create | → CSV import uses sanitizeCSVField |
| src/App.tsx | modify | → add /businesses route |

#### Implementation
1. `useBusinesses` hook: fetch, create, update, delete, search, filter, paginate
2. Data table with TanStack Table: sortable columns, server-side pagination
3. Filter sidebar: status, industry, tags, assigned_to
4. Quick-add slide-over form
5. CSV import with column mapping and `sanitizeCSVField` on every value
6. Bulk actions: assign, change status, add tag, export CSV

#### Verification
```bash
npm run build 2>&1 | tail -10
echo "MANUAL: Open /businesses, add a business, search for it, filter by status"
echo "MANUAL: Import a test CSV with 50 rows, verify all rows appear"
echo "MANUAL: Test on mobile viewport (375px)"
git add -A && git commit -m "[ui]: business directory with CRUD, search, CSV import" && git push origin main
```

---

### Milestone 3: Business Detail + Interaction Form

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| src/hooks/useInteractions.ts | create | → BusinessDetail, Dashboard activity feed |
| src/pages/BusinessDetail.tsx | create | → routing in App.tsx needs :id param |
| src/components/interactions/* | create | → BusinessDetail page |
| src/App.tsx | modify | → add /businesses/:id route |

#### Implementation
1. Business detail page with tabbed layout (Overview, Activity, Needs, Emails)
2. Activity Timeline with "Add Interaction" form — this is the **street team input template**
3. Real-time subscription on interactions for this business
4. Offline draft support: save form state to React state/localStorage, show offline indicator

#### Verification
```bash
npm run build 2>&1 | tail -10
echo "MANUAL: Open a business detail, add an interaction, verify it appears in timeline"
echo "MANUAL: Open same business in second browser — verify real-time update"
echo "MANUAL: Test interaction form on mobile"
git add -A && git commit -m "[ui]: business detail with interaction form and timeline" && git push origin main
```

---

### Milestone 4: Needs Tracker

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| src/hooks/useNeeds.ts | create | → BusinessDetail needs tab, NeedsTracker page, Dashboard chart |
| src/pages/NeedsTracker.tsx | create | → routing in App.tsx |
| src/components/needs/* | create | → NeedsTracker + BusinessDetail |
| src/App.tsx | modify | → add /needs route |

#### Implementation
1. Add Need form on BusinessDetail Needs tab
2. Dedicated `/needs` page with Kanban board (drag-and-drop status changes)
3. Table view with filters: category, priority, status, date range
4. Aggregate stats: needs by category, needs by priority
5. CSV export for Rotary leadership

#### Verification
```bash
npm run build 2>&1 | tail -10
echo "MANUAL: Add a need to a business, verify it appears on /needs Kanban board"
echo "MANUAL: Drag a need card to 'Researching' — verify status updates in DB"
echo "MANUAL: Export needs CSV and verify data integrity"
git add -A && git commit -m "[ui]: needs tracker with kanban, table view, and export" && git push origin main
```

---

### Milestone 5: Templates & Scripts

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| src/hooks/useTemplates.ts | create | → Templates page, BusinessDetail emails tab |
| src/pages/Templates.tsx | create | → routing in App.tsx |
| src/components/templates/* | create | → Templates page + BusinessDetail |
| supabase/migrations/003_seed_templates.sql | verify | → templates exist in DB |

#### Implementation
1. Templates list page grouped by type
2. Template editor with merge field toolbar
3. Preview pane with sample data
4. "Use Template" flow: select business → auto-fill → copy to clipboard
5. Verify all 6 seed templates loaded correctly

#### Verification
```bash
npm run build 2>&1 | tail -10
echo "MANUAL: Open /templates, verify all 6 starter templates present"
echo "MANUAL: Edit a template, insert merge field, preview with sample data"
echo "MANUAL: Use template on a business — verify merge fields fill correctly"
git add -A && git commit -m "[ui]: template editor with merge fields and use-template flow" && git push origin main
```

---

### Milestone 6: Dashboard

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| src/pages/Dashboard.tsx | create/modify | → depends on useBusinesses, useInteractions, useNeeds |
| src/components/dashboard/* | create | → Dashboard page |
| src/hooks/useRealtime.ts | create/modify | → activity feed subscription |

#### Implementation
1. Summary stat cards (total businesses, contacted this week, needs identified, pending follow-ups)
2. "My assignments" list with next action due dates
3. Real-time activity feed
4. Needs breakdown chart (Recharts bar chart)
5. Each section wrapped in error boundary — independent failure isolation

#### Verification
```bash
npm run build 2>&1 | tail -10
echo "MANUAL: Open dashboard, verify all 4 stat cards show correct counts"
echo "MANUAL: Add an interaction — verify it appears in activity feed in real-time"
echo "MANUAL: Verify dashboard still loads if one section's query fails (test with bad RLS)"
git add -A && git commit -m "[ui]: dashboard with stats, activity feed, and needs chart" && git push origin main
```

---

### Milestone 7: Team Management

#### Blast Radius Map
| File | Action | Downstream Coupling |
|---|---|---|
| src/hooks/useTeam.ts | create | → Team page, business assignment dropdowns |
| src/pages/Team.tsx | create | → routing in App.tsx |
| src/components/team/* | create | → Team page |
| src/App.tsx | modify | → add /team route, admin-only guard |

#### Implementation
1. Team member list with role, zone, active status
2. Invite flow (admin enters email → Supabase sends magic link)
3. Bulk business assignment
4. Activity leaderboard
5. Admin-only access guard on /team route

#### Verification
```bash
npm run build 2>&1 | tail -10
echo "MANUAL: Login as admin, verify /team is accessible"
echo "MANUAL: Login as member, verify /team redirects or shows 'Admin only'"
echo "MANUAL: Invite a test email, verify magic link arrives"
git add -A && git commit -m "[ui]: team management with invite, roles, and leaderboard" && git push origin main
```

---

### Milestone 8: Settings + Polish

#### Implementation
1. Settings page: org name, default city/state, custom need categories, data export
2. Mobile responsive pass on every page (375px viewport)
3. Loading spinners on all data-fetching states
4. Empty states on all list views ("No businesses yet — add your first one!")
5. Error boundaries around every major section
6. Accessibility audit: labels, keyboard nav, contrast ratios
7. Offline interaction draft indicator

#### Full Regression Verification
```bash
# Build compiles
npm run build 2>&1 | tail -10

# Test site deploys
vercel --prod 2>&1 | tail -5

# All routes load (manual)
echo "MANUAL CHECK — verify each route loads without blank screens:"
echo "  / (dashboard)"
echo "  /businesses"
echo "  /businesses/:id (pick one)"
echo "  /needs"
echo "  /templates"
echo "  /team"
echo "  /settings"
echo "  /login (logged out)"

# Mobile check
echo "MANUAL: Test all routes at 375px viewport width"

# Real-time check
echo "MANUAL: Open two browser tabs, update a business in one, verify update in other"

git add -A && git commit -m "[polish]: responsive, accessibility, error states, settings" && git push origin main
```

---

### Milestone 9: Documentation + External Tester Onboarding

#### Create `docs/SETUP.md`
Development setup instructions:
- Prerequisites (Node 18+, npm, Supabase CLI)
- Clone repo, install deps, create `.env.local` from `.env.example`
- Link Supabase project, run migrations
- `npm run dev` → localhost:5173

#### Create `docs/TESTING.md`
External tester instructions:
```markdown
# RotaryConnect CRM — Test Site Access

## URL
https://rotary-connect-crm.vercel.app (or actual URL)

## How to Log In
1. Go to the URL above
2. Enter your email address
3. Check your inbox for a magic link from Supabase
4. Click the link — you'll be logged in automatically

## What to Test
We'd love your feedback on:
- [ ] Adding a new business to the directory
- [ ] Logging an interaction (call, email, visit) on a business
- [ ] Identifying and categorizing a business need
- [ ] Using a template to draft an outreach email
- [ ] Viewing the dashboard for an overview of activity
- [ ] Everything on mobile (your phone browser)

## How to Report Issues
- Use the GitHub Issues tab: [link]
- Or email [your-email] with a screenshot and description

## Known Limitations (v0.1)
- Email templates are copy-to-clipboard only (no send button yet)
- Offline mode saves drafts but won't sync until reconnected
- CSV import supports up to 1,000 rows per batch
```

#### Create `docs/ARCHITECTURE.md`
Technical decisions for future developers:
- Why Supabase (no server to maintain, RLS, Realtime, magic link)
- Canonical Supabase call pattern
- CSS namespace prefixes
- Error handling philosophy (graceful degradation)
- Migration discipline (idempotent, additive only)

#### Update `README.md`
Add sections: Live Test Site URL, Quick Start, Tech Stack, Project Structure, Contributing, License.

#### Update `PROGRESS.md`
Add entries for every milestone completed, with dates and commit hashes.

#### Create `CLAUDE.md` (for future Claude Code maintenance sessions)
```markdown
# CLAUDE.md — RotaryConnect CRM

## CRITICAL — READ FIRST
- NEVER create worktree branches. Commit directly to main.
- NEVER drop database tables. Migrations are additive and idempotent.
- NEVER hardcode Supabase URLs or keys. Use import.meta.env via src/lib/env.ts.
- EVERY Supabase call follows the pattern in src/lib/supabase.ts header comment.
- EVERY CSS class uses module prefixes (dash-, biz-, need-, tpl-, team-, set-, lay-).
- AFTER every change: npm run build && git add -A && git commit -m "[scope]: desc" && git push origin main

## Architecture
- Frontend: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + Auth + Realtime) — NO custom server
- Deploy: Vercel (auto-deploys from main branch)
- Auth: Magic link via Supabase Auth

## Key Files
- src/lib/env.ts — env var validation (fail-fast)
- src/lib/supabase.ts — client + call pattern docs
- src/lib/sanitize.ts — CSV and HTML sanitization
- src/lib/types.ts — auto-generated from Supabase schema (do NOT hand-edit)
- supabase/migrations/ — database migrations (run in order)

## Adding a New Feature
1. Database migration first (if needed) — idempotent, with IF NOT EXISTS
2. Regenerate types: npx supabase gen types typescript --linked > src/lib/types.ts
3. Create hook in src/hooks/
4. Create components in src/components/[module]/
5. Add page in src/pages/ and route in App.tsx
6. Test: npm run build, verify on test site
7. Commit: git add -A && git commit -m "[scope]: description" && git push origin main
```

#### Final Push
```bash
git add -A && git commit -m "[docs]: README, SETUP, TESTING, ARCHITECTURE, CLAUDE.md, PROGRESS.md" && git push origin main
git log --oneline -5
echo "Build complete. Test site URL: $(grep 'vercel.app' README.md)"
```

---

## Verification After Every Milestone — Copy-Paste Block

Run this after EVERY milestone, not just the final one:

```bash
# 1. Build compiles
npm run build 2>&1 | tail -10
echo "BUILD: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 2. No TypeScript errors
npx tsc --noEmit 2>&1 | tail -10
echo "TYPES: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 3. Test site deploys
vercel --prod 2>&1 | tail -5

# 4. Git is on main, pushed
git branch --show-current  # Expected: main
git log --oneline -3

# 5. PROGRESS.md updated
grep -c "Milestone" PROGRESS.md
```

---

## Known Claude Code Gotchas

| Gotcha | Mitigation |
|---|---|
| Creates worktree branches instead of committing to main | Git discipline rule at TOP of this prompt and in CLAUDE.md |
| Silently drops sections when editing long files | Verify with `grep -c` after every file edit |
| Ignores instructions at end of long prompts | Critical rules placed in lines 1–30 of this prompt |
| Hardcodes credentials in source | `src/lib/env.ts` validates at startup; grep for hardcoded strings in verification |
| Drops table and recreates instead of ALTER | Migration discipline: IF NOT EXISTS, idempotent, additive only |
| Generic CSS class names cause collisions | Namespace prefixes enforced per module |
| Forgets to add routes for new pages | Blast radius map requires listing App.tsx routing changes |
| Generates types by hand instead of from schema | Migration verification: regenerate types after every schema change |

---

## Extensibility Notes (Future Features)

Design the architecture to support these later additions:
- **Automated email sending** via Resend or SendGrid API
- **Calendar integration** for scheduling follow-ups
- **Document attachments** on interactions (Supabase Storage)
- **Reporting dashboard** with date-range exports for Rotary leadership
- **Multi-club support** (org-level isolation via RLS)
- **SMS reminders** for follow-up dates
- **AI-powered need matching** — suggest Rotary resources based on identified needs
- **Public business directory** — opt-in listing of partner businesses

---

## BEGIN BUILD

Start with **Milestone 0: Infrastructure**. Set up the GitHub repo, scaffold the project, deploy the empty shell to Vercel, and confirm the test site URL is live. Then proceed sequentially through each milestone.
