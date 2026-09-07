# PRD.md — BrainSharp (MVP v1) — Updated

## 1. Product Overview

**App Name:** BrainSharp  
**Tagline:** Fight brain rot. Train daily. Stay sharp.  
**Version:** MVP v1  
**Type:** Mobile-first web app (PWA)

### Core Philosophy
Short daily cognitive workout using 3 exercises:
1. Rapid Math
2. Memory Recall
3. Coloring Focus

**Goal:** Measure daily cognitive sharpness. No social pressure, no gamified retention — pure self-tracking.

---

## 2. Problem Statement

Excessive passive screen consumption degrades attention spans, working memory, and processing speed. Users need a short, structured, daily mental workout with zero fluff.

---

## 3. Target User

- Age: 18–45
- Concerned about attention/focus degradation
- Wants a lightweight daily habit (5–10 min/day)
- Does NOT want another gamified, notification-heavy app
- Self-motivated; data-driven

---

## 4. Goals & Non-Goals

### Goals
- Google OAuth login — save first name, age, city per user
- Deliver 3 functional mini-games (Math, Memory, Coloring)
- Track per-session metrics in Supabase per user account
- Show daily score with yesterday's comparison
- Web app (desktop + mobile optimized), PWA installable on mobile
- Keyboard-based answer input for Math (no multiple choice)

### Non-Goals (MVP)
- Social leaderboards
- Push notifications
- Subscriptions / monetization
- Native iOS/Android app

---

## 5. Core Features

### 5.1 Rapid Math Game
- Solve randomly generated BODMAS expressions in 120 seconds
- **Fully random question generation** — no fixed question bank; every session generates unique expressions algorithmically via a custom AST math generator
- **On-screen keyboard** always visible below input (number pad layout, mobile + desktop)
- **Auto-advance on correct answer** — next question rolls up automatically with green flash; zero tap required
- **Wrong answer UX:** red border on input box + shake animation; correct answer revealed briefly; auto-advance after 800ms
- Backspace and Delete supported
- Increasing difficulty: Level 1 → 2 → 3
- Metrics: Questions Attempted, Correct Answers, Accuracy %, Score

### 5.2 Memory Recall Game
- **Question pool: 1,000 words**, rotated on a **weekly basis** — user sees a fresh pool each week
- **Same word resurfaces only after a 2-week minimum** per individual user — enforced by per-user DB tracking
- **No two users share the same word sequence on any given day** — sequences are seeded by user_id + date hash, guaranteeing uniqueness across all users at all times
- Show words for 20 seconds → user recalls as many as possible
- **Fuzzy match validation** — submitted words validated via fuzzy logic (Levenshtein distance ≤ 2), so near-matches count as correct
- **Auto-advance on correct recall** — each correct word instantly appears as a green chip; no individual submit button
- Wrong / unrecognized words: silently ignored (no penalty UI)
- Metrics: Total Words, Correct Recall, Accuracy %

### 5.3 Coloring Focus Game
- Library of 60 pre-set images (mandala, animals, abstract, geometric)
- **Canvas background is white** — coloring area only; all app chrome stays dark (#0C0C0C)
- User selects image → color palette → draws/colors freely (finger or mouse)
- **Submit button** fixed and always visible at the bottom of the coloring canvas
- Metrics: Time Spent, Completion %, Score

---

## 6. UX Interaction Rules (Global)

| Trigger | Behavior |
|---------|----------|
| Correct answer (Math) | Green border flash → auto-advance to next question |
| Wrong answer (Math) | Red border on input + shake + answer revealed → auto-advance after 800ms |
| Correct word (Memory) | Word appears as green chip instantly |
| On-screen keyboard | Always visible on Math game (number pad below input) |
| Fuzzy match (Memory) | Levenshtein distance ≤ 2 counts as correct |
| Submit button | Only on Coloring canvas — fixed at bottom |

---

## 7. Daily Scoring System

| Result | Points |
|--------|--------|
| Improved | +5 |
| Same | 0 |
| Worse | -1 |
| Missed day | 0 |

**Total Daily Score:** Sum across all 3 games  
**Reset Logic:** Points reset at 00:00 IST every day

---

## 8. Session & Leaderboard Logic

- Multiple sessions within 1 hour → only highest score shown
- All sessions stored in DB; best displayed
- Data stored per: Date, Timestamp, Score, Accuracy

---

## 9. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14.2.15 | React app router + SSR + PWA |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS 3.4 | Responsive design |
| Database | Supabase | Auth (Google) + Postgres |
| Hosting | Vercel | Deploys |
| Fuzzy Match | `fuse.js` / custom Levenshtein | Memory recall validation |
| Math Engine | Custom AST generator | Random unique BODMAS expressions |

---

## 10. MVP Constraints

- No payment wall
- No onboarding tutorial beyond 1 screen
- Coloring game: not competitive, no score pressure
- Coloring canvas is white; all other surfaces remain dark (#0C0C0C)
