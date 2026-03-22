import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
          <div className="w-16 h-16 bg-game-red/10 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="font-sans text-sm text-muted-foreground mb-8 max-w-[280px]">
            The app encountered an unexpected error. Don't worry, your brain rot is still being fought.
          </p>
          <button
            onClick={() => window.location.assign("/")}
            className="bg-game-red text-white px-6 py-2.5 rounded-full font-sans text-sm font-medium shadow-lg active:scale-95 transition-transform"
          >
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
