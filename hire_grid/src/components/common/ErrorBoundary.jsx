import React from "react";
import { RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[HIREGRID RUNTIME ERROR]:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // If it's a dynamic import failure (e.g. stale deployed hashed chunk)
      const isChunkLoadError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Importing a module script failed") ||
        this.state.error?.message?.includes("Loading chunk");

      if (isChunkLoadError) {
        const hasAttemptedChunkReload = sessionStorage.getItem("hiregrid_chunk_reloaded");
        if (!hasAttemptedChunkReload) {
          sessionStorage.setItem("hiregrid_chunk_reloaded", "true");
          window.location.reload();
          return null;
        }
      }

      return (
        <div className="fixed inset-0 z-[9999] bg-[#070D19] flex items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#0E1629] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 animate-pulse">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" style={{ animationDuration: "8s" }} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100 uppercase tracking-wider font-mono">
                Application Recovery
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                A temporary interface issue occurred. Your progress and account remain safe.
              </p>
            </div>

            <div className="flex w-full space-x-3 pt-2">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border border-slate-700/50 shadow-sm"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
