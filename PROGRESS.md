# RotaryConnect CRM — Build Progress

## Post-Launch Fixes (March 2026)

### 2026-03-28 — Edit/Delete for Interactions & Needs
- **Commit**: `1a06d48`
- **Migration**: `006_update_delete_policies.sql` — team-wide UPDATE and DELETE on `interactions` and `business_needs` (dropped "own only" policies, any authenticated user can edit/delete)
- **Changes**: `useInteractions` gained `updateInteraction()` and `deleteInteraction()`. `useNeeds` gained `deleteNeed()`. `ActivityForm` supports edit mode (populates from existing interaction, button changes to "Update Interaction"). `Timeline` has pencil/trash icons per entry with inline confirmation dialog. `NeedForm` supports edit mode. `NeedCard` has pencil/trash icons with inline confirmation dialog. `BusinessDetail` wires edit/delete state for both tabs.

### 2026-03-28 — Eliminate Infinite Spinners (QueryError Pattern)
- **Commit**: `6489551`
- **Changes**: 14 files changed. Created `QueryError` component (red alert box with error message + Retry button). Added `error: string | null` state and 5-second timeout to all 6 data hooks (`useBusinesses`, `useInteractions`, `useNeeds`, `useTemplates`, `useRecentActivity`, `useTeam`). Updated all 7 page components (Dashboard, Businesses, BusinessDetail, NeedsTracker, Templates, Team, Settings) to show `QueryError` instead of infinite spinner. Every data-fetching section now resolves to: data → empty state → error alert → timeout message. No spinner lasts longer than 5 seconds.

### 2026-03-28 — Auth Flow Rewrite (No More Infinite Spinner on Login)
- **Commit**: `0d67d5d`
- **Changes**: `useAuth.tsx` rewritten so `getSession()` is the primary check. If no session, loading clears immediately and login page shows in under 2 seconds. `onAuthStateChange` `INITIAL_SESSION` is secondary (only used if `getSession` hasn't resolved). Timeout reduced from 5s to 3s. Added `console.log` timestamps at every step for debugging (`[auth] getSession started`, `[auth] getSession returned`, etc.). Added cache-busting `<meta>` tags to `index.html` (`Cache-Control: no-cache, no-store`, `Pragma: no-cache`, `Expires: 0`).

### 2026-03-16 — Sign Out Fix + CSV Export in Settings
- **Commit**: `05f742e`
- **Changes**: Sign out now clears auth state immediately before calling `supabase.auth.signOut()` so the UI redirects to `/login` without waiting for the async call. Added CSV export option alongside JSON on the Settings data export section.

### 2026-03-16 — Change Password + Org Settings Persistence
- **Commit**: `32cab6e`
- **Migration**: `005_org_settings.sql` — created `org_settings` table (single row: org_name, default_city, default_state)
- **Changes**: Settings page gained Change Password section (Supabase `updateUser`). Org settings now persist to database instead of being ephemeral. Load/save with status feedback.

### 2026-03-16 — Cache-Control Headers in Vercel Config
- **Commit**: `c3dfdf5`
- **Changes**: `vercel.json` updated with cache-control headers: immutable for hashed assets (`/assets/*`), `no-cache` for HTML. Prevents stale deployments from being served.

### 2026-03-16 — Follow-ups Query Fix + Upcoming Follow-ups Section
- **Commit**: `4fb37f4`
- **Changes**: Dashboard follow-ups query changed from `lte` (past) to `gte` (future) to show upcoming follow-ups. Added "Upcoming Follow-ups" section to Dashboard with linked cards showing due date, business name, subject, and overdue/today badges.

### 2026-03-16 — Password Login Tab
- **Commit**: `9d5e4dd`
- **Changes**: Login page now has two tabs: "Magic Link" and "Password". Password login calls `supabase.auth.signInWithPassword()`. Added because Supabase free tier magic link emails are unreliable.

### 2026-03-16 — RLS Infinite Recursion Fix
- **Commit**: `a693578`
- **Migrations**: `001_create_tables.sql` through `004_indexes_and_triggers.sql` written to local `supabase/migrations/`. Created `is_admin()` and `is_lead_or_admin()` as `SECURITY DEFINER` functions that bypass RLS to check roles in `team_members`. Replaced all RLS policies that queried `team_members` directly (which caused infinite recursion) with calls to these functions. Fixed Leads policy.

### 2026-03-15 — Auth Loading Fix (First Attempt)
- **Commit**: `3c199a9`
- **Changes**: `useAuth` updated to handle all auth events including `INITIAL_SESSION`. Added 5-second timeout fallback. Wrapped all auth operations in try-catch to prevent unhandled rejections.

### 2026-03-15 — Auth Converted to React Context
- **Commit**: `55d5ff6`
- **Changes**: `useAuth` converted from standalone hook to `AuthProvider` context with `useContext`. Fixed admin role detection that was broken when each component had its own hook instance. Single source of truth for auth state across the entire app.

### 2026-03-15 — Template Seed Data + Tester Onboarding
- **Commits**: Included in milestone commits
- **Changes**: 6 templates seeded (3 email templates: initial outreach, follow-up, thank you; 3 scripts: BLTR story, TCC story, phone contact). Three external testers onboarded as admin users: Ron (ron@highroadinstitute.com), Catherine (catherine.a.ford@gmail.com), Kim (kim@campbelltaxandaccounting.com).

---

## Milestone 0: Infrastructure
- **Status**: Complete
- **Commits**: `c561085`, `053646e`, `a783105`, `59c7321`, `14d1440`
- **Deliverables**: Vite + React + TypeScript scaffold, Tailwind CSS v4 + shadcn/ui, Supabase client, Vercel deployment, SPA rewrites
- **Notes**: Downgraded from Vite 8 to Vite 7 due to @tailwindcss/vite peer dependency constraints

## Milestone 1: Database + Auth
- **Status**: Complete
- **Commit**: `f628c83`
- **Deliverables**: 5 database tables (businesses, interactions, business_needs, templates, team_members), RLS policies with role-based access, magic link auth flow, auto team_members creation on first login, TypeScript types generated from schema

## Milestone 2: Business Directory
- **Status**: Complete
- **Commit**: `121f7cd`
- **Deliverables**: TanStack React Table with server-side pagination, search/status/industry filters, quick-add slide-over, CSV import with column mapping and sanitization, CSV export, bulk operations

## Milestone 3: Business Detail + Interactions
- **Status**: Complete
- **Commit**: `96cb665`
- **Deliverables**: Tabbed layout (Overview, Activity, Needs, Emails), editable business fields, ActivityForm (type, date, subject, notes, outcome, follow-up), Timeline component, real-time interaction subscription

## Milestone 4: Needs Tracker
- **Status**: Complete
- **Commit**: `5d35dcb`
- **Deliverables**: Kanban board (5 status columns), table view with filters, priority stat cards, NeedForm on business detail, NeedCard component, CSV export

## Milestone 5: Templates & Scripts
- **Status**: Complete
- **Commit**: `b655b34`
- **Deliverables**: Template list grouped by type, template editor with merge field toolbar, preview with sample data, copy-to-clipboard, 6 seeded templates (3 emails, 3 scripts)

## Milestone 6: Dashboard
- **Status**: Complete
- **Commit**: `c56ca47`
- **Deliverables**: 4 stat cards (total businesses, contacted this week, needs identified, pending follow-ups), real-time activity feed via Supabase Realtime, Recharts bar chart for needs by category, ErrorBoundary around each section

## Milestone 7: Team Management
- **Status**: Complete
- **Commit**: `abfd0ca`
- **Deliverables**: Admin-only access gate, invite form (magic link via Supabase Auth), members table with role dropdown, activity leaderboard (interactions per member)

## Milestone 8: Settings + Polish
- **Status**: Complete
- **Commits**: `58fccc7`, `eaff639`
- **Deliverables**: Settings page (org name, default city/state, data export for all 5 tables), ErrorBoundary added to all remaining pages, accessibility improvements (label associations, aria-labels, sr-only labels), CLAUDE.md for session continuity

## Milestone 9: Documentation
- **Status**: Complete
- **Deliverables**: README.md, docs/SETUP.md, docs/TESTING.md, docs/ARCHITECTURE.md, PROGRESS.md, CLAUDE.md
