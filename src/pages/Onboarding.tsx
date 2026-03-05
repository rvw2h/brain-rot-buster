import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name.trim()) return;
    localStorage.setItem(
      "bs_user",
      JSON.stringify({ name: name.trim(), age: age || null, city: city || null, loggedIn: true })
    );
    navigate("/home");
  };

  return (
    <div className="flex flex-col min-h-screen p-7 pt-7">
      {/* Step indicators */}
      <div className="flex gap-1.5 mb-7">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i === 0 ? "bg-game-red" : "bg-t-tertiary"}`}
          />
        ))}
      </div>

      <h1 className="font-display text-[22px] font-semibold text-foreground">Quick setup.</h1>
      <p className="font-sans text-sm text-muted-foreground mt-1 mb-6">We only need 3 things.</p>

      {["first name", "age", "city"].map((field) => {
        const value = field === "first name" ? name : field === "age" ? age : city;
        const setter = field === "first name" ? setName : field === "age" ? setAge : setCity;
        const isFocused = focusedField === field;

        return (
          <div key={field} className="mb-3">
            <input
              type={field === "age" ? "number" : "text"}
              placeholder={field}
              value={value}
              onChange={(e) => setter(e.target.value)}
              onFocus={() => setFocusedField(field)}
              onBlur={() => setFocusedField(null)}
              className={`w-full bg-elevated rounded-lg py-3 px-3.5 font-mono text-sm text-foreground placeholder:text-t-tertiary outline-none transition-all border-2 ${
                isFocused
                  ? "border-game-red shadow-[0_0_0_2px_hsl(var(--game-red)/0.4)]"
                  : "border-border/30"
              }`}
            />
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="mt-4 inline-flex self-start bg-game-red rounded-lg px-5 py-2.5 font-sans text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
      >
        Let's go →
      </button>
    </div>
  );
};

export default Onboarding;
