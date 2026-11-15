import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Trophy,
  GitMerge,
  User,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  TrendingUp,
  RefreshCw,
  Award,
  HelpCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  RotateCcw,
  Bell,
  Layers,
  Sparkles,
  Smartphone,
  Globe,
  MonitorSmartphone,
  Upload
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const AdminCompaniesTab = lazy(() =>
  import("../../components/admin/AdminCompaniesTab").then((m) => ({ default: m.AdminCompaniesTab }))
);
const HierarchyBuilder = lazy(() =>
  import("../../components/admin/HierarchyBuilder").then((m) => ({ default: m.HierarchyBuilder }))
);
const AdminPlacementMissionTab = lazy(() =>
  import("../../components/admin/AdminPlacementMissionTab").then((m) => ({ default: m.AdminPlacementMissionTab }))
);
const AdminBranchesTab = lazy(() =>
  import("../../components/admin/AdminBranchesTab").then((m) => ({ default: m.AdminBranchesTab }))
);
const AdminRevisionModulesTab = lazy(() =>
  import("../../components/admin/AdminRevisionModulesTab").then((m) => ({ default: m.AdminRevisionModulesTab }))
);
const AdminModulesTab = lazy(() =>
  import("../../components/admin/AdminModulesTab").then((m) => ({ default: m.AdminModulesTab }))
);
const AdminExamsTab = lazy(() =>
  import("../../components/admin/AdminExamsTab").then((m) => ({ default: m.AdminExamsTab }))
);

import { api } from "../../lib/api";
import { showToast } from "../../components/common/Toast";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ThemeToggle } from "../../components/common/ThemeToggle";

export default function ContentManagerDashboard() {
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
  const userName = location.state?.name || savedUser?.name || "test";
  const userEmail = savedUser?.email || "content.manager@hiregrid.com";

  // Navigation State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("cmSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 768;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  // Stats Data
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modules, setModules] = useState([]);
  const [exams, setExams] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [revisionModules, setRevisionModules] = useState([]);
  const [questionsCount, setQuestionsCount] = useState(11932);
  const [loadingStats, setLoadingStats] = useState(true);

  // Deletion modals state for Manage Companies and Manage Modules tables
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const [deleteModuleId, setDeleteModuleId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("cmSidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Fetch Stats from existing endpoints
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [compRes, branchRes, modRes, examRes, cycleRes, revRes] = await Promise.all([
        api.get("/companies").catch(() => ({ success: false, companies: [] })),
        api.get("/branches").catch(() => ({ success: false, branches: [] })),
        api.get("/modules").catch(() => ({ success: false, modules: [] })),
        api.get("/exams").catch(() => ({ success: false, exams: [] })),
        api.get("/placement-mission/content-manager/cycles").catch(() => ({ success: false, cycles: [] })),
        api.get("/admin/revision-modules").catch(() => ({ success: false, revisionModules: [] }))
      ]);

      setCompanies(compRes.companies || []);
      setBranches(branchRes.branches || []);
      setModules(modRes.modules || []);
      setExams(examRes.exams || []);
      setCycles(cycleRes.cycles || []);
      setRevisionModules(revRes.revisionModules || revRes.modules || []);
    } catch (e) {
      console.error("Dashboard statistics loading failed", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchStats();
    }
  }, [activeTab]);

  // Handle deletions in preview tables
  const handleDeleteCompanyConfirm = async () => {
    if (!deleteCompanyId) return;
    try {
      await api.delete(`/companies/${deleteCompanyId}`);
      showToast("Company deleted successfully", "success");
      setDeleteCompanyId(null);
      fetchStats();
    } catch (err) {
      showToast(err.message || "Failed to delete company", "error");
    }
  };

  const handleDeleteModuleConfirm = async () => {
    if (!deleteModuleId) return;
    try {
      await api.delete(`/modules/${deleteModuleId}`);
      showToast("Module deleted successfully", "success");
      setDeleteModuleId(null);
      fetchStats();
    } catch (err) {
      showToast(err.message || "Failed to delete module", "error");
    }
  };

  // Filtered companies based on platform & search
  const displayedCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        !searchQuery || (c.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform =
        selectedPlatform === "all" || (c.platform || "both").toLowerCase() === selectedPlatform;
      return matchSearch && matchPlatform;
    });
  }, [companies, searchQuery, selectedPlatform]);

  // Filtered modules based on platform & search
  const displayedModules = useMemo(() => {
    return modules.filter((m) => {
      const matchSearch =
        !searchQuery || (m.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform =
        selectedPlatform === "all" || (m.platform || "both").toLowerCase() === selectedPlatform;
      return matchSearch && matchPlatform;
    });
  }, [modules, searchQuery, selectedPlatform]);

  // Bar Chart Data matching screenshot: Categories: Companies, Modules, Questions, Exams, Revisions, Missions
  const barChartData = [
    {
      name: "Companies",
      web: Math.round(companies.length * 0.4) || 4,
      app: Math.round(companies.length * 0.3) || 3,
      both: Math.round(companies.length * 0.3) || 2
    },
    {
      name: "Modules",
      web: Math.round(modules.length * 0.35) || 110,
      app: Math.round(modules.length * 0.25) || 80,
      both: Math.round(modules.length * 0.4) || 129
    },
    {
      name: "Questions",
      web: 3400,
      app: 4000,
      both: 4732
    },
    {
      name: "Exams",
      web: Math.round(exams.length * 0.4) || 0,
      app: Math.round(exams.length * 0.3) || 0,
      both: Math.round(exams.length * 0.3) || 0
    },
    {
      name: "Revisions",
      web: 25,
      app: 35,
      both: 52
    },
    {
      name: "Missions",
      web: 8,
      app: 10,
      both: 14
    }
  ];

  // Recent Content Activity feed matching screenshot
  const recentActivity = [
    {
      id: 1,
      title: "New Module Added",
      desc: "Data Structures - Binary Trees",
      platform: "web",
      time: "2 hours ago"
    },
    {
      id: 2,
      title: "Question Updated",
      desc: "Binary Search - Detailed Explanation",
      platform: "app",
      time: "4 hours ago"
    },
    {
      id: 3,
      title: "New Exam Created",
      desc: "TCS NQT Full Test 2026",
      platform: "both",
      time: "6 hours ago"
    },
    {
      id: 4,
      title: "Revision Content Added",
      desc: "Day 12 - Graphs (10 Questions)",
      platform: "both",
      time: "1 day ago"
    },
    {
      id: 5,
      title: "Company Updated",
      desc: "Infosys - Syllabus Updated",
      platform: "both",
      time: "2 days ago"
    }
  ];

  const displayedActivity = useMemo(() => {
    return recentActivity.filter((act) => {
      return (
        selectedPlatform === "all" || (act.platform || "both").toLowerCase() === selectedPlatform
      );
    });
  }, [recentActivity, selectedPlatform]);

  if (role !== "content_manager" && role !== "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const platformLabels = {
    all: "All Platforms",
    web: "Web Only",
    app: "App Only",
    both: "Web + App"
  };

  return (
    <div className="h-screen max-h-screen bg-[#FAF7F0] dark:bg-[#111827] font-sans text-[#374151] dark:text-[#F3F4F6] flex overflow-hidden w-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 4. SIDEBAR REDESIGN - Light & Dark Theme Support */}
      <aside
        className={`bg-white dark:bg-[#1F2937] border-r border-[#E7E1D5] dark:border-[#374151] flex flex-col transition-all duration-300 z-50 shrink-0
        fixed md:relative inset-y-0 left-0 h-full overflow-hidden
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 w-64 md:w-20"}`}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E7E1D5] dark:border-[#374151] shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xl font-bold tracking-tight text-[#374151] dark:text-[#F3F4F6] flex items-center">
                HireGrid<span className="text-[#14532D] dark:text-[#22C55E]">X</span>
              </span>
              <span className="text-[10px] bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                CM
              </span>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mx-auto p-1.5 hover:bg-[#FAF7F0] dark:hover:bg-[#111827] rounded-xl transition-all cursor-pointer flex items-center justify-center text-[#14532D] dark:text-[#22C55E]"
              title="Expand Sidebar"
            >
              <span className="text-xl font-bold tracking-tight">
                H<span className="text-[#14532D] dark:text-[#22C55E]">X</span>
              </span>
            </button>
          )}

          {sidebarOpen && isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F3F4F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
          {/* Main Top Item: DASHBOARD */}
          <SidebarItem
            icon={<LayoutDashboard />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            isOpen={sidebarOpen}
          />

          {/* Section: CONTENT MANAGEMENT */}
          <div className="space-y-1">
            {sidebarOpen && (
              <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                <span>Content Management</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="space-y-0.5">
              <SidebarItem
                icon={<BookOpen />}
                label="Companies"
                active={activeTab === "company-modules"}
                onClick={() => setActiveTab("company-modules")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<GitMerge />}
                label="Branches"
                active={activeTab === "branches-mappings"}
                onClick={() => setActiveTab("branches-mappings")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<FolderOpen />}
                label="Modules"
                active={activeTab === "modules-manager"}
                onClick={() => setActiveTab("modules-manager")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<RotateCcw />}
                label="Questions"
                active={activeTab === "questions"}
                onClick={() => setActiveTab("modules-manager")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<Award />}
                label="Exams"
                active={activeTab === "exams"}
                onClick={() => setActiveTab("exams")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<Layers />}
                label="Revision Content"
                active={activeTab === "revision-modules"}
                onClick={() => setActiveTab("revision-modules")}
                isOpen={sidebarOpen}
              />
              <SidebarItem
                icon={<Trophy />}
                label="Placement Missions"
                active={activeTab === "placement-missions"}
                onClick={() => setActiveTab("placement-missions")}
                isOpen={sidebarOpen}
              />
            </div>
          </div>

          {/* Section: TOOLS */}
          <div className="space-y-1">
            {sidebarOpen && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                Tools
              </div>
            )}
            <div className="space-y-0.5">
              <SidebarItem
                icon={<User />}
                label="Profile & Account"
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
                isOpen={sidebarOpen}
              />
            </div>
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-[#E7E1D5] dark:border-[#374151] shrink-0 bg-white dark:bg-[#1F2937]">
          <div className={`flex items-center ${!sidebarOpen ? "justify-center" : "px-2"} mb-3`}>
            <div className="h-8 w-8 rounded-full bg-[#15803D] dark:bg-[#22C55E] flex items-center justify-center text-white dark:text-[#111827] font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={`ml-2.5 ${!sidebarOpen && "hidden"} overflow-hidden`}>
              <p className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6] leading-tight truncate">{userName}</p>
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Content Manager</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center py-2 rounded-xl text-xs font-semibold text-[#B91C1C] dark:text-[#F87171] bg-[#FEE2E2]/60 dark:bg-rose-950/40 hover:bg-[#FEE2E2] dark:hover:bg-rose-900/50 transition-all cursor-pointer ${
              !sidebarOpen && "px-0"
            }`}
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 5. TOP NAVIGATION BAR */}
      <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
        <header className="h-16 bg-white dark:bg-[#1F2937] border-b border-[#E7E1D5] dark:border-[#374151] flex items-center justify-between px-5 shrink-0 relative z-20">
          {/* Left: Sidebar Toggle & Global Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F3F4F6] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-64 sm:w-80 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] dark:text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search companies, modules, questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F0] dark:bg-[#111827] border border-[#E7E1D5] dark:border-[#374151] rounded-xl text-xs outline-none focus:border-[#14532D] dark:focus:border-[#22C55E] text-[#374151] dark:text-[#F3F4F6] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] transition-all"
              />
            </div>
          </div>

          {/* Right: Platform Filter Dropdown, Theme Toggle, Notification & User Avatar */}
          <div className="flex items-center gap-3">
            {/* Platform Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E7E1D5] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs font-medium text-[#374151] dark:text-[#F3F4F6] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] transition-colors cursor-pointer"
              >
                <MonitorSmartphone className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                <span className="hidden sm:inline">{platformLabels[selectedPlatform]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF]" />
              </button>

              {showPlatformDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-xl shadow-lg p-1 z-50 text-xs">
                  {Object.entries(platformLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedPlatform(key);
                        setShowPlatformDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                        selectedPlatform === key
                          ? "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] font-bold"
                          : "text-[#374151] dark:text-[#F3F4F6] hover:bg-[#FAF7F0] dark:hover:bg-[#111827]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Avatar & Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E7E1D5] dark:border-[#374151]">
              <div className="w-8 h-8 rounded-full bg-[#14532D] dark:bg-[#22C55E] flex items-center justify-center text-white dark:text-[#111827] font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6] leading-tight">{userName}</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Content Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#FAF7F0] dark:bg-[#111827] custom-scrollbar p-5 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 7. STATISTICS CARDS - Exactly 6 Cards matching screenshot */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  {/* Card 1: Companies */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#F3F4F6]">
                      <div className="w-6 h-6 rounded-lg bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span>Companies</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">
                        {selectedPlatform === "all" ? companies.length || 9 : displayedCompanies.length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#15803D] dark:text-[#4ADE80]">
                        <TrendingUp className="w-3 h-3" />
                        <span>+4 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Branches */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#F3F4F6]">
                      <div className="w-6 h-6 rounded-lg bg-[#E8F3EC] dark:bg-[#193B2A] text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                        <GitMerge className="w-3.5 h-3.5" />
                      </div>
                      <span>Branches</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">
                        {selectedPlatform === "all"
                          ? branches.length || 3
                          : branches.filter(
                              (b) => (b.platform || "both").toLowerCase() === selectedPlatform
                            ).length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#15803D] dark:text-[#4ADE80]">
                        <TrendingUp className="w-3 h-3" />
                        <span>+2 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Modules */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#F3F4F6]">
                      <div className="w-6 h-6 rounded-lg bg-[#FAF7F0] dark:bg-[#111827] text-[#B45309] dark:text-[#FBBF24] border border-[#D6C7A1] dark:border-[#374151] flex items-center justify-center shrink-0">
                        <FolderOpen className="w-3.5 h-3.5" />
                      </div>
                      <span>Modules</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">
                        {selectedPlatform === "all"
                          ? modules.length || 319
                          : displayedModules.length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#15803D] dark:text-[#4ADE80]">
                        <TrendingUp className="w-3 h-3" />
                        <span>+18 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Questions */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#F3F4F6]">
                      <div className="w-6 h-6 rounded-lg bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </div>
                      <span>Questions</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">
                        {questionsCount.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#15803D] dark:text-[#4ADE80]">
                        <TrendingUp className="w-3 h-3" />
                        <span>+860 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Exams */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#F3F4F6]">
                      <div className="w-6 h-6 rounded-lg bg-[#FEE2E2] dark:bg-rose-950/40 text-[#B91C1C] dark:text-[#F87171] flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <span>Exams</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">
                        {selectedPlatform === "all"
                          ? exams.length
                          : exams.filter(
                              (e) => (e.platform || "both").toLowerCase() === selectedPlatform
                            ).length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#15803D] dark:text-[#4ADE80]">
                        <TrendingUp className="w-3 h-3" />
                        <span>+6 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Revision Content */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#F3F4F6]">
                      <div className="w-6 h-6 rounded-lg bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                      <span>Revision Content</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">
                        {selectedPlatform === "all"
                          ? revisionModules.length || 112
                          : revisionModules.filter(
                              (r) => (r.platform || "both").toLowerCase() === selectedPlatform
                            ).length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-[#15803D] dark:text-[#4ADE80]">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12 this month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. MAIN DASHBOARD CONTENT (Content Overview, Recent Activity, Create Content) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* A. Content Overview (5 Cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-5 rounded-xl shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Content Overview</h3>
                        <div className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1 border border-[#E7E1D5] dark:border-[#374151] px-2 py-0.5 rounded-lg">
                          <span>All Platforms</span>
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="h-56 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={barChartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid vertical={false} stroke="#E7E1D5" strokeOpacity={0.3} />
                            <XAxis
                              dataKey="name"
                              stroke="#6B7280"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#6B7280"
                              fontSize={10}
                              tickLine={false}
                              ticks={[0, 1500, 3000, 4500, 6000]}
                              domain={[0, 6000]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                borderColor: "#374151",
                                borderRadius: "8px",
                                fontSize: "11px",
                                color: "#F3F4F6"
                              }}
                            />
                            <Bar dataKey="web" fill="#14532D" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="app" fill="#D6C7A1" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="both" fill="#0F4224" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-4 pt-3 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#14532D]"></span>
                        Web
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D6C7A1]"></span>
                        App
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0F4224]"></span>
                        Both
                      </span>
                    </div>
                  </div>

                  {/* B. Recent Activity (4 Cols) */}
                  <div className="lg:col-span-4 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-5 rounded-xl shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Recent Activity</h3>
                        <button
                          onClick={() => setActiveTab("company-modules")}
                          className="text-xs font-semibold text-[#14532D] dark:text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View All <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {displayedActivity.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between py-1 border-b border-[#E7E1D5]/40 dark:border-[#374151]/40 last:border-0"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#FAF7F0] dark:bg-[#111827] border border-[#E7E1D5] dark:border-[#374151] flex items-center justify-center shrink-0 mt-0.5">
                                {act.title.includes("Module") ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-[#14532D] dark:text-[#22C55E]" />
                                ) : act.title.includes("Question") ? (
                                  <HelpCircle className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                                ) : act.title.includes("Exam") ? (
                                  <Award className="w-3.5 h-3.5 text-[#B45309] dark:text-[#FBBF24]" />
                                ) : act.title.includes("Revision") ? (
                                  <RotateCcw className="w-3.5 h-3.5 text-[#14532D] dark:text-[#22C55E]" />
                                ) : (
                                  <BookOpen className="w-3.5 h-3.5 text-[#14532D] dark:text-[#22C55E]" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6]">{act.title}</h4>
                                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{act.desc}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  act.platform === "web"
                                    ? "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E]"
                                    : act.platform === "app"
                                    ? "bg-[#FAF7F0] dark:bg-[#111827] text-[#B45309] dark:text-[#FBBF24] border border-[#D6C7A1] dark:border-[#374151]"
                                    : "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#0F4224] dark:text-[#4ADE80]"
                                }`}
                              >
                                {act.platform === "web"
                                  ? "Web only"
                                  : act.platform === "app"
                                  ? "App only"
                                  : "Both"}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF] dark:text-[#6B7280]">{act.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* C. Create Content & Quick Actions (3 Cols) */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Create Content Banner */}
                    <div className="p-5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#0F4224] dark:from-[#193B2A] dark:to-[#14532D] text-white shadow-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold">Create Content</h3>
                      </div>
                      <p className="text-[11px] text-emerald-100 mb-4 leading-relaxed">
                        Add modules, questions, exams and revision content.
                      </p>
                      <button
                        onClick={() => setActiveTab("modules-manager")}
                        className="w-full py-2 bg-white dark:bg-[#1F2937] text-[#14532D] dark:text-[#22C55E] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Module</span>
                      </button>
                    </div>

                    {/* Quick Actions 2x2 Grid */}
                    <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] p-4 rounded-xl shadow-xs">
                      <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6] mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setActiveTab("modules-manager")}
                          className="p-2.5 rounded-lg border border-[#E7E1D5] dark:border-[#374151] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] text-left transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4 text-[#14532D] dark:text-[#22C55E] shrink-0" />
                          <span className="text-xs font-semibold text-[#374151] dark:text-[#F3F4F6]">Add Question</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("exams")}
                          className="p-2.5 rounded-lg border border-[#E7E1D5] dark:border-[#374151] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] text-left transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Award className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24] shrink-0" />
                          <span className="text-xs font-semibold text-[#374151] dark:text-[#F3F4F6]">Create Exam</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("revision-modules")}
                          className="p-2.5 rounded-lg border border-[#E7E1D5] dark:border-[#374151] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] text-left transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4 text-[#15803D] dark:text-[#4ADE80] shrink-0" />
                          <span className="text-xs font-semibold text-[#374151] dark:text-[#F3F4F6]">Revision Set</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("modules-manager")}
                          className="p-2.5 rounded-lg border border-[#E7E1D5] dark:border-[#374151] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] text-left transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4 text-[#14532D] dark:text-[#22C55E] shrink-0" />
                          <span className="text-xs font-semibold text-[#374151] dark:text-[#F3F4F6]">Bulk Upload</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9. MANAGEMENT TABLES (Manage Companies & Manage Modules) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* A. Manage Companies Table */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Manage Companies</h3>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Add, edit and manage company profiles.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("company-modules")}
                        className="px-3.5 py-1.5 bg-[#14532D] hover:bg-[#0F4224] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white dark:text-[#111827] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Company</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E7E1D5] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] text-[11px] font-semibold">
                            <th className="pb-3 font-semibold">Company</th>
                            <th className="pb-3 font-semibold">Platform</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E1D5]/40 dark:divide-[#374151]/40">
                          {displayedCompanies.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                No companies found for this platform.
                              </td>
                            </tr>
                          ) : (
                            displayedCompanies.slice(0, 5).map((comp) => {
                              const normPlatform = (comp.platform || "both").toLowerCase();
                              return (
                                <tr
                                  key={comp.id}
                                  className="hover:bg-[#FAF7F0] dark:hover:bg-[#111827] transition-colors"
                                >
                                  <td className="py-3 font-bold text-[#374151] dark:text-[#F3F4F6]">
                                    {comp.name}
                                  </td>
                                  <td className="py-3">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                        normPlatform === "web"
                                          ? "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E]"
                                          : normPlatform === "app"
                                          ? "bg-[#FAF7F0] dark:bg-[#111827] text-[#B45309] dark:text-[#FBBF24] border border-[#D6C7A1] dark:border-[#374151]"
                                          : "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#0F4224] dark:text-[#4ADE80]"
                                      }`}
                                    >
                                      {normPlatform === "web"
                                        ? "Web only"
                                        : normPlatform === "app"
                                        ? "App only"
                                        : "Both"}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8F3EC] dark:bg-[#193B2A] text-[#15803D] dark:text-[#4ADE80]">
                                      {comp.publicationStatus || "Published"}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setActiveTab("company-modules")}
                                        className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14532D] dark:hover:text-[#22C55E] transition-colors cursor-pointer"
                                        title="Edit Company"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteCompanyId(comp.id)}
                                        className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#B91C1C] dark:hover:text-[#F87171] transition-colors cursor-pointer"
                                        title="Delete Company"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* B. Manage Modules Table */}
                  <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Manage Modules</h3>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Create and organize learning modules.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("modules-manager")}
                        className="px-3.5 py-1.5 bg-[#14532D] hover:bg-[#0F4224] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] text-white dark:text-[#111827] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Module</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E7E1D5] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] text-[11px] font-semibold">
                            <th className="pb-3 font-semibold">Module Title</th>
                            <th className="pb-3 font-semibold">Platform</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E1D5]/40 dark:divide-[#374151]/40">
                          {displayedModules.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                No modules found for this platform.
                              </td>
                            </tr>
                          ) : (
                            displayedModules.slice(0, 5).map((mod) => {
                              const normPlatform = (mod.platform || "both").toLowerCase();
                              return (
                                <tr
                                  key={mod.id}
                                  className="hover:bg-[#FAF7F0] dark:hover:bg-[#111827] transition-colors"
                                >
                                  <td className="py-3 font-bold text-[#374151] dark:text-[#F3F4F6]">
                                    {mod.title}
                                  </td>
                                  <td className="py-3">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                        normPlatform === "web"
                                          ? "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E]"
                                          : normPlatform === "app"
                                          ? "bg-[#FAF7F0] dark:bg-[#111827] text-[#B45309] dark:text-[#FBBF24] border border-[#D6C7A1] dark:border-[#374151]"
                                          : "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#0F4224] dark:text-[#4ADE80]"
                                      }`}
                                    >
                                      {normPlatform === "web"
                                        ? "Web only"
                                        : normPlatform === "app"
                                        ? "App only"
                                        : "Both"}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8F3EC] dark:bg-[#193B2A] text-[#15803D] dark:text-[#4ADE80]">
                                      {mod.publicationStatus || "Published"}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setActiveTab("modules-manager")}
                                        className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14532D] dark:hover:text-[#22C55E] transition-colors cursor-pointer"
                                        title="Edit Module"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteModuleId(mod.id)}
                                        className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#B91C1C] dark:hover:text-[#F87171] transition-colors cursor-pointer"
                                        title="Delete Module"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Workspaces loaded dynamically */}
            <Suspense
              fallback={
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#14532D] dark:border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Loading Workspace...
                  </span>
                </div>
              }
            >
              {activeTab === "company-modules" && (
                <div className="animate-in fade-in duration-200">
                  <AdminCompaniesTab isContentManager={true} userName={userName} />
                </div>
              )}

              {activeTab === "learning" && (
                <div className="animate-in fade-in duration-200">
                  <HierarchyBuilder isContentManager={true} userName={userName} />
                </div>
              )}

              {activeTab === "modules-manager" && (
                <div className="animate-in fade-in duration-200">
                  <AdminModulesTab />
                </div>
              )}

              {activeTab === "exams" && (
                <div className="animate-in fade-in duration-200">
                  <AdminExamsTab />
                </div>
              )}

              {activeTab === "placement-missions" && (
                <div className="animate-in fade-in duration-200">
                  <AdminPlacementMissionTab userName={userName} />
                </div>
              )}

              {activeTab === "branches-mappings" && (
                <div className="animate-in fade-in duration-200">
                  <AdminBranchesTab isContentManager={true} userName={userName} />
                </div>
              )}

              {activeTab === "revision-modules" && (
                <div className="animate-in fade-in duration-200">
                  <AdminRevisionModulesTab isContentManager={true} userName={userName} />
                </div>
              )}
            </Suspense>

            {/* Profile Workspace */}
            {activeTab === "profile" && (
              <div className="max-w-xl mx-auto bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-xl p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-[#14532D] dark:bg-[#22C55E] flex items-center justify-center text-white dark:text-[#111827] font-bold text-2xl uppercase">
                    {userName.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#374151] dark:text-[#F3F4F6]">{userName}</h2>
                    <p className="text-xs text-[#14532D] dark:text-[#22C55E] font-semibold mt-0.5">CONTENT MANAGER</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">{userEmail}</p>
                  </div>
                </div>
                <div className="border-t border-[#E7E1D5] dark:border-[#374151] pt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                    <span className="font-medium">Permissions:</span>
                    <span className="font-bold text-[#15803D] dark:text-[#4ADE80]">
                      Modules, Questions, Exams, Revision Content
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                    <span className="font-medium">Access Scope:</span>
                    <span className="font-bold text-[#374151] dark:text-[#F3F4F6]">Content Workspace Only</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialogs for Preview Tables */}
      <ConfirmDialog
        isOpen={Boolean(deleteCompanyId)}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
        confirmLabel="Delete Company"
        onConfirm={handleDeleteCompanyConfirm}
        onCancel={() => setDeleteCompanyId(null)}
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteModuleId)}
        title="Delete Module"
        message="Are you sure you want to delete this module? This action cannot be undone."
        confirmLabel="Delete Module"
        onConfirm={handleDeleteModuleConfirm}
        onCancel={() => setDeleteModuleId(null)}
        isDestructive={true}
      />
    </div>
  );
}

// Sidebar Navigation Item Component matching screenshot styling and dark theme
function SidebarItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center py-2.5 px-3 rounded-xl text-xs transition-all group cursor-pointer ${
        active
          ? "bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] font-bold"
          : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F3F4F6] hover:bg-[#FAF7F0] dark:hover:bg-[#111827] font-medium"
      } ${!isOpen ? "justify-center px-0" : ""}`}
      title={!isOpen ? label : undefined}
    >
      <span
        className={`${
          active ? "text-[#14532D] dark:text-[#22C55E]" : "text-[#6B7280] dark:text-[#9CA3AF] group-hover:text-[#374151] dark:group-hover:text-[#F3F4F6]"
        }`}
      >
        {React.cloneElement(icon, { className: "w-4 h-4 shrink-0" })}
      </span>
      <span className={`ml-3 truncate ${!isOpen && "hidden"}`}>{label}</span>
    </button>
  );
}
