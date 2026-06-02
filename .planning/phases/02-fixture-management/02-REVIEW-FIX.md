---
phase: 02-fixture-management
fixed_at: 2026-06-02T12:30:00Z
review_path: .planning/phases/02-fixture-management/02-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-02T12:30:00Z
**Source review:** .planning/phases/02-fixture-management/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (3 Critical + 4 Warning)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: `deleteScoringEvent` does not verify the event belongs to the given `matchId`

**Files modified:** `src/app/(app)/fixture/[matchId]/actions.ts`
**Commit:** b6f723b
**Applied fix:** Added `.eq('match_id', matchId)` to the DELETE query in `deleteScoringEvent`, scoping the delete to both the event ID and the match ID. This prevents cross-match deletion and ensures cache revalidation always targets the correct match.

---

### CR-02: `deleteMatch` authorization check uses a different Supabase client than the DELETE

**Files modified:** `src/app/(app)/fixture/actions.ts`
**Commit:** b729f6c
**Applied fix:** Removed the `requireAdmin()` helper (now dead code) and inlined the admin check directly inside `deleteMatch` using the same `supabase` client instance that issues the DELETE. This eliminates the TOCTOU gap between the auth check and the mutating operation.

---

### CR-03: `MatchCard` date comparison silently shifts in non-UTC timezones

**Files modified:** `src/lib/matches/utils.ts`, `src/components/fixture/MatchCard.tsx`, `src/lib/matches/utils.test.ts`
**Commit:** d1ecc85
**Applied fix:** Removed the dead `_matchDate` parameter (and its `eslint-disable-next-line` suppression comment) from `getMatchResult`. Updated `MatchCard.tsx` to call `getMatchResult(score_home, score_away)` without the third argument, and changed the `isPastUnscored` date construction from `T23:59:59` to `T23:59:59Z` for UTC-safe comparison. Updated all four `getMatchResult` call sites in `utils.test.ts` to drop the third argument.

---

### WR-01: `tutora` role is silently granted write access to matches

**Files modified:** `src/app/(app)/fixture/actions.ts`, `src/app/(app)/fixture/[matchId]/actions.ts`
**Commit:** a80642f
**Applied fix:** Added `if (role === 'tutora') throw new Error('Las tutoras no pueden modificar el fixture')` in both `requireAdminOrCoachForDivision` (in `fixture/actions.ts`) and the local `requireAdminOrCoachForMatch` (in `[matchId]/actions.ts`). The guard is placed after the admin short-circuit and before the `coach_divisions` check, so tutora users are rejected before any division ownership query runs.

---

### WR-02: CSV parser accepts any string as a date — no format validation

**Files modified:** `src/lib/matches/csv-parser.ts`
**Commit:** 8ba7f8a
**Applied fix:** Added two validation steps after the `local_visitante` check: a regex test (`/^\d{4}-\d{2}-\d{2}$/`) that rejects any date not matching the YYYY-MM-DD format, followed by a `new Date(...).getTime()` `isNaN` check that rejects calendar-invalid dates (e.g., 2026-02-30). Both push a descriptive error to the `errors` array and return early.

---

### WR-03: `updateMatch` does not protect URBA-imported matches from being overwritten by a coach

**Files modified:** `src/app/(app)/fixture/actions.ts`
**Commit:** e7ec3ff
**Applied fix:** Added `if (role !== 'admin' && !match.manual) throw new Error('Solo admin puede modificar partidos importados del fixture URBA')` at the top of the guard block in `updateMatch`, before the existing division-change check. Coaches can still edit matches they created manually (`manual=true`).

---

### WR-04: `score_home` / `score_away` lack `CHECK (value >= 0)` in the migration

**Files modified:** `supabase/migrations/20260531000000_matches_score_check.sql` (new file)
**Commit:** d2464eb
**Applied fix:** Created a new migration file `20260531000000_matches_score_check.sql` that adds two named CHECK constraints — `matches_score_home_range` and `matches_score_away_range` — enforcing `>= 0 AND <= 500` on both score columns. The DB-level cap of 500 is intentionally looser than the UI's 200 to allow extraordinary scores without requiring a future migration.

---

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-06-02T12:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
