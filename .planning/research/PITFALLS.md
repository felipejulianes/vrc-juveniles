# Domain Pitfalls — VRC Juveniles

**Domain:** Rugby club juvenile management PWA sharing a Supabase DB with a live sister app
**Researched:** 2026-05-24
**Confidence:** HIGH (based on direct inspection of the live sister app's migrations, RLS policies, and known production issues)

---

## Critical Pitfalls

### Pitfall 1: Schema migrations that silently break the infantiles app

**What goes wrong:**
Juveniles adds a new migration (e.g., adds a column, drops a constraint, modifies an RLS policy on a shared table). The infantiles app continues running in production without redeployment. If the migration changes something infantiles depends on — a column name, a CHECK constraint on `profiles.role`, a function signature — infantiles breaks silently or with cryptic errors.

**Why it happens:**
Both apps share the same PostgreSQL schema. Migrations are run manually in the Supabase SQL editor against the single production database. There is no staging environment and no automated coordination mechanism.

The highest-risk tables are:
- `profiles` — the `role` CHECK constraint (`CHECK (role IN ('admin', 'coach', 'tutora'))`) must be extended if juveniles needs a new role. This drops and recreates the constraint on a live table.
- `players` — shared player records; adding columns changes the shape returned by `SELECT *` queries.
- `divisions` — juveniles may want to add columns (e.g., `is_juvenile` already exists, but new metadata like `season_year` would affect every query on this table).
- `coach_divisions` — shared assignment table; changing this breaks coach access in both apps simultaneously.
- Any RLS helper function (`get_user_role`, `coach_has_division`) — both apps call these from policies; changing their semantics breaks one or both.

**Consequences:**
- Infantiles coaches lose access to their divisions (RLS policy change)
- Admin panel in infantiles returns no data (schema mismatch in a query)
- Supabase `postgrest` restarts after DDL changes; infantiles experiences a brief connection drop regardless of migration safety

**Prevention:**
1. Migration rule: every migration must be reviewed against the infantiles CLAUDE.md query list before running. Specifically check: `src/lib/queries/`, `src/app/api/`, and every server action that calls `supabase.from(tableName)`.
2. Additive-only migrations for shared tables. Never `DROP COLUMN`, never narrow a CHECK constraint, never rename a column on `players`, `profiles`, `divisions`, `coach_divisions`, `training_sessions`, `attendance_records`.
3. New juveniles-specific tables (fixture, lineups, match results) are fully new — zero risk to infantiles.
4. If a shared-table change is unavoidable, coordinate: run migration → immediately verify infantiles in production → rollback plan ready.

**Detection:**
- Infantiles admin panel returns empty data after a migration
- PostgREST returns a 42703 (column does not exist) or 42P01 (relation does not exist) error in infantiles Vercel logs
- The `profiles_role_check` constraint violation appears if infantiles tries to create a user with a role not in the new CHECK list (or vice versa)

**Phase to address:** Phase 1 (foundation). Establish the migration discipline rule before writing the first migration. Document the "safe shared tables" list.

---

### Pitfall 2: RLS policies on new tables don't account for the infantiles admin role

**What goes wrong:**
Juveniles creates new tables (e.g., `match_lineups`, `fixture_matches`). The RLS policies are written with only the juveniles use case in mind: coaches see their divisions, admin sees all. But the infantiles `admin` user (same `profiles.role = 'admin'`) will also pass `get_user_role() = 'admin'` checks on these new tables when calling from the infantiles app. This means the infantiles admin can read/write juveniles lineup data — probably not intended, but harmless. The inverse — a juveniles admin modifying infantiles-owned data — is the real risk if policies are too permissive.

**Why it happens:**
`get_user_role()` is a shared function. `role = 'admin'` is a single shared role with no app-level scoping. There is no concept of "juveniles admin" vs "infantiles admin" in the current schema — it's one shared admin account.

**Consequences:**
- An admin managing infantiles can accidentally read or mutate juveniles lineup data if they hit the wrong endpoint.
- More importantly: if juveniles creates overly permissive policies ("any authenticated user can read divisions"), infantiles coaches gain read access to juveniles fixtures and vice versa — not a security disaster for this club, but unintended.

**Prevention:**
1. For all new juveniles-only tables, use the same pattern as existing tables: `get_user_role() = 'admin' OR coach_has_division(division_id)`. This naturally limits coaches to their assigned divisions, which already covers the M15-M19 scope.
2. Do not create policies that grant access based on `auth.role() = 'authenticated'` without a division check — that would expose juveniles data to infantiles-only coaches.
3. Accept that a single admin account governs both apps. Document this as intentional.

**Detection:**
- An infantiles-only coach (assigned only to M6-M14) can query `fixture_matches` and get data back instead of an empty result
- Test with a `coach` account that has only infantiles divisions assigned

**Phase to address:** Phase 1 (foundation). Write the RLS template for new tables immediately.

---

### Pitfall 3: PostgREST max-rows=1000 on new high-volume tables

**What goes wrong:**
This is already documented in the infantiles app from a production incident (`attendance_records` was silently truncated). The same limit applies to every new table in juveniles.

**Why it happens:**
The Supabase project has `max-rows=1000` set in PostgREST settings. This overrides any `.limit()` call on the client side and applies to all roles including `service_role`. A `.select()` with no range returns at most 1000 rows with no error — it silently truncates.

**Specific new tables at risk in juveniles:**

| Table | Risk Scenario | Row estimate |
|-------|--------------|--------------|
| `attendance_records` (existing) | Stats queries across full season for M15-M19 | Already paginated in infantiles — copy that pattern |
| `fixture_matches` | Full season for all 4 divisions (M15/16/17/19) × multiple zones | ~200-400 rows/season — safe |
| `match_lineups` | 15 players × N matches × 4 divisions | ~2000-4000 rows/season — UNSAFE |
| `player_positions` (if separate table) | 4 divisions × ~30 players × 2 positions | ~240 rows — safe |

**Consequences:**
- Season statistics that traverse all attendance records return wrong totals (too-low counts)
- A lineup history query silently omits older matches
- Stats dashboard shows misleading data; coaches make decisions on incomplete information

**Prevention:**
For any query that could return >500 rows (leave a 2x safety margin), use the established pagination pattern:

```typescript
const PAGE = 1000
let all: Row[] = []
let offset = 0
while (true) {
  const { data: batch } = await supabase
    .from('tabla')
    .select('...')
    .range(offset, offset + PAGE - 1)
  if (!batch || batch.length === 0) break
  all = all.concat(batch)
  if (batch.length < PAGE) break
  offset += PAGE
}
```

This pattern is already in `src/lib/queries/stats.ts` in infantiles — copy it.

**Detection:**
- A stats query returns exactly 1000 rows — this is the telltale sign of truncation
- Attendance percentage for a player who attended 30/40 sessions shows as 25/40

**Phase to address:** Phase 1 (attendance, copying infantiles). Phase 3 (lineup history queries). Any new query that touches `attendance_records` or `match_lineups` must use pagination.

---

## Critical Pitfall: Shared Player Record Simultaneous Writes

### Pitfall 4: Both apps write to the same player row — last write wins

**What goes wrong:**
A player ascends from M14 (infantiles) to M15 (juveniles). For a period — or permanently if they're recently promoted — both apps have the player in their UI. The infantiles coach is still updating notes and the juveniles coach is updating the position fields and uploading a new photo. These are concurrent writes to the same `players` row (and related `player_notes`, `player_followups` rows).

PostgreSQL handles concurrent writes safely (no corruption), but there is no conflict resolution in the application layer. The last write wins for each column. Specific risks:

1. **Photo overwrite**: Infantiles coach uploads a new photo → `photo_url` updated. Then juveniles coach uploads a photo → `photo_url` overwritten. The infantiles app now shows the new photo without the coach knowing it changed. This is cosmetic.

2. **`division_id` overwrite**: This is the critical one. `players.division_id` is a single FK. The `execute_annual_progression()` function (infantiles) moves M14 players to M15 by updating `division_id`. If juveniles also updates `division_id` (e.g., promoting M15 to M16 via a similar progression function), both apps calling their respective progression logic simultaneously could produce an inconsistent state.

3. **`inactivo` flag**: Infantiles coach marks a player as inactive. Juveniles coach — now managing the same player in M15 — sees `inactivo=true` and doesn't understand why. The flag semantics are shared.

**Why it happens:**
The schema uses a single `players` table with no app-level ownership concept. `division_id` as a single FK means a player belongs to exactly one division at one time, but both apps can query and update it.

**Consequences:**
- Player disappears from one app's roster after the other app's progression runs
- Notes added in infantiles appear in juveniles (this is intentional and desired — "notes travel with the player")
- Photos updated in one app change in the other (minor but confusing)

**Prevention:**
1. **Progression coordination rule**: only the infantiles admin runs `execute_annual_progression()`. Juveniles should not implement a competing progression function that touches `division_id` for players in the M14→M15 boundary. If juveniles needs internal promotion (M15→M16), limit the function to `WHERE division_id IN (M15, M16, M17, M19)` and document the constraint.

2. **Photo updates**: accept last-write-wins. Both apps use Supabase Storage; the `photo_url` FK is stable as long as both apps use the same storage bucket. Confirm juveniles uses the same bucket.

3. **`inactivo` flag**: document that this flag is shared and means the same thing in both apps. Juveniles UI should display the same visual treatment (player goes to bottom of list) and not reset it without confirmation.

4. **No parallel migration touching `players` schema** during the overlap period after annual progression.

**Detection:**
- A player appears in neither app's roster after progression runs
- A recently promoted player has `inactivo=true` with no explanation in juveniles

**Phase to address:** Phase 1 (player setup). Phase 2 (if annual progression is built in juveniles). Document the coordination rule in the project's CLAUDE.md equivalent before any progression feature is built.

---

## Critical Pitfall: Excel Import Fragility

### Pitfall 5: URBA fixture Excel format changes silently break the import

**What goes wrong:**
The URBA federation publishes the official fixture as an Excel file. The import parser is built against the current format. URBA changes a column header, switches from merged cells to separate rows, adds a new sheet, or changes the date format — and the import silently produces wrong data or crashes.

**Specific failure modes:**

1. **Column header changes**: Parser looks for `"Fecha"` but URBA publishes `"Nro de Fecha"` or `"Round"`. Result: the column is not found, all dates are `undefined`, matches import with null dates.

2. **Merged cells**: Excel merged cells (e.g., the date cell spanning all matches of that round) appear as a value in the first cell and `undefined` in subsequent cells when parsed by `xlsx`/`exceljs`. A naive row-by-row parser will produce matches with null dates for all rows except the first of each round.

3. **Empty rows between sections**: URBA Excel files often include section headers, blank separator rows, and footer rows that are not match data. A parser that assumes every non-empty row is a match will import garbage rows (e.g., "ZONA NORTE" as a team name).

4. **Date format inconsistency**: Dates stored as Excel serial numbers (e.g., `45678`) vs strings (`"15/06/2025"`) vs text with ordinal suffixes (`"Sábado 15 de Junio"`). The parser must handle all three and detect which format is present.

5. **Encoding**: URBA team names include accented characters (Ñ, É, etc.) and special characters. A parser using the wrong encoding produces `CENTRO NAVALâ€™` instead of the correct name.

6. **Multi-sheet workbooks**: URBA may publish a workbook with one sheet per zone or one sheet per division. A parser that reads only the first sheet misses all other divisions.

**Why it happens:**
URBA is a volunteer-run federation. The Excel format is not an API — it's a human-produced document that changes whenever the person who makes it decides. There is no schema contract.

**Consequences:**
- Entire season fixture is imported with wrong dates → coaches plan around incorrect match dates
- Team names are garbled → the opponent matching against `opponent_clubs` table fails for every match
- Duplicate imports: the parser runs twice because the first import looked wrong → duplicate match rows in DB

**Prevention:**

1. **Preview before commit**: the import flow must show a parsed preview table before writing to the database. The user confirms the data looks correct before it's saved. This is the most important safeguard.

2. **Defensive parsing with fallbacks**:
   - Normalize all column headers to lowercase and trim whitespace before matching: `header.toLowerCase().trim() === 'fecha'`
   - Handle merged cells by carrying forward the last non-null value for "date" and "round" columns
   - Skip rows where all key fields (date, local team, visitor team) are null or where either team name matches a known non-team pattern (e.g., `row[teamCol].match(/^zona/i)`)
   - Parse dates from both Excel serial and string formats using a utility function

3. **Encoding**: use `exceljs` (already a dependency) which handles Unicode correctly. Avoid `xlsx` (SheetJS) for this use case — it has known encoding issues with Latin characters in older `.xls` files.

4. **Import idempotency**: use `INSERT ... ON CONFLICT DO NOTHING` (or `DO UPDATE`) keyed on `(division_id, match_date, local_team_id)`. Running the import twice produces no duplicates.

5. **Audit log**: record each import with timestamp, user, and row count. If data looks wrong, the user knows when it was last imported.

**Detection:**
- Preview table shows team names like `undefined vs undefined` or `ZONA NORTE vs undefined`
- Dates in preview are all the same (merged cell not propagated)
- Row count in preview is 0 (wrong sheet selected) or 3x expected (every row parsed including headers and separators)

**Phase to address:** Phase 2 (fixture import). The preview-before-commit pattern must be implemented before any production import is allowed. Never auto-commit on upload.

---

## Critical Pitfall: Mobile Drag-and-Drop in iOS Safari PWA

### Pitfall 6: Touch drag-and-drop fails or conflicts with scroll in iOS Safari PWA standalone mode

**What goes wrong:**
The lineup builder requires dragging player cards onto field position slots. On desktop this is straightforward with the HTML5 Drag and Drop API or a library like `@dnd-kit/core`. On iOS Safari — especially in PWA standalone mode — this breaks in several ways:

1. **HTML5 Drag and Drop API does not work on iOS Safari**: `dragstart`, `dragover`, and `drop` events fire on desktop but are not supported on iOS. Any implementation using these events will silently fail on the primary target device (coaches use iPhones).

2. **Touch events vs scroll conflict**: `touchmove` events on a draggable element conflict with the browser's native scroll behavior. iOS Safari interprets a `touchmove` as a scroll gesture by default. Without `{ passive: false }` on the touch listener and `event.preventDefault()` inside it, the page scrolls instead of dragging the element. With `preventDefault()`, scroll is disabled entirely on that element — but if the field diagram is taller than the viewport, the user cannot scroll at all.

3. **PWA standalone mode scroll bouncing**: In standalone mode (added to home screen), iOS applies its own momentum scrolling behavior that interferes with `touchmove`-based drag implementations. Elements "rubber band" during drag initiation.

4. **`@dnd-kit/core` on iOS**: `@dnd-kit` uses pointer events (`pointerdown`, `pointermove`, `pointerup`) which are supported on iOS 13+. However, the library requires its `<DndContext>` to wrap all draggable and droppable elements, and the pointer events implementation has known issues in PWA mode with iOS 16+ where the pointer capture is sometimes lost during scroll.

5. **Library-specific PWA bugs**: React DnD (uses HTML5 API + touch backend) requires `react-dnd-touch-backend` separately. `react-beautiful-dnd` (now unmaintained) has similar issues. `@dnd-kit` is the current best option but still requires careful configuration for touch.

**Why it happens:**
iOS Safari has historically implemented touch APIs differently from the W3C spec and from Chrome. PWA standalone mode adds another layer of behavioral differences from the in-browser experience. The problem is well-documented but the solutions require device-specific workarounds.

**Consequences:**
- Coaches cannot drag players on their iPhones (primary device) → feature is unusable
- Coaches accidentally scroll the page when trying to drag → frustrating UX
- The feature works perfectly in development (on a Mac) and fails in production (on iPhone)

**Prevention:**

1. **Use `@dnd-kit/core`** with the Pointer Events sensor. It is the most actively maintained library with iOS support:
   ```
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **Configure the sensor for touch tolerance**: set `activationConstraint` with a distance threshold (e.g., 8px) to distinguish drag from scroll. Without this, any tap triggers a drag:
   ```typescript
   useSensor(PointerSensor, {
     activationConstraint: { distance: 8 }
   })
   ```

3. **Design around scroll conflict**: make the field diagram fit within the viewport or use a fixed-height scrollable container for the player list (separate from the field) so the field itself does not need to scroll during drag. A two-panel layout (player bench on top, field positions below) reduces scroll-vs-drag conflicts.

4. **Test on real iOS hardware** before considering the feature complete. iOS Simulator in Xcode does not reproduce PWA standalone mode pointer event behavior accurately.

5. **Fallback interaction**: implement a tap-to-select-then-tap-to-place interaction as a fallback (tap a player, then tap the position slot). This avoids drag entirely. Many production sports apps use this pattern for exactly this reason. Consider making it the primary interaction and drag an enhancement.

**Detection:**
- Attempting to drag on an iPhone scrolls the page instead
- The drag event initiates but the dragged element disappears (pointer capture lost)
- Feature works in Chrome desktop and Chrome Android but not in Safari iOS
- Works in Safari in-browser but not in PWA standalone mode

**Phase to address:** Phase 3 (lineup builder). Decide on the tap-to-place vs drag-first approach before building any UI. Validate the chosen interaction on a real iPhone before implementing the full field diagram.

---

## Moderate Pitfalls

### Pitfall 7: Migration coordination — no staging environment

**What goes wrong:**
Both apps share one Supabase project. There is no staging environment. Migrations are run manually in the SQL editor against production. A syntax error or logic error in a migration affects the live infantiles app immediately.

**Prevention:**
- Write every migration in a `.sql` file locally and review it completely before pasting into the SQL editor.
- Test complex migrations (function changes, policy drops/recreates) by prepending `BEGIN;` and ending with `ROLLBACK;` in the SQL editor first — verify the output, then run with `COMMIT;`.
- For destructive DDL (DROP, ALTER with data change), take a manual backup first via Supabase dashboard > Backups.
- Never run a migration during infantiles peak usage hours (Tuesday/Thursday evenings, Saturday mornings).

**Phase to address:** Phase 1. Establish this discipline before the first migration is written.

---

### Pitfall 8: The `execute_annual_progression()` function is destructive and shared

**What goes wrong:**
The infantiles app has `execute_annual_progression()` — a PostgreSQL function that irreversibly moves all players up one division (M6→M7, ... M14→M15). M14 players entering M15 are now in the juveniles domain. If the juveniles app runs any client-side code that triggers this function (or a new juvenile version of it) without the infantiles admin's coordination, players get double-promoted or incorrectly assigned.

**Prevention:**
- Do not create a competing `execute_annual_progression()` in juveniles. If juvenile internal promotion (M15→M16→M17→M19) is needed, create a separate function named distinctly (e.g., `execute_juvenile_promotion()`) that only touches division IDs within the M15-M19 set.
- The function must use `assertAdmin()` guard on the server action calling it.
- Coordinate with the infantiles admin before running any progression in either app.

**Phase to address:** Only relevant if an annual promotion feature is in scope for juveniles. Defer to post-launch.

---

### Pitfall 9: Shared Storage bucket — photo URL collisions

**What goes wrong:**
Both apps upload player photos to Supabase Storage. If both use the same bucket and the same file naming convention (e.g., `player-photos/{player_id}.jpg`), a photo upload in juveniles overwrites the one in infantiles for the same player. Since it's the same player record with the same `id`, this is actually correct behavior — but only if the resolution is intentional.

The risk is if juveniles uses a different naming pattern (e.g., `photos/{player_id}-{timestamp}.jpg`) that generates a new URL and orphans the old file, accumulating unused files in Storage with no cleanup mechanism.

**Prevention:**
- Use the same file naming convention as infantiles: `player-photos/{player_id}.jpg` (overwrite in place).
- This means the photo is always the latest — intentional for a shared player record.
- Confirm the Storage bucket name in the infantiles app before writing the photo upload code in juveniles.

**Phase to address:** Phase 1 (player CRUD, including photo upload).

---

## Minor Pitfalls

### Pitfall 10: `session_type` column assumed absent in new tables

**What goes wrong:**
Infantiles added `session_type` to `training_sessions` in migration 026. Juveniles training sessions reuse the same table. The `session_type` column exists — but juveniles has a different session vocabulary (training sessions on Tue/Thu, match sessions on Sat). If juveniles ignores this column and doesn't set it, queries in infantiles that filter by `session_type` may behave unexpectedly if they encounter juveniles sessions with null type.

**Prevention:**
- Set `session_type` correctly for all juveniles sessions: `'entrenamiento'` for Tue/Thu sessions. For Saturday match sessions, check whether `training_sessions` is even the right table — match data probably belongs in a separate `fixture_matches` table, not `training_sessions`.
- Confirm with the infantiles app what values `session_type` accepts (migration 026 defines the allowed values).

**Phase to address:** Phase 1 (attendance sessions).

---

### Pitfall 11: `coach_has_division()` helper requires up-to-date `coach_divisions` rows

**What goes wrong:**
All RLS policies in both apps rely on `coach_has_division(div_id)`. If a juveniles coach is created but not assigned to their division via `coach_divisions`, they see zero players, zero sessions, and get no error — the app just appears empty. This happened in infantiles too (the "cuenta pendiente" screen).

**Prevention:**
- Juveniles app must implement the same "pending activation" screen: detect zero divisions assigned → show "your account is pending activation" message.
- Admin CRUD for coaches must include division assignment as part of coach creation, not as a separate step.

**Phase to address:** Phase 1 (auth and coach management).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Foundation & migrations | Additive migration breaks infantiles | Review against infantiles query list before running |
| Phase 1: Auth and roles | New juveniles coach sees infantiles data | Verify `coach_has_division()` is correctly restricting M15-M19 only |
| Phase 1: Player CRUD | Photo URL collision / orphaned files | Use same bucket + same naming as infantiles |
| Phase 2: Fixture import | URBA Excel format change | Always preview before commit; handle merged cells |
| Phase 2: Fixture import | Duplicate matches on re-import | Use `ON CONFLICT DO NOTHING` keyed on match identity |
| Phase 3: Lineup builder | Drag-and-drop fails on iOS PWA | Use `@dnd-kit` with pointer sensor + activation constraint; test on real device |
| Phase 3: Attendance stats | `max-rows=1000` truncates records | Copy paginated stats query from infantiles |
| Phase 3: Lineup history | `max_rows=1000` on `match_lineups` | Use `.range()` pagination for any season-wide query |
| Phase 4: Annual promotion | Competing with `execute_annual_progression()` | Create separate function scoped to M15-M19 only |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Shared Supabase pitfalls | HIGH | Based on direct inspection of all 32 migrations and RLS policies |
| Excel import pitfalls | HIGH | Standard failure modes; well-documented in JS Excel parsing ecosystem |
| iOS Safari PWA drag-and-drop | HIGH | Known iOS limitation; HTML5 DnD API absence on iOS is documented fact |
| PostgREST max-rows=1000 | HIGH | Confirmed production issue in sister app with known fix |
| Player data sharing | HIGH | Based on actual schema inspection; `division_id` as single FK is the core constraint |
