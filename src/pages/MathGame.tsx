import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion, getLevelForQuestion, type MathQuestion } from "@/lib/mathEngine";
import TimerBar from "@/components/game/TimerBar";
import NumPad from "@/components/game/NumPad";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import { persistGameSession } from "@/lib/gamePersistence";
import { 
  getDailySeed, 
  getMessage, 
  SIMPLE_MATH_PREGAME, 
  AURA_MATH_PREGAME,
  SIMPLE_RESULT_POSITIVE,
  SIMPLE_RESULT_LOW,
  AURA_RESULT_BEAST,
  AURA_RESULT_SOLID,
  AURA_RESULT_NEGATIVE 
} from "@/lib/messages";
import FlameParticles from "@/components/game/FlameParticles";

type GamePhase = "pre" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const SESSION_DURATION = 120;
const AURA_QUESTION_TIME = 10;

interface FloatingDelta {
  id: number;
  val: string;
  color: string;
  type?: "point" | "lightning";
}

const MathGame = () => {
  const navigate = useNavigate();
  const { profile, manualUser } = useAuth();
  const { mode } = useAppMode();
  const isAura = mode === "aura";

  const [phase, setPhase] = useState<GamePhase>("pre");
  const [overallTime, setOverallTime] = useState(SESSION_DURATION);
  const [questionTime, setQuestionTime] = useState(AURA_QUESTION_TIME);
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
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  const deltaIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevExpressionRef = useRef<string>("");
  const gameStartRef = useRef<number | null>(null);

  // Daily Message Logic
  const userId = profile?.first_name || manualUser?.first_name || "Guest";
  const dailySeed = useMemo(() => getDailySeed(userId), [userId]);
  
  const preGameHeading = getMessage(isAura ? AURA_MATH_PREGAME : SIMPLE_MATH_PREGAME, dailySeed);
  
  const resultMessage = useMemo(() => {
    if (!isAura) {
      return getMessage(score > 0 ? SIMPLE_RESULT_POSITIVE : SIMPLE_RESULT_LOW, dailySeed);
    }
    if (score <= 0) return getMessage(AURA_RESULT_NEGATIVE, dailySeed);
    const beatLast = lastSessionScore !== null ? score > lastSessionScore : true;
    return getMessage(beatLast ? AURA_RESULT_BEAST : AURA_RESULT_SOLID, dailySeed);
  }, [isAura, score, lastSessionScore, dailySeed]);

  const addDelta = (val: string, color: string, type: "point" | "lightning" = "point") => {
    const id = ++deltaIdRef.current;
    setDeltas(prev => [...prev, { id, val, color, type }]);
    setTimeout(() => {
      setDeltas(prev => prev.filter(d => d.id !== id));
    }, type === "lightning" ? 600 : 800);
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
    
    setIsNewQuestion(true);
    setTimeout(() => {
      setQuestion(q);
      setInput("");
      setAnswerState("idle");
      setDisabled(false);
      if (isAura) setQuestionTime(AURA_QUESTION_TIME);
      setIsNewQuestion(false);
    }, 100);
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
    setOverallTime(SESSION_DURATION);
    setQuestionTime(AURA_QUESTION_TIME);
    setQuestionsAttempted(0);
    setCorrectAnswers(0);
    setScore(0);
    setDeltas([]);
    nextQuestion();
  };

  const handleWrong = useCallback((isTimeout = false) => {
    setQuestionsAttempted(p => p + 1);
    if (isAura) {
      setScore(p => Math.max(-100, p - 5));
      addDelta("-5", "#FF2D55");
      setShowScreenPulse("wrong");
      setTimeout(() => setShowScreenPulse(null), 400);
    }
    setAnswerState("wrong");
    setDisabled(true);
    setTimeout(() => {
      nextQuestion();
    }, isTimeout ? 0 : 400);
  }, [isAura, nextQuestion]);

  // Combined Overal & Per-Question Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      // Overall session timer
      setOverallTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase("result");
          return 0;
        }
        return prev - 1;
      });

      // Per-question timer (Aura only)
      if (isAura) {
        setQuestionTime((prev) => {
          if (prev <= 1) {
            handleWrong(true);
            return AURA_QUESTION_TIME;
          }
          return prev - 1;
        });
      }
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
      
      const pts = isAura ? 10 : 3;
      setScore(p => p + pts);
      addDelta(`+${pts}`, isAura ? "#00F5A0" : "#FF2D55");
      if (isAura) {
        addDelta("⚡", "#FFD60A", "lightning");
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

  if (phase === "pre") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-7 bg-background overflow-hidden relative">
        {isAura && <FlameParticles />}
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-4 z-10">Rapid Math</div>
        <h1 className="font-display text-[22px] font-semibold text-foreground text-center z-10">
          {preGameHeading}
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 text-center max-w-[240px] z-10">
          {isAura ? "120 seconds · 10s per question · one shot" : "120 seconds · BODMAS · no multiple choice"}
        </p>
        <button onClick={startGame} className={`mt-8 rounded-lg px-8 py-3 font-sans text-sm font-semibold transition-all z-10 ${isAura ? "bg-[#FF2D55] text-white shadow-[0_0_20px_rgba(255,45,85,0.3)] animate-badge-breathe" : "bg-game-red text-white"}`}>
          {isAura ? "GO AURA →" : "Start →"}
        </button>
        <div className="mt-6 text-center z-10">
           {isAura ? (
             <p className="font-sans text-[12px] text-[#FF2D55]/70">
               ✓ Correct: +10pts   ·   ✗ Wrong: −5pts   ·   ⏱ Timeout: −5pts
             </p>
           ) : (
             <p className="font-sans text-[12px] text-[#888888]">
               Every correct answer counts. No penalties.
             </p>
           )}
        </div>
        <button onClick={() => navigate("/home")} className="mt-8 font-sans text-xs text-muted-foreground z-10">← Back</button>
      </div>
    );
  }

  if (phase === "result") {
    const accuracy = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
    const delta = lastSessionScore !== null ? score - lastSessionScore : null;
    const isNegative = score < 0;

    return (
      <div className={`h-screen overflow-hidden flex flex-col p-5 bg-background ${isAura ? "aura-scanlines" : ""}`}>
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start mb-4">←</button>
        <div className="font-display text-sm font-bold text-[#FF2D55] uppercase tracking-widest mb-1">{isAura ? "Aura Gained." : "Session Over."}</div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`font-display text-[72px] font-bold leading-none ${
               isAura 
                 ? (isNegative ? "text-[#888888]" : "text-[#FF2D55] animate-aura-glow") 
                 : (isNegative ? "text-game-red" : "text-foreground")
             }`}>
            {score}
          </div>
          <div className="font-sans text-sm text-muted-foreground mt-2">points</div>
          
          <div className="mt-4 mb-2">
            <p className={`font-sans text-[13px] italic text-center ${isAura ? "text-[#FF2D55]/80" : "text-[#888888]"}`}>
              "{resultMessage}"
            </p>
          </div>

          {delta !== null && delta !== 0 && (
            <div className={`font-sans text-xs mt-6 px-3 py-1 rounded-full ${delta > 0 ? "bg-game-green/10 text-game-green" : "bg-game-red/10 text-game-red"}`}>{delta > 0 ? `↑ +${delta}` : `↓ ${delta}`} vs last session</div>
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

  const overallPct = (overallTime / SESSION_DURATION) * 100;
  const questionPct = (questionTime / AURA_QUESTION_TIME) * 100;

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col bg-background relative ${isAura ? "aura-scanlines" : ""} ${showScreenPulse === "wrong" ? "animate-screen-flash-red" : ""} ${showScreenPulse === "correct" ? "animate-screen-flash-green" : ""}`}>
      <TimerBar percentage={overallPct} color={isAura ? "#FF2D55" : undefined} />
      
      {deltas.map(d => (
        <div 
          key={d.id} 
          className={`absolute left-1/2 -translate-x-1/2 font-display font-bold z-20 ${d.type === 'lightning' ? 'text-4xl animate-lightning top-1/2' : 'text-2xl animate-float-up top-40'}`} 
          style={{ color: d.color }}
        >
          {d.val}
        </div>
      ))}

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between px-4 py-2 flex-shrink-0 items-center">
          <span className={`font-display text-xl font-bold ${isAura ? (score < 0 ? "text-[#888888]" : "text-[#FF2D55] animate-score-pulse") : "text-foreground"}`}>{score} pts</span>
          
          <div className="flex flex-col items-end gap-1.5">
             <div className="font-mono text-sm text-game-red flex items-center gap-1.5 opacity-80">
               <span className={overallTime <= 10 ? "animate-timer-pulse" : ""}>
                 {String(Math.floor(overallTime / 60)).padStart(2, "0")}:
                 {String(overallTime % 60).padStart(2, "0")}
               </span>
             </div>
             {isAura && (
               <div className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(255,45,85,0.12)] border border-[rgba(255,45,85,0.25)] animate-badge-breathe">
                 <span className="text-[#FF2D55] font-display text-[8px] font-bold tracking-[0.15em] leading-none uppercase">Aura Mode</span>
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden relative">
          {isAura && (
            <div className="w-full max-w-[240px] mb-4">
               <div className="h-[2px] w-full bg-elevated rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-[#FF2D55] transition-all duration-300"
                    style={{ width: `${questionPct}%`, opacity: questionTime <= 3 ? 0.8 : 1 }}
                 />
               </div>
            </div>
          )}
          <div className={`font-mono text-[36px] font-bold text-foreground text-center transition-all duration-150 ${isNewQuestion ? "opacity-0 scale-95" : "opacity-100 scale-100"} ${questionTime <= 3 && isAura ? "animate-timer-pulse text-game-red" : ""}`}>
            {question?.expression}
          </div>
        </div>

        <div className="px-6 pb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`flex-1 rounded-lg py-3.5 px-4 font-mono text-[20px] transition-all border-2 ${
                answerState === "correct" ? "border-game-green bg-game-green/5 animate-flash-green" : 
                answerState === "wrong" ? "border-game-red bg-game-red/5 animate-shake" : 
                "border-[rgba(255,255,255,0.1)] bg-[#161616]"
              }`}>
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
