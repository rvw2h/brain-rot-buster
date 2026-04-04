import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import { persistGameSession } from "@/lib/gamePersistence";
import { 
  getQuestionSeed, 
  generateSymbolScan, 
  generateSequenceCheck,
  type SharpEyeQuestion
} from "@/lib/sharpEyeEngine";
import TimerBar from "@/components/game/TimerBar";
import { Check, X, ArrowRight, Eye, ShieldAlert, FileText, Hash } from "lucide-react";
import confetti from "canvas-confetti";
import { getDailySeed, getMessage, SIMPLE_MATH_PREGAME, AURA_MATH_PREGAME, SIMPLE_RESULT_POSITIVE, SIMPLE_RESULT_LOW, AURA_RESULT_BEAST, AURA_RESULT_SOLID, AURA_RESULT_NEGATIVE } from "@/lib/messages";
import FlameParticles from "@/components/game/FlameParticles";

type Phase = "pre" | "playing" | "result";

const SESSION_DURATION = 120;

const SharpEyeGame = () => {
  const navigate = useNavigate();
  const { profile, manualUser } = useAuth();
  const { mode } = useAppMode();
  const isAura = mode === "aura";

  const [phase, setPhase] = useState<Phase>("pre");
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [assumptionErrors, setAssumptionErrors] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message?: string } | null>(null);
  const [lastSessionScore, setLastSessionScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Aura Audit specific: current question within scenario
  const [subQuestionIndex, setSubQuestionIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const gameStartRef = useRef<number | null>(null);

  const userId = profile?.first_name || manualUser?.first_name || "Guest";
  const dailySeed = useMemo(() => getDailySeed(userId), [userId]);

  const loadGameData = async () => {
    setIsLoading(true);
    const qList: any[] = [];
    
    if (isAura) {
      // Fetch 5 scenarios, one from each category
      const categories = ['product_req', 'user_complaint', 'business_rule', 'meeting_notes', 'data_snapshot'];
      for (const cat of categories) {
        const { data } = await supabase
          .from('audit_scenarios')
          .select('*')
          .eq('category', cat)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(); // In real app, would use week_index and user history
        if (data) qList.push(data);
      }
    } else {
      // Fetch 4 error spotters
      const { data: errors } = await supabase
        .from('sharp_eye_questions')
        .select('*')
        .eq('type', 'error_spotter')
        .eq('is_active', true)
        .limit(4);
      
      if (errors) qList.push(...errors);

      // Generate 3 symbol scans and 3 sequence checks
      for (let i = 0; i < 3; i++) {
        const seed = getQuestionSeed(userId, i);
        qList.push(generateSymbolScan(seed));
        qList.push(generateSequenceCheck(seed + 100));
      }
      
      // Shuffle the 10 questions
      qList.sort(() => Math.random() - 0.5);
    }

    setQuestions(qList);
    setIsLoading(false);
  };

  const startGame = async () => {
    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    const scoreKey = isAura ? "aura_audit" : "sharp_eye";
    setLastSessionScore(existing[scoreKey] || null);

    await loadGameData();
    
    setScore(0);
    setCurrentIndex(0);
    setSubQuestionIndex(0);
    setCorrectCount(0);
    setAssumptionErrors(0);
    setTimeLeft(SESSION_DURATION);
    setPhase("playing");
    gameStartRef.current = Date.now();
  };

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleAnswer = (userAnswer: string | number) => {
    if (feedback) return;

    const current = questions[currentIndex];
    let isCorrect = false;
    let explanation = "";

    if (isAura) {
      const qObj = current.questions[subQuestionIndex];
      isCorrect = userAnswer === qObj.correct;
      explanation = qObj.explanation;
      
      if (isCorrect) {
        setScore(s => s + 20);
        setCorrectCount(c => c + 1);
      } else {
        setScore(s => Math.max(-200, s - 10));
        if (qObj.trap_type) setAssumptionErrors(a => a + 1);
      }
    } else {
      isCorrect = String(userAnswer).toLowerCase() === String(current.correct).toLowerCase();
      explanation = current.explanation;
      
      if (isCorrect) {
        setScore(s => s + 10);
        setCorrectCount(c => c + 1);
      }
    }

    setFeedback({ isCorrect, message: explanation });

    // Auto-advance
    setTimeout(() => {
      setFeedback(null);
      if (isAura) {
        if (subQuestionIndex < 2) {
          setSubQuestionIndex(i => i + 1);
        } else {
          if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSubQuestionIndex(0);
          } else {
            setPhase("result");
          }
        }
      } else {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(i => i + 1);
        } else {
          setPhase("result");
        }
      }
    }, isAura ? (isCorrect ? 600 : 2500) : (isCorrect ? 400 : 2000));
  };

  useEffect(() => {
    if (phase === "result") {
      const today = new Date().toISOString().split("T")[0];
      const key = `bs_scores_${today}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      const scoreKey = isAura ? "aura_audit" : "sharp_eye";
      const totalPossible = isAura ? 15 : 10;
      const acc = Math.round((correctCount / totalPossible) * 100);

      if (!existing[scoreKey] || existing[scoreKey] < score) {
        existing[scoreKey] = score;
        localStorage.setItem(key, JSON.stringify(existing));
      }

      if (lastSessionScore !== null && score > lastSessionScore) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      const startedAt = gameStartRef.current ? new Date(gameStartRef.current).toISOString() : new Date().toISOString();
      persistGameSession({
        gameType: isAura ? "audit" : "sharp_eye",
        user: profile || manualUser,
        score,
        accuracyPct: acc,
        startedAt,
        completedAt: new Date().toISOString(),
        mode: isAura ? "aura" : "simple",
        metadata: { assumptionErrors, correctCount },
        assumptionErrors
      });
    }
  }, [phase]);

  if (phase === "pre") {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-7 bg-background overflow-hidden relative">
        {isAura && <FlameParticles />}
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-4 z-10">
          {isAura ? "The Audit" : "Sharp Eye"}
        </div>
        <h1 className="font-display text-[22px] font-semibold text-foreground text-center z-10">
          {isAura ? "Read everything. Assume nothing." : "Look closer. Find the floor."}
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 text-center max-w-[240px] z-10">
          {isAura ? "120 seconds · 15 questions · extreme precision" : "120 seconds · 10 questions · visual detail"}
        </p>
        <button 
          onClick={startGame} 
          disabled={isLoading}
          className={`mt-8 rounded-lg px-8 py-3 font-sans text-sm font-semibold transition-all z-10 ${
            isAura ? "bg-[#FF2D55] text-white animate-badge-breathe" : "bg-game-red text-white"
          } disabled:opacity-50`}
        >
          {isLoading ? "Loading..." : (isAura ? "START AUDIT →" : "Start →")}
        </button>
        
        <div className="mt-6 text-center z-10">
          {isAura ? (
            <p className="font-sans text-[12px] text-[#FF2D55]/70">
              ✓ Correct: +20pts   ·   ✗ Wrong: −10pts
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
    const totalQ = isAura ? 15 : 10;
    const acc = Math.round((correctCount / totalQ) * 100);
    
    let resultMsg = "";
    if (isAura) {
      if (assumptionErrors === 0 && score > 0) resultMsg = "Clean read. Zero assumptions. That's elite. 🔥";
      else if (assumptionErrors <= 2 && score > 0) resultMsg = "Mostly sharp. Watch for conditions in the small print.";
      else if (score <= 0) resultMsg = "The details were all there. You missed them. Lock in.";
      else resultMsg = "Still jumping to conclusions. Read every word next time.";
    } else {
      resultMsg = `Your brain caught ${correctCount} of ${totalQ} details today.`;
    }

    return (
      <div className={`h-screen overflow-hidden flex flex-col p-5 bg-background ${isAura ? "aura-scanlines" : ""}`}>
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start mb-4">←</button>
        <h2 className="font-display text-sm font-bold text-primary uppercase tracking-widest mb-1">
          {isAura ? "Audit Complete." : "Sharp Eye Complete."}
        </h2>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`font-display text-[72px] font-bold leading-none ${isAura && score > 0 ? "text-primary animate-aura-glow" : "text-foreground"}`}>
            {score}
          </div>
          <div className="font-sans text-sm text-muted-foreground mt-2">points</div>
          
          <div className="mt-6 px-4 text-center">
             <p className={`font-sans text-[13px] italic ${isAura ? "text-primary/80" : "text-muted-foreground"}`}>
               {resultMsg}
             </p>
          </div>

          <div className="grid grid-cols-3 gap-0 w-full mt-12 border-t border-b border-border/10 py-6">
            <div className="text-center border-r border-border/10">
              <div className="font-mono text-xl font-bold">{correctCount}</div>
              <div className="font-sans text-[8px] text-muted-foreground uppercase mt-1">Correct</div>
            </div>
            <div className="text-center border-r border-border/10">
              <div className="font-mono text-xl font-bold">{acc}%</div>
              <div className="font-sans text-[8px] text-muted-foreground uppercase mt-1">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-xl font-bold">{isAura ? assumptionErrors : (totalQ - correctCount)}</div>
              <div className="font-sans text-[8px] text-muted-foreground uppercase mt-1">
                {isAura ? "Traps" : "Missed"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-auto mb-8">
          <button onClick={startGame} className={`w-full py-4 rounded-xl font-display text-sm font-bold transition-all shadow-lg ${isAura ? "bg-primary text-white" : "bg-game-red text-white"}`}>
            {isAura ? "GO AGAIN →" : "PLAY AGAIN"}
          </button>
          <button onClick={() => navigate("/home")} className="w-full py-4 bg-surface border border-border/50 rounded-xl font-display text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const timerPct = (timeLeft / SESSION_DURATION) * 100;

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col bg-background relative ${isAura ? "aura-scanlines" : ""}`}>
      <TimerBar percentage={timerPct} color={isAura ? "#FF2D55" : undefined} />
      
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-surface border border-border/50">
               {isAura ? <ShieldAlert className="w-4 h-4 text-primary" /> : (
                 currentQ?.type === 'symbol_scan' ? <Eye className="w-4 h-4 text-game-red" /> :
                 currentQ?.type === 'sequence_check' ? <Hash className="w-4 h-4 text-game-red" /> :
                 <FileText className="w-4 h-4 text-game-red" />
               )}
            </div>
            <span className="font-display text-lg font-bold">{score} pts</span>
          </div>
          <div className="font-mono text-sm text-game-red">
             {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {isAura ? (
            /* Audit Layout */
            <div className="flex flex-col gap-4">
              <div className="bg-[#161616] border border-border/50 rounded-xl p-4 shadow-sm">
                <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Scenario Brief</div>
                <div className="font-sans text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {currentQ.brief}
                </div>
              </div>
              
              <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="font-display text-base font-bold text-foreground">
                  {currentQ.questions[subQuestionIndex].question}
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.questions[subQuestionIndex].options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedback}
                      className={`w-full py-3.5 px-4 rounded-lg text-left font-sans text-sm transition-all border-2 ${
                        feedback && opt === currentQ.questions[subQuestionIndex].correct ? "border-game-green bg-game-green/5" :
                        feedback && opt === feedback.message?.split(':')[0] ? "border-game-red" : // Mockup logic
                        "bg-[#161616] border-border/20 active:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Sharp Eye Layout */
            <div className="flex flex-col gap-6">
              {currentQ?.type === 'symbol_scan' && (
                <div className="flex flex-col items-center">
                  <div className="grid grid-cols-6 gap-2 bg-[#161616] p-4 rounded-xl border border-border/50 font-mono text-lg">
                    {currentQ.stimulus.map((row: string[], rIdx: number) => 
                      row.map((char: string, cIdx: number) => (
                        <div key={`${rIdx}-${cIdx}`} className="w-8 h-8 flex items-center justify-center text-foreground/80">
                          {char}
                        </div>
                      ))
                    )}
                  </div>
                  <h3 className="mt-6 font-display text-base font-bold text-center">
                    {currentQ.question}
                  </h3>
                  <div className="mt-4 grid grid-cols-4 gap-2 w-full">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                      <button 
                        key={n}
                        onClick={() => handleAnswer(n)}
                        disabled={!!feedback}
                        className="py-3 bg-surface border border-border/50 rounded-lg font-mono font-bold"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQ?.type === 'sequence_check' && (
                <div className="flex flex-col items-center">
                   <div className="w-full space-y-4">
                     <div className="bg-[#161616] p-4 rounded-lg border border-border/30 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Reference</div>
                        <div className="font-mono text-lg tracking-wider text-foreground">{currentQ.stimulus.reference}</div>
                     </div>
                     <div className="bg-[#161616] p-4 rounded-lg border border-border/30 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Version 2</div>
                        <div className="font-mono text-lg tracking-wider text-foreground">{currentQ.stimulus.version}</div>
                     </div>
                   </div>
                   <h3 className="mt-6 font-display text-base font-bold text-center">
                    {currentQ.question}
                  </h3>
                  <div className="mt-6 flex gap-4 w-full">
                    <button onClick={() => handleAnswer("Same")} disabled={!!feedback} className="flex-1 py-4 bg-surface border-2 border-border/50 rounded-xl font-display font-bold text-foreground">SAME</button>
                    <button onClick={() => handleAnswer("Different")} disabled={!!feedback} className="flex-1 py-4 bg-surface border-2 border-border/50 rounded-xl font-display font-bold text-foreground">DIFFERENT</button>
                  </div>
                </div>
              )}

              {currentQ?.type === 'error_spotter' && (
                <div className="flex flex-col">
                   <div className="bg-[#161616] border-2 border-border/20 rounded-xl p-5 shadow-inner">
                      <div className="font-sans text-sm leading-relaxed text-foreground whitespace-pre-wrap italic">
                        "{currentQ.stimulus}"
                      </div>
                   </div>
                   <h3 className="mt-6 font-display text-base font-bold">
                    {currentQ.question}
                  </h3>
                  <div className="mt-4 space-y-3">
                     {/* For Error Spotter, usually it's identification. PRD doesn't specify input type. I'll use 4 options generated from LLM or just Yes/No for placeholder */}
                     {currentQ.options ? (
                        currentQ.options.map((opt: string) => (
                           <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback} className="w-full py-4 px-4 bg-surface border border-border/30 rounded-lg text-left font-sans text-sm">{opt}</button>
                        ))
                     ) : (
                        <div className="space-y-3">
                           <input 
                              type="text" 
                              placeholder="Type the error (e.g. date, amount)..."
                              className="w-full bg-surface border border-border/50 rounded-lg p-4 font-sans text-sm focus:border-game-red outline-none"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleAnswer(e.currentTarget.value);
                              }}
                           />
                           <button onClick={() => setPhase("result")} className="w-full py-3 bg-game-red/10 text-game-red rounded-lg text-xs font-bold uppercase tracking-widest">I don't see any error</button>
                        </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Feedback Overlay */}
      {feedback && (
        <div className={`absolute inset-0 flex items-center justify-center z-50 animate-in fade-in duration-200 ${feedback.isCorrect ? 'bg-game-green/10' : 'bg-game-red/20'}`}>
          <div className="bg-background border-2 border-border p-6 rounded-2xl shadow-2xl max-w-[280px] text-center scale-up-center">
            {feedback.isCorrect ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-game-green/20 rounded-full flex items-center justify-center mb-3">
                  <Check className="text-game-green w-8 h-8" />
                </div>
                <div className="font-display font-bold text-game-green">CORRECT</div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-game-red/20 rounded-full flex items-center justify-center mb-3">
                  <X className="text-game-red w-8 h-8" />
                </div>
                <div className="font-display font-bold text-game-red">WRONG</div>
                {feedback.message && (
                  <div className="mt-3 text-xs text-muted-foreground font-sans leading-relaxed border-t border-border/50 pt-3">
                    {feedback.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharpEyeGame;
