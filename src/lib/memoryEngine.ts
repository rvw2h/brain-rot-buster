// Memory Game Engine - Indian Pop Culture Word Pool + Fuzzy Matching

const WORD_POOL: string[] = [
  // Cricket
  "Sachin", "Dhoni", "Virat", "Rohit", "Bumrah", "Jadeja", "Ashwin", "Rahul",
  "Pant", "Shami", "Hardik", "Chahal", "Surya", "Ishan", "Rinku", "Kohli",
  "Gayle", "ABD", "Yorker", "Googly", "Stumps", "Wicket", "Sixer", "Bails",
  "Crease", "Duck", "Maiden", "Umpire", "Pitch", "Over",
  // Bollywood
  "SRK", "Alia", "Deepika", "Ranbir", "Salman", "Aamir", "Ranvir", "Akshay",
  "Hrithik", "Katrina", "Kareena", "Jawan", "Animal", "Pushpa", "Sholay",
  "Lagaan", "Dangal", "DDLJ", "Gadar", "Rocky", "Kalki", "Tiger", "Stree",
  "Kabir", "Munna", "Singham", "Golmaal", "Dhoom", "Sultan", "War",
  // F1 & Racing  
  "Max", "Lewis", "Lando", "Carlos", "Leclerc", "Checo", "Oscar", "Alonso",
  "DRS", "Apex", "Stint", "Grid", "Pitstop", "Slicks", "Halo", "Redbull",
  // Food
  "Biryani", "Samosa", "Paneer", "Chai", "Dosa", "Idli", "Roti", "Lassi",
  "Gulab", "Kulfi", "Jalebi", "Chaat", "Pakora", "Raita", "Naan", "Masala",
  "Ladoo", "Kheer", "Pulao", "Vada", "Chole", "Poha", "Upma", "Bhaji",
  // Festivals
  "Diwali", "Holi", "Eid", "Onam", "Lohri", "Pongal", "Navami", "Rakhi",
  "Durga", "Ganesh", "Basant", "Vishu", "Teej", "Makar", "Baisakhi",
  // Cities
  "Mumbai", "Delhi", "Pune", "Goa", "Jaipur", "Kochi", "Surat", "Agra",
  "Shimla", "Varanasi", "Mysore", "Lucknow", "Bhopal", "Patna", "Indore",
  "Nagpur", "Ranchi", "Vizag", "Madras", "Bombay",
  // Slang & Pop Culture
  "Jugaad", "Yaar", "Bindaas", "Desi", "Swag", "Vibe", "Chill", "Bruh",
  "Slay", "Lit", "Drip", "Fire", "GOAT", "Clutch", "Sigma", "Rizz",
  "Flex", "Ghosted", "Ship", "Stan", "Ratio", "Salty", "Based", "Mood",
  // Abstract
  "Karma", "Dharma", "Mantra", "Zen", "Guru", "Yoga", "Namaste", "Shakti",
  "Maya", "Moksha", "Atman", "Bhakti", "Tantra", "Sutra", "Raga",
];

// Simple hash function for deterministic seeding
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Seeded random number generator (mulberry32)
function seededRandom(seed: number): () => number {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  const rng = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getWordsForSession(userId: string = 'local', date?: string): string[] {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const seed = hashCode(`${userId}:${dateStr}`);
  const shuffled = seededShuffle(WORD_POOL, seed);
  const unique = [...new Set(shuffled)];
  return unique.slice(0, 50);
}

// Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

export interface MatchResult {
  match: boolean;
  word?: string;
  fuzzy?: boolean;
}

export function checkWord(input: string, targetList: string[], alreadyRecalled: Set<string>): MatchResult {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return { match: false };
  
  for (const word of targetList) {
    if (alreadyRecalled.has(word)) continue;
    
    const target = word.toLowerCase();
    const distance = levenshtein(normalized, target);
    
    if (target.length <= 3) {
      if (distance === 0) return { match: true, word, fuzzy: false };
      continue;
    }
    
    if (distance <= 2) {
      return { match: true, word, fuzzy: distance > 0 };
    }
  }
  
  return { match: false };
}

export function calculateMemoryScore(correctRecall: number): number {
  let score = correctRecall * 2;
  if (correctRecall >= 40) score += 20;
  else if (correctRecall >= 25) score += 10;
  return score;
}
