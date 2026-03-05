import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestion, getLevelForQuestion, type MathQuestion } from "@/lib/mathEngine";
import TimerBar from "@/components/game/TimerBar";
import NumPad from "@/components/game/NumPad";

type GamePhase = "pre" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const GAME_DURATION = 120;

const MathGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>("pre");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [input, setInput] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [score, setScore] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState<number | null>(null);
  const questionStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevExpressionRef = useRef<string>("");

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
    setRevealAnswer(null);
    questionStartRef.current = Date.now();
  }, [questionsAttempted]);

  const startGame = () => {
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

    setDisabled(true);
    setQuestionsAttempted((p) => p + 1);

    const timeTaken = (Date.now() - questionStartRef.current) / 1000;

    if (userAnswer === question.answer) {
      setAnswerState("correct");
      const pts = 10 + (timeTaken < 5 ? 5 : 0);
      setCorrectAnswers((p) => p + 1);
      setScore((p) => p + pts);
      setTimeout(() => {
        nextQuestion();
        setQuestionsAttempted((p) => p); // force re-render for level
      }, 300);
    } else {
      setAnswerState("wrong");
      setRevealAnswer(question.answer);
      setTimeout(() => {
        nextQuestion();
      }, 800);
    }
  }, [question, disabled, input, nextQuestion]);

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

  // Save score on result
  useEffect(() => {
    if (phase === "result" && score > 0) {
      const today = new Date().toISOString().split("T")[0];
      const key = `bs_scores_${today}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      const acc = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
      if (!existing.math || existing.math < score) {
        existing.math = score;
        existing.mathAcc = acc;
        localStorage.setItem(key, JSON.stringify(existing));
      }
      // Update best
      const best = parseInt(localStorage.getItem("bs_best") || "0");
      const total = (existing.math || 0) + (existing.memory || 0) + (existing.coloring || 0);
      if (total > best) localStorage.setItem("bs_best", String(total));
    }
  }, [phase, score, questionsAttempted, correctAnswers]);

  // PRE-GAME
  if (phase === "pre") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-7">
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
    return (
      <div className="flex flex-col min-h-screen p-5 pt-5">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start">
          ←
        </button>
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mt-5">
          Rapid Math
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-display text-[60px] font-bold text-game-red leading-none">{score}</div>
          <div className="font-sans text-sm text-muted-foreground mt-1">points</div>
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
        <div className="flex gap-2.5 justify-center">
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
    <div className="flex flex-col min-h-screen">
      <TimerBar percentage={timerPct} />
      <div className="flex-1 flex flex-col">
        {/* Stats */}
        <div className="flex justify-end px-4 py-2">
          <span className="font-sans text-[11px] text-muted-foreground">
            {questionsAttempted} ans · {correctAnswers} ✓
          </span>
        </div>

        {/* Expression */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="font-mono text-[26px] font-semibold text-foreground animate-fade-in-up">
            {question?.expression}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 pb-3">
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
          {answerState === "correct" && (
            <p className="font-sans text-[10px] text-game-green mt-1">Auto-advancing...</p>
          )}
          {answerState === "wrong" && revealAnswer !== null && (
            <p className="font-sans text-[11px] text-muted-foreground mt-1.5">
              Answer was {revealAnswer} · advancing in 0.8s
            </p>
          )}
        </div>

        <NumPad onKey={handleKey} disabled={disabled} />
      </div>
    </div>
  );
};

export default MathGame;
