# Phase 2: Fixture Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 02-fixture-management
**Areas discussed:** Diseño del fixture, Import de URBA, Registro de resultado y detalle, Vista admin multi-división

---

## Diseño del fixture

| Option | Description | Selected |
|--------|-------------|----------|
| Cards apilados por fecha | Un card por partido, próximos primero, jugados al final. Reutiliza Card shadcn. | ✓ |
| Lista compacta tipo agenda | Filas densas, más partidos en pantalla | |
| Agrupado por jornada (fecha_nro) | Secciones por fecha URBA | |

**User's choice:** Cards apilados por fecha
**Notes:** Próximos primero, jugados al final.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fecha + rival + L/V + hora + resultado | Badge coloreado: verde/rojo/gris | ✓ |
| También sede/dirección del club rival | Más info pero más espacio | |
| Solo básico: rival + fecha + resultado | Vista minimalista | |

**User's choice:** Fecha + rival + L/V + hora + resultado con badge coloreado

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ignorar campo 'equipo' | Todos los partidos M17 juntos | |
| Mostrar como chip/badge en el card | Badge pequeño 'A' o 'B' en M17 | ✓ |
| Filtro por subequipo | Coach M17-A ve solo sus partidos | |

**User's choice:** Chip/badge en el card
**Notes:** No se implementa filtrado — solo visualización.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Botón '+' flotante o header del tab | Visible para coach y admin | ✓ |
| Solo desde panel admin | Coaches solo ven | |

**User's choice:** Botón '+' en header del tab o FAB

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pantalla de detalle del partido | Navegar a nueva pantalla (patrón jugadores) | ✓ |
| Expande el card inline | Más liviano pero menos espacio | |

**User's choice:** Pantalla de detalle del partido

---

## Import de URBA

| Option | Description | Selected |
|--------|-------------|----------|
| Import desde Excel (.xlsx) | ExcelJS, como FIX-01 original | |
| Import desde CSV | Formato ya conocido, sin ExcelJS | ✓ |
| Ambos formatos | File picker acepta .xlsx y .csv | |

**User's choice:** CSV
**Notes:** El CSV ya fue extraído del PDF de URBA (fixture-virreyes-2026.csv, 60 partidos). Simplifica la implementación eliminando la dependencia de ExcelJS para esta fase.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Upload → preview → confirmar | Tabla preview antes del insert | ✓ |
| Diff vs fixture existente | Muestra nuevos/modificados/existentes | |
| Upload directo sin preview | No cumple FIX-02 | |

**User's choice:** Upload → tabla preview → botón Confirmar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reemplazar todo (truncate + insert) | Simple, reimporta el fixture completo | ✓ |
| Upsert por partido | Actualiza existentes, inserta nuevos | |
| Bloquear si ya existen partidos | Admin borra manualmente antes | |

**User's choice:** Truncate + insert
**Notes:** Los partidos con flag `manual: true` se preservan.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Solo admin (ADM-03) | Import exclusivo de admin | ✓ |
| Cualquier usuario autenticado | Sin restricción de rol | |

**User's choice:** Solo admin

---

## Registro de resultado y detalle

| Option | Description | Selected |
|--------|-------------|----------|
| En la pantalla de detalle, sección expandible | Todo en un lugar | ✓ |
| Dialog modal desde el card | No requiere navegar | |

**User's choice:** Pantalla de detalle con sección expandible
**Notes:** User clarificó que además del marcador numérico, se pueden cargar: tries, conversiones, tarjetas, y también **penales y drop goals** (todos con selector de jugador, todo opcional).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Puntos totales + tries + conversiones + tarjetas (todo opcional) | | |
| Solo tries + tarjetas | Como FIX-06 original | |
| Todos los eventos de rugby (incluyendo penales y drop goals) | | ✓ |

**User's choice:** Modelo completo de rugby: puntos totales + tries + conversiones + penales + drop goals + tarjetas
**Notes:** Todo opcional. El coach puede guardar solo el marcador (propios/rival) sin completar el detalle.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Solo jugador (selector de nómina) | Sin minuto | ✓ |
| Jugador + minuto del try | Más detalle | |
| Solo conteo total de tries | Sin nombres | |

**User's choice:** Solo jugador (selector de nómina de la división)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Jugador + tipo (amarilla/roja) | | ✓ |
| Jugador + tipo + minuto | | |
| Solo conteo de tarjetas | | |

**User's choice:** Jugador + tipo de tarjeta

---

## Vista admin multi-división

| Option | Description | Selected |
|--------|-------------|----------|
| Mismo fixture tab con opción "Todas" en DivisionSelector | Reutiliza componentes existentes | ✓ |
| Pantalla admin dedicada en /admin/fixture | Pantalla separada | |
| Tabs por división dentro del fixture tab | Tabs horizontales M15/M16/M17/M19/Todas | |

**User's choice:** Mismo fixture tab, DivisionSelector agrega "Todas las divisiones" para admin
**Notes:** Con "Todas" seleccionado, cards agrupados por sección de división.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Admin edita cualquier partido de cualquier división | Acceso total | ✓ |
| Admin solo ve, coaches editan su propia división | Solo lectura para admin | |

**User's choice:** Admin edita cualquier partido sin restricción

---

| Option | Description | Selected |
|--------|-------------|----------|
| El mismo form para admin y coach (campo división editable/readonly según rol) | | ✓ |
| Dos formularios separados | | |

**User's choice:** Un solo formulario reutilizado

---

## Claude's Discretion

- Schema de la DB para `matches` y `match_scoring_events`
- Paginación o scroll infinito para fixtures largos
- Manejo de errores en el parseo del CSV (por fila vs global)
- Empty state del fixture tab
- Distinción visual partido jugado sin resultado vs con resultado
- Animación de la sección expandible de detalle

## Deferred Ideas

- Excel import (ExcelJS, v2 si el club lo necesita)
- Diff al reimportar (mostrar qué cambió)
- Filtro por subequipo M17
- Geocoding de sedes (link a Google Maps en partidos de visitante)
- Minutos en scoring events (v2)
