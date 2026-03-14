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
      // Check for OTP code in URL first
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code && isMounted) {
        setLoading(true);
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" && newSession?.user) {
        // Load profile immediately on sign in
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", newSession.user.id)
          .maybeSingle();
        
        if (isMounted) {
          setProfile(profileData ?? null);
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setManualUser(null);
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

