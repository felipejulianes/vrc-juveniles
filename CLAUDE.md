<!-- GSD:project-start source:PROJECT.md -->
## Project

**VRC Juveniles**

App web PWA para entrenadores del rugby juvenil de Virreyes Rugby Club (Buenos Aires, Argentina). Cubre las divisiones M15, M16, M17 y M19. A diferencia de la app de infantiles (que tiene foco social), esta app tiene foco deportivo: gestión de asistencia, fixture oficial URBA, resultados de partidos, posiciones de jugadores y armado de equipo para cada partido.

**Core Value:** El entrenador llega al partido sabiendo quiénes vinieron a entrenar, qué puesto juega cada uno, y puede armar el equipo del sábado desde la app en segundos.

### Constraints

- **Stack**: Next.js 14 App Router + TypeScript + Tailwind + Supabase — mismo que infantiles, para reusar patrones y conocimiento
- **Supabase**: mismo proyecto que infantiles (`NEXT_PUBLIC_SUPABASE_URL` compartido). El schema ya tiene divisiones M15-M19
- **Deploy**: Vercel proyecto separado, apunta al mismo Supabase
- **Sin branches/PRs**: workflow directo en `main`, igual que infantiles
- **Aislamiento**: durante desarrollo, no se modifica ni la DB de producción ni el código de infantiles
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Baseline (inherited from infantiles — no research needed)
| Library | Version | Already used in |
|---------|---------|----------------|
| `next` | 14.2.35 | infantiles |
| `@supabase/ssr` | 0.10.2 (pinned) | infantiles |
| `@supabase/supabase-js` | ^2.102.1 | infantiles |
| `next-pwa` | ^5.6.0 | infantiles |
| `idb` | ^8.0.3 | infantiles (offline queue) |
| `recharts` | ^3.8.1 | infantiles (stats charts) |
| `react-markdown` + `remark-gfm` | latest | infantiles (wiki) — may not be needed here |
## New Dependencies — Evaluated
### 1. Excel Import: exceljs (reuse from infantiles)
- Excel parsing **must run server-side** (Next.js API route or server action), not in the browser. ExcelJS pulls in Node.js-specific dependencies (`archiver`, `unzipper`, `readable-stream`) that will break a browser bundle if imported from a Client Component.
- The import flow: user picks file → POST multipart form to `/api/fixture/import` → server parses with ExcelJS → writes to Supabase → returns structured data. This is the same pattern the infantiles app uses for Excel export.
### 2. Drag-and-Drop for Team Builder: @dnd-kit
| Library | Status | Touch/Mobile | Verdict |
|---------|--------|-------------|---------|
| `react-beautiful-dnd` | **Deprecated** (Atlassian, 2023) | Poor | Do not use |
| `@hello-pangea/dnd` | Active fork of rbd | Partial | List-only, not free-form positioning |
| `react-dnd` | Maintained | Requires plugin for touch | Overkill; complex setup |
| `@dnd-kit/core` | Active, Dec 2024 | Native pointer+touch sensors | **Use this** |
| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.3.1 | Core DnD engine, sensors, collision detection |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list preset (for the bench/substitute ordering) |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities (transiton, arrayMove) |
## Team Builder UI: No Additional Library Needed
## PWA: Stick with next-pwa@5.6.0
## Full Dependency List
### Install with infantiles app as template:
### Dev dependencies (same as infantiles):
### Libraries from infantiles NOT needed here (initially):
- `react-markdown` + `remark-gfm` — no wiki module planned for juveniles
- Keep off the initial install; add if a wiki or rules page is added later
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Excel parse | `exceljs` (reuse) | `xlsx` (SheetJS) | Effectively abandoned on npm (last published Mar 2022); CVE history |
| Excel parse | `exceljs` (reuse) | Separate parse library | No need — exceljs reads and writes |
| DnD | `@dnd-kit` | `react-beautiful-dnd` | Officially deprecated by Atlassian |
| DnD | `@dnd-kit` | `@hello-pangea/dnd` | List-only; no free-form drop zones |
| DnD | `@dnd-kit` | `react-dnd` | Complex setup; touch requires extra plugin; overkill |
| PWA | `next-pwa@5.6.0` | `@ducanh2912/next-pwa` | Known-working in production; no benefit changing |
## Confidence Assessment
| Area | Confidence | Basis |
|------|------------|-------|
| ExcelJS for import | HIGH | Already installed in sister app; confirmed read+write capability; no alternatives at comparable quality |
| @dnd-kit for DnD | HIGH | react-beautiful-dnd deprecation confirmed via npm; dnd-kit Dec 2024 release confirmed; community standard |
| Touch sensor config | MEDIUM | Based on dnd-kit documentation patterns; must be validated on actual device in PWA context |
| Rugby field CSS layout | HIGH | This is CSS; no library risk |
| next-pwa version lock | MEDIUM | Production-proven but unmaintained; acceptable risk given identical requirements to infantiles |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
