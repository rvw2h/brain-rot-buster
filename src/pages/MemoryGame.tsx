import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getWordsForSession, checkWord, calculateMemoryScore } from "@/lib/memoryEngine";
import TimerBar from "@/components/game/TimerBar";
import QwertyPad from "@/components/game/QwertyPad";
import confetti from "canvas-confetti";

type Phase = "pre" | "display" | "recall" | "result";

const DISPLAY_TIME = 20;
const RECALL_TIME = 100;

interface WrongChip {
  id: number;
  text: string;
}

const MemoryGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("pre");
  const [words, setWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [input, setInput] = useState("");
  const [recalled, setRecalled] = useState<Set<string>>(new Set());
  const [fuzzyCount, setFuzzyCount] = useState(0);
  const [wrongChips, setWrongChips] = useState<WrongChip[]>([]);
  const [lastSessionScore, setLastSessionScore] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const wrongIdRef = useRef(0);

  const startGame = () => {
    // Read last session score
    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    setLastSessionScore(existing.memory || null);

    const sessionWords = getWordsForSession();
    setWords(sessionWords);
    setRecalled(new Set());
    setFuzzyCount(0);
    setInput("");
    setWrongChips([]);
    setTimeLeft(DISPLAY_TIME);
    setPhase("display");
  };

  // Timer
  useEffect(() => {
    if (phase !== "display" && phase !== "recall") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (phase === "display") {
            setPhase("recall");
            setTimeLeft(RECALL_TIME);
            return RECALL_TIME;
          } else {
            setPhase("result");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || phase !== "recall") return;
    const result = checkWord(input, words, recalled);
    if (result.match && result.word) {
      setRecalled((prev) => new Set(prev).add(result.word!));
      if (result.fuzzy) setFuzzyCount((p) => p + 1);
      if (recalled.size + 1 >= words.length) {
        setPhase("result");
        clearInterval(timerRef.current);
      }
    } else {
      // Show wrong chip that fades out
      const id = ++wrongIdRef.current;
      setWrongChips((prev) => [...prev, { id, text: input.trim() }]);
      setTimeout(() => {
        setWrongChips((prev) => prev.filter((c) => c.id !== id));
      }, 2000);
    }
    setInput("");
  }, [input, phase, words, recalled]);

  const handleKey = useCallback(
    (key: string) => {
      if (phase !== "recall") return;
      if (key === "enter") {
        handleSubmit();
      } else if (key === "backspace") {
        setInput((p) => p.slice(0, -1));
      } else if (key === " ") {
        setInput((p) => p + " ");
      } else if (key === "shift") {
        // no-op
      } else if (key.length === 1) {
        setInput((p) => p + key);
      }
    },
    [phase, handleSubmit]
  );

  // Physical keyboard
  useEffect(() => {
    if (phase !== "recall") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
      else if (e.key === "Backspace") setInput((p) => p.slice(0, -1));
      else if (e.key.length === 1) setInput((p) => p + e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleSubmit]);

  // Save score + confetti
  useEffect(() => {
    if (phase === "result") {
      const sc = calculateMemoryScore(recalled.size);
      const today = new Date().toISOString().split("T")[0];
      const key = `bs_scores_${today}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      if (!existing.memory || existing.memory < sc) {
        existing.memory = sc;
        localStorage.setItem(key, JSON.stringify(existing));
      }
      const best = parseInt(localStorage.getItem("bs_best") || "0");
      const total = (existing.math || 0) + (existing.memory || 0) + (existing.coloring || 0);
      if (total > best) localStorage.setItem("bs_best", String(total));

      if (lastSessionScore !== null && sc > lastSessionScore) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [phase, recalled, lastSessionScore]);

  const totalDuration = phase === "display" ? DISPLAY_TIME : RECALL_TIME;
  const timerPct = (timeLeft / totalDuration) * 100;
  const score = calculateMemoryScore(recalled.size);
  const accuracy = words.length > 0 ? Math.round((recalled.size / words.length) * 100) : 0;

  // PRE
  if (phase === "pre") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-7">
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-4">
          Memory Recall
        </div>
        <h1 className="font-display text-[22px] font-semibold text-foreground text-center">
          Memorise. Then recall.
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 text-center">
          50 words. 20s to memorise. 100s to recall.
        </p>
        <button
          onClick={startGame}
          className="mt-8 bg-game-red rounded-lg px-6 py-3 font-sans text-sm font-medium text-primary-foreground"
        >
          Start →
        </button>
        <button
          onClick={() => navigate("/home")}
          className="mt-4 font-sans text-xs text-muted-foreground"
        >
          ← Back
        </button>
      </div>
    );
  }

  // RESULT
  if (phase === "result") {
    const delta = lastSessionScore !== null ? score - lastSessionScore : null;

    return (
      <div className="flex flex-col min-h-screen p-5">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start">
          ←
        </button>
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mt-5">
          Memory Recall
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-display text-[60px] font-bold text-game-red leading-none">{score}</div>
          <div className="font-sans text-sm text-muted-foreground mt-1">points</div>
          {delta !== null && delta !== 0 && (
            <div className={`font-sans text-xs mt-1 ${delta > 0 ? "text-game-green" : "text-game-red"}`}>
              {delta > 0 ? `↑ +${delta}` : `↓ ${delta}`} from last
            </div>
          )}
          <div className="flex gap-0 mt-7 w-full">
            {[
              [String(words.length), "words"],
              [String(recalled.size), "recalled"],
              [`${accuracy}%`, "accuracy"],
            ].map(([n, l]) => (
              <div key={l} className="flex-1 text-center border-r border-border/30 last:border-0">
                <div className="font-mono text-lg font-semibold text-foreground">{n}</div>
                <div className="font-sans text-[9px] text-muted-foreground tracking-wider uppercase mt-0.5">
                  {l}
                </div>
              </div>
            ))}
          </div>
          {fuzzyCount > 0 && (
            <p className="font-sans text-[11px] text-muted-foreground mt-3">
              + {fuzzyCount} fuzzy matches accepted
            </p>
          )}
        </div>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={() =>
              navigate("/memory/words", {
                state: { words, recalled: Array.from(recalled) },
              })
            }
            className="border border-border/50 rounded-lg px-[18px] py-2.5 font-sans text-xs text-muted-foreground"
          >
            See All Words
          </button>
          <button
            onClick={startGame}
            className="border border-border/50 rounded-lg px-[18px] py-2.5 font-sans text-xs text-muted-foreground"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate("/home")}
            className="bg-game-red rounded-lg px-[18px] py-2.5 font-sans text-xs text-primary-foreground font-medium"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // DISPLAY PHASE
  if (phase === "display") {
    return (
      <div className="flex flex-col min-h-screen">
        <TimerBar percentage={timerPct} />
        <div className="flex-1 flex flex-col p-4">
          <div className="font-mono text-xs text-game-red mb-2">
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>
          <div className="flex-1 flex flex-wrap gap-1.5 content-start overflow-hidden">
            {words.map((w) => (
              <span
                key={w}
                className="font-display text-xs font-medium text-foreground py-0.5 px-1.5 bg-surface rounded"
              >
                {w}
              </span>
            ))}
          </div>
          <p className="font-sans text-[10px] text-t-tertiary text-center pt-1.5">
            MEMORISE. Don't scroll.
          </p>
        </div>
      </div>
    );
  }

  // RECALL PHASE
  return (
    <div className="flex flex-col min-h-screen">
      <TimerBar percentage={timerPct} />
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2">
          <div className="font-display text-lg font-semibold text-foreground">
            {recalled.size} recalled
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="bg-elevated rounded-lg py-3.5 px-4 font-mono text-[15px] border-2 border-border/30">
            {input ? (
              <span className="text-foreground">{input}</span>
            ) : (
              <span className="text-t-tertiary">type a word, press enter</span>
            )}
          </div>
        </div>
        <div className="flex-1 px-3 flex flex-wrap content-start gap-1 overflow-auto no-scrollbar">
          {Array.from(recalled).map((w) => (
            <span
              key={w}
              className="inline-block py-0.5 px-2.5 rounded-full bg-[hsl(var(--game-green)/0.12)] border border-[hsl(var(--game-green)/0.2)] font-sans text-[11px] text-game-green animate-chip-pop"
            >
              {w}
            </span>
          ))}
          {wrongChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-block py-0.5 px-2.5 rounded-full bg-[hsl(var(--game-red)/0.12)] border border-[hsl(var(--game-red)/0.2)] font-sans text-[11px] text-game-red animate-chip-pop opacity-70"
            >
              {chip.text} ✗
            </span>
          ))}
        </div>
        <QwertyPad onKey={handleKey} />
      </div>
    </div>
  );
};

export default MemoryGame;
