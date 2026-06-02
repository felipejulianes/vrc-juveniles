---
phase: 02-fixture-management
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - package.json
  - src/app/(app)/admin/fixture-import/FixtureImportClient.tsx
  - src/app/(app)/admin/fixture-import/actions.ts
  - src/app/(app)/admin/fixture-import/page.tsx
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
  - src/lib/matches/csv-parser.test.ts
  - src/lib/matches/csv-parser.ts
  - src/lib/matches/schema.ts
  - src/lib/matches/utils.test.ts
  - src/lib/matches/utils.ts
  - src/lib/queries/matches.ts
  - src/lib/supabase/database.types.ts
  - supabase/migrations/20260531000000_matches_score_check.sql
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-02
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

Phase 02 delivers fixture management: CSV import of the URBA schedule, manual match creation/editing/deletion, and per-match result and scoring-event tracking. The auth/authorization layer is sound — server actions consistently re-validate identity and role before any mutation, tutora is blocked from writes, and coaches are scoped to their own divisions. The CSV parser is server-side and re-parsed on confirm (the client parse is preview-only), which is correct. No critical security issues were found.

Four warnings cover real correctness risks: a non-atomic delete+insert in the URBA import that can produce partial state if the insert fails mid-way; a CSV parser that accepts calendar-impossible dates like `2026-02-30`; an unauthenticated player lookup before the auth check in `EditarJugadorPage`; and the `requireAdminOrCoachForMatch` guard in `fixture/[matchId]/actions.ts` that defaults the role to `'coach'` when the profile row is missing. Four informational items cover minor quality points.

---

## Warnings

### WR-01: Non-atomic URBA import — partial state on insert failure

**File:** `src/app/(app)/admin/fixture-import/actions.ts:80-97`

**Issue:** The URBA import does a `DELETE` of existing matches followed by a separate `INSERT`. These two operations are not wrapped in a transaction. If the `INSERT` fails after the `DELETE` succeeds, the division's URBA matches are left in a blank state — all previous matches deleted, none of the new ones persisted. The comment in the code acknowledges this ("Trade-off: delete+insert no es atómico; si el insert falla el admin reintenta el import completo.") but the consequence is user-visible data loss until the admin re-imports.

**Fix:** Use a Postgres function or Supabase RPC that wraps both operations in a single transaction, or perform the insert first and only delete after the insert succeeds:

```typescript
// Option A: insert first into a staging approach, then swap
// Option B: RPC replace_urba_matches(division_ids, rows) that runs both in one transaction

// Minimal risk reversal: insert first, then delete old rows
const { error: insError } = await (supabase as any).from('matches').insert(rows)
if (insError) throw new Error('No se pudieron insertar los partidos: ' + insError.message)

// Now safe to delete — new rows are already committed
const { error: delError } = await (supabase as any)
  .from('matches')
  .delete()
  .eq('manual', false)
  .in('division_id', divisionIds)
  .lt('created_at', insertTimestamp) // exclude rows just inserted
if (delError) throw new Error('No se pudieron borrar los partidos URBA previos: ' + delError.message)
```

A cleaner alternative is an RPC `replace_urba_matches(division_ids, rows)` that runs both inside a single DB transaction.

---

### WR-02: CSV date validation accepts calendar-impossible dates (e.g. `2026-02-30`)

**File:** `src/lib/matches/csv-parser.ts:49-58`

**Issue:** The parser validates the date format with a regex (`/^\d{4}-\d{2}-\d{2}$/`) and then creates a `new Date(fecha + 'T12:00:00')`. JavaScript's `Date` silently rolls over out-of-range dates — `2026-02-30` becomes `2026-03-02` without any parse error. The `isNaN(parsedDate.getTime())` check does not catch this. A typo in the day field will silently produce a match on the wrong date.

**Fix:** After constructing the date, compare the parsed components back to the original string:

```typescript
const parsedDate = new Date(fecha + 'T12:00:00')
if (isNaN(parsedDate.getTime())) {
  errors.push({ row: rowNum, message: `Fecha no es una fecha válida: "${fecha}"` })
  return
}
// Catch rollover (e.g. 2026-02-30 silently becomes 2026-03-02)
const [y, m, d] = fecha.split('-').map(Number)
if (
  parsedDate.getFullYear() !== y ||
  parsedDate.getMonth() + 1 !== m ||
  parsedDate.getDate() !== d
) {
  errors.push({ row: rowNum, message: `Fecha inválida (día fuera de rango): "${fecha}"` })
  return
}
```

---

### WR-03: Player fetched before auth check in `EditarJugadorPage`

**File:** `src/app/(app)/jugadores/[id]/editar/page.tsx:16-26`

**Issue:** `getById(params.id)` is called on line 16, before `supabase.auth.getUser()` is called on line 23. An unauthenticated request will hit the database and retrieve a player record before the auth redirect fires. While RLS on the `players` table should prevent data leakage, the order creates an unnecessary dependency on RLS being correctly configured and performs wasteful work before confirming identity.

**Fix:** Move the auth check before `getById`:

```typescript
export default async function EditarJugadorPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const player = await getById(params.id)
  if (!player) notFound()
  // ... rest of function
}
```

---

### WR-04: Missing profile row silently defaults to `'coach'` role in server actions

**File:** `src/app/(app)/fixture/[matchId]/actions.ts:32-34`

**Issue:** When fetching the user's profile returns `null` (profile not yet created, or a silent DB error), the role defaults to `'coach'`:

```typescript
const role = (
  (profileData as Pick<ProfileRow, 'role'> | null)?.role ?? 'coach'
) as 'admin' | 'coach' | 'tutora'
```

A user without a profile would be granted coach-level write access to any match their division allows, rather than being rejected. The same pattern exists in `src/app/(app)/fixture/actions.ts:22` and `src/app/(app)/fixture/page.tsx:14`. The layout shows `PendingActivationScreen` for profileless users, but the server actions do not follow that same pattern.

**Fix:** Treat a missing profile as unauthorized instead of defaulting to a permissive role:

```typescript
const profileRow = profileData as Pick<ProfileRow, 'role'> | null
if (!profileRow) throw new Error('No autorizado')
const role = profileRow.role as 'admin' | 'coach' | 'tutora'
```

Apply consistently in all three files.

---

## Info

### IN-01: `MatchFormDialog` form state not reset on re-open

**File:** `src/components/fixture/MatchFormDialog.tsx:47-54`

**Issue:** All form fields are initialized with `useState` from the `existing` prop at mount time. If the dialog is opened, cancelled, then opened again without unmounting, stale error messages and edits persist. The `errors` object is cleared on submit but not when the dialog closes via the Cancel button or the backdrop.

**Fix:** Add a `key` prop to force unmount/remount on open state changes, or call `setErrors({})` in the `onOpenChange` callback:

```tsx
// In the parent:
<MatchFormDialog
  key={creating ? (editingMatch?.id ?? 'new') : 'closed'}
  open={creating}
  onOpenChange={setCreating}
/>
```

---

### IN-02: CSV parser does not validate that `rival` is non-empty

**File:** `src/lib/matches/csv-parser.ts:66-75`

**Issue:** The parser does not check that `rival` has content before pushing to `matches`. A row like `M19,1,2026-04-11,,Local,,16:00` will produce a match with `rival: ''`. The Zod schema in `schema.ts` enforces `min(1)` for manual match creation, but the CSV import path does not go through Zod.

**Fix:**

```typescript
if (!rival) {
  errors.push({ row: rowNum, message: 'El nombre del rival es obligatorio' })
  return
}
```

---

### IN-03: `database.types.ts` — `player_positions` columns typed as `number | null` but likely stale after text migration

**File:** `src/lib/supabase/database.types.ts:751-753`

**Issue:** `player_positions.position_primary`, `position_alt1`, and `position_alt2` are typed as `number | null` in the generated types file. The project memory notes that these columns were migrated from `int` to `text`. If the DB migration was applied but `database.types.ts` was not regenerated, TypeScript will silently accept numeric values where strings are expected and vice versa, since the pages that use these fields cast with `as any`.

**Fix:** Regenerate types with `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` (or `--project-id`) after confirming the column migration status.

---

### IN-04: Commented-out `fechaNro` field — `MatchFormDialog` always sends `null`

**File:** `src/components/fixture/MatchFormDialog.tsx:65`

**Issue:** `fecha_nro: null` is hardcoded in the form input, meaning manually created matches never have a `fecha_nro` populated from the UI. The field exists in the schema (`z.number().int().min(1).max(50).optional().nullable()`), in the DB, and is rendered on match cards and headers. For URBA-imported matches this is populated from the CSV, but for manual matches it is always `null`. This may be intentional (manual matches are outside the URBA round system), but if coaches need to assign a round number to manual matches, the input is missing.

**Fix:** If intentional, add a code comment to `MatchFormDialog` explaining why `fecha_nro` is omitted. If the field should be editable, add a number input to the form.

---

_Reviewed: 2026-06-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
