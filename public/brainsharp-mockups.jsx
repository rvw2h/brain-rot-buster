import { useState } from "react";

const SCREENS = [
  "Login", "Onboarding", "Home: New User", "Home: Returning",
  "Home: Has Score", "Math Pre-Game", "Math Active", "Math Correct",
  "Math Wrong", "Math Result", "Memory Pre-Game", "Memory Display",
  "Memory Recall", "Memory Result", "Color Picker", "Color Canvas",
  "Color Result", "Leaderboard", "History", "Toast / Errors"
];

const ds = {
  bg: "#0C0C0C", surface: "#161616", elevated: "#1F1F1F",
  red: "#FF2D55", redDim: "rgba(255,45,85,0.15)",
  green: "#00F5A0", greenDim: "rgba(0,245,160,0.12)",
  t1: "#F2F2F2", t2: "#888888", t3: "#444444",
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const grotesk = { fontFamily: "'Space Grotesk', sans-serif" };
const sans = { fontFamily: "'DM Sans', sans-serif" };

function Phone({ children, label, canvasWhite }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ ...sans, fontSize: 10, color: ds.t3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{
        width: 280, minHeight: 560, background: canvasWhite ? ds.bg : ds.bg,
        borderRadius: 24, overflow: "hidden", position: "relative",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 24px 64px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column"
      }}>
        {children}
      </div>
    </div>
  );
}

function TimerBar({ pct = 60, pulse }) {
  return (
    <div style={{ height: 3, width: "100%", background: ds.elevated, flexShrink: 0 }}>
      <div style={{
        height: "100%", width: `${pct}%`, background: ds.red,
        transition: "width 0.3s", opacity: pulse ? 0.7 : 1
      }} />
    </div>
  );
}

function Tag({ children, style }) {
  return <div style={{ ...sans, fontSize: 10, color: ds.t2, letterSpacing: "0.1em", textTransform: "uppercase", ...style }}>{children}</div>;
}

function BottomNav({ active = 0 }) {
  const icons = ["⌂", "☰", "📅"];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "12px 0", background: ds.surface, borderTop: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
      {icons.map((ic, i) => (
        <div key={i} style={{ fontSize: 18, opacity: i === active ? 1 : 0.4, color: i === active ? ds.red : ds.t2, position: "relative" }}>
          {ic}
          {i === active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: ds.red, margin: "2px auto 0" }} />}
        </div>
      ))}
    </div>
  );
}

function Input({ placeholder, error, correct, value = "" }) {
  let borderColor = "rgba(255,255,255,0.08)";
  let bg = ds.elevated;
  if (error) { borderColor = ds.red; bg = "rgba(255,45,85,0.08)"; }
  if (correct) { borderColor = ds.green; bg = ds.greenDim; }
  return (
    <div style={{
      background: bg, border: `2px solid ${borderColor}`, borderRadius: 8,
      padding: "14px 16px", ...mono, fontSize: 15, color: ds.t1,
      boxShadow: correct ? `0 0 0 2px rgba(0,245,160,0.3)` : error ? `0 0 0 2px rgba(255,45,85,0.5)` : "none"
    }}>
      {value || <span style={{ color: ds.t3 }}>{placeholder}</span>}
    </div>
  );
}

function NumPad({ onKey }) {
  const keys = [["7","8","9"],["4","5","6"],["1","2","3"],["←","0","✓"]];
  return (
    <div style={{ padding: "8px 12px", background: ds.surface, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      {keys.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: 6, marginBottom: ri < 3 ? 6 : 0 }}>
          {row.map(k => (
            <div key={k} style={{
              flex: 1, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
              background: k === "✓" ? ds.red : ds.elevated, borderRadius: 6,
              ...mono, fontSize: 16, color: k === "✓" ? "#0C0C0C" : ds.t1,
              cursor: "pointer", userSelect: "none"
            }}>{k}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function QwertyPad() {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  return (
    <div style={{ padding: "8px 8px 12px", background: ds.surface, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
          {ri === 2 && <div style={{ width: 28, height: 36, background: ds.elevated, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: 10, color: ds.t2 }}>⇧</div>}
          {row.split("").map(k => (
            <div key={k} style={{ width: 24, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: ds.elevated, borderRadius: 4, ...sans, fontSize: 12, color: ds.t1 }}>{k}</div>
          ))}
          {ri === 2 && <div style={{ width: 28, height: 36, background: ds.elevated, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: 10, color: ds.t2 }}>⌫</div>}
        </div>
      ))}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4 }}>
        <div style={{ width: 100, height: 36, background: ds.elevated, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: 11, color: ds.t2 }}>space</div>
        <div style={{ width: 48, height: 36, background: ds.red, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: 12, color: "#0C0C0C", fontWeight: 600 }}>↵</div>
      </div>
    </div>
  );
}

function Chip({ word }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 9999,
      background: ds.greenDim, border: "1px solid rgba(0,245,160,0.2)",
      ...sans, fontSize: 11, color: ds.green, margin: "2px 3px"
    }}>{word}</span>
  );
}

function GameTile({ title, sub, played, last }) {
  return (
    <div style={{
      background: ds.surface, borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: played ? `0 0 0 1px rgba(255,45,85,0.3), 0 0 16px rgba(255,45,85,0.08)` : "0 0 0 1px rgba(255,255,255,0.06)",
      position: "relative", overflow: "hidden"
    }}>
      {played && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ds.red }} />}
      <div style={{ paddingLeft: played ? 8 : 0 }}>
        <div style={{ ...grotesk, fontSize: 15, fontWeight: 600, color: ds.t1 }}>{title}</div>
        <div style={{ ...sans, fontSize: 12, color: ds.t2, marginTop: 2 }}>{last || sub}</div>
      </div>
      <div style={{ color: ds.t3, fontSize: 14 }}>→</div>
    </div>
  );
}

// ── All Screens ────────────────────────────────────────────────

function LoginScreen() {
  return (
    <Phone label="01 — Login">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 0 }}>
        <div style={{ ...grotesk, fontSize: 28, fontWeight: 700, color: ds.t1, textAlign: "center" }}>BrainSharp</div>
        <div style={{ ...sans, fontSize: 13, color: ds.t2, marginTop: 6, textAlign: "center" }}>Fight brain rot. Train daily.</div>
        <div style={{ marginTop: 36 }}>
          <div style={{
            background: "#fff", borderRadius: 9999, padding: "0 24px", height: 44,
            display: "flex", alignItems: "center", gap: 10, width: 220, justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}>
            <div style={{ width: 18, height: 18, background: "#4285F4", borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ ...sans, fontSize: 13, color: "#111", fontWeight: 500 }}>Continue with Google</span>
          </div>
        </div>
        <div style={{ ...sans, fontSize: 11, color: ds.t3, marginTop: 40, textAlign: "center" }}>No spam. No notifications. Just you.</div>
      </div>
    </Phone>
  );
}

function OnboardingScreen() {
  return (
    <Phone label="02 — Onboarding">
      <div style={{ flex: 1, padding: "28px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? ds.red : ds.t3 }} />)}
        </div>
        <div style={{ ...grotesk, fontSize: 22, fontWeight: 600, color: ds.t1 }}>Quick setup.</div>
        <div style={{ ...sans, fontSize: 13, color: ds.t2, marginTop: 4, marginBottom: 24 }}>We only need 3 things.</div>
        {["first name", "age", "city"].map((ph, i) => (
          <div key={ph} style={{ marginBottom: 12 }}>
            <div style={{
              background: ds.elevated, border: `1px solid ${i === 2 ? ds.red : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "12px 14px", ...mono, fontSize: 13, color: ds.t3,
              boxShadow: i === 2 ? "0 0 0 2px rgba(255,45,85,0.4)" : "none"
            }}>{i === 2 ? <span style={{ color: ds.t1 }}>Mumbai</span> : ph}</div>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "inline-block", background: ds.red, borderRadius: 8, padding: "10px 20px", ...sans, fontSize: 13, fontWeight: 500, color: "#0C0C0C" }}>Let's go →</div>
        </div>
      </div>
    </Phone>
  );
}

function HomeNewScreen() {
  return (
    <Phone label="03 — Home: New User">
      <div style={{ flex: 1, padding: "16px 18px 8px", display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ ...sans, fontSize: 11, color: ds.t2 }}>Thursday, Mar 5</div>
          <div style={{ fontSize: 14, color: ds.t3 }}>⎋</div>
        </div>
        <div style={{ ...grotesk, fontSize: 22, fontWeight: 700, color: ds.t1, marginBottom: 20 }}>Welcome, Arjun 👋</div>
        <Tag style={{ marginBottom: 10 }}>Today's Training</Tag>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <GameTile title="Rapid Math" sub="Solve BODMAS. 120 seconds." />
          <GameTile title="Memory Recall" sub="Memorise 50 words." />
          <GameTile title="Coloring Focus" sub="Color. Breathe. Reset." />
        </div>
        <div style={{ ...sans, fontSize: 12, color: ds.t2, marginTop: 12, marginBottom: 8 }}>Leaderboard →</div>
      </div>
      <BottomNav active={0} />
    </Phone>
  );
}

function HomeScoreScreen() {
  return (
    <Phone label="05 — Home: Has Score">
      <div style={{ flex: 1, padding: "16px 18px 8px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ ...sans, fontSize: 11, color: ds.t2 }}>Thursday, Mar 5</div>
          <div style={{ fontSize: 14, color: ds.t3 }}>⎋</div>
        </div>
        <div style={{ ...grotesk, fontSize: 20, fontWeight: 700, color: ds.t1, marginBottom: 12 }}>Welcome back, Arjun</div>
        <div style={{ background: ds.surface, borderRadius: 10, padding: "14px 12px", display: "flex", justifyContent: "space-around", marginBottom: 8, boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
          {[["TODAY","340",true],["YESTERDAY","290",false],["BEST","410",false]].map(([label, val, red]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ ...grotesk, fontSize: 26, fontWeight: 700, color: red ? ds.red : ds.t1 }}>{val}</div>
              <div style={{ ...sans, fontSize: 9, color: ds.t2, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ ...sans, fontSize: 12, color: ds.green, marginBottom: 14 }}>↑ Up from yesterday</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <GameTile title="Rapid Math" sub="" played last="340 pts · 82% acc" />
          <GameTile title="Memory Recall" sub="Memorise 50 words." />
          <GameTile title="Coloring Focus" sub="Color. Breathe. Reset." />
        </div>
      </div>
      <BottomNav active={0} />
    </Phone>
  );
}

function MathActiveScreen() {
  return (
    <Phone label="07A — Math Active">
      <TimerBar pct={55} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
          <div style={{ ...sans, fontSize: 11, color: ds.t2 }}>12 ans · 10 ✓</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...mono, fontSize: 26, fontWeight: 600, color: ds.t1 }}>(8 + 4) × 3</div>
        </div>
        <div style={{ padding: "0 24px 12px" }}>
          <Input placeholder="your answer" />
        </div>
        <NumPad />
      </div>
    </Phone>
  );
}

function MathCorrectScreen() {
  return (
    <Phone label="07B — Math Correct (auto-advances)">
      <TimerBar pct={52} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
          <div style={{ ...sans, fontSize: 11, color: ds.t2 }}>12 ans · 11 ✓</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...mono, fontSize: 26, fontWeight: 600, color: ds.t1 }}>Next loading...</div>
        </div>
        <div style={{ padding: "0 24px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}><Input placeholder="" value="36" correct /></div>
            <div style={{ color: ds.green, fontSize: 18 }}>✓</div>
          </div>
          <div style={{ ...sans, fontSize: 10, color: ds.green, marginTop: 4 }}>Auto-advancing...</div>
        </div>
        <NumPad />
      </div>
    </Phone>
  );
}

function MathWrongScreen() {
  return (
    <Phone label="07C — Math Wrong (auto-advances 800ms)">
      <TimerBar pct={48} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
          <div style={{ ...sans, fontSize: 11, color: ds.t2 }}>13 ans · 11 ✓</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...mono, fontSize: 26, fontWeight: 600, color: ds.t1 }}>(8 + 4) × 3</div>
        </div>
        <div style={{ padding: "0 24px 12px" }}>
          <Input placeholder="" value="42" error />
          <div style={{ ...sans, fontSize: 11, color: ds.t2, marginTop: 6 }}>Answer was 36 · advancing in 0.8s</div>
        </div>
        <NumPad />
      </div>
    </Phone>
  );
}

function MathResultScreen() {
  return (
    <Phone label="08 — Math Result">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 20px 16px" }}>
        <div style={{ color: ds.t2, fontSize: 14 }}>←</div>
        <Tag style={{ marginTop: 20 }}>Rapid Math</Tag>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...grotesk, fontSize: 60, fontWeight: 700, color: ds.red, lineHeight: 1 }}>340</div>
          <div style={{ ...sans, fontSize: 13, color: ds.t2, marginTop: 4 }}>points</div>
          <div style={{ display: "flex", gap: 0, marginTop: 28, width: "100%" }}>
            {[["34","attempted"],["28","correct"],["82%","accuracy"]].map(([n,l]) => (
              <div key={l} style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: ds.t1 }}>{n}</div>
                <div style={{ ...sans, fontSize: 9, color: ds.t2, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ ...sans, fontSize: 12, color: ds.green, marginTop: 16 }}>↑ Best session today</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <div style={{ border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8, padding: "9px 18px", ...sans, fontSize: 12, color: ds.t2 }}>Play Again</div>
          <div style={{ background: ds.red, borderRadius: 8, padding: "9px 18px", ...sans, fontSize: 12, color: "#0C0C0C", fontWeight: 500 }}>Home</div>
        </div>
      </div>
    </Phone>
  );
}

function MemoryDisplayScreen() {
  const words = ["Tiger","River","Apple","Clock","Mountain","Chair","Drum","Falcon","Lantern","Harbor","Calm","Hammer","Glacier","Plateau","Trust","Orbit","Canyon","Otter","Sketch","Dread","Lemur","Compass","Wonder","Tension"];
  return (
    <Phone label="10 — Memory: Word Display">
      <TimerBar pct={90} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 16px" }}>
        <div style={{ ...mono, fontSize: 12, color: ds.red, marginBottom: 8 }}>00:18</div>
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "6px 8px", alignContent: "flex-start", overflow: "hidden" }}>
          {words.map(w => (
            <span key={w} style={{ ...grotesk, fontSize: 12, fontWeight: 500, color: ds.t1, padding: "2px 6px", background: ds.surface, borderRadius: 4 }}>{w}</span>
          ))}
        </div>
        <div style={{ ...sans, fontSize: 10, color: ds.t3, textAlign: "center", paddingTop: 6 }}>MEMORISE. Don't scroll.</div>
      </div>
    </Phone>
  );
}

function MemoryRecallScreen() {
  return (
    <Phone label="11 — Memory: Recall + Keyboard">
      <TimerBar pct={70} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "8px 16px" }}>
          <div style={{ ...grotesk, fontSize: 18, fontWeight: 600, color: ds.t1 }}>18 recalled</div>
        </div>
        <div style={{ padding: "4px 16px 8px" }}>
          <Input placeholder="type a word, press enter" />
        </div>
        <div style={{ padding: "0 12px", display: "flex", flexWrap: "wrap", flex: 1 }}>
          {["Tiger","River","Apple","Chair","Mountain","Clock","Drum"].map(w => <Chip key={w} word={w} />)}
        </div>
        <QwertyPad />
      </div>
    </Phone>
  );
}

function MemoryResultScreen() {
  return (
    <Phone label="12 — Memory Result">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 20px 16px" }}>
        <div style={{ color: ds.t2, fontSize: 14 }}>←</div>
        <Tag style={{ marginTop: 20 }}>Memory Recall</Tag>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...grotesk, fontSize: 60, fontWeight: 700, color: ds.red, lineHeight: 1 }}>36</div>
          <div style={{ ...sans, fontSize: 13, color: ds.t2, marginTop: 4 }}>points</div>
          <div style={{ display: "flex", gap: 0, marginTop: 28, width: "100%" }}>
            {[["50","words"],["18","recalled"],["36%","accuracy"]].map(([n,l]) => (
              <div key={l} style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: ds.t1 }}>{n}</div>
                <div style={{ ...sans, fontSize: 9, color: ds.t2, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ ...sans, fontSize: 11, color: ds.t2, marginTop: 12 }}>+ 3 fuzzy matches accepted</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <div style={{ border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8, padding: "9px 18px", ...sans, fontSize: 12, color: ds.t2 }}>Play Again</div>
          <div style={{ background: ds.red, borderRadius: 8, padding: "9px 18px", ...sans, fontSize: 12, color: "#0C0C0C", fontWeight: 500 }}>Home</div>
        </div>
      </div>
    </Phone>
  );
}

function ColorCanvasScreen() {
  const colors = ["#FF2D55","#FF6B35","#FFD60A","#00F5A0","#00C9FF","#5E5CE6","#BF5AF2","#FF375F","#8D6748","#1C1C1E"];
  return (
    <Phone label="14 — Coloring Canvas (white canvas)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px 6px", background: ds.bg }}>
          <div style={{ ...sans, fontSize: 11, color: ds.t2 }}>Mandala 07</div>
          <div style={{ ...mono, fontSize: 11, color: ds.t2 }}>4:12</div>
        </div>
        {/* WHITE CANVAS */}
        <div style={{ flex: 1, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <svg width="160" height="160" viewBox="0 0 100 100" style={{ opacity: 0.7 }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="28" fill="none" stroke="#222" strokeWidth="1"/>
            <circle cx="50" cy="50" r="15" fill="none" stroke="#222" strokeWidth="1"/>
            {[0,45,90,135,180,225,270,315].map(a => (
              <line key={a}
                x1="50" y1="10"
                x2="50" y2="22"
                stroke="#222" strokeWidth="1"
                transform={`rotate(${a} 50 50)`}
              />
            ))}
            {/* colored petals */}
            <ellipse cx="50" cy="28" rx="6" ry="10" fill="#FF6B35" opacity="0.6" transform="rotate(0 50 50)"/>
            <ellipse cx="50" cy="28" rx="6" ry="10" fill="#FFD60A" opacity="0.6" transform="rotate(60 50 50)"/>
            <ellipse cx="50" cy="28" rx="6" ry="10" fill="#00F5A0" opacity="0.6" transform="rotate(120 50 50)"/>
          </svg>
        </div>
        {/* DARK toolbar */}
        <div style={{ background: ds.surface, padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ ...sans, fontSize: 16, color: ds.t3, padding: "4px 6px" }}>↩</div>
            <div style={{ flex: 1, display: "flex", gap: 5, overflowX: "auto" }}>
              {colors.map((c, i) => (
                <div key={c} style={{
                  width: 26, height: 26, borderRadius: "50%", background: c, flexShrink: 0,
                  boxShadow: i === 0 ? `0 0 0 2px #0C0C0C, 0 0 0 4px ${ds.red}` : "none"
                }} />
              ))}
            </div>
            <div style={{ background: ds.red, borderRadius: 6, padding: "7px 14px", ...sans, fontSize: 11, fontWeight: 600, color: "#0C0C0C", flexShrink: 0 }}>Submit</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function LeaderboardScreen() {
  const rows = [
    { rank: 1, name: "Arjun", score: 396, isFirst: true },
    { rank: 2, name: "Priya", score: 341 },
    { rank: 3, name: "Rohan", score: 290 },
    { rank: 4, name: "You", score: 340, isYou: true },
    { rank: 5, name: "Meera", score: 271 },
  ];
  return (
    <Phone label="16 — Leaderboard">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 16px 8px" }}>
        <div style={{ ...grotesk, fontSize: 22, fontWeight: 700, color: ds.t1, marginBottom: 12 }}>Leaderboard</div>
        <div style={{ display: "inline-flex", background: ds.elevated, borderRadius: 8, padding: "6px 12px", ...sans, fontSize: 11, color: ds.t2, marginBottom: 14 }}>Today, Mar 5 ▾</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {rows.map(r => (
            <div key={r.rank} style={{
              background: r.isYou ? "rgba(255,45,85,0.06)" : ds.surface,
              borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05)", position: "relative", overflow: "hidden"
            }}>
              {r.isFirst && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ds.red }} />}
              <div style={{ ...mono, fontSize: 11, color: ds.t3, width: 24 }}>#{r.rank}</div>
              <div style={{ flex: 1, ...sans, fontSize: 14, fontWeight: 500, color: ds.t1, paddingLeft: 8 }}>{r.name}</div>
              <div style={{ ...mono, fontSize: 15, fontWeight: 600, color: r.isFirst ? ds.red : ds.t1 }}>{r.score}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active={1} />
    </Phone>
  );
}

function HistoryScreen() {
  const days = [
    { d: "Today", m: 340, mem: 36, c: 15, t: 391, stripe: true },
    { d: "Wed", m: 290, mem: 18, c: 10, t: 318 },
    { d: "Tue", m: null, mem: null, c: null, t: null },
    { d: "Mon", m: 310, mem: 22, c: null, t: 332 },
    { d: "Sun", m: null, mem: null, c: null, t: null },
  ];
  return (
    <Phone label="18 — History">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 14px 8px" }}>
        <div style={{ ...grotesk, fontSize: 22, fontWeight: 700, color: ds.t1, marginBottom: 14 }}>Your history</div>
        <div style={{ display: "flex", ...sans, fontSize: 9, color: ds.t3, letterSpacing: "0.06em", textTransform: "uppercase", paddingLeft: 12, marginBottom: 6, gap: 0 }}>
          <span style={{ width: 36 }}>Date</span>
          <span style={{ flex: 1, textAlign: "center" }}>Math</span>
          <span style={{ flex: 1, textAlign: "center" }}>Mem</span>
          <span style={{ flex: 1, textAlign: "center" }}>Color</span>
          <span style={{ flex: 1, textAlign: "center" }}>Total</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          {days.map((row, i) => (
            <div key={i} style={{
              background: row.stripe ? "rgba(255,45,85,0.06)" : ds.surface,
              borderRadius: 7, padding: "8px 10px 8px 12px", display: "flex", alignItems: "center",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05)", position: "relative", overflow: "hidden"
            }}>
              {row.stripe && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ds.red }} />}
              <span style={{ ...sans, fontSize: 11, color: ds.t2, width: 36 }}>{row.d}</span>
              {[row.m, row.mem, row.c, row.t].map((v, j) => (
                <span key={j} style={{ flex: 1, textAlign: "center", ...mono, fontSize: 11, color: v ? ds.t1 : ds.t3 }}>{v ?? "—"}</span>
              ))}
              <span style={{ color: ds.t3, fontSize: 10, marginLeft: 4 }}>→</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active={2} />
    </Phone>
  );
}

function ToastScreen() {
  return (
    <Phone label="20 — Toast / Error States">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px", gap: 12 }}>
        <div style={{ ...grotesk, fontSize: 13, fontWeight: 600, color: ds.t1, textAlign: "center", marginBottom: 8 }}>Error States</div>
        {/* Toast A */}
        <div style={{ background: ds.elevated, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
          <span style={{ color: ds.red, fontSize: 14 }}>⚠</span>
          <div style={{ ...sans, fontSize: 12, color: ds.t1 }}>Couldn't save your session. Retrying...</div>
        </div>
        {/* Toast B */}
        <div style={{ background: ds.elevated, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
          <span style={{ color: ds.red, fontSize: 14 }}>⚠</span>
          <div style={{ flex: 1, ...sans, fontSize: 12, color: ds.t1 }}>Save failed. Check connection.</div>
          <span style={{ color: ds.t2, fontSize: 14 }}>×</span>
        </div>
        {/* Error state */}
        <div style={{ background: ds.surface, borderRadius: 10, padding: "20px 14px", textAlign: "center", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📡</div>
          <div style={{ ...grotesk, fontSize: 14, fontWeight: 600, color: ds.t1 }}>Couldn't load data.</div>
          <div style={{ ...sans, fontSize: 11, color: ds.t2, marginTop: 4 }}>Pull to refresh.</div>
        </div>
        {/* Session expired modal */}
        <div style={{ background: ds.elevated, borderRadius: 14, padding: "20px 16px", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}>
          <div style={{ ...grotesk, fontSize: 15, fontWeight: 600, color: ds.t1 }}>Session expired</div>
          <div style={{ ...sans, fontSize: 12, color: ds.t2, marginTop: 4, marginBottom: 16 }}>Sign back in to save your progress.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: ds.red, borderRadius: 7, padding: "8px 16px", ...sans, fontSize: 12, color: "#0C0C0C", fontWeight: 500 }}>Sign in →</div>
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "8px 16px", ...sans, fontSize: 12, color: ds.t2 }}>Discard</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

const SCREEN_COMPONENTS = [
  LoginScreen, OnboardingScreen, HomeNewScreen, HomeNewScreen,
  HomeScoreScreen, MathActiveScreen, MathActiveScreen, MathCorrectScreen,
  MathWrongScreen, MathResultScreen, MathActiveScreen, MemoryDisplayScreen,
  MemoryRecallScreen, MemoryResultScreen, LeaderboardScreen, ColorCanvasScreen,
  LeaderboardScreen, LeaderboardScreen, HistoryScreen, ToastScreen
];

export default function App() {
  const [active, setActive] = useState(0);
  const ActiveScreen = SCREEN_COMPONENTS[active];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ ...grotesk, fontSize: 16, fontWeight: 700, color: "#F2F2F2" }}>BrainSharp</div>
        <div style={{ ...sans, fontSize: 11, color: "#888", background: "rgba(255,45,85,0.12)", border: "1px solid rgba(255,45,85,0.3)", borderRadius: 4, padding: "2px 8px", color: "#FF2D55" }}>Design Mockups</div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 200, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "12px 0", overflowY: "auto", flexShrink: 0 }}>
          {SCREENS.map((s, i) => (
            <div key={i} onClick={() => setActive(i)} style={{
              padding: "8px 16px", cursor: "pointer",
              background: active === i ? "rgba(255,45,85,0.1)" : "transparent",
              borderLeft: active === i ? "2px solid #FF2D55" : "2px solid transparent",
              ...sans, fontSize: 11, color: active === i ? "#F2F2F2" : "#666",
              transition: "all 0.15s"
            }}>
              <span style={{ color: "#444", marginRight: 6, ...mono, fontSize: 10 }}>{String(i+1).padStart(2,"0")}</span>
              {s}
            </div>
          ))}
        </div>

        {/* Main canvas */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#0C0C0C", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
            <ActiveScreen />
            {/* Show annotation panel */}
            <div style={{ width: 220, background: "#161616", borderRadius: 12, padding: 16, boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
              <div style={{ ...sans, fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Screen Notes</div>
              <div style={{ ...sans, fontSize: 12, color: "#888", lineHeight: 1.6 }}>
                {[
                  "Screen " + String(active+1).padStart(2,"0"),
                  "─────────",
                  active === 6 ? "✓ On-screen numpad always visible" : "",
                  active === 7 ? "✓ Auto-advance on correct (no tap)" : "",
                  active === 8 ? "✓ Red border on wrong, auto-advance 800ms" : "",
                  active === 12 ? "✓ QWERTY keyboard always shown" : "",
                  active === 12 ? "✓ Fuzzy match → green chip auto-appears" : "",
                  active === 15 ? "✓ Canvas bg = #FFFFFF (white only)" : "",
                  active === 15 ? "✓ Submit button ONLY here" : "",
                  "─────────",
                  "bgApp: #0C0C0C",
                  "accent: #FF2D55",
                  "correct: #00F5A0",
                  active === 15 ? "canvas: #FFFFFF" : "",
                ].filter(Boolean).map((n, i) => <div key={i}>{n}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 20px", display: "flex", gap: 8, overflowX: "auto" }}>
        {SCREENS.map((s, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            flexShrink: 0, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            background: active === i ? "rgba(255,45,85,0.15)" : "rgba(255,255,255,0.04)",
            border: active === i ? "1px solid rgba(255,45,85,0.4)" : "1px solid rgba(255,255,255,0.06)",
            ...sans, fontSize: 10, color: active === i ? "#FF2D55" : "#555"
          }}>{String(i+1).padStart(2,"0")}</div>
        ))}
      </div>
    </div>
  );
}
