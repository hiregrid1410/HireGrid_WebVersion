import React, { useState, useEffect } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogOut,
  Users,
  Settings,
  Server,
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
  Database,
  Calendar,
} from "lucide-react";
import { AdminUsersTab } from "../../components/admin/AdminUsersTab";
import { AdminSettingsTab } from "../../components/admin/AdminSettingsTab";
import { AdminPaymentRequestsTab } from "../../components/admin/AdminPaymentRequestsTab";
import { AdminDeviceRequestsTab } from "../../components/admin/AdminDeviceRequestsTab";
import { AdminFeedbacksTab } from "../../components/admin/AdminFeedbacksTab";
import { AdminPlansTab } from "../../components/admin/AdminPlansTab";
import { AdminAuditLogTab } from "../../components/admin/AdminAuditLogTab";
import { AdminPlacementMissionTab } from "../../components/admin/AdminPlacementMissionTab";
import { AdminBranchesTab } from "../../components/admin/AdminBranchesTab";
import { AdminSystemHealthTab } from "../../components/admin/AdminSystemHealthTab";
import { AdminMaintenanceTab } from "../../components/admin/AdminMaintenanceTab";
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

  const [openCategories, setOpenCategories] = useState({
    overview: true,
    operations: true,
    people: true,
    content: true,
    placement: true,
    monitoring: true,
    system: true,
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
        return "People";
      case "content":
        return "Content & Access";
      case "placement":
        return "Placement";
      case "monitoring":
        return "Monitoring";
      case "system":
        return "System";
      default:
        return activeWorkspace;
    }
  };

  const getSubTabTitle = () => {
    switch (activeSubTab) {
      case "dashboard":
        return "Dashboard";
      case "purchase_requests":
        return "Purchase Requests";
      case "device_access":
        return "Device Access Requests";
      case "users":
        return "Students & Staff";
      case "branch_access":
        return "Branch Access";
      case "plans":
        return "Subscription Plans";
      case "placement_mission":
        return "Placement Mission Cycles";
      case "feedback":
        return "Student Feedback";
      case "security":
        return "Security Center";
      case "audit_logs":
        return "Audit Logs";
      case "settings":
        return "Settings";
      case "maintenance":
        return "Database Maintenance";
      default:
        return activeSubTab.replace("_", " ");
    }
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

      {/* Sidebar */}
      <aside
        className={`bg-[#0B1F3A] dark:bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 z-50 shrink-0
        fixed md:relative inset-y-0 left-0 h-full overflow-hidden
        ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 w-72 md:w-20"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <img src={logo} alt="HireGridX Logo" className="h-11 w-auto object-contain bg-transparent" />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mx-auto p-1.5 hover:bg-slate-850 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Expand Sidebar"
            >
              <img src={logo} alt="HireGridX Logo" className="h-11 w-11 object-contain bg-transparent" />
            </button>
          )}
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-5 custom-scrollbar">
          {/* Category: OVERVIEW */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("overview")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>Overview</span>
              {openCategories.overview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.overview && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<LayoutDashboard />}
                  label="Dashboard"
                  active={activeWorkspace === "overview" && activeSubTab === "dashboard"}
                  onClick={() => setView("overview", "dashboard")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Category: OPERATIONS */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("operations")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>Operations</span>
              {openCategories.operations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.operations && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<IndianRupee />}
                  label="Purchase Requests"
                  active={activeWorkspace === "operations" && activeSubTab === "purchase_requests"}
                  onClick={() => setView("operations", "purchase_requests")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Server />}
                  label="Device Access"
                  active={activeWorkspace === "operations" && activeSubTab === "device_access"}
                  onClick={() => setView("operations", "device_access")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Category: PEOPLE */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("people")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>People</span>
              {openCategories.people ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.people && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<Users />}
                  label="User Management"
                  active={activeWorkspace === "people" && activeSubTab === "users"}
                  onClick={() => setView("people", "users")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Category: CONTENT & ACCESS */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("content")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>Content & Access</span>
              {openCategories.content ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.content && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<GitMerge />}
                  label="Branch Access"
                  active={activeWorkspace === "content" && activeSubTab === "branch_access"}
                  onClick={() => setView("content", "branch_access")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<CreditCard />}
                  label="Subscription Plans"
                  active={activeWorkspace === "content" && activeSubTab === "plans"}
                  onClick={() => setView("content", "plans")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Category: PLACEMENT */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("placement")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>Placement</span>
              {openCategories.placement ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.placement && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<Trophy />}
                  label="Placement Mission"
                  active={activeWorkspace === "placement" && activeSubTab === "placement_mission"}
                  onClick={() => setView("placement", "placement_mission")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Category: MONITORING */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("monitoring")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>Monitoring</span>
              {openCategories.monitoring ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.monitoring && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<MessageSquare />}
                  label="Student Feedback"
                  active={activeWorkspace === "monitoring" && activeSubTab === "feedback"}
                  onClick={() => setView("monitoring", "feedback")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<ShieldAlert />}
                  label="Security Logs"
                  active={activeWorkspace === "monitoring" && activeSubTab === "security"}
                  onClick={() => setView("monitoring", "security")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Database />}
                  label="Audit Logs"
                  active={activeWorkspace === "monitoring" && activeSubTab === "audit_logs"}
                  onClick={() => setView("monitoring", "audit_logs")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>

          {/* Category: SYSTEM */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("system")}
              className={`w-full flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-2 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>System</span>
              {openCategories.system ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategories.system && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<Settings />}
                  label="Settings"
                  active={activeWorkspace === "system" && activeSubTab === "settings"}
                  onClick={() => setView("system", "settings")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Database />}
                  label="Maintenance"
                  active={activeWorkspace === "system" && activeSubTab === "maintenance"}
                  onClick={() => setView("system", "maintenance")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className={`flex items-center ${!sidebarOpen ? "justify-center" : "px-2"} mb-4`}>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={`ml-3 ${!sidebarOpen && "hidden"}`}>
              <p className="text-sm font-bold text-white leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all ${!sidebarOpen && "px-0"}`}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 relative z-20 shadow-sm">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 mr-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline">Command Center</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:block" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {getBreadcrumbTitle()}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-800 dark:text-white">
              {getSubTabTitle()}
            </span>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center space-x-5">
            {/* Search Box */}
            <div className="relative max-w-xs hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-52 pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 transition-all focus:w-64"
              />
            </div>

            {/* Current Date */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{getFormattedDate()}</span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 overflow-y-auto bg-bg-page custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {activeWorkspace === "overview" && activeSubTab === "dashboard" && (
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
              {activeWorkspace === "content" && activeSubTab === "branch_access" && (
                <AdminBranchesTab isContentManager={false} userName={userName} />
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
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all group ${
        active
          ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
          : "text-slate-400 hover:text-white hover:bg-slate-800/40"
      } ${!isOpen ? "justify-center px-0 border-l-0" : "px-4"}`}
      title={!isOpen ? label : undefined}
    >
      <span className={`${active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"}`}>
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </span>
      <span className={`ml-3 transition-opacity ${!isOpen && "hidden"}`}>{label}</span>
    </button>
  );
}

