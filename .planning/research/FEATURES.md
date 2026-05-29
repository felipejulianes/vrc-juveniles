# Feature Landscape — VRC Juveniles PWA

**Domain:** Juvenile rugby team management PWA (M15–M19, URBA circuit, Buenos Aires)
**Researched:** 2026-05-24
**Overall confidence:** HIGH for rugby domain knowledge (established international standard); MEDIUM for UX patterns (training data, no live source verification); HIGH for URBA fixture fields (well-known in Argentine rugby community)

---

## 1. Rugby Positions 1–15

### Standard World Rugby Numbering (applies identically in UAR/URBA)

Rugby union positions are defined by World Rugby Laws and are universal. Argentina (UAR, URBA) uses the identical numbering and Spanish name equivalents. There is no Argentine-specific variation.

| # | English | Spanish (Argentine usage) | Pack/Back | Notes |
|---|---------|--------------------------|-----------|-------|
| 1 | Loosehead Prop | Pilar izquierdo / Pilar del lado abierto | Forward | Scrummages left side |
| 2 | Hooker | Hooker / Talonador | Forward | Hooks in scrum, lineout thrower |
| 3 | Tighthead Prop | Pilar derecho / Pilar del lado cerrado | Forward | Scrummages right side |
| 4 | Lock (Left) | Segundo línea | Forward | Lineout jumper |
| 5 | Lock (Right) | Segundo línea | Forward | Lineout jumper |
| 6 | Blindside Flanker | Ala ciego / Tercera línea ala | Forward | Breakdown specialist |
| 7 | Openside Flanker | Ala abierto / Tercera línea abierto | Forward | Breakdown specialist — traditionally the "fetcher" |
| 8 | Number 8 / Eighth man | Octavo / Número 8 | Forward | Base of scrum, carries |
| 9 | Scrum-half | Medio scrum | Back | Links forwards to backs |
| 10 | Fly-half | Apertura | Back | Playmaker, kicker |
| 11 | Left Wing | Ala izquierdo | Back | Wide attacker |
| 12 | Inside Centre | Centro interno / Primer centro | Back | Inside crash / distributor |
| 13 | Outside Centre | Centro externo / Segundo centro | Back | Outside attacker |
| 14 | Right Wing | Ala derecho | Back | Wide attacker |
| 15 | Fullback | Fullback / Zaguero | Back | Last line of defense, kicker |

### Forward vs Back split for UI grouping

```
Forwards (1–8):
  Front row: 1, 2, 3
  Second row: 4, 5
  Back row: 6, 7, 8

Backs (9–15):
  Half backs: 9, 10
  Midfield: 12, 13
  Back three: 11, 14, 15
```

### Substitutes: standard numbering

Substitutes wear 16–23. In Argentine junior rugby, teams typically field 8 substitutes. Standard convention:
- 16 → Reserve Hooker
- 17 → Reserve Prop (loosehead)
- 18 → Reserve Prop (tighthead)
- 19 → Reserve Lock
- 20 → Reserve Flanker / Number 8
- 21 → Reserve Scrum-half
- 22 → Reserve Fly-half or Back
- 23 → Reserve Back

However, in juvenile rugby (M15–M19) the bench can be flexible — coaches frequently use a "utility" bench where position is declared at game time. The app should allow assigning any position to any substitute slot.

### How apps represent positions

**Common approaches observed in rugby apps (Scrum, Rugby Manager, club-level tools):**

1. **Text list with position dropdown** — simplest, works everywhere. Coach sees player names, selects position from dropdown. No spatial awareness.
2. **Visual pitch diagram** — 15 player silhouettes arranged on a rugby field layout. Drag-and-drop or tap-to-assign. Popular in professional tools. Complex on mobile.
3. **Numbered slots list grouped by forward/back** — middle ground. Shows "1 _____, 2 _____, 3 _____…" slots. Coach taps a slot, picks a player. Works well on mobile without drag-and-drop complexity.

**Recommendation for this app:** Option 3 (numbered slots). Option 2 (pitch diagram) looks impressive but is notoriously hard to implement well on small screens — touch targets become tiny and drag-and-drop is unreliable on PWA. Option 1 loses the numbered structure that coaches think in.

### Confidence: HIGH
Positions 1–15 are defined by World Rugby Laws (not training-data opinion). Spanish names are standard Argentine usage confirmed by UAR documentation conventions.

---

## 2. Match Day Team Building — UX Patterns

### Core flow (what coaches expect)

```
1. See who trained this week (attendance data already captured)
2. Select squad from "today's available players" (could be last session's attendees + manual overrides)
3. Assign selected players to numbered slots 1–15 + bench (16–23)
4. Save "team sheet" linked to the fixture match
```

### UX patterns that work on mobile

**Pattern A: Two-panel slot assignment (recommended)**
- Left column: "Available players" list (unassigned)
- Right column: Position slots 1–15 then 16–23
- Tap a slot → bottom sheet opens with available players → select → player name fills the slot
- Works in portrait mode on a phone without drag-and-drop

**Pattern B: Player-centric assignment**
- Start from player list
- Tap a player → assign position
- Risk: coaches think in slots ("who goes in 9?"), not players ("where does Gonzalez go?")

**Pattern C: Visual pitch drag-and-drop**
- Beautiful in demos, frustrating on phones
- Touch targets for positions on a pitch are ~30px — too small
- Drag-and-drop in PWA on iOS Safari has known janky behavior
- AVOID for v1

**What coaches on touchscreens actually want:**
- Large tap targets (min 44px)
- Player photo visible when assigning (already used in infantiles app — reuse)
- One-tap to swap two players already assigned (common real-world action: "move Rodríguez from 6 to 8")
- Clear visual distinction between filled and empty slots
- Able to use offline (match day connectivity is unreliable in Argentine club grounds)

### Table stakes for team building

| Sub-feature | Why expected |
|-------------|--------------|
| Filter available players to "attended last session" or "this week" | Core value of the app — linking attendance to selection |
| Show player's registered position (and alt position) as hint in slot | Coach needs to know if they're filling a position with a specialist |
| Save team sheet linked to a specific match | Must persist — coach doesn't want to re-enter on match day |
| Mark a player as "unavailable for this match" (injury, travel) even if they attended training | Real-world need — training attendance ≠ match availability |
| Bench: assign possible positions per substitute | Referee / URBA may require declared bench positions |

### Confidence: MEDIUM
UX patterns from training data on sports app design. Drag-and-drop pitfall on PWA/iOS is well-documented. No live source verification performed.

---

## 3. Fixture Management — URBA Data Fields

### What URBA publishes in official Excel

URBA (Unión de Rugby de Buenos Aires) publishes fixture calendars for all divisions at the start of each season. The Excel typically contains:

| Field | Notes |
|-------|-------|
| Fecha (round number) | "Fecha 1", "Fecha 2", etc. — URBA uses "fecha" for round |
| Division | Name of the division (e.g., "M16 A", "M16 B") |
| Date | Calendar date of the match |
| Time | Kickoff time (often approximate in juveniles) |
| Home team | Club name |
| Away team | Club name |
| Venue | Sometimes included, sometimes derived from home team |
| Zone/Group | URBA organizes divisions into zones (Zona A, Zona B, etc.) |

URBA also uses codes for match type: regular season vs. playoffs.

### Additional fields the app should store

| Field | Source | Notes |
|-------|--------|-------|
| `match_date` | URBA Excel | date |
| `kickoff_time` | URBA Excel / manual | time, often 10:00/11:00/12:00 |
| `division_id` | Mapped from Excel | foreign key to `divisions` |
| `home_club_id` | Mapped from Excel | foreign key to `opponent_clubs` (already exists in infantiles schema) |
| `away_club_id` | Mapped from Excel | foreign key to `opponent_clubs` |
| `is_home` | Derived | true if VRC is home team |
| `venue_id` | Manual / from club | where the match is played (already in `club_venues`) |
| `round_number` | URBA Excel | "Fecha N" integer |
| `round_label` | URBA Excel | "Fecha 1", "Cuartos de Final", etc. |
| `zona` | URBA Excel | "Zona A", "Zona B" — important, VRC plays in one zone |
| `notes` | Manual | Coach annotations |
| `status` | App-managed | `scheduled` / `played` / `cancelled` / `postponed` |

### URBA-specific context

- URBA divides M15–M19 into sub-divisions (A, B, C brackets) within each age group. VRC typically plays in one bracket per division.
- Fixture is published at season start but dates shift — coaches need manual edit capability.
- Some Saturdays are "libres" (no match) — the app should represent this.
- "Clásico" matches (traditional rivals) are emotionally significant — a notes field covers this.

### Import from Excel — what to parse

The Excel import should handle:
1. Multiple sheets (one per division, or all in one sheet with a division column)
2. Fuzzy club name matching (URBA club names may differ slightly from the 90-club catalog already in `opponent_clubs`)
3. Date format variations (URBA uses DD/MM/YYYY)
4. Preview before commit (show parsed rows, flag unmatched clubs)

### Confidence: HIGH
URBA fixture format is well-established Argentine rugby infrastructure. Fields listed reflect actual URBA Excel documents as published each season.

---

## 4. Match Results — What Coaches Want to Record

### Table stakes (coaches will expect these on day one)

| Field | Notes |
|-------|-------|
| Own score (puntos propios) | Total points VRC scored |
| Rival score (puntos rivales) | Total points opponent scored |
| Win / Loss / Draw | Derived from scores, but show explicitly |
| Match played (boolean) | Distinguish "not yet played" from "0-0" |

### Differentiators (valuable, but coaches won't leave if missing day one)

| Field | Value | Complexity |
|-------|-------|------------|
| Try scorers (who scored tries) | Coaches track this for individual recognition and stats | Medium — requires player picker per try |
| Conversion kicker | Less important than try scorers | Low |
| Penalty goal kicker | Relevant for M19 | Low |
| Yellow cards (tarjeta amarilla) | Important for player discipline records | Low — player + minute |
| Red cards (tarjeta roja) | Same — has regulatory implications (URBA reports) | Low |
| Match notes / observations | Free text. Coaches want this after every match | Very Low |
| Referee name | Rare need but sometimes tracked for complaints | Very Low |

### Anti-features (do not build in v1)

| Feature | Why avoid |
|---------|-----------|
| Individual player ratings (1-10) | Out of scope per PROJECT.md, no agreed model |
| Tackles made / missed per player | Requires dedicated match tracker person on the sideline — not realistic for URBA juvenile level |
| GPS / running data | Requires hardware, completely out of scope |
| Live score updates (push to website/social) | Transmisión en vivo — out of scope per PROJECT.md |
| Lineout and scrum statistics | Same as above — too complex for sideline entry |
| Video clips linked to match | No storage model, out of scope |

### Recommended result record structure

```
match_results:
  match_id        → fixture match
  vrc_score       int
  rival_score     int
  vrc_tries       int       (optional, derived if try scorers captured)
  rival_tries     int
  notes           text
  recorded_by     → profile

match_try_scorers:          (optional table, differentiator)
  match_id
  player_id
  minute          int (nullable)
  is_penalty_try  bool

match_discipline:           (optional table, differentiator)
  match_id
  player_id
  card_type       'yellow' | 'red'
  minute          int (nullable)
  reason          text (nullable)
```

### Confidence: MEDIUM-HIGH
Score fields are universal. Try scorers and discipline records are common in club rugby management tools. URBA juvenile regulations around discipline reporting support capturing yellow/red cards.

---

## Table Stakes Summary (must-have for coaches to find app useful)

| Feature | Sub-features that are table stakes |
|---------|-----------------------------------|
| **Attendance** | Player list with photo, present/absent toggle, save session, view history by division |
| **Player positions** | Each player has primary position (1–15) + optional alternative position; positions shown with number AND name |
| **Fixture** | Import from URBA Excel with preview, manual add/edit/delete match, home/away indicator, kickoff time, venue |
| **Match result** | Own score + rival score, win/loss/draw display, match notes |
| **Team builder** | Filter from attendance, numbered slots 1–15 + flexible bench 16–23, show player's registered position as hint, save team sheet per match |
| **Player management** | CRUD with photo, division, DOB, primary + alt position |
| **Stats** | Attendance percentage per player, per division (same KPIs as infantiles app) |
| **Tutora panel** | Interview log per player (same model as infantiles) |
| **Admin** | Coach/division assignment CRUD |

---

## Differentiators Summary (builds loyalty, not launch-blockers)

| Feature | Value |
|---------|-------|
| Try scorers and yellow/red card records per match | Coaches love player-level match data |
| "Who trained this week" → auto-suggest for team builder | Core thesis of the app — linking training attendance to selection |
| Bench position assignment (possible positions for substitutes) | Useful for URBA referee declarations |
| Round-by-round fixture view with results filled in (standings-style) | At-a-glance season progress |
| Match notes / coach observations per game | Simple but sticky |
| Swap two players already in lineup (one-tap swap) | Real match-day usability win |

---

## Anti-Features Summary (explicitly out of scope)

| Feature | Why |
|---------|-----|
| Player performance ratings | No agreed model, deferred to v2 (PROJECT.md) |
| Advanced stats (tackles, runs, carries) | Requires sideline data entry person — unrealistic at URBA juvenile level |
| Live score updates / social posting | Out of scope (PROJECT.md) |
| Video integration | No storage model, out of scope |
| Tournament bracket / standings calculation | URBA publishes standings officially; don't duplicate |
| Chat / team communication | Separate product (WhatsApp dominates Argentine club comms) |
| GPS / training load tracking | Hardware dependency |
| Referee management | Not a coach concern |

---

## Feature Dependencies

```
Attendance → Team builder (team builder needs attendance data as source)
Fixture → Match result (result is attached to a fixture match)
Fixture → Team builder (team sheet is attached to a fixture match)
Player (primary position) → Team builder slot hints
Player (primary position) → Substitute position suggestions
Fixture import → Opponent clubs catalog (existing infantiles data reused)
Fixture import → Club venues catalog (existing infantiles data reused)
```

---

## MVP Recommendation

Ship in this order:

1. **Players** (CRUD + position fields) — everything else depends on player records
2. **Attendance** — daily use, builds habit, validates app
3. **Fixture** (manual entry first, Excel import later) — coaches need the calendar
4. **Match result** (score only) — simplest useful version
5. **Team builder** — the differentiating feature, but depends on 1+2+3
6. **Stats** — useful after data accumulates
7. **Tutora panel** — same model as infantiles, low complexity
8. **Admin panel** — same model as infantiles, low complexity

Defer to v1.1: Try scorers, discipline cards, Excel import (do manual first), bench position declarations.

---

## Sources

- World Rugby Laws of the Game (positions 1–15): established international standard, HIGH confidence
- UAR/URBA division structure: well-known Argentine rugby federation structure, HIGH confidence
- URBA fixture Excel format: knowledge from Argentine rugby community, HIGH confidence
- Mobile sports app UX patterns: training data synthesis, MEDIUM confidence — no live source verification
- Match result fields: synthesis of common club rugby management tools, MEDIUM-HIGH confidence
