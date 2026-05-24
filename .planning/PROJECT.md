# VRC Juveniles

## What This Is

App web PWA para entrenadores del rugby juvenil de Virreyes Rugby Club (Buenos Aires, Argentina). Cubre las divisiones M15, M16, M17 y M19. A diferencia de la app de infantiles (que tiene foco social), esta app tiene foco deportivo: gestión de asistencia, fixture oficial URBA, resultados de partidos, posiciones de jugadores y armado de equipo para cada partido.

## Core Value

El entrenador llega al partido sabiendo quiénes vinieron a entrenar, qué puesto juega cada uno, y puede armar el equipo del sábado desde la app en segundos.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Tomar lista en entrenamientos (martes y jueves) con grilla de jugadores
- [ ] Ver historial de sesiones por división
- [ ] Importar fixture oficial URBA desde Excel + edición manual de cada partido
- [ ] Registrar resultado de cada partido (propio y rival)
- [ ] Registrar puesto real y puesto alternativo de cada jugador
- [ ] Armar equipo del partido: seleccionar de los presentes, asignar puestos 1-15 y suplentes con sus puestos posibles
- [ ] CRUD de jugadores con foto
- [ ] Estadísticas de asistencia por jugador y división
- [ ] Rol tutora: entrevistas a jugadores (mismas tutoras que infantiles)
- [ ] Panel admin: gestión de coaches y divisiones

### Out of Scope

- Evaluación de jugadores por partido — no definido todavía, v2
- Estadísticas deportivas avanzadas (tackles, runs, etc.) — requiere modelo de datos complejo, v2
- Transmisión en vivo o resultados en tiempo real — fuera de alcance
- App de infantiles — proyecto separado (`vrc-infantiles`), no se toca

## Context

- **Supabase compartido**: misma instancia que la app de infantiles. Las divisiones M15-M19 ya existen en la tabla `divisions`. Jugadores que ascienden de M14 heredan automáticamente su historial (notas, seguimientos).
- **Auth compartida**: mismas cuentas. Las tutoras y admins de infantiles pueden loguearse aquí con la misma cuenta de Supabase.
- **Entrenamientos**: martes y jueves (vs miércoles en infantiles). Los sábados son partidos del fixture URBA.
- **Coaches**: puede haber más de un coach por división (asignación via `coach_divisions`). El modelo de roles es idéntico al de infantiles.
- **Fixture URBA**: la federación publica el fixture oficial. Se importa desde un Excel descargado del sitio de URBA, con capacidad de edición manual posterior.
- **App en producción**: la app de infantiles está live. Todo desarrollo de juveniles ocurre en un entorno completamente separado hasta estar lista.

## Constraints

- **Stack**: Next.js 14 App Router + TypeScript + Tailwind + Supabase — mismo que infantiles, para reusar patrones y conocimiento
- **Supabase**: mismo proyecto que infantiles (`NEXT_PUBLIC_SUPABASE_URL` compartido). El schema ya tiene divisiones M15-M19
- **Deploy**: Vercel proyecto separado, apunta al mismo Supabase
- **Sin branches/PRs**: workflow directo en `main`, igual que infantiles
- **Aislamiento**: durante desarrollo, no se modifica ni la DB de producción ni el código de infantiles

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| App Next.js separada, mismo Supabase | Aislamiento de producción durante desarrollo; datos de jugadores compartidos sin duplicación | — Pending |
| Mismo stack que infantiles | Reusar patrones, convenciones y conocimiento del proyecto existente | — Pending |
| Fixture: import Excel + edición manual | URBA publica Excel oficial; edición manual para ajustes o correcciones | — Pending |
| Evaluación de jugadores: diferida a v2 | No hay claridad sobre el modelo de evaluación todavía | — Pending |

---
*Last updated: 2026-05-24 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
