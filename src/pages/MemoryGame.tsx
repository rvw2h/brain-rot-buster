import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getWordsForSession, 
  checkWord, 
  calculateMemoryScore, 
  getDistractorWords 
} from "@/lib/memoryEngine";
import TimerBar from "@/components/game/TimerBar";
import QwertyPad from "@/components/game/QwertyPad";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import { persistGameSession } from "@/lib/gamePersistence";
import { supabase } from "@/lib/supabase";

type Phase = "pre" | "display" | "recall" | "result";

const DISPLAY_TIME = 20;
const RECALL_TIME = 100;

interface WrongChip {
  id: number;
  text: string;
}

interface FloatingDelta {
  id: number;
  val: string;
  color: string;
}

const MemoryGame = () => {
  const navigate = useNavigate();
  const { profile, manualUser } = useAuth();
  const { mode } = useAppMode();
  const isAura = mode === "aura";
  
  const [phase, setPhase] = useState<Phase>("pre");
  const [words, setWords] = useState<string[]>([]);
  const [selectionWords, setSelectionWords] = useState<string[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [input, setInput] = useState("");
  const [recalled, setRecalled] = useState<Set<string>>(new Set());
  const [wrongChips, setWrongChips] = useState<WrongChip[]>([]);
  const [lastSessionScore, setLastSessionScore] = useState<number | null>(null);
  const [deltas, setDeltas] = useState<FloatingDelta[]>([]);
  const [duplicateFlash, setDuplicateFlash] = useState<string | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const wrongIdRef = useRef(0);
  const deltaIdRef = useRef(0);
  const gameStartRef = useRef<number | null>(null);

  const startGame = () => {
    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    const scoreKey = isAura ? "aura_memory" : "memory";
    setLastSessionScore(existing[scoreKey] || null);

    const count = isAura ? 50 : 25;
    const sessionWords = getWordsForSession(count, profile?.id || "local");
    setWords(sessionWords);
    
    if (!isAura) {
      const dists = getDistractorWords(sessionWords, 25);
      const combined = [...sessionWords, ...dists].sort(() => Math.random() - 0.5);
      setSelectionWords(combined);
    }

    setRecalled(new Set());
    setInput("");
    setWrongChips([]);
    setDeltas([]);
    setTimeLeft(DISPLAY_TIME);
    setPhase("display");
    gameStartRef.current = Date.now();
  };

  useEffect(() => {
    if (phase !== "display" && phase !== "recall") return;
    if (phase === "recall" && !isAura) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (phase === "display") {
            setPhase("recall");
            if (isAura) {
              setTimeLeft(RECALL_TIME);
              return RECALL_TIME;
            }
            return 0;
          } else {
            setPhase("result");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, isAura]);

  const addDelta = (val: string, color: string) => {
    const id = ++deltaIdRef.current;
    setDeltas(prev => [...prev, { id, val, color }]);
    setTimeout(() => {
      setDeltas(prev => prev.filter(d => d.id !== id));
    }, 600);
  };

  const handleSubmit = useCallback(() => {
    if (!input.trim() || phase !== "recall" || !isAura) return;
    const result = checkWord(input, words, recalled);
    
    if (result.match && result.word) {
      setRecalled((prev) => new Set(prev).add(result.word!));
      addDelta("+4", "#00F5A0");
      if (recalled.size + 1 >= words.length) {
        setPhase("result");
        clearInterval(timerRef.current);
      }
    } else if (result.isDuplicate) {
      setDuplicateFlash(input.trim().toLowerCase());
      setTimeout(() => setDuplicateFlash(null), 300);
    } else {
      const id = ++wrongIdRef.current;
      setWrongChips((prev) => [...prev, { id, text: input.trim() }]);
      addDelta("-1", "#FF2D55");
    }
    setInput("");
  }, [input, phase, words, recalled, isAura]);

  const handleKey = useCallback((key: string) => {
    if (phase !== "recall" || !isAura) return;
    if (key === "enter") handleSubmit();
    else if (key === "backspace") setInput((p) => p.slice(0, -1));
    else if (key === " ") setInput((p) => p + " ");
    else if (key.length === 1) setInput((p) => p + key);
  }, [phase, handleSubmit, isAura]);

  useEffect(() => {
    if (phase !== "recall" || !isAura) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
      else if (e.key === "Backspace") setInput((p) => p.slice(0, -1));
      else if (e.key.length === 1) setInput((p) => p + e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleSubmit, isAura]);

  const toggleSelection = (word: string) => {
    setRecalled(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  const score = calculateMemoryScore(recalled.size, wrongChips.length, isAura ? "aura" : "simple");
  const accuracy = words.length > 0 ? Math.round((recalled.size / words.length) * 100) : 0;

  useEffect(() => {
    if (phase === "result") {
      const sc = calculateMemoryScore(recalled.size, wrongChips.length, isAura ? "aura" : "simple");
      const today = new Date().toISOString().split("T")[0];
      const key = `bs_scores_${today}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      const scoreKey = isAura ? "aura_memory" : "memory";
      
      if (!existing[scoreKey] || existing[scoreKey] < sc) {
        existing[scoreKey] = sc;
        localStorage.setItem(key, JSON.stringify(existing));
      }
      
      const bestKey = isAura ? "bs_best_aura" : "bs_best";
      const best = parseInt(localStorage.getItem(bestKey) || "0");
      if (sc > best) localStorage.setItem(bestKey, String(sc));

      if (lastSessionScore !== null && sc > lastSessionScore) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      const startedAtIso = gameStartRef.current ? new Date(gameStartRef.current).toISOString() : new Date().toISOString();
      const completedAtIso = new Date().toISOString();

      void (async () => {
        const sessionId = await persistGameSession({
          gameType: "memory",
          user: profile || manualUser || null,
          score: sc,
          accuracyPct: accuracy,
          startedAt: startedAtIso,
          completedAt: completedAtIso,
          mode: isAura ? "aura" : "simple",
          metadata: {
            totalWords: words.length,
            recalledCount: recalled.size,
            wrongCount: wrongChips.length,
          },
        });

        if (sessionId && profile) {
          const rows = words.map((word) => ({
            session_id: sessionId,
            word,
            was_recalled: recalled.has(word),
          }));
          await supabase.from("memory_session_words").insert(rows);
        }
      })();
    }
  }, [phase, recalled, wrongChips.length, isAura, lastSessionScore, words.length, accuracy, profile, manualUser]);

  const totalDuration = phase === "display" ? DISPLAY_TIME : RECALL_TIME;
  const timerPct = (timeLeft / totalDuration) * 100;

  if (phase === "pre") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-7 bg-background overflow-hidden relative">
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-4 text-center">Memory Recall</div>
        <h1 className="font-display text-[22px] font-semibold text-foreground text-center">
          {isAura ? "Remember everything." : "Memorise. Then recall."}
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 text-center max-w-[240px]">
          {isAura ? "50 words. Wrong answers cost you points. Intense." : "25 words. 20s to memorise. Then select from grid."}
        </p>
        <button onClick={startGame} className={`mt-8 rounded-lg px-8 py-3 font-sans text-sm font-semibold transition-all ${isAura ? "bg-[#FF2D55] text-white" : "bg-game-red text-white"}`}>
          {isAura ? "Lock in." : "Start →"}
        </button>
        <button onClick={() => navigate("/home")} className="mt-4 font-sans text-xs text-muted-foreground">← Back</button>
      </div>
    );
  }

  if (phase === "display") {
    return (
      <div className={`h-screen overflow-hidden flex flex-col ${isAura ? 'bg-background' : ''}`}>
        <TimerBar percentage={timerPct} color={isAura ? "#FF2D55" : undefined} />
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="flex justify-between items-center mb-3">
             <div className="font-mono text-sm text-game-red flex items-center gap-1.5">
               <span className={timeLeft <= 5 ? "animate-timer-pulse" : ""}>
                 {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                 {String(timeLeft % 60).padStart(2, "0")}
               </span>
             </div>
             {isAura && (
               <div className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(255,45,85,0.12)] border border-[rgba(255,45,85,0.25)]">
                 <span className="text-[#FF2D55] font-display text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Aura</span>
               </div>
             )}
          </div>
          <div className="flex-1 overflow-auto mb-2 no-scrollbar" style={{ columns: 2, columnGap: "0.75rem" }}>
            {words.map((w) => (
              <div key={w} className={`font-display text-xs font-medium text-foreground py-1.5 px-2 rounded mb-1.5 break-inside-avoid text-left border ${isAura ? "bg-[#161616] border-[rgba(255,45,85,0.15)]" : "bg-surface border-border/30"}`}>
                {w}
              </div>
            ))}
          </div>
          <p className="font-sans text-[10px] text-t-tertiary text-center pt-1.5 uppercase tracking-widest">MEMORISE. Don't scroll.</p>
        </div>
      </div>
    );
  }

  if (phase === "recall") {
    if (!isAura) {
      return (
        <div className="h-[100dvh] overflow-hidden flex flex-col bg-background">
          <div className="p-4 flex justify-between items-center bg-surface border-b border-border/30">
            <div>
              <div className="font-display text-lg font-bold text-foreground leading-tight">Recall</div>
              <div className="font-sans text-[11px] text-muted-foreground uppercase tracking-widest">{recalled.size} selected</div>
            </div>
            <button onClick={() => setPhase("result")} disabled={recalled.size === 0} className="bg-game-red text-white px-5 py-2 rounded-lg font-sans text-xs font-semibold disabled:opacity-30">
              Submit ↵
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5 no-scrollbar">
            {selectionWords.map(w => {
              const isSelected = recalled.has(w);
              return (
                <button key={w} onClick={() => toggleSelection(w)} className={`py-3 px-3 rounded-lg font-display text-xs transition-all border-2 text-left ${isSelected ? "bg-[rgba(0,245,160,0.08)] border-game-green text-foreground shadow-[0_0_8px_rgba(0,245,160,0.1)]" : "bg-[#161616] border-border/20 text-muted-foreground"}`}>
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <div className="h-[100dvh] overflow-hidden flex flex-col bg-background relative">
        <TimerBar percentage={timerPct} color="#FF2D55" />
        {deltas.map(d => (
          <div key={d.id} className="absolute left-1/2 top-48 -translate-x-1/2 font-display text-xl font-bold animate-float-up z-20" style={{ color: d.color }}>{d.val}</div>
        ))}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2 flex justify-between items-center">
            <div className="font-display text-lg font-bold text-foreground">{recalled.size} recalled</div>
            <div className={`font-display text-2xl font-bold transition-all ${score > 0 ? "text-[#FF2D55] animate-score-pulse" : "text-muted-foreground"}`}>{score}</div>
          </div>
          <div className="px-4 pb-2">
            <div className={`rounded-lg py-3 px-4 font-mono text-[15px] border-2 transition-all ${duplicateFlash ? "border-[#FFD60A] bg-[#FFD60A]/10 shadow-[0_0_12px_rgba(255,214,10,0.2)]" : "border-[rgba(255,45,85,0.2)] bg-[#161616]"}`}>
              {input ? <span className="text-foreground">{input}</span> : <span className="text-muted-foreground/30">type and press enter</span>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-1 flex flex-wrap content-start gap-1.5 no-scrollbar">
            {Array.from(recalled).map((w) => (
              <span key={w} className="inline-block py-1 px-3.5 rounded-full bg-[rgba(0,245,160,0.08)] border border-[rgba(0,245,160,0.15)] font-sans text-[10px] uppercase font-semibold text-game-green animate-chip-pop">{w}</span>
            ))}
            {wrongChips.map((chip) => (
              <span key={chip.id} className="inline-block py-1 px-3.5 rounded-full font-sans text-[10px] uppercase font-semibold animate-chip-pop bg-[rgba(255,45,85,0.08)] border border-[rgba(255,45,85,0.2)] text-[#FF2D55]">{chip.text} ✗</span>
            ))}
          </div>
          <QwertyPad onKey={handleKey} />
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const delta = lastSessionScore !== null ? score - lastSessionScore : null;
    return (
      <div className="h-screen overflow-hidden flex flex-col p-5 bg-background">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start mb-4">←</button>
        <div className="font-display text-sm font-bold text-[#FF2D55] uppercase tracking-widest mb-1">{isAura ? "Aura Check." : "Session Over."}</div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`font-display text-[72px] font-bold leading-none ${isAura && score > 0 ? "text-[#FF2D55] drop-shadow-[0_0_20px_rgba(255,45,85,0.3)]" : "text-foreground"}`}>{score}</div>
          <div className="font-sans text-sm text-muted-foreground mt-2">points</div>
          {delta !== null && delta !== 0 && (
            <div className={`font-sans text-xs mt-4 px-3 py-1 rounded-full ${delta > 0 ? "bg-game-green/10 text-game-green" : "bg-game-red/10 text-game-red"}`}>{delta > 0 ? `↑ +${delta}` : `↓ ${delta}`} vs last session</div>
          )}
          <div className="grid grid-cols-3 gap-0 w-full mt-12 border-t border-b border-border/10 py-6">
            {[ [String(recalled.size), "RECALLED"], [isAura ? String(wrongChips.length) : "25", isAura ? "WRONG" : "TARGET"], [`${accuracy}%`, "ACCURACY"], ].map(([n, l]) => (
              <div key={l} className="text-center border-r border-border/10 last:border-0 px-2">
                <div className={`font-mono text-xl font-bold ${l === "WRONG" && parseInt(n) > 0 ? "text-game-red" : "text-foreground"}`}>{n}</div>
                <div className="font-sans text-[8px] text-muted-foreground tracking-[0.1em] uppercase mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 w-full mt-auto mb-8">
          <button onClick={startGame} className={`w-full py-4 rounded-xl font-display text-sm font-bold transition-all shadow-lg ${isAura ? "bg-[#FF2D55] text-white" : "bg-game-red text-white"}`}>{isAura ? "GO AGAIN →" : "PLAY AGAIN"}</button>
          <button onClick={() => navigate("/home")} className="w-full py-4 bg-surface border border-border/50 rounded-xl font-display text-sm font-bold text-muted-foreground">HOME</button>
        </div>
      </div>
    );
  }
  return null;
};

export default MemoryGame;
