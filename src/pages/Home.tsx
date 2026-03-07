import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BottomNav from "@/components/game/BottomNav";
import GameTile from "@/components/game/GameTile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ScoreData {
  math?: number;
  memory?: number;
  coloring?: number;
  mathAcc?: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { session, profile, manualUser, setManualUser } = useAuth();
  const [scores, setScores] = useState<ScoreData>({});

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const scoresRaw = localStorage.getItem(`bs_scores_${today}`);
    if (scoresRaw) setScores(JSON.parse(scoresRaw));
  }, []);

  if (!profile && !manualUser) return null;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const hasAnyScore =
    scores.math !== undefined || scores.memory !== undefined || scores.coloring !== undefined;
  const totalToday = (scores.math || 0) + (scores.memory || 0) + (scores.coloring || 0);

  // Get yesterday's scores
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  const yesterdayRaw = localStorage.getItem(`bs_scores_${yesterdayKey}`);
  const yesterdayScores: ScoreData = yesterdayRaw ? JSON.parse(yesterdayRaw) : {};
  const totalYesterday = (yesterdayScores.math || 0) + (yesterdayScores.memory || 0) + (yesterdayScores.coloring || 0);

  // Best score
  const bestRaw = localStorage.getItem("bs_best");
  const best = bestRaw ? parseInt(bestRaw) : totalToday;

  const displayName = profile?.first_name ?? manualUser?.first_name ?? "Friend";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 px-[18px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <span className="font-sans text-[11px] text-muted-foreground">{dateStr}</span>
          <button
            onClick={async () => {
              if (session) {
                await supabase.auth.signOut();
              } else {
                localStorage.removeItem("bs_manual_user");
                setManualUser(null);
              }
              navigate("/login");
            }}
            className="text-sm text-t-tertiary"
          >
            ⎋
          </button>
        </div>

        {/* Welcome */}
        <h1 className="font-display text-[22px] font-bold text-foreground mb-5">
          {hasAnyScore ? `Welcome back, ${displayName}` : `Welcome, ${displayName} 👋`}
        </h1>

        {/* Score card */}
        {hasAnyScore && (
          <>
            <div className="bg-surface rounded-[10px] p-3.5 px-3 flex justify-around mb-2 shadow-[0_0_0_1px_hsl(var(--border)/0.5)]">
              {[
                { label: "TODAY", value: totalToday, highlight: true },
                { label: "YESTERDAY", value: totalYesterday || "—", highlight: false },
                { label: "BEST", value: Math.max(best, totalToday), highlight: false },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div
                    className={`font-display text-[26px] font-bold ${
                      item.highlight ? "text-game-red" : "text-foreground"
                    }`}
                  >
                    {item.value}
                  </div>
                  <div className="font-sans text-[9px] text-muted-foreground tracking-wider uppercase mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            {totalToday > totalYesterday && totalYesterday > 0 && (
              <p className="font-sans text-xs text-game-green mb-3.5">↑ Up from yesterday</p>
            )}
            {!totalYesterday && (
              <p className="font-sans text-xs text-muted-foreground mb-3.5">Voilà! Keep going 🎉</p>
            )}
          </>
        )}

        {/* Tag */}
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-2.5">
          Today's Training
        </div>

        {/* Game tiles */}
        <div className="flex flex-col gap-2 flex-1">
          <GameTile
            title="Rapid Math"
            subtitle="Solve BODMAS. 120 seconds."
            played={scores.math !== undefined}
            lastScore={scores.math !== undefined ? `${scores.math} pts · ${scores.mathAcc || 0}% acc` : undefined}
            onClick={() => navigate("/math")}
          />
          <GameTile
            title="Memory Recall"
            subtitle="Memorise 50 words."
            played={scores.memory !== undefined}
            lastScore={scores.memory !== undefined ? `${scores.memory} pts` : undefined}
            onClick={() => navigate("/memory")}
          />
          <GameTile
            title="Coloring Focus"
            subtitle="Color. Breathe. Reset."
            played={scores.coloring !== undefined}
            lastScore={scores.coloring !== undefined ? `${scores.coloring} pts` : undefined}
            onClick={() => navigate("/color")}
          />
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default HomePage;
