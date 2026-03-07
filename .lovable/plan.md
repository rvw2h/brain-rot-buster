

## Plan: Implement CHANGES_V2.md — Full App Overhaul

This is a large set of changes spanning nearly every screen, the navigation, game logic, a new Profile page, and DB schema additions. Here is the implementation plan organized by priority.

---

### 1. Copy Logo Asset
Copy the uploaded logo image to `public/logo.png` for use on the Login screen.

### 2. Bottom Nav — Replace Leaderboard with Profile
- Remove Leaderboard tab, add Profile tab (`/profile`) with a User icon
- Keep Home + History, result: Home | History | Profile
- Active = `#FF2D55` + red dot, inactive = `#444` at 50% opacity, no labels

### 3. Login Screen Overhaul
- Add logo image (120x120), centered above app name
- Change tagline to "Your daily brain health buddy"
- Replace single button with two: white "Sign in with Google" pill (triggers `supabase.auth.signInWithOAuth({ provider: 'google' })`) and dark "Enter manually →" pill
- Footer pinned to bottom: "No spam. No notifications. Just you."

### 4. Onboarding — Two Flows
- Remove progress dots
- Read `?method=google` or `?method=manual` from URL
- **Google flow**: heading "One last thing.", fields: first name (pre-populated from Google), age, city
- **Manual flow**: heading "Let's set you up.", fields: first name, email (@gmail.com only), age, city
- Validation: name 2-10 letters, email gmail-only (manual), age 1-100 if filled
- Input styling: `#1F1F1F` bg, red focus glow, red error border, JetBrains Mono
- Footnote above submit: "No spam · No notifications · No T&C nonsense"
- On submit: upsert to Supabase `users` table + save to localStorage

### 5. Profile Screen (new `/profile`)
- Avatar placeholder (64px), name (Space Grotesk 20px), city/age subtitle
- Edit name inline with validation (2-10 letters)
- Referral code: `BRAIN-` + first 4 chars of name + 2 hex chars, copy button
- Follow section: LinkedIn + Twitter/X cards (open in new tab)
- Sign out: clear localStorage, navigate to `/`

### 6. Math Game Changes
- **Generator constraints**: max 1 division, max 2 multiplications, no chained divisions, positive integer results only — add retry logic
- **Auto-submit on correct**: in `onChange`/`handleKey`, if typed value === answer, auto-submit immediately
- **No auto-advance on wrong**: stay on same question, show shake + red border, user must correct or wait for timer
- **Remove answer reveal**: delete `revealAnswer` state and "Answer was X" text
- **Result screen**: show last session score + delta (green up / red down), read from localStorage before overwriting
- **Confetti**: install `canvas-confetti`, fire on result mount if current > last session score

### 7. Memory Game Changes
- **Replace word bank**: swap English words with 200+ Indian pop-culture words (all ≤6 chars) across cricket, Bollywood, F1, food, festivals, cities, slang categories
- **Wrong chips**: show red-styled chips for non-matching submissions, fade out after 2s
- **Result screen**: last session score + delta + confetti (same pattern as Math)
- **"See all words" screen**: new route `/memory/words`, show recalled (green chips) vs missed (dim chips), pass data via router state

### 8. Coloring Game Changes
- **Brush size selector**: S (4px), M (10px), L (20px) buttons in toolbar between undo and colors
- **Eraser tool**: draws in white, button with ⌫ icon, deactivates when color swatch tapped
- **Remove timer** from canvas header (keep image name only)
- **Result screen**: remove "complete" stat, keep time + score (2 columns)
- **Auto-save**: save canvas as base64 every 30s to localStorage, restore on load, delete on submit, show "Continue" badge in picker

### 9. Routing Updates
- Add `/profile` route → Profile component
- Add `/memory/words` route → MemoryWords component
- Keep `/leaderboard` in router but not in nav

### 10. DB Schema Migrations
Run SQL to add columns to `users` table and create `memory_session_words` table:
- `users`: add `referral_code TEXT UNIQUE`, `last_math_score INT`, `last_memory_score INT`, `last_coloring_score INT`
- New table `memory_session_words`: id, session_id (FK), word, was_recalled
- Add indexes on `memory_session_words(session_id)` and `users(referral_code)`

### 11. NPM Dependencies
- Add `canvas-confetti` + `@types/canvas-confetti`

---

### Files to Create
- `src/pages/Profile.tsx`
- `src/pages/MemoryWords.tsx`

### Files to Modify
- `src/components/game/BottomNav.tsx`
- `src/pages/Login.tsx`
- `src/pages/Onboarding.tsx`
- `src/pages/MathGame.tsx`
- `src/pages/MemoryGame.tsx`
- `src/pages/ColorGame.tsx`
- `src/pages/Home.tsx`
- `src/lib/mathEngine.ts`
- `src/lib/memoryEngine.ts`
- `src/App.tsx`
- `package.json`

### Estimated scope
~15 files touched, 2 new pages, 1 new DB table, 3 altered columns. This is a significant overhaul that will be implemented systematically following the order above.

