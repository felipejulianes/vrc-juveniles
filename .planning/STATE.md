---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Rework de producto 2026-07-05: nav + home + stats + team builder implementados"
last_updated: "2026-07-05T00:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 10
  completed_plans: 10
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-24)

**Core value:** El entrenador llega al partido sabiendo quiénes vinieron a entrenar, qué puesto juega cada uno, y puede armar el equipo del sábado desde la app en segundos
**Current focus:** Cerrar Team Builder (migración pendiente de aplicar) y UAT integral

## Current Position (auditado contra código real el 2026-07-05)

- **Fase 1 (Foundation, Players & Attendance): COMPLETA.** Migraciones aplicadas en prod (verificado vía REST).
- **Fase 2 (Fixture Management): COMPLETA en código.** Migraciones `matches` + `match_scoring_events` aplicadas. La tabla `matches` está VACÍA en prod — el CSV real (`fixture-virreyes-2026.csv`, raíz del repo) nunca se importó.
- **Fase 3 (Team Builder): IMPLEMENTADA el 2026-07-05.** Falta aplicar la migración `20260705000000_match_lineups.sql` en prod (bloqueada por permisos en la sesión — additive-only, tabla nueva) y UAT en dispositivo real.
- **Fase 4 (Stats): Estadística de asistencia COMPLETA** (reusa RPCs de infantiles con `p_session_type='entrenamiento'`). **Tutora: PENDIENTE.**

## Rework de producto 2026-07-05

- BottomNav: Inicio / Lista / Fixture / Jugadores / Estadística — todos habilitados. Tab Admin eliminado; acceso admin por ícono escudo en header.
- Home dashboard nuevo en `/` (antes redirect a /jugadores): próximo partido + CTA "Armar equipo", "Tomar lista de hoy", último entrenamiento, KPIs, atajos. Se eliminó `src/app/page.tsx` (conflicto de ruta con `(app)/page.tsx`).
- `/estadistica` real: KPIs, tendencia por sesión (barras), tabla por jugador 30d/año con flag de baja asistencia (<60%).
- Team Builder: `/fixture/[matchId]/equipo` — tap-to-place, slots 1-15 agrupados Forwards/Backs + suplentes 16-23, picker ordenado por puesto registrado y asistencia reciente (últimos 4 entrenamientos), warning apto médico, guardado compartido por división (`match_lineups`).
- Fix landmine: `training_sessions` UNIQUE(division_id, session_date) chocaba con sesiones 'miercoles' pre-creadas por infantiles (migración 026) en divisiones M15-M19. `createSession` ahora convierte esas filas huérfanas a 'entrenamiento'.
- Admin page linkea a /admin/fixture-import (antes inaccesible por UI).

## Acciones pendientes (requieren al usuario)

1. Aplicar `supabase/migrations/20260705000000_match_lineups.sql` en prod (SQL editor o `supabase db push`).
2. Importar `fixture-virreyes-2026.csv` vía /admin/fixture-import (necesita datos en prod para probar fixture/builder).
3. UAT en celular real (PWA): tomar lista, armar equipo, ver stats.
4. Commit del trabajo (no se commiteó — regla: no commit sin pedido explícito).

## Tech Debt

- Offline queue y auth deep-link: verificación diferida (desde fase 1).
- Tutora: rol ve PendingActivationScreen en juveniles (layout exige coach_divisions para no-admin). Diseñar fase Tutora.
- `PlaceholderScreen` puede quedar sin usos — revisar y borrar.

## Session Continuity

Last session: 2026-07-05 — auditoría + rework producto/implementación (nav, home, stats, team builder).
