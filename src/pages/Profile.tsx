import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import BottomNav from "@/components/game/BottomNav";

interface UserData {
  name: string;
  age?: number | null;
  city?: string | null;
  referralCode?: string;
  loggedIn: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("bs_user");
    if (!raw) {
      navigate("/");
      return;
    }
    const parsed = JSON.parse(raw);
    setUser(parsed);
    setNameInput(parsed.name || "");
  }, [navigate]);

  if (!user) return null;

  const referralCode = user.referralCode || `BRAIN-${(user.name || "USER").slice(0, 4).toUpperCase().padEnd(4, "X")}00`;

  const handleNameSave = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 10 || !/^[a-zA-Z]+$/.test(trimmed)) {
      setNameError("2-10 letters only");
      return;
    }
    setNameError("");
    const updated = { ...user, name: trimmed };
    setUser(updated);
    localStorage.setItem("bs_user", JSON.stringify(updated));
    setEditingName(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSignOut = () => {
    localStorage.removeItem("bs_user");
    navigate("/");
  };

  const subtitle = [user.city, user.age ? `${user.age}y` : null].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-5 pt-8 flex flex-col">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-3">
            <span className="font-display text-2xl font-bold text-muted-foreground">
              {user.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>

          {editingName ? (
            <div className="flex flex-col items-center gap-1">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-elevated rounded-lg py-2 px-3 font-mono text-sm text-foreground text-center outline-none border-2 border-game-red w-40"
                autoFocus
              />
              {nameError && <p className="font-sans text-[10px] text-game-red">{nameError}</p>}
              <button onClick={handleNameSave} className="font-sans text-xs text-game-red mt-1">
                Save
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)}>
              <h2 className="font-display text-xl font-semibold text-foreground">{user.name}</h2>
            </button>
          )}

          {subtitle && (
            <p className="font-sans text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Referral Code */}
        <div className="bg-surface rounded-lg p-4 mb-4 shadow-[0_0_0_1px_hsl(var(--border)/0.4)]">
          <p className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-2">
            Referral Code
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground flex-1">
              {referralCode}
            </span>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check size={16} className="text-game-green" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Follow Us */}
        <div className="bg-surface rounded-lg p-4 mb-4 shadow-[0_0_0_1px_hsl(var(--border)/0.4)]">
          <p className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
            Follow Us
          </p>
          <div className="flex gap-2">
            <a
              href="https://linkedin.com/company/brainsharp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-elevated rounded-lg p-3 text-center font-sans text-xs text-foreground hover:bg-border/30 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com/brainsharp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-elevated rounded-lg p-3 text-center font-sans text-xs text-foreground hover:bg-border/30 transition-colors"
            >
              X / Twitter
            </a>
          </div>
        </div>

        <div className="flex-1" />

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="self-center font-sans text-sm text-game-red mb-4"
        >
          Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
