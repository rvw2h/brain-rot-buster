import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method") || "manual";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate from Google session
  useEffect(() => {
    if (method === "google") {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          const meta = data.user.user_metadata;
          if (meta?.full_name) setName(meta.full_name.split(" ")[0]);
        }
      });
    }
  }, [method]);

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

    const userData = {
      name: name.trim(),
      email: method === "manual" ? email : undefined,
      age: age ? parseInt(age) : null,
      city: city.trim() || null,
      loggedIn: true,
    };

    // Generate referral code
    const namePrefix = name.trim().slice(0, 4).toUpperCase().padEnd(4, "X");
    const hex = Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0");
    const referralCode = `BRAIN-${namePrefix}${hex}`;

    // Try upsert to Supabase users table
    try {
      const googleId = method === "manual" ? (email || `manual_${Date.now()}`) : undefined;
      let userId: string | undefined;

      if (method === "google") {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          userId = authData.user.id;
          await supabase.from("users").upsert({
            id: userId,
            first_name: name.trim(),
            google_id: authData.user.email || "",
            age: age ? parseInt(age) : null,
            city: city.trim() || null,
            referral_code: referralCode,
          });
        }
      } else {
        // Manual entry - insert without auth
        const { data } = await supabase.from("users").insert({
          first_name: name.trim(),
          google_id: googleId || "",
          age: age ? parseInt(age) : null,
          city: city.trim() || null,
          referral_code: referralCode,
        }).select("id").single();
        if (data) userId = data.id;
      }

      localStorage.setItem("bs_user", JSON.stringify({ ...userData, id: userId, referralCode }));
    } catch {
      localStorage.setItem("bs_user", JSON.stringify(userData));
    }

    navigate("/home");
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
