---
phase: 01-foundation-players-attendance
plan: "02"
subsystem: auth-shell
tags: [supabase-ssr, auth, middleware, division-context, bottom-nav, admin, migration, rls]
dependency_graph:
  requires:
    - "01-01: runtime deps, shadcn components, dark palette"
  provides:
    - Supabase SSR client trio (server / browser / admin) with Database types
    - Middleware auth gate (getUser, not getSession) with PWA asset exclusions
    - Magic-link login screen + Server Action
    - Auth callback route handler
    - DivisionContext + localStorage persistence (vrc_active_division)
    - useOnlineStatus hook
    - OfflineBanner component
    - (app) layout: auth+division guard, DivisionProvider, header, bottom nav, Toaster
    - BottomNav: 5 tabs (Jugadores/Lista active; Fixture/Estadística always disabled; Admin admin-only)
    - AppHeader with DivisionSelector (hidden when <2 divisions)
    - PendingActivationScreen for coaches with no juvenile divisions
    - PlaceholderScreen used by Fixture and Estadística
    - Admin coach creation Server Actions (ADM-01): inviteUserByEmail + profiles + coach_divisions
    - player_positions migration SQL with full RLS (coach-scoped via coach_divisions)
  affects:
    - All subsequent plans: they build inside this auth shell and assume DivisionContext + active division exist
tech_stack:
  added:
    - "server-only@0.0.1 (import guard for server.ts and admin.ts)"
  patterns:
    - "Supabase SSR: createServerClient<Database> with cookies() adapter; try/catch setAll for Server Components"
    - "Middleware: createServerClient without Database generic (no Next.js cache); auth.getUser() validates server-side"
    - "Admin client: createClient<Database> from @supabase/supabase-js with SUPABASE_SERVICE_ROLE_KEY"
    - "Type assertions (as unknown as T): hand-written Database types cause never inference for Insert:never tables; cast at query boundaries"
    - "Two-step division query: avoid embedded join type errors by querying coach_divisions then filtering divisions by id"
    - "Server Actions with zod v4: use parsed.error.issues[0] not .errors[0]"
key_files:
  created:
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/admin.ts
    - src/lib/supabase/database.types.ts
    - src/middleware.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/actions.ts
    - src/app/api/auth/callback/route.ts
    - src/context/DivisionContext.tsx
    - src/hooks/useDivision.ts
    - src/hooks/useOnlineStatus.ts
    - src/components/layout/OfflineBanner.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/page.tsx
    - src/app/(app)/jugadores/page.tsx
    - src/app/(app)/lista/page.tsx
    - src/app/(app)/fixture/page.tsx
    - src/app/(app)/estadistica/page.tsx
    - src/app/(app)/admin/page.tsx
    - src/app/(app)/admin/actions.ts
    - src/components/layout/AppHeader.tsx
    - src/components/layout/BottomNav.tsx
    - src/components/layout/DivisionSelector.tsx
    - src/components/layout/PendingActivationScreen.tsx
    - src/components/layout/PlaceholderScreen.tsx
    - supabase/config.toml
    - supabase/migrations/20260527000000_player_positions.sql
  modified:
    - src/app/page.tsx (redirect to /jugadores)
    - package.json (server-only added)
    - package-lock.json
decisions:
  - "Two-step coach_divisions query instead of embedded join: avoids TypeScript never inference caused by Insert:never in hand-written Database types for divisions/coach_divisions tables"
  - "zod v4 uses .issues not .errors on ZodError: updated signInWithMagicLink and createCoach accordingly"
  - "Admin tab in BottomNav is active for admin users in Phase 1 (ADM-01 real); disabled with toast for non-admin"
  - "supabase db push blocked: requires SUPABASE_ACCESS_TOKEN + .env.local with Supabase credentials — deferred to Task 4 checkpoint"
  - "PendingActivationScreen uses inline server action (signOutAction) to avoid creating a separate client component file"
metrics:
  duration_minutes: 45
  completed_date: "2026-05-27"
  tasks_completed: 3
  tasks_total: 4
  files_created: 27
  files_modified: 3
---

# Phase 01 Plan 02: Auth Shell — Supabase Clients, Middleware, App Layout, ADM-01, Migration Summary

**One-liner:** Supabase SSR client trio with auth middleware (getUser), magic-link login, (app) layout with division guard and 5-tab bottom nav, ADM-01 coach creation Server Action, and player_positions migration SQL with coach-scoped RLS policies.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Supabase clients, middleware, login, division context | 9e22e9b | src/lib/supabase/*.ts, src/middleware.ts, src/app/(auth)/login/*, src/context/DivisionContext.tsx, src/hooks/*, src/components/layout/OfflineBanner.tsx |
| 2 | App shell — layout, bottom nav, admin, placeholders | afbcc9a | src/app/(app)/layout.tsx, src/components/layout/BottomNav.tsx + AppHeader + DivisionSelector + PendingActivationScreen + PlaceholderScreen, src/app/(app)/admin/* |
| 3 | player_positions Supabase migration + supabase init | 17a4b17 | supabase/config.toml, supabase/migrations/20260527000000_player_positions.sql |

---

## Checkpoint: Task 4 — Human Verification Required

Task 4 is a `checkpoint:human-verify` gate. The agent has stopped here.

### What was built

- Middleware auth gate: all `/(app)/*` routes redirect to `/login` when no session
- Magic-link login page at `/login` with Supabase OTP + callback at `/api/auth/callback`
- `(app)` layout: fetches profile + juvenile divisions, shows PendingActivationScreen (no nav) if no divisions, otherwise renders full shell
- Bottom nav: 5 tabs — Jugadores and Lista are clickable links; Fixture and Estadística are always disabled; Admin tab is active for admin users only, disabled + toast for coaches
- Division selector in header: hidden when <2 divisions, persists in localStorage `vrc_active_division`
- Admin page `/admin`: create coach form (full_name + email + division checkboxes) + coaches list
- `createCoach` Server Action: inviteUserByEmail + insert profile + insert coach_divisions, admin-guarded
- `player_positions` migration file committed; **push to live Supabase is pending** (requires credentials)

### Pending before plan is fully complete

1. **`.env.local`** must be created with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

2. **`SUPABASE_ACCESS_TOKEN`** env var must be set (personal access token from supabase.com/dashboard > Account > Access Tokens)

3. Run: `npx supabase link --project-ref <ref>` then `npx supabase db push`

4. Verify table exists: `npx supabase db remote exec --query "SELECT to_regclass('public.player_positions') AS exists;"`

5. Manual verification per Task 4 checklist (login flow, division switching, admin coach creation, player_positions table in dashboard)

---

## Verification Results

- `npx tsc --noEmit` — exits 0
- `npm run build` — exits 0, 12 static/dynamic pages generated correctly
- Automated file content checks — all pass
- `supabase db push` — **pending** (auth gate: SUPABASE_ACCESS_TOKEN not set in environment)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] zod v4 uses `.issues` not `.errors` on ZodError**
- **Found during:** Task 1 (`npx tsc --noEmit`)
- **Issue:** `parsed.error.errors` does not exist in zod v4 (^4.4.3). The property is `parsed.error.issues`.
- **Fix:** Changed `parsed.error.errors[0]?.message` to `parsed.error.issues[0]?.message` in both `login/actions.ts` and `admin/actions.ts`.
- **Files modified:** `src/app/(auth)/login/actions.ts`, `src/app/(app)/admin/actions.ts`
- **Commit:** 9e22e9b

**2. [Rule 1 - Bug] Hand-written Database types cause `never` inference for Insert:never tables**
- **Found during:** Task 2 (`npx tsc --noEmit`)
- **Issue:** The hand-written `Database` type uses `Insert: never` and `Update: never` for `divisions` and `coach_divisions` (read-only shared tables). The Supabase TypeScript client uses the `Insert` type for both insert operations AND query result typing. When `Insert: never`, `.select()` queries on related tables also infer `never`, causing TypeScript errors across `layout.tsx`, `admin/page.tsx`, and `admin/actions.ts`.
- **Fix 1:** Rewrote `(app)/layout.tsx` to use a two-step query (fetch coach_divisions → fetch divisions filtered by id) instead of the embedded `divisions!inner(...)` join. Added explicit type assertions at query boundaries.
- **Fix 2:** Rewrote `admin/page.tsx` to fetch `divisions`, `profiles`, and `coach_divisions` as separate queries, then join in memory using a lookup map.
- **Fix 3:** Added type assertions (`as unknown as never`) on insert operations in `admin/actions.ts` since the Supabase client's insert type is inferred from `Database.Tables.*.Insert`.
- **Files modified:** `src/app/(app)/layout.tsx`, `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/actions.ts`
- **Commit:** afbcc9a

### Auth Gate

**SUPABASE_ACCESS_TOKEN not set — `supabase db push` blocked**
- **Task:** Task 3 (push migration to live DB)
- **What was done:** `supabase init` completed, migration file created and committed. `supabase link` and `supabase db push` require `SUPABASE_ACCESS_TOKEN`.
- **Resolution needed:** User must provide `.env.local` and `SUPABASE_ACCESS_TOKEN` to complete the DB push (see Checkpoint details above).

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Jugadores page content | `src/app/(app)/jugadores/page.tsx` | Plan 03 implements player CRUD; stub shows placeholder card |
| Lista page content | `src/app/(app)/lista/page.tsx` | Plan 05 implements attendance; stub shows placeholder card |
| Fixture/Estadística pages | `src/app/(app)/fixture/page.tsx`, `src/app/(app)/estadistica/page.tsx` | Phase 2+ features; PlaceholderScreen per D-02 — intentional by plan |

The Jugadores and Lista stubs do NOT prevent this plan's goal (auth shell + division context + ADM-01) from being achieved. They are explicitly scoped to Plans 03 and 05.

---

## Threat Surface Scan

All threat mitigations from the plan's `<threat_model>` are implemented:

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-01-05 | Mitigated | `supabase.auth.getUser()` in middleware (not `getSession`) |
| T-01-06 | Mitigated | `requireAdmin()` check at top of every admin Server Action; UI tab hiding is not security |
| T-01-07 | Mitigated | `admin.ts` starts with `import 'server-only'`; `SUPABASE_SERVICE_ROLE_KEY` not prefixed `NEXT_PUBLIC_` |
| T-01-08 | Mitigated | player_positions RLS policy joins players → coach_divisions and checks `coach_id = auth.uid()` |
| T-01-09 | Mitigated | RLS UPDATE policy mirrors INSERT policy |
| T-01-10 | Mitigated | `updated_by` + `updated_at` trigger in migration; Server Action must set `updated_by = auth.uid()` on writes |
| T-01-11 | Accepted | Supabase Auth rate-limits OTP send per email |
| T-01-12 | Mitigated | Callback route only redirects to hardcoded `/jugadores` or `/login?error=callback` |
| T-01-13 | Mitigated | next-pwa precaches only static assets; no runtime caching of pages or API routes |

No new threat surface introduced beyond the plan's threat model.

---

## Self-Check: PASSED

Files created check:
- `src/lib/supabase/server.ts` — FOUND
- `src/lib/supabase/client.ts` — FOUND
- `src/lib/supabase/admin.ts` — FOUND
- `src/lib/supabase/database.types.ts` — FOUND
- `src/middleware.ts` — FOUND
- `src/app/(auth)/login/page.tsx` — FOUND
- `src/app/(auth)/login/actions.ts` — FOUND
- `src/app/api/auth/callback/route.ts` — FOUND
- `src/context/DivisionContext.tsx` — FOUND
- `src/hooks/useDivision.ts` — FOUND
- `src/hooks/useOnlineStatus.ts` — FOUND
- `src/components/layout/OfflineBanner.tsx` — FOUND
- `src/app/(app)/layout.tsx` — FOUND
- `src/components/layout/BottomNav.tsx` — FOUND
- `src/components/layout/AppHeader.tsx` — FOUND
- `src/components/layout/DivisionSelector.tsx` — FOUND
- `src/components/layout/PendingActivationScreen.tsx` — FOUND
- `src/components/layout/PlaceholderScreen.tsx` — FOUND
- `src/app/(app)/admin/actions.ts` — FOUND
- `src/app/(app)/admin/page.tsx` — FOUND
- `supabase/config.toml` — FOUND
- `supabase/migrations/20260527000000_player_positions.sql` — FOUND

Commits check:
- 9e22e9b — FOUND
- afbcc9a — FOUND
- 17a4b17 — FOUND
