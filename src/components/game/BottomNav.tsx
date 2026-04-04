import { Home, Calendar, User, Palette } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppMode } from "@/contexts/ModeContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useAppMode();
  const isAura = mode === "aura";

  const tabs = [
    { icon: Home, path: "/home" },
    { icon: Palette, path: "/relax" },
    { icon: Calendar, path: "/history" },
    { icon: User, path: "/profile" },
  ];

  return (
    <div className="flex justify-around items-center py-3 bg-surface border-t border-border/30 flex-shrink-0">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-0.5"
          >
            <Icon
              size={20}
              className={
                isActive
                  ? `text-game-red ${isAura ? "drop-shadow-[0_0_8px_rgba(255,45,85,0.6)]" : ""}`
                  : "text-muted-foreground opacity-40"
              }
            />
            {isActive && (
              <div
                className={`w-1 h-1 rounded-full bg-game-red ${
                  isAura ? "shadow-[0_0_8px_rgba(255,45,85,0.6)]" : ""
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
