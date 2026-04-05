import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import BottomNav from "@/components/game/BottomNav";
import GameTile from "@/components/game/GameTile";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/contexts/ModeContext";
import { supabase } from "@/lib/supabase";
import { 
  SIMPLE_RESULT_POSITIVE, 
  AURA_RESULT_BEAST, 
  getDailySeed, 
  getMessage 
} from "@/lib/messages";

interface ScoreData {
  math?: number;
  memory?: number;
  coloring?: number;
  sharp_eye?: number;
  aura_math?: number;
  aura_memory?: number;
  aura_audit?: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { session, profile, manualUser, setManualUser } = useAuth();
  const { mode, setMode } = useAppMode();
  const [scores, setScores] = useState<ScoreData>({});
  const [showModeFlash, setShowModeFlash] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const scoresRaw = localStorage.getItem(`bs_scores_${today}`);
    if (scoresRaw) setScores(JSON.parse(scoresRaw));
  }, []);

  const location = useLocation();
  const hasLoggedAppSession = useRef(false);

  useEffect(() => {
    if (!profile || hasLoggedAppSession.current || !!manualUser) return;

    const logAppSession = async () => {
      hasLoggedAppSession.current = true;
      const method = location.state?.loginMethod || "auto";
      
      try {
        await supabase
          .from("app_sessions")
          .insert({
            user_id: profile.id,
            method: method,
            mode: mode // Include mode in session log
          });
      } catch (err) {
        console.error("Failed to log app session:", err);
      }
    };

    logAppSession();
  }, [profile, location.state, mode]);

  if (!profile && !manualUser) return null;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const isAura = mode === "aura";

  const mathScore = isAura ? scores.aura_math : scores.math;
  const memoryScore = isAura ? scores.aura_memory : scores.memory;
  const auditScore = isAura ? scores.aura_audit : scores.sharp_eye;
  const coloringScore = scores.coloring || 0;

  const totalToday = (mathScore || 0) + (memoryScore || 0) + (auditScore || 0) + (isAura ? 0 : coloringScore);
  const hasAnyScore = totalToday > 0 || !!mathScore || !!memoryScore || !!auditScore;

  // Get yesterday's scores
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  const yesterdayRaw = localStorage.getItem(`bs_scores_${yesterdayKey}`);
  const yesterdayScores: ScoreData = yesterdayRaw ? JSON.parse(yesterdayRaw) : {};
  
  const yMathScore = isAura ? yesterdayScores.aura_math : yesterdayScores.math;
  const yMemoryScore = isAura ? yesterdayScores.aura_memory : yesterdayScores.memory;
  const yAuditScore = isAura ? yesterdayScores.aura_audit : yesterdayScores.sharp_eye;
  const totalYesterday = (yMathScore || 0) + (yMemoryScore || 0) + (yAuditScore || 0);

  // Best score
  const bestKey = isAura ? "bs_best_aura" : "bs_best";
  const bestRaw = localStorage.getItem(bestKey);
  const best = bestRaw ? parseInt(bestRaw) : totalToday;

  const displayName = profile?.first_name ?? manualUser?.first_name ?? "Friend";

  const handleModeChange = (newMode: "simple" | "aura") => {
    if (newMode === mode) return;
    if (newMode === "aura") setShowModeFlash(true);
    setMode(newMode);
    setTimeout(() => setShowModeFlash(false), 300);
  };

  return (
    <div 
      className="flex flex-col min-h-screen relative"
      style={isAura ? { background: "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,45,85,0.08) 0%, transparent 70%), #0C0C0C" } : {}}
    >
      {showModeFlash && (
        <div className="absolute inset-0 z-50 bg-[#FF2D55] animate-mode-flash pointer-events-none" />
      )}
      
      <div className="flex-1 p-5 flex flex-col">
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
        <div 
          className={`w-full rounded-[10px] p-3.5 px-3 flex justify-around mb-5 transition-all ${
            isAura 
              ? "bg-[#161616] border border-[#FF2D55]/20 shadow-[0_0_16px_rgba(255,45,85,0.1)]" 
              : "bg-surface shadow-[0_0_0_1px_hsl(var(--border)/0.5)]"
          }`}
        >
          {[
            { label: isAura ? "AURA SCORE" : "TODAY", value: totalToday, highlight: true },
            { label: "YESTERDAY", value: totalYesterday || "—", highlight: false },
            { label: "BEST", value: Math.max(best, totalToday), highlight: false },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div
                className={`font-display font-bold transition-all ${
                  item.highlight 
                    ? isAura ? "text-[#FF2D55] text-[32px] animate-score-pulse" : "text-game-red text-[26px]"
                    : "text-foreground text-[26px]"
                }`}
              >
                {item.value}
              </div>
              <div 
                className={`font-sans text-[9px] tracking-wider uppercase mt-0.5 ${
                  isAura && item.highlight ? "text-[#FF2D55]" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-surface rounded-full mb-2.5 relative overflow-hidden h-10 shadow-[0_0_0_1px_hsl(var(--border)/0.5)]">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-200 ease-out ${
              mode === "simple" ? "left-1 bg-elevated" : "left-[calc(50%+3px)] bg-[#FF2D55]"
            }`} 
          />
          <button 
            onClick={() => handleModeChange("simple")}
            className={`flex-1 relative z-10 font-display text-[11px] font-semibold transition-colors ${
              mode === "simple" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Simple Mode
          </button>
          <button 
            onClick={() => handleModeChange("aura")}
            className={`flex-1 relative z-10 font-display text-[11px] font-semibold transition-colors ${
              mode === "aura" ? "text-background" : "text-muted-foreground"
            }`}
          >
            Aura Farm Mode
          </button>
        </div>

        {/* Mode Message */}
        <div className="mb-6 text-center">
          <p 
            className={`font-sans text-[13px] font-medium transition-colors ${
              isAura ? "text-[#FF2D55]/70" : "text-[#888888]"
            }`}
          >
            {getMessage(
              isAura ? AURA_RESULT_BEAST : SIMPLE_RESULT_POSITIVE, 
              getDailySeed(profile?.id || manualUser?.first_name || "guest")
            )}
          </p>
        </div>

        {/* Tag */}
        <div className="font-sans text-[10px] text-muted-foreground tracking-[0.1em] uppercase mb-3 px-1">
          {isAura ? "The Grinding Grounds" : "Today's Training"}
        </div>

        {/* Game tiles */}
        <div className="flex flex-col gap-3 w-full">
          <GameTile
            title="Rapid Math"
            subtitle={isAura ? "10s per question · negative marking" : "Solve BODMAS. 120 seconds."}
            played={!!mathScore}
            isAura={isAura}
            lastScore={mathScore !== undefined ? `${mathScore} pts` : undefined}
            onClick={() => navigate("/math")}
          />
          <GameTile
            title="Memory Recall"
            subtitle={isAura ? "Type to recall · wrong = -1pt" : "Memorise words. No pressure."}
            played={!!memoryScore}
            isAura={isAura}
            lastScore={memoryScore !== undefined ? `${memoryScore} pts` : undefined}
            onClick={() => navigate("/memory")}
          />
          <GameTile
            title={isAura ? "The Audit" : "Sharp Eye"}
            subtitle={isAura ? "Read everything · assume nothing" : "Observational detail. Spot errors."}
            played={!!scores.sharp_eye}
            isAura={isAura}
            lastScore={auditScore !== undefined ? `${auditScore} pts` : undefined}
            onClick={() => navigate("/sharp-eye")}
          />
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default HomePage;
