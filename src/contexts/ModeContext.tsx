import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "simple" | "aura";

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem("bs_mode");
    return (saved as AppMode) || "simple";
  });

  useEffect(() => {
    localStorage.setItem("bs_mode", mode);
  }, [mode]);

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useAppMode = () => {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useAppMode must be used within a ModeProvider");
  return ctx;
};
