import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentAuth from "./pages/student/StudentAuth";
import AdminAuth from "./pages/admin/AdminAuth";
import { ToastContainer } from "./components/common/Toast";
import { isAuthenticated, getStoredRole } from "./lib/authGuard";

import { ProgressCircuitLoader } from "./components/loading/ProgressCircuitLoader";

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ContentManagerDashboard = lazy(() => import("./pages/admin/ContentManagerDashboard"));

const PageLoader = () => (
  <ProgressCircuitLoader fullScreen indeterminate label="Initializing HireGridX..." />
);

// Wrapper components ensure guards re-evaluate on every navigation/render
function ProtectedStudent() {
  return isAuthenticated() ? (
    <Suspense fallback={<PageLoader />}>
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
      <Suspense fallback={<PageLoader />}>
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
      <Suspense fallback={<PageLoader />}>
        <ContentManagerDashboard />
      </Suspense>
    );
  }
  return <Navigate to="/admin" replace />;
}

export default function App() {
  const [serverWaking, setServerWaking] = React.useState(false);

  React.useEffect(() => {
    const handleWaking = () => setServerWaking(true);
    const handleReady = () => setServerWaking(false);

    window.addEventListener("server-waking", handleWaking);
    window.addEventListener("server-ready", handleReady);

    return () => {
      window.removeEventListener("server-waking", handleWaking);
      window.removeEventListener("server-ready", handleReady);
    };
  }, []);

  return (
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

      {serverWaking && (
        <div className="fixed inset-0 z-[9999] bg-[#070D19]/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-300">
          <div className="max-w-md w-full glass-panel border border-emerald-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Spinning & pulsing glowing element */}
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin"></div>
              <div className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-emerald-500/10 animate-ping"></div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 font-mono">
              Starting server...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              The server is waking up. This may take a few seconds.
            </p>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}
