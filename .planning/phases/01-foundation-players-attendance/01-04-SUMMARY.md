---
phase: 01-foundation-players-attendance
plan: "04"
subsystem: ui, api, database
tags: [react-hook-form, zod, supabase-storage, server-actions, canvas-resize, soft-delete]

# Dependency graph
requires:
  - phase: 01-foundation-players-attendance
    plan: "03"
    provides: "PlayerWithPosition type, listByDivision/getById queries, player list + profile read screens"
  - phase: 01-foundation-players-attendance
    plan: "02"
    provides: "Supabase server client, player_positions migration, coach_divisions RLS, auth session"
provides:
  - "createPlayer Server Action — inserts players row + optional player_positions, enforces division scope"
  - "updatePlayer Server Action — updates all player fields, upserts positions, checks ownership"
  - "upsertPositions Server Action — standalone position save with updated_by attribution"
  - "softDeletePlayer Server Action — sets inactivo=true, never hard-deletes (PLY-06)"
  - "setPlayerPhotoUrl Server Action — writes photo_url column after successful Storage upload"
  - "/api/players/photo route — MIME + size + ownership validation, canvas-resized JPEG upload to Supabase Storage"
  - "PlayerForm shared component — react-hook-form + zod, create/edit modes, Spanish inline errors"
  - "AvatarUpload component — client-side canvas resize (800x800, q=0.85), deferred upload in create mode"
  - "DeletePlayerDialog — confirmation dialog with exact UI-SPEC copy, calls softDeletePlayer"
  - "PlayerProfileActions — edit link + delete dialog row on profile screen"
  - "/jugadores/nuevo page — full create form replacing Plan 03 stub"
  - "/jugadores/[id]/editar page — edit form with pre-populated initial values"
affects:
  - 01-05-attendance
  - 02-fixture
  - 03-team-builder

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action authorization pattern: requireCoachForDivision + requireCoachForPlayer helpers called before every mutation"
    - "Canvas resize before upload: max 800x800, JPEG quality 0.85, result deferred in create mode until playerId available"
    - "Soft-delete via inactivo=true column — no hard DELETE ever issued (PLY-06)"
    - "Photo cache busting: Storage URL appended with ?v={Date.now()} on re-upload"
    - "Sentinel 'none' value for shadcn SelectItem instead of empty string"

key-files:
  created:
    - src/lib/players/schema.ts
    - src/lib/players/photo.ts
    - src/app/(app)/jugadores/actions.ts
    - src/app/api/players/photo/route.ts
    - src/components/players/PlayerForm.tsx
    - src/components/players/AvatarUpload.tsx
    - src/components/players/DeletePlayerDialog.tsx
    - src/components/players/PlayerProfileActions.tsx
    - src/app/(app)/jugadores/[id]/editar/page.tsx
  modified:
    - src/app/(app)/jugadores/nuevo/page.tsx
    - src/app/(app)/jugadores/[id]/page.tsx
    - src/components/players/PlayerListClient.tsx

key-decisions:
  - "Schema deviation: live players table has parent_phone/parent_name instead of plan-assumed phone/email — schema.ts and actions.ts updated to match live DB"
  - "Photo bucket: used 'player-photos' (default from plan) — not verified against live dashboard but upload flow worked at checkpoint; if bucket missing, player is created without photo"
  - "Route Handler for photo upload instead of Server Action — avoids streaming multipart body unreliability in Server Actions, allows early MIME/size rejection before Storage write"
  - "Sentinel 'none' for position SelectItem — shadcn Select does not accept empty-string values; 'none' maps to null before persistence"
  - "Deferred photo upload in create mode — upload runs after createPlayer returns the new UUID, avoiding orphan Storage objects"

patterns-established:
  - "requireCoachForPlayer: every player-scoped Server Action calls this helper before touching DB; admin role bypasses coach_divisions check"
  - "requireCoachForDivision: create-player action uses this variant; checks coach_id + division_id in coach_divisions"
  - "All mutations call revalidatePath after write to keep the Next.js cache consistent"

requirements-completed: [PLY-02, PLY-03, PLY-04]

# Metrics
duration: ~3h
completed: 2026-05-28
---

# Phase 01 Plan 04: Player CRUD (write side) Summary

**Full player write surface shipped: create, edit, position assignment, canvas-resize photo upload with server MIME/size/ownership validation, and soft-delete via confirmation dialog — all mutations gated by division-scope authorization**

## Performance

- **Duration:** ~3 hours
- **Started:** 2026-05-28 (morning)
- **Completed:** 2026-05-28
- **Tasks:** 4 (Tasks 1-3 auto, Task 4 human-verify checkpoint — approved)
- **Files modified:** 12

## Accomplishments

- Full server-side mutation layer with per-action authorization (requireCoachForDivision / requireCoachForPlayer) on every write
- Shared PlayerForm (react-hook-form + zod) supporting create and edit modes with Spanish inline error messages
- Client-side canvas resize (max 800x800, JPEG q=0.85) in AvatarUpload with deferred upload in create mode (waits for playerId before POSTing to photo route)
- /api/players/photo route validates MIME type (image/jpeg, image/png), size (<=1.5 MB), and coach_divisions ownership before writing to Supabase Storage
- Soft-delete sets inactivo=true; hard DELETE is intentionally not implemented (PLY-06 contract)
- player_positions.updated_by written on every upsert (T-01-23 repudiation mitigation)
- Checkpoint Task 4 approved manually: create, edit, delete dialog copy, soft-delete with "Inactivo" badge all verified

## Task Commits

Each task was committed atomically:

1. **Task 1: Player schema, Server Actions, photo upload route** - `4d8608c` (feat)
2. **Task 2: PlayerForm + AvatarUpload client components** - `c9d1f8a` (feat)
3. **Task 3: Wire pages — nuevo, editar, profile actions + delete dialog** - `3a4ca9e` (feat)
4. **Task 4: Checkpoint approved — post-checkpoint fix** - `5537f04` (fix)

## Files Created/Modified

- `src/lib/players/schema.ts` — Zod PlayerFormSchema; uses parent_phone/parent_name matching live DB
- `src/lib/players/photo.ts` — Server-only constants: PHOTO_BUCKET, PHOTO_MAX_BYTES, PHOTO_ALLOWED_MIME, photoStoragePath
- `src/app/(app)/jugadores/actions.ts` — Five Server Actions + two auth guard helpers; 'use server'
- `src/app/api/players/photo/route.ts` — POST route with MIME/size/ownership validation; runtime='nodejs'
- `src/components/players/PlayerForm.tsx` — Shared create/edit form; react-hook-form + zodResolver
- `src/components/players/AvatarUpload.tsx` — Canvas resize picker; deferred upload in create mode; Loader2 spinner during upload
- `src/components/players/DeletePlayerDialog.tsx` — shadcn Dialog with exact UI-SPEC confirmation copy
- `src/components/players/PlayerProfileActions.tsx` — Edit link + DeletePlayerDialog row
- `src/app/(app)/jugadores/nuevo/page.tsx` — Full create screen (replaced Plan 03 stub)
- `src/app/(app)/jugadores/[id]/editar/page.tsx` — Edit screen with getById + notFound()
- `src/app/(app)/jugadores/[id]/page.tsx` — Profile updated: PlayerProfileActions + AvatarUpload replacing disabled placeholders
- `src/components/players/PlayerListClient.tsx` — FAB href updated to pass ?division={id} to /nuevo

## Decisions Made

**Schema deviation (parent_phone / parent_name):** The live `players` table has `parent_phone` and `parent_name` columns, not the `phone` / `email` columns assumed in the plan spec. Discovered during Task 1 (confirmed in Plan 03 deviation D-06). Schema and all actions updated to match live DB. No migration needed — columns already exist.

**Photo bucket name:** Using `'player-photos'` as specified in plan. Not manually verified against live Supabase Storage dashboard (Research Open Question #1 was not resolved before execution). The upload flow succeeded at the checkpoint, confirming the bucket exists and is accessible. If upload fails on a fresh environment, the player is created without a photo (graceful degradation).

**Route Handler over Server Action for photo upload:** Server Actions with streaming multipart bodies have reliability issues in the Next.js + Supabase SSR combination. A dedicated Route Handler at /api/players/photo allows early rejection (415 on MIME, 413 on size) before any Storage write.

**Sentinel 'none' for position SelectItem:** shadcn/ui Select does not accept `value=""` on SelectItem — runtime warning + broken state. Changed to sentinel value `"none"` which is mapped to `null` before persistence. Applied as post-checkpoint fix (`5537f04`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] shadcn SelectItem rejects empty-string value for position "Sin asignar" option**
- **Found during:** Task 4 checkpoint verification (post-approval fix)
- **Issue:** `<SelectItem value="">` triggers runtime warning in shadcn and causes broken Select state when the "Sin asignar" option is selected
- **Fix:** Changed to sentinel `value="none"` for the unassigned option; added mapping in PlayerForm to convert `"none"` back to `null` before calling Server Actions
- **Files modified:** `src/components/players/PlayerForm.tsx`
- **Verification:** Checkpoint already approved; fix applied cleanly, position dropdowns work correctly
- **Committed in:** `5537f04` (fix commit)

**2. [Rule 1 - Bug / Schema deviation] Live DB columns are parent_phone/parent_name, not phone/email**
- **Found during:** Task 1 (schema creation)
- **Issue:** Plan spec assumed `phone` and `email` columns on the players table. Actual live schema (confirmed in Plan 03 D-06 research) uses `parent_phone` and `parent_name` — contact details belong to the parent/guardian, not the player
- **Fix:** PlayerFormSchema fields renamed to `parent_phone` / `parent_name`; actions.ts inserts/updates use matching column names; PlayerForm labels updated to "Teléfono del tutor" / "Nombre del tutor"
- **Files modified:** `src/lib/players/schema.ts`, `src/app/(app)/jugadores/actions.ts`, `src/components/players/PlayerForm.tsx`
- **Verification:** Build passes; create/edit flows verified at checkpoint
- **Committed in:** `4d8608c` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug — shadcn sentinel, 1 schema mismatch)
**Impact on plan:** Both fixes required for correctness. No scope creep. PLY-06 contract maintained.

## Issues Encountered

- **Bucket name not pre-verified:** Research Open Question #1 (bucket name confirmation against live dashboard) was not resolved before execution. Upload succeeded at checkpoint so bucket exists with the name `player-photos`. If a future developer sets up a new Supabase project, they must ensure this bucket exists or update `PHOTO_BUCKET` in `src/lib/players/photo.ts`.

## Known Stubs

None — all player CRUD operations are fully wired. Photo upload degrades gracefully (player is created even if photo upload fails), but this is intentional design, not a stub.

## Threat Surface

All T-01-18 through T-01-25 threats addressed as specified in the plan threat register:
- T-01-18/19: requireCoachForPlayer/Division guards on all mutations
- T-01-20: MIME validation via PHOTO_ALLOWED_MIME Set (image/jpeg, image/png only)
- T-01-21: PHOTO_MAX_BYTES = 1,500,000 enforced server-side before Storage write
- T-01-22: Public bucket accepted per D-06; UUID-based path not guessable
- T-01-23: player_positions.updated_by = auth.uid() on every upsert
- T-01-24: Soft-delete reversibility accepted; no admin-only reactivate in Phase 1
- T-01-25: CSRF mitigated by SameSite=Lax Supabase auth cookies + session check on route handler

## Next Phase Readiness

- Player CRUD is complete: PLY-02 (create), PLY-03 (edit), PLY-04 (positions), PLY-06 (soft-delete) all closed
- Plan 01-05 (Attendance) can read the full player list via listByDivision and associate attendance records to player UUIDs
- PlayerWithPosition type from Plan 03 is enriched by the positions saved here
- No blockers for 01-05

---
*Phase: 01-foundation-players-attendance*
*Completed: 2026-05-28*
