import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion, getLevelForQuestion, type MathQuestion } from "@/lib/mathEngine";
import TimerBar from "@/components/game/TimerBar";
import NumPad from "@/components/game/NumPad";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import { persistGameSession } from "@/lib/gamePersistence";

type GamePhase = "pre" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const SIMPLE_GAME_DURATION = 120;
const AURA_QUESTION_TIME = 10;

interface FloatingDelta {
  id: number;
  val: string;
  color: string;
}

const MathGame = () => {
  const navigate = useNavigate();
  const { profile, manualUser } = useAuth();
  const { mode } = useAppMode();
  const isAura = mode === "aura";

  const [phase, setPhase] = useState<GamePhase>("pre");
  const [timeLeft, setTimeLeft] = useState(SIMPLE_GAME_DURATION);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [input, setInput] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [score, setScore] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [lastSessionScore, setLastSessionScore] = useState<number | null>(null);
  const [deltas, setDeltas] = useState<FloatingDelta[]>([]);
  const [showScreenPulse, setShowScreenPulse] = useState<"correct" | "wrong" | null>(null);

  const deltaIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevExpressionRef = useRef<string>("");
  const gameStartRef = useRef<number | null>(null);

  const addDelta = (val: string, color: string) => {
    const id = ++deltaIdRef.current;
    setDeltas(prev => [...prev, { id, val, color }]);
    setTimeout(() => {
      setDeltas(prev => prev.filter(d => d.id !== id));
    }, 600);
  };

  const nextQuestion = useCallback(() => {
    const level = getLevelForQuestion(questionsAttempted + 1);
    let q: MathQuestion;
    let attempts = 0;
    do {
      q = generateQuestion(level);
      attempts++;
    } while (q.expression === prevExpressionRef.current && attempts < 5);
    prevExpressionRef.current = q.expression;
    setQuestion(q);
    setInput("");
    setAnswerState("idle");
    setDisabled(false);
    if (isAura) setTimeLeft(AURA_QUESTION_TIME);
  }, [questionsAttempted, isAura]);

  const startGame = () => {
    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    const scoreKey = isAura ? "aura_math" : "math";
    setLastSessionScore(existing[scoreKey] || null);

    prevExpressionRef.current = "";
    gameStartRef.current = Date.now();
    setPhase("playing");
    setTimeLeft(isAura ? AURA_QUESTION_TIME : SIMPLE_GAME_DURATION);
    setQuestionsAttempted(0);
    setCorrectAnswers(0);
    setScore(0);
    setDeltas([]);
    nextQuestion();
  };

  const handleWrong = useCallback((isTimeout = false) => {
    setQuestionsAttempted(p => p + 1);
    if (isAura) {
      setScore(p => Math.max(-100, p - 3));
      addDelta("-3", "#FF2D55");
      setShowScreenPulse("wrong");
      setTimeout(() => setShowScreenPulse(null), 400);
    }
    setAnswerState("wrong");
    setDisabled(true);
    setTimeout(() => {
      nextQuestion();
    }, isTimeout ? 0 : 400);
  }, [isAura, nextQuestion]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isAura) {
             handleWrong(true); 
             return AURA_QUESTION_TIME;
          } else {
            clearInterval(timerRef.current);
            setPhase("result");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, isAura, handleWrong]);

  const handleSubmit = useCallback(() => {
    if (!question || disabled || !input) return;
    const userAnswer = parseInt(input);
    if (isNaN(userAnswer)) return;

    if (userAnswer === question.answer) {
      setDisabled(true);
      setAnswerState("correct");
      setQuestionsAttempted(p => p + 1);
      setCorrectAnswers(p => p + 1);
      
      const pts = isAura ? 5 : 3;
      setScore(p => p + pts);
      addDelta(`+${pts}`, isAura ? "#00F5A0" : "#FF2D55");
      if (isAura) {
        setShowScreenPulse("correct");
        setTimeout(() => setShowScreenPulse(null), 300);
      }
      
      setTimeout(() => {
        nextQuestion();
      }, isAura ? 150 : 300);
    } else {
      handleWrong();
    }
  }, [question, disabled, input, isAura, nextQuestion, handleWrong]);

  useEffect(() => {
    if (!question || disabled || !input || answerState !== "idle") return;
    const userAnswer = parseInt(input);
    if (!isNaN(userAnswer)) {
      if (input.length >= String(question.answer).length || (input.length === 1 && question.answer >= 0 && question.answer < 10)) {
         if (userAnswer === question.answer) handleSubmit();
      }
    }
  }, [input, question, disabled, answerState, handleSubmit]);

  const handleKey = useCallback((key: string) => {
    if (disabled) return;
    if (key === "✓") handleSubmit();
    else if (key === "←") setInput(p => p.slice(0, -1));
    else if (/^[0-9]$/.test(key)) {
      setInput(p => p.length >= 6 ? p : p + key);
    } else if (key === "-" && input === "") setInput("-");
  }, [disabled, handleSubmit, input]);

  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
      else if (e.key === "Backspace") setInput(p => p.slice(0, -1));
      else if (/^[0-9]$/.test(e.key)) handleKey(e.key);
      else if (e.key === "-" && input === "") setInput("-");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleSubmit, handleKey, input]);

  useEffect(() => {
    if (phase === "result") {
      const today = new Date().toISOString().split("T")[0];
      const key = `bs_scores_${today}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      const scoreKey = isAura ? "aura_math" : "math";
      const acc = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
      
      if (!existing[scoreKey] || existing[scoreKey] < score) {
        existing[scoreKey] = score;
        if (!isAura) existing.mathAcc = acc;
        localStorage.setItem(key, JSON.stringify(existing));
      }
      
      const bestKey = isAura ? "bs_best_aura" : "bs_best";
      const best = parseInt(localStorage.getItem(bestKey) || "0");
      if (score > best) localStorage.setItem(bestKey, String(score));

      if (lastSessionScore !== null && score > lastSessionScore) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      const startedAtIso = gameStartRef.current ? new Date(gameStartRef.current).toISOString() : new Date().toISOString();
      const completedAtIso = new Date().toISOString();

      void persistGameSession({
        gameType: "math",
        user: profile || manualUser || null,
        score,
        accuracyPct: acc,
        startedAt: startedAtIso,
        completedAt: completedAtIso,
        mode: isAura ? "aura" : "simple",
        metadata: {
          questionsAttempted,
          correctAnswers,
          mode: isAura ? "aura" : "simple",
        },
      });
    }
  }, [phase, score, questionsAttempted, correctAnswers, isAura, lastSessionScore, profile, manualUser]);

  const timerPct = isAura ? (timeLeft / AURA_QUESTION_TIME) * 100 : (timeLeft / SIMPLE_GAME_DURATION) * 100;

  if (phase === "pre") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-7 bg-background overflow-hidden relative">
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-4">Rapid Math</div>
        <h1 className="font-display text-[22px] font-semibold text-foreground text-center">
          {isAura ? "Speed is everything." : "Solve as many as you can"}
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 text-center max-w-[240px]">
          {isAura ? "10s per question. Correct +5, Wrong -3. Stay sharp." : "120 seconds. BODMAS. No multiple choice."}
        </p>
        <button onClick={startGame} className={`mt-8 rounded-lg px-8 py-3 font-sans text-sm font-semibold transition-all ${isAura ? "bg-[#FF2D55] text-white" : "bg-game-red text-white"}`}>
          {isAura ? "GO AURA →" : "Start →"}
        </button>
        <button onClick={() => navigate("/home")} className="mt-4 font-sans text-xs text-muted-foreground">← Back</button>
      </div>
    );
  }

  if (phase === "result") {
    const accuracy = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
    const delta = lastSessionScore !== null ? score - lastSessionScore : null;
    return (
      <div className="h-screen overflow-hidden flex flex-col p-5 bg-background">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start mb-4">←</button>
        <div className="font-display text-sm font-bold text-[#FF2D55] uppercase tracking-widest mb-1">{isAura ? "Aura Gained." : "Session Over."}</div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`font-display text-[72px] font-bold leading-none ${isAura && score > 0 ? "text-[#FF2D55] drop-shadow-[0_0_20px_rgba(255,45,85,0.3)]" : "text-foreground"}`}>{score}</div>
          <div className="font-sans text-sm text-muted-foreground mt-2">points</div>
          {delta !== null && delta !== 0 && (
            <div className={`font-sans text-xs mt-4 px-3 py-1 rounded-full ${delta > 0 ? "bg-game-green/10 text-game-green" : "bg-game-red/10 text-game-red"}`}>{delta > 0 ? `↑ +${delta}` : `↓ ${delta}`} vs last session</div>
          )}
          <div className="grid grid-cols-3 gap-0 w-full mt-12 border-t border-b border-border/10 py-6">
            {[ [String(questionsAttempted), "SOLVED"], [String(correctAnswers), "CORRECT"], [`${accuracy}%`, "ACCURACY"], ].map(([n, l]) => (
              <div key={l} className="text-center border-r border-border/10 last:border-0 px-2">
                <div className="font-mono text-xl font-bold text-foreground">{n}</div>
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

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col bg-background relative ${showScreenPulse === "wrong" ? "animate-screen-flash-red" : ""} ${showScreenPulse === "correct" ? "animate-screen-flash-green" : ""}`}>
      <TimerBar percentage={timerPct} color={isAura ? "#FF2D55" : undefined} />
      {deltas.map(d => (
        <div key={d.id} className="absolute left-1/2 top-40 -translate-x-1/2 font-display text-2xl font-bold animate-float-up z-20" style={{ color: d.color }}>{d.val}</div>
      ))}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between px-4 py-2 flex-shrink-0 items-center">
          <span className={`font-display text-xl font-bold ${isAura ? "text-[#FF2D55] animate-score-pulse" : "text-foreground"}`}>{score} pts</span>
          {isAura && (
             <div className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(255,45,85,0.12)] border border-[rgba(255,45,85,0.25)]">
               <span className="text-[#FF2D55] font-display text-[8px] font-bold tracking-[0.15em] leading-none uppercase">Aura Mode</span>
             </div>
          )}
          {!isAura && <span className="font-sans text-[11px] text-muted-foreground">{questionsAttempted} solved</span>}
        </div>
        <div className="flex-1 flex items-center justify-center px-4 overflow-hidden min-h-[140px]">
          <div className={`font-mono text-[32px] font-bold text-foreground text-center ${timeLeft <= 3 && isAura ? "animate-timer-pulse text-game-red" : ""}`}>{question?.expression}</div>
        </div>
        <div className="px-6 pb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`flex-1 rounded-lg py-3.5 px-4 font-mono text-[20px] transition-all border-2 ${answerState === "correct" ? "border-game-green bg-game-green/5 animate-flash-green" : answerState === "wrong" ? "border-game-red bg-game-red/5 animate-shake" : "border-[rgba(255,255,255,0.1)] bg-[#161616]"}`}>
              {input ? <span className="text-foreground">{input}</span> : <span className="text-muted-foreground/30">?</span>}
            </div>
          </div>
        </div>
        <NumPad onKey={handleKey} disabled={disabled} />
      </div>
    </div>
  );
};

export default MathGame;
