import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MathGame from "./pages/MathGame";
import MemoryGame from "./pages/MemoryGame";
import ColorGame from "./pages/ColorGame";
import Leaderboard from "./pages/Leaderboard";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Relax from "./pages/Relax";
import MemoryWords from "./pages/MemoryWords";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

import SharpEyeGame from "./pages/SharpEyeGame";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <ModeProvider>
              <div className="max-w-md mx-auto min-h-screen bg-background relative shadow-2xl">
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/relax"
                    element={
                      <ProtectedRoute>
                        <Relax />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/math"
                    element={
                      <ProtectedRoute>
                        <MathGame />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/memory"
                    element={
                      <ProtectedRoute>
                        <MemoryGame />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/memory/words"
                    element={
                      <ProtectedRoute>
                        <MemoryWords />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/color"
                    element={
                      <ProtectedRoute>
                        <ColorGame />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sharp-eye"
                    element={
                      <ProtectedRoute>
                        <SharpEyeGame />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </ModeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
