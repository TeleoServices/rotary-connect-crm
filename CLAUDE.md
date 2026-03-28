# CLAUDE.md — RotaryConnect CRM

## CRITICAL BUILD DISCIPLINE — READ FIRST

### Git Discipline
- NEVER create worktree branches. ALWAYS commit directly to main.
- Commit format: `git add -A && git commit -m "[scope]: description" && git push origin main`
- Scopes: scaffold, db, ui, api, auth, deploy, docs, test, polish
- Verify after every push: `git log --oneline -3`

### Supabase Call Pattern (Canonical — no deviations)
Every Supabase call in the app follows this exact pattern:
```typescript
const { data, error } = await supabase.from('table').select('*');
if (error) { console.error('[Context]:', error.message); return null; }
```
- NEVER throw from a Supabase call
- ALWAYS return null/[] on error and handle gracefully in the UI
- ALWAYS log with context prefix: `'[BusinessDetail]:'`, `'[NeedsTracker]:'`, etc.
- One flaky query must never crash the entire page — isolate failures
- Pattern documented in src/lib/supabase.ts header comment

### Error Handling: QueryError Pattern (enforced everywhere)
Every data-fetching hook exposes `error: string | null` and has a 5-second timeout:
1. Query succeeds with data → show data
2. Query succeeds with 0 results → show empty state message
3. Query fails with error → stop spinner, show red `QueryError` alert with error text and Retry button
4. Query hasn't resolved in 5 seconds → stop spinner, show "Request timed out — please try refreshing"

**No spinner in the app lasts longer than 5 seconds. Ever.**

The `QueryError` component is at `src/components/common/QueryError.tsx`. All 6 data hooks and all 7 page components implement this pattern.

### Migration Discipline
- ALL migrations must be idempotent (IF NOT EXISTS, DO blocks with exception handling)
- NEVER DROP and recreate. Always additive.
- Wrap ALTERs in DO blocks
- After schema changes: regenerate types with Supabase MCP `generate_typescript_types` tool
- Do NOT hand-edit src/lib/types.ts — it is auto-generated
- Migration files: `001_create_tables.sql` through `006_update_delete_policies.sql` in `supabase/migrations/`

### RLS: SECURITY DEFINER Functions (critical)
- `is_admin()` and `is_lead_or_admin()` are `SECURITY DEFINER` functions that bypass RLS to check roles in `team_members`
- Any RLS policy that needs to check user roles MUST use these functions
- NEVER query `team_members` directly inside an RLS policy — this causes infinite recursion because `team_members` itself has RLS enabled
- These functions were created in migration `003` (applied via `a693578`)

### Environment Variables
- NEVER hardcode Supabase URLs, keys, or any secret
- Always reference `import.meta.env` via src/lib/env.ts
- Validate all required env vars at app startup with clear error messages

### CSS Namespace Protection
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

No generic class names (.card, .header, .container) outside of shadcn/ui.

---

## Architecture
- Frontend: React 18 + TypeScript + Vite 7 + Tailwind CSS v4 + shadcn/ui
- Backend: Supabase (Postgres + Auth + Realtime) — NO custom server
- Deploy: Vercel (auto-deploys from main branch)
- Auth: Password login is primary method. Magic link available but unreliable on Supabase free tier.
- Supabase project ID: `vtmgwujjtfxrhhgrlpyk`
- GitHub: https://github.com/TeleoServices/rotary-connect-crm

## WSL Environment
- Running on WSL (Ubuntu) under Windows 11
- Node 22 via nvm
- Commands must use: `wsl -e bash --norc --noprofile -c "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin && source ~/.nvm/nvm.sh && nvm use 22 && <command>"`

## Database Tables
- `businesses` — main business directory (name, industry, status, contact info, assigned_to, tags, etc.)
- `interactions` — activity log per business (type, date, subject, notes, outcome, follow_up_date)
- `business_needs` — needs per business (category, priority, status, description, resolution)
- `templates` — email/script templates with merge fields (name, type, subject, body)
- `team_members` — user profiles with roles (admin/lead/member), team, is_active
- `org_settings` — single-row org config (org_name, default_city, default_state)

## Key Files
- `src/lib/env.ts` — env var validation (fail-fast at startup)
- `src/lib/supabase.ts` — typed Supabase client + canonical call pattern docs
- `src/lib/sanitize.ts` — sanitizeCSVField() and sanitizeHTML()
- `src/lib/types.ts` — auto-generated from Supabase schema (DO NOT hand-edit)
- `src/App.tsx` — routing, auth guard, layout wrapper
- `src/hooks/useAuth.tsx` — AuthProvider context, getSession()-first auth flow, 3s timeout
- `src/hooks/` — all data hooks follow canonical Supabase pattern + QueryError pattern
- `src/components/common/QueryError.tsx` — red alert box for query failures
- `vercel.json` — SPA rewrite config + cache-control headers
- `.env.example` — documents required env vars

## Protected Files (full regression required if modified)
- src/lib/supabase.ts, src/lib/env.ts, src/lib/types.ts
- src/App.tsx, src/hooks/useAuth.tsx
- supabase/migrations/*, vercel.json, .env.example

## External Content Security
- Apply `sanitizeCSVField()` to every CSV import cell value
- Apply `sanitizeHTML()` to any user-provided content rendered via dangerouslySetInnerHTML
- Prefer React's built-in escaping — avoid dangerouslySetInnerHTML entirely when possible

## Edit/Delete Permissions
- Any authenticated user can edit or delete any interaction or need (team-wide, not restricted to creator)
- RLS policies: `Members can update any interaction`, `Members can delete any interaction`, `Members can update any need`, `Members can delete any need` — all use `USING (true)` for authenticated users
- UI: inline edit populates the form at top, delete shows confirmation dialog before executing

## Caching Strategy
- `vercel.json`: immutable cache for hashed assets (`/assets/*`), `no-cache` for HTML
- `index.html`: `<meta>` tags for `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`
- No more stale deployment issues for returning users

## External Testers
Three external users with admin role:
- Ron: ron@highroadinstitute.com
- Catherine: catherine.a.ford@gmail.com
- Kim: kim@campbelltaxandaccounting.com

## Adding a New Feature
1. Database migration first (if needed) — idempotent, IF NOT EXISTS
2. Regenerate types via Supabase MCP `generate_typescript_types` tool
3. Create hook in src/hooks/ — MUST include `error` state + 5s timeout (QueryError pattern)
4. Create components in src/components/[module]/
5. Add page in src/pages/ and route in App.tsx — MUST show QueryError on failure, empty state on zero results
6. Wrap major sections in `<ErrorBoundary>`
7. Test: `npm run build`, verify on test site
8. Commit: `git add -A && git commit -m "[scope]: description" && git push origin main`

---

## Current Status

**App is live and being tested by external users.** All 10 original milestones complete plus 15+ post-launch fixes. See PROGRESS.md for detailed commit history.

### Milestones Summary
- M0: Infrastructure — Vite + React + Tailwind + Vercel deploy
- M1: Database + Auth — 6 tables (including org_settings), RLS policies with SECURITY DEFINER functions, password + magic link auth
- M2: Business Directory — TanStack Table, filters, pagination, CSV import/export, quick-add
- M3: Business Detail — Tabbed layout (overview/activity/needs/emails), interaction form, timeline, edit/delete interactions
- M4: Needs Tracker — Kanban board, table view, filters, priority stats, CSV export, edit/delete needs
- M5: Templates & Scripts — Template list, editor with merge fields, preview, copy-to-clipboard
- M6: Dashboard — Stat cards, real-time activity feed, Recharts needs-by-category chart, upcoming follow-ups
- M7: Team Management — Admin-only gate, invite via magic link, members table, leaderboard
- M8: Settings + Polish — Settings page (org settings, change password, data export CSV/JSON), error boundaries, accessibility
- M9: Documentation — README, SETUP.md, TESTING.md, ARCHITECTURE.md, PROGRESS.md, CLAUDE.md

### Post-Launch Fixes
- Auth flow rewrite: getSession()-first, 3s timeout, debug timestamps, cache-busting meta tags
- QueryError pattern: every data query has 5s timeout, shows error to user, never spins indefinitely
- Edit/delete for interactions and needs with team-wide RLS policies
- Password login tab (magic link unreliable on free tier)
- RLS infinite recursion fix (SECURITY DEFINER functions)
- Auth converted to React Context (AuthProvider)
- Cache-control headers in vercel.json + meta tags in index.html
- Org settings persistence (org_settings table)
- Follow-ups query fix + upcoming follow-ups dashboard section
- Sign out fix (immediate state clear)
- Change password section in Settings
- CSV export option in Settings alongside JSON

---

## Full Regression Verification
```bash
# 1. Build compiles
npm run build 2>&1 | tail -10
echo "BUILD: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 2. No TypeScript errors
npx tsc --noEmit 2>&1 | tail -10
echo "TYPES: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 3. Git is on main, pushed
git branch --show-current  # Expected: main
git log --oneline -3

# 4. All routes load (manual verification)
# /            (dashboard)
# /businesses
# /businesses/:id
# /needs
# /templates
# /team
# /settings
# /login       (logged out)

# 5. Mobile check — test all routes at 375px viewport width

# 6. Real-time check — open two tabs, update a business in one, verify in other
```

---

## For Full Feature Specs
Read `rotary-crm-claude-code.md` in the project root for detailed specifications on every feature, page, migration, template, and milestone.
