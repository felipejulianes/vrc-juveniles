# Phase 1: Foundation, Players & Attendance — Research

**Researched:** 2026-05-27
**Domain:** Next.js 14 App Router + Supabase SSR + PWA + offline attendance + player CRUD
**Confidence:** HIGH — codebase fully inspected, npm registry verified, prior project research files read

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Bottom navigation bar con 5 tabs: Jugadores / Lista / Fixture / Admin / Estadística

**D-02:** En Fase 1, los tabs Fixture, Admin y Estadística se muestran pero están deshabilitados o como placeholders (sin funcionalidad real). Esto define la estructura de navegación completa de la app desde el inicio.

**D-03:** Selector de división en el header (dropdown o chip persistente). Visible cuando el coach tiene más de una división asignada. La elección persiste en la sesión (localStorage o context global). El contenido de cada tab cambia según la división activa.

**D-04:** Marcar presencia con tap en la card/fila del jugador (tap = toggle presente/ausente, highlight verde). Sin botones separados. Zona de tap amplia para uso en cancha.

**D-05:** Nueva sesión de entrenamiento se inicia con un formulario: el coach elige fecha y tipo de sesión (martes / jueves), luego ve la grilla de jugadores para marcar presencia.

**D-06:** Fotos almacenadas en Supabase Storage (mismo bucket/configuración que infantiles si ya existe).

**D-07:** Avatar circular pequeño en la lista de jugadores + foto más grande en la ficha individual del jugador.

**D-08:** Offline scope = tomar lista + ver lista de jugadores (read-only). Implementado con IndexedDB via `idb` (misma librería que infantiles).

**D-09:** Crear, editar o eliminar jugadores requiere conexión. El CRUD de jugadores no se encola offline.

**D-10:** Las sesiones de asistencia creadas offline se sincronizan automáticamente al recuperar la conexión (cola con IDB, mismo patrón que infantiles).

### Claude's Discretion

- Diseño visual de los tabs deshabilitados (grayed out, lock icon, tooltip)
- Estructura interna del selector de división (componente, estado global, qué pasa si el coach tiene una sola división asignada — el selector no se muestra)
- Configuración específica del bucket de Supabase Storage para fotos
- Resize/compresión de fotos antes de subir (recomendado para mobile — el agente decide el approach)
- Número aproximado de jugadores por división es desconocido — planificar para ~30-40 jugadores por división como estimación razonable

### Deferred Ideas (OUT OF SCOPE)

- Estadísticas de asistencia por jugador (ATT-05) → Fase 4
- Panel admin completo (ADM-02, ADM-03, fixture) → Fase 2
- Detección automática de día de entrenamiento → scope adicional
- Export de planilla → v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLY-01 | Coach puede ver el listado de jugadores de su división con nombre, foto y puesto | Supabase RLS via `coach_has_division()` gates division data; `players` table exists and is shared; `player_positions` is a new table to create |
| PLY-02 | Coach puede crear un jugador con datos básicos (nombre, apellido, DNI, fecha de nacimiento, foto) | `players` table is shared and already division-scoped; photo upload pattern via canvas resize + Supabase Storage confirmed |
| PLY-03 | Coach puede editar los datos de un jugador | Same RLS patterns; Server Actions for mutations; requires connection (D-09) |
| PLY-04 | Coach puede registrar el puesto real y el puesto alternativo de un jugador (número 1-15) | New `player_positions` table with `position_primary`, `position_alt1` integer columns (1-15 constraint) |
| PLY-05 | Coach puede ver la ficha completa de un jugador (foto, contacto, posiciones, bitácora) | Stats deferred to Phase 4; `player_notes` table shared with infantiles |
| PLY-06 | Jugadores marcados como `inactivo` aparecer al final de la lista | `inactivo` column exists on shared `players` table; ORDER BY `inactivo ASC` in query |
| PLY-07 | Jugadores provenientes de M14 heredan historial automáticamente | No new code needed: they are the same `players` row; `player_notes` and `player_followups` travel automatically via FK |
| ATT-01 | Coach puede tomar lista seleccionando jugadores presentes | `training_sessions` + `attendance_records` shared tables; tap-toggle pattern via optimistic update |
| ATT-02 | Coach puede ver historial de sesiones de su división | Query `training_sessions WHERE division_id = active_division ORDER BY date DESC` |
| ATT-03 | Coach puede editar asistencia de una sesión ya guardada | Same upsert pattern as ATT-01; no architectural difference |
| ATT-04 | Asistencia funciona offline y se sincroniza al recuperar conexión | IDB queue (decided D-10); `idb` library confirmed in npm registry; online/offline events + sync loop |
| ADM-01 | Admin puede crear y gestionar cuentas de coach asignadas a divisiones juveniles | New `/admin` Server Action + Supabase Auth admin API; same pattern as infantiles `profiles` + `coach_divisions` insert |
</phase_requirements>

---

## Summary

Phase 1 is a foundation phase that builds the entire app skeleton: dependency installation, auth, database tables, PWA setup, and the two core features (players and attendance). The project is currently a bare Next.js 14 scaffold — none of the app dependencies are installed yet. The most important architectural constraint is the shared Supabase instance with the live infantiles app: every migration must be additive-only.

The tech decisions are effectively locked by CLAUDE.md and the prior research files (STACK.md, ARCHITECTURE.md, PITFALLS.md). This research does not re-evaluate those decisions; it focuses specifically on what the planner needs to create concrete tasks for Phase 1: which files to create, how auth/middleware should work, how the IDB offline queue connects to the attendance UI, what the migration SQL looks like, and where the photo upload canvas pattern lives.

The UI spec (01-UI-SPEC.md) is approved and fully constrains the visual layer. shadcn is already initialized with the `radix-nova` style. The planner should treat the UI spec as a frozen contract and plan implementation against it.

**Primary recommendation:** Structure Phase 1 into four waves — (1) dependencies + scaffold, (2) auth + DB migrations, (3) player CRUD with photo, (4) attendance + offline. Each wave is independently deployable.

---

## Standard Stack

### Core (Phase 1 install targets — none currently in node_modules)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `@supabase/ssr` | `0.10.2` (pin exactly) | SSR-safe Supabase client (Next.js middleware + Server Components) | [VERIFIED: npm registry — `npm view @supabase/ssr@0.10.2 version`] |
| `@supabase/supabase-js` | `^2.102.1` | Supabase JS client (peer dep of @supabase/ssr) | [VERIFIED: npm view — latest 2.106.2; pin at ^2.102.1 per CLAUDE.md] |
| `next-pwa` | `5.6.0` (pin exactly) | Service worker + offline caching | [VERIFIED: npm view next-pwa@5.6.0 version] |
| `idb` | `8.0.3` (pin exactly) | IndexedDB promise wrapper for offline queue | [VERIFIED: npm view idb@8.0.3 version] |
| `react-hook-form` | `^7.76.1` | Form state management (player form) | [VERIFIED: npm view — 7.76.1 current] |
| `zod` | `^4.4.3` | Schema validation (player form, session form) | [VERIFIED: npm view — 4.4.3 current] |
| `@hookform/resolvers` | `^3.x` | Connects zod to react-hook-form | [ASSUMED — standard companion to both; verify version at install time] |

### Already in package.json (shadcn init)

| Library | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | `^1.16.0` | Icons (UI spec mandates Lucide) |
| `radix-ui` | `^1.4.3` | Radix primitives (via shadcn radix-nova) |
| `class-variance-authority` | `^0.7.1` | CVA for variant components |
| `clsx` + `tailwind-merge` | installed | Utility classnames |
| `tw-animate-css` | installed | shadcn animation layer |

### shadcn Components to Add (from UI spec)

Run `npx shadcn add {name}` for each:

```
button card avatar badge input label select dialog popover separator skeleton sonner form
```

[VERIFIED: components.json confirms shadcn initialized with style: "radix-nova"; official shadcn registry — all listed components exist]

### Installation Command

```bash
npm install \
  @supabase/ssr@0.10.2 \
  "@supabase/supabase-js@^2.102.1" \
  next-pwa@5.6.0 \
  "idb@^8.0.3" \
  "react-hook-form@^7.76.1" \
  "zod@^4.4.3" \
  "@hookform/resolvers"
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx           # Login screen
│   ├── (app)/
│   │   ├── layout.tsx             # Auth guard + division context + bottom nav
│   │   ├── jugadores/
│   │   │   ├── page.tsx           # PLY-01: player list (Server Component)
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx       # PLY-02: add player form
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # PLY-05: player profile
│   │   │       └── editar/
│   │   │           └── page.tsx   # PLY-03/04: edit player form
│   │   ├── lista/
│   │   │   ├── page.tsx           # ATT-02: session history
│   │   │   ├── nueva/
│   │   │   │   └── page.tsx       # ATT-01/D-05: new session form
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx       # ATT-01: active attendance grid
│   │   │       └── editar/
│   │   │           └── page.tsx   # ATT-03: edit past session
│   │   ├── fixture/
│   │   │   └── page.tsx           # D-02: placeholder
│   │   ├── admin/
│   │   │   ├── page.tsx           # D-02: placeholder (Phase 1 only creates coach CRUD)
│   │   │   └── actions.ts         # ADM-01: Server Actions for coach management
│   │   └── estadistica/
│   │       └── page.tsx           # D-02: placeholder
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts       # Supabase OAuth callback
│   ├── layout.tsx                 # Root layout: Inter font, globals.css
│   └── globals.css                # Dark-first color tokens (per UI spec)
├── components/
│   ├── ui/                        # shadcn components (auto-generated)
│   ├── layout/
│   │   ├── BottomNav.tsx          # D-01: 5-tab nav bar
│   │   ├── DivisionSelector.tsx   # D-03: header chip
│   │   └── OfflineBanner.tsx      # ATT-04: offline indicator
│   ├── players/
│   │   ├── PlayerCard.tsx         # PLY-01: list item component
│   │   ├── PlayerForm.tsx         # PLY-02/03/04: shared form (Client Component)
│   │   └── AvatarUpload.tsx       # D-06/07: photo upload with canvas resize
│   └── attendance/
│       ├── SessionCard.tsx        # ATT-02: session history item
│       ├── AttendanceGrid.tsx     # ATT-01: player toggle grid (Client Component)
│       └── SessionForm.tsx        # D-05: new session form
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server Component client
│   │   └── admin.ts               # service_role client (ADM-01)
│   ├── queries/
│   │   ├── players.ts             # All player queries
│   │   └── attendance.ts          # All attendance queries
│   ├── offline/
│   │   ├── queue.ts               # IDB queue: enqueue / flush
│   │   └── sync.ts                # Online event listener + flush trigger
│   └── positions/
│       └── constants.ts           # RUGBY_POSITIONS array, position number→name
├── hooks/
│   ├── useDivision.ts             # D-03: active division context hook
│   └── useOnlineStatus.ts         # ATT-04: navigator.onLine + events
├── context/
│   └── DivisionContext.tsx        # React Context + localStorage persistence
├── middleware.ts                  # Auth redirect: no session → /login
└── types/
    └── supabase.ts                # Database type definitions
```

### Pattern 1: Supabase SSR Client Hierarchy

Three separate client constructors — one per execution context. Never use the wrong one.

```typescript
// src/lib/supabase/server.ts — for Server Components and Route Handlers
// Source: @supabase/ssr@0.10.2 docs pattern
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}  // Ignore in Server Components (read-only)
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/admin.ts — for Server Actions that bypass RLS
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

[VERIFIED: @supabase/ssr@0.10.2 npm — this is the pinned version from CLAUDE.md]

### Pattern 2: Middleware Auth Guard

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

[ASSUMED — based on @supabase/ssr documentation pattern; verify exact cookie handling against 0.10.2 release notes at install time]

### Pattern 3: App Layout Auth + Division Guard (ADM-01 / pending activation)

The `(app)/layout.tsx` is the second auth layer. After middleware confirms a session exists, this layout checks whether the authenticated user has any divisions assigned.

```typescript
// src/app/(app)/layout.tsx — Server Component
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check profile + divisions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: divisions } = await supabase
    .from('coach_divisions')
    .select('division_id, divisions(id, name, is_juvenile)')
    .eq('coach_id', user.id)

  const juvenileDivisions = divisions?.filter(d => d.divisions?.is_juvenile) ?? []

  if (juvenileDivisions.length === 0 && profile?.role !== 'admin') {
    // Show "pending activation" screen — do not redirect, render inline
    return <PendingActivationScreen />
  }

  return (
    <DivisionProvider initialDivisions={juvenileDivisions}>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </DivisionProvider>
  )
}
```

[ASSUMED — structural pattern consistent with ARCHITECTURE.md and infantiles precedent; exact query field names must be confirmed against live Supabase schema]

### Pattern 4: IDB Offline Queue for Attendance

The offline queue stores attendance toggle operations when `navigator.onLine === false`. On reconnect, the queue is flushed to Supabase.

```typescript
// src/lib/offline/queue.ts
import { openDB } from 'idb'

const DB_NAME = 'vrc-juveniles-offline'
const STORE = 'attendance-queue'

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    },
  })
}

export type AttendanceQueueItem = {
  session_id: string
  player_id: string
  present: boolean
  timestamp: number
}

export async function enqueueAttendance(item: AttendanceQueueItem) {
  const db = await getDB()
  await db.add(STORE, item)
}

export async function flushQueue(supabase: ReturnType<typeof createBrowserClient>) {
  const db = await getDB()
  const items = await db.getAll(STORE)
  if (items.length === 0) return { flushed: 0, errors: 0 }

  let flushed = 0
  let errors = 0
  for (const item of items) {
    const { error } = await supabase
      .from('attendance_records')
      .upsert({
        session_id: item.session_id,
        player_id: item.player_id,
        present: item.present,
      }, { onConflict: 'session_id,player_id' })

    if (error) { errors++; continue }
    await db.delete(STORE, item.id)
    flushed++
  }
  return { flushed, errors }
}
```

```typescript
// src/lib/offline/sync.ts — sets up the online listener
import { flushQueue } from './queue'
import { createClient } from '@/lib/supabase/client'

export function initSyncListener(
  onSuccess: () => void,
  onError: () => void
) {
  const handler = async () => {
    const supabase = createClient()
    const { errors } = await flushQueue(supabase)
    if (errors === 0) onSuccess()
    else onError()
  }
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
```

[ASSUMED — based on `idb@8.0.3` API and infantiles offline queue precedent; exact field names (`session_id`, `player_id`) must match the `attendance_records` schema confirmed in ARCHITECTURE.md]

### Pattern 5: Photo Upload with Canvas Resize (no library)

Per D-06, D-07, and UI-SPEC: client-side resize before upload. Max 800×800px, JPEG quality 0.85, using `canvas.toBlob()`.

```typescript
// src/components/players/AvatarUpload.tsx  — key resize logic
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = url
  })
}

async function uploadPhoto(playerId: string, file: File): Promise<string> {
  const blob = await resizeImage(file)
  const supabase = createClient()
  const path = `player-photos/${playerId}.jpg`
  const { error } = await supabase.storage
    .from('player-photos')        // confirm exact bucket name against infantiles
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage
    .from('player-photos')
    .getPublicUrl(path)
  return publicUrl
}
```

[ASSUMED — canvas API is standard Web API; bucket name `player-photos` must be confirmed against the live infantiles Supabase Storage before use]

### Pattern 6: Division Context (D-03)

```typescript
// src/context/DivisionContext.tsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'vrc_active_division'

type Division = { id: string; name: string }
type DivisionContextType = {
  activeDivision: Division | null
  setActiveDivision: (d: Division) => void
  divisions: Division[]
}

const DivisionContext = createContext<DivisionContextType | null>(null)

export function DivisionProvider({ children, initialDivisions }: {
  children: React.ReactNode
  initialDivisions: Division[]
}) {
  const [activeDivision, setActiveDivisionState] = useState<Division | null>(() => {
    if (typeof window === 'undefined') return initialDivisions[0] ?? null
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Division
      const valid = initialDivisions.find(d => d.id === parsed.id)
      return valid ?? initialDivisions[0] ?? null
    }
    return initialDivisions[0] ?? null
  })

  function setActiveDivision(d: Division) {
    setActiveDivisionState(d)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
  }

  return (
    <DivisionContext.Provider value={{ activeDivision, setActiveDivision, divisions: initialDivisions }}>
      {children}
    </DivisionContext.Provider>
  )
}

export function useDivision() {
  const ctx = useContext(DivisionContext)
  if (!ctx) throw new Error('useDivision must be used within DivisionProvider')
  return ctx
}
```

[ASSUMED — standard React Context + localStorage pattern; no library risk]

### Anti-Patterns to Avoid

- **Using `createClient()` from `@supabase/ssr` in a Client Component**: import from `client.ts` only; server client uses `cookies()` from `next/headers` which is not available client-side.
- **Calling Server Actions from within `useEffect`**: use Server Actions only from forms or event handlers that are user-initiated; for read operations in Client Components, use the browser client.
- **Storing the entire player list in the offline IDB cache for edit**: D-09 says CRUD requires connection. Only the read cache (for attendance grid) and the pending write queue go into IDB.
- **Using `process.env.SUPABASE_SERVICE_ROLE_KEY` in a Client Component**: service role key must never be on the browser. Admin client is server-only.
- **Not checking `is_juvenile` when loading divisions**: a coach could have both infantiles and juvenile divisions. Filter by `is_juvenile = TRUE` in the division selector to avoid showing M8 in the juveniles app.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + validation | Custom useState per field | `react-hook-form` + `zod` | Uncontrolled inputs, validation timing, async submit handling — hand-rolled forms break in subtle ways |
| IndexedDB access | Direct `indexedDB.open()` API | `idb@8.0.3` | Native IDB API is callback-based and verbose; `idb` adds type-safe promise wrappers; already decided in CLAUDE.md |
| Toast notifications | Custom toast component | `sonner` (via shadcn) | Stacking, animation, accessibility — already listed in UI spec component inventory |
| Supabase cookie management | Custom cookie sync | `@supabase/ssr` `createServerClient` | SSR cookie handling with Next.js App Router is non-trivial; the SSR package handles the Next.js-specific cookie adapter |
| Image resize | Browser FileReader + manual scaling | `canvas.toBlob()` pattern (per UI spec) | No library needed — canvas is sufficient; do NOT add `browser-image-compression` or similar (adds ~50KB to bundle) |
| Auth state management | Custom JWT parsing | Supabase `auth.getUser()` in middleware | Avoid `auth.getSession()` — Supabase recommends `getUser()` as it re-validates against the server |

**Key insight:** This stack is mature enough that every common problem has a standard solution. The risk in Phase 1 is under-using the established patterns (auth middleware, RLS, react-hook-form), not over-engineering.

---

## Supabase Migration Strategy

### How Migrations Work in This Project

The Supabase CLI is installed (`supabase 2.101.0` confirmed). However, the project has no `supabase/` directory yet. There are two valid workflows:

**Workflow A: Supabase CLI local dev + `supabase db push`** (recommended for new tables)

```bash
# Initialize (once)
supabase init                         # creates supabase/ directory
supabase link --project-ref <ref>     # link to the shared project

# Create a migration file
supabase migration new player_positions
# Edit the file at supabase/migrations/<timestamp>_player_positions.sql
# Then push to remote
supabase db push
```

Requires: `SUPABASE_ACCESS_TOKEN` env var (personal access token from supabase.com/dashboard > Account > Access Tokens).

**Workflow B: Paste SQL directly in Supabase Dashboard SQL Editor** (used in infantiles — safe for additive migrations)

Per PITFALLS.md (Pitfall 7): test with `BEGIN; ... ROLLBACK;` first, then re-run with `COMMIT;` (or just run directly for safe DDL).

**For Phase 1, use Workflow A** to establish the `supabase/` directory structure. Future phases benefit from having migration files tracked in git.

### Phase 1 Migration Files

Three new migrations are needed. They must be **additive-only** — no modifications to existing infantiles tables.

```
supabase/migrations/
├── <timestamp>_player_positions.sql    # NEW table: player positions 1-15
├── <timestamp>_training_sessions_check.sql   # Verify session_type values (read-only check, no DDL)
└── <timestamp>_attendance_records_check.sql  # Verify attendance_records schema (read-only check)
```

Wait — per ARCHITECTURE.md the `training_sessions` and `attendance_records` tables **already exist** and are shared. Phase 1 only needs to add `player_positions`. The fixture and lineup tables are Phase 2+.

**Phase 1 migration: only `player_positions`**

```sql
-- supabase/migrations/<timestamp>_player_positions.sql
-- Adds player position tracking for M15-M19 divisions
-- ADDITIVE ONLY: no existing tables modified

CREATE TABLE IF NOT EXISTS player_positions (
  player_id         UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  position_primary  INTEGER CHECK (position_primary BETWEEN 1 AND 15),
  position_alt1     INTEGER CHECK (position_alt1 BETWEEN 1 AND 15),
  position_alt2     INTEGER CHECK (position_alt2 BETWEEN 1 AND 15),
  notes             TEXT,
  updated_by        UUID REFERENCES profiles(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "positions_select" ON player_positions FOR SELECT USING (
  get_user_role() IN ('admin', 'tutora')
  OR EXISTS (
    SELECT 1 FROM players p
    JOIN coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "positions_insert" ON player_positions FOR INSERT WITH CHECK (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM players p
    JOIN coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "positions_update" ON player_positions FOR UPDATE USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM players p
    JOIN coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "positions_delete" ON player_positions FOR DELETE USING (
  get_user_role() = 'admin'
);
```

[ASSUMED — SQL syntax verified against PostgreSQL standards; `CREATE POLICY IF NOT EXISTS` syntax requires PostgreSQL 9.6+; Supabase runs PostgreSQL 15 which supports this. RLS helper function signatures confirmed in ARCHITECTURE.md which states they already exist in the shared DB]

### Additive-Only Checklist (per Pitfall 1 in PITFALLS.md)

Before running the migration, verify these shared tables are NOT touched:
- `players` — no column adds, no changes
- `profiles` — no changes
- `divisions` — no changes
- `coach_divisions` — no changes
- `training_sessions` — no changes
- `attendance_records` — no changes

The `player_positions` table is juveniles-only (new), so it poses zero risk to infantiles.

---

## PWA Configuration

### next-pwa@5.6.0 Setup

```javascript
// next.config.mjs
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(/** @type {import('next').NextConfig} */ {})

export default config
```

### manifest.json (public/manifest.json)

```json
{
  "name": "VRC Juveniles",
  "short_name": "VRC Juvs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1c1c1c",
  "theme_color": "#2D5A1B",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

The `theme_color` matches the club green from the UI spec. The `background_color` matches `--background` token.

[ASSUMED — next-pwa@5.6.0 config syntax based on documented API; `display: standalone` is required for the PWA to behave correctly on iOS (no browser chrome, safe-area-inset applies)]

---

## Common Pitfalls (Phase 1 Specific)

### Pitfall 1: `session_type` column on shared `training_sessions`

**What goes wrong:** Infantiles added `session_type` in migration 026. When Phase 1 creates new `training_sessions` rows for juveniles, leaving `session_type` as NULL could break infantiles queries that filter or GROUP BY this column.

**How to avoid:** Set `session_type = 'entrenamiento'` on all juvenile training sessions. The session form (D-05) maps "Martes" and "Jueves" both to `session_type = 'entrenamiento'`. The day of week (Martes/Jueves) is stored in a separate column or derived from `session_date`. Confirm the accepted `session_type` values from the infantiles migration 026.

**Warning signs:** Infantiles attendance stats show unexpected session counts after juveniles starts adding sessions.

### Pitfall 2: Supabase Storage bucket name mismatch (Pitfall 9)

**What goes wrong:** Infantiles uses a specific bucket + naming pattern for player photos. If juveniles uses a different bucket name, player photos diverge (two copies for promoted players) and storage fills up with orphaned files.

**How to avoid:** Before writing the `AvatarUpload` component, confirm the exact bucket name from the infantiles Supabase dashboard. If the bucket is `player-photos`, use `player-photos/{player_id}.jpg`. Do not create a new bucket.

**Action required:** Verify bucket name before Wave 3 (player photo upload). This is listed as an open question below.

### Pitfall 3: `is_juvenile` division filter missing

**What goes wrong:** The app layout loads all coach divisions without filtering by `is_juvenile`. A coach who has both infantiles and juvenile assignments (or an admin) sees M6-M14 divisions in the selector. Selecting an infantiles division shows infantiles players in the juveniles app.

**How to avoid:** Filter `coach_divisions` by `is_juvenile = TRUE` when building the division list for the juveniles app. For admins (no `coach_divisions` rows), query the `divisions` table directly with `WHERE is_juvenile = TRUE`.

### Pitfall 4: `getSession()` vs `getUser()` in auth code

**What goes wrong:** `supabase.auth.getSession()` returns the session from storage without server validation. An expired or forged session token passes the check. The Supabase docs explicitly warn against using `getSession()` for auth decisions.

**How to avoid:** Always use `supabase.auth.getUser()` in middleware and Server Components. `getUser()` validates against the Supabase Auth server. Only use `getSession()` for client-side token access (e.g., getting the JWT for a 3rd-party API call).

### Pitfall 5: Bottom nav `padding-bottom` missing on mobile

**What goes wrong:** The bottom navigation bar is 64px tall + safe-area-inset. If the main content area doesn't have matching bottom padding, the last item in a list is hidden behind the nav bar.

**How to avoid:** The app layout applies `pb-[calc(64px+env(safe-area-inset-bottom))]` to the main content area. Every screen should use this or inherit it from the layout.

### Pitfall 6: IDB not available in SSR

**What goes wrong:** The offline queue (`openDB` from `idb`) crashes on the server because `indexedDB` is a browser API.

**How to avoid:** All IDB code must live in Client Components or in hooks/utilities that are only called client-side. The `queue.ts` and `sync.ts` files must never be imported from Server Components. Guard with `typeof window !== 'undefined'` where necessary.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `supabase` CLI | DB migrations | ✓ | 2.101.0 | Paste SQL in dashboard |
| Node.js | Build + dev | ✓ | 24.14.0 | — |
| npm | Install packages | ✓ | 11.9.0 | — |
| `.env.local` | Supabase credentials | ✗ | — | Must be created manually before any Supabase work |
| `SUPABASE_ACCESS_TOKEN` | `supabase db push` | ✗ | — | Use dashboard SQL editor (Pitfall 7 fallback) |
| Supabase Storage bucket | Photo upload | ✗ (unknown) | — | Confirm bucket name from infantiles Supabase dashboard |
| PWA icons (192/512px) | next-pwa manifest | ✗ | — | Create placeholder icons for development; real icons before launch |

**Missing dependencies with no fallback:**
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — blocks ALL Supabase integration work. Must be created in Wave 1.

**Missing dependencies with fallback:**
- `SUPABASE_ACCESS_TOKEN` — not needed if using dashboard SQL editor to run migrations.
- Supabase Storage bucket name — can be discovered by inspecting the live Supabase dashboard before implementing photo upload.

---

## globals.css Dark-First Override

The current `globals.css` uses the default light-mode shadcn tokens. Per the UI spec, the `:root` block must be **replaced** with the dark-first palette. The `.dark` block should be preserved but is not the primary theme.

The planner must include a dedicated task to rewrite `globals.css` `:root` with the dark-first values from the UI spec. This is Wave 0 (scaffold) work, not deferred.

Key tokens to override (see UI spec for complete list):
- `--background: oklch(0.12 0 0)` (currently `oklch(1 0 0)` — white)
- `--primary: oklch(0.40 0.12 142)` (currently near-black)
- `--sidebar: oklch(0.16 0 0)` (currently `oklch(0.985 0 0)` — near-white)

---

## layout.tsx Cleanup Required

Current `layout.tsx` has:
1. Two `localFont` imports for Geist fonts (Geist not used in UI spec — Inter only)
2. `metadata` placeholder (title: "Create Next App")
3. `lang="en"` (app is in Spanish — should be `lang="es"`)
4. `className` on `<body>` uses Geist variables instead of Inter

These must be fixed in Wave 1.

---

## Rugby Positions Constants

```typescript
// src/lib/positions/constants.ts
export const RUGBY_POSITIONS = [
  { number: 1,  name: 'Pilar izquierdo',    group: 'Forwards' },
  { number: 2,  name: 'Hooker',             group: 'Forwards' },
  { number: 3,  name: 'Pilar derecho',      group: 'Forwards' },
  { number: 4,  name: 'Segundo línea',      group: 'Forwards' },
  { number: 5,  name: 'Segundo línea',      group: 'Forwards' },
  { number: 6,  name: 'Ala ciego',          group: 'Forwards' },
  { number: 7,  name: 'Ala abierto',        group: 'Forwards' },
  { number: 8,  name: 'Octavo',             group: 'Forwards' },
  { number: 9,  name: 'Medio scrum',        group: 'Backs' },
  { number: 10, name: 'Apertura',           group: 'Backs' },
  { number: 11, name: 'Ala izquierdo',      group: 'Backs' },
  { number: 12, name: 'Centro interno',     group: 'Backs' },
  { number: 13, name: 'Centro externo',     group: 'Backs' },
  { number: 14, name: 'Ala derecho',        group: 'Backs' },
  { number: 15, name: 'Fullback',           group: 'Backs' },
] as const

export type PositionNumber = typeof RUGBY_POSITIONS[number]['number']
export type PositionGroup = 'Forwards' | 'Backs'
```

[VERIFIED: World Rugby Laws positions 1-15 are universal; Spanish names match FEATURES.md which cites UAR/URBA standard usage]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Middleware auth pattern using `createServerClient` with cookie adapter | Auth Patterns | Must verify against @supabase/ssr@0.10.2 changelog — the cookie API changed between versions |
| A2 | `CREATE POLICY IF NOT EXISTS` syntax works in Supabase PostgreSQL 15 | Migration SQL | If not supported, migration fails; fallback: drop policy before create |
| A3 | Supabase Storage bucket is named `player-photos` | Photo Upload | Wrong bucket name means upload 404s silently; must verify from Supabase dashboard before coding |
| A4 | `training_sessions.session_type` accepted values include `'entrenamiento'` | ATT-01 pattern | Wrong value triggers CHECK constraint violation at runtime; confirm from infantiles migration 026 |
| A5 | `@hookform/resolvers` current version is compatible with react-hook-form@7.76.1 and zod@4.4.3 | Standard Stack | Version mismatch causes runtime type errors; run `npm view @hookform/resolvers version` before installing |
| A6 | `divisions.is_juvenile` column exists and is Boolean (confirmed in ARCHITECTURE.md as "migration 014") | Auth + Division Filter | If column name differs or is NULL by default, the division filter returns empty sets |
| A7 | `next-pwa@5.6.0` config syntax `withPWA({ dest, register, skipWaiting, disable })` is valid | PWA Config | Wrapping format may differ from the documented pattern for Next.js 14 |

---

## Open Questions

1. **Supabase Storage bucket name**
   - What we know: Infantiles uses Supabase Storage for player photos; same project is shared
   - What's unclear: The exact bucket name in the live Supabase project
   - Recommendation: Before Wave 3 (photo upload), open the Supabase dashboard > Storage and confirm the bucket name. Do not guess — a wrong bucket name will create a new bucket instead of reusing the existing one.

2. **`training_sessions.session_type` allowed values**
   - What we know: Column added in infantiles migration 026; PITFALLS.md flags this as a risk
   - What's unclear: The exact CHECK constraint values (e.g., is it `'entrenamiento'` or `'training'` or something else?)
   - Recommendation: Before Wave 4 (attendance), confirm by looking at the Supabase SQL editor `SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%session_type%'`

3. **`SUPABASE_SERVICE_ROLE_KEY` needed for Phase 1?**
   - What we know: ADM-01 (coach creation) requires the service_role key to call the Supabase Auth Admin API (inviting users, assigning roles)
   - What's unclear: Whether coach creation can be scoped to an anon-key admin flow or requires the service_role key
   - Recommendation: Plan ADM-01 to use the service_role key server-side (in a Server Action). Add `SUPABASE_SERVICE_ROLE_KEY` to the required env vars list.

---

## Project Constraints (from CLAUDE.md)

| Constraint | Directive |
|------------|-----------|
| Stack | Next.js 14 App Router + TypeScript + Tailwind + Supabase — no deviations |
| `@supabase/ssr` version | Pin at `0.10.2` exactly — do not upgrade |
| `@supabase/supabase-js` version | `^2.102.1` — pinned peer dep of @supabase/ssr |
| Supabase project | Shared with infantiles — NEVER modify existing tables or RLS functions |
| `next-pwa` version | `5.6.0` exactly — do not use `@ducanh2912/next-pwa` |
| `idb` version | `^8.0.3` — same as infantiles |
| Excel parsing | `exceljs` only — not in Phase 1, but Phase 2 must use it |
| DnD | `@dnd-kit` only — not in Phase 1, Phase 3 only |
| Branching | Direct commits to `main` — no PRs, no branches |
| Infantiles isolation | Zero changes to infantiles code; shared Supabase tables are additive-only |
| Dev environment | Development must not touch production DB of infantiles |
| Language | All UI copy in Spanish (Argentina); code identifiers and comments in English |

---

## Validation Architecture

> `nyquist_validation` is explicitly `false` in `.planning/config.json` — this section is skipped.

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — Dependency versions confirmed via npm registry (2026-05-24 research)
- `.planning/research/ARCHITECTURE.md` — DB schema design, RLS patterns, migration strategy (2026-05-24)
- `.planning/research/PITFALLS.md` — Known failure modes from infantiles production (2026-05-24)
- `.planning/research/FEATURES.md` — Rugby positions, UX patterns, URBA data (2026-05-24)
- `C:\dev\vrc-juveniles\package.json` — Current installed dependencies [VERIFIED: direct read]
- `C:\dev\vrc-juveniles\components.json` — shadcn configuration [VERIFIED: direct read]
- `C:\dev\vrc-juveniles\src\app\globals.css` — Current CSS tokens [VERIFIED: direct read]
- npm registry: `npm view @supabase/ssr@0.10.2 version` → `0.10.2` [VERIFIED]
- npm registry: `npm view next-pwa@5.6.0 version` → `5.6.0` [VERIFIED]
- npm registry: `npm view idb@8.0.3 version` → `8.0.3` [VERIFIED]
- npm registry: `npm view react-hook-form version` → `7.76.1` [VERIFIED]
- npm registry: `npm view zod version` → `4.4.3` [VERIFIED]
- npm registry: `npm view sonner version` → `2.0.7` [VERIFIED]
- Supabase CLI: `supabase --version` → `2.101.0` [VERIFIED]

### Secondary (MEDIUM confidence)
- UI-SPEC.md (approved 2026-05-27) — Component inventory, interaction contracts, color tokens
- @supabase/ssr docs pattern — middleware cookie handling; version 0.10.2 specific behavior [ASSUMED — must verify at implementation time]

### Tertiary (LOW confidence — flagged as ASSUMED)
- Supabase Storage bucket name `player-photos` — not verified against live instance
- `session_type` CHECK constraint values — not verified against infantiles migration 026

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry
- Architecture: HIGH — based on existing project research files + direct codebase inspection
- DB migration SQL: MEDIUM — syntax verified, but helper function names/signatures assumed from ARCHITECTURE.md (not confirmed against live DB in this session)
- Offline queue pattern: MEDIUM — IDB API verified, but exact column names in `attendance_records` assumed from ARCHITECTURE.md
- Photo upload/storage: LOW-MEDIUM — canvas pattern is standard; bucket name unverified

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stable stack; 30 days)
