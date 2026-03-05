// Memory Game Engine - Word Pool + Fuzzy Matching

const WORD_POOL: string[] = [
  // Animals (50)
  "Tiger", "Falcon", "Otter", "Lemur", "Pangolin", "Eagle", "Dolphin", "Cobra",
  "Rabbit", "Parrot", "Whale", "Jaguar", "Gecko", "Panda", "Bison", "Crane",
  "Salmon", "Beetle", "Gorilla", "Cheetah", "Pelican", "Lobster", "Ferret", "Mantis",
  "Condor", "Badger", "Iguana", "Moose", "Heron", "Viper", "Toucan", "Starfish",
  "Walrus", "Gazelle", "Firefly", "Osprey", "Raccoon", "Hermit", "Penguin", "Buffalo",
  "Macaw", "Quail", "Donkey", "Coyote", "Finch", "Marmot", "Kestrel", "Crab",
  "Sparrow", "Panther",
  // Objects (50)
  "Clock", "Compass", "Lantern", "Hammer", "Envelope", "Candle", "Anchor", "Mirror",
  "Blanket", "Feather", "Basket", "Whistle", "Paddle", "Funnel", "Ribbon", "Needle",
  "Bucket", "Magnet", "Helmet", "Saddle", "Wrench", "Goggles", "Zipper", "Pillow",
  "Crayon", "Shovel", "Thimble", "Button", "Marble", "Locket", "Shield", "Chisel",
  "Carpet", "Socket", "Satchel", "Quiver", "Pliers", "Eraser", "Brooch", "Grater",
  "Pendant", "Trowel", "Sandal", "Beacon", "Clamp", "Tripod", "Syringe", "Awning",
  "Gasket", "Pulley",
  // Places (50)
  "Canyon", "Harbor", "Glacier", "Marsh", "Plateau", "Valley", "Summit", "Island",
  "Forest", "Desert", "Meadow", "Cavern", "Lagoon", "Tundra", "Oasis", "Ravine",
  "Steppe", "Volcano", "Fjord", "Reef", "Basin", "Ridge", "Prairie", "Grotto",
  "Dunes", "Rapids", "Bluff", "Creek", "Delta", "Gorge", "Savanna", "Swamp",
  "Thicket", "Cove", "Ruins", "Temple", "Bridge", "Market", "Garden", "Chapel",
  "Citadel", "Tower", "Wharf", "Terrace", "Arcade", "Parlor", "Studio", "Balcony",
  "Corridor", "Atrium",
  // Actions (50)
  "Climb", "Sketch", "Ferment", "Whisper", "Orbit", "Plunge", "Gather", "Ignite",
  "Sculpt", "Wander", "Anchor", "Launch", "Polish", "Carve", "Sprint", "Juggle",
  "Weave", "Absorb", "Ripple", "Tumble", "Glide", "Stitch", "Harvest", "Kindle",
  "Mingle", "Ponder", "Rattle", "Fumble", "Squint", "Bellow", "Clatter", "Drizzle",
  "Flutter", "Gurgle", "Hobble", "Jingle", "Linger", "Mumble", "Nestle", "Quiver",
  "Rustle", "Shimmer", "Tremble", "Unravel", "Vanish", "Wobble", "Tangle", "Soar",
  "Murmur", "Ripple",
  // Abstract (50)
  "Calm", "Trust", "Dread", "Wonder", "Tension", "Bliss", "Grief", "Valor",
  "Chaos", "Grace", "Doubt", "Honor", "Fury", "Serenity", "Virtue", "Malice",
  "Solace", "Vigor", "Wisdom", "Folly", "Courage", "Anguish", "Delight", "Sorrow",
  "Triumph", "Despair", "Freedom", "Burden", "Passion", "Mercy", "Justice", "Envy",
  "Pride", "Shame", "Clarity", "Mystic", "Spirit", "Ember", "Shadow", "Twilight",
  "Zenith", "Cipher", "Riddle", "Mirage", "Frenzy", "Reverie", "Enigma", "Aether",
  "Nexus", "Cosmos"
];

// Simple hash function for deterministic seeding
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
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
  // Remove duplicates and take 50
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
    
    // Short word protection: exact match only for words ≤ 3 chars
    if (target.length <= 3) {
      if (distance === 0) return { match: true, word, fuzzy: false };
      continue;
    }
    
    // Accept if distance ≤ 2
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
