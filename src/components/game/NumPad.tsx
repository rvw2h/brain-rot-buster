interface NumPadProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

const NumPad = ({ onKey, disabled }: NumPadProps) => {
  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["←", "0", "✓"],
  ];

  return (
    <div className="p-2 px-3 bg-surface border-t border-border/30 flex-shrink-0">
      {keys.map((row, ri) => (
        <div key={ri} className="flex gap-1.5" style={{ marginBottom: ri < 3 ? 6 : 0 }}>
          {row.map((k) => (
            <button
              key={k}
              disabled={disabled}
              onClick={() => onKey(k)}
              className={`flex-1 h-12 flex items-center justify-center rounded-md font-mono text-base select-none transition-colors active:scale-95 ${
                k === "✓"
                  ? "bg-game-red text-primary-foreground font-semibold"
                  : "bg-elevated text-foreground hover:bg-elevated/80"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default NumPad;
