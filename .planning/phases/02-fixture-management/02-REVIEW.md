---
phase: 02-fixture-management
reviewed: 2026-06-02T12:00:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - package.json
  - src/app/(app)/fixture/[matchId]/actions.ts
  - src/app/(app)/fixture/[matchId]/loading.tsx
  - src/app/(app)/fixture/[matchId]/not-found.tsx
  - src/app/(app)/fixture/[matchId]/page.tsx
  - src/app/(app)/fixture/actions.ts
  - src/app/(app)/fixture/loading.tsx
  - src/app/(app)/fixture/page.tsx
  - src/app/(app)/jugadores/[id]/editar/page.tsx
  - src/app/(app)/layout.tsx
  - src/app/(app)/lista/actions.ts
  - src/components/fixture/DeleteMatchDialog.tsx
  - src/components/fixture/EmptyFixture.tsx
  - src/components/fixture/FixtureList.tsx
  - src/components/fixture/FixtureListShell.tsx
  - src/components/fixture/MatchAdminBar.tsx
  - src/components/fixture/MatchCard.tsx
  - src/components/fixture/MatchDetailHeader.tsx
  - src/components/fixture/MatchFab.tsx
  - src/components/fixture/MatchFormDialog.tsx
  - src/components/fixture/ResultBadge.tsx
  - src/components/fixture/ResultEditor.tsx
  - src/components/fixture/ScoringEventRow.tsx
  - src/components/fixture/ScoringSection.tsx
  - src/components/layout/DivisionSelector.tsx
  - src/context/DivisionContext.tsx
  - src/lib/matches/csv-parser.ts
  - src/lib/matches/schema.ts
  - src/lib/matches/utils.ts
  - src/lib/queries/matches.ts
  - supabase/migrations/20260530000000_matches.sql
findings:
  critical: 3
  warning: 4
  info: 4
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-02T12:00:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

Phase 2 introduces the fixture management module: matches table, scoring events, RLS policies, Server Actions for CRUD and scoring, and all the related UI components. The overall architecture is sound and consistent with the established infantiles pattern. The RLS migration is well-structured and the Server Actions perform explicit authorization checks on top of RLS.

Three critical issues were found. Two are authorization bugs in Server Actions — a TOCTOU race on match deletion (`deleteMatch` calls `requireAdmin` using a fresh `createClient()` that is unrelated to the client that issues the actual DELETE), and an ownership escape in `deleteScoringEvent` (the action verifies the caller can access `matchId`, but the `eventId` is never confirmed to belong to `matchId` before deleting). The third is a date parsing bug that silently shifts every match date by the browser timezone because `new Date(isoDate)` is used in `getMatchResult` for the "past unscored" guard in `MatchCard`.

Four warnings cover: the `tutora` role being inadvertently granted write access to matches, missing NOT NULL / CHECK constraints on `score_home`/`score_away` columns, a CSV parser that accepts any free-text date string without validation, and the coach `updateMatch` action allowing a non-manual URBA match to be overwritten.

Four informational items are also noted.

---

## Critical Issues

### CR-01: `deleteScoringEvent` does not verify the event belongs to the given `matchId`

**File:** `src/app/(app)/fixture/[matchId]/actions.ts:120-130`

**Issue:** `deleteScoringEvent(eventId, matchId)` calls `requireAdminOrCoachForMatch(matchId)` — which checks that the caller can access *that match* — then issues an unconditional `DELETE ... WHERE id = eventId`. The event's `match_id` foreign key is never cross-referenced against the caller-supplied `matchId`. A coach of Division A can therefore supply any `eventId` from Division B (which they cannot access) together with any `matchId` from Division A they do control, and the DELETE will succeed because RLS on `match_scoring_events` only checks that the caller has access to the event's own match via the `scoring_delete` policy. Since the event belongs to Division B, the RLS policy will block it — BUT only if `supabase as any` does not bypass RLS. In the current implementation the service-role key is not used, so RLS does protect the data here. However, the authorization check is conceptually incomplete and fragile: if the client is ever switched to a service-role key (e.g., for an import route), the gap becomes a real deletion bypass. More importantly, an authenticated user with access to Match A can supply `eventId` from Match A with a *different* `matchId` from Match B that they also access, and the event from Match A will be deleted while the revalidation path points at Match B — causing a stale cache on Match A.

**Fix:**
```typescript
export async function deleteScoringEvent(eventId: string, matchId: string): Promise<void> {
  await requireAdminOrCoachForMatch(matchId)
  const supabase = createClient()
  // Scope the DELETE to both eventId AND matchId to prevent cross-match deletion
  // and ensure cache invalidation always matches what was actually deleted.
  const { error } = await (supabase as any)
    .from('match_scoring_events')
    .delete()
    .eq('id', eventId)
    .eq('match_id', matchId)   // <-- add this
  if (error) throw new Error('No se pudo borrar el evento: ' + error.message)
  revalidatePath(`/fixture/${matchId}`)
}
```

---

### CR-02: `deleteMatch` authorization check uses a different Supabase client than the DELETE

**File:** `src/app/(app)/fixture/actions.ts:116-123`

**Issue:** `deleteMatch` calls `requireAdmin()`, which internally calls `createClient()` and returns `{ userId }`. The action then calls `createClient()` again to issue the DELETE. Because `createClient()` reads cookies via Next.js APIs and constructs a new client each call, both clients represent the same authenticated session in normal operation. However, the TOCTOU (time-of-check to time-of-use) gap means that if a user's role is demoted to non-admin between the `requireAdmin()` check and the `DELETE` call, the deletion will still proceed — because the RLS policy on the second client is re-evaluated from the current session cookie, not from the result returned by `requireAdmin()`. This is a theoretical concern in practice (role changes are rare) but a structural correctness issue: the authorization check and the mutating operation should use the same client instance.

More practically: `requireAdmin()` does not pass the verified `userId` into `deleteMatch`, so the DELETE is not scoped to `created_by`. An admin can delete any match, including URBA-imported ones — this is intentional per the design, but the lack of a `manual`-flag guard means automated reimport could be accidentally removed. This is a design concern rather than a security bug, but worth flagging.

**Fix:** Refactor the helpers to accept and reuse a single `supabase` client:
```typescript
export async function deleteMatch(matchId: string): Promise<void> {
  const supabase = createClient()
  // Re-use same client for both auth check and mutation
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if ((data as any)?.role !== 'admin') throw new Error('Solo admin puede realizar esta accion')

  const { error } = await (supabase as any).from('matches').delete().eq('id', matchId)
  if (error) throw new Error('No se pudo eliminar el partido: ' + error.message)
  revalidatePath('/fixture')
}
```

---

### CR-03: `MatchCard` date comparison silently shifts in non-UTC timezones

**File:** `src/components/fixture/MatchCard.tsx:31`

**Issue:** The `isPastUnscored` guard uses:
```ts
const isPastUnscored = result === 'pending' && new Date(match_date + 'T23:59:59') < new Date()
```
`match_date` is a `YYYY-MM-DD` string. Appending `T23:59:59` without a timezone offset makes it a *local-time* date, which is correct in the browser. However `getMatchResult` in `utils.ts` has a `_matchDate` parameter that is accepted but entirely ignored (line 6, annotated with `eslint-disable` for unused-vars). The original intent — presumably to avoid showing "pending" for future matches — is unimplemented. The `isPastUnscored` logic is therefore the only place the date is used, and it works correctly *in the browser*. The bug manifests in SSR/SSG: `MatchCard` is a Server Component in Next.js App Router **only if it has no `'use client'` directive**, but it does not have one. However its parent `FixtureList` is `'use client'`, so `MatchCard` always renders client-side — meaning the local-time construction is safe *today*. If `MatchCard` is ever moved to the server, the `T23:59:59` without offset will shift the date in UTC-offset server environments.

The deeper issue is that `_matchDate` in `getMatchResult` is accepted but never used, making the function signature misleading:

```typescript
// utils.ts line 6-7
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_matchDate: string
```

**Fix:** Either remove the dead parameter from `getMatchResult`, or implement the intended "future match = pending, not past-unscored" logic:
```typescript
// utils.ts
export function getMatchResult(
  scoreHome: number | null,
  scoreAway: number | null,
  matchDate: string
): MatchResult {
  if (scoreHome === null || scoreAway === null) return 'pending'
  if (scoreHome > scoreAway) return 'won'
  if (scoreHome < scoreAway) return 'lost'
  return 'draw'
}

// MatchCard.tsx — use UTC-safe comparison
const matchEndUtc = new Date(match_date + 'T23:59:59Z')
const isPastUnscored = result === 'pending' && matchEndUtc < new Date()
```

---

## Warnings

### WR-01: `tutora` role is silently granted write access to matches

**File:** `src/app/(app)/fixture/actions.ts:11-32` and `src/app/(app)/fixture/[matchId]/actions.ts:17-57`

**Issue:** Both `requireAdminOrCoachForDivision` and `requireAdminOrCoachForMatch` allow any authenticated user whose `coach_divisions` row matches to proceed — and the role is cast to `'admin' | 'coach' | 'tutora'` with no check against `tutora`. If a `tutora` user has a `coach_divisions` row (which is plausible since the coaches_divisions table is not gated by role), they will pass authorization and can create, update, and score matches. This contradicts the typical read-only semantics of a `tutora`. The `requireAdmin` helper is correctly role-restricted, but the two coach-level guards are not.

**Fix:** Add an explicit role check if `tutora` must be read-only:
```typescript
// After resolving role:
if (role === 'tutora') throw new Error('Las tutoras no pueden modificar el fixture')
// ...then proceed with coach_divisions check
```
If `tutora` is intentionally allowed to write, document it explicitly.

---

### WR-02: CSV parser accepts any string as a date — no format validation

**File:** `src/lib/matches/csv-parser.ts:38-62`

**Issue:** The `fecha` column (column index 2) is stored directly as `ParsedMatch.fecha` with no format or date-validity check. The column is described as a `YYYY-MM-DD` date but the parser never verifies this. An invalid value like `"32/13/2026"` or an empty string passes silently through to the import. When the import action writes this to `matches.match_date` (a `date` column), Postgres will reject it with an error that surfaces as a generic 500. More subtly, a value like `"2026-1-5"` (without zero-padding) will be accepted by Postgres but will fail the Zod regex `^\d{4}-\d{2}-\d{2}$` in `MatchFormSchema` — meaning CSV import bypasses the same validation that the form enforces.

**Fix:**
```typescript
// Add after the local_visitante check in csv-parser.ts
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
if (!DATE_RE.test(fecha)) {
  errors.push({ row: rowNum, message: `Fecha inválida (esperado YYYY-MM-DD): "${fecha}"` })
  return
}
// Optionally also validate it is a real calendar date:
const d = new Date(fecha + 'T12:00:00')
if (isNaN(d.getTime())) {
  errors.push({ row: rowNum, message: `Fecha no es una fecha válida: "${fecha}"` })
  return
}
```

---

### WR-03: `updateMatch` does not protect URBA-imported matches from being overwritten by a coach

**File:** `src/app/(app)/fixture/actions.ts:86-114`

**Issue:** `updateMatch` checks that a coach cannot move a match to a different division (`parsed.division_id !== match.division_id`), but there is no check on `match.manual`. A coach can therefore overwrite the `rival`, `match_date`, `venue`, and other fields of an auto-imported URBA match. The `manual` flag was explicitly noted in a code comment (`// Manually created: preserved during URBA reimport (D-12)`) to differentiate manually created matches from imported ones, but no write protection is applied for non-manual matches at the coach level.

**Fix:**
```typescript
// In updateMatch, after resolving `role` and `match`:
if (role !== 'admin' && !match.manual) {
  throw new Error('Solo admin puede modificar partidos importados del fixture URBA')
}
```

---

### WR-04: `score_home` / `score_away` lack `CHECK (value >= 0)` in the migration

**File:** `supabase/migrations/20260530000000_matches.sql:16-17`

**Issue:** The `score_home` and `score_away` columns are typed `integer` with no `CHECK` constraint. The Zod schema enforces `min(0).max(200)` in the application layer, but nothing prevents a direct Supabase API call (or future server action that bypasses validation) from inserting `score_home = -5`. The `matches_score_consistency` constraint only checks for NULL-pairing, not range validity.

**Fix:**
```sql
score_home    integer CHECK (score_home >= 0 AND score_home <= 500),
score_away    integer CHECK (score_away >= 0 AND score_away <= 500),
```
(500 as a db-level cap is deliberately looser than the UI's 200 to allow extraordinary rugby scores without requiring a migration.)

---

## Info

### IN-01: `jugadores/[id]/editar/page.tsx` fetches the player before checking auth

**File:** `src/app/(app)/jugadores/[id]/editar/page.tsx:15-18`

**Issue:** `getById(params.id)` is called before `supabase.auth.getUser()`. If `getById` goes through RLS this is safe, but the ordering is surprising: an unauthenticated request will call `getById` (incurring a DB round-trip) before being caught by the auth check. If RLS is misconfigured or `getById` is called without auth context, player data could be returned before the 401/redirect fires.

**Fix:** Move `supabase.auth.getUser()` and the redirect above the `getById` call.

---

### IN-02: `FixtureListShell` shows the FAB (`MatchFab`) to non-admin users regardless of role

**File:** `src/components/fixture/FixtureListShell.tsx:43-48`

**Issue:** `showFab` is `!!activeDivision` with no role check. The FAB opens `MatchFormDialog`, which calls the `createMatch` Server Action. The Server Action correctly gates access, so security is not impacted. However, a `tutora` user who is read-only by convention will see the "+ Agregar partido" FAB and receive a server-side error only after attempting to submit. The UI should reflect role limitations before the user reaches the error.

**Fix:**
```tsx
const showFab = !!activeDivision && (isAdmin || userRole === 'coach')
// Pass `isAdmin` down or read `userRole` from context
```

---

### IN-03: Unused `_matchDate` parameter in `getMatchResult` creates misleading API

**File:** `src/lib/matches/utils.ts:6-7`

**Issue:** The `_matchDate` parameter is declared, annotated as unused, and suppressed with an eslint-disable comment. Every call site passes a real value for it. This creates a contract that callers expect to influence the result, which it does not. If `getMatchResult` is ever tested or reused, the silent no-op will be confusing.

**Fix:** Remove the parameter from the function signature and update the two call sites (`MatchCard.tsx:30` and any other callers) to drop the third argument.

---

### IN-04: `@hookform/resolvers` is in dependencies but `react-hook-form` integration is not used in any fixture component

**File:** `package.json:12`

**Issue:** `@hookform/resolvers: ^5.4.0` is listed as a production dependency. None of the fixture components reviewed use `react-hook-form`; forms are managed with plain `useState`. The package adds bundle weight and an extra dependency to audit. If it is used in other existing modules (outside this phase's scope) this can be ignored; otherwise it should be removed.

**Fix:** Audit usage with `grep -r 'hookform' src/`. If not used, run `npm uninstall @hookform/resolvers`.

---

_Reviewed: 2026-06-02T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
