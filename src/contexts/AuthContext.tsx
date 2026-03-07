import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/integrations/supabase/types";

interface ManualUser {
  first_name: string;
  age: number | null;
  city: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Tables<"users"> | null;
  setProfile: (profile: Tables<"users"> | null) => void;
  manualUser: ManualUser | null;
  setManualUser: (user: ManualUser | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<"users"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualUser, setManualUser] = useState<ManualUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (!data.session) {
        const stored = localStorage.getItem("bs_manual_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as ManualUser;
            setManualUser(parsed);
          } catch {
            setManualUser(null);
          }
        }
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setProfile(null);

      if (newSession) {
        setManualUser(null);
        localStorage.removeItem("bs_manual_user");
      } else {
        const stored = localStorage.getItem("bs_manual_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as ManualUser;
            setManualUser(parsed);
          } catch {
            setManualUser(null);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("google_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile(data ?? null);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        setProfile,
        manualUser,
        setManualUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

