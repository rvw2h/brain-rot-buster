import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion, getLevelForQuestion, type MathQuestion } from "@/lib/mathEngine";
import TimerBar from "@/components/game/TimerBar";
import NumPad from "@/components/game/NumPad";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { persistGameSession } from "@/lib/gamePersistence";

type GamePhase = "pre" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const GAME_DURATION = 120;

const MathGame = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("pre");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [input, setInput] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [score, setScore] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [lastSessionScore, setLastSessionScore] = useState<number | null>(null);
  const wrongAttemptsRef = useRef(0);
  const questionStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevExpressionRef = useRef<string>("");
  const gameStartRef = useRef<number | null>(null);

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
    questionStartRef.current = Date.now();
    wrongAttemptsRef.current = 0;
  }, [questionsAttempted]);

  const startGame = () => {
    // Read last session score before starting
    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    setLastSessionScore(existing.math || null);

    prevExpressionRef.current = "";
    gameStartRef.current = Date.now();
    setPhase("playing");
    setTimeLeft(GAME_DURATION);
    setQuestionsAttempted(0);
    setCorrectAnswers(0);
    setScore(0);
    nextQuestion();
  };

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (!question || disabled || !input) return;
    const userAnswer = parseInt(input);
    if (isNaN(userAnswer)) return;

    setQuestionsAttempted((p) => p + 1);

    const timeTaken = (Date.now() - questionStartRef.current) / 1000;

    if (userAnswer === question.answer) {
      setDisabled(true);
      setAnswerState("correct");
      const pts = 10 + (timeTaken < 5 ? 5 : 0);
      setCorrectAnswers((p) => p + 1);
      setScore((p) => p + pts);
      setTimeout(() => {
        nextQuestion();
      }, 300);
    } else {
      // Wrong answer: allow up to 2 attempts, then auto-skip to next question
      wrongAttemptsRef.current += 1;
      if (wrongAttemptsRef.current >= 2) {
        wrongAttemptsRef.current = 0;
        setAnswerState("wrong");
        setInput("");
        setTimeout(() => {
          setAnswerState("idle");
          nextQuestion();
        }, 400);
      } else {
        setAnswerState("wrong");
        setInput("");
        setTimeout(() => setAnswerState("idle"), 600);
      }
    }
  }, [question, disabled, input, nextQuestion]);

  // Auto-submit when input matches answer
  useEffect(() => {
    if (!question || disabled || !input || answerState !== "idle") return;
    const userAnswer = parseInt(input);
    if (!isNaN(userAnswer) && userAnswer === question.answer) {
      handleSubmit();
    }
  }, [input, question, disabled, answerState, handleSubmit]);

  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return;
      if (key === "✓") {
        handleSubmit();
      } else if (key === "←") {
        setInput((p) => p.slice(0, -1));
      } else if (/^[0-9]$/.test(key)) {
        setInput((p) => {
          if (p.length >= 6) return p;
          return p + key;
        });
      } else if (key === "-" && input === "") {
        setInput("-");
      }
    },
    [disabled, handleSubmit, input]
  );

  // Physical keyboard support
  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
      else if (e.key === "Backspace") setInput((p) => p.slice(0, -1));
      else if (/^[0-9]$/.test(e.key)) handleKey(e.key);
      else if (e.key === "-" && input === "") setInput("-");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleSubmit, handleKey, input]);

  // Save score on result + confetti + Supabase persistence
  useEffect(() => {
    if (phase === "result" && score > 0) {
      const today = new Date().toISOString().split("T")[0];
      const key = `bs_scores_${today}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      const acc =
        questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
      if (!existing.math || existing.math < score) {
        existing.math = score;
        existing.mathAcc = acc;
        localStorage.setItem(key, JSON.stringify(existing));
      }
      const best = parseInt(localStorage.getItem("bs_best") || "0");
      const total = (existing.math || 0) + (existing.memory || 0);
      if (total > best) localStorage.setItem("bs_best", String(total));

      // Fire confetti if improved
      if (lastSessionScore !== null && score > lastSessionScore) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      const startedAtIso =
        gameStartRef.current != null ? new Date(gameStartRef.current).toISOString() : new Date().toISOString();
      const completedAtIso = new Date().toISOString();

      void persistGameSession({
        gameType: "math",
        user: profile ?? null,
        score,
        accuracyPct: acc,
        startedAt: startedAtIso,
        completedAt: completedAtIso,
        metadata: {
          questionsAttempted,
          correctAnswers,
          durationSeconds: GAME_DURATION,
        },
      });
    }
  }, [phase, score, questionsAttempted, correctAnswers, lastSessionScore, profile]);

  // PRE-GAME
  if (phase === "pre") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-7 overflow-hidden">
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-4">
          Rapid Math
        </div>
        <h1 className="font-display text-[22px] font-semibold text-foreground text-center">
          Solve as many as you can
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 text-center">
          120 seconds. BODMAS. No multiple choice.
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
    const accuracy = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
    const delta = lastSessionScore !== null ? score - lastSessionScore : null;

    return (
      <div className="h-screen overflow-hidden flex flex-col p-5 pt-5">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start flex-shrink-0">
          ←
        </button>
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mt-5">
          Rapid Math
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
              [String(questionsAttempted), "attempted"],
              [String(correctAnswers), "correct"],
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
        </div>
        <div className="flex gap-2.5 justify-center flex-shrink-0">
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

  // PLAYING
  const timerPct = (timeLeft / GAME_DURATION) * 100;

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <TimerBar percentage={timerPct} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-end px-4 py-2 flex-shrink-0">
          <span className="font-sans text-[11px] text-muted-foreground">
            {questionsAttempted} ans · {correctAnswers} ✓
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
          <div className="font-mono text-[26px] font-semibold text-foreground animate-fade-in-up">
            {question?.expression}
          </div>
        </div>

        <div className="px-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 bg-elevated rounded-lg py-3.5 px-4 font-mono text-[15px] transition-all border-2 ${
                answerState === "correct"
                  ? "border-game-green bg-[hsl(var(--game-green)/0.08)] shadow-[0_0_0_2px_hsl(var(--game-green)/0.3)] animate-flash-green"
                  : answerState === "wrong"
                  ? "border-game-red bg-[hsl(var(--game-red)/0.08)] shadow-[0_0_0_2px_hsl(var(--game-red)/0.5)] animate-shake"
                  : "border-border/30"
              }`}
            >
              {input ? (
                <span className="text-foreground">{input}</span>
              ) : (
                <span className="text-t-tertiary">your answer</span>
              )}
            </div>
            {answerState === "correct" && (
              <span className="text-game-green text-lg">✓</span>
            )}
          </div>
        </div>

        <NumPad onKey={handleKey} disabled={disabled} />
      </div>
    </div>
  );
};

export default MathGame;
