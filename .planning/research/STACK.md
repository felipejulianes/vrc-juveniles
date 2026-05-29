# Technology Stack — VRC Juveniles

**Project:** VRC Juveniles PWA
**Researched:** 2026-05-24
**Scope:** Only libraries new or different from the infantiles app baseline. Next.js 14, TypeScript, Tailwind, Supabase, Vercel are already decided.

---

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

Copy these directly from the infantiles `package.json`. No evaluation needed.

---

## New Dependencies — Evaluated

### 1. Excel Import: exceljs (reuse from infantiles)

**Recommendation: `exceljs@^4.4.0` — same version as infantiles.**

**Rationale:**

The infantiles app already uses exceljs for writing (attendance export). ExcelJS supports both reading and writing `.xlsx` files, which covers the URBA fixture import use case. The URBA fixture files are standard Excel `.xlsx` format.

The critical distinction is where parsing runs:

- Excel parsing **must run server-side** (Next.js API route or server action), not in the browser. ExcelJS pulls in Node.js-specific dependencies (`archiver`, `unzipper`, `readable-stream`) that will break a browser bundle if imported from a Client Component.
- The import flow: user picks file → POST multipart form to `/api/fixture/import` → server parses with ExcelJS → writes to Supabase → returns structured data. This is the same pattern the infantiles app uses for Excel export.

**Do not use `xlsx` (SheetJS community edition).** Last published March 2022 (effectively abandoned on npm). The pro version requires a commercial license and a private registry. ExcelJS is actively maintained and already a project dependency.

**Do not add a second library** for parsing. ExcelJS reads and writes. One dependency does both.

ExcelJS reading API:
```typescript
// In a Next.js API route (server only)
import ExcelJS from 'exceljs'
import { Readable } from 'stream'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const buffer = Buffer.from(await file.arrayBuffer())

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  sheet.eachRow((row, rowNumber) => {
    // row.getCell(1).value, etc.
  })
}
```

**Confidence: HIGH** — ExcelJS is already installed in the related project, version 4.4.0 confirmed on npm registry (last published Oct 2023, stable).

---

### 2. Drag-and-Drop for Team Builder: @dnd-kit

**Recommendation: `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` + `@dnd-kit/utilities@^3.2.2`**

This is the key new UI dependency for this app. The team builder screen — drag a player from a "present players" pool onto one of 15 field positions + substitute bench — requires DnD that works reliably on mobile touchscreens inside a PWA.

**Why @dnd-kit, not alternatives:**

| Library | Status | Touch/Mobile | Verdict |
|---------|--------|-------------|---------|
| `react-beautiful-dnd` | **Deprecated** (Atlassian, 2023) | Poor | Do not use |
| `@hello-pangea/dnd` | Active fork of rbd | Partial | List-only, not free-form positioning |
| `react-dnd` | Maintained | Requires plugin for touch | Overkill; complex setup |
| `@dnd-kit/core` | Active, Dec 2024 | Native pointer+touch sensors | **Use this** |

@dnd-kit is the de-facto standard for new React DnD work as of 2024-2025. It was designed from scratch with pointer events (which unify mouse and touch), making it work correctly in mobile PWAs without polyfills. It has zero dependencies beyond its own sub-packages.

`react-beautiful-dnd` is **officially deprecated** — confirmed via npm deprecated field: "react-beautiful-dnd is now deprecated." Do not use it or `@hello-pangea/dnd` for a new project.

**Package breakdown:**

| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.3.1 | Core DnD engine, sensors, collision detection |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list preset (for the bench/substitute ordering) |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities (transiton, arrayMove) |

**The team builder has two DnD interaction patterns:**

1. **Free-form drop zones** (15 positions on a rugby field layout): Use `@dnd-kit/core` directly. Each position is a `<Droppable>` zone. Players from the pool are `<Draggable>` items. Collision detection strategy: `closestCenter` or `closestCorners`.

2. **Ordered bench list** (suplentes with assigned positions): Use `@dnd-kit/sortable` to reorder within the bench.

Both patterns are covered by the same package family.

**Touch sensor configuration** — critical for PWA:
```typescript
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // px — prevents accidental drag on tap
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,    // ms hold before drag activates
      tolerance: 5,  // px movement allowed during delay
    },
  })
)
```

The `delay` + `tolerance` on `TouchSensor` is essential: without it, every tap on a draggable element on mobile will be interpreted as a drag attempt, making scroll and tap impossible.

**Confidence: HIGH** — @dnd-kit/core 6.3.1 confirmed on npm (published Dec 2024). react-beautiful-dnd deprecation confirmed via npm deprecated field.

---

## Team Builder UI: No Additional Library Needed

The rugby field layout (15 positions in a visual formation) is a CSS/Tailwind layout problem, not a library problem. Use a CSS grid or absolute positioning to render the field, with @dnd-kit drop zones overlaid on each position cell. Do not reach for a specialized "sports lineup" library — none exist for React at production quality.

The formation layout (1-2-3-2-3-4 or numbered scrum positions) can be hardcoded as a constant:

```typescript
// src/lib/rugby/positions.ts
export const RUGBY_POSITIONS = [
  { number: 1, name: 'Pilier Izquierdo', zone: 'scrum' },
  { number: 2, name: 'Hooker',           zone: 'scrum' },
  // ... 15 total
] as const
```

This is data, not a library.

---

## PWA: Stick with next-pwa@5.6.0

The infantiles app uses `next-pwa@5.6.0`. Use the same version despite it being last published in August 2022. Reason: it works in production (infantiles app is live), and switching to the maintained fork `@ducanh2912/next-pwa` (v10.2.9, last published Sep 2024) for a new project is unnecessary churn. The PWA requirements here are identical to infantiles (offline queue, installable, service worker caching). The risk of diverging from a known-working configuration outweighs the benefit.

**Exception**: if offline DnD interactions (team builder while offline) are required, revisit. For now, assume team builder requires connectivity.

---

## Full Dependency List

### Install with infantiles app as template:
```bash
npm install \
  @supabase/ssr@0.10.2 \
  @supabase/supabase-js \
  exceljs \
  idb \
  next-pwa \
  recharts \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities
```

### Dev dependencies (same as infantiles):
```bash
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  eslint \
  eslint-config-next \
  postcss \
  tailwindcss \
  typescript
```

### Libraries from infantiles NOT needed here (initially):
- `react-markdown` + `remark-gfm` — no wiki module planned for juveniles
- Keep off the initial install; add if a wiki or rules page is added later

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Excel parse | `exceljs` (reuse) | `xlsx` (SheetJS) | Effectively abandoned on npm (last published Mar 2022); CVE history |
| Excel parse | `exceljs` (reuse) | Separate parse library | No need — exceljs reads and writes |
| DnD | `@dnd-kit` | `react-beautiful-dnd` | Officially deprecated by Atlassian |
| DnD | `@dnd-kit` | `@hello-pangea/dnd` | List-only; no free-form drop zones |
| DnD | `@dnd-kit` | `react-dnd` | Complex setup; touch requires extra plugin; overkill |
| PWA | `next-pwa@5.6.0` | `@ducanh2912/next-pwa` | Known-working in production; no benefit changing |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| ExcelJS for import | HIGH | Already installed in sister app; confirmed read+write capability; no alternatives at comparable quality |
| @dnd-kit for DnD | HIGH | react-beautiful-dnd deprecation confirmed via npm; dnd-kit Dec 2024 release confirmed; community standard |
| Touch sensor config | MEDIUM | Based on dnd-kit documentation patterns; must be validated on actual device in PWA context |
| Rugby field CSS layout | HIGH | This is CSS; no library risk |
| next-pwa version lock | MEDIUM | Production-proven but unmaintained; acceptable risk given identical requirements to infantiles |
