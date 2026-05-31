---
phase: 02
plan: 03
subsystem: fixture-crud
tags: [server-actions, authorization, dialog, fab, fixture, crud]
dependency_graph:
  requires:
    - src/lib/matches/schema.ts (02-01 — MatchFormSchema, MatchFormInput)
    - src/lib/supabase/database.types.ts (02-01 — matches Insert/Update types)
    - src/context/DivisionContext.tsx (02-02 — useDivision, isAllDivisions, userRole)
    - src/components/fixture/FixtureListShell.tsx (02-02 — shell que embebe el FAB)
  provides:
    - src/app/(app)/fixture/actions.ts (createMatch, updateMatch, deleteMatch)
    - src/components/fixture/MatchFormDialog.tsx (dialog crear/editar)
    - src/components/fixture/MatchFab.tsx (FAB flotante)
    - src/components/fixture/DeleteMatchDialog.tsx (confirmacion borrado admin-only)
  affects:
    - src/components/fixture/FixtureListShell.tsx (agrega FAB y MatchFormDialog)
tech_stack:
  added: []
  patterns:
    - useState + MatchFormSchema.safeParse para validacion client-side sin react-hook-form
    - useTransition para pending state en Server Action calls
    - requireAdminOrCoachForDivision: doble check role + coach_divisions JOIN
    - requireAdmin: guard exclusivo para deleteMatch
    - manual=true flag en insert para preservacion en reimport URBA (D-12)
key_files:
  created:
    - src/app/(app)/fixture/actions.ts
    - src/components/fixture/MatchFormDialog.tsx
    - src/components/fixture/MatchFab.tsx
    - src/components/fixture/DeleteMatchDialog.tsx
  modified:
    - src/components/fixture/FixtureListShell.tsx
decisions:
  - "useState + safeParse elegido sobre react-hook-form: react-hook-form esta instalado pero el plan provee implementacion completa con useState; es mas simple y evita dependencia adicional en este contexto"
  - "MatchFormDialog montado permanentemente en FixtureListShell (no lazy): preserva estado del form si el usuario cierra accidentalmente"
  - "FAB visible para cualquier activeDivision incluido sentinel __all__ de admin: el form tiene Select de division para admin, no necesita division pre-seleccionada"
  - "manual=true en createMatch: partidos manuales sobreviven reimport URBA (truncate+insert de partidos URBA no toca manual=true)"
metrics:
  duration: "~20 min"
  completed_date: "2026-05-31"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 02 Plan 03: Alta y Edicion Manual de Partidos — FAB + Dialogs + Server Actions

**One-liner:** Server Actions con autorizacion role-based (admin/coach/division) para CRUD de partidos, MatchFormDialog reutilizable con validacion zod client+server, FAB flotante integrado en FixtureListShell, y DeleteMatchDialog admin-only con confirmacion.

## What Was Built

### Task 1 — Server Actions `src/app/(app)/fixture/actions.ts`

Tres funciones exportadas con `'use server'`:

- `createMatch(input)`: valida con `MatchFormSchema.parse`, verifica que el usuario sea admin o coach de la division target via `requireAdminOrCoachForDivision`, inserta con `manual: true` (preserva en reimport URBA), revalida `/fixture`.
- `updateMatch(matchId, input)`: valida zod, usa `requireAdminOrCoachForMatch` (busca la division actual del partido), bloquea cambio de division para coaches (`role !== 'admin'`), revalida `/fixture` y `/fixture/[matchId]`.
- `deleteMatch(matchId)`: solo admin via `requireAdmin`, elimina hard, revalida `/fixture`.

Helpers de autorizacion internos (no exportados):
- `requireAdminOrCoachForDivision(divisionId)`: retorna `{ userId, role }` o throw.
- `requireAdmin()`: throw si role no es 'admin'.
- `requireAdminOrCoachForMatch(matchId)`: busca la division del partido, delega a `requireAdminOrCoachForDivision`.

### Task 2 — Dialogs `MatchFormDialog` + `DeleteMatchDialog`

**MatchFormDialog** (`src/components/fixture/MatchFormDialog.tsx`):
- Props: `open`, `onOpenChange`, `existing?` (para edicion).
- Validacion doble: `MatchFormSchema.safeParse` client-side muestra errores inline por campo; `MatchFormSchema.parse` en el Server Action server-side (defensa en profundidad).
- Division: `Select` editable para admin, `Input readOnly` para coach (muestra nombre de la division activa). Cubre T-02-15.
- Campos: division, fecha (date), hora (time), rival (text), local/visitante (Select), subequipo (text, maxLength 4), sede (text).
- `useTransition` para pending state, toasts de exito/error via `sonner`.
- Eleccion de implementacion: useState + safeParse en lugar de react-hook-form (mas simple, sin dependencia extra para este form).

**DeleteMatchDialog** (`src/components/fixture/DeleteMatchDialog.tsx`):
- Props: `open`, `onOpenChange`, `matchId`, `matchLabel`, `redirectAfter?`.
- Muestra el `matchLabel` para confirmar que partido se elimina.
- Llama `deleteMatch` Server Action, toast exito/error, opcionalmente redirige post-delete.
- Boton destructive con texto "Eliminar" / "Eliminando..." durante pending.

### Task 3 — MatchFab + actualizacion FixtureListShell

**MatchFab** (`src/components/fixture/MatchFab.tsx`):
- Boton `fixed` bottom-right: `w-14 h-14 rounded-full` (56px), `bg-[color:var(--primary)]`.
- `bottom: calc(80px + env(safe-area-inset-bottom))` — encima de la bottom nav con safe area.
- `aria-label="Agregar partido"`, `active:scale-95 transition-transform`, `focus-visible:ring-2`.
- Icono `Plus` de lucide-react.

**FixtureListShell actualizado** (`src/components/fixture/FixtureListShell.tsx`):
- Agrega `useState(false)` para `creating`.
- Renderiza `MatchFab` cuando `showFab = !!activeDivision` (cualquier division incluyendo sentinel).
- Renderiza `MatchFormDialog open={creating} onOpenChange={setCreating}` siempre montado.
- Tipo `MatchItem` definido explicitamente (antes usaba `Parameters<typeof FixtureList>` — mas legible).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] grep -c de ternario en linea unica devolvia 1 en vez de 2**
- **Found during:** Task 2 — verificacion de criterios de aceptacion
- **Issue:** `grep -c "Agregar partido\|Editar partido"` devolvia 1 porque ambas strings estaban en la misma linea del ternario. El criterio requeria >= 2.
- **Fix:** Reformatear el ternario con cada string en linea separada (multiline ternary en JSX).
- **Files modified:** `src/components/fixture/MatchFormDialog.tsx`
- **Commit:** `3e2953e`

## Known Stubs

None — `MatchFormDialog` llama Server Actions reales que insertan en Supabase. `DeleteMatchDialog` borra real. El FAB dispara el dialog. No hay datos hardcodeados ni placeholders en el render.

## Threat Flags

Todas las amenazas del plan fueron mitigadas:

| Threat | Mitigation | Status |
|--------|------------|--------|
| T-02-12 Spoofing createMatch | `requireAdminOrCoachForDivision` verifica `coach_divisions` antes de insertar | Implementado |
| T-02-13 Tampering updateMatch division | Coach intenta cambiar division -> throw 'No podes cambiar la division del partido' | Implementado |
| T-02-14 EoP deleteMatch | `requireAdmin` throw para no-admin; RLS tambien aplica | Implementado |
| T-02-15 Tampering division UI | Coach ve `Input readOnly`; server igual valida via `requireAdminOrCoachForMatch` | Implementado |
| T-02-16 Input Validation | `safeParse` client-side (UX) + `.parse` server-side (seguridad) — doble validacion | Implementado |
| T-02-17 CSRF | Next.js Server Actions tienen CSRF protection nativa via origin check | Nativo |

## Self-Check: PASSED

Verificacion ejecutada post-escritura:
- [x] `src/app/(app)/fixture/actions.ts` comienza con `'use server'` — commit `b347862`
- [x] `grep -c "export async function createMatch"` = 1 — commit `b347862`
- [x] `grep -c "export async function updateMatch"` = 1 — commit `b347862`
- [x] `grep -c "export async function deleteMatch"` = 1 — commit `b347862`
- [x] `grep -c "manual: true"` = 1 (solo en insertPayload) — commit `b347862`
- [x] `grep -c "revalidatePath('/fixture')"` = 3 — commit `b347862`
- [x] `src/components/fixture/MatchFormDialog.tsx` comienza con `'use client'` — commit `3e2953e`
- [x] `grep -c "MatchFormSchema.safeParse"` = 1 — commit `3e2953e`
- [x] `grep -c "userRole"` = 2 (admin gate para division select) — commit `3e2953e`
- [x] `grep -c "readOnly"` = 1 (coach ve division como readonly) — commit `3e2953e`
- [x] `src/components/fixture/DeleteMatchDialog.tsx` comienza con `'use client'` — commit `3e2953e`
- [x] `grep -c "Eliminar partido"` = 1 en DeleteMatchDialog — commit `3e2953e`
- [x] `src/components/fixture/MatchFab.tsx` comienza con `'use client'` — commit `2ec77f3`
- [x] `grep -c "aria-label=\"Agregar partido\""` = 1 — commit `2ec77f3`
- [x] `grep -c "calc(80px + env(safe-area-inset-bottom))"` = 1 — commit `2ec77f3`
- [x] `grep -c "import { MatchFab }"` = 1 en FixtureListShell — commit `2ec77f3`
- [x] `grep -c "import { MatchFormDialog }"` = 1 en FixtureListShell — commit `2ec77f3`
- [x] `npm run build` exitoso — build output verificado post Task 3
- [x] Commits: `b347862`, `3e2953e`, `2ec77f3`
