# Architecture Patterns — VRC Juveniles

**Domain:** Rugby club juvenile division PWA (Next.js 14 + shared Supabase)
**Researched:** 2026-05-24
**Confidence:** HIGH — based on direct analysis of the existing infantiles production schema (32 migrations) and its established RLS patterns

---

## Context: Shared Supabase Instance

The juveniles app shares one Supabase project with the infantiles app. This is the single most important architectural fact. Every decision below flows from it.

**Tables already in the shared DB that juveniles reads/writes directly:**

| Table | Juvenile use |
|-------|-------------|
| `divisions` | M15, M16, M17, M19 rows already exist (added in migration 014, `is_juvenile = TRUE`) |
| `profiles` | Same auth users — a coach or admin logs into both apps with the same account |
| `coach_divisions` | Same junction table — a coach assigned to M16 is assigned in infantiles DB |
| `players` | Shared — a player promoted from M14 keeps all history |
| `player_notes` | Travel with the player automatically |
| `player_followups` | Travel with the player automatically |
| `player_documents` | Travel with the player automatically |
| `opponent_clubs` | 90 URBA clubs pre-loaded; juveniles references these for fixture |
| `club_venues` | Venues per club; juveniles uses these for away matches |
| `training_sessions` | New rows for juvenile training sessions go here |
| `attendance_records` | New rows for juvenile attendance go here |

**New tables (juveniles-only, to be added via new migrations):**

- `fixture_matches` — official URBA schedule per division
- `match_results` — score of each match
- `player_positions` — each player's primary and alternative position
- `match_lineups` — 15 starters + substitutes for a specific match

---

## Recommended Architecture

### Overall Pattern: Same as Infantiles

Mirror the infantiles architecture exactly. Do not invent new patterns. The value is consistency.

```
Next.js 14 App Router (separate Vercel project)
  └── (app) route group with layout auth guard
       ├── Server Components fetch via createClient() [server]
       ├── Client Components use createClient() [browser]
       └── Server Actions use createAdminClient() only when bypassing RLS is required

Supabase (shared project)
  ├── Shared tables (read/write via RLS — same anon key)
  └── New juvenile tables (new migrations, new RLS policies)
```

### Component Boundaries

| Component | Responsibility | Pattern |
|-----------|---------------|---------|
| `src/middleware.ts` | First auth layer: no session → /login | Copy from infantiles verbatim |
| `src/app/(app)/layout.tsx` | Second auth layer: check profile + divisions; show "pending" screen | Copy and adapt |
| `src/lib/supabase/server.ts` | Server Component client | Identical to infantiles |
| `src/lib/supabase/client.ts` | Browser client | Identical to infantiles |
| `src/lib/supabase/admin.ts` | service_role client (for fixture import) | Identical to infantiles |
| `src/lib/queries/` | All DB queries, one file per domain | Same convention |
| `src/app/(app)/admin/actions.ts` | CRUD coaches — can reuse same logic | Adapt from infantiles |

---

## New Table Designs

### 1. `fixture_matches`

Stores the official URBA schedule. One row per division per round per date. Handles the home/away distinction and links to the existing `opponent_clubs` and `club_venues` tables.

```sql
CREATE TABLE fixture_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id     UUID NOT NULL REFERENCES divisions(id),
  match_date      DATE NOT NULL,
  round           INTEGER,                          -- jornada URBA (1..N)
  venue_type      TEXT NOT NULL CHECK (venue_type IN ('local', 'visitante', 'neutral')),
  opponent_club_id UUID REFERENCES opponent_clubs(id),
  venue_id        UUID REFERENCES club_venues(id),  -- NULL for local matches
  notes           TEXT,
  imported_from   TEXT,                             -- 'excel_import' | 'manual'
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (division_id, match_date)
);

CREATE INDEX idx_fixture_matches_division_date ON fixture_matches(division_id, match_date);
CREATE INDEX idx_fixture_matches_date ON fixture_matches(match_date);
```

**Design decisions:**

- `round` is nullable — manual entries may not know the round number; Excel imports should populate it.
- `venue_type = 'local'` means VRC hosts. `venue_id` is NULL for local matches (VRC's own field is implicit). `venue_id` is required for visitante/neutral.
- `opponent_club_id` references the existing `opponent_clubs` table directly. No duplication.
- `UNIQUE(division_id, match_date)` enforces one fixture entry per division per date, consistent with `training_sessions` pattern.
- `imported_from` lets the app distinguish Excel-imported rows from manual edits, useful for re-import conflict detection.

**No separate `match_results` table.** Add result columns directly on `fixture_matches`:

```sql
ALTER TABLE fixture_matches
  ADD COLUMN score_local    INTEGER,   -- VRC score (NULL = not played yet)
  ADD COLUMN score_visitante INTEGER;  -- opponent score (NULL = not played yet)
```

Rationale: a result is a 1:1 property of a match, not a separate entity. Joining would add complexity with zero benefit. NULL means the match hasn't been played. A match with scores is "played". This is simpler and still queryable: `WHERE score_local IS NOT NULL`.

---

### 2. `player_positions`

Stores each player's rugby positions. In rugby union there are 15 numbered positions (1 loosehead prop through 15 fullback). A player typically has one primary position and possibly one or two alternatives.

**Recommendation: Two dedicated columns, not an array or junction table.**

```sql
CREATE TABLE player_positions (
  player_id         UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  position_primary  INTEGER CHECK (position_primary BETWEEN 1 AND 15),
  position_alt1     INTEGER CHECK (position_alt1 BETWEEN 1 AND 15),
  position_alt2     INTEGER CHECK (position_alt2 BETWEEN 1 AND 15),
  notes             TEXT,   -- free text for coach ("puede jugar de 8 si hace falta")
  updated_by        UUID REFERENCES profiles(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Why not an array (`INTEGER[]`):** Arrays in PostgreSQL cannot be individually constrained; checking each element is between 1 and 15 requires a trigger or check on the whole array. Individual columns are cleaner, indexable, and directly queryable (`WHERE position_primary = 9`).

**Why not a junction table (`player_position_entries`):** Total overkill for this domain. A player has at most 3 usable positions. A junction table adds a join with no benefit. The infantiles codebase avoids junction tables for simple enumerations (see `doc_type` as a constrained column, not a separate table).

**Position reference (standard rugby union):**

```
1 - Pilier izquierdo (Loosehead Prop)
2 - Hooker
3 - Pilier derecho (Tighthead Prop)
4 - Segundo línea (Lock)
5 - Segundo línea (Lock)
6 - Ala (Blindside Flanker)
7 - Ala (Openside Flanker)
8 - Octavo (Number 8)
9 - Medio scrum (Scrum-half)
10 - Apertura (Fly-half)
11 - Wing izquierdo
12 - Centro (Inside Centre)
13 - Centro (Outside Centre)
14 - Wing derecho
15 - Fullback
```

Store these as a constant in `src/lib/positions/constants.ts` (no Supabase imports — same pattern as `src/lib/docs/constants.ts`).

---

### 3. `match_lineups`

Models the selected team for a specific match. One row per player per match, with the position number they are assigned to.

```sql
CREATE TABLE match_lineups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID NOT NULL REFERENCES fixture_matches(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position_number INTEGER,   -- 1-15 for starters; NULL for substitutes on bench
  is_substitute  BOOLEAN NOT NULL DEFAULT FALSE,
  sub_position   INTEGER CHECK (sub_position BETWEEN 1 AND 15),  -- position they cover as sub
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, player_id),
  UNIQUE (match_id, position_number) WHERE position_number IS NOT NULL AND is_substitute = FALSE
);

CREATE INDEX idx_match_lineups_match ON match_lineups(match_id);
CREATE INDEX idx_match_lineups_player ON match_lineups(player_id);
```

**Design decisions:**

- `UNIQUE(match_id, player_id)` — a player appears once per match lineup.
- Partial unique constraint on `(match_id, position_number)` where `is_substitute = FALSE` — no two starters can hold the same position number. Substitutes intentionally can share a `position_number = NULL`.
- `sub_position` on the substitute row — when a substitute enters for, say, the hooker, `sub_position = 2`. This lets the UI show "viene por el 2" without a separate table.
- `position_number = NULL` for bench players is intentional. Bench players may not have a fixed assigned number until they enter. This is how real rugby coaching works: you select bench of 7, positions assigned when they go on.
- The lineup is built from players who were present at the last training session (or a selected session). The UI query joins `match_lineups` with `attendance_records` to pre-filter "available" players.

---

## Isolation: Same Project, No Schema Separation

Using Postgres schemas (e.g., a `juveniles` schema) would break the existing RLS helper functions (`get_user_role()`, `coach_has_division()`) which live in the `public` schema and reference `public.profiles` and `public.coach_divisions`. Any cross-schema reference requires re-qualifying every function. The complexity cost is not worth it.

**Decision: all new tables in `public` schema, prefixed with nothing special.** The distinction between infantiles and juveniles tables is evident from context (fixture tables are inherently juvenile). The `divisions.is_juvenile` flag already provides the boundary in the data.

**Infantiles app isolation concern:** The infantiles app queries `training_sessions` and `attendance_records` filtered by `division_id`. New juvenile sessions added to these tables are invisible to infantiles coaches because their `coach_divisions` only includes M6–M14 divisions. RLS blocks access automatically. Zero risk.

---

## RLS Policy Approach for New Tables

Follow the exact pattern established in infantiles. Two helper functions already exist in the shared DB:

- `get_user_role()` — returns 'admin' | 'coach' | 'tutora'
- `coach_has_division(div_id UUID)` — checks `coach_divisions` for the authenticated user

### Pattern for division-scoped tables (`fixture_matches`, `match_lineups`)

```sql
-- fixture_matches: coaches read their divisions; admin reads/writes all
ALTER TABLE fixture_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixture_select" ON fixture_matches FOR SELECT USING (
  get_user_role() = 'admin'
  OR coach_has_division(division_id)
);

CREATE POLICY "fixture_insert" ON fixture_matches FOR INSERT WITH CHECK (
  get_user_role() = 'admin'
  -- coaches cannot import fixture; that is an admin action
);

CREATE POLICY "fixture_update" ON fixture_matches FOR UPDATE USING (
  get_user_role() = 'admin'
  OR coach_has_division(division_id)
  -- coaches can edit notes and record results for their own matches
);

CREATE POLICY "fixture_delete" ON fixture_matches FOR DELETE USING (
  get_user_role() = 'admin'
);
```

```sql
-- match_lineups: coach-owned, scoped via match → division
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lineups_select" ON match_lineups FOR SELECT USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM fixture_matches fm
    WHERE fm.id = match_lineups.match_id
      AND coach_has_division(fm.division_id)
  )
);

CREATE POLICY "lineups_insert" ON match_lineups FOR INSERT WITH CHECK (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM fixture_matches fm
    WHERE fm.id = match_lineups.match_id
      AND coach_has_division(fm.division_id)
  )
);

CREATE POLICY "lineups_update" ON match_lineups FOR UPDATE USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM fixture_matches fm
    WHERE fm.id = match_lineups.match_id
      AND coach_has_division(fm.division_id)
  )
);

CREATE POLICY "lineups_delete" ON match_lineups FOR DELETE USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM fixture_matches fm
    WHERE fm.id = match_lineups.match_id
      AND coach_has_division(fm.division_id)
  )
);
```

### Pattern for player-scoped tables (`player_positions`)

```sql
-- player_positions: same access as player itself
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_select" ON player_positions FOR SELECT USING (
  get_user_role() IN ('admin', 'tutora')
  OR EXISTS (
    SELECT 1 FROM players p
    JOIN coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

CREATE POLICY "positions_insert" ON player_positions FOR INSERT WITH CHECK (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM players p
    JOIN coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

CREATE POLICY "positions_update" ON player_positions FOR UPDATE USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM players p
    JOIN coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);
```

**Important:** The `match_lineups` RLS pattern chains through `fixture_matches` to get the `division_id`. This is the same two-level join pattern used in infantiles for `attendance_records` (chain through `training_sessions`). It is proven to work without performance issues at juvenile-club scale (hundreds, not millions, of rows).

---

## Fixture Import Pipeline Architecture

The URBA fixture Excel is a fixed-format spreadsheet downloaded from the URBA website. The import pipeline runs entirely server-side to avoid exposing the service_role key on the client.

### Flow

```
User uploads Excel file
  → POST /api/fixture/import (multipart form)
    → exceljs parses the file in-memory
    → rows normalized to { division_id, match_date, round, venue_type, opponent_club_id }
    → opponent name matched against opponent_clubs.name / short_name
    → preview JSON returned to client (no DB write yet)
  → Client shows preview table (matched vs unmatched rows)
  → User confirms (or fixes unmatched opponents manually)
  → POST /api/fixture/import/confirm
    → createAdminClient() upserts rows into fixture_matches
    → UPSERT ON CONFLICT (division_id, match_date) DO UPDATE
    → returns count of inserted / updated rows
```

### API Routes

```
POST /api/fixture/import
  Body: multipart/form-data with file + division_ids[]
  Auth: assertAdmin() guard
  Returns: { preview: Row[], unmatched: string[] }

POST /api/fixture/import/confirm
  Body: { rows: NormalizedRow[] }
  Auth: assertAdmin() guard
  Returns: { inserted: number, updated: number }
```

### Excel Parsing Strategy

Use `exceljs` (already a production dependency in infantiles). Parse the relevant columns from the URBA sheet. The URBA Excel format is semi-structured; build a dedicated parser module at `src/lib/fixture/parseUrbaExcel.ts`.

The parser should:
1. Read rows starting from the first data row (skip headers).
2. Map the division column (e.g. "M15") to a `division_id` via a lookup against the already-loaded `divisions` table.
3. Map the opponent column to `opponent_club_id` using a case-insensitive match against `opponent_clubs.name` and `opponent_clubs.short_name`. Any row where the opponent cannot be matched goes into `unmatched[]`.
4. Return normalized rows + unmatched list. Never write to DB in this step.

### Unmatched Opponent Resolution

The preview screen shows unmatched opponent names with a searchable dropdown to manually map each to an existing club. The user selects the correct club and the confirmed row uses that mapping. This handles typos and abbreviations in the URBA Excel.

If a club truly doesn't exist yet, an "add club" inline action lets admin create the `opponent_clubs` row before confirming the import. This avoids blocking the whole import for one missing club.

### Re-import Safety

The UPSERT `ON CONFLICT (division_id, match_date) DO UPDATE` means re-importing the same Excel is safe. Existing rows (e.g., ones the coach edited manually with a result) are overwritten only for the columns populated by the import (`round`, `opponent_club_id`, `venue_type`, `venue_id`). Result columns (`score_local`, `score_visitante`) are NOT touched during re-import:

```sql
ON CONFLICT (division_id, match_date) DO UPDATE SET
  round            = EXCLUDED.round,
  opponent_club_id = EXCLUDED.opponent_club_id,
  venue_type       = EXCLUDED.venue_type,
  venue_id         = EXCLUDED.venue_id,
  imported_from    = 'excel_import',
  updated_at       = NOW()
  -- score_local and score_visitante are intentionally omitted
```

---

## Data Flow: Match Day

```
1. Coach opens /fixture/[divisionId]
   → Server Component fetches fixture_matches for division (filtered by RLS)

2. Coach selects upcoming match → /fixture/[divisionId]/[matchId]
   → Server Component fetches:
     - fixture_matches row (opponent, date, venue)
     - attendance_records for the training session(s) closest to match_date
     - match_lineups for this match (if already exists)
     - player_positions for all players in division

3. Coach builds lineup
   → Client Component: drag or tap players into positions 1-15
   → Players shown are filtered to those who attended last training (present = TRUE)
   → Players with a position_primary matching a slot are highlighted
   → Suplentes section below the 15

4. Save lineup
   → Server Action: upsert match_lineups rows
   → One row per player: position_number for starters, is_substitute=TRUE for bench
```

---

## Scalability Considerations

| Concern | Current scale | Notes |
|---------|---------------|-------|
| `fixture_matches` row count | ~40 rounds × 4 divisions = 160 rows/year | Trivially small |
| `match_lineups` row count | ~22 players × 160 matches = 3,520 rows/year | Trivially small |
| `player_positions` row count | ~80 players total (M15–M19) | One row per player |
| PostgREST max-rows=1000 | Irrelevant for these tables | But apply pagination pattern to `attendance_records` per infantiles pitfall |
| RLS chain depth | 2 levels max (lineups → fixture → division) | Proven pattern from infantiles |

The juveniles data volume is an order of magnitude smaller than what would stress Supabase free tier. No performance concerns for v1.

---

## Anti-Patterns to Avoid

### Anti-Pattern: Duplicating `opponent_clubs` data in fixture

Do not store the opponent name as a plain text column in `fixture_matches`. Always foreign-key to `opponent_clubs.id`. The existing table has coordinator info, venue mappings, and short names that are valuable downstream.

**Instead:** Match during import, surface unmatched opponents for manual resolution.

### Anti-Pattern: Storing positions as a text enum array

Do not do `position_tags TEXT[] DEFAULT '{}'` on the `players` table. Arrays in PostgreSQL cannot carry per-element constraints, are awkward to query, and break the "join to get position details" pattern.

**Instead:** Dedicated `player_positions` table with constrained integer columns.

### Anti-Pattern: Building lineups client-side only (no DB persistence)

The lineup is only useful if it persists. Coaches might build it Tuesday, then open it again Saturday morning. An ephemeral client state solves nothing.

**Instead:** `match_lineups` table, saved immediately on each change (same pattern as attendance toggle in infantiles).

### Anti-Pattern: One API route that imports AND confirms

Mixing parse + commit in a single request removes the preview/confirmation step and makes re-imports dangerous.

**Instead:** Two-step pipeline: import returns preview, confirm does the upsert.

### Anti-Pattern: Importing Excel on the client with a browser library

Sending the raw Excel to the browser and parsing there exposes server-only logic and can't access the DB for opponent matching.

**Instead:** Upload to an API route (`/api/fixture/import`), parse server-side with exceljs, return normalized JSON.

---

## Migration Strategy

All new tables are added as new numbered migrations in the shared Supabase project. Migrations run manually in the Supabase SQL Editor (same workflow as infantiles).

Suggested migration numbers (pick up where infantiles left off, currently at 032):

| Migration | Content |
|-----------|---------|
| `033_fixture_matches.sql` | `fixture_matches` table + indexes + RLS |
| `034_player_positions.sql` | `player_positions` table + indexes + RLS |
| `035_match_lineups.sql` | `match_lineups` table + indexes + RLS |

Run in order. Each migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`).

**No changes to any existing tables** are needed for the core juvenile features. The shared tables (`players`, `training_sessions`, `attendance_records`, etc.) work as-is for juvenile divisions because they are already division-scoped.

---

## Sources

- Direct analysis of infantiles production migrations (001–032) — HIGH confidence
- Supabase RLS documentation patterns — consistent with observed migration code
- Rugby union position numbering — standard World Rugby laws (positions 1–15, bench 16–23, but juveniles typically use a simplified 15+bench model)
