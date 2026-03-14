import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method") || "manual";
  const { setManualUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [syncError, setSyncError] = useState<string | null>(null);

  // Check session and user existence on mount
  useEffect(() => {
    const handleAuthCheck = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      // If Google redirect but no session, go back to login
      if (method === "google" && !user) {
        navigate("/login");
        return;
      }

      if (user) {
        // If user already exists in DB, skip onboarding
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("google_id", user.id)
          .maybeSingle();

        if (existingUser) {
          navigate("/home");
          return;
        }

        // Pre-fill name from Google metadata
        if (method === "google" && user.user_metadata?.full_name) {
          setName(user.user_metadata.full_name.split(" ")[0]);
        }
      }
    };

    handleAuthCheck();
  }, [method, navigate]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 10 || !/^[a-zA-Z]+$/.test(trimmed)) {
      errs.name = "2-10 letters only";
    }
    if (method === "manual" && email) {
      if (!email.endsWith("@gmail.com")) {
        errs.email = "Gmail only";
      }
    }
    if (age) {
      const a = parseInt(age);
      if (isNaN(a) || a < 1 || a > 100) errs.age = "1-100";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const trimmedName = name.trim();
    const parsedAge = age ? parseInt(age) : null;
    const trimmedCity = city.trim() || null;

    // Generate short referral code suffix (stored in DB)
    const namePrefix = trimmedName.slice(0, 4).toUpperCase().padEnd(4, "X");
    const rand = Math.floor(Math.random() * 1_000_000)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
    const shortCode = `${namePrefix}${rand}`;

    // Every user (Google or Manual) MUST have a Supabase session now
    const { data: authData } = await supabase.auth.getSession();
    const authUser = authData.session?.user;
    
    if (!authUser) {
      setSyncError("Please verify your email first (check your inbox for a magic link)");
      return;
    }

    try {
      setSyncError(null);
      await supabase
        .from("users")
        .upsert(
          {
            first_name: trimmedName,
            google_id: authUser.id,
            age: parsedAge,
            city: trimmedCity,
            referral_code: shortCode,
          },
          { onConflict: "google_id" },
        );
      
      if (method !== "google") {
        const manualProfile = {
          first_name: trimmedName,
          age: parsedAge,
          city: trimmedCity,
        };
        localStorage.setItem("bs_manual_user", JSON.stringify(manualProfile));
        setManualUser(manualProfile);
      }

      navigate("/home");
    } catch (err) {
      setSyncError("Something went wrong. Please try again.");
      console.error("Onboarding sync error:", err);
    }
  };

  const isGoogle = method === "google";
  const fields = isGoogle
    ? [
        { key: "name", label: "first name", value: name, setter: setName, type: "text" },
        { key: "age", label: "age", value: age, setter: setAge, type: "number" },
        { key: "city", label: "city", value: city, setter: setCity, type: "text" },
      ]
    : [
        { key: "name", label: "first name", value: name, setter: setName, type: "text" },
        { key: "email", label: "email (@gmail.com)", value: email, setter: setEmail, type: "email" },
        { key: "age", label: "age", value: age, setter: setAge, type: "number" },
        { key: "city", label: "city", value: city, setter: setCity, type: "text" },
      ];

  return (
    <div className="flex flex-col min-h-screen p-7 pt-12">
      <h1 className="font-display text-[22px] font-semibold text-foreground">
        {isGoogle ? "One last thing." : "Let's set you up."}
      </h1>
      <p className="font-sans text-sm text-muted-foreground mt-1 mb-6">
        {isGoogle ? "We just need a few details." : "We only need a few things."}
      </p>

      {fields.map((field) => {
        const isFocused = focusedField === field.key;
        const hasError = errors[field.key];

        return (
          <div key={field.key} className="mb-3">
            <input
              type={field.type}
              placeholder={field.label}
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              onFocus={() => setFocusedField(field.key)}
              onBlur={() => setFocusedField(null)}
              className={`w-full bg-elevated rounded-lg py-3 px-3.5 font-mono text-sm text-foreground placeholder:text-t-tertiary outline-none transition-all border-2 ${
                hasError
                  ? "border-game-red shadow-[0_0_0_2px_hsl(var(--game-red)/0.4)]"
                  : isFocused
                  ? "border-game-red shadow-[0_0_0_2px_hsl(var(--game-red)/0.4)]"
                  : "border-border/30"
              }`}
            />
            {hasError && (
              <p className="font-sans text-[10px] text-game-red mt-0.5 pl-1">{hasError}</p>
            )}
          </div>
        );
      })}

      <p className="font-sans text-[10px] text-t-tertiary mt-2 mb-3 text-center">
        No spam · No notifications · No T&C nonsense
      </p>

      {syncError && (
        <p className="font-sans text-xs text-game-red mb-4 p-3 bg-red-500/10 rounded-lg">
          {syncError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="inline-flex self-start bg-game-red rounded-lg px-5 py-2.5 font-sans text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
      >
        Let's go →
      </button>
    </div>
  );
};

export default Onboarding;
