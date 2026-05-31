---
phase: 02
plan: 02
subsystem: fixture-ui
tags: [fixture, division-context, match-card, result-badge, server-component, client-component]
dependency_graph:
  requires:
    - src/lib/queries/matches.ts (02-01)
    - src/lib/matches/utils.ts (02-01)
    - src/lib/supabase/database.types.ts (02-01)
  provides:
    - src/context/DivisionContext.tsx (ALL_DIVISIONS_SENTINEL, userRole, isAllDivisions)
    - src/components/layout/DivisionSelector.tsx (opción admin-only "Todas las divisiones")
    - src/components/fixture/ResultBadge.tsx
    - src/components/fixture/MatchCard.tsx
    - src/components/fixture/FixtureList.tsx
    - src/components/fixture/FixtureListShell.tsx
    - src/components/fixture/EmptyFixture.tsx
    - src/app/(app)/fixture/page.tsx (Server Component real, reemplaza PlaceholderScreen)
    - src/app/(app)/fixture/loading.tsx
  affects:
    - src/app/(app)/layout.tsx (pasa userRole a DivisionProvider)
    - src/lib/matches/utils.ts (eslint-disable _matchDate)
    - src/app/(app)/lista/actions.ts (eslint-disable userId — pre-existing)
    - src/app/(app)/jugadores/[id]/editar/page.tsx (fix TS2322 null — pre-existing)
tech_stack:
  added: []
  patterns:
    - Server Component fetches all + Client FixtureListShell filters by activeDivision (no re-fetch on division switch)
    - ALL_DIVISIONS_SENTINEL pattern para vista admin multi-division
    - isAllDivisions() guard en localStorage restore (T-02-10 mitigacion)
    - FixtureList agrupa por division_name cuando isAllDivisions(activeDivision)
key_files:
  created:
    - src/components/fixture/ResultBadge.tsx
    - src/components/fixture/MatchCard.tsx
    - src/components/fixture/EmptyFixture.tsx
    - src/components/fixture/FixtureList.tsx
    - src/components/fixture/FixtureListShell.tsx
    - src/app/(app)/fixture/loading.tsx
  modified:
    - src/context/DivisionContext.tsx
    - src/components/layout/DivisionSelector.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/fixture/page.tsx
    - src/lib/matches/utils.ts
    - src/app/(app)/lista/actions.ts
    - src/app/(app)/jugadores/[id]/editar/page.tsx
decisions:
  - "Server Component fetches listAllJuvenile() siempre; RLS filtra server-side; cliente filtra por activeDivision para UX sin re-fetch"
  - "ALL_DIVISIONS_SENTINEL con id '__all__' como Division sentinela — no entra en divisions[] real, solo en options del selector admin"
  - "FixtureListShell como puente Server-Client: recibe allMatches como prop serializable y filtra en cliente"
metrics:
  duration: "~25 min"
  completed_date: "2026-05-31"
  tasks_completed: 3
  files_created: 6
  files_modified: 7
---

# Phase 02 Plan 02: Vista del Fixture — Cards, Badges y DivisionContext extendido

**One-liner:** Vista /fixture real con MatchCards, ResultBadge coloreado, empty states diferenciados por rol, DivisionContext extendido con sentinel ALL_DIVISIONS y opcion admin-only "Todas las divisiones" en el selector.

## What Was Built

### Task 1 — DivisionContext extendido + AppLayout actualizado

`DivisionContext.tsx` exporta ahora: `ALL_DIVISIONS_ID` (`'__all__'`), `ALL_DIVISIONS_SENTINEL` (objeto `{ id, name }`), `isAllDivisions(d)`, `UserRole` type, y el contexto incluye `userRole`. `DivisionProvider` recibe `userRole` como prop y lo expone. Al restaurar desde localStorage, el sentinel `__all__` solo se acepta si `userRole === 'admin'` (mitigacion T-02-10). `AppLayout` pasa `userRole` al provider — cambio additive, ningun componente existente se rompe.

### Task 2 — DivisionSelector con opcion admin-only

`DivisionSelector` ahora importa del contexto `userRole`, `ALL_DIVISIONS_SENTINEL` y `ALL_DIVISIONS_ID`. Para admin: siempre muestra el selector (incluso con 1 division) y agrega "Todas las divisiones" al final del listado con separador visual (`border-t`). Para coach/tutora: comportamiento original (oculto si < 2 divisiones, sin opcion "Todas"). El array `options` nunca incluye el sentinel si `userRole !== 'admin'` — defensa en profundidad (T-02-08).

### Task 3 — Componentes fixture + pagina real

- `ResultBadge`: badge con variantes won (verde `bg-green-700`), lost (rojo `bg-red-700`), draw/pending (secondary gris). Muestra score inline cuando disponible ("Ganado 24-17"). `aria-label` con score para accesibilidad.
- `MatchCard`: Card-Link a `/fixture/[id]`, layout de 3 filas (fecha/badges, rival bold, L/V hora ChevronRight), chip subequipo, indicador "Sin resultado cargado" para partidos pasados sin score.
- `EmptyFixture`: empty state con `CalendarDays` icon, copy diferenciado admin ("Sin partidos cargados" + link a importar) vs coach ("Sin partidos programados").
- `FixtureList`: Client Component que renderiza lista plana o agrupada por `division_name` segun `isAllDivisions(activeDivision)`.
- `FixtureListShell`: Client Component puente — recibe `allMatches` del Server Component y filtra `useMemo` por `activeDivision.id`. Admin con "Todas" recibe todo; coach recibe filtrado por su division.
- `fixture/page.tsx`: Server Component reemplaza PlaceholderScreen. Llama `listAllJuvenile()` (RLS filtra automaticamente). Mapea a `MatchItem[]` tipados y pasa a `FixtureListShell`.
- `fixture/loading.tsx`: 3 `Skeleton` con `h-[72px] rounded-lg`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] eslint-disable en utils.ts `_matchDate` param**
- **Found during:** Task 3 — `npm run build`
- **Issue:** `next/typescript` ESLint preset flagea `_matchDate` como unused var incluso con el prefijo `_`. El build fallaba.
- **Fix:** Anadir `// eslint-disable-next-line @typescript-eslint/no-unused-vars` en `utils.ts`. El parametro se mantiene en la firma publica para futura extension (ej: "jugado" = fecha pasada).
- **Files modified:** `src/lib/matches/utils.ts`
- **Commit:** `3612cd3`

**2. [Rule 3 - Blocker] eslint-disable en `lista/actions.ts` — `userId` unused (pre-existing)**
- **Found during:** Task 3 — `npm run build`
- **Issue:** Dos variables `userId` asignadas pero no usadas en `upsertAttendance` y `batchUpsertAttendance`. Pre-existentes de Phase 1, documentadas en 02-01-SUMMARY.md. Bloquean el build.
- **Fix:** `// eslint-disable-next-line @typescript-eslint/no-unused-vars` en ambas lineas.
- **Files modified:** `src/app/(app)/lista/actions.ts`
- **Commit:** `3612cd3`

**3. [Rule 3 - Blocker] Fix TS2322 en `jugadores/[id]/editar/page.tsx` — `division_id` null (pre-existing)**
- **Found during:** Task 3 — `npm run build`
- **Issue:** `player.division_id` es `string | null` pero `PlayerForm.defaultDivisionId` espera `string`. Pre-existente de Phase 1. Bloquea el build.
- **Fix:** Usar `player.division_id ?? availableDivisions[0]?.id ?? ''` y `player.division_id ?? ''` en el campo `initial.division_id`.
- **Files modified:** `src/app/(app)/jugadores/[id]/editar/page.tsx`
- **Commit:** `3612cd3`

## Known Stubs

None — los componentes consumen datos reales de Supabase via `listAllJuvenile()`. No hay datos hardcodeados ni placeholders en el render.

## Threat Flags

Todas las amenazas del threat register de este plan fueron mitigadas:

| Threat | Mitigation | Status |
|--------|------------|--------|
| T-02-08 Elevation of Privilege | `options` array no incluye sentinel si `userRole !== 'admin'` | Implementado |
| T-02-09 Information Disclosure | `listAllJuvenile()` server-side; RLS filtra automaticamente divisiones del coach | Implementado |
| T-02-10 Tampering localStorage | Guard `userRole === 'admin'` antes de restaurar `__all__` desde localStorage | Implementado |
| T-02-11 Spoofing sentinel (accept) | Coach manipulando localStorage solo ve lo que RLS permite — riesgo residual aceptado | Aceptado |

## Self-Check: PASSED

- [x] `src/components/fixture/ResultBadge.tsx` existe — commit `3612cd3`
- [x] `src/components/fixture/MatchCard.tsx` contiene Link a `/fixture/${id}` — commit `3612cd3`
- [x] `src/components/fixture/FixtureList.tsx` es Client Component con `'use client'` — commit `3612cd3`
- [x] `src/components/fixture/EmptyFixture.tsx` contiene "Sin partidos programados" y "Sin partidos cargados" — commit `3612cd3`
- [x] `src/app/(app)/fixture/page.tsx` llama `listAllJuvenile()`, sin PlaceholderScreen — commit `3612cd3`
- [x] `src/app/(app)/fixture/loading.tsx` tiene 3 Skeleton `h-[72px]` — commit `3612cd3`
- [x] `src/context/DivisionContext.tsx` exporta `ALL_DIVISIONS_SENTINEL`, `isAllDivisions`, `userRole` — commit `db74cf2`
- [x] `src/app/(app)/layout.tsx` pasa `userRole` a DivisionProvider — commit `db74cf2`
- [x] `src/components/layout/DivisionSelector.tsx` agrega sentinel solo para admin — commit `feb462b`
- [x] `npm run build` exitoso — build output verificado post Task 3
- [x] Commits: `db74cf2`, `feb462b`, `3612cd3`
