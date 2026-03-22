import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, manualUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-pulse">
        <div className="w-10 h-10 border-4 border-game-red/30 border-t-game-red rounded-full animate-spin mb-4" />
        <p className="font-sans text-sm text-muted-foreground font-medium">Fighting brain rot...</p>
      </div>
    );
  }

  if (!session && !manualUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;

