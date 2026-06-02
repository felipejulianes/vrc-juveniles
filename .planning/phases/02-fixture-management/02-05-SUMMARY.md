---
phase: 02
plan: 05
subsystem: fixture-import
tags: [fixture, import, csv, admin, server-action]
dependency_graph:
  requires: [02-01, 02-02, 02-03, 02-04]
  provides: [fixture-import-ui, admin-fixture-import-route]
  affects: [fixture-list, empty-fixture-link]
tech_stack:
  added: []
  patterns:
    - admin-guard-server-component
    - server-action-re-parse
    - truncate-plus-insert-urba
key_files:
  created:
    - src/app/(app)/admin/fixture-import/actions.ts
    - src/app/(app)/admin/fixture-import/FixtureImportClient.tsx
    - src/app/(app)/admin/fixture-import/page.tsx
  modified: []
decisions:
  - "Re-parse server-side en confirmFixtureImport — no confiar en el parse del cliente (T-02-14)"
  - "Truncate acotado a manual=false + in(division_id) — preserva partidos manuales y solo afecta divisiones del CSV (D-12, T-02-15)"
  - "Delete+insert no es atómico — trade-off aceptado y documentado en código (T-02-19)"
  - "Tabla HTML nativa con Tailwind — no shadcn Table (no instalado en el repo)"
metrics:
  duration: "~30 min"
  completed: "2026-06-02"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 0
---

# Phase 02 Plan 05: UI de Import del Fixture URBA Summary

**One-liner:** Ruta admin-only /admin/fixture-import con flujo CSV upload → preview table → Server Action confirmFixtureImport (re-parse server-side, truncate manual=false + insert URBA).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Server Action confirmFixtureImport | 7d37a57 | src/app/(app)/admin/fixture-import/actions.ts |
| 2 | FixtureImportClient (upload → preview → confirm) | bb3ce03 | src/app/(app)/admin/fixture-import/FixtureImportClient.tsx |
| 3 | Página admin-only /admin/fixture-import | d2bc122 | src/app/(app)/admin/fixture-import/page.tsx |

## What Was Built

- **`actions.ts`** — Server Action `confirmFixtureImport(csvText)`: verifica admin con `requireAdmin()`, re-parsea el CSV server-side, resuelve `division_id` de divisiones `is_juvenile=true`, aborta si hay divisiones desconocidas ANTES de borrar, hace `delete .eq('manual',false).in('division_id', divisionIds)` para preservar partidos manuales, inserta los nuevos partidos URBA con `manual=false`, y revalida `/fixture`.

- **`FixtureImportClient.tsx`** — Client Component con 2 pasos: (1) upload con `<input type="file" accept=".csv">` que parsea el CSV client-side con `parseFixtureCSV`, (2) preview con tabla HTML nativa de los partidos parseados + sección de errores con `bg-destructive/20`, warning sobre reemplazo, y botones "Confirmar import" / "Cancelar". En confirm llama la Server Action, muestra toast de éxito/error, y navega a `/fixture`.

- **`page.tsx`** — Server Component admin-only que replica el guard de `/admin/page.tsx` (`redirect('/login')` y `redirect('/jugadores')`), monta `FixtureImportClient`.

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria

- [x] FIX-01: admin puede importar el fixture URBA desde /admin/fixture-import
- [x] FIX-02: la preview muestra tabla de partidos parseados con errores diferenciados
- [x] ADM-03: la ruta y la Server Action son exclusivas de admin (guard + requireAdmin + RLS)
- [x] El link "Importar fixture" de EmptyFixture ya no es 404
- [x] D-12 respetado: truncate de manual=false + insert, preservando partidos manuales
- [x] `npm run build` exitoso — ruta /admin/fixture-import compilada como dynamic

## Known Stubs

None — todos los campos de la tabla se mapean de datos reales del CSV. No hay datos hardcodeados.

## Threat Flags

No hay superficies nuevas fuera del modelo de amenazas del plan. Todas las mitigaciones T-02-12 a T-02-19 fueron implementadas o documentadas como aceptadas.

## Self-Check: PASSED

- `src/app/(app)/admin/fixture-import/actions.ts` — FOUND
- `src/app/(app)/admin/fixture-import/FixtureImportClient.tsx` — FOUND
- `src/app/(app)/admin/fixture-import/page.tsx` — FOUND
- Commit 7d37a57 — FOUND
- Commit bb3ce03 — FOUND
- Commit d2bc122 — FOUND
