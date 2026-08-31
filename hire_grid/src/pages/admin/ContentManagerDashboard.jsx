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
  FileText
} from "lucide-react";
import { AdminCompaniesTab } from "../../components/admin/AdminCompaniesTab";
import { HierarchyBuilder } from "../../components/admin/HierarchyBuilder";
import { AdminPlacementMissionTab } from "../../components/admin/AdminPlacementMissionTab";
import { AdminBranchesTab } from "../../components/admin/AdminBranchesTab";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import DataTable from "../../components/common/DataTable";
import { useTheme } from "../../ThemeContext";
import { api } from "../../lib/api";
import { showToast } from "../../components/common/Toast";
import { DashboardSkeleton } from "../../components/loading/Skeletons";

export default function ContentManagerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Logo source matching current guidelines
  const logo = "/dark_logo.png";

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
  const [openCategories, setOpenCategories] = useState({
    main: true,
    tools: true,
    account: true
  });

  // Dashboard Stats State
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modules, setModules] = useState([]);
  const [exams, setExams] = useState([]);
  const [cycles, setCycles] = useState([]);
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
      const [compRes, branchRes, modRes, examRes, cycleRes] = await Promise.all([
        api.get("/companies").catch(() => ({ success: false, companies: [] })),
        api.get("/branches").catch(() => ({ success: false, branches: [] })),
        api.get("/modules").catch(() => ({ success: false, modules: [] })),
        api.get("/exams").catch(() => ({ success: false, exams: [] })),
        api.get("/placement-mission/content-manager/cycles").catch(() => ({ success: false, cycles: [] }))
      ]);

      if (compRes.success) setCompanies(compRes.companies || []);
      if (branchRes.success) setBranches(branchRes.branches || []);
      if (modRes.success) setModules(modRes.modules || []);
      if (examRes.success) setExams(examRes.exams || []);
      if (cycleRes.success) setCycles(cycleRes.cycles || []);
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

  if (role !== "content_manager") {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // SVG circular overview data
  const categoryStats = useMemo(() => {
    let technical = 0;
    let aptitude = 0;
    let coreEng = 0;
    let others = 0;

    modules.forEach((m) => {
      const cat = (m.category || "").toLowerCase();
      if (cat.includes("tech")) technical++;
      else if (cat.includes("apt")) aptitude++;
      else if (cat.includes("core") || cat.includes("eng")) coreEng++;
      else others++;
    });

    const total = technical + aptitude + coreEng + others || 1;
    return {
      technical,
      aptitude,
      coreEng,
      others,
      pctTech: ((technical / total) * 100).toFixed(1),
      pctApt: ((aptitude / total) * 100).toFixed(1),
      pctCore: ((coreEng / total) * 100).toFixed(1),
      pctOthers: ((others / total) * 100).toFixed(1),
      total: technical + aptitude + coreEng + others
    };
  }, [modules]);

  // Compute activity streams from SQL DB objects
  const activityStream = useMemo(() => {
    const list = [];
    companies.slice(0, 3).forEach((c) => {
      list.push({
        text: `New company "${c.name}" registered`,
        time: "Recently updated",
        icon: <BookOpen className="text-emerald-500 w-4 h-4" />
      });
    });
    modules.slice(0, 3).forEach((m) => {
      list.push({
        text: `Module "${m.title}" updated`,
        time: "Published",
        icon: <FolderOpen className="text-teal-400 w-4 h-4" />
      });
    });
    exams.slice(0, 2).forEach((e) => {
      list.push({
        text: `Assessment "${e.title}" published`,
        time: "Live on platform",
        icon: <FileText className="text-indigo-400 w-4 h-4" />
      });
    });
    return list.slice(0, 5);
  }, [companies, modules, exams]);

  // Question Bulk Import
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!rawJsonText.trim()) {
      showToast("Please enter a valid JSON array of questions.", "warning");
      return;
    }
    setIsImporting(true);
    try {
      const parsed = JSON.parse(rawJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed data must be a JSON Array.");
      }
      
      // Perform batch creation calling backend endpoints
      let count = 0;
      for (const q of parsed) {
        if (!q.question || !q.moduleId) continue;
        await api.post(`/modules/${q.moduleId}/questions`, {
          question: q.question,
          options: q.options || ["", "", "", ""],
          correctAnswerIndex: q.correctAnswerIndex ?? 0,
          difficulty: q.difficulty || "medium",
          explanation: q.explanation || "",
          status: q.status || "ACTIVE"
        });
        count++;
      }
      
      showToast(`Successfully imported ${count} questions!`, "success");
      setRawJsonText("");
    } catch (err) {
      showToast("JSON Validation Failed: " + err.message, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 font-sans text-slate-100 flex overflow-hidden w-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* left Sidebar */}
      <aside
        className={`bg-[#0B1F3A] border-r border-slate-800/80 flex flex-col transition-all duration-300 z-50 shrink-0
        fixed md:relative inset-y-0 left-0 h-full overflow-hidden
        ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 w-72 md:w-20"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-850 shrink-0">
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
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
          {/* Section: MAIN NAVIGATION */}
          <div className="space-y-1">
            {sidebarOpen && (
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold px-4 block mb-2">
                Main Navigation
              </span>
            )}
            <SidebarItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              isOpen={sidebarOpen}
            />
            <SidebarItem
              icon={<BookOpen />}
              label="Company Modules"
              active={activeTab === "company-modules"}
              onClick={() => setActiveTab("company-modules")}
              isOpen={sidebarOpen}
            />
            <SidebarItem
              icon={<FolderOpen />}
              label="Learning"
              active={activeTab === "learning"}
              onClick={() => setActiveTab("learning")}
              isOpen={sidebarOpen}
            />
            <SidebarItem
              icon={<Trophy />}
              label="Placement Missions"
              active={activeTab === "placement-missions"}
              onClick={() => setActiveTab("placement-missions")}
              isOpen={sidebarOpen}
            />
            <SidebarItem
              icon={<GitMerge />}
              label="Branches & Mappings"
              active={activeTab === "branches-mappings"}
              onClick={() => setActiveTab("branches-mappings")}
              isOpen={sidebarOpen}
            />
          </div>



          {/* Section: ACCOUNT */}
          <div className="space-y-1">
            {sidebarOpen && (
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold px-4 block mb-2">
                Account
              </span>
            )}
            <SidebarItem
              icon={<User />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
              isOpen={sidebarOpen}
            />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-850 shrink-0">
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
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-850 flex items-center justify-between px-8 shrink-0 relative z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-400">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 mr-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline">Content Portal</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:block" />
            <span className="font-semibold text-emerald-400 capitalize">
              Content Manager
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-white capitalize">
              {activeTab.replace("-", " ")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-5">
            {/* Current Date */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{getFormattedDate()}</span>
            </div>

            <ThemeToggle />

            {/* Profile Avatar */}
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
                {userName.slice(0, 2)}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-white leading-none">{userName}</p>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono tracking-widest leading-none">Content Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && (
              loadingStats ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      Welcome back, {userName}! <span className="text-xl">👋</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Here is what is happening with your content catalog.</p>
                  </div>
                  <DashboardSkeleton />
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Greeting */}
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      Welcome back, {userName}! <span className="text-xl">👋</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Here is what is happening with your content catalog.</p>
                  </div>

                  {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  <KPICard
                    title="Total Companies"
                    value={loadingStats ? "..." : companies.length}
                    subtitle="+ 1 this month"
                    color="border-l-4 border-l-emerald-500"
                    icon={<BookOpen className="text-emerald-400" />}
                  />
                  <KPICard
                    title="Total Branches"
                    value={loadingStats ? "..." : branches.length}
                    subtitle="+ 1 this month"
                    color="border-l-4 border-l-cyan-500"
                    icon={<GitMerge className="text-cyan-400" />}
                  />
                  <KPICard
                    title="Total Modules"
                    value={loadingStats ? "..." : modules.length}
                    subtitle="+ 12 this month"
                    color="border-l-4 border-l-purple-500"
                    icon={<FolderOpen className="text-purple-400" />}
                  />
                  <KPICard
                    title="Total Assessments"
                    value={loadingStats ? "..." : exams.length}
                    subtitle="+ 28 this month"
                    color="border-l-4 border-l-amber-500"
                    icon={<FileText className="text-amber-400" />}
                  />
                  <KPICard
                    title="Active Placements"
                    value={loadingStats ? "..." : cycles.filter(c => c.status === "active").length}
                    subtitle="cycles currently live"
                    color="border-l-4 border-l-rose-500"
                    icon={<Trophy className="text-rose-400" />}
                  />
                </div>

                {/* Content Distribution, Recent Activity, and Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Distribution & Activity */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* Donut Chart Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">
                          Content Overview
                        </h3>
                        <div className="flex items-center justify-center h-40">
                          <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
                            {/* Technical sector */}
                            <circle
                              cx="21"
                              cy="21"
                              r="15.915"
                              fill="transparent"
                              stroke="#10B981"
                              strokeWidth="4"
                              strokeDasharray={`${categoryStats.pctTech} ${100 - categoryStats.pctTech}`}
                              strokeDashoffset="0"
                            />
                            {/* Aptitude sector */}
                            <circle
                              cx="21"
                              cy="21"
                              r="15.915"
                              fill="transparent"
                              stroke="#06B6D4"
                              strokeWidth="4"
                              strokeDasharray={`${categoryStats.pctApt} ${100 - categoryStats.pctApt}`}
                              strokeDashoffset={-categoryStats.pctTech}
                            />
                            {/* Center circle */}
                            <circle cx="21" cy="21" r="12" fill="#0F172A" />
                            {/* Center Text */}
                            <g className="transform rotate-90 translate-x-[2px] translate-y-[-40px]">
                              <text x="21" y="20" textAnchor="middle" className="fill-white font-bold text-[6px]">
                                {categoryStats.total}
                              </text>
                              <text x="21" y="24" textAnchor="middle" className="fill-slate-500 text-[2.5px] uppercase font-semibold">
                                Total Modules
                              </text>
                            </g>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center space-y-4">
                        <LegendItem color="bg-emerald-500" label="Technical" count={categoryStats.technical} percentage={categoryStats.pctTech} />
                        <LegendItem color="bg-cyan-500" label="Aptitude" count={categoryStats.aptitude} percentage={categoryStats.pctApt} />
                        <LegendItem color="bg-purple-500" label="Core Engineering" count={categoryStats.coreEng} percentage={categoryStats.pctCore} />
                        <LegendItem color="bg-slate-500" label="Others" count={categoryStats.others} percentage={categoryStats.pctOthers} />
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
                        Recent Activity
                      </h3>
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {activityStream.map((activity, idx) => (
                            <li key={idx}>
                              <div className="relative pb-8">
                                {idx !== activityStream.length - 1 && (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                                )}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center">
                                      {activity.icon}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-slate-200">{activity.text}</p>
                                    </div>
                                    <div className="text-right text-xs whitespace-nowrap text-slate-500">
                                      <span>{activity.time}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quick Actions & Placement Summary */}
                  <div className="lg:col-span-4 space-y-8">
                    {/* Quick Actions Card */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        <QuickActionButton
                          label="Add Company"
                          onClick={() => setActiveTab("company-modules")}
                          icon={<PlusCircle className="w-4 h-4 text-emerald-400" />}
                        />
                        <QuickActionButton
                          label="Add Branch"
                          onClick={() => setActiveTab("learning")}
                          icon={<PlusCircle className="w-4 h-4 text-cyan-400" />}
                        />
                        <QuickActionButton
                          label="Create Module"
                          onClick={() => setActiveTab("learning")}
                          icon={<PlusCircle className="w-4 h-4 text-purple-400" />}
                        />
                        <QuickActionButton
                          label="Create Assessment"
                          onClick={() => setActiveTab("placement-missions")}
                          icon={<PlusCircle className="w-4 h-4 text-amber-400" />}
                        />
                      </div>
                    </div>

                    {/* Active Cycles Card */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                          Placement Mission
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                          {cycles.filter(c => c.status === "active").length} Running
                        </span>
                      </div>
                      <div className="space-y-4">
                        {cycles.length === 0 ? (
                          <p className="text-xs text-slate-500">No active cycles scheduled.</p>
                        ) : (
                          cycles.slice(0, 3).map((c, idx) => (
                            <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase">{c.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{c.start_date ? new Date(c.start_date).toLocaleDateString() : "TBD"}</p>
                              </div>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${c.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                                {c.status}
                              </span>
                            </div>
                          ))
                        )}
                        <button
                          onClick={() => setActiveTab("placement-missions")}
                          className="w-full text-center py-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-all"
                        >
                          View all placement cycles →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Preview Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Company Modules Preview</h3>
                    <button
                      onClick={() => setActiveTab("company-modules")}
                      className="text-xs font-bold text-emerald-400 hover:underline"
                    >
                      View all companies →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {companies.slice(0, 3).map((comp, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between h-44 shadow-sm">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-white text-sm">{comp.name}</span>
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {comp.publicationStatus || "Published"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{comp.description || "Practice resources for placement preparation."}</p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {modules.filter(m => m.parentId === comp.id).length} Modules
                          </span>
                          <button
                            onClick={() => setActiveTab("company-modules")}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch Overview Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Branch Overview</h3>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                            <th className="p-4 font-semibold">Branch Name</th>
                            <th className="p-4 font-semibold">Code</th>
                            <th className="p-4 font-semibold">Modules</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {branches.slice(0, 5).map((br, idx) => (
                            <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                              <td className="p-4 font-medium text-white">{br.name}</td>
                              <td className="p-4 text-slate-400 font-mono">{br.id.slice(0, 5).toUpperCase()}</td>
                              <td className="p-4 text-slate-400 font-mono">
                                {modules.filter(m => m.parentId === br.id).length} Modules
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                  Active
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setActiveTab("learning")}
                                  className="text-xs text-emerald-400 hover:underline font-bold"
                                >
                                  Manage Content
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === "company-modules" && (
              <div className="animate-in fade-in duration-300">
                <AdminCompaniesTab isContentManager={true} userName={userName} />
              </div>
            )}

            {activeTab === "learning" && (
              <div className="animate-in fade-in duration-300">
                <HierarchyBuilder isContentManager={true} userName={userName} />
              </div>
            )}

            {activeTab === "placement-missions" && (
              <div className="animate-in fade-in duration-300">
                <AdminPlacementMissionTab userName={userName} />
              </div>
            )}

            {activeTab === "branches-mappings" && (
              <div className="animate-in fade-in duration-300">
                <AdminBranchesTab isContentManager={true} userName={userName} />
              </div>
            )}



            {activeTab === "profile" && (
              <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 animate-in fade-in duration-300 shadow-lg">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl uppercase">
                    {userName.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">{userName}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono">ROLE: CONTENT MANAGER</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-800 border-t border-b border-slate-800">
                  <div className="py-4 flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Username</span>
                    <span className="text-white font-mono">{userName}</span>
                  </div>
                  <div className="py-4 flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Email Address</span>
                    <span className="text-white font-mono">{userEmail}</span>
                  </div>
                  <div className="py-4 flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">System Privilege</span>
                    <span className="text-emerald-400 font-bold font-mono">CONTENT_MANAGER_ACC</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Authentication session is controlled by the server JWT credentials. Local storage handles theme preference persistence.
                </div>
              </div>
            )}
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

function KPICard({ title, value, subtitle, color, icon }) {
  return (
    <div className={`bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm ${color}`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          {title}
        </span>
        <span className="h-6 w-6 rounded-lg bg-slate-950/60 flex items-center justify-center shrink-0">
          {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
        </span>
      </div>
      <div className="mt-2">
        <span className="text-xl font-bold text-white tracking-tight">{value}</span>
        <p className="text-[9px] text-slate-500 mt-1 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count, percentage }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center space-x-2">
        <span className={`h-2.5 w-2.5 rounded ${color}`} />
        <span className="text-slate-400 font-medium">{label}</span>
      </div>
      <div className="text-right font-mono">
        <span className="text-white font-bold">{count}</span>
        <span className="text-slate-500 ml-1">({percentage}%)</span>
      </div>
    </div>
  );
}

function QuickActionButton({ label, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all text-left text-xs font-semibold text-slate-300"
    >
      <span className="uppercase tracking-wider">{label}</span>
      {icon}
    </button>
  );
}
