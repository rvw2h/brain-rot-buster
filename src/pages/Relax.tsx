import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/game/BottomNav";
import { OUTLINES } from "./ColorGame";
import { useState, useEffect } from "react";

const Relax = () => {
  const navigate = useNavigate();
  const [savedCanvasIds, setSavedCanvasIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = new Set<string>();
    OUTLINES.forEach((o) => {
      if (localStorage.getItem(`bs_canvas_${o.id}`)) saved.add(o.id);
    });
    setSavedCanvasIds(saved);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 p-4 px-[18px] flex flex-col overflow-hidden">
        {/* Header */}
        <h1 className="font-display text-[22px] font-bold text-foreground mb-1">
          Relax
        </h1>
        <p className="font-sans text-[13px] text-muted-foreground mb-6">
          Pick a canvas and breathe.
        </p>

        {/* Picker Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 no-scrollbar pb-6">
          {OUTLINES.map((img) => (
            <button
              key={img.id}
              onClick={() => navigate(`/color?id=${img.id}`)}
              className="bg-surface rounded-lg p-4 text-center border border-border/30 hover:border-game-red/50 transition-all relative"
            >
              <div className="font-sans text-xs text-foreground font-medium">
                {img.name}
              </div>
              <div className="font-sans text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                {img.cat}
              </div>
              {savedCanvasIds.has(img.id) && (
                <span className="absolute top-1.5 right-1.5 font-sans text-[8px] bg-game-red text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-bold">
                  Cont.
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Relax;
