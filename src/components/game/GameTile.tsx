import { ChevronRight } from "lucide-react";

interface GameTileProps {
  title: string;
  subtitle: string;
  played?: boolean;
  lastScore?: string;
  onClick?: () => void;
}

const GameTile = ({ title, subtitle, played, lastScore, onClick }: GameTileProps) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-[10px] p-3.5 px-4 flex items-center justify-between overflow-hidden transition-all ${
        played
          ? "bg-surface shadow-[0_0_0_1px_hsl(var(--game-red)/0.3),0_0_16px_hsl(var(--game-red)/0.08)]"
          : "bg-surface shadow-[0_0_0_1px_hsl(var(--border)/0.5)]"
      }`}
    >
      {played && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-game-red" />
      )}
      <div className={played ? "pl-2" : ""}>
        <div className="font-display text-[15px] font-semibold text-foreground text-left">{title}</div>
        <div className="font-sans text-xs text-muted-foreground mt-0.5 text-left">
          {lastScore || subtitle}
        </div>
      </div>
      <ChevronRight size={14} className="text-t-tertiary" />
    </button>
  );
};

export default GameTile;
