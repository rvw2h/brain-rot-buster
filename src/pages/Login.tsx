import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // For now, simulate login with localStorage
    localStorage.setItem("bs_user", JSON.stringify({ name: "", loggedIn: true }));
    navigate("/onboarding");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-7">
      <h1 className="font-display text-[28px] font-bold text-foreground text-center">
        BrainSharp
      </h1>
      <p className="font-sans text-sm text-muted-foreground mt-1.5 text-center">
        Fight brain rot. Train daily.
      </p>

      <button
        onClick={handleLogin}
        className="mt-9 bg-foreground rounded-full px-6 h-11 flex items-center gap-2.5 justify-center shadow-lg"
        style={{ width: 220 }}
      >
        <div className="w-[18px] h-[18px] rounded-full bg-[hsl(217,89%,61%)] flex-shrink-0" />
        <span className="font-sans text-[13px] text-background font-medium">
          Continue with Google
        </span>
      </button>

      <p className="font-sans text-[11px] text-t-tertiary mt-10 text-center">
        No spam. No notifications. Just you.
      </p>
    </div>
  );
};

export default Login;
