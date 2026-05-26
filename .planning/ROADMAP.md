# Roadmap: VRC Juveniles

## Overview

Four phases deliver the app in dependency order. Phase 1 builds the foundation: players with position fields and attendance — the daily-use core that validates the app with coaches. Phase 2 adds the fixture calendar with URBA Excel import and result recording, which is the prerequisite for everything match-day. Phase 3 delivers the differentiating feature: the match-day team builder that links attendance, positions, and fixture into a single coach workflow. Phase 4 closes the loop with attendance stats, the tutora interview panel, and fixture polish. All phases share the same Supabase instance as the live infantiles app — migrations are additive-only throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation, Players & Attendance** - App installable; coaches take attendance and manage player profiles with positions
- [ ] **Phase 2: Fixture Management** - Coaches view match calendar, record results; admin imports URBA Excel with preview-before-commit
- [ ] **Phase 3: Team Builder** - Coaches build a match-day team sheet from recent attendees, assign positions 1-15 and bench
- [ ] **Phase 4: Stats, Tutora & Polish** - Attendance stats per player/division, tutora interview log, fixture season view

## Phase Details

### Phase 1: Foundation, Players & Attendance
**Goal**: Coaches can log in, manage player profiles with registered positions, and take attendance at training sessions
**Depends on**: Nothing (first phase)
**Requirements**: PLY-01, PLY-02, PLY-03, PLY-04, PLY-05, PLY-06, PLY-07, ATT-01, ATT-02, ATT-03, ATT-04, ADM-01
**Success Criteria** (what must be TRUE):
  1. Coach can log in and see only their assigned divisions; a newly created account with no division assignment sees the "pending activation" screen
  2. Coach can create, edit, and view a player profile including photo, registered position (1-15) and an optional alternative position
  3. Inactive players (inactivo=true) appear at the bottom of the player list without being removed
  4. Coach can take attendance at a training session, edit a past session, and the data saves correctly even when the device goes offline (syncs on reconnect)
  5. Coach can browse the session history for their division and see who attended each session
  6. Admin can create coach accounts and assign them to M15-M19 divisions
**Plans**: TBD

### Phase 2: Fixture Management
**Goal**: Coaches and admins can build and maintain the match calendar, record final scores, and import the URBA schedule from Excel
**Depends on**: Phase 1
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, ADM-02, ADM-03
**Success Criteria** (what must be TRUE):
  1. Coach can view the upcoming and past matches for their division ordered by date
  2. Coach or admin can manually add or edit a match (date, opponent, home/away, venue, division)
  3. Admin can upload a URBA Excel file and see a preview of parsed matches before confirming the import
  4. Coach can record the final score of a played match (own goals and opponent goals)
  5. Admin can see the full fixture across all divisions
**Plans**: TBD
**UI hint**: yes

### Phase 3: Team Builder
**Goal**: Coaches can build a match-day team sheet for a specific fixture match, drawing from players who attended recent training
**Depends on**: Phase 2
**Requirements**: TBL-01, TBL-02, TBL-03, TBL-04, TBL-05, TBL-06
**Success Criteria** (what must be TRUE):
  1. Coach can open the lineup builder for a specific fixture match and see which players attended the most recent training session highlighted first
  2. Coach can assign players to positions 1-15 (starters) using tap-to-place on mobile; the player's registered position appears as a hint in each slot
  3. Coach can assign bench players (16-23) indicating which positions they can cover
  4. The completed team sheet is saved and visible to all coaches of the same division without re-entering data
  5. A coach on a real iPhone in PWA standalone mode can complete a full lineup in under two minutes without the app freezing or losing selections
**Plans**: TBD
**UI hint**: yes

### Phase 4: Stats, Tutora & Polish
**Goal**: Coaches can review attendance statistics, tutoras can log player interviews, and the fixture view shows season progress at a glance
**Depends on**: Phase 3
**Requirements**: ATT-05, TUT-01, TUT-02, TUT-03, TUT-04
**Success Criteria** (what must be TRUE):
  1. Coach can view attendance stats for their division: overall percentage, per-player breakdown, and a trend chart across recent sessions
  2. Tutora can log in with her existing infantiles account and see the full list of juvenile players (M15-M19)
  3. Tutora can record and review interview entries for any juvenile player
  4. The fixture list shows results for played matches inline, giving a clear view of season progress by round
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Players & Attendance | 0/TBD | Not started | - |
| 2. Fixture Management | 0/TBD | Not started | - |
| 3. Team Builder | 0/TBD | Not started | - |
| 4. Stats, Tutora & Polish | 0/TBD | Not started | - |
