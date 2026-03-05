import { Home, BarChart3, Calendar } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, path: "/home", label: "Home" },
    { icon: BarChart3, path: "/leaderboard", label: "Board" },
    { icon: Calendar, path: "/history", label: "History" },
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
              className={isActive ? "text-game-red" : "text-muted-foreground opacity-40"}
            />
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-game-red" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
