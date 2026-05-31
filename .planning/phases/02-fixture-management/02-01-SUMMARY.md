---
phase: 02
plan: 01
subsystem: matches-domain
tags: [database, migration, rls, zod, csv-parser, queries, vitest]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/20260530000000_matches.sql
    - src/lib/matches/schema.ts
    - src/lib/matches/utils.ts
    - src/lib/matches/csv-parser.ts
    - src/lib/queries/matches.ts
  affects:
    - src/lib/supabase/database.types.ts
tech_stack:
  added:
    - vitest@4.1.7 (dev dependency — test runner)
  patterns:
    - Supabase migration with explicit RLS JOIN (no get_user_role())
    - Zod schema with refine for cross-field validation (score consistency)
    - server-only import guard on queries
    - CRLF normalization in CSV parser
key_files:
  created:
    - supabase/migrations/20260530000000_matches.sql
    - src/lib/matches/schema.ts
    - src/lib/matches/utils.ts
    - src/lib/matches/utils.test.ts
    - src/lib/matches/csv-parser.ts
    - src/lib/matches/csv-parser.test.ts
    - src/lib/queries/matches.ts
  modified:
    - src/lib/supabase/database.types.ts
    - package.json
decisions:
  - "RLS para match_scoring_events via JOIN con matches + profiles, no lookup directo, para mantener herencia de permisos del partido padre"
  - "formatMatchDate normaliza separador '-' a '/' para compatibilidad con ICU builds que no usan '/' en es-AR"
  - "supabase gen types ejecutado con 2>/dev/null para evitar que stderr (mensajes de CLI) contamine el archivo .ts"
metrics:
  duration: "~20 min"
  completed_date: "2026-05-31"
  tasks_completed: 3
  files_created: 7
  files_modified: 2
---

# Phase 02 Plan 01: Cimientos de datos — Matches + Scoring Events

**One-liner:** Schema DB con RLS para `matches` y `match_scoring_events`, tipos Supabase regenerados, módulo `lib/matches` con zod schemas, utilidades de dominio, parser CSV y queries server-side.

## What Was Built

### Task 1 — Migration `20260530000000_matches.sql`

Tabla `matches` con 15 columnas incluyendo constraint `matches_score_consistency` (ambos scores NULL o ambos NOT NULL), trigger `trg_matches_updated_at`, y 4 RLS policies (SELECT/INSERT/UPDATE: admin OR coach_divisions; DELETE: admin only). Tabla `match_scoring_events` con FK a `matches` ON DELETE CASCADE, FK a `players` ON DELETE SET NULL, y 4 RLS policies via JOIN con `matches` para heredar permisos de división. Tres indexes: `idx_matches_division_date`, `idx_matches_manual`, `idx_scoring_match`.

### Task 2 — Push + Regenerar tipos

`supabase db push` aplicó `20260529000000_players_apto_medico.sql` y `20260530000000_matches.sql` al proyecto linked (ref `lpfezcqyuoohdilzazml`). Tipos regenerados con `2>/dev/null` para evitar contaminación de stderr en el archivo `.ts`. El archivo ahora incluye `matches` y `match_scoring_events` con todas las columnas.

### Task 3 — Módulo `lib/matches` + queries (TDD)

- `schema.ts`: `MatchFormSchema`, `MatchResultSchema` (con refine de consistencia score), `ScoringEventSchema`
- `utils.ts`: `getMatchResult` (won/lost/draw/pending), `formatMatchDate` (es-AR con normalización de separador)
- `csv-parser.ts`: `parseFixtureCSV` con whitelist de divisiones, whitelist de Local/Visitante, validación de 7 columnas, normalización CRLF
- `queries/matches.ts`: `listByDivision`, `listAllJuvenile`, `getById`, `getWithEvents` — todos con `import 'server-only'`
- Tests: 12 tests verdes en vitest (5 utils + 7 csv-parser)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] formatMatchDate normalización ICU separador**
- **Found during:** Task 3 — TDD GREEN fase
- **Issue:** Node.js ICU build en el entorno devuelve `sáb 11-04` con guión en lugar de `sáb 11/04` con barra al usar `toLocaleDateString('es-AR')`. El test esperaba `/` y fallaba.
- **Fix:** Añadir `.replace(/(\d{2})-(\d{2})/g, '$1/$2')` al resultado de `formatMatchDate` para normalizar el separador independiente del build de ICU.
- **Files modified:** `src/lib/matches/utils.ts`
- **Commit:** `4cc55cd`

**2. [Rule 1 - Bug] stderr del CLI de Supabase en database.types.ts**
- **Found during:** Task 3 — verificación TypeScript
- **Issue:** El primer `supabase gen types typescript --linked > database.types.ts` capturó las líneas de stderr ("Initialising login role...", "A new version of Supabase CLI...") dentro del archivo `.ts`, causando errores de compilación TypeScript.
- **Fix:** Regenerar con `2>/dev/null` para redirigir stderr al null device.
- **Files modified:** `src/lib/supabase/database.types.ts`
- **Commit:** `4cc55cd`

### Out of Scope

**3. Errores TypeScript preexistentes en jugadores/editar/page.tsx**
- `src/app/(app)/jugadores/[id]/editar/page.tsx` tiene 2 errores `TS2322: Type 'string | null' is not assignable to type 'string'` en líneas 64 y 73. Son preexistentes de Phase 1, no introducidos por este plan.
- No están en archivos de `src/lib/matches` ni `src/lib/queries/matches.ts`.
- Registrado para corrección en una tarea separada.

## Known Stubs

None — este plan solo establece la capa de datos y dominio. No hay componentes UI ni datos hardcodeados.

## Threat Flags

Todas las amenazas del plan fueron mitigadas per el threat register:

| Threat | Mitigation |
|--------|------------|
| T-02-01 Spoofing | RLS SELECT/INSERT/UPDATE via coach_divisions JOIN en migration |
| T-02-02 Tampering score | CHECK constraint matches_score_consistency |
| T-02-03 Tampering delete | DELETE policy admin-only en matches |
| T-02-04 Info disclosure scoring | RLS scoring hereda permisos via JOIN con matches |
| T-02-05 Tampering CSV | Whitelist VALID_DIVISIONS + VALID_HOME_AWAY + validación 7 columnas |

## Self-Check: PASSED

Verificación ejecutada post-escritura:
- [x] `supabase/migrations/20260530000000_matches.sql` existe (commit ca6fdf3)
- [x] `src/lib/supabase/database.types.ts` contiene `matches:` y `match_scoring_events:` (commit 4cc55cd)
- [x] `src/lib/matches/schema.ts`, `utils.ts`, `csv-parser.ts` existen (commit 4cc55cd)
- [x] `src/lib/queries/matches.ts` empieza con `import 'server-only'` (commit 4cc55cd)
- [x] 12 tests vitest verdes
- [x] `npx tsc --noEmit` sin errores en archivos de este plan
- [x] Commits ca6fdf3, 9d3db3d, 4cc55cd verificados
