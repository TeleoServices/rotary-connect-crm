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

### Migration Discipline
- ALL migrations must be idempotent (IF NOT EXISTS, DO blocks with exception handling)
- NEVER DROP and recreate. Always additive.
- Wrap ALTERs in DO blocks
- After schema changes: regenerate types with Supabase MCP `generate_typescript_types` tool
- Do NOT hand-edit src/lib/types.ts — it is auto-generated

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
- Auth: Magic link via Supabase Auth (no passwords)
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

## Key Files
- `src/lib/env.ts` — env var validation (fail-fast at startup)
- `src/lib/supabase.ts` — typed Supabase client + canonical call pattern docs
- `src/lib/sanitize.ts` — sanitizeCSVField() and sanitizeHTML()
- `src/lib/types.ts` — auto-generated from Supabase schema (DO NOT hand-edit)
- `src/App.tsx` — routing, auth guard, layout wrapper
- `src/hooks/` — all data hooks follow canonical Supabase pattern
- `vercel.json` — SPA rewrite config
- `.env.example` — documents required env vars

## Protected Files (full regression required if modified)
- src/lib/supabase.ts, src/lib/env.ts, src/lib/types.ts
- src/App.tsx, src/hooks/useAuth.ts
- supabase/migrations/*, vercel.json, .env.example

## External Content Security
- Apply `sanitizeCSVField()` to every CSV import cell value
- Apply `sanitizeHTML()` to any user-provided content rendered via dangerouslySetInnerHTML
- Prefer React's built-in escaping — avoid dangerouslySetInnerHTML entirely when possible

## Adding a New Feature
1. Database migration first (if needed) — idempotent, IF NOT EXISTS
2. Regenerate types via Supabase MCP `generate_typescript_types` tool
3. Create hook in src/hooks/
4. Create components in src/components/[module]/
5. Add page in src/pages/ and route in App.tsx
6. Wrap major sections in `<ErrorBoundary>`
7. Test: `npm run build`, verify on test site
8. Commit: `git add -A && git commit -m "[scope]: description" && git push origin main`

---

## Current Status

### Milestones 0-7: COMPLETE
- M0: Infrastructure — Vite + React + Tailwind + Vercel deploy
- M1: Database + Auth — 5 tables, RLS policies, magic link auth, auto team_members creation
- M2: Business Directory — TanStack Table, filters, pagination, CSV import/export, quick-add
- M3: Business Detail — Tabbed layout (overview/activity/needs/emails), interaction form, timeline
- M4: Needs Tracker — Kanban board, table view, filters, priority stats, CSV export
- M5: Templates & Scripts — Template list, editor with merge fields, preview, copy-to-clipboard
- M6: Dashboard — Stat cards, real-time activity feed, Recharts needs-by-category chart
- M7: Team Management — Admin-only gate, invite via magic link, members table, leaderboard

### Milestone 8: IN PROGRESS — Settings + Polish
Checklist:
- [x] Settings page created (org name, default city/state, data export for all 5 tables)
- [x] Settings page routed in App.tsx (`/settings`)
- [ ] Mobile responsive pass on every page (375px viewport)
- [ ] Loading spinners on all data-fetching states
- [ ] Empty states on all list views ("No businesses yet — add your first one!")
- [ ] Error boundaries around every major section
- [ ] Accessibility audit: labels, keyboard nav, contrast ratios >= 4.5:1
- [ ] Offline interaction draft indicator

### Milestone 9: PENDING — Documentation
- [ ] Create docs/SETUP.md (dev setup for contributors)
- [ ] Create docs/TESTING.md (external tester instructions)
- [ ] Create docs/ARCHITECTURE.md (technical decisions and patterns)
- [ ] Update README.md (live test site URL, quick start, tech stack, structure)
- [ ] Create PROGRESS.md (living build log with dates and commit hashes)
- [ ] Final commit and push

---

## Full Regression Verification (run after Milestone 8)
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
