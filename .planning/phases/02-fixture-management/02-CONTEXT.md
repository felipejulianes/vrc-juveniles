# Phase 2: Fixture Management - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase entrega el calendario de partidos oficial completo: vista del fixture por división, alta/edición manual de partidos, import del fixture URBA desde CSV (con preview), registro de resultados con detalle de scoring rugby (tries, conversiones, penales, drop goals, tarjetas), y la vista admin multi-división.

Al finalizar: un coach puede ver los próximos partidos de su división, cargar el resultado del último partido con los scorers opcionales, y un admin puede importar el fixture URBA completo de una sola operación.

**No incluye:** Team Builder (Fase 3), estadísticas de asistencia (Fase 4), tutoras (Fase 4), export de planilla, live scores.

</domain>

<decisions>
## Implementation Decisions

### Diseño del fixture (lista)

- **D-01:** Cards apilados por fecha — próximos partidos primero, jugados al final. Usar el componente `Card` de shadcn ya instalado.
- **D-02:** Cada card muestra: fecha, rival, local/visitante (L/V), hora, y resultado con badge coloreado (verde = ganado, rojo = perdido, gris = pendiente/sin resultado).
- **D-03:** Para M17 (y cualquier división con subequipos), mostrar un chip/badge con la letra del subequipo (ej. "A") en cada card. No se implementa filtrado por subequipo en esta fase.
- **D-04:** Botón '+' para agregar partido, visible en el header del tab o como FAB (accesible para coach y admin por igual, FIX-03).
- **D-05:** Al tocar un card de partido se navega a una **pantalla de detalle del partido** (patrón igual a jugadores: lista → detalle).

### Pantalla de detalle del partido

- **D-06:** La pantalla de detalle contiene: información del partido (arriba) + sección de resultado + sección expandible "Detalles del resultado" con scoring events.
- **D-07:** El resultado se carga directamente en la pantalla de detalle (no en dialog modal). Dos campos numéricos: puntos propios / puntos rival.
- **D-08:** Modelo de scoring rugby completo, **todo opcional**: tries (jugador), conversiones (jugador), penales (jugador), drop goals (jugador), tarjetas (jugador + tipo amarilla/roja). El coach puede guardar solo el marcador numérico sin completar el detalle.
- **D-09:** Los selectores de jugadores usan la nómina de la división del partido. Solo se registra el jugador (no el minuto).

### Import de URBA

- **D-10:** El import es desde **CSV** (no Excel). El formato del CSV es el ya extraído: columnas `division`, `fecha_nro`, `fecha`, `equipo`, `local_visitante`, `rival`, `hora`.
- **D-11:** Flujo: upload de archivo CSV → tabla preview con los partidos parseados → botón "Confirmar import" → insert en DB. Si hay errores de parseo se muestran antes de confirmar.
- **D-12:** Al reimportar: **truncate + insert** de los partidos de ese fixture. Reemplaza todo el fixture URBA (no upsert). Los partidos agregados manualmente que tengan flag `manual: true` se preservan (no se borran en el truncate).
- **D-13:** El import es exclusivo de admin (ADM-03). La pantalla de import solo se muestra a usuarios con rol admin.

### Vista admin multi-división

- **D-14:** El admin accede al fixture de todas las divisiones desde el mismo fixture tab. El `DivisionSelector` del header agrega la opción "Todas las divisiones", visible solo para admin.
- **D-15:** Con "Todas las divisiones" seleccionado, los cards del fixture se agrupan por división (sección header por M15, M16, M17, M19).
- **D-16:** El admin puede editar/eliminar cualquier partido de cualquier división, sin restricciones.
- **D-17:** Un solo formulario de partido reutilizado para admin y coach. El campo "división" es editable para admin, solo lectura para coach (usa la división activa del selector).

### Claude's Discretion

- Estructura de la DB: schema de la tabla `matches` (o `fixture_matches`) y la tabla de scoring events. El agente define los tipos y relaciones.
- Paginación o scroll infinito para fixtures largos.
- Comportamiento de la preview del CSV si hay filas malformadas (mostrar error por fila o error global).
- Estado empty del fixture tab cuando no hay partidos importados aún.
- Cómo se distingue visualmente un partido "jugado con resultado" de uno "jugado sin resultado cargado".
- Animación/transition en la sección expandible del detalle.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project fundamentals
- `.planning/PROJECT.md` — Visión, constraints, decisiones clave (fixture: import Excel→CSV decidido aquí, Supabase compartido)
- `.planning/REQUIREMENTS.md` — Requirements FIX-01..06, ADM-02, ADM-03 con criterios exactos
- `.planning/ROADMAP.md` — Success criteria de Fase 2 (5 criterios verificables)

### Stack reference
- `CLAUDE.md` §Technology Stack — ExcelJS ya no es necesario para esta fase (CSV en lugar de Excel); @dnd-kit y next-pwa siguen siendo relevantes para fases posteriores

### Codebase patterns (establecidos en Fase 1)
- `src/lib/queries/players.ts` — Patrón de queries server-side con Supabase. Las queries de fixture deben seguir el mismo patrón.
- `src/app/(app)/fixture/page.tsx` — Punto de entrada del tab fixture (actualmente PlaceholderScreen, esta fase lo reemplaza)
- `src/components/layout/DivisionSelector.tsx` — Debe extenderse para agregar opción "Todas las divisiones" para admin
- `src/components/layout/AppHeader.tsx` — Header con DivisionSelector integrado

### Fixture CSV format
- `fixture-virreyes-2026.csv` — El CSV de referencia. Columnas: `division`, `fecha_nro`, `fecha`, `equipo`, `local_visitante`, `rival`, `hora`. 60 partidos de M15/M16/M17/M19.

### Supabase migrations
- `supabase/migrations/` — Patrón de migrations ya establecido. Fase 2 requiere nuevas tablas para `matches` y `match_scoring_events`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx` — Card shadcn disponible. Usar para match cards en la lista del fixture.
- `src/components/ui/badge.tsx` — Badge shadcn disponible. Usar para badge de resultado (verde/rojo/gris) y subequipo chip.
- `src/components/ui/dialog.tsx` — Dialog disponible. Usar para el formulario de agregar/editar partido.
- `src/components/ui/form.tsx`, `input.tsx`, `select.tsx` — Componentes de form disponibles para el formulario de partido y el de resultado.
- `src/components/ui/skeleton.tsx` — Skeleton disponible para loading state del fixture.
- `src/components/layout/DivisionSelector.tsx` — Necesita extenderse para opción admin "Todas".
- `src/components/layout/PlaceholderScreen.tsx` — Reemplazar en `fixture/page.tsx`.

### Established Patterns
- Queries server-side con `import 'server-only'` + `createClient()` de `@/lib/supabase/server` (ver `players.ts`, `attendance.ts`).
- TypeScript types desde `@/lib/supabase/database.types` (generado por Supabase CLI).
- Supabase migrations en `supabase/migrations/` con timestamps.
- Route structure: `src/app/(app)/[tab]/page.tsx` para tabs principales; sub-rutas como `src/app/(app)/fixture/[matchId]/page.tsx` para detalle.

### Integration Points
- La opción "Todas las divisiones" en `DivisionSelector` requiere cambiar cómo `AppHeader` y el contexto de división filtran contenido.
- Las queries del fixture necesitan un `division_id` (cuando hay división activa) o todas las divisiones (modo admin).
- Los `match_scoring_events` referencian `players.id` — la nómina de la división del partido.

</code_context>

<specifics>
## Specific Ideas

- El CSV de URBA ya extraído (`fixture-virreyes-2026.csv`) define exactamente el formato de import a parsear.
- "Todo opcional" en el scoring detail — el coach puede guardar solo el marcador (propios/rival) sin completar tries ni tarjetas. El flujo no debe obligar al coach a completar el detalle para guardar el resultado.
- M17 tiene subequipos (campo `equipo` en el CSV, valor "A"). Este campo se mapea a un badge visible en el card.

</specifics>

<deferred>
## Deferred Ideas

- **Excel import**: URBA publica en Excel pero el import se simplificó a CSV esta fase. Si el club admin necesita subir el .xlsx original de URBA, se puede agregar en v2 con ExcelJS (ya evaluado en CLAUDE.md).
- **Diff al reimportar**: mostrar qué cambió vs fixture anterior al reimportar. Útil si URBA corrige fechas o sedes. Deferred — por ahora truncate+insert es suficiente.
- **Filtro por subequipo M17**: permitir al coach de M17-A ver solo sus partidos. Deferred — badge por ahora, filtro en fase posterior si se necesita.
- **Geocoding de sedes**: `opponent_clubs` ya tiene venues con geocoding en la DB compartida. Integrar un link a Google Maps desde el partido de visitante. Deferred — fuera de scope de esta fase.
- **Minutos en scoring events**: agregar el minuto del try/tarjeta para estadísticas más detalladas. Deferred a v2.

</deferred>

---

*Phase: 02-fixture-management*
*Context gathered: 2026-05-29*
