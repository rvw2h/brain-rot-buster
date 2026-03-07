import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#FF2D55", "#FF6B35", "#FFD60A", "#00F5A0", "#00C9FF",
  "#5E5CE6", "#BF5AF2", "#FF375F", "#8D6748", "#1C1C1E",
  "#FFFFFF", "#888888",
];

const BRUSH_SIZES = [
  { label: "S", size: 4 },
  { label: "M", size: 10 },
  { label: "L", size: 20 },
];

const OUTLINES = [
  { id: "mandala_01", name: "Mandala 01", cat: "Mandala" },
  { id: "mandala_02", name: "Mandala 02", cat: "Mandala" },
  { id: "flower_01", name: "Flower", cat: "Nature" },
  { id: "star_01", name: "Star Pattern", cat: "Abstract" },
  { id: "animal_01", name: "Butterfly", cat: "Animals" },
  { id: "geo_01", name: "Geometric", cat: "Abstract" },
];

function drawOutline(ctx: CanvasRenderingContext2D, id: string, w: number, h: number) {
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1.5;
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35;

  if (id.startsWith("mandala")) {
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let a = 0; a < 360; a += 30) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.2 * Math.cos(rad), cy + r * 0.2 * Math.sin(rad));
      ctx.lineTo(cx + r * Math.cos(rad), cy + r * Math.sin(rad));
      ctx.stroke();
    }
    for (let a = 0; a < 360; a += 45) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.55 * Math.cos(rad), cy + r * 0.55 * Math.sin(rad), r * 0.12, r * 0.2, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (id.startsWith("flower")) {
    for (let a = 0; a < 360; a += 60) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.4 * Math.cos(rad), cy + r * 0.4 * Math.sin(rad), r * 0.2, r * 0.35, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id.startsWith("star")) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? r : r * 0.4;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const method = i === 0 ? "moveTo" : "lineTo";
      ctx[method](cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    ctx.closePath();
    ctx.stroke();
  } else if (id.startsWith("animal")) {
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.3, cy - r * 0.15, r * 0.3, r * 0.45, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.3, cy - r * 0.15, r * 0.3, r * 0.45, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy + r * 0.3, r * 0.2, r * 0.3, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.2, cy + r * 0.3, r * 0.2, r * 0.3, 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.5);
    ctx.lineTo(cx, cy + r * 0.5);
    ctx.stroke();
  } else {
    for (let s = 3; s <= 6; s++) {
      ctx.beginPath();
      const gr = r * ((s - 2) / 5);
      for (let i = 0; i <= s; i++) {
        const angle = (i * 2 * Math.PI) / s - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + gr * Math.cos(angle), cy + gr * Math.sin(angle));
      }
      ctx.stroke();
    }
  }
}

type Phase = "picker" | "canvas" | "result";

const ColorGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("picker");
  const [selectedImage, setSelectedImage] = useState(OUTLINES[0]);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [activeBrushSize, setActiveBrushSize] = useState(BRUSH_SIZES[1]);
  const [isEraser, setIsEraser] = useState(false);
  const [strokes, setStrokes] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [savedCanvasIds, setSavedCanvasIds] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();

  // Check for saved canvases on mount
  useEffect(() => {
    const saved = new Set<string>();
    OUTLINES.forEach((o) => {
      if (localStorage.getItem(`bs_canvas_${o.id}`)) saved.add(o.id);
    });
    setSavedCanvasIds(saved);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const outlineCanvas = outlineCanvasRef.current;
    if (!canvas || !outlineCanvas) return;

    const w = canvas.parentElement!.clientWidth;
    const h = canvas.parentElement!.clientHeight;
    canvas.width = w;
    canvas.height = h;
    outlineCanvas.width = w;
    outlineCanvas.height = h;

    const ctx = canvas.getContext("2d")!;

    // Try to restore saved canvas
    const savedData = localStorage.getItem(`bs_canvas_${selectedImage.id}`);
    if (savedData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedData;
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
    }

    const outCtx = outlineCanvas.getContext("2d")!;
    outCtx.clearRect(0, 0, w, h);
    drawOutline(outCtx, selectedImage.id, w, h);

    setStrokes([]);
    setStartTime(Date.now());
    setElapsed(0);
  }, [selectedImage]);

  useEffect(() => {
    if (phase === "canvas") {
      setTimeout(initCanvas, 50);
      // Auto-save every 30s
      autoSaveRef.current = setInterval(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          localStorage.setItem(`bs_canvas_${selectedImage.id}`, canvas.toDataURL());
        }
      }, 30000);
      return () => clearInterval(autoSaveRef.current);
    }
  }, [phase, initCanvas, selectedImage.id]);

  useEffect(() => {
    if (phase !== "canvas" || !startTime) return;
    const int = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(int);
  }, [phase, startTime]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    setStrokes((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#FFFFFF" : activeColor;
    ctx.lineWidth = activeBrushSize.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const undo = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (strokes.length === 0) return;
    const prev = strokes[strokes.length - 1];
    ctx.putImageData(prev, 0, 0);
    setStrokes((s) => s.slice(0, -1));
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colored = 0;
    for (let i = 0; i < data.length; i += Math.floor(data.length / 200) * 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r < 250 || g < 250 || b < 250) colored++;
    }
    const pct = Math.min(100, Math.round((colored / 200) * 100));

    let sc = 0;
    if (pct >= 100) sc = 20;
    else if (pct >= 75) sc = 15;
    else if (pct >= 50) sc = 10;
    else if (pct >= 25) sc = 5;

    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    if (!existing.coloring || existing.coloring < sc) {
      existing.coloring = sc;
      localStorage.setItem(key, JSON.stringify(existing));
    }

    // Delete auto-saved canvas
    localStorage.removeItem(`bs_canvas_${selectedImage.id}`);

    setPhase("result");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // PICKER
  if (phase === "picker") {
    return (
      <div className="flex flex-col min-h-screen p-5">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start mb-4">
          ← Back
        </button>
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-2">
          Coloring Focus
        </div>
        <h1 className="font-display text-[22px] font-semibold text-foreground mb-6">Pick a canvas</h1>
        <div className="grid grid-cols-2 gap-3">
          {OUTLINES.map((img) => (
            <button
              key={img.id}
              onClick={() => {
                setSelectedImage(img);
                setPhase("canvas");
              }}
              className={`bg-surface rounded-lg p-4 text-center border-2 transition-all relative ${
                selectedImage.id === img.id ? "border-game-red" : "border-border/30"
              }`}
            >
              <div className="font-sans text-xs text-foreground">{img.name}</div>
              <div className="font-sans text-[10px] text-muted-foreground mt-0.5">{img.cat}</div>
              {savedCanvasIds.has(img.id) && (
                <span className="absolute top-1.5 right-1.5 font-sans text-[8px] bg-game-red text-primary-foreground px-1.5 py-0.5 rounded-full">
                  Continue
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // RESULT
  if (phase === "result") {
    const today = new Date().toISOString().split("T")[0];
    const key = `bs_scores_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    const sc = existing.coloring || 0;

    return (
      <div className="flex flex-col min-h-screen p-5">
        <button onClick={() => navigate("/home")} className="text-muted-foreground text-sm self-start">
          ←
        </button>
        <div className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mt-5">
          Coloring Focus
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-display text-[60px] font-bold text-game-red leading-none">{sc}</div>
          <div className="font-sans text-sm text-muted-foreground mt-1">points</div>
          <div className="flex gap-0 mt-7 w-full">
            {[
              [formatTime(elapsed), "time"],
              [String(sc), "score"],
            ].map(([n, l]) => (
              <div key={l} className="flex-1 text-center border-r border-border/30 last:border-0">
                <div className="font-mono text-lg font-semibold text-foreground">{n}</div>
                <div className="font-sans text-[9px] text-muted-foreground tracking-wider uppercase mt-0.5">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={() => setPhase("picker")}
            className="border border-border/50 rounded-lg px-[18px] py-2.5 font-sans text-xs text-muted-foreground"
          >
            New Canvas
          </button>
          <button
            onClick={() => navigate("/home")}
            className="bg-game-red rounded-lg px-[18px] py-2.5 font-sans text-xs text-primary-foreground font-medium"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // CANVAS
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between px-3.5 py-2.5 bg-background">
        <span className="font-sans text-[11px] text-muted-foreground">{selectedImage.name}</span>
      </div>

      <div className="flex-1 relative" style={{ background: "#FFFFFF" }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <canvas
          ref={outlineCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.7 }}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-surface p-2 px-2.5 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            className={`p-1 px-1.5 text-base ${strokes.length > 0 ? "text-muted-foreground" : "text-t-tertiary opacity-30"}`}
          >
            ↩
          </button>

          {/* Brush sizes */}
          <div className="flex gap-1">
            {BRUSH_SIZES.map((bs) => (
              <button
                key={bs.label}
                onClick={() => setActiveBrushSize(bs)}
                className={`w-7 h-7 rounded-md font-mono text-[10px] font-semibold transition-all ${
                  activeBrushSize.label === bs.label && !isEraser
                    ? "bg-game-red text-primary-foreground"
                    : "bg-elevated text-muted-foreground"
                }`}
              >
                {bs.label}
              </button>
            ))}
          </div>

          {/* Eraser */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`w-7 h-7 rounded-md font-mono text-[10px] transition-all ${
              isEraser
                ? "bg-game-red text-primary-foreground"
                : "bg-elevated text-muted-foreground"
            }`}
          >
            ⌫
          </button>

          <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveColor(c);
                  setIsEraser(false);
                }}
                className="flex-shrink-0 w-[26px] h-[26px] rounded-full transition-all"
                style={{
                  background: c,
                  boxShadow: activeColor === c && !isEraser
                    ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--game-red))`
                    : "none",
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="flex-shrink-0 bg-game-red rounded-md py-[7px] px-3.5 font-sans text-[11px] font-semibold text-primary-foreground"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorGame;
