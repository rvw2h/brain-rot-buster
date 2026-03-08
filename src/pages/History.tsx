import BottomNav from "@/components/game/BottomNav";

const History = () => {
  // Get last 7 days of scores from localStorage
  const days: { label: string; date: string; math: number | null; mem: number | null; total: number | null; isToday: boolean }[] = [];
  
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const raw = localStorage.getItem(`bs_scores_${key}`);
    const scores = raw ? JSON.parse(raw) : null;

    days.push({
      label: i === 0 ? "Today" : dayNames[d.getDay()],
      date: key,
      math: scores?.math ?? null,
      mem: scores?.memory ?? null,
      total: scores ? (scores.math || 0) + (scores.memory || 0) : null,
      isToday: i === 0,
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 px-3.5 flex flex-col">
        <h1 className="font-display text-[22px] font-bold text-foreground mb-3.5">Your history</h1>

        {/* Header row */}
        <div className="flex font-sans text-[9px] text-t-tertiary tracking-wider uppercase pl-3 mb-1.5">
          <span className="w-9">Date</span>
          <span className="flex-1 text-center">Math</span>
          <span className="flex-1 text-center">Mem</span>
          <span className="flex-1 text-center">Total</span>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          {days.map((row) => (
            <div
              key={row.date}
              className={`relative rounded-[7px] py-2 px-2.5 pl-3 flex items-center overflow-hidden shadow-[0_0_0_1px_hsl(var(--border)/0.4)] ${
                row.isToday && row.total !== null ? "bg-[hsl(var(--game-red)/0.06)]" : "bg-surface"
              }`}
            >
              {row.isToday && row.total !== null && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-game-red" />
              )}
              <span className="font-sans text-[11px] text-muted-foreground w-9">{row.label}</span>
              {[row.math, row.mem, row.total].map((v, j) => (
                <span
                  key={j}
                  className={`flex-1 text-center font-mono text-[11px] ${
                    v !== null ? "text-foreground" : "text-t-tertiary"
                  }`}
                >
                  {v ?? "—"}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default History;
