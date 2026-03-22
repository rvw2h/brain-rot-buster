interface QwertyPadProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

const QwertyPad = ({ onKey, disabled }: QwertyPadProps) => {
  const row1 = "qwertyuiop".split("");
  const row2 = "asdfghjkl".split("");
  const row3 = "zxcvbnm".split("");

  return (
    <div className="w-full p-1 pb-2 bg-surface border-t border-border/30 flex-shrink-0 select-none">
      {/* Row 1: q-p (10 keys) */}
      <div className="flex gap-1 mb-1.5 px-0.5">
        {row1.map((k) => (
          <button
            key={k}
            disabled={disabled}
            onClick={() => onKey(k)}
            className="flex-1 h-11 flex items-center justify-center bg-elevated rounded-[4px] text-sm text-foreground active:bg-elevated/60 transition-colors"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Row 2: a-l (9 keys) - indented */}
      <div className="flex gap-1 mb-1.5 px-[5%]">
        {row2.map((k) => (
          <button
            key={k}
            disabled={disabled}
            onClick={() => onKey(k)}
            className="flex-1 h-11 flex items-center justify-center bg-elevated rounded-[4px] text-sm text-foreground active:bg-elevated/60 transition-colors"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Row 3: Shift, z-m, Backspace */}
      <div className="flex gap-1 mb-1.5 px-0.5">
        <button
          disabled={disabled}
          onClick={() => onKey("shift")}
          className="flex-[1.3] h-11 bg-elevated/50 rounded-[4px] flex items-center justify-center text-sm text-muted-foreground active:bg-elevated/70"
        >
          ⇧
        </button>
        {row3.map((k) => (
          <button
            key={k}
            disabled={disabled}
            onClick={() => onKey(k)}
            className="flex-1 h-11 flex items-center justify-center bg-elevated rounded-[4px] text-sm text-foreground active:bg-elevated/60 transition-colors"
          >
            {k}
          </button>
        ))}
        <button
          disabled={disabled}
          onClick={() => onKey("backspace")}
          className="flex-[1.3] h-11 bg-elevated/50 rounded-[4px] flex items-center justify-center text-sm text-muted-foreground active:bg-elevated/70"
        >
          ⌫
        </button>
      </div>

      {/* Row 4: Space & Enter */}
      <div className="flex gap-1 px-0.5">
        <div className="flex-[1.3]" /> {/* Placeholder for layout balance */}
        <button
          disabled={disabled}
          onClick={() => onKey(" ")}
          className="flex-[5.4] h-11 bg-elevated rounded-[4px] flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest active:bg-elevated/80"
        >
          space
        </button>
        <button
          disabled={disabled}
          onClick={() => onKey("enter")}
          className="flex-[2.3] h-11 bg-game-red rounded-[4px] flex items-center justify-center text-sm text-primary-foreground font-semibold active:opacity-80"
        >
          ↵
        </button>
      </div>
    </div>
  );
};

export default QwertyPad;
