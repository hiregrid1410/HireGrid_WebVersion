import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogOut,
  Users,
  Settings,
  Menu,
  ChevronRight,
  ChevronDown,
  CreditCard,
  ShieldAlert,
  Trophy,
  GitMerge,
  LayoutDashboard,
  Bell,
  Search,
  RotateCcw,
  BookOpen,
  FolderOpen,
  Award,
  Smartphone,
  Layers,
  UserCheck,
  Building2,
  X,
  User,
  SlidersHorizontal
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
const AdminExamsTab = lazy(() => import("../../components/admin/AdminExamsTab").then(m => ({ default: m.AdminExamsTab })));
const HierarchyBuilder = lazy(() => import("../../components/admin/HierarchyBuilder").then(m => ({ default: m.HierarchyBuilder })));
const AdminSystemHealthTab = lazy(() => import("../../components/admin/AdminSystemHealthTab").then(m => ({ default: m.AdminSystemHealthTab })));
const AdminMaintenanceTab = lazy(() => import("../../components/admin/AdminMaintenanceTab").then(m => ({ default: m.AdminMaintenanceTab })));

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const savedUserStr = localStorage.getItem("user");
  let savedUser = null;
  try {
    savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }

  const role = location.state?.role || savedUser?.role;
  const userName = location.state?.name || savedUser?.name || "Saumya";

  const [activeWorkspace, setActiveWorkspace] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("adminSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 1024;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

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
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("adminSidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#admin-profile-dropdown-container")) {
        setUserDropdownOpen(false);
      }
      if (!e.target.closest("#admin-notifications-container")) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="h-screen max-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] flex overflow-hidden w-screen">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. Sidebar - Clean White SaaS Design Matching Reference Screenshot */}
      <aside
        className={`bg-white border-r border-[#E2E8F0] flex flex-col justify-between transition-all duration-300 z-50 shrink-0
        fixed lg:relative inset-y-0 left-0 h-full overflow-hidden
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 w-64 lg:w-20"}`}
      >
        {/* Top Header / Logo Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#E2E8F0] shrink-0">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xl font-black tracking-tight text-[#0F172A] flex items-center">
                    HireGrid<span className="text-[#2563EB]">X</span>
                  </span>
                  <span className="text-[10px] bg-[#DBEAFE] text-[#2563EB] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ADMIN
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mx-auto p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center justify-center text-[#2563EB]"
                title="Expand Sidebar"
              >
                <span className="text-xl font-black tracking-tight">
                  H<span className="text-[#2563EB]">X</span>
                </span>
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <div className="overflow-y-auto max-h-[calc(100vh-8.5rem)] py-3 px-3 space-y-3 custom-scrollbar">
            {/* Top Primary Item: DASHBOARD */}
            <SidebarItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activeWorkspace === "overview" && activeSubTab === "dashboard"}
              onClick={() => setView("overview", "dashboard")}
              isOpen={sidebarOpen}
            />

            {/* Section 1: OPERATIONS */}
            <div className="space-y-0.5">
              {sidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  OPERATIONS
                </div>
              )}
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

            {/* Section 2: PEOPLE MANAGEMENT */}
            <div className="space-y-0.5">
              {sidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  PEOPLE MANAGEMENT
                </div>
              )}
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
                active={activeWorkspace === "people" && activeSubTab === "content_managers"}
                onClick={() => setView("people", "users")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<ShieldCheck />}
                label="Admins & Staff"
                active={activeWorkspace === "people" && activeSubTab === "staff"}
                onClick={() => setView("people", "users")}
                isOpen={sidebarOpen}
              />
            </div>

            {/* Section 3: CONTENT MANAGEMENT */}
            <div className="space-y-0.5">
              {sidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  CONTENT MANAGEMENT
                </div>
              )}
              <SidebarItem
                icon={<Building2 />}
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
                icon={<Layers />}
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
                active={activeWorkspace === "content" && activeSubTab === "exams"}
                onClick={() => setView("content", "exams")}
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

            {/* Section 4: ANALYTICS & REPORTS */}
            <div className="space-y-0.5">
              {sidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  ANALYTICS & REPORTS
                </div>
              )}
              <SidebarItem
                icon={<Trophy />}
                label="Leaderboard"
                active={activeWorkspace === "placement" && activeSubTab === "leaderboard"}
                onClick={() => setView("placement", "placement_mission")}
                isOpen={sidebarOpen}
              />
            </div>

            {/* Section 5: SYSTEM & SECURITY */}
            <div className="space-y-0.5">
              {sidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  SYSTEM & SECURITY
                </div>
              )}
              <SidebarItem
                icon={<Settings />}
                label="Settings"
                active={activeWorkspace === "system" && activeSubTab === "settings"}
                onClick={() => setView("system", "settings")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<ShieldAlert />}
                label="Security Logs"
                active={activeWorkspace === "monitoring" && activeSubTab === "security"}
                onClick={() => setView("monitoring", "security")}
                isOpen={sidebarOpen}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Profile Card - Matching Screenshot */}
        <div className="p-3 border-t border-[#E2E8F0] shrink-0 bg-white">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="truncate text-left">
                  <p className="text-xs font-bold text-[#0F172A] leading-tight truncate">{userName}</p>
                  <p className="text-[10px] text-[#64748B] font-medium">Super Admin</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
        {/* Top Navigation Bar - Matching Reference Screenshot */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-5 sm:px-8 shrink-0 relative z-20">
          {/* Left: Sidebar Toggle & Global Search Field */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-64 sm:w-80 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students, companies, modules, exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#2563EB] text-[#0F172A] placeholder:text-slate-400 transition-all font-medium"
              />
            </div>
          </div>

          {/* Right: Notifications & Admin Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with Red Dot Indicator */}
            <div className="relative" id="admin-notifications-container">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-3 z-50 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2 font-bold text-[#0F172A]">
                    <span>Notifications</span>
                    <span className="text-[10px] text-[#2563EB] cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2 py-1 text-[#64748B]">
                    <div className="p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                      <p className="font-semibold text-[#0F172A] text-xs">New payment request received</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">A student submitted a proof of payment</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors">
                      <p className="font-semibold text-[#0F172A] text-xs">Device reset pending</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Student requesting device clearance</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Dropdown */}
            <div className="relative" id="admin-profile-dropdown-container">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#0F172A] leading-tight">{userName}</p>
                  <p className="text-[10px] text-[#64748B] font-medium">Super Admin</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-2 z-50 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                    <p className="font-bold text-[#0F172A]">{userName}</p>
                    <p className="text-[10px] text-[#64748B]">saumya14@gmail.com</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setView("system", "settings");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>System Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#EF4444] hover:bg-rose-50 transition-colors cursor-pointer font-semibold mt-1"
                  >
                    <LogOut className="w-4 h-4 text-[#EF4444]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. Workspace Main Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense
              fallback={
                <div className="py-24 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Loading Workspace...
                  </span>
                </div>
              }
            >
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
                {activeWorkspace === "people" && (
                  <AdminUsersTab
                    isSuperAdmin={location.state?.id === "super_admin" || userName === "Admin" || userName === "Saumya"}
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
                {activeWorkspace === "content" && activeSubTab === "exams" && (
                  <AdminExamsTab />
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

// Sidebar Navigation Item Component matching screenshot
function SidebarItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center py-2.5 px-3 rounded-xl text-xs transition-all group cursor-pointer ${
        active
          ? "bg-[#DBEAFE] text-[#2563EB] font-bold"
          : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 font-medium"
      } ${!isOpen ? "justify-center px-0" : ""}`}
      title={!isOpen ? label : undefined}
    >
      <span className={`${active ? "text-[#2563EB]" : "text-[#64748B] group-hover:text-[#0F172A]"}`}>
        {React.cloneElement(icon, { className: "w-4 h-4 shrink-0" })}
      </span>
      <span className={`ml-3 truncate ${!isOpen && "hidden"}`}>{label}</span>
    </button>
  );
}
