// Sharp Eye Engine — Procedural Generation & Logic

export type SharpEyeQuestionType = 'error_spotter' | 'symbol_scan' | 'sequence_check';

export interface SharpEyeQuestion {
  id: string;
  type: SharpEyeQuestionType;
  stimulus: any; // Can be string (Error Spotter) or grid (Symbol Scan)
  question: string;
  correct: string | number;
  options?: string[];
  explanation?: string;
  mutationIndex?: number; // For Sequence Check highlight
}

// 1. Procedural Symbol Scan
const SYMBOL_PAIRS = [
  ['O', '0'],
  ['l', '1'],
  ['l', 'I'],
  ['1', 'I'],
  ['B', '8'],
  ['S', '5'],
  ['G', '6'],
  ['n', 'm'],
  ['m', 'rn'],
  ['cl', 'd']
];

export function generateSymbolScan(seed: number): SharpEyeQuestion {
  const pair = SYMBOL_PAIRS[seed % SYMBOL_PAIRS.length];
  const [char1, char2] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
  
  const grid: string[][] = [];
  let count2 = 0;
  
  for (let r = 0; r < 5; r++) {
    const row: string[] = [];
    for (let c = 0; c < 6; c++) {
      if (Math.random() < 0.15) {
        row.push(char2);
        count2++;
      } else {
        row.push(char1);
      }
    }
    grid.push(row);
  }

  // Ensure at least one minority character exists
  if (count2 === 0) {
    const r = Math.floor(Math.random() * 5);
    const c = Math.floor(Math.random() * 6);
    grid[r][c] = char2;
    count2 = 1;
  }

  const qType = seed % 3;
  let question = "";
  let correct: string | number = "";

  if (qType === 0) {
    question = `How many "${char2}" characters are in the grid?`;
    correct = count2;
  } else if (qType === 1) {
    // Find row with most char2
    let maxRow = 0;
    let maxCount = -1;
    grid.forEach((row, idx) => {
      const c = row.filter(x => x === char2).length;
      if (c > maxCount) {
        maxCount = c;
        maxRow = idx + 1;
      }
    });
    question = `Which row (1-5) has the most "${char2}" characters?`;
    correct = maxRow;
  } else {
    question = `Identify the row and column of a "${char2}" character (e.g. 1,1 for top-left).`;
    // We'll just use "How many" for now to keep it simple and consistent with PRD's "count specific items"
    question = `Total count of "${char2}" in the grid?`;
    correct = count2;
  }

  return {
    id: `symbol_${seed}`,
    type: 'symbol_scan',
    stimulus: grid,
    question,
    correct
  };
}

// 2. Procedural Sequence Check
const SEQUENCE_TEMPLATES = [
  () => {
    const year = 2020 + Math.floor(Math.random() * 6);
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `INV-${year}-${num}-${letter}`;
  },
  () => {
    const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `ORD-${num}-${letters}`;
  },
  () => `${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
  () => {
    const days = ["12", "14", "22", "28", "04"];
    const months = ["March", "April", "June", "Sept", "Dec"];
    const year = 2024;
    return `${days[Math.floor(Math.random() * 5)]} ${months[Math.floor(Math.random() * 5)]} ${year}`;
  }
];

export function generateSequenceCheck(seed: number): SharpEyeQuestion {
  const template = SEQUENCE_TEMPLATES[seed % SEQUENCE_TEMPLATES.length];
  const ref = template();
  const isDifferent = Math.random() > 0.5;
  
  let mutated = ref;
  let mutationIndex = -1;

  if (isDifferent) {
    const chars = ref.split('');
    const idx = Math.floor(Math.random() * chars.length);
    mutationIndex = idx;
    const char = chars[idx];
    
    if (/[0-9]/.test(char)) {
      const next = (parseInt(char) + 1) % 10;
      chars[idx] = String(next);
    } else if (/[A-Z]/.test(char)) {
      const next = String.fromCharCode(((char.charCodeAt(0) - 65 + 1) % 26) + 65);
      chars[idx] = next;
    } else if (char === ' ') {
      chars[idx] = '-';
    } else {
      chars[idx] = char === '-' ? '_' : '!';
    }
    mutated = chars.join('');
  }

  return {
    id: `seq_${seed}`,
    type: 'sequence_check',
    stimulus: { reference: ref, version: mutated },
    question: "Is the second version exactly the same as the first?",
    correct: isDifferent ? "Different" : "Same",
    options: ["Same", "Different"],
    mutationIndex: isDifferent ? mutationIndex : -1
  };
}

// 3. User Seed Utility
export function getQuestionSeed(userId: string, questionIndex: number): number {
  const today = new Date().toISOString().split("T")[0];
  const combined = `${userId}${today}${questionIndex}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
  }
  return hash;
}
