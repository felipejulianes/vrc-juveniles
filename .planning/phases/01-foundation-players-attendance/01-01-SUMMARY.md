---
phase: 01-foundation-players-attendance
plan: "01"
subsystem: scaffold
tags: [dependencies, shadcn, pwa, tailwind, rugby-positions, dark-theme]
dependency_graph:
  requires: []
  provides:
    - Phase 1 runtime dependencies at pinned versions
    - shadcn UI component inventory (13 components)
    - Dark-first color palette via CSS custom properties
    - next-pwa PWA shell with manifest and placeholder icons
    - RUGBY_POSITIONS constants (15 entries)
  affects:
    - All subsequent plans in Phase 1 (depend on these deps and tokens)
tech_stack:
  added:
    - "@supabase/ssr@0.10.2 (exact pin)"
    - "@supabase/supabase-js@^2.102.1"
    - "next-pwa@5.6.0 (exact pin)"
    - "idb@^8.0.3"
    - "react-hook-form@^7.76.1"
    - "zod@^4.4.3"
    - "@hookform/resolvers@^5.4.0"
    - "sonner@^2.0.7"
    - "pngjs (devDep, icon generation)"
  patterns:
    - Tailwind CSS custom properties mapped via tailwind.config.ts extend.colors
    - shadcn components import cn() from @/lib/utils
    - next-pwa wrapped in next.config.mjs via ESM import
    - Rugby positions as const array with TypeScript literal types
key_files:
  created:
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/avatar.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/select.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/popover.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/sonner.tsx
    - src/components/ui/form.tsx
    - src/lib/positions/constants.ts
    - public/manifest.json
    - public/icons/icon-192.png
    - public/icons/icon-512.png
    - .env.example
  modified:
    - package.json
    - package-lock.json
    - src/app/globals.css
    - src/app/layout.tsx
    - next.config.mjs
    - tailwind.config.ts
    - .gitignore
decisions:
  - "shadcn/tailwind.css and tw-animate-css removed from globals.css: both use Tailwind v4 syntax (@theme inline, @utility) incompatible with tailwindcss@3.4.x installed in this project"
  - "tailwind.config.ts fully extended with all shadcn CSS token mappings so border-border, bg-background etc. resolve in v3"
  - "themeColor moved to Viewport export (Next.js 14 API requirement)"
  - "form.tsx created manually: shadcn CLI (v4.8.2 radix-nova) skipped it silently; standard react-hook-form + @radix-ui/react-slot implementation"
  - "pngjs used for placeholder icon generation (inline Node one-liner crc32 not available in Node 24.14)"
metrics:
  duration_minutes: 35
  completed_date: "2026-05-27"
  tasks_completed: 3
  tasks_total: 3
  files_created: 17
  files_modified: 7
---

# Phase 01 Plan 01: Scaffold — Dependencies, Design Tokens, PWA, Positions Summary

**One-liner:** Next.js 14 PWA shell with @supabase/ssr@0.10.2 + next-pwa@5.6.0 pinned, dark-first VRC green palette, shadcn radix-nova component inventory, and 15-entry RUGBY_POSITIONS constants module.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install Phase 1 runtime deps and shadcn components | d22d5d4 | package.json, src/components/ui/ (13 files), src/lib/utils.ts |
| 2 | Dark-first palette and root layout fix | 2f51def | src/app/globals.css, src/app/layout.tsx |
| 3 | next-pwa, manifest, icons, env template, positions | 52979cc | next.config.mjs, public/manifest.json, public/icons/*, .env.example, src/lib/positions/constants.ts, tailwind.config.ts |

---

## Verification Results

- `npx tsc --noEmit` — exits 0
- `npm run build` — exits 0, generates static pages correctly
- `@supabase/ssr` in package.json — `"0.10.2"` (exact, no caret)
- `next-pwa` in package.json — `"5.6.0"` (exact, no caret)
- `--background: oklch(0.12 0 0)` present in globals.css
- `--primary: oklch(0.40 0.12 142)` present in globals.css
- `lang="es"` in layout.tsx
- `VRC Juveniles` in layout metadata
- 13 shadcn components present under src/components/ui/
- RUGBY_POSITIONS exports 15 positions
- public/icons/icon-192.png (543 bytes), icon-512.png (1943 bytes)
- manifest.json name = "VRC Juveniles", theme_color = "#2D5A1B"
- .gitignore contains .env.local and public/sw.js*

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tailwind v4/v3 incompatibility in globals.css**
- **Found during:** Task 3 (npm run build)
- **Issue:** The shadcn CLI v4.8.2 with radix-nova preset generates `globals.css` importing `shadcn/tailwind.css` and `tw-animate-css`, both of which use Tailwind v4-only syntax (`@theme inline`, `@utility`). The project uses `tailwindcss@3.4.19`. This caused build failure: `The border-border class does not exist` and `outline-ring/50 class does not exist`.
- **Fix:** Removed both problematic `@import` statements from `globals.css`. Replaced `@apply border-border outline-ring/50` and `@apply bg-background text-foreground` with plain CSS property declarations. The design tokens remain as CSS custom properties and are correctly consumed by the shadcn components via `cn()`.
- **Files modified:** `src/app/globals.css`
- **Commit:** 52979cc

**2. [Rule 1 - Bug] tailwind.config.ts not configured for shadcn tokens**
- **Found during:** Task 3 (npm run build, first attempt)
- **Issue:** The initial `tailwind.config.ts` only mapped `background` and `foreground` tokens, missing all shadcn tokens (`border`, `ring`, `muted`, `card`, `primary`, `sidebar`, etc.). This caused `border-border` not to resolve even after removing the v4 imports.
- **Fix:** Extended `tailwind.config.ts` with the full shadcn token mapping in `theme.extend.colors`, including nested variants (card-foreground, sidebar-primary, etc.) and `fontFamily.sans`.
- **Files modified:** `tailwind.config.ts`
- **Commit:** 52979cc

**3. [Rule 1 - Bug] themeColor in metadata causes Next.js 14 warning**
- **Found during:** Task 3 (npm run build output)
- **Issue:** Next.js 14 deprecated `themeColor` in the `Metadata` export; it must be in the `Viewport` export.
- **Fix:** Moved `themeColor` to `export const viewport: Viewport = { themeColor: "#2D5A1B" }` in layout.tsx.
- **Files modified:** `src/app/layout.tsx`
- **Commit:** 52979cc

**4. [Rule 2 - Missing] form.tsx not generated by shadcn CLI**
- **Found during:** Task 1 (post-install check)
- **Issue:** `npx shadcn@latest add form` ran but produced no file. The shadcn CLI v4.8.2 silently skipped the form component.
- **Fix:** Created `src/components/ui/form.tsx` manually with the standard shadcn form implementation: `FormProvider`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` using `react-hook-form` + `@radix-ui/react-slot`.
- **Files modified:** `src/components/ui/form.tsx` (created)
- **Commit:** d22d5d4

**5. [Rule 3 - Blocking] pngjs needed for icon generation**
- **Found during:** Task 3
- **Issue:** The inline Node.js PNG CRC32 one-liner in the plan relies on `zlib.crc32` which is not available in Node 24.14. The fallback `pngjs` approach worked correctly.
- **Fix:** Used pngjs fallback as documented in the plan. Added `pngjs` as devDependency.
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** 52979cc

---

## Known Stubs

None. This plan creates infrastructure only — no UI screens, no data fetching. No stub values flow to any rendering path.

---

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model. The `.env.local` gitignore entry is confirmed present. `public/sw.js` is gitignored per T-01-02 mitigation.

---

## Self-Check: PASSED

- `src/components/ui/form.tsx` — FOUND
- `src/lib/positions/constants.ts` — FOUND
- `public/manifest.json` — FOUND
- `public/icons/icon-192.png` — FOUND
- `public/icons/icon-512.png` — FOUND
- `.env.example` — FOUND
- Commit d22d5d4 — FOUND
- Commit 2f51def — FOUND
- Commit 52979cc — FOUND
