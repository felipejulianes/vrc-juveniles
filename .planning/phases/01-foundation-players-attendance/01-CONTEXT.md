# Phase 1: Foundation, Players & Attendance - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase entrega la base completa de la app: setup del proyecto (dependencias, Supabase, PWA, auth), gestión de perfiles de jugadores con foto y posiciones, y sistema de asistencia a entrenamientos con soporte offline.

Al finalizar: un coach puede loguearse, ver su lista de jugadores, crear y editar perfiles con foto y puesto registrado, y tomar lista en un entrenamiento aunque no tenga wifi en la cancha.

**No incluye:** fixture, resultados de partidos, armado de equipo, estadísticas de asistencia (ATT-05 → Fase 4), módulo de tutoras, panel admin completo más allá de ADM-01.

</domain>

<decisions>
## Implementation Decisions

### Navegación y shell

- **D-01:** Bottom navigation bar con 5 tabs: **Jugadores / Lista / Fixture / Admin / Estadística**
- **D-02:** En Fase 1, los tabs Fixture, Admin y Estadística se muestran pero están deshabilitados o como placeholders (sin funcionalidad real). Esto define la estructura de navegación completa de la app desde el inicio.
- **D-03:** Selector de división en el **header** (dropdown o chip persistente). Visible cuando el coach tiene más de una división asignada. La elección persiste en la sesión (localStorage o context global). El contenido de cada tab cambia según la división activa.

### Grilla de asistencia

- **D-04:** Marcar presencia con **tap en la card/fila del jugador** (tap = toggle presente/ausente, highlight verde). Sin botones separados. Zona de tap amplia para uso en cancha.
- **D-05:** Nueva sesión de entrenamiento se inicia con un **formulario**: el coach elige fecha y tipo de sesión (martes / jueves), luego ve la grilla de jugadores para marcar presencia.

### Foto de jugador

- **D-06:** Fotos almacenadas en **Supabase Storage** (mismo bucket/configuración que infantiles si ya existe).
- **D-07:** **Avatar circular pequeño** en la lista de jugadores + foto más grande en la ficha individual del jugador.

### Alcance offline (ATT-04)

- **D-08:** Offline scope = **tomar lista + ver lista de jugadores** (read-only). Implementado con IndexedDB via `idb` (misma librería que infantiles).
- **D-09:** Crear, editar o eliminar jugadores **requiere conexión**. El CRUD de jugadores no se encola offline — es una operación infrecuente que puede esperar.
- **D-10:** Las sesiones de asistencia creadas offline se sincronizan automáticamente al recuperar la conexión (cola con IDB, mismo patrón que infantiles).

### Claude's Discretion

- Diseño visual de los tabs deshabilitados (grayed out, lock icon, tooltip) — el planificador elige el approach más limpio.
- Estructura interna del selector de división (componente, estado global, qué pasa si el coach tiene una sola división asignada — el selector no se muestra).
- Configuración específica del bucket de Supabase Storage para fotos.
- Resize/compresión de fotos antes de subir (recomendado para mobile — el agente decide el approach).
- Número aproximado de jugadores por división es desconocido — el agente planifica para ~30-40 jugadores por división como estimación razonable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project fundamentals
- `.planning/PROJECT.md` — Visión, constraints, decisiones clave y contexto del proyecto
- `.planning/REQUIREMENTS.md` — Requirements PLY-01..07, ATT-01..04, ADM-01 con sus criterios exactos
- `.planning/ROADMAP.md` — Success criteria de Fase 1 (6 criterios verificables)

### Stack reference
- `CLAUDE.md` §Technology Stack — Stack completo con versiones pinned, dependencias evaluadas, y decisiones de librería (exceljs, @dnd-kit, next-pwa@5.6.0)

### Supabase / infantiles context
- No hay código de infantiles en este repo. El agente de investigación deberá consultar la documentación de `@supabase/ssr@0.10.2` y `@supabase/supabase-js@^2.102.1` directamente.

No external specs beyond the above — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Estado del proyecto
El proyecto es un scaffold de Next.js 14 bare-minimum. Solo existe:
- `src/app/layout.tsx` — layout raíz vacío
- `src/app/page.tsx` — página home placeholder
- `src/app/globals.css` — Tailwind globals

### Dependencias instaladas actualmente
Solo React, Next.js 14, TypeScript, Tailwind, PostCSS, ESLint. **Ninguna de las dependencias de la app está instalada aún:**
- `@supabase/ssr` — NO instalado
- `@supabase/supabase-js` — NO instalado
- `next-pwa` — NO instalado
- `idb` — NO instalado

### Reusable Assets
- Ninguno todavía. El investigador y planificador deben partir del scaffold en blanco.

### Established Patterns
- Ninguno establecido. Seguir patrones de la app de infantiles (mismo stack) como referencia conceptual, no como código a copiar.

### Integration Points
- Supabase compartido: las divisiones M15-M19 ya existen en la tabla `divisions` de producción. Las migraciones de Fase 1 deben ser **additive-only** (nuevas tablas, sin modificar tablas existentes de infantiles).
- Auth compartida: mismas cuentas Supabase. Coaches y tutoras de infantiles pueden usar la misma cuenta.

</code_context>

<specifics>
## Specific Ideas

- El coach usa la app parado en la cancha durante el entrenamiento → UI táctil, zonas de tap grandes, mínima fricción para tomar lista
- Los entrenamientos son martes y jueves (diferente a infantiles que es miércoles). El formulario de nueva sesión debe reflejar esto.
- M15, M16, M17, M19 — hay 4 divisiones. Un coach puede estar asignado a más de una.
- La ficha de jugador (PLY-05) incluye: foto, stats de asistencia, contacto, posiciones, bitácora. Solo las stats de asistencia quedan para Fase 4 — el resto va en Fase 1.

</specifics>

<deferred>
## Deferred Ideas

- **Estadísticas de asistencia por jugador** (ATT-05) → Fase 4 (ya en roadmap)
- **Panel admin completo** (ADM-02, ADM-03, fixture) → Fase 2
- **Detección automática de día de entrenamiento** (la app abre directamente en "tomar lista" si es martes/jueves) → idea interesante pero es scope adicional; el coach puede hacer el tap fácilmente
- **Export de planilla** → v2 (ya en roadmap)

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-players-attendance*
*Context gathered: 2026-05-26*
