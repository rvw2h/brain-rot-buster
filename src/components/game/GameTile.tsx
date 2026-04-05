import { ChevronRight } from "lucide-react";

interface GameTileProps {
  title: string;
  subtitle: string;
  played?: boolean;
  lastScore?: string;
  onClick?: () => void;
  isAura?: boolean;
}

const GameTile = ({ title, subtitle, played, lastScore, onClick, isAura }: GameTileProps) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-[10px] p-3.5 px-4 flex items-center justify-between overflow-hidden transition-all ${
        isAura
          ? "bg-[#161616] border border-[rgba(255,45,85,0.2)] shadow-[0_0_16px_rgba(255,45,85,0.1)]"
          : played
          ? "bg-surface shadow-[0_0_0_1px_hsl(var(--game-red)/0.3),0_0_16px_hsl(var(--game-red)/0.08)]"
          : "bg-surface shadow-[0_0_0_1px_hsl(var(--border)/0.5)]"
      }`}
      style={
        isAura
          ? {
              background:
                "linear-gradient(180deg, rgba(255,45,85,0.05) 0%, #161616 30%)",
            }
          : {}
      }
    >
      {isAura ? (
        <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-[4px] bg-[rgba(255,45,85,0.12)] border border-[rgba(255,45,85,0.25)] flex items-center justify-center translate-y-[-2px]">
          <span className="text-[#FF2D55] font-display text-[8px] font-bold tracking-[0.15em] leading-none uppercase">
            Aura
          </span>
        </div>
      ) : (
        <ChevronRight size={14} className="text-t-tertiary" />
      )}

      {played && !isAura && (
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-game-red rounded-l-[10px]" />
      )}
      <div className="pl-6">
        <div className="font-display text-[15px] font-semibold text-foreground text-left">
          {title}
        </div>
        <div className="font-sans text-xs text-muted-foreground mt-0.5 text-left uppercase tracking-wider opacity-60">
          {lastScore || subtitle}
        </div>
      </div>
    </button>
  );
};

export default GameTile;
