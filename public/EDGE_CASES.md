# EDGE_CASES.md — Edge Cases & Error Handling (Updated)

## 1. Math Game

### Question Generator Edge Cases
| Case | Handling |
|------|----------|
| Generated expression evaluates to decimal | Re-generate (retry loop, max 10 attempts) |
| Generated expression has negative result | Re-generate |
| Division by zero in generated expression | Re-generate |
| Same expression generated consecutively | Re-generate until distinct |
| Timer expires mid-input | Auto-submit current answer, show result screen |
| User submits empty input | No action — keyboard tap ✓ disabled when input empty |

### Answer Input
| Case | Handling |
|------|----------|
| User types non-numeric via physical keyboard | Filter — only 0-9 and `-` accepted |
| Very large number (overflow) | Cap input at 6 digits |
| Negative answer | Allow `-` prefix via keyboard/pad |
| Multiple decimal points | Blocked — integer answers only |

### Auto-Advance
| Case | Handling |
|------|----------|
| Network request mid-advance | Continue locally; sync later |
| Correct answer flash interrupted | Flash completes before next Q loads |
| Wrong answer — user types during 800ms | Input disabled during reveal window |

### On-Screen Keyboard
| Case | Handling |
|------|----------|
| Physical keyboard also in use | Both work simultaneously |
| Keyboard hidden by OS (unlikely — it's always rendered) | Scroll to ensure keyboard visible |
| Keyboard covers expression | Expression always above keyboard in layout |

---

## 2. Memory Game

### Word Pool / Uniqueness
| Case | Handling |
|------|----------|
| User exhausts all 1,000 eligible words (heavy user) | Relax 14-day rule to 7-day rule after full exhaustion |
| Hash collision (two users same seed) | Seed includes user_id UUID — collision probability negligible |
| Weekly pool update mid-session | Session uses snapshot of pool taken at session start |
| User plays on week boundary (Sunday 11:59 PM) | Use pool active at session start time |
| Word pool DB unavailable | Serve from cached local fallback of 100 words |

### Fuzzy Match Edge Cases
| Input | Word | Distance | Result |
|-------|------|----------|--------|
| "tigger" | "tiger" | 1 | ✓ Accept |
| "mountin" | "mountain" | 1 | ✓ Accept |
| "compas" | "compass" | 1 | ✓ Accept |
| "cat" | "clock" | 4 | ✗ Reject |
| "tiger" | "tiger" | 0 | ✓ Accept (exact) |
| "te" | "ten" | 1 | Accept only if word ≤ 4 chars; reject if word is longer (short inputs match too broadly) |
| Already recalled | any | any | Silently ignored (no duplicate chips) |

**Short word protection:** For target words of ≤ 3 characters (e.g., "cat", "owl"), require exact match (distance 0) to prevent spurious matches.

### Recall Phase
| Case | Handling |
|------|----------|
| Timer runs out while typing | Submit current partial word; show result |
| User recalls all 50 words | Congratulate, show result immediately |
| User submits same word twice | Second attempt silently ignored |
| Empty input on Enter | No action |

---

## 3. Coloring Game

### Canvas
| Case | Handling |
|------|----------|
| Canvas bg must be white | `canvas.style.background = '#FFFFFF'`; app wrapper stays #0C0C0C |
| Image fails to load | Show placeholder outline silhouette + retry button |
| User draws nothing, taps Submit | Allow — completion = 0%, score = 0 pts |
| Undo with no strokes | Undo button disabled (opacity 0.3) |
| Very fast drawing (many strokes) | Throttle canvas events to 60fps |
| Session interrupted mid-color | No autosave — user must submit manually |

### Submit Button
| Case | Handling |
|------|----------|
| Submit tapped very quickly | Debounce 500ms to prevent double-submit |
| Submit tapped before drawing anything | Confirm dialog: "Done already? Your work won't be saved as complete." |

---

## 4. Auth & Session

| Case | Handling |
|------|----------|
| Google OAuth fails | Show error state on login screen (Screen 01B) |
| Token expires mid-game | Show modal (Screen 22) — "Session expired" |
| User navigates away mid-game | Show confirm dialog: "Leave game? Progress will be lost." |
| Multiple tabs open | Latest session wins; warn user if duplicate detected |
| Session save fails | Toast (Screen 20) + retry logic (3 attempts) |
| Session save fails after 3 retries | Store in localStorage as fallback; attempt sync on next load |

---

## 5. Scoring & Daily System

| Case | Handling |
|------|----------|
| First ever game | Show "Voilà! You did your first game 🎉" instead of delta message |
| No games yesterday | No delta penalty; show "First session this week" |
| Played 5 sessions in one hour | All stored; only highest shown on leaderboard |
| Midnight crossover mid-game | Session attributed to the date it started |
| Score comparison within ±2% | Treated as "Same" (0 delta points) |
| All 3 games scored 0 | Valid session; daily score = 0 |

---

## 6. Network & Offline

| Case | Handling |
|------|----------|
| No internet on game load | Serve cached word pool; math generates locally |
| Leaderboard unavailable | Show error state (Screen 21) — NOT empty state |
| Partial session sync | Mark session as `sync_pending`; retry on reconnect |
| PWA offline mode | Math and Coloring fully work offline; Memory uses cached pool |

---

## 7. Accessibility & Input

| Case | Handling |
|------|----------|
| User uses only physical keyboard | Full support — Enter submits, Backspace corrects |
| User uses only on-screen keyboard | Full support — keyboard always visible |
| Screen reader use | aria-labels on all game states, timer, and score |
| Large text / zoom | Layout uses relative units; keyboard remains usable at 150% zoom |
