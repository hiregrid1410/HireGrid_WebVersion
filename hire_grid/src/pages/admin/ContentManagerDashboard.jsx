import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Trophy,
  GitMerge,
  FileSpreadsheet,
  Database,
  User,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  PlusCircle,
  TrendingUp,
  Calendar,
  Eye,
  SlidersHorizontal,
  Info,
  CheckCircle,
  FileText,
  RotateCcw,
  Award,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  GraduationCap,
  Layers,
  Edit,
  MoreVertical,
  Upload
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { lazy, Suspense } from "react";
const AdminCompaniesTab = lazy(() => import("../../components/admin/AdminCompaniesTab").then(m => ({ default: m.AdminCompaniesTab })));
const HierarchyBuilder = lazy(() => import("../../components/admin/HierarchyBuilder").then(m => ({ default: m.HierarchyBuilder })));
const AdminPlacementMissionTab = lazy(() => import("../../components/admin/AdminPlacementMissionTab").then(m => ({ default: m.AdminPlacementMissionTab })));
const AdminBranchesTab = lazy(() => import("../../components/admin/AdminBranchesTab").then(m => ({ default: m.AdminBranchesTab })));
const AdminRevisionModulesTab = lazy(() => import("../../components/admin/AdminRevisionModulesTab").then(m => ({ default: m.AdminRevisionModulesTab })));
const AdminModulesTab = lazy(() => import("../../components/admin/AdminModulesTab").then(m => ({ default: m.AdminModulesTab })));
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useTheme } from "../../ThemeContext";
import { api } from "../../lib/api";
import { showToast } from "../../components/common/Toast";
import { DashboardSkeleton } from "../../components/loading/Skeletons";
import { PlatformBadge } from "../../components/admin/PlatformSelector";

export default function ContentManagerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const savedUserStr = localStorage.getItem("user");
  let savedUser = null;
  try {
    savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }

  const role = location.state?.role || savedUser?.role;
  const userName = location.state?.name || savedUser?.name || "Content Manager";
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

  const [openCategories, setOpenCategories] = useState({
    content: true,
    tools: true,
  });

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Dashboard Stats State
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modules, setModules] = useState([]);
  const [exams, setExams] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [revisionModules, setRevisionModules] = useState([]);
  const [questionsCount, setQuestionsCount] = useState(11932);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("cmSidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Fetch Dashboard Stats
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

      const compList = compRes.companies || [];
      const branchList = branchRes.branches || [];
      const modList = modRes.modules || [];
      const examList = examRes.exams || [];
      const cycleList = cycleRes.cycles || [];
      const revList = revRes.revisionModules || revRes.modules || [];

      setCompanies(compList);
      setBranches(branchList);
      setModules(modList);
      setExams(examList);
      setCycles(cycleList);
      setRevisionModules(revList);
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

  // Filtered companies based on platform & search
  const displayedCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchSearch = !searchQuery || (c.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform = selectedPlatform === "all" || (c.platform || "both").toLowerCase() === selectedPlatform;
      return matchSearch && matchPlatform;
    });
  }, [companies, searchQuery, selectedPlatform]);

  // Filtered modules based on platform & search
  const displayedModules = useMemo(() => {
    return modules.filter(m => {
      const matchSearch = !searchQuery || (m.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform = selectedPlatform === "all" || (m.platform || "both").toLowerCase() === selectedPlatform;
      return matchSearch && matchPlatform;
    });
  }, [modules, searchQuery, selectedPlatform]);

  // Bar Chart Data for Content Overview (matching Image 2)
  const barChartData = [
    { name: "Companies", web: Math.round(companies.length * 0.4), app: Math.round(companies.length * 0.3), both: Math.round(companies.length * 0.3) },
    { name: "Modules", web: Math.round(modules.length * 0.35), app: Math.round(modules.length * 0.25), both: Math.round(modules.length * 0.4) },
    { name: "Questions", web: 4200, app: 3100, both: 4632 },
    { name: "Exams", web: Math.round(exams.length * 0.4), app: Math.round(exams.length * 0.3), both: Math.round(exams.length * 0.3) },
    { name: "Revisions", web: 15, app: 20, both: 40 },
    { name: "Missions", web: 5, app: 8, both: 12 }
  ];

  // Recent Content Activity feed (matching Image 2)
  const recentActivity = [
    { title: "New Module Added", desc: "Data Structures - Binary Trees", platform: "web", time: "2 hours ago" },
    { title: "Question Updated", desc: "Binary Search - Detailed Explanation", platform: "app", time: "4 hours ago" },
    { title: "New Exam Created", desc: "TCS NQT Full Test 2026", platform: "both", time: "6 hours ago" },
    { title: "Revision Content Added", desc: "Day 12 - Graphs (10 Questions)", platform: "both", time: "1 day ago" },
    { title: "Company Updated", desc: "Infosys - Syllabus Updated", platform: "both", time: "2 days ago" }
  ];

  const displayedActivity = useMemo(() => {
    return recentActivity.filter(act => {
      return selectedPlatform === "all" || (act.platform || "both").toLowerCase() === selectedPlatform;
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

  return (
    <div className="h-screen max-h-screen bg-bg-page font-sans text-slate-800 dark:text-slate-100 flex overflow-hidden w-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Matching Image 2 */}
      <aside
        className={`bg-[#0A1612] dark:bg-[#06100D] border-r border-slate-800/80 flex flex-col transition-all duration-300 z-50 shrink-0
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
                  className="h-7 w-auto max-w-[125px] object-contain"
                />
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0">
                  CM
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
              className="mx-auto p-1.5 hover:bg-slate-850 rounded-xl transition-all cursor-pointer flex items-center justify-center"
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
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            isOpen={sidebarOpen}
            isPrimary={true}
          />

          {/* Group 1: CONTENT MANAGEMENT */}
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
                  label="Hierarchy Builder"
                  active={activeTab === "learning"}
                  onClick={() => setActiveTab("learning")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Layers />}
                  label="Modules"
                  active={activeTab === "modules-manager"}
                  onClick={() => setActiveTab("modules-manager")}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<RotateCcw />}
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
            )}
          </div>

          {/* Group 2: TOOLS */}
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory("tools")}
              className={`w-full flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase tracking-wider px-3 mb-1 font-bold ${!sidebarOpen && "hidden"}`}
            >
              <span>TOOLS</span>
              {openCategories.tools ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openCategories.tools && (
              <div className="space-y-0.5">
                <SidebarItem
                  icon={<User />}
                  label="Profile & Account"
                  active={activeTab === "profile"}
                  onClick={() => setActiveTab("profile")}
                  isOpen={sidebarOpen}
                />
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#06100D]">
          <div className={`flex items-center ${!sidebarOpen ? "justify-center" : "px-2"} mb-3`}>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={`ml-2.5 ${!sidebarOpen && "hidden"}`}>
              <p className="text-xs font-bold text-white leading-tight truncate">{userName}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Content Creator</p>
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
        {/* Top Header - Matching Image 2 */}
        <header className="h-16 bg-white dark:bg-[#0C151A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-20 shadow-xs">
          {/* Left: Hamburger & Global Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search companies, modules, questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Center / Right: Platform Filter Pills & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Platform Filter Segmented Bar (Matching Image 2) */}
            <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSelectedPlatform("all")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedPlatform === "all"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All Platforms
              </button>
              <button
                onClick={() => setSelectedPlatform("web")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedPlatform === "web"
                    ? "bg-purple-600 text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Web Only
              </button>
              <button
                onClick={() => setSelectedPlatform("app")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedPlatform === "app"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                App Only
              </button>
              <button
                onClick={() => setSelectedPlatform("both")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedPlatform === "both"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Web + App
              </button>
            </div>

            <ThemeToggle />

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{userName}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Content Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#070D14] custom-scrollbar p-3 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Greeting & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Good Morning, Content Manager! 👋
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Create and manage high-quality content for better learning.
                    </p>
                  </div>
                  <button
                    onClick={fetchStats}
                    disabled={loadingStats}
                    className="self-start sm:self-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all cursor-pointer"
                    title="Refresh Stats"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin text-emerald-500" : ""}`} />
                  </button>
                </div>

                {/* Row 1: 6 Metric Stat Cards (Matching Image 2) */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  {/* Card 1: Total Companies */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-blue-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Companies
                      </span>
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedPlatform === "all" ? companies.length : displayedCompanies.length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+4 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Total Branches */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-rose-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Branches
                      </span>
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                        <GitMerge className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedPlatform === "all" ? branches.length : branches.filter(b => (b.platform || "both").toLowerCase() === selectedPlatform).length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+2 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Total Modules */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Modules
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedPlatform === "all" ? modules.length : displayedModules.length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+18 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Total Questions */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-teal-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Questions
                      </span>
                      <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {questionsCount.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+860 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Total Exams */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-purple-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Exams
                      </span>
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedPlatform === "all" ? exams.length : exams.filter(e => (e.platform || "both").toLowerCase() === selectedPlatform).length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+6 this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Revision Content */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Revision Content
                      </span>
                      <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedPlatform === "all" ? (revisionModules.length || 112) : revisionModules.filter(r => (r.platform || "both").toLowerCase() === selectedPlatform).length}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12 this month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Charts, Recent Activity & Quick Actions (Matching Image 2) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Content Overview Bar Chart (5 cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Content Overview
                        </h3>
                        <p className="text-xs text-slate-500">Distribution across platform targets</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Web</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>App</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Both</span>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#06100D",
                              borderColor: "#1E293B",
                              borderRadius: "12px",
                              fontSize: "12px"
                            }}
                          />
                          <Bar dataKey="web" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="app" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="both" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Middle Column: Recent Content Activity (4 cols) */}
                  <div className="lg:col-span-4 bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Recent Content Activity
                      </h3>
                      <button
                        onClick={() => setActiveTab("company-modules")}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {displayedActivity.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No recent activity for this platform.
                        </div>
                      ) : (
                        displayedActivity.map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {act.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {act.desc}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                            <PlatformBadge platform={act.platform} />
                            <span className="text-[10px] text-slate-400">{act.time}</span>
                          </div>
                        </div>
                      )))}
                    </div>
                  </div>

                  {/* Right Column: Hero Banner & Quick Actions (3 cols) */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Hero Action Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden">
                      <Sparkles className="w-16 h-16 absolute -right-2 -bottom-2 text-white/10 pointer-events-none" />
                      <h3 className="text-sm font-black flex items-center gap-1.5">
                        Create Amazing Content 🚀
                      </h3>
                      <p className="text-[11px] text-emerald-100 mt-1 leading-relaxed">
                        Add new modules, questions and exams for student success.
                      </p>
                      <button
                        onClick={() => setActiveTab("modules-manager")}
                        className="mt-3 w-full py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Module</span>
                      </button>
                    </div>

                    {/* Quick Actions 3x2 Grid */}
                    <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setActiveTab("company-modules")}
                          className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 text-xs font-bold flex flex-col items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span>Add Company</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("modules-manager")}
                          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 text-xs font-bold flex flex-col items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        >
                          <FolderOpen className="w-4 h-4 text-emerald-500" />
                          <span>Add Module</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("modules-manager")}
                          className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20 text-xs font-bold flex flex-col items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-purple-500" />
                          <span>Add Questions</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("company-modules")}
                          className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20 text-xs font-bold flex flex-col items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-rose-500" />
                          <span>Create Exam</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("revision-modules")}
                          className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-500/20 text-xs font-bold flex flex-col items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 text-cyan-500" />
                          <span>Revision Set</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("placement-missions")}
                          className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-500/20 text-xs font-bold flex flex-col items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        >
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span>New Mission</span>
                        </button>
                      </div>

                      {/* Bulk Upload Button */}
                      <button
                        onClick={() => setActiveTab("modules-manager")}
                        className="mt-2.5 w-full py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Bulk Upload (Excel)</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Manage Companies & Manage Modules Preview Tables (Matching Image 2 Bottom) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Manage Companies Table */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Manage Companies
                        </h3>
                        <p className="text-xs text-slate-500">Add, edit and manage company profiles</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("company-modules")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Company</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                            <th className="pb-2.5">Company</th>
                            <th className="pb-2.5">Platform</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {displayedCompanies.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                                No companies found for this platform.
                              </td>
                            </tr>
                          ) : (
                            displayedCompanies.slice(0, 5).map((comp) => (
                            <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5">
                                <p className="font-bold text-slate-900 dark:text-white">{comp.name}</p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{comp.description || "Company placement test"}</p>
                              </td>
                              <td className="py-2.5">
                                <PlatformBadge platform={comp.platform} />
                              </td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                  {comp.publicationStatus || "Active"}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => setActiveTab("company-modules")}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Manage Modules Table */}
                  <div className="bg-white dark:bg-[#101A18] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Manage Modules
                        </h3>
                        <p className="text-xs text-slate-500">Create and organize learning modules</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("modules-manager")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Module</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                            <th className="pb-2.5">Module Title</th>
                            <th className="pb-2.5">Platform</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {displayedModules.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                                No modules found for this platform.
                              </td>
                            </tr>
                          ) : (
                            displayedModules.slice(0, 5).map((mod) => (
                            <tr key={mod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                                {mod.title}
                              </td>
                              <td className="py-2.5">
                                <PlatformBadge platform={mod.platform} />
                              </td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                  {mod.publicationStatus || "Active"}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => setActiveTab("modules-manager")}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Active Workspaces */}
  <Suspense fallback={
    <div className="py-20 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading Workspace...</span>
    </div>
  }>
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
                <AdminRevisionModulesTab />
              </div>
            )}
  </Suspense>

            {activeTab === "profile" && (
              <div className="max-w-xl mx-auto bg-white dark:bg-[#101A18] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 animate-in fade-in duration-200 shadow-lg">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-2xl uppercase">
                    {userName.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{userName}</h2>
                    <p className="text-xs text-emerald-500 font-mono mt-0.5 font-bold">CONTENT CREATOR & MANAGER</p>
                    <p className="text-xs text-slate-400 mt-1">{userEmail}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Permissions:</span>
                    <span className="font-bold text-emerald-500">Modules, Questions, Hierarchy, Exams</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Access Scope:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Content Workspace Only</span>
                  </div>
                </div>
              </div>
            )}
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
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
            : "bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      } ${!isOpen ? "justify-center px-0" : ""}`}
      title={!isOpen ? label : undefined}
    >
      <span className={`${active ? (isPrimary ? "text-white" : "text-emerald-400") : "text-slate-400 group-hover:text-slate-200"}`}>
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </span>
      <span className={`ml-2.5 truncate ${!isOpen && "hidden"}`}>{label}</span>
    </button>
  );
}
