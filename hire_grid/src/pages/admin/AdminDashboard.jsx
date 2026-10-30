
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogOut,
  Users,
  Settings,
  IndianRupee,
  Menu,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  CreditCard,
  ShieldAlert,
  Trophy,
  GitMerge,
  LayoutDashboard,
  Bell,
  Search,
  Calendar,
  RotateCcw,
  BookOpen,
  FolderOpen,
  Award,
  Smartphone,
  Globe,
  Radio,
  UserCheck
} from "lucide-react";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { AdminOverviewTab } from "../../components/admin/AdminOverviewTab";

// Dynamic Code Splitting: Lazy-load heavy administrative tabs on demand
const AdminUsersTab = lazy(() => import("../../components/admin/AdminUsersTab").then(m => ({ default: m.AdminUsersTab })));
const AdminSettingsTab = lazy(() => import("../../components/admin/AdminSettingsTab").then(m => ({ default: m.AdminSettingsTab })));
const AdminPaymentRequestsTab = lazy(() => import("../../components/admin/AdminPaymentRequestsTab").then(m => ({ default: m.AdminPaymentRequestsTab })));
const AdminDeviceRequestsTab = lazy(() => import("../../components/admin/AdminDeviceRequestsTab").then(m => ({ default: m.AdminDeviceRequestsTab })));
const AdminFeedbacksTab = lazy(() => import("../../components/admin/AdminFeedbacksTab").then(m => ({ default: m.AdminFeedbacksTab })));
const AdminPlansTab = lazy(() => import("../../components/admin/AdminPlansTab").then(m => ({ default: m.AdminPlansTab })));
const AdminAuditLogTab = lazy(() => import("../../components/admin/AdminAuditLogTab").then(m => ({ default: m.AdminAuditLogTab })));
const AdminPlacementMissionTab = lazy(() => import("../../components/admin/AdminPlacementMissionTab").then(m => ({ default: m.AdminPlacementMissionTab })));
const AdminBranchesTab = lazy(() => import("../../components/admin/AdminBranchesTab").then(m => ({ default: m.AdminBranchesTab })));
const AdminRevisionModulesTab = lazy(() => import("../../components/admin/AdminRevisionModulesTab").then(m => ({ default: m.AdminRevisionModulesTab })));
const AdminCompaniesTab = lazy(() => import("../../components/admin/AdminCompaniesTab").then(m => ({ default: m.AdminCompaniesTab })));
const AdminModulesTab = lazy(() => import("../../components/admin/AdminModulesTab").then(m => ({ default: m.AdminModulesTab })));
const HierarchyBuilder = lazy(() => import("../../components/admin/HierarchyBuilder").then(m => ({ default: m.HierarchyBuilder })));
const AdminSystemHealthTab = lazy(() => import("../../components/admin/AdminSystemHealthTab").then(m => ({ default: m.AdminSystemHealthTab })));
const AdminMaintenanceTab = lazy(() => import("../../components/admin/AdminMaintenanceTab").then(m => ({ default: m.AdminMaintenanceTab })));
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useTheme } from "../../ThemeContext";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const logo = "/dark_logo.png";
  const savedUserStr = localStorage.getItem("user");
  let savedUser = null;
  try {
    savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }

  const role = location.state?.role || savedUser?.role;
  const userName = location.state?.name || savedUser?.name || "Admin";

  const [activeWorkspace, setActiveWorkspace] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("adminSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 768;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState("all");

  const [openCategories, setOpenCategories] = useState({
    operations: true,
    people: true,
    content: true,
    analytics: true,
    security: true,
  });

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("adminSidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  if (role !== "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const setView = (workspace, subtab = "") => {
    setActiveWorkspace(workspace);
    setActiveSubTab(subtab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const getBreadcrumbTitle = () => {
    switch (activeWorkspace) {
      case "overview":
        return "Overview";
      case "operations":
        return "Operations";
      case "people":
        return "People Management";
      case "content":
        return "Content Management";
      case "placement":
        return "Placement";
      case "analytics":
        return "Analytics & Reports";
      case "monitoring":
        return "Monitoring";
      case "system":
        return "System & Security";
      default:
        return activeWorkspace;
    }
  };

  const getSubTabTitle = () => {
    switch (activeSubTab) {
      case "dashboard":
        return "Dashboard";
      case "purchase_requests":
        return "Payment Requests";
      case "device_access":
        return "Device Requests";
      case "announcements":
        return "Announcements";
      case "users":
        return "Students & Staff";
      case "companies":
        return "Companies";
      case "branch_access":
        return "Branches";
      case "hierarchy":
        return "Hierarchy Builder";
      case "modules":
        return "Modules";
      case "plans":
        return "Subscription Plans";
      case "revision_modules":
        return "Revision Content";
      case "exams":
        return "Exams";
      case "placement_mission":
        return "Placement Missions";
      case "feedback":
        return "Student Feedback";
      case "security":
        return "Security Logs";
      case "audit_logs":
        return "Audit Logs";
      case "settings":
        return "Settings";
      case "maintenance":
        return "System Maintenance";
      default:
        return activeSubTab.replace("_", " ");
    }
  };

  return (
    <div className="h-screen max-h-screen bg-bg-page font-sans text-slate-800 dark:text-slate-100 flex overflow-hidden w-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Matching Image 1 */}
      <aside
        className={`bg-[#0A101D] dark:bg-[#070D18] border-r border-slate-800 flex flex-col transition-all duration-300 z-50 shrink-0
        fixed md:relative inset-y-0 left-0 h-full overflow-hidden
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 w-64 md:w-20"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src="/dark_logo.png"
                  alt="HireGrid"
                  className="h-7 w-auto max-w-[130px] object-contain"
                />
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0">
                  Admin
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mx-auto p-1.5 hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Expand Sidebar"
            >
              <img
                src="/dark_logo.png"
                alt="HireGrid"
                className="h-7 w-auto max-w-[36px] object-contain"
              />
            </button>
          )}
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
          {/* Main Top Item: DASHBOARD */}
          <SidebarItem
            icon={<LayoutDashboard />}
            label="Dashboard"
            active={activeWorkspace === "overview" && activeSubTab === "dashboard"}
            onClick={() => setView("overview", "dashboard")}
            isOpen={sidebarOpen}
            isPrimary={true}
          />

          {/* Group 1: OPERATIONS */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("operations")}
              className={`w-full flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-wider px-3 mb-1 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>OPERATIONS</span>
              {openCategories.operations ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openCategories.operations && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<CreditCard />}
                  label="Payment Requests"
                  active={activeWorkspace === "operations" && activeSubTab === "purchase_requests"}
                  onClick={() => setView("operations", "purchase_requests")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Smartphone />}
                  label="Device Requests"
                  active={activeWorkspace === "operations" && activeSubTab === "device_access"}
                  onClick={() => setView("operations", "device_access")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Bell />}
                  label="Announcements"
                  active={activeWorkspace === "monitoring" && activeSubTab === "feedback"}
                  onClick={() => setView("monitoring", "feedback")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Group 2: PEOPLE MANAGEMENT */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("people")}
              className={`w-full flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-wider px-3 mb-1 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>PEOPLE MANAGEMENT</span>
              {openCategories.people ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openCategories.people && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<Users />}
                  label="Students"
                  active={activeWorkspace === "people" && activeSubTab === "users"}
                  onClick={() => setView("people", "users")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<UserCheck />}
                  label="Content Managers"
                  active={activeWorkspace === "people" && activeSubTab === "users"}
                  onClick={() => setView("people", "users")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<ShieldCheck />}
                  label="Admins & Staff"
                  active={activeWorkspace === "people" && activeSubTab === "users"}
                  onClick={() => setView("people", "users")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Group 3: CONTENT MANAGEMENT */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("content")}
              className={`w-full flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-wider px-3 mb-1 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>CONTENT MANAGEMENT</span>
              {openCategories.content ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openCategories.content && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<BookOpen />}
                  label="Companies"
                  active={activeWorkspace === "content" && activeSubTab === "companies"}
                  onClick={() => setView("content", "companies")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<GitMerge />}
                  label="Branches"
                  active={activeWorkspace === "content" && activeSubTab === "branch_access"}
                  onClick={() => setView("content", "branch_access")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<FolderOpen />}
                  label="Hierarchy Builder"
                  active={activeWorkspace === "content" && activeSubTab === "hierarchy"}
                  onClick={() => setView("content", "hierarchy")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<BookOpen />}
                  label="Modules"
                  active={activeWorkspace === "content" && activeSubTab === "modules"}
                  onClick={() => setView("content", "modules")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<CreditCard />}
                  label="Plans"
                  active={activeWorkspace === "content" && activeSubTab === "plans"}
                  onClick={() => setView("content", "plans")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<RotateCcw />}
                  label="Revision Content"
                  active={activeWorkspace === "content" && activeSubTab === "revision_modules"}
                  onClick={() => setView("content", "revision_modules")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Award />}
                  label="Exams"
                  active={activeWorkspace === "content" && activeSubTab === "modules"}
                  onClick={() => setView("content", "modules")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Trophy />}
                  label="Placement Missions"
                  active={activeWorkspace === "placement" && activeSubTab === "placement_mission"}
                  onClick={() => setView("placement", "placement_mission")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Group 4: ANALYTICS & REPORTS */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("analytics")}
              className={`w-full flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-wider px-3 mb-1 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>ANALYTICS & REPORTS</span>
              {openCategories.analytics ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openCategories.analytics && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<Trophy />}
                  label="Leaderboard"
                  active={activeWorkspace === "placement" && activeSubTab === "placement_mission"}
                  onClick={() => setView("placement", "placement_mission")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Group 5: SYSTEM & SECURITY */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("security")}
              className={`w-full flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-wider px-3 mb-1 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>SYSTEM & SECURITY</span>
              {openCategories.security ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openCategories.security && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<ShieldAlert />}
                  label="Security Logs"
                  active={activeWorkspace === "monitoring" && activeSubTab === "security"}
                  onClick={() => setView("monitoring", "security")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Settings />}
                  label="Settings"
                  active={activeWorkspace === "system" && activeSubTab === "settings"}
                  onClick={() => setView("system", "settings")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#070D18]">
          <div className={`flex items-center ${!sidebarOpen ? "justify-center" : "px-2"} mb-3`}>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={`ml-2.5 ${!sidebarOpen && "hidden"}`}>
              <p className="text-xs font-bold text-white leading-tight truncate">{userName}</p>
              <p className="text-[10px] text-blue-400 font-medium">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer ${!sidebarOpen && "px-0"}`}
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
        {/* Top Header - Matching Image 1 */}
        <header className="h-16 bg-white dark:bg-[#0E1628] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-20 shadow-xs">
          {/* Left: Hamburger & Global Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-64 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students, companies, modules, exams, plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Right Header Status & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <ThemeToggle />

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{userName}</p>
                <p className="text-[10px] text-slate-400 font-medium">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#070D19] custom-scrollbar p-3 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={
    <div className="py-20 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading Workspace...</span>
    </div>
  }>
  <div className="animate-in fade-in duration-200">
              {activeWorkspace === "overview" && activeSubTab === "dashboard" && (
                <AdminOverviewTab onNavigateTab={setView} />
              )}
              {activeWorkspace === "overview" && activeSubTab === "health" && (
                <AdminSystemHealthTab />
              )}
              {activeWorkspace === "operations" && activeSubTab === "purchase_requests" && (
                <AdminPaymentRequestsTab userName={userName} />
              )}
              {activeWorkspace === "operations" && activeSubTab === "device_access" && (
                <AdminDeviceRequestsTab />
              )}
              {activeWorkspace === "people" && activeSubTab === "users" && (
                <AdminUsersTab
                  isSuperAdmin={location.state?.id === "super_admin" || userName === "Admin"}
                  adminName={userName}
                />
              )}
              {activeWorkspace === "content" && activeSubTab === "companies" && (
                <AdminCompaniesTab isContentManager={false} userName={userName} />
              )}
              {activeWorkspace === "content" && activeSubTab === "branch_access" && (
                <AdminBranchesTab isContentManager={false} userName={userName} />
              )}
              {activeWorkspace === "content" && activeSubTab === "hierarchy" && (
                <HierarchyBuilder />
              )}
              {activeWorkspace === "content" && activeSubTab === "modules" && (
                <AdminModulesTab />
              )}
              {activeWorkspace === "content" && activeSubTab === "revision_modules" && (
                <AdminRevisionModulesTab />
              )}
              {activeWorkspace === "content" && activeSubTab === "plans" && (
                <AdminPlansTab userName={userName} />
              )}
              {activeWorkspace === "placement" && activeSubTab === "placement_mission" && (
                <AdminPlacementMissionTab userName={userName} />
              )}
              {activeWorkspace === "monitoring" && activeSubTab === "feedback" && (
                <AdminFeedbacksTab isContentManager={false} />
              )}
              {activeWorkspace === "monitoring" && activeSubTab === "security" && (
                <AdminAuditLogTab />
              )}
              {activeWorkspace === "monitoring" && activeSubTab === "audit_logs" && (
                <AdminAuditLogTab />
              )}
              {activeWorkspace === "system" && activeSubTab === "settings" && (
                <AdminSettingsTab />
              )}
              {activeWorkspace === "system" && activeSubTab === "maintenance" && (
                <AdminMaintenanceTab />
              )}
            </div>
  </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isOpen, isPrimary }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center py-2 px-3 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
        active
          ? isPrimary
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
            : "bg-blue-500/10 text-blue-400 font-bold border-l-2 border-blue-500"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      } ${!isOpen ? "justify-center px-0" : ""}`}
      title={!isOpen ? label : undefined}
    >
      <span className={`${active ? (isPrimary ? "text-white" : "text-blue-400") : "text-slate-400 group-hover:text-slate-200"}`}>
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </span>
      <span className={`ml-2.5 truncate ${!isOpen && "hidden"}`}>{label}</span>
    </button>
  );
}
