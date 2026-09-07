# BUILD_ORDER.md — Development Sequence (Updated)

## Guiding Principles
- Ship playable vertical slice first (one game end-to-end)
- Never build DB schema after UI — schema first
- Each phase = shippable increment

---

## Phase 0 — Foundation (Day 1–2)

**Goal:** Project skeleton, auth working, DB live

1. Init Next.js 14 + TypeScript + Tailwind
2. Configure Supabase project
3. Create all DB tables:
   - `users`
   - `sessions`
   - `daily_scores`
   - `word_pool`
   - `user_word_history`
   - `math_question_log`
4. Google OAuth via Supabase Auth
5. Deploy to Vercel (preview URL live)
6. Onboarding screen (Screen 02) — save name, age, city

**Done when:** Google login works, user row created, onboarding saves.

---

## Phase 1 — Math Game (Day 3–5)

**Goal:** Fully playable math game with random question generation

1. Build random BODMAS expression generator (AST-based):
   - Level 1 (basic)
   - Level 2 (intermediate)
   - Level 3 (advanced)
   - Guarantee: positive integer results, no decimals
2. Math pre-game screen (Screen 06)
3. Math active screen (Screen 07):
   - Expression display
   - Answer input (red caret, focus glow)
   - **On-screen number pad** (always visible, never hidden)
   - Timer bar (3px, flush top, #FF2D55)
   - Correct → green border flash → **auto-advance** (no tap)
   - Wrong → red border + shake → answer reveal → **auto-advance 800ms**
4. Math result screen (Screen 08)
5. Store session in Supabase
6. Home tile updates with last score

**Done when:** Full math game plays, stores score, on-screen keyboard always visible.

---

## Phase 2 — Memory Game (Day 6–9)

**Goal:** Memory game with unique-per-user word sequences and fuzzy matching

1. Seed `word_pool` table with 1,000 words (5 categories × 200)
2. Build word sequencing engine:
   - `hash(user_id + date)` seeded shuffle
   - Filter words seen within last 14 days (`user_word_history`)
   - Guarantee: no two users share sequence on same day
3. Memory pre-game screen (Screen 09)
4. Word display phase (Screen 10) — 20s countdown, 50 words
5. Recall phase (Screen 11):
   - Input + **QWERTY on-screen keyboard** (always visible)
   - Fuzzy match validator (Levenshtein ≤ 2, short-word protection)
   - Correct word → green chip appears instantly (**auto-advance** pattern)
   - Wrong word → silently ignored
6. Memory result screen (Screen 12)
7. Update `user_word_history` after session
8. Store session in Supabase

**Done when:** Word sequences are unique per user, fuzzy match works, chips auto-appear.

---

## Phase 3 — Coloring Game (Day 10–12)

**Goal:** Coloring game with white canvas, free draw, submit button

1. Prepare 60 outline images (SVG line art)
2. Image picker screen (Screen 13) — grid + category filters
3. Coloring canvas (Screen 14):
   - **Canvas background = #FFFFFF** (white only, app chrome stays dark)
   - Free-draw HTML5 Canvas
   - SVG outline overlay
   - Bottom toolbar: undo + 12 color swatches
   - **Submit button fixed bottom-right** (only place in app)
   - Completion % estimation via pixel sampling
4. Coloring result screen (Screen 15)
5. Store session in Supabase

**Done when:** Canvas is white, coloring works, submit button always visible.

---

## Phase 4 — Home & Scoring (Day 13–14)

**Goal:** Home screen states, score card, daily delta

1. Home: First time user (Screen 03)
2. Home: Returning, no score today (Screen 04)
3. Home: Score exists today (Screen 05):
   - Score card: TODAY / YESTERDAY / BEST
   - Delta message (#00F5A0 "↑ Up from yesterday" or "Voilà" for first game)
   - Played tile = 3px #FF2D55 left stripe
4. Daily delta calculation (00:00 IST reset)
5. `daily_scores` table upsert logic
6. Session deduplication (highest score within 1 hour)

**Done when:** All 3 home states render correctly with live data.

---

## Phase 5 — Leaderboard & History (Day 15–16)

1. Leaderboard with data (Screen 16)
2. Leaderboard empty state (Screen 17)
3. History with data (Screen 18) — 7 day rows, expandable sessions
4. History empty state (Screen 19)
5. Date picker on leaderboard
6. Error state (Screen 21) — for failed API loads

**Done when:** Both screens show real data, handle empty and error states correctly.

---

## Phase 6 — Polish & Error States (Day 17–18)

1. Toast: session save failed + retry (Screen 20)
2. Modal: session expired mid-game (Screen 22)
3. Login error state (Screen 01B)
4. Onboarding validation errors (Screen 02C)
5. Network offline handling — offline play for Math and Coloring
6. Loading skeletons for all async screens

---

## Phase 7 — PWA & Deploy (Day 19–20)

1. `manifest.json` — icons, theme color #0C0C0C, display standalone
2. Service worker — cache game assets + word pool
3. `meta` tags for mobile viewport
4. Test install on iOS Safari and Android Chrome
5. Final Vercel production deploy
6. Smoke test all 22 screens

---

## Tech Decisions Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| Math questions | AST generator (custom) | Infinite unique questions, no DB needed |
| Fuzzy match | Custom Levenshtein OR `fuse.js` | Levenshtein is simpler; fuse.js is battle-tested |
| Word seeding | `hash(userId + date)` | Deterministic, reproducible, unique per user per day |
| Canvas bg | `#FFFFFF` CSS on canvas element | Separate from app bg which stays dark |
| On-screen keyboard | Always rendered in DOM | Never toggled off — always available |
| Auto-advance | `setTimeout` after result flash | Zero user tap needed on correct/wrong |
| Session dedup | DB trigger or app-level `is_best_of_hour` flag | Clean leaderboard display |
