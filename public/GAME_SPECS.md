# GAME_SPECS.md — Game Mechanics (Updated)

## 1. Rapid Math Game

### Objective
Solve as many randomly generated BODMAS expressions as possible in **120 seconds**.

### Session Config
| Parameter | Value |
|-----------|-------|
| Duration | 120 seconds |
| Input Type | On-screen number pad (always visible) + physical keyboard |
| Backspace/Delete | Supported |
| Submit | Enter key OR tap number pad Enter |
| Correct Feedback | Green border flash → **auto-advance** (no tap needed) |
| Wrong Feedback | Red border + shake + answer shown → **auto-advance after 800ms** |
| Difficulty Mix | Level 1 → 2 → 3 progression |

### Random Question Generator

All questions are **algorithmically generated** on the fly. No static question bank exists. Each session produces a unique, never-repeated sequence.

**Generation Algorithm (pseudo-code):**
```
function generateExpression(level):
  ops = getOpsForLevel(level)
  nums = getNumberRangeForLevel(level)
  terms = getTermCountForLevel(level)
  
  // Build AST randomly
  tree = buildRandomAST(terms, ops, nums)
  
  // Evaluate to ensure integer result
  result = evaluate(tree)
  if result is not integer OR result < 0:
    return generateExpression(level)  // retry
  
  return { expression: format(tree), answer: result }
```

**Level 1 — Basic**
- Operations: `+`, `-`, `×`
- Numbers: 1–9
- Max terms: 3
- No parentheses
- Result: always positive integer

**Level 2 — Intermediate**
- Operations: `+`, `-`, `×`, `÷`
- Numbers: 1–20
- Max terms: 5
- Parentheses: 30% of questions
- Division: only clean integer results (e.g., `12 ÷ 4` not `7 ÷ 3`)

**Level 3 — Advanced**
- All ops + nested parentheses
- Numbers: 1–30
- Multi-step with BODMAS traps
- Parentheses: 60% of questions
- Division: always integer result

**Guarantees:**
- Result is always a positive integer
- No decimals or fractions
- No intermediate negative results in mental calculation
- No two consecutive identical expressions in one session

### Difficulty Curve
- Questions 1–5: Level 1
- Questions 6–15: Level 2
- Questions 16+: Level 3

### Input & UX Flow
```
1. Question appears — expression centered on screen
2. On-screen number pad visible below input at all times
3. User types or taps numbers
4. Press Enter / tap ✓ on keypad to submit
5a. CORRECT → green border flash (300ms) → next question auto-loads
5b. WRONG → red border + shake (300ms) → "Answer: 36" shown 500ms → next question auto-loads
```

**On-Screen Keyboard Layout:**
```
[ 7 ] [ 8 ] [ 9 ]
[ 4 ] [ 5 ] [ 6 ]
[ 1 ] [ 2 ] [ 3 ]
[ ← ] [ 0 ] [ ✓ ]
```
- Key size: 64px × 56px minimum (thumb-friendly)
- Bg: #1F1F1F, active press: #2A2A2A
- ✓ key: #FF2D55 bg
- Always rendered below input — never hidden or collapsed

### Scoring
```
Correct answer:  +10 points
Fast bonus:      +5 if answered in < 5 seconds
Wrong answer:    0 (no penalty)
Session score = sum of all question points
```

### Metrics Recorded
```json
{
  "session_id": "uuid",
  "date": "2026-03-05",
  "timestamp": "08:32 PM",
  "questions_attempted": 34,
  "correct_answers": 28,
  "accuracy_pct": 82,
  "time_played_sec": 120,
  "score": 340
}
```

---

## 2. Memory Recall Game

### Objective
Test short-term memory by recalling words from a displayed list.

### Word Pool & Uniqueness Rules

**Pool Size:** 1,000 words total (across all categories)

**Weekly Rotation:**
- Each Monday at 00:00 IST, the active pool rotates
- User is served from the current week's pool
- Pool is a curated subset of the master dictionary

**Per-User Uniqueness (CRITICAL):**
- Word sequence for each session = seeded by `hash(user_id + date_string)`
- No two users share the same sequence on the same day
- Same word will not resurface for the same user within 2 weeks minimum
- Enforced by `user_word_history` table in Supabase (stores last seen date per word per user)

**Word Categories (200 words each, 5 × 200 = 1,000):**
- Animals: Tiger, Falcon, Otter, Lemur, Pangolin...
- Objects: Clock, Compass, Lantern, Hammer, Envelope...
- Places: Canyon, Harbor, Glacier, Marsh, Plateau...
- Actions: Climb, Sketch, Ferment, Whisper, Orbit...
- Abstract: Calm, Trust, Dread, Wonder, Tension...

### Session Structure

**Phase 1 — Display (20 seconds)**
- Show 50 unique words drawn from user's current pool
- Large readable font, flowing grid layout
- Countdown timer visible
- No interaction — memorize only

**Phase 2 — Recall (100 seconds)**
- All words hidden
- Text input at top + on-screen keyboard visible
- User types words one by one
- Press Enter to submit each word
- **Auto-advance / instant feedback:** correct word appears as green chip immediately
- Wrong / unrecognized words: silently dropped

### Fuzzy Match Validation

All recalled words pass through fuzzy matching before being accepted/rejected:

```
function checkWord(input, targetList):
  input_normalized = lowercase(trim(input))
  
  for each word in targetList:
    if not already_recalled(word):
      distance = levenshtein(input_normalized, lowercase(word))
      if distance <= 2:
        return { match: true, word: word }
  
  return { match: false }
```

**Examples of accepted fuzzy matches:**
- "tigger" → "tiger" ✓ (distance 1)
- "mountin" → "mountain" ✓ (distance 1)
- "compas" → "compass" ✓ (distance 1)
- "clok" → "clock" ✓ (distance 1)
- "cat" → "clock" ✗ (distance too high)

### Scoring
```
Per correct recalled word: +2 points
Bonus: +10 if recall ≥ 50% (25+ words)
Bonus: +20 if recall ≥ 80% (40+ words)
Session score = (correct_recall × 2) + bonuses
```

### Metrics Recorded
```json
{
  "session_id": "uuid",
  "date": "2026-03-05",
  "timestamp": "08:45 PM",
  "total_words": 50,
  "correct_recall": 18,
  "accuracy_pct": 36,
  "time_played_sec": 100,
  "score": 36,
  "fuzzy_matches": 3
}
```

---

## 3. Coloring Focus Game

### Objective
Mental calm and focus. Not competitive. No time pressure.

### Canvas Rules
- **Canvas background: #FFFFFF (white)** — coloring area only
- App chrome, toolbar, background: #0C0C0C (dark as usual)
- Outline image rendered as dark line art on white canvas
- User draws/colors with selected palette color

### Image Library
- 60 pre-set canvas images
- Mandala (15), Animals (15), Nature (15), Abstract/Geometric (15)

### Interaction Model
```
1. Browse image grid → select image
2. White canvas appears with dark outline overlay
3. Select color from bottom palette
4. Draw/color freely (finger or mouse)
5. Change color anytime from palette
6. Undo button: removes last stroke
7. Tap [Submit] button (fixed bottom right) when done
```

### Submit Button
- **Always visible** on the canvas screen
- Fixed bottom right of the bottom toolbar
- Style: #FF2D55 bg, #0C0C0C text, DM Sans 500 16px, 8px radius, 14px 28px padding
- Does NOT appear on any other game screen

### Canvas Implementation
- HTML5 Canvas, free-draw brush
- Image outline = permanent SVG overlay on white canvas
- Palette: 12 color swatches (bottom bar)
- Active swatch: 3px #FF2D55 ring

### Scoring
```
Completion 25–49%:  +5 points
Completion 50–74%:  +10 points
Completion 75–99%:  +15 points
Completion 100%:    +20 points
```

### Metrics Recorded
```json
{
  "session_id": "uuid",
  "date": "2026-03-05",
  "image_id": "mandala_07",
  "time_spent_sec": 492,
  "completion_pct": 78,
  "score": 15
}
```

---

## 4. Daily Scoring System

| Condition | Points |
|-----------|--------|
| Improved (today > yesterday) | +5 |
| Same (within ±2%) | 0 |
| Worse (today < yesterday) | -1 |
| Missed day | 0 |

**Daily Total = Math + Memory + Coloring + delta bonus**  
**Reset:** 00:00 IST daily
