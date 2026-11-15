import React, { useState } from "react";
import {
  Trophy,
  Target,
  BarChart3,
  Star,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check,
  Building2,
  Calendar,
  ChevronRight,
  Crown,
  Bell,
  Code2,
  Layers,
  Database,
  Monitor
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
  plans = [],
  onTabChange,
  onStartModule,
}) {
  const [todayGoals, setTodayGoals] = useState([
    { id: 1, text: "Solve 20 Aptitude Questions", completed: true },
    { id: 2, text: "Complete 1 Mock Test", completed: true },
    { id: 3, text: "Revise weak topics", completed: false },
    { id: 4, text: "Take 1 Practice Assessment", completed: false },
    { id: 5, text: "Maintain study streak", completed: true },
  ]);

  const toggleGoal = (id) => {
    setTodayGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const completedGoalsCount = todayGoals.filter((g) => g.completed).length;
  const goalProgress = Math.round((completedGoalsCount / todayGoals.length) * 100);

  // Dynamic user metrics
  const testsAttempted = Object.keys(moduleScores).length || (stats?.testsTaken ?? 3);
  const scoreValues = Object.values(moduleScores);
  const averageScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length)
    : (stats?.avgScore ?? 1);

  const xpEarned = stats?.xp || user?.xp || 10;

  // Rank calculation
  const userRankEntry = leaderboard.find(
    (item) => item.userId === user?.id || item.userEmail === user?.email
  );
  const userRank = userRankEntry ? `#${userRankEntry.rank}` : (stats?.globalRank ? `#${stats.globalRank}` : "#342");

  // Core Subjects list matching reference
  const subjects = [
    {
      id: "dsa",
      name: "Data Structures",
      modules: "45 Modules",
      progress: 75,
      icon: Layers,
    },
    {
      id: "algo",
      name: "Algorithms",
      modules: "38 Modules",
      progress: 60,
      icon: Code2,
    },
    {
      id: "os",
      name: "Operating Systems",
      modules: "28 Modules",
      progress: 40,
      icon: Monitor,
    },
    {
      id: "dbms",
      name: "DBMS",
      modules: "26 Modules",
      progress: 55,
      icon: Database,
    },
  ];

  // Upcoming exams list
  const upcomingExams = modules.filter(
    (m) => m.moduleType === "exam" || m.moduleType === "company" || m.category === "exam"
  ).slice(0, 3);

  const defaultExams = [
    { id: "apti", title: "Aptitude", duration: "90 min", questions: "100 Questions" },
    { id: "final", title: "Final", duration: "90 min", questions: "100 Questions" },
    { id: "apti_2", title: "Apti", duration: "90 min", questions: "100 Questions" },
  ];

  const examsToDisplay = upcomingExams.length > 0 ? upcomingExams : defaultExams;

  // Recent test history
  const recentTests = Object.entries(moduleScores).slice(0, 3).map(([modId, score], index) => {
    const mod = modules.find((m) => m.id === modId);
    return {
      id: modId,
      name: mod?.title || `NETWORK THEOREMS-${index + 2}`,
      score: `${score}%`,
      rank: `#${index + 120}`,
      mod,
    };
  });

  const defaultRecentTests = [
    { id: "test_1", name: "NETWORK THEOREMS-2", score: "3%", rank: "#120" },
    { id: "test_2", name: "MODULE-2", score: "0%", rank: "#121" },
    { id: "test_3", name: "MODULE-1", score: "0%", rank: "#122" },
  ];

  const recentPerformance = recentTests.length > 0 ? recentTests : defaultRecentTests;

  // Active plan info
  const activePlan = plans.find((p) => p.id === user?.activePlanId);
  const planTitle = activePlan?.name || (user?.hasFullPremium ? "Premium Full Access" : "All-Access Pass");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Top Section: 4 Stat Cards & Today's Goal Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (8 cols): 4 Stat Cards */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          {/* 4 Clean Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Card 1: Tests Taken */}
            <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-4 shadow-2xs">
              <div className="w-7 h-7 text-[#D6C7A1] dark:text-[#C5B48A] mb-2 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">{testsAttempted}</div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 font-medium">Tests Taken</div>
            </div>

            {/* Card 2: Average Score */}
            <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-4 shadow-2xs">
              <div className="w-7 h-7 text-[#B91C1C] dark:text-[#F87171] mb-2 flex items-center justify-center">
                <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">{averageScore}%</div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 font-medium">Average Score</div>
            </div>

            {/* Card 3: Global Rank */}
            <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-4 shadow-2xs">
              <div className="w-7 h-7 text-[#14532D] dark:text-[#22C55E] mb-2 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#14532D] dark:text-[#22C55E]" />
              </div>
              <div className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">{userRank}</div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 font-medium">Global Rank</div>
            </div>

            {/* Card 4: XP Points */}
            <div className="bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-4 shadow-2xs">
              <div className="w-7 h-7 text-[#6B7280] dark:text-[#9CA3AF] mb-2 flex items-center justify-center">
                <Star className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-[#374151] dark:text-[#F3F4F6]">{xpEarned}</div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 font-medium">XP Points</div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Today's Goal Card */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Today's Goal</h3>
              <span className="text-xs font-bold text-[#14532D] dark:text-[#22C55E]">
                {completedGoalsCount}/{todayGoals.length} Completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#E7E1D5] dark:bg-[#374151] h-1.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-[#14532D] dark:bg-[#22C55E] h-full rounded-full transition-all duration-300"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            {/* Goal Checklist */}
            <div className="space-y-2.5">
              {todayGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className="w-full flex items-center gap-2.5 text-left text-xs group cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      goal.completed
                        ? "bg-[#14532D] text-white dark:bg-[#22C55E] dark:text-[#111827]"
                        : "border border-[#9CA3AF] dark:border-[#6B7280] hover:border-[#14532D]"
                    }`}
                  >
                    {goal.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`truncate transition-colors ${
                      goal.completed
                        ? "text-[#374151] dark:text-[#F3F4F6] font-medium"
                        : "text-[#6B7280] dark:text-[#9CA3AF] font-normal group-hover:text-[#374151]"
                    }`}
                  >
                    {goal.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Access Cards Row (4 cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Continue Learning */}
        <div
          onClick={() => onTabChange("general")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] hover:border-[#14532D]/40 shadow-2xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#374151] dark:text-[#F3F4F6] block">Continue Learning</span>
              <h4 className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">Data Structures – Arrays</h4>
              <p className="text-[11px] text-[#15803D] dark:text-[#22C55E] font-medium mt-0.5">60% completed</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#14532D] dark:group-hover:text-[#22C55E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 2: Daily Revision */}
        <div
          onClick={() => onTabChange("general")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] hover:border-[#14532D]/40 shadow-2xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#374151] dark:text-[#F3F4F6] block">Daily Revision</span>
              <h4 className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">10 Questions for You</h4>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium mt-0.5">Based on weak topics</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#14532D] dark:group-hover:text-[#22C55E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 3: Upcoming Mission */}
        <div
          onClick={() => onTabChange("placement-mission")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] hover:border-[#14532D]/40 shadow-2xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] dark:bg-[#193B2A] text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#374151] dark:text-[#F3F4F6] block">Upcoming Mission</span>
              <h4 className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">Infosys Hiring Challenge</h4>
              <p className="text-[11px] text-[#15803D] dark:text-[#22C55E] font-medium mt-0.5">Starts in 2 days</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#14532D] dark:group-hover:text-[#22C55E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>

        {/* Card 4: Recommended */}
        <div
          onClick={() => onTabChange("general")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] hover:border-[#14532D]/40 shadow-2xs flex items-center justify-between group cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#374151] dark:text-[#F3F4F6] block">Recommended</span>
              <h4 className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">Operating Systems</h4>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium mt-0.5">Process Scheduling</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#14532D] dark:group-hover:text-[#22C55E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </div>
      </div>

      {/* ── 3. Middle Grid: Subjects & Practice (5 cols) + Upcoming Exams (3 cols) + Live Placement Missions (4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Subjects & Practice (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Subjects & Practice</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Track progress by core subject</p>
            </div>
            <button
              onClick={() => onTabChange("general")}
              className="text-xs font-bold text-[#14532D] dark:text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {subjects.map((sub) => {
              const Icon = sub.icon;
              return (
                <div
                  key={sub.id}
                  onClick={() => onTabChange("general")}
                  className="flex items-center justify-between gap-4 p-2 rounded-xl hover:bg-[#FAF7F0] dark:hover:bg-[#111827] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] dark:bg-[#111827] border border-[#E7E1D5] dark:border-[#374151] flex items-center justify-center text-[#14532D] dark:text-[#22C55E] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6]">{sub.name}</h4>
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{sub.modules}</p>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="flex-1 max-w-[120px] sm:max-w-[160px] flex items-center gap-3">
                    <div className="flex-1 bg-[#E7E1D5] dark:bg-[#374151] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#14532D] dark:bg-[#22C55E] h-full rounded-full transition-all duration-300"
                        style={{ width: `${sub.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6] w-8 text-right">
                      {sub.progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Exams (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Upcoming Exams</h3>
              <button
                onClick={() => onTabChange("companies")}
                className="text-xs font-bold text-[#14532D] dark:text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {examsToDisplay.map((exam, idx) => (
                <div key={exam.id || idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#14532D] dark:text-[#22C55E] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6] line-clamp-1">{exam.title}</h4>
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                        {exam.duration || "90 min"} | {exam.questions || "100 Questions"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onStartModule && exam.moduleType) {
                        onStartModule(exam, "general");
                      } else {
                        onTabChange("companies");
                      }
                    }}
                    className="px-3 py-1.5 bg-[#14532D] hover:bg-[#0F4224] text-white dark:bg-[#22C55E] dark:text-[#111827] rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Placement Missions (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Live Placement Missions</h3>
              <button
                onClick={() => onTabChange("placement-mission")}
                className="text-xs font-bold text-[#14532D] dark:text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mission banner item */}
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E7E1D5] dark:border-[#374151]">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-[#14532D] dark:text-[#22C55E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6]">Infosys Hiring Challenge</h4>
                  <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Ends in 2d 14h 32m</p>
                </div>
              </div>
              <button
                onClick={() => onTabChange("placement-mission")}
                className="px-3 py-1.5 bg-[#14532D] hover:bg-[#0F4224] text-white dark:bg-[#22C55E] dark:text-[#111827] rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
              >
                Join Now
              </button>
            </div>

            {/* Mini Leaderboard list */}
            <div className="space-y-2">
              {[
                { rank: 1, name: "Ananya Patel", score: "98.5%" },
                { rank: 2, name: "Karan Mehta", score: "96.0%" },
                { rank: 3, name: "Riya Singh", score: "94.5%" },
                { rank: 4, name: `You (${user?.name?.split(" ")[0] || "kaju"})`, score: `${averageScore}%`, isYou: true },
              ].map((lb) => (
                <div
                  key={lb.rank}
                  className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs ${
                    lb.isYou
                      ? "text-[#15803D] dark:text-[#22C55E] font-bold"
                      : "text-[#374151] dark:text-[#F3F4F6]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">#{lb.rank}</span>
                    <span className="truncate">{lb.name}</span>
                  </div>
                  <span className="font-bold">{lb.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Grid: My Plan & Access (4 cols) + Recent Test Performance (4 cols) + Announcements (4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* My Plan & Access (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">My Plan & Access</h3>
            <button
              onClick={() => onTabChange("plans")}
              className="text-xs font-bold text-[#14532D] dark:text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#E8F3EC] dark:bg-[#193B2A] border border-[#14532D]/15 dark:border-[#22C55E]/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#14532D] dark:text-[#22C55E]">
                  ACTIVE PLAN
                </span>
              </div>
            </div>
            <h4 className="text-base font-bold text-[#374151] dark:text-[#F3F4F6] mt-1">{planTitle}</h4>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Valid till 30 Sep 2026</p>

            <div className="mt-3 space-y-1.5 text-xs text-[#374151] dark:text-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#14532D] dark:text-[#22C55E]" /> All Company Tests Included
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#14532D] dark:text-[#22C55E]" /> Unlimited Practice Tests
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#14532D] dark:text-[#22C55E]" /> Detailed Solutions & Explanations
              </div>
            </div>

            <button
              onClick={() => onTabChange("plans")}
              className="mt-4 px-4 py-1.5 bg-[#14532D] hover:bg-[#0F4224] text-white dark:bg-[#22C55E] dark:text-[#111827] rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Manage Plan
            </button>
          </div>
        </div>

        {/* Recent Test Performance (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6]">Recent Test Performance</h3>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-medium">3 Attempts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7E1D5] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] uppercase text-[10px] font-semibold">
                  <th className="pb-2">TEST NAME</th>
                  <th className="pb-2 text-center">SCORE</th>
                  <th className="pb-2 text-center">RANK</th>
                  <th className="pb-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E1D5]/60 dark:divide-[#374151]/60">
                {recentPerformance.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF7F0] dark:hover:bg-[#111827] transition-colors">
                    <td className="py-2.5 font-bold text-[#374151] dark:text-[#F3F4F6] truncate max-w-[120px]">{t.name}</td>
                    <td className="py-2.5 text-center text-[#15803D] dark:text-[#22C55E] font-bold">{t.score}</td>
                    <td className="py-2.5 text-center text-[#6B7280] dark:text-[#9CA3AF] font-mono">{t.rank}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => {
                          if (t.mod && onStartModule) {
                            onStartModule(t.mod, "general");
                          } else {
                            onTabChange("companies");
                          }
                        }}
                        className="text-xs text-[#14532D] dark:text-[#22C55E] font-semibold hover:underline cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-[#374151] dark:text-[#F3F4F6] mb-4">Announcements</h3>
          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6]">TCS NQT 2026 Registration Open</h4>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Apply before 30 July 2026</p>
                <span className="text-[9px] text-[#9CA3AF] mt-0.5 block">2 hours ago</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E8F3EC] dark:bg-[#193B2A] text-[#14532D] dark:text-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6]">New Aptitude Quiz Series Added</h4>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Practice speed & accuracy now</p>
                <span className="text-[9px] text-[#9CA3AF] mt-0.5 block">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default StudentDashboardView;
