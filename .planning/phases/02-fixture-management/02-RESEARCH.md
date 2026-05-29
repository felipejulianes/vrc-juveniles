# Phase 2: Fixture Management - Research

**Investigado:** 2026-05-29
**Dominio:** Calendario de partidos rugby, CSV parsing, scoring model, Supabase RLS, Next.js App Router
**Confianza general:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Cards apilados por fecha — próximos partidos primero, jugados al final. Usar `Card` de shadcn ya instalado.
- **D-02:** Cada card muestra: fecha, rival, local/visitante, hora, y resultado con badge coloreado (verde = ganado, rojo = perdido, gris = pendiente/sin resultado).
- **D-03:** Para M17 (y cualquier división con subequipos), mostrar chip/badge con letra del subequipo ("A"). No se filtra por subequipo en esta fase.
- **D-04:** Botón '+' para agregar partido — visible en el header o como FAB, accesible para coach y admin (FIX-03).
- **D-05:** Al tocar un card de partido se navega a pantalla de detalle (patrón lista → detalle, igual que jugadores).
- **D-06:** Pantalla de detalle: información del partido + sección de resultado + sección expandible "Detalles del resultado" con scoring events.
- **D-07:** El resultado se carga en la pantalla de detalle, no en dialog modal. Dos campos numéricos: puntos propios / puntos rival.
- **D-08:** Modelo de scoring rugby completo, todo opcional: tries, conversiones, penales, drop goals, tarjetas (jugador + tipo). Coach puede guardar solo el marcador numérico.
- **D-09:** Selectores de jugadores usan la nómina de la división del partido. Solo se registra el jugador (no el minuto).
- **D-10:** El import es desde CSV (no Excel). Columnas: `division`, `fecha_nro`, `fecha`, `equipo`, `local_visitante`, `rival`, `hora`.
- **D-11:** Flujo import: upload CSV → tabla preview → botón "Confirmar import" → insert en DB. Errores de parseo se muestran antes de confirmar.
- **D-12:** Al reimportar: truncate + insert de partidos URBA. Los partidos con flag `manual: true` se preservan.
- **D-13:** Import exclusivo de admin (ADM-03). Pantalla de import solo visible para admin.
- **D-14:** Admin accede a todas las divisiones con opción "Todas las divisiones" en DivisionSelector (solo visible para admin).
- **D-15:** Con "Todas las divisiones" seleccionado, cards agrupados por división (sección header por M15, M16, M17, M19).
- **D-16:** Admin puede editar/eliminar cualquier partido de cualquier división.
- **D-17:** Un solo formulario de partido reutilizado para admin y coach. Campo "división" editable para admin, solo lectura para coach.

### Claude's Discretion
- Estructura de la DB: schema de la tabla `matches` (o `fixture_matches`) y la tabla de scoring events.
- Paginación o scroll infinito para fixtures largos.
- Comportamiento de la preview del CSV si hay filas malformadas (mostrar error por fila o error global).
- Estado empty del fixture tab cuando no hay partidos importados aún.
- Cómo se distingue visualmente un partido "jugado con resultado" de uno "jugado sin resultado cargado".
- Animación/transition en la sección expandible del detalle.

### Deferred Ideas (OUT OF SCOPE)
- Excel import (deferred a v2 si se necesita subir .xlsx original de URBA)
- Diff al reimportar (mostrar qué cambió vs fixture anterior)
- Filtro por subequipo M17
- Geocoding de sedes (opponent_clubs ya tiene venues; integración deferred)
- Minutos en scoring events
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIX-01 | Admin puede importar el fixture oficial URBA desde un archivo (CSV en esta fase) | CSV parsing server-side vía API route; flujo upload → preview → confirm |
| FIX-02 | El import muestra previsualización de los partidos antes de confirmar | Estado de UI en Client Component con datos parseados en preview antes de POST de confirmación |
| FIX-03 | Admin o coach puede agregar/editar un partido manualmente (fecha, rival, local/visitante, sede, división) | Server Action `createMatch` / `updateMatch`; Dialog form con campos validados |
| FIX-04 | Coach puede ver el fixture de su división ordenado por fecha | Query server-side con filtro `division_id` + `order('match_date')` |
| FIX-05 | Coach puede cargar el resultado de un partido (goles propios y del rival) | Server Action `saveResult`; campos `score_home` / `score_away` en tabla `matches` |
| FIX-06 | Coach puede agregar anotadores de tries y tarjetas al resultado | Tabla `match_scoring_events`; Server Actions para CRUD de events por tipo |
| ADM-02 | Admin puede ver el fixture completo de todas las divisiones | DivisionSelector con opción "Todas las divisiones" (null division_id) → query sin filtro de división |
| ADM-03 | Admin puede importar el fixture URBA (acción exclusiva de admin) | Route `/admin/fixture-import` con guard de rol; `requireAdmin()` en Server Action |
</phase_requirements>

---

## Summary

Esta fase implementa el calendario completo de partidos de VRC Juveniles: vista de fixture por división, alta/edición manual de partidos, import desde CSV con preview y confirmación, registro de resultados con modelo de scoring rugby completo, y vista admin multi-división.

El stack ya está establecido desde la Fase 1. No se necesitan nuevas dependencias de runtime: el CSV se parsea con la API nativa de Node.js (no se usa una librería de parsing de CSV ya que el formato es simple y conocido). Supabase almacena todo con RLS. Los patrones de Server Actions, queries server-side y componentes UI están completamente establecidos y se replican.

La complejidad principal está en: (1) el schema de DB para `matches` y `match_scoring_events`, (2) la extensión de `DivisionContext` para soportar `null` (todas las divisiones), (3) el flujo de import CSV con estado de preview en el cliente, y (4) el modelo de scoring rugby con eventos opcionales.

**Recomendación principal:** Seguir exactamente el patrón establecido en Fase 1. No introducir nuevas dependencias. Usar API route para el parsing del CSV (mismo patrón que photo upload). Diseñar el schema de DB primero antes de crear los Server Actions.

---

## Project Constraints (from CLAUDE.md)

Directivas que el planner DEBE respetar:

| Directiva | Impacto en esta fase |
|-----------|---------------------|
| Stack: Next.js 14 App Router + TypeScript + Tailwind + Supabase | Sin desvíos. Todo código nuevo sigue este stack. |
| Sin branches/PRs — workflow directo en `main` | Commits directos a main. No crear branches para esta fase. |
| Aislamiento: no modificar DB de producción ni código de infantiles | Las nuevas tablas son `matches` y `match_scoring_events`. Ninguna tabla de infantiles se toca. |
| Supabase compartido: mismo proyecto que infantiles | RLS debe aislarse a divisiones juveniles (`is_juvenile = true`). |
| ExcelJS no necesario en esta fase (CSV en lugar de Excel) | No instalar `exceljs`. Usar parsing nativo de CSV. |
| `@dnd-kit` evaluado pero para Team Builder (Fase 3) | No instalar `@dnd-kit` en esta fase. |
| Deploy en Vercel (proyecto separado) | Sin cambios al deploy — Vercel ya está configurado. |
| GSD workflow enforcement | Todo trabajo debe iniciar via `/gsd-execute-phase`. |

---

## Standard Stack

### Core (inherited from Phase 1 — no install needed)
| Library | Version | Purpose | Fuente |
|---------|---------|---------|--------|
| `next` | 14.2.35 | App Router, Server Actions, API routes | [VERIFIED: package.json Fase 1] |
| `@supabase/ssr` | 0.10.2 (pinned) | Cliente Supabase server-side | [VERIFIED: package.json Fase 1] |
| `@supabase/supabase-js` | ^2.102.1 | Cliente Supabase client-side | [VERIFIED: package.json Fase 1] |
| `tailwindcss` | (project) | Estilos | [VERIFIED: codebase] |
| `shadcn/ui` | (components) | Card, Badge, Dialog, Form, Table, etc. | [VERIFIED: src/components/ui/] |
| `lucide-react` | (installed) | Iconos (ChevronRight, CalendarDays, Plus, etc.) | [VERIFIED: usado en Fase 1] |
| `zod` | (installed) | Validación de schemas | [VERIFIED: usado en jugadores/schema.ts] |

### Nuevos shadcn components a instalar
| Componente | Comando | Para qué |
|------------|---------|---------|
| `Table` | `npx shadcn@latest add table` | Preview de CSV import |
| `Textarea` | `npx shadcn@latest add textarea` | Notas en detalle del partido (si se agrega) |

[VERIFIED: 02-UI-SPEC.md § Registry Safety — solo shadcn oficial, sin third-party registries]

### CSV Parsing: Sin dependencia externa
El formato del CSV es completamente conocido y fijo (7 columnas, sin caracteres especiales complejos). Parsing nativo en Node.js:

```typescript
// [VERIFIED: fixture-virreyes-2026.csv — formato inspeccionado]
// Columnas: division,fecha_nro,fecha,equipo,local_visitante,rival,hora
// 61 filas (1 header + 60 partidos)
// Sin comillas, sin comas en valores, sin caracteres especiales
const lines = text.split('\n').filter(Boolean)
const [header, ...rows] = lines
const parsed = rows.map(line => {
  const [division, fecha_nro, fecha, equipo, local_visitante, rival, hora] = line.split(',')
  return { division, fecha_nro: parseInt(fecha_nro), fecha, equipo, local_visitante, rival, hora }
})
```

Si en el futuro el CSV tuviera comas dentro de valores, se podría agregar `papaparse` (mantenido activamente). Por ahora, no es necesario. [ASSUMED — riesgo bajo dado el CSV conocido]

**No instalar nada nuevo.** [VERIFIED: package.json analizado, todas las dependencias necesarias ya presentes]

---

## Architecture Patterns

### Estructura de directorios recomendada

```
src/
├── app/(app)/
│   ├── fixture/
│   │   ├── page.tsx                    # Lista del fixture (reemplaza PlaceholderScreen)
│   │   ├── loading.tsx                 # Skeleton cards
│   │   ├── actions.ts                  # Server Actions: createMatch, updateMatch, deleteMatch, saveResult
│   │   └── [matchId]/
│   │       ├── page.tsx                # Pantalla de detalle del partido
│   │       └── actions.ts             # Server Actions: saveScoringEvents
│   └── admin/
│       ├── page.tsx                    # (existente — no tocar)
│       └── fixture-import/
│           └── page.tsx               # Import CSV admin-only
├── app/api/
│   └── fixture/
│       └── import/
│           └── route.ts               # POST: recibe CSV, parsea, devuelve preview
├── lib/
│   ├── queries/
│   │   └── matches.ts                 # listByDivision, listAll, getById, getWithEvents
│   └── matches/
│       ├── schema.ts                  # MatchFormSchema, ScoringEventSchema (zod)
│       └── csv-parser.ts             # parseCSV(text: string): ParsedMatch[]
├── components/
│   └── fixture/
│       ├── MatchCard.tsx              # Card del fixture list
│       ├── ResultBadge.tsx            # Badge ganado/perdido/pendiente
│       ├── MatchForm.tsx              # Dialog form para agregar/editar partido
│       ├── MatchList.tsx              # Lista + FAB (client component)
│       ├── MatchDetail.tsx            # Detalle completo con result + scoring
│       ├── ScoringSection.tsx         # Sección expandible de eventos de scoring
│       └── CsvImportFlow.tsx          # Upload → Preview → Confirm (client component)
└── supabase/migrations/
    └── 20260529100000_matches.sql     # Tablas matches + match_scoring_events
```

### Pattern 1: Query server-side para el fixture
**Qué:** Server Component fetches matches con `createClient()` desde `@/lib/supabase/server`.
**Cuándo usar:** Página principal del fixture y detalle del partido.

```typescript
// src/lib/queries/matches.ts
// [VERIFIED: mismo patrón que src/lib/queries/players.ts]
import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function listByDivision(divisionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('division_id', divisionId)
    .order('match_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function listAllJuvenile() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*, divisions(name)')
    .order('match_date', { ascending: true })
  if (error) throw error
  return data ?? []
}
```

### Pattern 2: Server Action para crear/editar partido
**Qué:** `'use server'` actions en `fixture/actions.ts`. Revalidan `/fixture` y `/fixture/[matchId]`.
**Cuándo usar:** Crear, editar, eliminar partidos; guardar resultado.

```typescript
// src/app/(app)/fixture/actions.ts
// [VERIFIED: mismo patrón que jugadores/actions.ts]
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdminOrCoachForDivision(divisionId: string) {
  // mismo patrón que requireCoachForDivision en jugadores/actions.ts
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as any)?.role !== 'admin') throw new Error('Solo admin puede realizar esta acción')
  return user.id
}

export async function createMatch(input: MatchFormInput) {
  const parsed = MatchFormSchema.parse(input)
  await requireAdminOrCoachForDivision(parsed.division_id)
  const supabase = createClient()
  const { error } = await (supabase as any).from('matches').insert({ ...parsed, manual: true })
  if (error) throw new Error('No se pudo crear el partido: ' + error.message)
  revalidatePath('/fixture')
}
```

### Pattern 3: API Route para import CSV
**Qué:** `POST /api/fixture/import` recibe el archivo CSV como `multipart/form-data`, lo parsea en el servidor, y devuelve los partidos parseados + errores. La confirmación se hace en un segundo POST.
**Cuándo usar:** Import URBA (FIX-01, FIX-02, ADM-03).

```typescript
// src/app/api/fixture/import/route.ts
// [VERIFIED: mismo patrón que src/app/api/players/photo/route.ts]
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Step 1: Parse (devuelve preview, sin escribir a DB)
  // Step 2: Confirm (truncate + insert — triggerable con ?action=confirm)
}
```

**Alternativa considerada:** Server Action directa. Descartada porque el `File` object no se serializa bien en Server Actions de Next.js 14 con `multipart/form-data`. El patrón de API Route para uploads está establecido en el proyecto (ver `/api/players/photo/route.ts`). [VERIFIED: codebase]

### Pattern 4: DivisionContext extendido para "Todas las divisiones"
**Qué:** `DivisionContext` actualmente usa `Division | null` para `activeDivision`. El valor `null` ya existe pero significa "sin división" — hay que distinguir entre "null por carga inicial" y "null por selección explícita de admin".

**Solución recomendada:** Agregar una sentinela `ALL_DIVISIONS`:

```typescript
// [VERIFIED: src/context/DivisionContext.tsx — analizado]
const ALL_DIVISIONS_SENTINEL = { id: '__all__', name: 'Todas las divisiones' }

// En useDivision(), activeDivision.id === '__all__' → query sin filtro de división
// Solo se muestra en el Popover si userRole === 'admin'
```

Esto evita romper componentes existentes que dependen de `activeDivision.id` para filtrar queries. [ASSUMED — hay que verificar que ningún componente de Fase 1 explote con `id === '__all__'`]

### Pattern 5: Loading state con Skeleton
```typescript
// src/app/(app)/fixture/loading.tsx
// [VERIFIED: patrón Skeleton ya usado en Fase 1, src/components/ui/skeleton.tsx disponible]
export default function FixtureLoading() {
  return (
    <div className="px-4 pt-4 space-y-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-[72px] rounded-lg" />
      ))}
    </div>
  )
}
```

### Anti-Patterns a evitar
- **No importar papaparse u otra librería CSV:** El formato es conocido y fijo. Un `split('\n')` + `split(',')` es suficiente.
- **No hacer el import con Server Action recibiendo `File`:** Los `File` objects no se serializan en Server Actions de Next.js 14. Usar API Route (establecido en el proyecto).
- **No colocar la lógica de preview en el servidor:** El estado de preview (tabla de partidos parseados antes de confirmar) es estado de UI temporal — va en un Client Component con `useState`.
- **No escribir a DB en el primer POST de import:** El primer POST solo parsea y devuelve los datos. El segundo POST (confirmación) hace el truncate+insert.
- **No modificar tablas de infantiles:** Todas las nuevas tablas usan nombres distintos (`matches`, `match_scoring_events`) y tienen RLS propia.

---

## Database Schema (Claude's Discretion)

Esta es la recomendación de schema para las nuevas tablas. El planner debe incluir esto en la migration de Wave 0.

### Tabla `matches`

```sql
CREATE TABLE IF NOT EXISTS public.matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id   UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  match_date    DATE NOT NULL,
  match_time    TIME,
  fecha_nro     INTEGER,           -- Número de fecha URBA (1-11)
  rival         TEXT NOT NULL,
  home_away     TEXT NOT NULL CHECK (home_away IN ('local', 'visitante')),
  venue         TEXT,              -- sede (opcional)
  subequipo     TEXT,              -- 'A', 'B', null (para M17, M16 con subequipos)
  score_home    INTEGER,           -- puntos Virreyes (null = sin resultado)
  score_away    INTEGER,           -- puntos rival (null = sin resultado)
  manual        BOOLEAN NOT NULL DEFAULT FALSE, -- true = creado manualmente (no borrar en truncate)
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Notas de diseño:**
- `score_home` + `score_away` nullables: null = partido sin resultado cargado. Ambos deben ser null o ambos non-null (validar en Server Action).
- `manual = false` para partidos importados vía CSV; `manual = true` para partidos creados manualmente.
- `subequipo` para M17-A, M17-B, M16-A, M16-B — mapea directamente del campo `equipo` del CSV.
- No se guarda venue en el CSV actual (el CSV no tiene columna de sede). El campo `venue` es para entrada manual.
- `fecha_nro` permite ordenar por fecha URBA y mostrar "Fecha #N" en el card.

### Tabla `match_scoring_events`

```sql
CREATE TABLE IF NOT EXISTS public.match_scoring_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team        TEXT NOT NULL CHECK (team IN ('home', 'away')), -- Virreyes o rival
  event_type  TEXT NOT NULL CHECK (event_type IN ('try', 'conversion', 'penalty', 'drop', 'yellow_card', 'red_card')),
  player_id   UUID REFERENCES public.players(id) ON DELETE SET NULL, -- null si el jugador fue eliminado
  rival_scorer TEXT, -- nombre libre si team = 'away' (el rival no está en la nómina)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Notas de diseño:**
- `team = 'home'` → Virreyes; `team = 'away'` → rival.
- Para eventos del rival (`team = 'away'`), `player_id` es null y `rival_scorer` puede tener un nombre libre (o también null — todo es opcional per D-08).
- `player_id ON DELETE SET NULL` preserva el evento histórico si un jugador se borra de la nómina.
- No hay columna `minute` (deferred a v2 per deferred ideas).

### RLS Pattern

Seguir exactamente el patrón de `training_sessions`:
- **SELECT matches:** admin ve todo; coach ve solo las de sus divisiones.
- **INSERT/UPDATE matches:** admin cualquiera; coach solo las de sus divisiones.
- **DELETE matches:** admin cualquiera (D-16); coach no puede borrar.
- **SELECT/INSERT/UPDATE/DELETE scoring_events:** mismos permisos que el partido padre (via JOIN).

[VERIFIED: patrón RLS en 20260527000000_player_positions.sql y 20260528000000_training_sessions_attendance.sql — hay una función helper `get_user_role()` ya existente que se usa en las policies]

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|-------------|----------------|---------|
| Validación del formulario de partido | Lógica de validación custom | `zod` + `MatchFormSchema` | Ya establecido en el proyecto (ver `PlayerFormSchema`) |
| Auth/autorización en Server Actions | Checks manuales ad-hoc | `requireAdmin()` / `requireAdminOrCoachForDivision()` helpers — mismo patrón que jugadores/actions.ts | Consistencia y no olvidar checks |
| Notificaciones de éxito/error | `alert()` o estado propio | `sonner` toast (ya instalado) | Patrón establecido en Fase 1 |
| Revalidación de caché | `router.refresh()` en el cliente | `revalidatePath('/fixture')` en Server Action | Patrón establecido |
| Upload de archivos en Server Action | FormData en Server Action | API Route `POST /api/fixture/import` | `File` no se serializa en Server Actions de Next.js 14 |
| CSV parsing complejo | Librería de parsing (papaparse) | `split('\n')` + `split(',')` nativo | El formato del CSV es fijo y simple |
| Cálculo del resultado (ganado/perdido) | Lógica dispersa | Función utilitaria `getMatchResult(score_home, score_away)` | Usada en MatchCard y ResultBadge, debe ser consistente |

---

## Common Pitfalls

### Pitfall 1: DivisionContext con null vs. "Todas las divisiones"
**Qué falla:** Si se usa `activeDivision === null` como sentinela para "todas las divisiones", los componentes de Fase 1 que asumen que null significa "cargando" o "sin división" van a romper.
**Por qué ocurre:** `DivisionContext` actualmente usa `Division | null` y el estado inicial puede ser null mientras carga.
**Cómo evitar:** Usar el sentinel `{ id: '__all__', name: 'Todas las divisiones' }`. Verificar que `PlayerListClient` y otros componentes de Fase 1 no dependan de `activeDivision?.id` sin guard.
**Señales de alerta:** El tab de jugadores muestra la lista de todas las divisiones mezclada cuando el admin selecciona "Todas las divisiones" en el fixture.

### Pitfall 2: Score_home y score_away inconsistentes
**Qué falla:** Guardar solo uno de los dos valores (ej. score_home sin score_away) deja el resultado en estado inválido.
**Por qué ocurre:** Los campos son independientes en el form.
**Cómo evitar:** Validar en el Server Action que ambos sean null o ambos non-null. `MatchResultSchema` con `.refine()` de zod.
**Señales de alerta:** Un partido que muestra "Virreyes 24 - null" en el badge.

### Pitfall 3: Truncate borra partidos manuales
**Qué falla:** El import URBA hace `DELETE FROM matches WHERE division_id IN (...)` y borra partidos creados manualmente.
**Por qué ocurre:** El truncate no filtra por `manual = false`.
**Cómo evitar:** El DELETE de reimport SIEMPRE incluye `AND manual = false`. Verificar este filtro en el Server Action de confirmación de import.
**Señales de alerta:** Un coach que creó un partido amistoso manual lo pierde después de que el admin reimporta el fixture URBA.

### Pitfall 4: CSV con CRLF line endings en Windows
**Qué falla:** Las últimas columnas tienen `\r` al final si el CSV fue generado en Windows.
**Por qué ocurre:** `split('\n')` deja el `\r` en el último campo.
**Cómo evitar:** Normalizar antes del split: `text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')`.
**Señales de alerta:** El campo `hora` aparece como `"14:00\r"` en el preview.

### Pitfall 5: Scoring events huérfanos al borrar un partido
**Qué falla:** Si se elimina un partido, los `match_scoring_events` quedan huérfanos.
**Por qué ocurre:** FK sin CASCADE.
**Cómo evitar:** La FK de `match_scoring_events.match_id` ya tiene `ON DELETE CASCADE` en el schema recomendado. Verificar en la migration.
**Señales de alerta:** Errores de FK constraint al intentar borrar partidos.

### Pitfall 6: La opción "Todas las divisiones" visible para coaches
**Qué falla:** Coaches ven la opción y pueden filtrar el fixture de divisiones que no son las suyas.
**Por qué ocurre:** `DivisionSelector` recibe `divisions` del contexto sin saber el rol del usuario.
**Cómo evitar:** Pasar el rol del usuario al `DivisionSelector` o al `DivisionProvider`. El sentinel `__all__` solo se agrega a la lista si `userRole === 'admin'`. [VERIFIED: AppLayout.tsx ya tiene `userRole` disponible y se lo pasa a `BottomNav`]

### Pitfall 7: Match detail route sin autorización
**Qué falla:** Un coach de M15 accede a `/fixture/[matchId]` de un partido de M19.
**Por qué ocurre:** El Server Component del detalle no verifica que el partido pertenezca a una división del coach.
**Cómo evitar:** En `getById(matchId)` del query, incluir la verificación de división. Si el partido no pertenece a una división del usuario, devolver `notFound()`. Mismo patrón que jugadores.

---

## Code Examples

### Componente MatchCard completo

```typescript
// src/components/fixture/MatchCard.tsx
// [VERIFIED: patrón basado en SessionCard.tsx y PlayerCard.tsx existentes + 02-UI-SPEC.md]
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ResultBadge } from './ResultBadge'
import { formatMatchDate } from '@/lib/matches/utils'

type MatchCardProps = {
  id: string
  match_date: string
  rival: string
  home_away: 'local' | 'visitante'
  match_time: string | null
  fecha_nro: number | null
  subequipo: string | null
  score_home: number | null
  score_away: number | null
}

export function MatchCard({ id, match_date, rival, home_away, match_time, fecha_nro, subequipo, score_home, score_away }: MatchCardProps) {
  const result = getMatchResult(score_home, score_away, match_date)
  
  return (
    <Link href={`/fixture/${id}`} className="block focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] rounded-lg">
      <Card className="bg-card border-border hover:bg-accent transition-colors min-h-[72px]">
        <CardContent className="p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{formatMatchDate(match_date)}</span>
            <div className="flex items-center gap-1.5">
              {fecha_nro && <span className="text-sm text-muted-foreground">Fecha #{fecha_nro}</span>}
              {subequipo && (
                <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-1.5 py-0.5 rounded">
                  {subequipo}
                </span>
              )}
              <ResultBadge result={result} scoreHome={score_home} scoreAway={score_away} />
            </div>
          </div>
          <p className="text-base font-semibold leading-tight truncate">{rival}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{home_away === 'local' ? 'Local' : 'Visitante'}{match_time ? ` · ${match_time}` : ''}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

### CSV Parser

```typescript
// src/lib/matches/csv-parser.ts
// [VERIFIED: fixture-virreyes-2026.csv formato inspeccionado — 7 columnas fijas, sin quotes]

export type ParsedMatch = {
  division: string       // 'M15', 'M16', 'M17', 'M19'
  fecha_nro: number
  fecha: string          // 'YYYY-MM-DD'
  equipo: string | null  // 'A', 'B', o null
  local_visitante: string // 'Local' o 'Visitante'
  rival: string
  hora: string | null    // 'HH:MM' o null
}

export type CsvParseResult = {
  matches: ParsedMatch[]
  errors: { row: number; message: string }[]
}

const VALID_DIVISIONS = new Set(['M15', 'M16', 'M17', 'M19'])
const VALID_HOME_AWAY = new Set(['Local', 'Visitante'])

export function parseFixtureCSV(text: string): CsvParseResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter(l => l.trim().length > 0)
  
  if (lines.length < 2) {
    return { matches: [], errors: [{ row: 0, message: 'CSV vacío o sin datos' }] }
  }
  
  const [_header, ...rows] = lines
  const matches: ParsedMatch[] = []
  const errors: { row: number; message: string }[] = []

  rows.forEach((line, idx) => {
    const rowNum = idx + 2
    const cols = line.split(',')
    if (cols.length !== 7) {
      errors.push({ row: rowNum, message: `Se esperaban 7 columnas, se encontraron ${cols.length}` })
      return
    }
    const [division, fecha_nro_str, fecha, equipo, local_visitante, rival, hora] = cols.map(c => c.trim())
    
    if (!VALID_DIVISIONS.has(division)) {
      errors.push({ row: rowNum, message: `División inválida: "${division}"` })
      return
    }
    if (!VALID_HOME_AWAY.has(local_visitante)) {
      errors.push({ row: rowNum, message: `Local/Visitante inválido: "${local_visitante}"` })
      return
    }
    
    const fecha_nro = parseInt(fecha_nro_str)
    if (isNaN(fecha_nro)) {
      errors.push({ row: rowNum, message: `Fecha N° inválida: "${fecha_nro_str}"` })
      return
    }

    matches.push({
      division,
      fecha_nro,
      fecha,
      equipo: equipo || null,
      local_visitante,
      rival,
      hora: hora || null,
    })
  })

  return { matches, errors }
}
```

### Función getMatchResult

```typescript
// src/lib/matches/utils.ts
export type MatchResult = 'won' | 'lost' | 'draw' | 'pending'

export function getMatchResult(
  scoreHome: number | null,
  scoreAway: number | null,
  matchDate: string
): MatchResult {
  if (scoreHome === null || scoreAway === null) return 'pending'
  if (scoreHome > scoreAway) return 'won'
  if (scoreHome < scoreAway) return 'lost'
  return 'draw'
}

export function formatMatchDate(isoDate: string): string {
  // "Sáb 12/04" — Argentina locale
  const date = new Date(isoDate + 'T12:00:00') // noon UTC para evitar timezone shift
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}
```

---

## State of the Art

| Antes | Ahora (en este proyecto) | Impacto |
|-------|--------------------------|---------|
| Excel import (mencionado en ROADMAP original) | CSV import (D-10) | No se necesita ExcelJS. Parser nativo de 20 líneas. |
| Dialog modal para resultado | Página de detalle dedicada (D-07) | Más espacio para el form de resultado; patrón consistente con jugadores |
| Fixture como pantalla separada | Tab del bottom nav (`/fixture`) — ya existe el placeholder | El tab ya existe, solo se reemplaza `PlaceholderScreen` |

---

## Open Questions

1. **¿Hay una función SQL `get_user_role()` disponible en el Supabase compartido?**
   - Lo que sabemos: La migration `20260527000000_player_positions.sql` la referencia en políticas RLS (`public.get_user_role()`).
   - Lo que no está claro: Si esa función ya existía en el schema compartido con infantiles, o si fue creada en esa migration (no se ve el CREATE FUNCTION en ese archivo).
   - Recomendación: El planner debe incluir en Wave 0 una verificación de si `get_user_role()` existe. Si existe, usarla en las RLS de las nuevas tablas. Si no, replicar el patrón de join con `profiles` directamente (como en `training_sessions`).
   - [ASSUMED — necesita verificación antes de escribir la migration]

2. **¿Cómo pasa el rol del usuario al DivisionSelector para la opción "Todas las divisiones"?**
   - Lo que sabemos: `AppLayout.tsx` tiene `userRole` disponible. `DivisionProvider` actualmente no recibe `userRole`.
   - Lo que no está claro: ¿Se pasa `userRole` como prop adicional al `DivisionProvider`, o se agrega un contexto separado?
   - Recomendación: Extender `DivisionProvider` para recibir `userRole: 'admin' | 'coach' | 'tutora'` y exponerlo via `useDivision()`. Luego `DivisionSelector` agrega el sentinel solo si `userRole === 'admin'`. Cambio mínimo y backward-compatible.
   - [ASSUMED — diseño razonable pero hay que validar en ejecución]

3. **¿El import CSV aplica truncate a nivel de división o global?**
   - Lo que sabemos: D-12 dice "truncate + insert de los partidos de ese fixture". El CSV tiene todas las divisiones mezcladas.
   - Lo que no está claro: ¿El truncate elimina TODOS los partidos URBA (de todas las divisiones) y los reemplaza todos, o solo los de las divisiones presentes en el CSV?
   - Recomendación: Truncate global de `manual = false` (todas las divisiones), ya que el CSV siempre tiene las 4 divisiones completas. Si en el futuro se importan divisiones separadas, se puede agregar filtro. [ASSUMED — lógica razonable dado el CSV conocido]

---

## Environment Availability

Step 2.6: SKIPPED — Esta fase no agrega dependencias externas. Todas las herramientas ya verificadas en Fase 1 (Node.js, npm, Supabase CLI, Vercel). El CSV parsing es nativo.

---

## Validation Architecture

`nyquist_validation: false` en `.planning/config.json` — esta sección se omite.

---

## Security Domain

### ASVS Aplicable

| ASVS Category | Aplica | Control estándar |
|---------------|--------|-----------------|
| V2 Authentication | Sí | Supabase Auth — ya implementado en Fase 1 |
| V3 Session Management | No (gestionado por Supabase) | — |
| V4 Access Control | Sí | RLS de Supabase + `requireAdmin()` en Server Actions |
| V5 Input Validation | Sí | `zod` schemas para formulario de partido y scoring events |
| V6 Cryptography | No | — |

### Threat Patterns

| Pattern | STRIDE | Mitigación estándar |
|---------|--------|-------------------|
| Coach edita partido de otra división | Spoofing/Tampering | RLS `division_id` check + `requireAdminOrCoachForDivision()` en Server Action |
| Coach importa CSV (acción admin) | Elevation of Privilege | `requireAdmin()` en la API route de import |
| CSV malicioso con SQL injection | Tampering | Parameterized queries de Supabase JS (no hay SQL crudo) |
| Import CSV reemplaza partidos de otra organización | Tampering | El SELECT de divisiones en el import solo opera sobre divisiones `is_juvenile = true` |
| Match detail accesible cross-division | Information Disclosure | `notFound()` si el partido no pertenece a una división del coach |
| Scoring event con player_id de otra división | Tampering | Validar en Server Action que `player_id` pertenece a la división del partido antes de insertar |

---

## Assumptions Log

| # | Claim | Sección | Riesgo si está mal |
|---|-------|---------|-------------------|
| A1 | El CSV de URBA siempre tiene 7 columnas fijas y sin comas dentro de valores | CSV Parser | Si hay comas en nombres de rivales (ej. "G y E de Ituzaingo"), el parser fallaría — el CSV actual no tiene este problema pero futuros CSVs podrían |
| A2 | `get_user_role()` existe en el schema compartido con infantiles | Database Schema / RLS | Si no existe, las políticas RLS deben usar un JOIN con `profiles` en lugar de la función |
| A3 | Usar `{ id: '__all__', name: 'Todas las divisiones' }` como sentinel no rompe componentes de Fase 1 | DivisionContext extension | Si PlayerListClient o AttendanceGrid usan `activeDivision.id` como FK directo en queries sin guard, mostrarán datos incorrectos |
| A4 | El truncate en import aplica a TODAS las divisiones (no solo a las del CSV) | Import CSV | Si hay partidos URBA de una división no presente en el CSV, serán borrados — aceptable dado que el CSV actual tiene las 4 divisiones |
| A5 | `draw` (empate) es un resultado válido en rugby — debe aparecer en el badge | ResultBadge | Rugby tiene empates (aunque raros) — el badge debe manejarlo (mostrar en gris o con texto "Empate") |

---

## Sources

### Primary (HIGH confidence)
- `C:\dev\vrc-juveniles\fixture-virreyes-2026.csv` — CSV de referencia, formato exacto verificado
- `C:\dev\vrc-juveniles\src\app\(app)\jugadores\actions.ts` — Patrón de Server Actions con autenticación
- `C:\dev\vrc-juveniles\src\lib\queries\players.ts` — Patrón de queries server-side
- `C:\dev\vrc-juveniles\src\app\api\players\photo\route.ts` — Patrón API Route para upload de archivos
- `C:\dev\vrc-juveniles\src\context\DivisionContext.tsx` — DivisionContext actual completo
- `C:\dev\vrc-juveniles\src\app\(app)\layout.tsx` — AppLayout con `userRole` disponible
- `C:\dev\vrc-juveniles\supabase\migrations\` — 3 migrations analizadas para patrón RLS
- `C:\dev\vrc-juveniles\src\lib\supabase\database.types.ts` — Schema completo actual
- `.planning/phases/02-fixture-management/02-CONTEXT.md` — Decisiones bloqueadas D-01 a D-17
- `.planning/phases/02-fixture-management/02-UI-SPEC.md` — Contrato visual aprobado completo

### Secondary (MEDIUM confidence)
- `C:\dev\vrc-juveniles\src\app\(app)\admin\page.tsx` — Patrón de guard de rol admin
- `C:\dev\vrc-juveniles\src\components\layout\DivisionSelector.tsx` — Implementación actual del selector

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — todas las dependencias son herencias de Fase 1, verificadas en el codebase
- Database Schema: HIGH — diseñado a partir de los patrones de migrations existentes y los requisitos del CSV
- Architecture Patterns: HIGH — replicación de patrones establecidos y verificados en Fase 1
- CSV Parser: HIGH — formato del CSV inspeccionado directamente
- DivisionContext Extension: MEDIUM — diseño razonable pero tiene Assumptions (A3)
- RLS Policies: MEDIUM — una función SQL (`get_user_role()`) tiene Assumption (A2)

**Research date:** 2026-05-29
**Valid until:** 2026-06-29 (stack estable; si URBA cambia el formato del CSV, el parser necesita actualización)
