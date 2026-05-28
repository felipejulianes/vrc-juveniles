---
phase: 01-foundation-players-attendance
plan: 03
subsystem: players-read
tags: [players, division-scope, PLY-01, PLY-05, PLY-06, PLY-07, server-components, supabase]
dependency_graph:
  requires: [01-02]
  provides: [players-query-module, jugadores-list-screen, jugadores-profile-screen]
  affects: [01-04, 01-05]
tech_stack:
  added: []
  patterns:
    - Server Component + Client island pattern (PlayerListClient)
    - Promise.all for parallel division pre-fetch
    - FK relation normalization (array vs object from Supabase join)
    - Intl.RelativeTimeFormat es-AR for relative dates
key_files:
  created:
    - src/lib/queries/players.ts
    - src/components/players/PlayerAvatar.tsx
    - src/components/players/PlayerPositionBadge.tsx
    - src/components/players/PlayerCard.tsx
    - src/components/players/EmptyPlayerList.tsx
    - src/components/players/PlayerListClient.tsx
    - src/app/(app)/jugadores/loading.tsx
    - src/app/(app)/jugadores/[id]/page.tsx
    - src/app/(app)/jugadores/nuevo/page.tsx
  modified:
    - src/lib/supabase/database.types.ts
    - src/app/(app)/jugadores/page.tsx
decisions:
  - key: live-schema-contact-fields
    summary: "Live players table uses parent_phone/parent_name (not phone/email); types updated to match live schema"
  - key: player-notes-schema
    summary: "player_notes uses content/created_by/note_date (not body/author_id); types updated to match live schema"
  - key: acciones-deferred-to-plan04
    summary: "Editar/Eliminar buttons rendered as disabled in profile; Plan 04 enables them with Server Actions"
  - key: nuevo-stub
    summary: "/jugadores/nuevo is a stub page to prevent FAB 404; Plan 04 replaces it entirely"
metrics:
  duration: ~30 minutes
  completed_date: "2026-05-28"
  tasks_completed: 3
  files_created: 9
  files_modified: 2
---

# Phase 01 Plan 03: Players Read Side Summary

**One-liner:** Division-scoped player list and profile screen using Server-Component + client-island pattern, with real live schema column names (parent_phone/content) confirmed via Supabase OpenAPI.

---

## What Was Built

### Task 1 — database.types.ts + query helpers

Extended `src/lib/supabase/database.types.ts` with the full `players` and `player_notes` table types, verified against the live Supabase OpenAPI spec before writing. Created `src/lib/queries/players.ts` (`server-only`) with three exported functions:

- `listByDivision(divisionId)` — `ORDER BY inactivo ASC, last_name ASC, first_name ASC` (PLY-06 at DB layer)
- `getById(playerId)` — returns null for inaccessible IDs → `notFound()` in the page (T-01-14 mitigation)
- `getNotes(playerId)` — latest 20 notes descending by `created_at`

FK join `player_positions(position_primary, position_alt1, position_alt2)` is normalized from Supabase's variable return shape (array or object) into a consistent `| null` union.

### Task 2 — /jugadores list screen (PLY-01, PLY-06)

Seven files created:

| File | Role |
|------|------|
| `PlayerAvatar.tsx` | Circular avatar 40px (sm) / 96px (lg) with initials fallback on `--muted` |
| `PlayerPositionBadge.tsx` | Numbered circle badge `--primary` bg with RUGBY_POSITIONS aria-label |
| `PlayerCard.tsx` | Player row: avatar + name + DNI/birth-year + position badge + Inactivo badge; `min-h-[44px]` touch target |
| `EmptyPlayerList.tsx` | Empty state with exact UI-SPEC copy |
| `PlayerListClient.tsx` | `'use client'` island — `useDivision` picks rows by `activeDivision.id`; renders PlayerCard list + FAB |
| `jugadores/page.tsx` | Server Component — pre-fetches all divisions in parallel via `Promise.all` |
| `jugadores/loading.tsx` | 6 Skeleton rows for Suspense loading state |

### Task 3 — /jugadores/[id] profile (PLY-05) + /nuevo stub

Profile page shows all PLY-05 fields:
- Large avatar (96px)
- **Datos**: DNI, birth date (DD/MM/YYYY), parent phone, parent name
- **Posiciones**: primary + alt positions with number badge + RUGBY_POSITIONS name
- **Bitacora**: up to 20 notes with `Intl.RelativeTimeFormat('es-AR')`
- **Acciones**: Editar/Eliminar disabled (Plan 04 enables them)

M14-promoted players (PLY-07) automatically inherit their notes because `player_notes.player_id` is the same UUID row — no special code needed.

`/jugadores/nuevo` stub prevents FAB 404. Plan 04 replaces it entirely.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Live schema column names differ from plan assumptions**

- **Found during:** Task 1 — before writing any code, queried live Supabase OpenAPI to confirm schema
- **Issue:** Plan assumed `phone`/`email` on players and `body`/`author_id` on player_notes. Live schema has `parent_phone`/`parent_name` and `content`/`created_by`/`note_date`
- **Fix:** Updated `database.types.ts` to match live schema exactly; profile page displays `parent_phone`/`parent_name` instead of generic contact fields
- **Files modified:** `src/lib/supabase/database.types.ts`, `src/app/(app)/jugadores/[id]/page.tsx`
- **Commit:** 56f3e6a

**2. [Rule 1 - Bug] ESLint `@typescript-eslint/no-explicit-any` blocked production build**

- **Found during:** Task 3 verification — `npm run build` failed on ESLint pass
- **Issue:** Two `any` casts in `players.ts` failed strict ESLint (Next.js 14 build-time lint)
- **Fix:** Replaced `any` casts with typed intermediate `RawPlayerWithPositionJoin` type and `normalizePosition()` helper function using `unknown` cast
- **Files modified:** `src/lib/queries/players.ts`
- **Commit:** 2459892

---

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| `src/app/(app)/jugadores/nuevo/page.tsx` | 9-13 | Intentional per plan — prevents FAB 404; Plan 04 replaces with full form |
| `src/app/(app)/jugadores/[id]/page.tsx` | Editar/Eliminar buttons | Intentional per plan — disabled until Plan 04 adds Server Actions |

---

## Security / Threat Surface

T-01-14 and T-01-16 mitigated: `getById` returns `null` for inaccessible player IDs (RLS enforces division scoping), and `notFound()` renders 404 — coach cannot navigate to another division's player profile.

---

## Plan 04 Handoff

Plan 04 (CRUD) can reuse:
- `listByDivision` — roster for form context
- `getById` — pre-fill edit form
- `PlayerWithPosition` type — shared across edit form and attendance grid (Plan 05)

Plan 04 must:
1. Replace `/jugadores/nuevo/page.tsx` with the full add-player form
2. Create `/jugadores/[id]/editar/page.tsx`
3. Add delete Server Action and wire the Eliminar button in the profile page

---

## Self-Check: PASSED

All 10 files verified present. All 3 task commits verified in git log (56f3e6a, 89635b0, 2459892). Build exits 0.
