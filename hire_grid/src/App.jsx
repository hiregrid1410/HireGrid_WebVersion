import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentAuth from "./pages/student/StudentAuth";
import AdminAuth from "./pages/admin/AdminAuth";
import { ToastContainer } from "./components/common/Toast";
import { isAuthenticated, getStoredRole } from "./lib/authGuard";

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ContentManagerDashboard = lazy(() => import("./pages/admin/ContentManagerDashboard"));

const PageLoader = () => (
  <div className="min-h-screen bg-[#070D19] flex items-center justify-center">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-emerald-500 animate-spin"></div>
      <div className="absolute inset-0 m-auto h-6 w-6 rounded-full bg-emerald-500/10 animate-ping"></div>
    </div>
  </div>
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
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<StudentAuth />} />
        <Route path="/admin" element={<AdminAuth />} />
        <Route path="/student-dashboard" element={<ProtectedStudent />} />
        <Route path="/admin-dashboard" element={<ProtectedAdmin />} />
        <Route path="/content-manager-dashboard" element={<ProtectedContentManager />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
