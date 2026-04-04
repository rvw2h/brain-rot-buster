// Section 5: MESSAGE LISTS

export const SIMPLE_MATH_PREGAME = [
  "Warm up the engine.",
  "Time to think.",
  "Let's see what you've got.",
  "Numbers don't lie.",
  "Quick maths. Let's go.",
  "Sharpen up.",
  "Brain, activate.",
  "No calculator needed.",
  "5 minutes. Full focus.",
  "Ready when you are.",
];

export const SIMPLE_MEMORY_PREGAME = [
  "How much can you hold?",
  "Memory check.",
  "Let's see what sticks.",
  "Absorb everything.",
  "Picture them clearly.",
  "Store. Recall. Repeat.",
  "Train the recall muscle.",
  "Every word counts.",
  "Focus for 20 seconds.",
  "Let's find out what you remember.",
];

export const SIMPLE_RESULT_POSITIVE = [
  "Your brain got a workout today. 🧠",
  "Consistency is the real cheat code.",
  "One session closer to sharper thinking.",
  "You showed up. That's already winning.",
  "Brain rot? Not on your watch.",
  "Daily reps for the mind. Keep going.",
  "Small sessions, big gains over time.",
  "That's how you fight the fog.",
  "Trained today. Ahead of most already.",
  "The brain you build is the brain you use.",
];

export const SIMPLE_RESULT_LOW = [
  "Every session counts, even the rough ones.",
  "Show up again tomorrow. It compounds.",
  "The fact you played is the win.",
  "Off day. That's allowed. Come back.",
  "Progress isn't always visible. Keep going.",
];

export const AURA_MATH_PREGAME = [
  "Lock in. 🔥",
  "No mercy mode.",
  "Prove it.",
  "Your brain vs the clock.",
  "Activate beast mode.",
  "10 seconds. Every question. Go.",
  "Think fast or pay the price.",
  "Only the sharp survive.",
  "Are you built for this?",
  "This is where the real ones train.",
];

export const AURA_MEMORY_PREGAME = [
  "Absorb 50. Miss nothing.",
  "Your memory is your weapon.",
  "The weak forget. You won't.",
  "Store it all. Leave nothing behind.",
  "50 words. No excuses.",
  "Elite recall only.",
  "Remember everything. Forget nothing.",
  "This is your mind at full power.",
  "Locked in. Loaded up.",
  "No word bank. No help. Just you.",
];

export const AURA_RESULT_BEAST = [
  "Different breed. 🔥",
  "Built different. Proven today.",
  "That's an elite session right there.",
  "The gap between you and average just got wider.",
  "Locked in and lethal. 🧠⚡",
  "That's not a score. That's a statement.",
  "Your brain is a weapon. You just sharpened it.",
  "Top percentile energy. Don't stop.",
  "That's what peak mental performance looks like.",
  "Most people are scrolling. You're evolving. 🔥",
];

export const AURA_RESULT_SOLID = [
  "Solid session. The beast is still in there.",
  "You showed up. Now show out next time.",
  "Good. Now go harder.",
  "Still elite. Just not your peak yet.",
  "The aura doesn't dim. Sharpen the edge.",
];

export const AURA_RESULT_NEGATIVE = [
  "The grind doesn't care about feelings. Lock back in.",
  "Not your round. Make the next one count.",
  "Elite minds bounce back harder. Your turn.",
  "That score is just data. Use it.",
  "Stay locked in. The comeback starts now.",
];

// Section 4: MESSAGE ROTATION LOGIC

export function getDailySeed(userId: string): number {
  const today = new Date().toISOString().split("T")[0];
  const combined = (userId || "Guest") + today;
  let seed = 0;
  for (let i = 0; i < combined.length; i++) {
    seed = (seed * 31 + combined.charCodeAt(i)) >>> 0;
  }
  return seed;
}

export function getMessage(list: string[], seed: number): string {
  if (!list.length) return "";
  return list[seed % list.length];
}
