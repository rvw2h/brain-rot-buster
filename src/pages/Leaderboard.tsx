import BottomNav from "@/components/game/BottomNav";

const Leaderboard = () => {
  // Mock data since no backend yet
  const rows = [
    { rank: 1, name: "Arjun", score: 396, isFirst: true, isYou: false },
    { rank: 2, name: "Priya", score: 341, isFirst: false, isYou: false },
    { rank: 3, name: "Rohan", score: 290, isFirst: false, isYou: false },
    { rank: 4, name: "You", score: 340, isFirst: false, isYou: true },
    { rank: 5, name: "Meera", score: 271, isFirst: false, isYou: false },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 px-4 flex flex-col">
        <h1 className="font-display text-[22px] font-bold text-foreground mb-3">Leaderboard</h1>
        <div className="inline-flex self-start bg-elevated rounded-lg px-3 py-1.5 font-sans text-[11px] text-muted-foreground mb-3.5">
          Today, {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} ▾
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          {rows.map((r) => (
            <div
              key={r.rank}
              className={`relative rounded-lg p-2.5 px-3.5 flex items-center overflow-hidden shadow-[0_0_0_1px_hsl(var(--border)/0.4)] ${
                r.isYou ? "bg-[hsl(var(--game-red)/0.06)]" : "bg-surface"
              }`}
            >
              {r.isFirst && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-game-red" />
              )}
              <span className="font-mono text-[11px] text-t-tertiary w-6">#{r.rank}</span>
              <span className="flex-1 font-sans text-sm font-medium text-foreground pl-2">
                {r.name}
              </span>
              <span className={`font-mono text-[15px] font-semibold ${r.isFirst ? "text-game-red" : "text-foreground"}`}>
                {r.score}
              </span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Leaderboard;
