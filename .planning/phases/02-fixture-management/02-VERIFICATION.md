---
phase: 02-fixture-management
verified: 2026-06-02T16:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "Admin can upload a URBA Excel file and see a preview of parsed matches before confirming the import"
    reason: "The import was deliberately simplified from Excel to CSV per decision D-10 in 02-CONTEXT.md. The fixture file fixture-virreyes-2026.csv is the canonical format. ExcelJS import is deferred to v2. The CSV import fully satisfies the intent: admin uploads file, sees preview, confirms. REQUIREMENTS.md and ROADMAP.md say 'Excel' but the context doc explicitly records the CSV decision before any plan was written."
    accepted_by: "gsd-verifier (re-verification 2026-06-02)"
    accepted_at: "2026-06-02T16:00:00Z"
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Admin can upload a URBA CSV file and see a preview of parsed matches before confirming the import (Plan 05 delivered /admin/fixture-import with upload → preview → confirm flow, admin-only guard, server-side re-parse, truncate+insert preserving manual matches)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Abrir /fixture como coach en un dispositivo iOS en modo standalone PWA"
    expected: "Cards apilados correctamente, badge coloreado visible, FAB no obstruye cards, DivisionSelector funciona"
    why_human: "Layout visual, touch targets, safe-area en iOS no se puede verificar programáticamente"
  - test: "Abrir /fixture/[id] como coach, ingresar score_home=24 score_away=17, guardar, volver a la lista"
    expected: "Badge en el card de la lista cambia a 'Ganado 24-17' (verde)"
    why_human: "Requiere datos reales en DB y navegación entre rutas con revalidatePath"
  - test: "En detalle de partido, expandir 'Detalles del resultado', agregar un try de Virreyes seleccionando un jugador, agregar un try del rival con nombre libre"
    expected: "Ambos eventos aparecen en la lista inmediatamente; jugador de Virreyes muestra nombre correcto"
    why_human: "Requiere nómina real en DB y comportamiento de revalidación"
  - test: "Loguear como admin, seleccionar 'Todas las divisiones' en el DivisionSelector"
    expected: "Headers M15 / M16 / M17 / M19 visibles con partidos agrupados bajo cada uno"
    why_human: "Requiere fixture con partidos en múltiples divisiones en DB"
  - test: "Como admin, abrir /admin/fixture-import, subir fixture-virreyes-2026.csv, verificar preview, confirmar import"
    expected: "Preview muestra ~60 partidos con columnas correctas; al confirmar, los partidos aparecen en /fixture agrupados por división; un partido manual previo sobrevive el reimport"
    why_human: "Requiere DB conectada, sesión de admin real, y validación de que la operación truncate+insert funciona end-to-end"
---

# Phase 02: Fixture Management — Verification Report (Re-verification)

**Phase Goal:** Coaches and admins can build and maintain the match calendar, record final scores, and import the URBA schedule from CSV (Excel→CSV per D-10)
**Verified:** 2026-06-02T16:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (Plan 05 added)

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Coach can view the upcoming and past matches for their division ordered by date | VERIFIED | `fixture/page.tsx` calls `listAllJuvenile()` server-side (RLS restricts to coach's divisions); `FixtureListShell` filters by `activeDivision`; `MatchCard` renders date, rival, result badge, subequipo chip |
| 2 | Coach or admin can manually add or edit a match (date, opponent, home/away, venue, division) | VERIFIED | `fixture/actions.ts` exports `createMatch`, `updateMatch`, `deleteMatch` with role-based auth; `MatchFormDialog` with all fields; `MatchFab` in `FixtureListShell`; `MatchAdminBar` opens `MatchFormDialog` with `existing` prop for edit |
| 3 | Admin can upload a URBA file and see a preview of parsed matches before confirming the import | VERIFIED (override) | `/admin/fixture-import` page exists with admin guard; `FixtureImportClient` implements upload → preview table → confirm flow; `confirmFixtureImport` server action does re-parse server-side, truncate `manual=false`, insert. Override: format is CSV not Excel per D-10. |
| 4 | Coach can record the final score of a played match (own goals and opponent goals) | VERIFIED | `ResultEditor` with score_home/score_away inputs; `saveResult` Server Action with `MatchResultSchema` validation; `ScoringSection` for 6 event types (all optional) |
| 5 | Admin can see the full fixture across all divisions | VERIFIED | `DivisionContext` with `ALL_DIVISIONS_SENTINEL`; `DivisionSelector` adds "Todas las divisiones" only for admin; `FixtureList` renders grouped by `division_name` when `isAllDivisions(activeDivision)` |

**Score:** 5/5 truths verified (1 with override for Excel→CSV)

---

### Re-verification: Gap Closed

**Previous gap:** Import UI missing — `parseFixtureCSV` existed but no page, no preview, no Server Action, `EmptyFixture` link was a 404.

**Plan 05 delivered:**
- `src/app/(app)/admin/fixture-import/page.tsx` — Server Component with admin guard (`redirect('/jugadores')` for non-admin), mounts `FixtureImportClient`
- `src/app/(app)/admin/fixture-import/actions.ts` — `confirmFixtureImport(csvText)`: admin-only via `requireAdmin()`, re-parses CSV server-side, resolves `division_id` from `divisions.name` where `is_juvenile=true`, aborts if unknown divisions BEFORE any delete, truncates `manual=false` matches scoped to CSV's divisions, inserts new URBA matches with `manual=false`, revalidates `/fixture`
- `src/app/(app)/admin/fixture-import/FixtureImportClient.tsx` — Client Component: step 1 upload with `accept=".csv"`, step 2 preview table (HTML table with Tailwind, no shadcn Table), errors section with `bg-destructive/20`, warning about URBA replacement, "Confirmar import" button calling `confirmFixtureImport`, success toast + router.push('/fixture')
- `EmptyFixture.tsx` link `href="/admin/fixture-import"` now resolves (no longer a 404)

**Regressions:** None found. All 4 previously-verified truths still hold. Build passes cleanly.

---

### Required Artifacts

#### Plan 02-01

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260530000000_matches.sql` | Schema matches + match_scoring_events + RLS | VERIFIED | Tables with RLS, 4 policies each, score_consistency constraint, updated_at trigger, 3 indexes |
| `supabase/migrations/20260531000000_matches_score_check.sql` | Score range CHECK constraints | VERIFIED | ADD CONSTRAINT matches_score_home_range + matches_score_away_range (>= 0, <= 500) |
| `src/lib/supabase/database.types.ts` | Types include matches and match_scoring_events | VERIFIED | `matches:` at line 443, `match_scoring_events:` at line 391; score_home, home_away, event_type, fecha_nro all present |
| `src/lib/matches/schema.ts` | MatchFormSchema, ScoringEventSchema, MatchResultSchema | VERIFIED | All 3 schemas exported with correct zod shapes; MatchResultSchema has cross-field refine |
| `src/lib/matches/utils.ts` | getMatchResult, formatMatchDate | VERIFIED | Both exported; signature `getMatchResult(scoreHome, scoreAway)` (2 params, _matchDate removed per CR-03); ICU separator normalization |
| `src/lib/matches/csv-parser.ts` | parseFixtureCSV | VERIFIED | Exports ParsedMatch, CsvParseResult, parseFixtureCSV; whitelist validation for divisions and home_away; 7-column check; CRLF normalization; date format validation (WR-02) |
| `src/lib/queries/matches.ts` | listByDivision, listAllJuvenile, getById, getWithEvents | VERIFIED | `import 'server-only'` line 1; 4 functions exported with real Supabase queries |

#### Plan 02-02

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/context/DivisionContext.tsx` | ALL_DIVISIONS_SENTINEL + userRole | VERIFIED | Exports ALL_DIVISIONS_ID, ALL_DIVISIONS_SENTINEL, isAllDivisions, UserRole; context includes userRole |
| `src/components/layout/DivisionSelector.tsx` | Admin-only "Todas las divisiones" option | VERIFIED | `options` array includes sentinel only if `userRole === 'admin'`; 3 references to `userRole`, 2 to `ALL_DIVISIONS_SENTINEL` |
| `src/app/(app)/fixture/page.tsx` | Server Component, listAllJuvenile, no PlaceholderScreen | VERIFIED | No `'use client'`; calls `listAllJuvenile()`; no PlaceholderScreen reference |
| `src/components/fixture/MatchCard.tsx` | Card linked to /fixture/[id] | VERIFIED | `Link href={/fixture/${id}}` line 36; date, rival, result badge, subequipo chip |
| `src/components/fixture/ResultBadge.tsx` | Ganado/Perdido/Empate/Pendiente badges | VERIFIED | All 4 variants with correct colors (green-700, red-700, secondary) |
| `src/components/fixture/FixtureList.tsx` | Client Component with grouped render | VERIFIED | `'use client'`; uses `isAllDivisions(activeDivision)` for grouped render |
| `src/components/fixture/EmptyFixture.tsx` | Role-differentiated empty states + import link | VERIFIED | "Sin partidos programados" (coach), "Sin partidos cargados" (admin); link to `/admin/fixture-import` now resolves |
| `src/app/(app)/fixture/loading.tsx` | 3 Skeleton h-[72px] | VERIFIED | 3 Skeleton `h-[72px] rounded-lg` |

#### Plan 02-03

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(app)/fixture/actions.ts` | createMatch, updateMatch, deleteMatch | VERIFIED | `'use server'`; 3 exports; tutora blocked (WR-01); URBA match edit blocked for coaches (WR-03); TOCTOU fixed (CR-02); `manual: true` in insert |
| `src/components/fixture/MatchFormDialog.tsx` | Dialog with zod validation, admin/coach division gating | VERIFIED | `'use client'`; `MatchFormSchema.safeParse` client-side; division `readOnly` for coach, `Select` for admin |
| `src/components/fixture/MatchFab.tsx` | FAB with safe-area positioning | VERIFIED | `aria-label="Agregar partido"`; `bottom: calc(80px + env(safe-area-inset-bottom))`; `w-14 h-14` |
| `src/components/fixture/DeleteMatchDialog.tsx` | Admin-only delete confirmation | VERIFIED | `'use client'`; calls `deleteMatch`; "Eliminar partido" |
| `src/components/fixture/FixtureListShell.tsx` | Shell with FAB + MatchFormDialog wired | VERIFIED | Imports `MatchFab` and `MatchFormDialog`; `creating` state drives both |

#### Plan 02-04

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(app)/fixture/[matchId]/page.tsx` | Server Component, getWithEvents, notFound | VERIFIED | No `'use client'`; calls `getWithEvents`; 3 notFound() references; loads players for division |
| `src/app/(app)/fixture/[matchId]/actions.ts` | saveResult, addScoringEvent, deleteScoringEvent | VERIFIED | `'use server'`; 3 exports; tutora blocked; deleteScoringEvent scoped by matchId (CR-01 fix) |
| `src/app/(app)/fixture/[matchId]/not-found.tsx` | "Partido no encontrado" | VERIFIED | Contains "Partido no encontrado" + link back to /fixture |
| `src/components/fixture/MatchDetailHeader.tsx` | Header with back link | VERIFIED | `Link href="/fixture"` with ChevronLeft |
| `src/components/fixture/ResultEditor.tsx` | Score editor with saveResult | VERIFIED | `'use client'`; `h-14 text-4xl font-bold` inputs; "Guardar resultado"; calls `saveResult` |
| `src/components/fixture/ScoringSection.tsx` | Expandable section with 6 event types | VERIFIED | `'use client'`; "Detalles del resultado"; 6 event types with add labels; `aria-expanded` |
| `src/components/fixture/ScoringEventRow.tsx` | Event row with delete | VERIFIED | `'use client'`; calls `deleteScoringEvent` |
| `src/components/fixture/MatchAdminBar.tsx` | Admin edit + delete bar (real, not stub) | VERIFIED | `'use client'`; opens `MatchFormDialog` with `existing` prop (real edit, no `window.alert` stub); opens `DeleteMatchDialog` |

#### Plan 02-05 (gap closure)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(app)/admin/fixture-import/page.tsx` | Admin-only Server Component mounting import client | VERIFIED | No `'use client'`; `redirect('/jugadores')` for non-admin; `redirect('/login')` for unauthenticated; mounts `FixtureImportClient` |
| `src/app/(app)/admin/fixture-import/actions.ts` | confirmFixtureImport server action | VERIFIED | `'use server'`; `requireAdmin()` guard; server-side re-parse; unknown division abort before delete; `.eq('manual', false).in('division_id', ...)` truncate; insert with `manual: false`; `revalidatePath('/fixture')` |
| `src/app/(app)/admin/fixture-import/FixtureImportClient.tsx` | Upload → preview → confirm client | VERIFIED | `'use client'`; `accept=".csv"`; `parseFixtureCSV` called client-side; preview table with 7 columns; `bg-destructive/20` error rows; "Confirmar import" / "Importando…"; `confirmFixtureImport` wired; `router.push('/fixture')` on success |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/queries/matches.ts` | `database.types.ts` | `import type { Database }` | WIRED | `Database['public']['Tables']['matches']['Row']` line 5 |
| `src/app/(app)/fixture/page.tsx` | `src/lib/queries/matches.ts` | `import listAllJuvenile` | WIRED | `from '@/lib/queries/matches'` line 3 |
| `src/components/layout/DivisionSelector.tsx` | `DivisionContext.userRole` | `useDivision().userRole` | WIRED | `userRole === 'admin'` line 19 |
| `src/components/fixture/MatchCard.tsx` | `/fixture/[matchId]` | `Link href` | WIRED | `` href={`/fixture/${id}`} `` line 36 |
| `src/components/fixture/MatchFormDialog.tsx` | `fixture/actions.ts` | `createMatch / updateMatch import` | WIRED | `from '@/app/(app)/fixture/actions'` |
| `src/app/(app)/fixture/actions.ts` | `MatchFormSchema` | `MatchFormSchema.parse` | WIRED | 2 `.parse` calls |
| `src/app/(app)/fixture/[matchId]/page.tsx` | `src/lib/queries/matches.ts` | `getWithEvents` | WIRED | imported and called line 32 |
| `src/components/fixture/ResultEditor.tsx` | `[matchId]/actions.ts` | `saveResult` | WIRED | `from '@/app/(app)/fixture/[matchId]/actions'` |
| `src/components/fixture/ScoringSection.tsx` | `[matchId]/actions.ts` | `addScoringEvent` | WIRED | line 17 |
| `src/app/(app)/admin/fixture-import/FixtureImportClient.tsx` | `src/lib/matches/csv-parser.ts` | `parseFixtureCSV` | WIRED | `import { parseFixtureCSV }` — gap closed |
| `src/app/(app)/admin/fixture-import/FixtureImportClient.tsx` | `./actions.ts` | `confirmFixtureImport` | WIRED | imported and called in `handleConfirm` |
| `src/app/(app)/admin/fixture-import/actions.ts` | `matches` table | `.eq('manual', false)` | WIRED | delete scoped to `manual=false` + `in('division_id', ...)` |
| `src/components/fixture/EmptyFixture.tsx` | `/admin/fixture-import` | `Link href` | WIRED | route now exists (no longer 404) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `fixture/page.tsx` | `matches` | `listAllJuvenile()` → Supabase `matches` JOIN `divisions` via RLS | Yes — real DB query | FLOWING |
| `fixture/[matchId]/page.tsx` | `match` | `getWithEvents(matchId)` → Supabase `matches` + `match_scoring_events` via RLS | Yes — real DB query | FLOWING |
| `fixture/[matchId]/page.tsx` | `players` | `listPlayersByDivision(match.division_id)` → Supabase `players` | Yes — real DB query | FLOWING |
| `ResultEditor` | `initialScoreHome/Away` | props from Server Component (match.score_home/away) | Yes — DB data | FLOWING |
| `ScoringSection` | `events` | props from Server Component (match.match_scoring_events) | Yes — DB data | FLOWING |
| `FixtureImportClient` | `parseResult` | `parseFixtureCSV(csvText)` from uploaded file | Yes — real file parse | FLOWING |
| `confirmFixtureImport` | `rows` | re-parsed from `csvText`, division_id resolved from `divisions` table | Yes — real DB query | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| 12 vitest tests on matches module | `npx vitest run src/lib/matches` | 2 test files, 12 tests passed | PASS |
| Build compiles all fixture routes | `npm run build` | `/fixture`, `/fixture/[matchId]`, `/admin/fixture-import` all appear in build output | PASS |
| EmptyFixture link resolves | `/admin/fixture-import` route exists in build | Route present in build output (3.47 kB) | PASS |
| No PlaceholderScreen in /fixture | `grep PlaceholderScreen fixture/page.tsx` | No match | PASS |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FIX-01 | 02-01, 02-05 | Admin puede importar fixture URBA desde archivo CSV | SATISFIED (override: CSV not Excel per D-10) | `/admin/fixture-import` page + `confirmFixtureImport` action + client upload flow |
| FIX-02 | 02-01, 02-05 | Import muestra previsualización antes de confirmar | SATISFIED | `FixtureImportClient` step 2: HTML table with 7 columns, error rows with `bg-destructive/20`, warning text |
| FIX-03 | 02-03 | Coach/admin puede agregar/editar partido manualmente | SATISFIED | `createMatch`, `updateMatch`; `MatchFormDialog` with all fields; `MatchFab`; `MatchAdminBar` edit |
| FIX-04 | 02-02 | Coach puede ver fixture de su división ordenado por fecha | SATISFIED | `fixture/page.tsx` + `FixtureListShell` + `MatchCard` ordered by `match_date ASC` |
| FIX-05 | 02-04 | Coach puede cargar resultado del partido | SATISFIED | `ResultEditor` + `saveResult` with `MatchResultSchema` validation |
| FIX-06 | 02-04 | Coach puede agregar anotadores de tries y tarjetas | SATISFIED | `ScoringSection` + `ScoringEventRow` + `addScoringEvent` (6 types, all optional) |
| ADM-02 | 02-02 | Admin puede ver fixture completo de todas las divisiones | SATISFIED | `ALL_DIVISIONS_SENTINEL`; `FixtureList` grouped by `division_name` |
| ADM-03 | 02-01, 02-05 | Admin puede importar fixture URBA (acción exclusiva de admin) | SATISFIED | `requireAdmin()` in `confirmFixtureImport`; `redirect('/jugadores')` in page guard |

---

### Anti-Patterns Found

None blocking. Previous blocker (EmptyFixture link to non-existent route) is resolved by Plan 05.

Input field `placeholder` attributes in MatchFormDialog, ResultEditor, and ScoringSection are legitimate HTML attributes, not code stubs.

---

### Human Verification Required

#### 1. Fixture visual rendering on mobile

**Test:** Open /fixture as a coach on an iOS device in PWA standalone mode
**Expected:** Cards stack correctly, colored result badge visible, FAB does not overlap last card, DivisionSelector popover works with touch
**Why human:** Visual layout, touch targets, safe-area inset on iOS cannot be verified programmatically

#### 2. Full result recording flow

**Test:** Open /fixture/[id] as a coach with a real match in DB, enter score_home=24 and score_away=17, tap "Guardar resultado", navigate back to the fixture list
**Expected:** The match card badge changes to "Ganado 24-17" (green) after revalidation
**Why human:** Requires real DB data and cross-route navigation with revalidatePath

#### 3. Scoring events end-to-end

**Test:** On a match detail page, expand "Detalles del resultado", add a try for Virreyes selecting a real player, add a try for the rival with a free-text name
**Expected:** Both events appear in the list immediately; Virreyes try shows the player's name; rival try shows the free-text name
**Why human:** Requires real player roster in DB and revalidation behavior

#### 4. Admin "Todas las divisiones" with real data

**Test:** Log in as admin, select "Todas las divisiones" in the DivisionSelector
**Expected:** Section headers M15 / M16 / M17 / M19 appear with matches grouped under each division
**Why human:** Requires fixture data in multiple divisions in DB

#### 5. CSV import end-to-end

**Test:** Log in as admin, open /admin/fixture-import, upload fixture-virreyes-2026.csv, verify the preview table shows ~60 rows, confirm import, check /fixture
**Expected:** Preview shows all 60 matches grouped by division in the table; after confirm, matches appear in /fixture; any pre-existing manual match survives the import
**Why human:** Requires live DB connection, admin session, and validation of the delete+insert atomic behavior

---

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are verified. All 8 requirements (FIX-01 through FIX-06, ADM-02, ADM-03) are satisfied. Plan 05 closed the only gap from the previous verification.

The Excel→CSV deviation is documented, intentional, and accepted via override (D-10 in 02-CONTEXT.md).

Automated checks pass: 12 vitest tests green, `npm run build` clean with all fixture routes compiled.

---

_Verified: 2026-06-02T16:00:00Z_
_Verifier: Claude (gsd-verifier) — re-verification after Plan 05 gap closure_
