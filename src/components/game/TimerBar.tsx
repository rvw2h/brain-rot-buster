interface TimerBarProps {
  percentage: number;
  pulse?: boolean;
  color?: string;
}

const TimerBar = ({ percentage, pulse, color }: TimerBarProps) => {
  return (
    <div className="h-[3px] w-full bg-elevated flex-shrink-0">
      <div
        className={`h-full ${color ? "" : "bg-game-red"} transition-all duration-300`}
        style={{ 
          width: `${Math.max(0, Math.min(100, percentage))}%`, 
          opacity: pulse ? 0.7 : 1,
          backgroundColor: color 
        }}
      />
    </div>
  );
};

export default TimerBar;
