import React, { useState } from "react";
import {
  Layout,
  BookOpen,
  Building2,
  Award,
  Zap,
  Star,
  Flame,
  ArrowRight,
  Play,
  CheckCircle2,
  CheckCircle,
  Circle,
  FileText,
  Timer,
  ChevronRight,
  Trophy,
  Sparkles,
  Target,
  BarChart3,
  Check,
  Clock,
  Lock,
  ExternalLink,
  ChevronLeft,
  GraduationCap,
  Layers,
  Crown,
  RotateCcw
} from "lucide-react";

export function StudentDashboardView({
  user,
  stats,
  medalInfo,
  modules = [],
  moduleScores = {},
  companies = [],
  activeBranches = [],
  placementMissions = [],
  leaderboard = [],
  onTabChange,
  onStartModule,
}) {
  const [selectedCompanyCategory, setSelectedCompanyCategory] = useState("all");
  const [todayGoals, setTodayGoals] = useState([
    { id: 1, text: "Solve 20 Aptitude Questions", completed: true },
    { id: 2, text: "Complete 1 Mock Test", completed: true },
    { id: 3, text: "Revise weak topics", completed: false },
    { id: 4, text: "Take 1 Practice Assessment", completed: false },
    { id: 5, text: "Maintain study streak", completed: true }
  ]);

  const toggleGoal = (id) => {
    setTodayGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const completedGoalsCount = todayGoals.filter(g => g.completed).length;
  const goalProgress = Math.round((completedGoalsCount / todayGoals.length) * 100);

  // Student metrics
  const testsAttempted = Object.keys(moduleScores).length;
  const scoreValues = Object.values(moduleScores);
  const averageScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length)
    : 78;

  const xpEarned = stats?.xp || user?.xp || 4560;
  const streakCount = stats?.streak || 12;

  // Rank
  const userRankEntry = leaderboard.find(
    (item) => item.userId === user?.id || item.userEmail === user?.email
  );
  const userRank = userRankEntry ? `#${userRankEntry.rank}` : "#342";

  // Filter companies
  const displayedCompanies = companies.slice(0, 8);

  // Core Subjects list
  const subjects = [
    { id: "dsa", name: "Data Structures", modules: "45 Modules", progress: 75, color: "text-blue-500", stroke: "#3B82F6" },
    { id: "algo", name: "Algorithms", modules: "38 Modules", progress: 60, color: "text-rose-500", stroke: "#F43F5E" },
    { id: "os", name: "Operating Systems", modules: "28 Modules", progress: 40, color: "text-purple-500", stroke: "#A855F7" },
    { id: "dbms", name: "DBMS", modules: "26 Modules", progress: 55, color: "text-amber-500", stroke: "#F59E0B" },
    { id: "cn", name: "Computer Networks", modules: "22 Modules", progress: 35, color: "text-indigo-500", stroke: "#6366F1" },
    { id: "apt", name: "Aptitude", modules: "50 Modules", progress: 80, color: "text-emerald-500", stroke: "#10B981" },
    { id: "lr", name: "Logical Reasoning", modules: "30 Modules", progress: 65, color: "text-fuchsia-500", stroke: "#D946EF" },
    { id: "va", name: "Verbal Ability", modules: "25 Modules", progress: 70, color: "text-teal-500", stroke: "#14B8A6" },
  ];

  // Upcoming Exams
  const upcomingExams = modules.filter(m => m.moduleType === "exam" || m.moduleType === "company").slice(0, 3);

  // Recent test history
  const recentTests = Object.entries(moduleScores).slice(0, 5).map(([modId, score], index) => {
    const mod = modules.find(m => m.id === modId);
    return {
      id: modId,
      name: mod?.title || `Assessment ${index + 1}`,
      company: mod?.parentId || "General Practice",
      score: `${score}%`,
      rank: `#${index + 120}`,
      date: "Recent",
      mod
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Hero Banner with Real Metrics & 3D Illustration ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Hero Card (9 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#101935] via-[#162248] to-[#1A2855] border border-blue-500/20 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Good Morning, {user?.name?.split(" ")[0] || "Student"}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 mt-1 max-w-xl">
              Keep learning, practice consistently and achieve your dream placement.
            </p>

            {/* Stat Cards Row on Hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black">{testsAttempted || 42}</div>
                <div className="text-[11px] text-blue-200/80 font-medium">Tests Taken</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <Target className="w-4 h-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black">{averageScore}%</div>
                <div className="text-[11px] text-blue-200/80 font-medium">Average Score</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black">{userRank}</div>
                <div className="text-[11px] text-blue-200/80 font-medium">Global Rank</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black">{xpEarned.toLocaleString()}</div>
                <div className="text-[11px] text-blue-200/80 font-medium">XP Points</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/70">
            <span className="italic font-medium">"Practice Today for a Better Tomorrow"</span>
            <span className="font-mono text-[11px]">Placement 2026 Batch</span>
          </div>
        </div>

        {/* Right Widget: Today's Goal (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Today's Goal</span>
              </h3>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {completedGoalsCount}/{todayGoals.length} Completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              {todayGoals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className="w-full flex items-center gap-2.5 text-left text-xs group cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    goal.completed
                      ? "bg-emerald-500 text-white"
                      : "border border-slate-300 dark:border-slate-700 hover:border-emerald-500"
                  }`}>
                    {goal.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`transition-colors ${
                    goal.completed
                      ? "text-slate-400 dark:text-slate-500 line-through font-medium"
                      : "text-slate-700 dark:text-slate-300 font-semibold group-hover:text-emerald-500"
                  }`}>
                    {goal.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Keep your momentum going!</span>
            <span className="font-bold text-emerald-500">{goalProgress}% Done</span>
          </div>
        </div>
      </div>

      {/* ── Action Pills Bar (Matching Image 3) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pill 1: Continue Learning */}
        <div
          onClick={() => onTabChange("learning")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Continue Learning</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">Data Structures - Arrays</h4>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">60% completed</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Pill 2: Daily Revision */}
        <div
          onClick={() => onTabChange("revision")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Revision</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">10 Questions for You</h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Based on weak topics</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Pill 3: Upcoming Mission */}
        <div
          onClick={() => onTabChange("placement-mission")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 shadow-xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming Mission</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">Infosys Hiring Challenge</h4>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Starts in 2 days</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Pill 4: Recommended */}
        <div
          onClick={() => onTabChange("learning")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 shadow-xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">Operating Systems</h4>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Process Scheduling</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* ── Top Companies Grid (Matching Image 3) ── */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Top Companies
            </h3>
            <p className="text-xs text-slate-500">Practice questions modeled on recent hiring drives</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
              {["All", "IT Services", "Product Based", "Core"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCompanyCategory(cat.toLowerCase())}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCompanyCategory === cat.toLowerCase()
                      ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => onTabChange("companies")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer ml-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {displayedCompanies.map((comp) => {
            const compMods = modules.filter(m => m.parentId === comp.id);
            const isFree = comp.publicationStatus === "free" || comp.name.toLowerCase().includes("wipro");
            return (
              <div
                key={comp.id}
                onClick={() => onTabChange("companies")}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col items-center text-center justify-between group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {comp.logo ? (
                    <img src={comp.logo} alt={comp.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="mt-2.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{comp.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{compMods.length || 24} Modules</p>
                </div>

                <div className="mt-2">
                  {isFree ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      ✓ Free
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 flex items-center gap-0.5">
                      ★ Premium
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Subjects & Practice + Upcoming Exams + Live Missions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Subjects & Practice (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subjects & Practice</h3>
              <p className="text-xs text-slate-500">Track progress by core subject</p>
            </div>
            <button
              onClick={() => onTabChange("learning")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onTabChange("learning")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-blue-500/40 transition-all cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{sub.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{sub.modules}</p>
                </div>
                {/* Circular indicator */}
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke={sub.stroke}
                      strokeWidth="3.5"
                      strokeDasharray={`${sub.progress}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-slate-700 dark:text-slate-200">{sub.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Exams (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Exams</h3>
              <button
                onClick={() => onTabChange("companies")}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {upcomingExams.map((exam, idx) => (
                <div key={exam.id || idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{exam.title || "Full Assessment"}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">90 min | 100 Questions</p>
                  <button
                    onClick={() => onStartModule && onStartModule(exam, "general")}
                    className="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Placement Missions (4 cols - Matching Image 3) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Live Placement Missions</span>
              </h3>
              <button
                onClick={() => onTabChange("placement-mission")}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Mission banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-sm mb-3">
              <h4 className="text-xs font-black">Infosys Hiring Challenge</h4>
              <p className="text-[10px] text-blue-200 mt-0.5">Ends in 2d 14h 32m</p>
              <button
                onClick={() => onTabChange("placement-mission")}
                className="mt-2 px-3 py-1 bg-white text-blue-900 rounded-lg text-xs font-bold shadow-xs cursor-pointer hover:bg-blue-50"
              >
                Join Now
              </button>
            </div>

            {/* Mini Leaderboard list */}
            <div className="space-y-1.5">
              {[
                { rank: 1, name: "Ananya Patel", score: "98.5%" },
                { rank: 2, name: "Karan Mehta", score: "96.0%" },
                { rank: 3, name: "Riya Singh", score: "94.5%" },
                { rank: 4, name: `You (${user?.name?.split(" ")[0] || "Student"})`, score: `${averageScore}%`, isYou: true }
              ].map(lb => (
                <div key={lb.rank} className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl text-xs ${
                  lb.isYou
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-500/20"
                    : "text-slate-600 dark:text-slate-300"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400">#{lb.rank}</span>
                    <span className="truncate">{lb.name}</span>
                  </div>
                  <span className="font-bold">{lb.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── My Plans & Access + Recent Test Performance + Announcements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* My Plans & Access (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Plans & Access</h3>
            <button
              onClick={() => onTabChange("plans")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Active Plan</span>
              </div>
              <button
                onClick={() => onTabChange("plans")}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Manage Plan
              </button>
            </div>
            <h4 className="text-lg font-black">{user?.hasFullPremium ? "Premium Full Access" : "All-Access Pass"}</h4>
            <p className="text-[11px] text-emerald-100 mt-0.5">Valid till 30 Sep 2026</p>

            <div className="mt-3.5 pt-3 border-t border-white/20 space-y-1.5 text-xs text-emerald-50">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> All Company Tests Included</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Unlimited Practice Tests</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Detailed Solutions & Explanations</div>
            </div>
          </div>
        </div>

        {/* Recent Test Performance (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Test Performance</h3>
            <span className="text-xs text-slate-400 font-mono">{recentTests.length} Attempts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-2">Test Name</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Rank</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentTests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No test attempts yet. Start your first mock test!
                    </td>
                  </tr>
                ) : (
                  recentTests.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white line-clamp-1">{t.name}</td>
                      <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">{t.score}</td>
                      <td className="py-2.5 text-slate-400 font-mono">{t.rank}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => t.mod && onStartModule && onStartModule(t.mod, "general")}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#10192E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Announcements</h3>
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">TCS NQT 2026 Registration Open</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Apply before 30 July 2026</p>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">2 hours ago</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">New Aptitude Quiz Series Added</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Practice speed & accuracy now</p>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">1 day ago</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Infosys Hiring Challenge Starts Soon</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Win certificates & interview calls</p>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
