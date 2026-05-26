# Project Research Summary

**Project:** VRC Juveniles PWA
**Domain:** Juvenile rugby team management (M15-M19, URBA circuit, Buenos Aires)
**Researched:** 2026-05-24
**Confidence:** HIGH

## Executive Summary

VRC Juveniles is a companion app to the live VRC Presentismo (infantiles) PWA. It shares the same Supabase project, auth system, and player database, which means the core architecture is already validated in production. The new app adds three capabilities that do not exist in the infantiles app: a URBA fixture calendar (with Excel import), match result recording, and a match-day lineup builder (positions 1-15 plus bench). The stack is essentially inherited. The only new dependencies are @dnd-kit/core family for drag-and-drop and the already-installed exceljs repurposed for reading instead of just writing.

The recommended build order follows the feature dependency chain: player position fields come first (everything downstream needs them), then attendance (which builds daily habit and is the data source for the lineup builder), then fixture management (calendar before team sheets), and finally the lineup builder as the crown differentiating feature. Match results attach to fixture records and can be built in the same phase as fixture. Stats and admin panels are largely copy-paste from infantiles and close out the build.

The dominant risk is the shared Supabase instance. A poorly-written migration can break the live infantiles app silently. The rule is simple: all new juveniles tables go into fresh migrations; shared tables (players, profiles, divisions, coach_divisions, training_sessions, attendance_records) receive additive-only changes if touched at all. The secondary risk is the lineup builder on iOS PWA. The HTML5 Drag and Drop API does not work on iOS Safari, so the implementation must use @dnd-kit with pointer-event sensors and should include a tap-to-select-then-tap-to-place fallback as the primary mobile interaction.

## Key Findings

### Recommended Stack

The infantiles stack is inherited without re-evaluation: Next.js 14 App Router, TypeScript, Tailwind, Supabase (@supabase/ssr pinned at 0.10.2), idb for the offline queue, recharts for stats charts, next-pwa@5.6.0, and exceljs@^4.4.0. The only addition is @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, and @dnd-kit/utilities@^3.2.2 for the team builder. react-markdown and remark-gfm are explicitly NOT needed (no wiki module planned for juveniles).

**Core technologies:**
- `@dnd-kit/core` + sortable + utilities: lineup builder drag-and-drop -- the only actively maintained DnD library with native pointer-event support on iOS Safari PWA; react-beautiful-dnd is officially deprecated
- `exceljs@^4.4.0`: URBA fixture import (read) and attendance export (write) -- already installed, handles Unicode correctly, runs server-side only in API routes
- `next-pwa@5.6.0`: PWA installability -- same version as infantiles; avoid upgrading to prevent divergence from a known-working config
- `@supabase/ssr@0.10.2` (pinned): SSR auth with cookies -- version must match infantiles exactly to share the same session cookies

### Expected Features

**Must have (table stakes):**
- Player CRUD with primary position (1-15) and optional alt position -- all downstream features depend on this
- Attendance with present/absent toggle, session history, offline queue -- daily use, builds habit
- Fixture calendar: manual add/edit with Excel import for admin -- coaches need the match calendar
- Match result: own score + rival score + match notes -- simplest useful post-match record
- Team builder: filter from attendees, assign players to numbered slots 1-15 plus flexible bench 16-23, show registered position as hint, save per match -- core thesis of the app
- Attendance stats: same KPIs as infantiles (year / 30d / since alta / per session trend)
- Admin CRUD: coaches with division assignment, pending activation screen for new accounts
- Tutora panel: interview log per player (same model as infantiles, low-complexity port)

**Should have (differentiators):**
- Try scorers and yellow/red card records per match -- coaches value player-level match data
- Auto-suggest team from last training session attendees -- the explicit link between attendance and selection
- Bench position declarations (sub_position column) -- useful for URBA referee declarations
- Round-by-round fixture view with results filled in -- at-a-glance season progress
- One-tap player swap within lineup -- real match-day usability win

**Defer (v1.1+):**
- Excel import for fixture (manual entry first, import after format is validated against a real URBA file)
- Individual player ratings (no agreed model per PROJECT.md)
- Try scorers and discipline cards (differentiators, not launch-blockers)
- Annual promotion function for M15-M19 (coordinate with infantiles admin, defer post-launch)

### Architecture Approach

Mirror the infantiles architecture exactly: Next.js 14 App Router with an (app) route group, middleware auth guard, server components fetching via createClient() server-side, client components using createClient() browser-side, and server actions using createAdminClient() only where RLS bypass is required (fixture import). Three new tables are added via new migrations to the shared public schema. No schema separation, no changes to existing tables. The existing RLS helper functions (get_user_role(), coach_has_division()) are reused without modification.

**Major components:**
1. `fixture_matches` table (migration 033) -- URBA schedule per division, result columns inline (score_local, score_visitante as nullable INTEGERs; NULL means not played), FK to existing opponent_clubs and club_venues
2. `player_positions` table (migration 034) -- one row per player, integer columns for position_primary / position_alt1 / position_alt2 (constrained 1-15), not an array or junction table
3. `match_lineups` table (migration 035) -- one row per player per match, position_number 1-15 for starters, is_substitute flag + sub_position for bench; partial unique constraint prevents two starters in the same slot
4. Fixture import pipeline -- two-step API: /api/fixture/import (parse + preview, no DB write) then /api/fixture/import/confirm (upsert); exceljs runs server-side only
5. Lineup builder UI -- @dnd-kit for drag, tap-to-select-then-tap-to-place as primary mobile fallback; player pool filtered to attendees of the most recent training session; position_primary shown as hint in each slot

### Critical Pitfalls

1. **Migration breaks the live infantiles app** -- every migration must be reviewed against infantiles src/lib/queries/, src/app/api/, and server actions before running in production. Never DROP, never narrow a CHECK constraint, never rename a column on shared tables. New juveniles tables are zero risk; shared table changes are high risk.

2. **iOS Safari PWA ignores the HTML5 DnD API** -- dragstart/drop events do not fire on iOS. Use @dnd-kit with PointerSensor (activationConstraint distance: 8px) and TouchSensor (delay: 200ms, tolerance: 5px). Implement tap-to-place as the primary mobile interaction. Test on a real iPhone; iOS Simulator does not reproduce PWA standalone pointer behavior.

3. **PostgREST max-rows=1000 silently truncates** -- applies to service_role too. match_lineups will exceed 1000 rows by mid-season (15 players x N matches x 4 divisions). Use .range() pagination for all stats queries and any season-wide lineup history query. Copy the paginated pattern from src/lib/queries/stats.ts in infantiles.

4. **URBA Excel format changes break the import parser** -- URBA is volunteer-run; the Excel format is not a contract. Handle merged cells (carry forward last non-null date), skip non-match rows (zona headers, blank rows), support both Excel serial and DD/MM/YYYY date formats, normalize column headers to lowercase. The preview-before-commit step is the critical safeguard; never auto-commit on upload.

5. **Shared player record concurrent writes** -- the same players row is written by both apps. The division_id single FK is the critical field: only the infantiles admin should run execute_annual_progression(). If juveniles needs internal promotion (M15-M19), create a separate function scoped to juvenile division IDs only. Photo uploads must use the same storage bucket and same player-photos/{player_id}.jpg naming convention to overwrite in place.

## Implications for Roadmap

Based on the feature dependency chain (player positions to attendance to fixture to team builder) and the pitfall timing guidance from PITFALLS.md:

### Phase 1: Foundation, Players, and Attendance

**Rationale:** Migration discipline and RLS patterns must be established before any feature work begins. Player records with position fields are the dependency for everything downstream. Attendance is the daily-use anchor that validates the app with coaches before the complex features land.

**Delivers:** App is installable, coaches can log in, take attendance, and view player profiles with positions assigned. Migration 033/034/035 skeleton established with RLS templates reviewed.

**Addresses:** Player CRUD + position fields (position_primary, position_alt1, position_alt2), attendance (reuse infantiles pattern verbatim), pending activation screen, admin coach CRUD, photo upload with correct storage bucket/naming, session_type set correctly on juvenile training sessions.

**Avoids:** Pitfall 1 (migration breaks infantiles -- establish discipline here), Pitfall 3 (max-rows -- copy paginated pattern from day one), Pitfall 4 (concurrent writes -- document coordination rule before building), Pitfall 9 (storage naming collision -- confirm bucket name before writing upload code), Pitfall 11 (empty app for unassigned coaches -- implement pending screen).

### Phase 2: Fixture Management

**Rationale:** Fixture is a prerequisite for both match results and the team builder. Manual entry should ship before Excel import -- it unblocks coaches faster and lets the format be validated against a real URBA file before building a parser.

**Delivers:** Coaches can see the match calendar for their division, add/edit matches manually, and record final scores. Admin can import the URBA Excel with preview-then-confirm flow.

**Addresses:** fixture_matches table fully built, manual add/edit/delete, score_local/score_visitante recording (NULL = not played), fixture list view per division, Excel import pipeline (/api/fixture/import to preview to /api/fixture/import/confirm), fuzzy opponent matching against opponent_clubs, re-import safety via UPSERT.

**Uses:** exceljs (already installed) in a server-side API route. createAdminClient() for the confirm step. Two-step import API pattern from ARCHITECTURE.md.

**Avoids:** Pitfall 5 (URBA format fragility -- preview before commit, defensive parsing, merged-cell handling), Pitfall 2 (RLS too permissive -- coaches can update results for their division but cannot import fixture).

### Phase 3: Team Builder (Lineup)

**Rationale:** The differentiating feature of the app. Depends on players (positions as hints), attendance (as the available-player filter), and fixture (lineup attaches to a specific match). Ships last among the core features because it is the most complex and has the highest mobile UX risk.

**Delivers:** Coaches build a match-day team sheet from players who attended the most recent training. Named slots 1-15 plus bench. Lineup persists in DB (match_lineups table) and survives closing the browser.

**Addresses:** match_lineups table, lineup builder UI with @dnd-kit for drag and tap-to-place as primary fallback, player pool filtered to last-session attendees, position hints from player_positions.position_primary, bench section with sub_position assignment, one-tap player swap.

**Uses:** @dnd-kit/core + sortable + utilities. PointerSensor + TouchSensor with activation constraints from STACK.md.

**Avoids:** Pitfall 6 (iOS PWA DnD -- use pointer sensor, test on real device before declaring done), Pitfall 3 (max-rows on match_lineups -- paginate any season-wide lineup history query).

**Research flag:** Validate the tap-to-place vs drag-first interaction on a real iPhone before building the full field diagram UI. This is the highest UX risk in the entire project.

### Phase 4: Stats, Tutora Panel, and Polish

**Rationale:** Stats are most valuable once a season of attendance data has accumulated. The tutora panel is a low-complexity port from infantiles. Polish includes round-by-round fixture view, try scorers, and discipline cards (differentiators).

**Delivers:** Attendance stats per player and division (same KPIs as infantiles), tutora interview log, fixture view with results filled in showing season progress, optional try scorer and card recording.

**Addresses:** Stats RPC functions (port or reuse infantiles functions scoped to juvenile division IDs), tutora panel (CRUD interview log per player), round-by-round fixture view, match_try_scorers and match_discipline tables (differentiators, add if time permits).

**Avoids:** Pitfall 3 (max-rows in stats queries -- must use paginated pattern from Phase 1).

### Phase Ordering Rationale

- Players before everything: player_positions.position_primary is a hint in the lineup builder and a filter criterion in the bench. Without position data the team builder loses its core value proposition.
- Attendance before team builder: the available-player pool in the lineup builder is derived from attendance records. Without attendance data the team builder defaults to the full squad list -- functional but not the differentiator.
- Fixture before team builder: match_lineups has a FK to fixture_matches. A lineup is meaningless without a match to attach it to.
- Manual fixture before Excel import: unblocks coaches faster; the URBA Excel format can be verified against a real file before writing the parser.
- Team builder last among core features: highest complexity, highest mobile UX risk, most downstream dependencies.

### Research Flags

Phases likely needing deeper research or validation during planning:
- **Phase 3 (Team Builder):** iOS PWA pointer event behavior for @dnd-kit -- must validate on a real iPhone before committing to the drag-first vs tap-first interaction model. Treat tap-to-place as the primary interaction until real-device testing confirms drag works reliably.
- **Phase 2 (Excel Import):** Obtain a real URBA fixture Excel file before writing the parser. The ARCHITECTURE.md parser design is sound, but column headers and merged-cell patterns must be verified against the actual file format.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation, Players, Attendance):** Direct port of infantiles patterns. RLS, auth guards, offline queue, and photo upload are copy-paste with minor adaptation.
- **Phase 4 (Stats, Tutora):** Same RPC functions and UI patterns as infantiles. Tutora panel is a feature-complete model to copy.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Inherited from production app; only new addition (@dnd-kit) confirmed current (Dec 2024 release); react-beautiful-dnd deprecation confirmed via npm |
| Features | HIGH | Rugby positions 1-15 are World Rugby standard; URBA fixture fields well-known; UX patterns rated MEDIUM (training data, no live verification) |
| Architecture | HIGH | Based on direct analysis of 32 production migrations and proven RLS patterns; new table designs follow established conventions |
| Pitfalls | HIGH | All critical pitfalls confirmed from production (max-rows confirmed incident in sister app; iOS DnD is documented API gap; migration risk is structural) |

**Overall confidence:** HIGH

### Gaps to Address

- **Real URBA Excel file:** The fixture parser design is correct, but exact column names, sheet structure, and merged-cell behavior must be confirmed against an actual URBA Excel before writing parseUrbaExcel.ts. Get a file from the club admin before Phase 2 parser implementation begins.
- **Touch sensor activation constraints on iOS 17+:** The @dnd-kit configuration (delay: 200ms, tolerance: 5px) is from documentation patterns. Validate these values feel natural on actual coach devices (iPhone with iOS 17+) -- values may need tuning.
- **session_type allowed values in migration 026:** Confirm the exact CHECK constraint values before creating juvenile training sessions. The value 'entrenamiento' is expected but needs verification against the live migration.
- **Annual promotion scope:** If the juveniles app needs an M15-M19 internal promotion flow, scope and name the function distinctly from execute_annual_progression() and coordinate the run date with the infantiles admin. Deferred post-launch but must be documented before any promotion code is written.

## Sources

### Primary (HIGH confidence)
- Direct analysis of infantiles production migrations 001-032 -- schema, RLS patterns, pitfalls
- World Rugby Laws of the Game -- positions 1-15 numbering and Spanish names
- npm registry -- @dnd-kit/core 6.3.1 (published Dec 2024), react-beautiful-dnd deprecated field confirmed
- Supabase PostgREST documentation -- max-rows behavior, service_role scope
- Production incident in infantiles -- max-rows=1000 truncation confirmed in attendance_records

### Secondary (MEDIUM confidence)
- Mobile sports app UX patterns -- tap-to-place vs drag-first interaction recommendations
- URBA fixture Excel format -- Argentine rugby community knowledge; not verified against a current-season file
- Match result field conventions -- synthesis of common club rugby management tools

### Tertiary (needs validation)
- @dnd-kit TouchSensor activation constraint values (delay: 200ms, tolerance: 5px) -- from library documentation; must be validated on real iOS hardware in PWA standalone mode

---
*Research completed: 2026-05-24*
*Ready for roadmap: yes*