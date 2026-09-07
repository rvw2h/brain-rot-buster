# BrainSharp — Aura Farm Mode PRD

## Overview
Aura Farm Mode is a high-intensity variant of BrainSharp designed for users who want a more competitive, high-pressure cognitive challenge.

While Simple Mode focuses on daily mental maintenance and low-pressure training, Aura Farm Mode is built around:

- Higher difficulty
- Time pressure
- Negative marking
- Faster decisions
- Stronger visual identity

The goal is to make users feel like they are entering a “serious mode” where performance matters.

---

# Product Philosophy

Simple Mode = calm, light, daily brain training.

Aura Farm Mode = pressure, competitiveness, self-challenge.

Users should be able to switch between the two depending on their energy level and mood.

---

# Modes

## 1. Simple Mode

Purpose:
Low-pressure daily cognitive exercise.

Characteristics:
- Softer UI
- Neutral colors
- No pressure
- Best for habit-building

### Math Game — Simple Mode
- Existing BODMAS-based questions
- No time limit per question
- Unlimited attempts per question until correct answer
- Score based on number of correct answers completed

### Memory Game — Simple Mode
- Show 25 words
- User gets time to remember them
- On next screen, show 50 total words
- User selects the original 25 words
- Submit after selection

Scoring:
- Positive score for each correct selection
- No negative marking

---

## 2. Aura Farm Mode

Purpose:
Hardcore self-competition mode.

Characteristics:
- Vibrant UI
- Red accents and dark backgrounds
- Strong visual feedback for wins and mistakes
- Feels intense and performance-oriented

Users can toggle Aura Farm Mode directly from the Home Screen.

Example toggle:

- Simple Mode
- Aura Farm Mode

---

# Aura Farm Mode — Math Game PRD

## Goal
Push users to solve BODMAS expressions quickly and accurately under pressure.

## Gameplay Rules
- Each question has a strict 10-second timer
- User gets only one attempt per question
- If the answer is correct:
  - Positive score added
  - Next question shown immediately
- If the answer is wrong:
  - Negative score applied
  - Next question shown immediately
- If timer runs out:
  - Count as incorrect
  - Negative score applied

## Difficulty
Questions should be harder than Simple Mode.

Examples:
- (8 + 4) × 3 - 6
- 15 ÷ (3 + 2) × 4
- (12 - 3) × (2 + 1)
- 18 ÷ 3 + 7 × 2

## Scoring Logic
- Correct answer: +10 points
- Wrong answer: -5 points
- Timeout: -5 points

## Metrics Tracked
- Total Questions Attempted
- Correct Answers
- Wrong Answers
- Accuracy %
- Average Response Time
- Final Score

## End Screen
Example:

- Score: 145
- Correct: 19
- Wrong: 7
- Accuracy: 73%
- Avg Time: 5.8s

---

# Aura Farm Mode — Memory Game PRD

## Goal
Test recall strength under pressure using active memory recall.

## Gameplay Rules
- Show 50 words for memorization
- Memorization duration remains fixed
- User then moves to next screen
- User must type remembered words manually
- One submission only
- No word bank shown

## Difficulty
Words should include a mix of:
- Indian pop culture
- Cricket
- Bollywood
- F1
- Food
- Brands
- Places

Example:
- Virat
- Paneer
- Ferrari
- Mumbai
- Rajma
- Dhoni

## Scoring Logic
- Correct word: +4 points
- Incorrect word: -1 point
- Duplicate word entered: 0 points

## Metrics Tracked
- Total Correct Recall
- Wrong Entries
- Accuracy %
- Final Score

## End Screen Example
- Correct Recall: 21
- Wrong Entries: 5
- Accuracy: 80%
- Final Score: 79

---

# Relax Mode Navigation

The Coloring Game should move out of the main challenge flow and sit separately in the bottom navigation.

Bottom Navigation:
- Home
- Leaderboard
- Relax
- Stats

Relax tab contains:
- Coloring Game
- Canvas save progress
- Time spent
- Blocks filled

This keeps the main experience focused on performance while preserving coloring as a low-pressure activity.

---

# Home Screen Structure

## Top Section
- Greeting
- Today vs Yesterday vs Personal Best
- Total Daily Score

## Mode Toggle
- Simple Mode
- Aura Farm Mode

Mode selection changes:
- Game rules
- Difficulty
- Timer behavior
- Negative marking
- Visual theme

## Main Game Cards
- Rapid Math
- Memory Recall

## Bottom Navigation
- Home
- Leaderboard
- Relax
- Stats

---

# Visual Design Direction

## Simple Mode
- Soft blue / neutral palette
- Minimal UI
- Calm typography
- Friendly buttons

## Aura Farm Mode
- Dark background
- Red highlights
- Bold typography
- Strong animations
- Intense timer indicators
- Flash feedback on correct / wrong answers

Visual cues should make Aura Farm Mode feel like:
- Competitive
- High-stakes
- Fast-paced
- “Locked in”

---

# Key Product Principle

Aura Farm Mode should not replace Simple Mode.

It exists for moments when the user wants:
- Higher pressure
- Higher intensity
- Stronger self-competition

Simple Mode is for consistency.
Aura Farm Mode is for proving to yourself that you are mentally sharp.

