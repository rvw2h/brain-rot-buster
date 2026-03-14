import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Double check if user row exists in DB
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("google_id", session.user.id)
          .maybeSingle();

        if (userRow) {
          navigate("/home", { state: { loginMethod: "auto" } });
        }
        // If session exists but no user row, stay here to let them finish onboarding
      }
    };

    if (!loading) {
      checkSession();
    }
  }, [navigate, loading]);

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding?method=google`,
      },
    });
  };

  const handleManual = () => {
    navigate("/onboarding?method=manual");
  };

  return (
    <div className="flex flex-col min-h-screen px-7 py-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        <img src="/logo.png" alt="BrainSharp logo" className="w-[120px] h-[120px] mb-5 rounded-2xl" />

        <h1 className="font-display text-[28px] font-bold text-foreground text-center">
          BrainSharp
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-1.5 text-center">
          Your daily brain health buddy
        </p>

        <div className="flex flex-col gap-3 mt-9 w-full max-w-[260px]">
          <button
            onClick={handleGoogle}
            className="bg-white rounded-full h-11 flex items-center gap-2.5 justify-center shadow-lg px-6"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.0 24.0 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <span className="font-sans text-[13px] text-[#1C1C1E] font-medium">
              Sign in with Google
            </span>
          </button>

          <button
            onClick={handleManual}
            className="bg-foreground rounded-full h-11 flex items-center justify-center shadow-lg px-6"
          >
            <span className="font-sans text-[13px] text-background font-medium">
              Enter manually →
            </span>
          </button>
        </div>
      </div>

      <p className="font-sans text-[11px] text-t-tertiary text-center mt-6">
        No spam. No notifications. Just you.
      </p>
    </div>
  );
};

export default Login;
