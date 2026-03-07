import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import BottomNav from "@/components/game/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const navigate = useNavigate();
  const { session, profile, setProfile, manualUser, setManualUser } = useAuth();

  const initialName = profile?.first_name ?? manualUser?.first_name ?? "";
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [nameError, setNameError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!profile && !manualUser) return null;

  const isSupabaseUser = !!profile;
  const displayName = profile?.first_name ?? manualUser?.first_name ?? "";
  const subtitleParts = [
    profile?.city ?? manualUser?.city ?? null,
    profile?.age ?? manualUser?.age ? `${profile?.age ?? manualUser?.age}y` : null,
  ].filter(Boolean) as string[];
  const subtitle = subtitleParts.join(" · ");

  const fullReferralUrl =
    profile?.referral_code ? `https://brainsharp.app/join?ref=${profile.referral_code}` : "";

  const handleNameSave = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 10 || !/^[a-zA-Z]+$/.test(trimmed)) {
      setNameError("2-10 letters only");
      return;
    }
    setNameError("");

    if (profile) {
      await supabase.from("users").update({ first_name: trimmed }).eq("id", profile.id);
      setProfile({ ...profile, first_name: trimmed });
    } else if (manualUser) {
      const updated = { ...manualUser, first_name: trimmed };
      localStorage.setItem("bs_manual_user", JSON.stringify(updated));
      setManualUser(updated);
    }

    setEditingName(false);
  };

  const handleCopy = () => {
    if (!fullReferralUrl) return;
    navigator.clipboard.writeText(fullReferralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    if (session) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("bs_manual_user");
      setManualUser(null);
    }
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-5 pt-8 flex flex-col">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-3">
            <span className="font-display text-2xl font-bold text-muted-foreground">
              {displayName?.[0]?.toUpperCase() || "?"}
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
              <h2 className="font-display text-xl font-semibold text-foreground">{displayName}</h2>
            </button>
          )}

          {subtitle && (
            <p className="font-sans text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Referral / Info */}
        <div className="bg-surface rounded-lg p-4 mb-4 shadow-[0_0_0_1px_hsl(var(--border)/0.4)]">
          <p className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-2">
            Referral
          </p>
          {isSupabaseUser && fullReferralUrl ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-foreground flex-1 truncate">
                {fullReferralUrl}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 px-3 py-1 text-[11px] font-sans text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-game-green" />
                    <span>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="font-sans text-[11px] text-muted-foreground">
              Referral link is available when you sign in with Google.
            </p>
          )}
        </div>

        {/* Follow Us */}
        <div className="bg-surface rounded-lg p-4 mb-4 shadow-[0_0_0_1px_hsl(var(--border)/0.4)]">
          <p className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
            Follow Us
          </p>
          <div className="flex gap-2">
            <a
              href="https://www.linkedin.com/in/rahulverma31/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-elevated rounded-lg p-3 text-center font-sans text-xs text-foreground hover:bg-border/30 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com/yaaarrv"
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
