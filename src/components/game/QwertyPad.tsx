interface QwertyPadProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

const QwertyPad = ({ onKey, disabled }: QwertyPadProps) => {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  return (
    <div className="p-2 pb-3 bg-surface border-t border-border/30 flex-shrink-0">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 mb-1">
          {ri === 2 && (
            <button
              disabled={disabled}
              onClick={() => onKey("shift")}
              className="w-7 h-9 bg-elevated rounded flex items-center justify-center text-[10px] text-muted-foreground"
            >
              ⇧
            </button>
          )}
          {row.split("").map((k) => (
            <button
              key={k}
              disabled={disabled}
              onClick={() => onKey(k)}
              className="w-6 h-9 flex items-center justify-center bg-elevated rounded text-xs text-foreground active:bg-elevated/60 select-none"
            >
              {k}
            </button>
          ))}
          {ri === 2 && (
            <button
              disabled={disabled}
              onClick={() => onKey("backspace")}
              className="w-7 h-9 bg-elevated rounded flex items-center justify-center text-[10px] text-muted-foreground"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-1 justify-center mt-1">
        <button
          disabled={disabled}
          onClick={() => onKey(" ")}
          className="w-24 h-9 bg-elevated rounded flex items-center justify-center text-xs text-muted-foreground"
        >
          space
        </button>
        <button
          disabled={disabled}
          onClick={() => onKey("enter")}
          className="w-12 h-9 bg-game-red rounded flex items-center justify-center text-xs text-primary-foreground font-semibold"
        >
          ↵
        </button>
      </div>
    </div>
  );
};

export default QwertyPad;
