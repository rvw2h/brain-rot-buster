# BrainSharp — Aura Farm Mode PRD (Refined)
> Aligned with current app state (V5), existing design system, and DB schema.
> For coding agents and product reference.

---

## PRODUCT PHILOSOPHY

**Simple Mode** = calm, low-pressure daily brain maintenance. Current default.
**Aura Farm Mode** = high-intensity, negative marking, time pressure, self-competition.

These are two modes of the same app — not two separate apps.
Users toggle between them from the Home screen.
Mode persists in localStorage until the user changes it.

---

## DESIGN SYSTEM — BASE TOKENS (unchanged for both modes)

- bg: `#0C0C0C`, surface: `#161616`, elevated: `#1F1F1F`
- Red: `#FF2D55`, green: `#00F5A0`
- Fonts: Space Grotesk (headings), DM Sans (body), JetBrains Mono (numbers)

---

## VISUAL DESIGN — SIMPLE MODE

No changes from current. Calm, minimal, clean.
- Neutral surface cards, soft borders
- Timer bar: thin, red, drains quietly
- Input: subtle border glow on focus
- No aggressive animations
- Score in white

---

## VISUAL DESIGN — AURA FARM MODE

Aura mode must **feel** different the moment it loads. Same dark base, but the entire UI shifts into a high-pressure, high-energy state. Every screen, every interaction, every transition should signal "this is serious."

---

### GLOBAL — applies to all Aura screens

**Background**
- Base stays `#0C0C0C` but add a very subtle red radial gradient at the top:
  ```css
  background: radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,45,85,0.08) 0%, transparent 70%), #0C0C0C;
  ```
- This creates a barely-visible red "heat" emanating from top — subconsciously signals intensity

**Mode badge**
- Fixed top-right corner of every game screen (not home)
- Text: `AURA` in Space Grotesk 9px, letter-spacing 0.2em, uppercase
- Color: `#FF2D55`
- Background: `rgba(255,45,85,0.12)`
- Border: `1px solid rgba(255,45,85,0.25)`
- Border radius: 4px
- Padding: `2px 6px`

**Surface cards**
- Border changes from `rgba(255,255,255,0.08)` → `rgba(255,45,85,0.15)`
- Adds red tint to card edges — makes everything feel "activated"

**Score counter**
- In Simple Mode: white text
- In Aura Mode: `#FF2D55` when positive, `#888888` when zero or negative
- Font size bumped: Space Grotesk 32px (vs 26px in Simple)
- Score changes trigger a quick `scale(1.15)` pulse animation on update (150ms ease-out)

**Bottom nav**
- Active icon in Aura mode: stays `#FF2D55` but adds a red glow below: `text-shadow: 0 0 8px rgba(255,45,85,0.6)`

---

### HOME SCREEN — Aura Mode

**Mode toggle**
```
[ Simple Mode ]  [ Aura Farm Mode ]
```
- Full width pill toggle, sits below score card
- Active (Aura): `#FF2D55` bg, `#0C0C0C` text, Space Grotesk 12px 600
- Inactive (Simple): `#1F1F1F` bg, `#555555` text
- Toggle has a 200ms slide animation between states
- When switching TO Aura: the entire home screen does a very brief (300ms) red pulse overlay — `rgba(255,45,85,0.05)` flashes once — signals mode change

**Game cards in Aura mode**
- Card border: `1px solid rgba(255,45,85,0.2)` (vs `rgba(255,255,255,0.08)` in Simple)
- Top-right corner of each card: small `AURA` badge (same style as global badge above)
- Subtitle text: changes to reflect Aura rules
  - Math card: `"10s per question · negative marking"`
  - Memory card: `"Type to recall · wrong = -1pt"`
- Card background: `#161616` with very subtle red gradient at top edge:
  ```css
  background: linear-gradient(180deg, rgba(255,45,85,0.05) 0%, #161616 30%);
  ```

**Score card in Aura mode**
- TODAY score label changes to `AURA SCORE` in `#FF2D55`
- Thin red bottom border on the card: `border-bottom: 1px solid rgba(255,45,85,0.3)`

---

### MATH GAME — Aura Mode Screens

**Pre-game screen**
- Heading: `"Lock in."` (vs "Solve as many as you can" in Simple)
- Sub: `"10 seconds per question. One shot."`
- Start button: larger, `#FF2D55` bg, Space Grotesk 14px 600, wider padding
- Small warning line below button: `"Wrong answers cost you points."` — DM Sans 11px `#FF2D55` at 60% opacity

**Playing screen — header**
- Left: `AURA` badge
- Right: running score — large, `#FF2D55` if positive
- Below header: overall session timer bar (thin, `#333333` track, `#FF2D55` fill, drains over 120s)

**Per-question timer bar**
- Full-width bar directly ABOVE the expression card
- Height: 3px
- Track: `#222222`
- Fill: starts `#FF2D55`, full width, depletes left-to-right over 10 seconds
- At 5s: bar starts pulsing (opacity oscillates 1.0 → 0.6 → 1.0 at 0.5s interval)
- At 3s: fill color shifts to bright `#FF453A` (more orange-red), pulse stops, solid and urgent
- At 0s: bar flashes white briefly then empties — triggers timeout

**Expression card**
- Background: `#161616`
- Border: `1px solid rgba(255,45,85,0.2)`
- Box shadow: `0 0 16px rgba(255,45,85,0.1)`
- Expression text: JetBrains Mono 28px (vs 26px Simple), `#F2F2F2`
- Card has a very subtle red inner glow at top edge

**Input field**
- Default border: `rgba(255,45,85,0.2)` (always slightly red in Aura — even at rest)
- Focus: `rgba(255,45,85,0.6)` + glow `0 0 0 2px rgba(255,45,85,0.35)`

**Correct answer feedback**
- Input border flashes `#00F5A0` for 200ms
- Score counter scales up (1.15x) and back
- A `+10` text appears above the score counter, floats upward and fades out over 500ms
- Color: `#00F5A0`, DM Sans 13px bold

**Wrong answer feedback**
- Full viewport red overlay: `rgba(255,45,85,0.08)` flashes for 150ms (covers entire screen)
- Input shakes (existing shake animation, keep it)
- Input border stays red for 300ms then returns to default Aura red
- A `-5` text appears above the score counter, floats upward and fades — color `#FF2D55`
- Next question loads after 300ms (faster than feedback fade — feels relentless)

**Timeout feedback**
- Same as wrong answer visually
- Timeout label: small `TIMEOUT` text flashes briefly above the expression in `#FF2D55` 9px uppercase before next question loads

**Result screen — Aura**
- Heading: `"Aura check."` above the score
- Score: `#FF2D55` if positive, `#888888` if zero or negative
- Stats row: attempted · correct · wrong · accuracy · avg time (5 columns)
- Below stats: last session score + delta (existing pattern)
- If score is positive AND beats last session: confetti (existing)
- If score is negative: no confetti. Show message: `"Stay locked in. Try again."` — DM Sans 13px `#888888`
- Play Again button: `#FF2D55` bg, `"Go again →"` label

---

### MEMORY GAME — Aura Mode Screens

**Pre-game screen**
- Heading: `"Remember everything."`
- Sub: `"50 words. Wrong answers cost you."`
- Start button: same Aura style as Math pre-game

**Display phase**
- Same 2-column word grid as Simple Mode
- Border of each word pill: `rgba(255,45,85,0.15)` instead of default
- Timer display: `#FF2D55` countdown, larger — JetBrains Mono 16px
- At 5s remaining: timer pulses red

**Recall phase**
- Input field: same Aura-red default border
- Correct chip: same green as Simple
- Wrong chip: same red as Simple BUT add floating `-1` text that rises from the chip and fades (same pattern as Math wrong feedback)
- Duplicate chip: flashes `#FFD60A` (yellow) briefly, no score change, no animation

**Result screen — Aura**
- Same structure as Math result but shows:
  - Correct recall count
  - Wrong entries count
  - Accuracy %
  - Final score
  - Last session delta

---

### ANIMATIONS — CSS KEYFRAMES NEEDED

Add these to global CSS / Tailwind config:

```css
/* Floating score delta (+10, -5) */
@keyframes float-up-fade {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-24px); }
}
.animate-float-up { animation: float-up-fade 500ms ease-out forwards; }

/* Screen flash (red for wrong, green for correct) */
@keyframes screen-flash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
.animate-screen-flash { animation: screen-flash 150ms ease-out forwards; }

/* Score counter pulse on change */
@keyframes score-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.animate-score-pulse { animation: score-pulse 150ms ease-out; }

/* Timer bar pulse at low time */
@keyframes timer-pulse {
  0%   { opacity: 1; }
  50%  { opacity: 0.5; }
  100% { opacity: 1; }
}
.animate-timer-pulse { animation: timer-pulse 0.5s ease-in-out infinite; }

/* Mode switch overlay */
@keyframes mode-switch-flash {
  0%   { opacity: 0.05; }
  50%  { opacity: 0.08; }
  100% { opacity: 0; }
}
.animate-mode-flash { animation: mode-switch-flash 300ms ease-out forwards; }
```

---

### VISUAL COMPARISON — SIMPLE vs AURA

| Element | Simple Mode | Aura Farm Mode |
|---------|-------------|----------------|
| Background | `#0C0C0C` solid | `#0C0C0C` + red radial gradient at top |
| Card border | `rgba(255,255,255,0.08)` | `rgba(255,45,85,0.15)` |
| Card shadow | none | `0 0 16px rgba(255,45,85,0.1)` |
| Score color | `#F2F2F2` white | `#FF2D55` red (if positive) |
| Score size | 26px | 32px |
| Input border (default) | `rgba(255,255,255,0.08)` | `rgba(255,45,85,0.2)` |
| Timer bar | thin, quiet | thick, pulsing at low time |
| Wrong answer | red border + shake | screen flash + shake + floating `-5` |
| Correct answer | green border + auto advance | green flash + floating `+10` + score pulse |
| Pre-game copy | calm, instructional | intense, direct |
| Result screen | neutral | score-dependent message |
| Mode badge | none | `AURA` badge top-right |
| Bottom nav active | `#FF2D55` icon | `#FF2D55` icon + red glow |

---

## NAVIGATION CHANGES

### Current bottom nav (3 icons)
Home · History · Profile

### New bottom nav (4 icons)
Home · Relax · History · Profile

**Relax tab** (new):
- Icon: 🎨 or paint brush SVG
- Route: `/relax`
- Contains only the Coloring Game
- Coloring game moves entirely out of the Home screen game cards
- Home screen game cards become: Rapid Math + Memory Recall only

**Leaderboard** — stays removed from nav (as per V4 decision). Keep route but not in nav.

---

## HOME SCREEN CHANGES

### Mode toggle
Add a segmented toggle below the score card:

```
[ Simple Mode ]  [ Aura Farm Mode ]
```

- Pill-style toggle, full width of score card
- Active mode: `#FF2D55` background, `#0C0C0C` text
- Inactive: `#1F1F1F` background, `#888888` text
- Space Grotesk 12px 500 weight
- Saves selected mode to localStorage key `bs_mode` — value `'simple'` or `'aura'`
- Switching mode does NOT reset scores or end current session

### Game cards (updated)
Only show two game cards on Home:
- Rapid Math
- Memory Recall

Coloring Focus card removed from Home — it lives in the Relax tab now.

### Mode-aware game cards
When Aura Farm Mode is active, game cards show a subtle indicator:
- Small red `AURA` badge top-right of each card
- Subtitle text changes to reflect Aura rules (e.g. "10s per question · negative marking")

---

## SIMPLE MODE — CHANGES FROM CURRENT

The uploaded PRD proposes changes to Simple Mode memory game. Adopt these:

### Memory Game — Simple Mode (updated mechanic)
**Current:** Show 50 words → recall by typing
**New:** Show 25 words → move to selection screen showing 50 total words → user taps to select the original 25

**Display phase:**
- Show 25 words in 2-column layout (existing style)
- 20 seconds to memorise (same timer)

**Recall phase (new — selection UI):**
- Show a grid of 50 words — the original 25 mixed with 25 distractors
- Distractors: words from the same pool, not shown in display phase
- User taps words they recognise from the display phase
- Selected word: green chip highlight
- Deselected: tap again to remove
- No timer on selection phase — take as long as needed
- Submit button appears after at least 1 word selected

**Scoring — Simple Mode Memory:**
- Correct selection: +2 points each
- No negative marking
- Max score: 50 points (25 correct × 2)

### Math Game — Simple Mode (no change from current)
- Existing BODMAS questions, existing rules
- No per-question timer
- No negative marking
- Auto-submit on correct answer (existing)
- Stay on wrong answer until corrected or time runs out (existing)

---

## AURA FARM MODE — MATH GAME

### Rules
- Overall session timer: 120 seconds (same as Simple Mode)
- Per-question timer: 10 seconds, shown as a countdown bar above the question
- One attempt per question — submit fires automatically when user taps ✓ or Enter
- Wrong answer: -5 points, next question immediately (no staying on same question)
- Timeout (10s elapsed): counts as wrong, -5 points, next question
- Correct answer: +10 points, next question immediately

### Question difficulty
Harder than Simple Mode — more brackets, larger numbers:
- Level 1: 3-term expressions with brackets e.g. `(8 + 4) × 3`
- Level 2: 4-term with nested ops e.g. `15 ÷ (3 + 2) × 4`
- Level 3: 5-term complex e.g. `(12 - 3) × (2 + 1) + 8 ÷ 4`
- Same operator constraints as Simple Mode: max 1 division, max 2 multiplication, results must be positive integers

### Per-question timer UI
- Thin bar directly above the expression, full width
- Starts full `#FF2D55`, depletes left to right over 10 seconds
- At 5s remaining: bar pulses
- At 3s remaining: bar turns solid bright red, no pulse — urgency signal
- When bar empties: auto-submit with wrong answer state

### Score display during game
- Running score shown top-right (can go negative)
- Shows in `#FF2D55` if positive, `#888888` if zero or negative

### Result screen — Aura Mode
Show all metrics:
- Final score (large, red — same as existing)
- Questions attempted
- Correct answers
- Wrong answers
- Accuracy %
- Average response time (ms tracked per question, averaged)
- Last session score + delta (same as existing)
- Confetti only if score is positive AND beats last session

---

## AURA FARM MODE — MEMORY GAME

### Rules
- Display phase: 50 words shown, 20 seconds (same as current)
- Recall phase: type words manually — same as current Simple Mode recall
- No word bank shown — pure recall
- Scoring with negative marking:
  - Correct word: +4 points
  - Incorrect word (not in the 50): -1 point
  - Duplicate entry: 0 points, show "already entered" chip state
- Recall timer: 100 seconds (same as current)

### Wrong entry chip (Aura Mode only)
- Wrong chips persist for session (same as current behaviour)
- Show `-1` deduction animation briefly on wrong entry: small `-1` text floats up from chip and fades out

### Duplicate entry handling
- If user types a word already in their recalled set: chip briefly flashes yellow `#FFD60A` — no score change
- Input clears, no penalty

### Result screen — Aura Mode Memory
- Final score
- Correct recall count
- Wrong entries count
- Accuracy %
- Last session score + delta
- Confetti if beats last session AND score is positive

---

## RELAX TAB — COLORING GAME

The coloring game moves to its own tab. No gameplay changes — all V4/V5 changes remain.

### Relax screen structure
```
Header: "Relax" — Space Grotesk 22px bold
Sub: "Pick a canvas and breathe." — DM Sans 13px #888888

[Image picker grid — existing]

On canvas: existing toolbar (brush sizes, eraser, colours, zoom)
No timer shown on canvas (existing)
Result: time spent only, no score (existing)
```

No bottom nav on canvas screen (full screen painting experience).
Back arrow returns to Relax tab picker, not Home.

---

## DB SCHEMA CHANGES

### 1. Update `sessions` table — add `mode` column

```sql
ALTER TABLE public.sessions
ADD COLUMN mode TEXT DEFAULT 'simple' NOT NULL;
-- values: 'simple' | 'aura'
```

This records which mode the session was played in. Allows future analytics on Simple vs Aura usage.

### 2. Update `daily_scores` table — add Aura score columns

```sql
ALTER TABLE public.daily_scores
ADD COLUMN aura_math_score    INT DEFAULT 0,
ADD COLUMN aura_memory_score  INT DEFAULT 0,
ADD COLUMN aura_total_score   INT GENERATED ALWAYS AS
  (COALESCE(math_score,0) + COALESCE(memory_score,0) +
   COALESCE(coloring_score,0) + COALESCE(aura_math_score,0) +
   COALESCE(aura_memory_score,0)) STORED;
```

Wait — the existing `total_score` is a generated column. Drop and recreate:

```sql
ALTER TABLE public.daily_scores
DROP COLUMN total_score;

ALTER TABLE public.daily_scores
ADD COLUMN aura_math_score   INT DEFAULT 0,
ADD COLUMN aura_memory_score INT DEFAULT 0;

ALTER TABLE public.daily_scores
ADD COLUMN total_score INT GENERATED ALWAYS AS (
  COALESCE(math_score, 0) +
  COALESCE(memory_score, 0) +
  COALESCE(coloring_score, 0) +
  COALESCE(aura_math_score, 0) +
  COALESCE(aura_memory_score, 0) +
  COALESCE(delta_bonus, 0)
) STORED;
```

### 3. Update `users` table — add last Aura score columns

```sql
ALTER TABLE public.users
ADD COLUMN last_aura_math_score   INT DEFAULT 0,
ADD COLUMN last_aura_memory_score INT DEFAULT 0;
```

### 4. Update `math_question_log` — add mode and per-question timer

```sql
ALTER TABLE public.math_question_log
ADD COLUMN mode            TEXT DEFAULT 'simple',
ADD COLUMN timed_out       BOOLEAN DEFAULT false;
-- timed_out: true if the 10s per-question timer expired in Aura mode
```

### 5. Run all in Supabase SQL Editor in this order:
1. Add `mode` to `sessions`
2. Drop and recreate `total_score` on `daily_scores` (do this carefully — backup first)
3. Add aura score columns to `daily_scores`
4. Add last aura score columns to `users`
5. Add `mode` and `timed_out` to `math_question_log`

---

## FRONTEND — MODE STATE MANAGEMENT

### localStorage
- Key: `bs_mode` — value: `'simple'` | `'aura'`
- Read on Home, MathGame, MemoryGame mount
- Written when user taps mode toggle on Home

### Mode-aware routing
No new routes needed. Same routes `/math` and `/memory` — both games read `bs_mode` from localStorage and render accordingly.

### Props/context pattern
- Read `bs_mode` at the top of `MathGame.tsx` and `MemoryGame.tsx`
- Use it to switch: timer logic, scoring logic, question difficulty level, UI theme elements
- Do not create separate route files for Aura mode — keep it conditional within existing files

---

## IMPLEMENTATION ORDER

```
1. DB migrations — run SQL in Supabase (Section: DB Schema Changes)
2. Add Relax tab to bottom nav, move ColorGame to /relax route
3. Remove ColorGame card from Home screen
4. Add mode toggle to Home screen, wire to localStorage
5. MathGame — add Aura mode: per-question timer, negative marking, auto-advance on wrong
6. MemoryGame — add Aura mode: negative marking, duplicate detection, -1 float animation
7. MemoryGame Simple Mode — swap recall mechanic to selection grid
8. Aura mode visual treatments — glow, pulse, flash, AURA badge
9. Result screens — add mode-specific metrics
10. Wire mode to sessions table write (pass mode value when inserting)
11. Test both modes end to end for Math and Memory
12. Test Relax tab coloring game independently
```

---

## TESTING CHECKLIST

| Flow | Expected |
|------|----------|
| Toggle to Aura mode | Home cards show AURA badge, subtitle updates |
| Aura Math — correct | +10, next question immediately, green flash |
| Aura Math — wrong | -5, next question immediately, red flash |
| Aura Math — timeout | -5, next question, bar empties visually |
| Aura Math — score goes negative | Score shown in `#888888` |
| Aura Memory — correct word | +4, green chip |
| Aura Memory — wrong word | -1, red chip, -1 float animation |
| Aura Memory — duplicate | Yellow chip flash, 0 points |
| Simple Memory — selection grid | 50 words shown, tap to select, submit |
| Relax tab | Coloring game loads, no score, time tracked |
| Session DB write | `mode` column populated correctly |
| Daily scores | Aura scores in separate columns, total updated |
