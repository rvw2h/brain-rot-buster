import { useNavigate, useLocation } from "react-router-dom";

interface MemoryWordsState {
  words: string[];
  recalled: string[];
}

const MemoryWords = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as MemoryWordsState | null;

  if (!state) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-7">
        <p className="font-sans text-sm text-muted-foreground">No data available.</p>
        <button onClick={() => navigate("/home")} className="mt-4 font-sans text-xs text-game-red">
          ← Home
        </button>
      </div>
    );
  }

  const recalledSet = new Set(state.recalled);

  return (
    <div className="flex flex-col min-h-screen p-5">
      <button onClick={() => navigate(-1)} className="text-muted-foreground text-sm self-start mb-4">
        ←
      </button>
      <h1 className="font-display text-lg font-semibold text-foreground mb-1">All Words</h1>
      <p className="font-sans text-xs text-muted-foreground mb-4">
        {state.recalled.length} of {state.words.length} recalled
      </p>

      <div className="flex flex-wrap gap-1.5">
        {state.words.map((w) => {
          const wasRecalled = recalledSet.has(w);
          return (
            <span
              key={w}
              className={`inline-block py-1 px-2.5 rounded-full font-sans text-[11px] ${
                wasRecalled
                  ? "bg-[hsl(var(--game-green)/0.12)] border border-[hsl(var(--game-green)/0.2)] text-game-green"
                  : "bg-elevated border border-border/30 text-muted-foreground opacity-50"
              }`}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MemoryWords;
