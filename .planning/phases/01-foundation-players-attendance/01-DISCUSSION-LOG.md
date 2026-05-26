# Phase 1: Foundation, Players & Attendance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 01-foundation-players-attendance
**Areas discussed:** Navegación y shell, Grilla de asistencia, Foto de jugador, Alcance offline

---

## Navegación y shell

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom navigation bar | Tabs fijas en la parte inferior. Estándar en apps móviles PWA. | ✓ |
| Header con menú lateral (drawer) | Hamburguesa arriba a la izquierda. Menos ergonómico en móvil. | |
| Dashboard home con cards | Pantalla home con accesos directos. Sin nav persistente. | |

**User's choice:** Bottom navigation bar

---

| Option | Description | Selected |
|--------|-------------|----------|
| 3 tabs: Jugadores / Lista / Fixture | Placeholder para Fixture en Fase 1. | |
| 4 tabs: Jugadores / Lista / Fixture / Admin | Admin siempre visible. | |
| 2 tabs por ahora | Mínimo viable para Fase 1. | |
| **Freeform (5 tabs)** | Jugadores / Lista / Fixture / Admin / Estadística. Equipo builder dentro del fixture. | ✓ |

**User's choice:** 5 tabs — Jugadores / Lista / Fixture / Admin / Estadística
**Notes:** El usuario quiere la estructura completa de navegación desde el inicio, con las secciones aún no implementadas deshabilitadas. Mencionó que la estadística de jugadores podría accederse desde su propio tab.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Selector de división en el header | Dropdown/chip en la parte superior. La elección persiste en la sesión. | ✓ |
| Pantalla de selección al entrar a cada sección | Más clicks pero más explícito. | |
| Context global en localStorage | Sin selector explícito — se cambia desde perfil/settings. | |

**User's choice:** Selector de división en el header

---

## Grilla de asistencia

| Option | Description | Selected |
|--------|-------------|----------|
| Tap en la foto/nombre del jugador | Toggle presente/ausente con tap en la card. Zona de tap amplia. | ✓ |
| Toggle/checkbox a la derecha | Lista clásica. Zona de tap más chica. | |
| Dos listas con drag-and-drop | Visual pero complejo parado en la cancha. | |

**User's choice:** Tap en la foto/nombre del jugador

---

| Option | Description | Selected |
|--------|-------------|----------|
| Botón "Tomar lista hoy" automático | App detecta fecha, crea sesión al tocar el botón. | |
| Formulario: fecha + tipo (martes/jueves) | Coach confirma fecha y tipo antes de ver la grilla. | ✓ |
| Tab Lista muestra siempre la sesión del día activa | Si es día de entrenamiento, la sesión ya existe al entrar. | |

**User's choice:** Formulario: fecha + tipo (martes/jueves) y luego la grilla

---

## Foto de jugador

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Storage | Mismo storage que infantiles. URL pública para listas. | ✓ |
| Externo (Cloudinary, S3) | Más control sobre transformaciones, agrega dependencia. | |
| Base64 en la base de datos | Simple pero escala pésimo. | |

**User's choice:** Supabase Storage

---

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar pequeño en la lista + foto grande en la ficha | Thumbnail circular en lista, foto grande en perfil. | ✓ |
| Solo en la ficha individual | Lista solo texto/nombre. | |
| Claude decide | El agente elige el patrón. | |

**User's choice:** Avatar pequeño en la lista + foto grande en la ficha

---

## Alcance offline (ATT-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Tomar lista + ver lista de jugadores | Offline = asistencia + player list read-only. IDB. | ✓ |
| Solo tomar lista (mínima) | Player list requiere conexión. Más simple. | |
| Todo offline (jugadores + lista + ficha completa) | Cache agresivo. Más complejo y storage. | |

**User's choice:** Tomar lista + ver lista de jugadores

---

| Option | Description | Selected |
|--------|-------------|----------|
| No se puede crear jugadores offline | CRUD requiere conexión. Simplifica la lógica offline. | ✓ |
| Se encola y sincroniza al volver | Mismo patrón que asistencia pero para jugadores. | |
| Claude decide | El agente elige el enfoque más pragmático. | |

**User's choice:** No se puede crear jugadores offline — solo lectura + asistencia

---

## Claude's Discretion

- Diseño visual de tabs deshabilitados (grayed out, lock icon, tooltip)
- Estructura interna del selector de división y comportamiento con una sola división
- Configuración del bucket de Supabase Storage para fotos
- Resize/compresión de fotos antes de subir

## Deferred Ideas

- Detección automática de día de entrenamiento (abrir directamente en "tomar lista" si es martes/jueves) — interesante pero scope adicional
