import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentAuth from "./pages/student/StudentAuth";
import AdminAuth from "./pages/admin/AdminAuth";
import { ToastContainer } from "./components/common/Toast";
import { isAuthenticated, getStoredRole } from "./lib/authGuard";
import { ProgressCircuitLoader } from "./components/loading/ProgressCircuitLoader";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ensureBackendReady } from "./lib/api";
import { WifiOff, RefreshCw } from "lucide-react";

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ContentManagerDashboard = lazy(() => import("./pages/admin/ContentManagerDashboard"));

const PageLoader = ({ label = "Loading dashboard..." }) => (
  <ProgressCircuitLoader fullScreen indeterminate label={label} />
);

// Wrapper components ensure guards re-evaluate on every navigation/render
function ProtectedStudent() {
  return isAuthenticated() ? (
    <Suspense fallback={<PageLoader label="Opening Student Workspace..." />}>
      <StudentDashboard />
    </Suspense>
  ) : (
    <Navigate to="/" replace />
  );
}

function ProtectedAdmin() {
  if (!isAuthenticated()) return <Navigate to="/admin" replace />;
  const role = getStoredRole();
  if (role === "admin") {
    return (
      <Suspense fallback={<PageLoader label="Opening Admin Console..." />}>
        <AdminDashboard />
      </Suspense>
    );
  }
  return <Navigate to="/admin" replace />;
}

function ProtectedContentManager() {
  if (!isAuthenticated()) return <Navigate to="/admin" replace />;
  const role = getStoredRole();
  if (role === "content_manager") {
    return (
      <Suspense fallback={<PageLoader label="Opening Content Manager Console..." />}>
        <ContentManagerDashboard />
      </Suspense>
    );
  }
  return <Navigate to="/admin" replace />;
}

export default function App() {
  // App initialization state machine: BOOTING -> READY (or ERROR/OFFLINE)
  const [appState, setAppState] = useState("BOOTING"); // 'BOOTING' | 'READY' | 'OFFLINE'
  const [wakingStage, setWakingStage] = useState("connecting"); // 'connecting' | 'starting' | 'waking'
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor browser online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      ensureBackendReady().then(() => setAppState("READY"));
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAppState("OFFLINE");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial warm-up readiness check
    if (!navigator.onLine) {
      setAppState("OFFLINE");
    } else {
      ensureBackendReady()
        .then(() => {
          setAppState("READY");
        })
        .catch(() => {
          // Even on temporary timeout, transition to ready so user can view offline/cached UI
          setAppState("READY");
        });
    }

    // Listen to background server waking events
    const handleWaking = (e) => {
      if (e.detail?.stage) setWakingStage(e.detail.stage);
    };
    const handleReady = () => {
      setAppState("READY");
    };

    window.addEventListener("server-waking", handleWaking);
    window.addEventListener("server-ready", handleReady);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("server-waking", handleWaking);
      window.removeEventListener("server-ready", handleReady);
    };
  }, []);

  // Offline Fullscreen Recovery Shell
  if (appState === "OFFLINE" || !isOnline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#070D19] flex items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-[#0E1629] border border-slate-850 rounded-3xl p-8 shadow-2xl space-y-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-100 uppercase tracking-wider font-mono">
              No Internet Connection
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Please check your network settings. HireGrid will automatically reconnect once your internet is restored.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border border-slate-700/50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Initial App Shell / Cold-Start Loader
  if (appState === "BOOTING") {
    let loaderMessage = "Connecting to server...";
    if (wakingStage === "starting") {
      loaderMessage = "Connecting to server...";
    } else if (wakingStage === "waking") {
      loaderMessage = "Server is starting. This may take a few seconds...";
    }

    return <ProgressCircuitLoader fullScreen indeterminate label={loaderMessage} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<StudentAuth />} />
          <Route path="/admin" element={<AdminAuth />} />
          <Route path="/student-dashboard" element={<ProtectedStudent />} />
          <Route path="/placement-mission" element={<ProtectedStudent />} />
          <Route path="/admin-dashboard" element={<ProtectedAdmin />} />
          <Route path="/content-manager-dashboard" element={<ProtectedContentManager />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
