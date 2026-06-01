---
plan: 02-04
phase: 02
status: complete
one_liner: "Pantalla /fixture/[matchId] con Server Component autorizando via RLS+notFound, editor de marcador con validación Zod, y sección expandible de CRUD de scoring events (6 tipos, jugador opcional, rival con nombre libre)"
committed_at: "2026-05-31"
commits:
  - "3d9d71e: feat(02-04): server actions saveResult, addScoringEvent, deleteScoringEvent"
  - "ce41ecb: feat(02-04): pantalla /fixture/[matchId] — page, loading, not-found, MatchDetailHeader, MatchAdminBar"
  - "4209818: feat(02-04): ResultEditor, ScoringSection, ScoringEventRow — CRUD de resultado y scoring events"
---

# Summary: 02-04 — Detalle de Partido y Scoring Events

## What Was Built

Pantalla de detalle de partido en `/fixture/[matchId]` con:

- **Server Component** que autoriza vía RLS — llama `getWithEvents(matchId)` y retorna `notFound()` si el partido no existe o el coach no tiene acceso
- **MatchDetailHeader** — ChevronLeft back a `/fixture`, card con rival, fecha formateada, home/away badge, hora opcional
- **MatchAdminBar** — botones Editar + Eliminar visibles solo para admin y coaches de la división
- **ResultEditor** — inputs `h-14 text-4xl` para score_home/score_away, botón "Guardar resultado" que llama Server Action `saveResult` con validación `MatchResultSchema`
- **ScoringSection** — sección expandible "Detalles del resultado", lista de eventos con `ScoringEventRow`, formulario inline para agregar evento
- **ScoringEventRow** — fila con tipo de evento, jugador/rival, botón X para eliminar (admin/coach)
- **Loading skeleton** — bloques skeleton para Suspense
- **Not-found page** — "Partido no encontrado"

## Server Actions (`fixture/[matchId]/actions.ts`)

- `saveResult(matchId, data)` — valida con `MatchResultSchema`, autoriza con `requireAdminOrCoachForMatch`, hace upsert en `matches`
- `addScoringEvent(matchId, data)` — valida con `ScoringEventSchema`, autoriza con `requireAdminOrCoachForMatch`, inserta en `match_scoring_events`
- `deleteScoringEvent(eventId, matchId)` — autoriza con `requireAdminOrCoachForMatch`, elimina de `match_scoring_events`

## Deviations

1. **[Rule 3] Stubs para DeleteMatchDialog/MatchFormDialog** — Plan 02-03 corrió en paralelo (Wave 3). Se crearon stubs vacíos que el merge posterior resolvió conservando las implementaciones reales de 02-03.
2. **[Rule 1] Cast `ScoringEventForUI`** en `page.tsx` — mismatch entre `string` y union types en `database.types.ts` para `event_type` y `team`. Se resolvió con un cast tipado en lugar de modificar el tipo generado.

## Key Files Created

- `src/app/(app)/fixture/[matchId]/actions.ts`
- `src/app/(app)/fixture/[matchId]/page.tsx`
- `src/app/(app)/fixture/[matchId]/loading.tsx`
- `src/app/(app)/fixture/[matchId]/not-found.tsx`
- `src/components/fixture/MatchDetailHeader.tsx`
- `src/components/fixture/MatchAdminBar.tsx`
- `src/components/fixture/ResultEditor.tsx`
- `src/components/fixture/ScoringSection.tsx`
- `src/components/fixture/ScoringEventRow.tsx`

## Build Verification

`npm run build` exitoso — `/fixture/[matchId]` aparece en el output con 9.87 kB.
