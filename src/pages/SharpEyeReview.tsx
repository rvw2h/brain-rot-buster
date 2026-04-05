import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";

interface AnsweredQuestion {
  stimulus: any;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  trapType?: string;
  scenarioBrief?: string;
}

interface ReviewState {
  questions: AnsweredQuestion[];
  gameType: "sharp_eye" | "audit";
  score: number;
  correct: number;
  wrong: number;
}

const SharpEyeReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ReviewState;

  if (!state) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">No session data found.</p>
        <button 
          onClick={() => navigate("/home")}
          className="text-game-red font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const { questions, gameType, correct, wrong } = state;

  // Group by scenario for Audit
  const groupedQuestions = gameType === "audit" 
    ? questions.reduce((acc, q) => {
        const brief = q.scenarioBrief || "Unknown Scenario";
        if (!acc[brief]) acc[brief] = [];
        acc[brief].push(q);
        return acc;
      }, {} as Record<string, AnsweredQuestion[]>)
    : null;

  const renderQuestionCard = (q: AnsweredQuestion, index: number) => (
    <div 
      key={index}
      className={`rounded-xl border bg-[#161616] overflow-hidden transition-all mb-4 ${
        q.isCorrect 
          ? "border-l-[3px] border-l-[#00F5A0] border-white/5" 
          : "border-l-[3px] border-l-[#FF2D55] border-white/5"
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[10px] tracking-widest text-[#888888] uppercase">
              Question {index + 1}
            </span>
            {q.trapType && (
              <span className="font-display text-[9px] uppercase tracking-wider text-[#FF2D55]/60">
                {q.trapType.replace("_", " ")} TRAP
              </span>
            )}
          </div>
          {q.isCorrect ? (
            <Check size={16} className="text-[#00F5A0]" />
          ) : (
            <X size={16} className="text-[#FF2D55]" />
          )}
        </div>

        {/* Stimulus Card */}
        <div className="bg-black/20 rounded-lg p-3 mb-4 border border-white/[0.03]">
          <div className="font-mono text-[12px] text-[#888888] leading-relaxed break-words">
            {typeof q.stimulus === 'string' ? q.stimulus : JSON.stringify(q.stimulus, null, 2)}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="font-sans text-[14px] text-[#F2F2F2] font-medium mb-1">
              {q.question}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.05]">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Answer</div>
              <div className={`font-sans text-[13px] font-semibold ${q.isCorrect ? "text-[#00F5A0]" : "text-[#FF2D55]"}`}>
                {q.userAnswer}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Correct Answer</div>
              <div className="font-sans text-[13px] font-semibold text-[#00F5A0]">
                {q.correctAnswer}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="font-sans text-[12px] text-[#888888] italic leading-relaxed">
              {q.explanation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/[0.05] p-5 flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground leading-none">Session Review</h1>
          <p className="font-sans text-xs text-muted-foreground mt-1">
            <span className="text-[#00F5A0]">{correct} correct</span> · <span className="text-[#FF2D55]">{wrong} wrong</span>
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {gameType === "audit" && groupedQuestions ? (
          Object.entries(groupedQuestions).map(([brief, qList], sIdx) => (
            <div key={sIdx} className="mb-10">
              <div className="mb-4">
                <div className="font-display text-[10px] uppercase tracking-[0.2em] text-[#FF2D55] mb-2">Scenario {sIdx + 1}</div>
                <div className="bg-[#161616] p-4 rounded-xl border border-white/[0.05] font-sans text-[13px] text-foreground/80 leading-relaxed italic">
                  "{brief}"
                </div>
              </div>
              <div className="space-y-4">
                {qList.map((q, qIdx) => renderQuestionCard(q, qList.length * sIdx + qIdx))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => renderQuestionCard(q, idx))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharpEyeReview;
