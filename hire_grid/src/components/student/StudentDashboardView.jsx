import React from "react";
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
  CheckCircle,
  FileText,
  Timer,
  ChevronRight,
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
  // 1. Calculate stats metrics
  const enrolledLearning = modules.filter(
    (m) =>
      m.moduleType === "general" &&
      (m.branchId === user?.branchId || m.branch_id === user?.branchId)
  ).length;

  const testsAttempted = Object.keys(moduleScores).length;

  const scoreValues = Object.values(moduleScores);
  const averageScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length)
      : 0;

  const xpEarned = stats?.xp || user?.xp || 0;

  // Find user's rank from leaderboard
  const userRankEntry = leaderboard.find(
    (item) => item.userId === user?.id || item.userEmail === user?.email
  );
  const userRank = userRankEntry ? `#${userRankEntry.rank}` : "#--";
  const userRankPercent = userRankEntry ? "Top 12%" : "Not ranked yet";

  // 2. Filter branch modules for "Continue Learning"
  const branchModules = modules
    .filter(
      (m) =>
        m.moduleType === "general" &&
        (m.branchId === user?.branchId || m.branch_id === user?.branchId)
    )
    .slice(0, 5);

  // 3. Recommended modules based on incomplete general modules
  const recommendedModules = modules
    .filter(
      (m) =>
        m.moduleType === "general" &&
        (m.branchId === user?.branchId || m.branch_id === user?.branchId) &&
        moduleScores[m.id] === undefined
    )
    .slice(0, 4);

  // 4. Generate achievements dynamically based on student stats
  const achievements = [];
  if (testsAttempted >= 1) {
    achievements.push({
      title: "First Attempt",
      desc: "Complete 1 practice module",
      xp: "+50 XP",
    });
  }
  if (testsAttempted >= 5) {
    achievements.push({
      title: "Test Taker",
      desc: "Complete 5 modules",
      xp: "+75 XP",
    });
  }
  if ((stats?.streak || 3) >= 3) {
    achievements.push({
      title: "Consistent Learner",
      desc: "Maintain a 3+ day study streak",
      xp: "+25 XP",
    });
  }
  if (averageScore >= 80) {
    achievements.push({
      title: "High Achiever",
      desc: "Maintain an average score of 80%+",
      xp: "+100 XP",
    });
  }

  // 5. Get top 3 leaderboard users
  const topThree = leaderboard.slice(0, 3);

  // Circular progress calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const overallProgress =
    enrolledLearning > 0 ? Math.round((testsAttempted / enrolledLearning) * 100) : 0;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  // XP level bar calculation
  const nextLevelXP = medalInfo?.maxVal === Infinity ? xpEarned : medalInfo?.maxVal || 2000;
  const currentLevelMin = medalInfo?.min || 0;
  const xpRange = nextLevelXP - currentLevelMin;
  const xpProgress = xpRange > 0 ? Math.min(100, Math.max(0, ((xpEarned - currentLevelMin) / xpRange) * 100)) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Welcome Header Section ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Operator"}! 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1">Let's continue your learning journey.</p>
        </div>
      </div>

      {/* ── Telemetry Stats Row ── */}
      <div className="std-stats-grid">
        <div className="std-stat-card">
          <div className="std-stat-card-header">
            <span className="std-stat-card-title">Enrolled Courses</span>
            <div className="std-stat-card-icon std-stat-card-icon--green">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="std-stat-card-value">{enrolledLearning}</div>
          <div className="std-stat-card-trend std-stat-card-trend--up">
            <span>📚 Available modules</span>
          </div>
        </div>

        <div className="std-stat-card">
          <div className="std-stat-card-header">
            <span className="std-stat-card-title">Tests Attempted</span>
            <div className="std-stat-card-icon std-stat-card-icon--blue">
              <FileText size={16} />
            </div>
          </div>
          <div className="std-stat-card-value">{testsAttempted}</div>
          <div className="std-stat-card-trend text-slate-400">
            <span>📋 Completed attempts</span>
          </div>
        </div>

        <div className="std-stat-card">
          <div className="std-stat-card-header">
            <span className="std-stat-card-title">Average Score</span>
            <div className="std-stat-card-icon std-stat-card-icon--purple">
              <Star size={16} />
            </div>
          </div>
          <div className="std-stat-card-value">{averageScore}%</div>
          <div className="std-stat-card-trend text-slate-400">
            <span>📈 Overall accuracy</span>
          </div>
        </div>

        <div className="std-stat-card">
          <div className="std-stat-card-header">
            <span className="std-stat-card-title">XP Earned</span>
            <div className="std-stat-card-icon std-stat-card-icon--orange">
              <Zap size={16} />
            </div>
          </div>
          <div className="std-stat-card-value">{xpEarned.toLocaleString()}</div>
          <div className="std-stat-card-trend text-amber-500">
            <span>🔥 Total XP accumulated</span>
          </div>
        </div>

        <div className="std-stat-card">
          <div className="std-stat-card-header">
            <span className="std-stat-card-title">Platform Rank</span>
            <div className="std-stat-card-icon std-stat-card-icon--cyan">
              <Award size={16} />
            </div>
          </div>
          <div className="std-stat-card-value">{userRank}</div>
          <div className="std-stat-card-trend text-slate-400">
            <span>{userRankPercent}</span>
          </div>
        </div>
      </div>

      {/* ── Split Columns layout ── */}
      <div className="std-dashboard-cols">
        {/* Left main column */}
        <div className="std-dashboard-main-col">
          {/* Continue Learning deck */}
          <div className="std-panel">
            <div className="std-panel-header">
              <span className="std-panel-title">Continue Learning</span>
              <span onClick={() => onTabChange("general")} className="std-panel-action flex items-center gap-1">
                View All <ArrowRight size={14} />
              </span>
            </div>
            
            {branchModules.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No active learning modules in your branch. Select a branch in profile settings.
              </div>
            ) : (
              <div className="std-deck">
                {branchModules.map((mod) => {
                  const score = moduleScores[mod.id];
                  const hasScore = score !== undefined;
                  const progress = hasScore ? 100 : 0;
                  return (
                    <div className="std-deck-card" key={mod.id}>
                      <div>
                        <div className="std-deck-card-icon">
                          <BookOpen size={16} />
                        </div>
                        <div className="std-deck-card-title truncate" title={mod.title}>
                          {mod.title}
                        </div>
                        <div className="std-deck-card-sub text-xs text-slate-500">
                          {mod.questions?.length || 0} Questions
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                          <span>PROGRESS</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="std-deck-card-progress-bar-bg">
                          <div
                            className="std-deck-card-progress-bar"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <button
                          onClick={() => onStartModule(mod)}
                          className="std-deck-card-btn"
                        >
                          <Play size={10} fill="currentColor" />
                          <span>{hasScore ? "Retake" : "Continue"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Placement Missions */}
          <div className="std-panel">
            <div className="std-panel-header">
              <span className="std-panel-title">Active Placement Missions</span>
              <span onClick={() => onTabChange("placement-mission")} className="std-panel-action flex items-center gap-1">
                View All <ArrowRight size={14} />
              </span>
            </div>

            {placementMissions.filter(m => m.status === "active" || m.status === "not_started").length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                <Award size={28} className="mx-auto mb-2 opacity-30 text-amber-500" />
                <p className="font-bold">No active missions for this week.</p>
                <p className="text-xs text-slate-600 mt-1">Check back later for upcoming cycles.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {placementMissions
                  .filter(m => m.status === "active" || m.status === "not_started")
                  .slice(0, 2)
                  .map((m) => (
                    <div className="std-mission-card" key={m.id}>
                      <div>
                        <div className="std-mission-card-header">
                          <span className="std-mission-badge std-mission-badge--active">
                            {m.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Timer size={14} /> {m.timeLimit || m.time_limit}m
                          </span>
                        </div>
                        <h3 className="std-mission-title">{m.title}</h3>
                        <p className="std-mission-desc line-clamp-2">
                          {m.description || "Weekly Placement Mission Module. Complete to earn XP."}
                        </p>
                      </div>
                      <button
                        onClick={() => onStartModule(m)}
                        className="std-mission-btn"
                      >
                        Participate <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Recommended For You */}
          <div className="std-panel">
            <div className="std-panel-header">
              <span className="std-panel-title">Recommended For You</span>
            </div>
            
            {recommendedModules.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                🎉 Excellent! You have completed all general modules in your branch.
              </div>
            ) : (
              <div className="std-recs-grid">
                {recommendedModules.map((mod) => (
                  <div
                    className="std-rec-card"
                    key={mod.id}
                    onClick={() => onStartModule(mod)}
                  >
                    <div>
                      <div className="std-rec-card-title truncate max-w-[120px]" title={mod.title}>
                        {mod.title}
                      </div>
                      <div className="std-rec-card-value text-xs text-slate-400">Practice module</div>
                    </div>
                    <button className="std-rec-card-btn" aria-label="Start module">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side panel */}
        <div className="std-dashboard-side-col">
          {/* Progress gauge */}
          <div className="std-panel">
            <span className="std-panel-title block mb-6">Your Progress</span>
            <div className="std-progress-circle-wrap">
              <svg className="std-progress-circle-svg" viewBox="0 0 100 100">
                <circle className="std-progress-circle-bg" cx="50" cy="50" r={radius} />
                <circle
                  className="std-progress-circle-fill"
                  cx="50"
                  cy="50"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="std-progress-circle-text">{overallProgress}%</div>
            </div>
            <div className="text-center mt-4">
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Overall Completion</span>
              <span className="text-xs text-slate-500 block mt-1">
                {testsAttempted} / {enrolledLearning} Modules Completed
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>XP PROGRESS</span>
                <span>{xpEarned} / {nextLevelXP} XP</span>
              </div>
              <div className="std-xp-bar-bg">
                <div
                  className="std-xp-bar"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>{medalInfo?.fullName || "Bronze V"}</span>
                <span>{medalInfo?.fullName ? medalInfo.fullName.replace(/V|IV|III|II|I/g, "").trim() : "Bronze"} Level</span>
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          {achievements.length > 0 && (
            <div className="std-panel">
              <span className="std-panel-title block mb-6">Recent Achievements</span>
              <div className="std-achievements-list">
                {achievements.map((ach) => (
                  <div className="std-achievement-item" key={ach.title}>
                    <div className="std-achievement-icon">
                      <Star size={16} fill="currentColor" />
                    </div>
                    <div>
                      <div className="std-achievement-title">{ach.title}</div>
                      <div className="std-achievement-sub">{ach.desc}</div>
                    </div>
                    <span className="std-achievement-xp">{ach.xp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard snapshot */}
          <div className="std-panel">
            <div className="std-panel-header">
              <span className="std-panel-title">Leaderboard</span>
              <span onClick={() => onTabChange("placement-mission")} className="std-panel-action flex items-center gap-1">
                More <ArrowRight size={12} />
              </span>
            </div>

            {topThree.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No leaderboard computed.
              </div>
            ) : (
              <div className="std-leaderboard-list">
                {topThree.map((row, idx) => (
                  <div className="std-leaderboard-row" key={row.rank}>
                    <div className="std-leaderboard-row-left">
                      <span className={`std-leaderboard-row-rank std-leaderboard-row-rank--${row.rank}`}>
                        {row.rank}
                      </span>
                      <div className="std-leaderboard-row-avatar">
                        {row.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="std-leaderboard-row-name truncate" title={row.userName}>
                        {row.userName}
                      </span>
                    </div>
                    <span className="std-leaderboard-row-xp">{row.xp} XP</span>
                  </div>
                ))}

                {/* Highlight current user if ranked below top 3 */}
                {userRankEntry && userRankEntry.rank > 3 && (
                  <>
                    <div className="h-[1px] bg-slate-800 my-1" />
                    <div className="std-leaderboard-row std-leaderboard-row--current">
                      <div className="std-leaderboard-row-left">
                        <span className="std-leaderboard-row-rank text-emerald-400">
                          {userRankEntry.rank}
                        </span>
                        <div className="std-header-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                          {user?.name?.substring(0, 2).toUpperCase() || "ME"}
                        </div>
                        <span className="std-leaderboard-row-name text-emerald-400 truncate">
                          You
                        </span>
                      </div>
                      <span className="std-leaderboard-row-xp text-emerald-400">{userRankEntry.xp} XP</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
