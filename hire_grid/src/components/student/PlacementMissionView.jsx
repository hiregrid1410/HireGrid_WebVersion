import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import { Lock, Trophy, Award, Timer, BookOpen, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { MissionsSkeleton, LeaderboardSkeleton } from "../loading/Skeletons";

export function PlacementMissionView({ currentUser, onStartModule }) {
  const [activeSubTab, setActiveSubTab] = useState("missions"); // 'missions' | 'leaderboard'
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [missionsFilter, setMissionsFilter] = useState("active");
  const [leaderboard, setLeaderboard] = useState([]);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/placement-mission/missions");
      if (res.success) {
        setMissions(res.missions || []);
        setHistory(res.history || []);
        setCycleInfo(res.cycle || null);
        setIsPremiumLocked(false);
      }
    } catch (err) {
      if (err.message && err.message.includes("exclusively for Premium Members")) {
        setIsPremiumLocked(true);
      } else {
        showToast("Error loading missions: " + err.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/placement-mission/leaderboard");
      if (res.success) {
        setLeaderboard(res.leaderboard || []);
        if (res.cycle) setCycleInfo(res.cycle);
      }
    } catch (err) {
      showToast("Error loading leaderboard: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "missions") {
      fetchMissions();
    } else {
      fetchLeaderboard();
    }
  }, [activeSubTab]);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return { emoji: "🥇", text: "Gold Badge", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
      case 2:
        return { emoji: "🥈", text: "Silver Badge", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" };
      case 3:
        return { emoji: "🥉", text: "Bronze Badge", color: "text-amber-700 bg-amber-700/10 border-amber-700/30" };
      case 4:
      case 5:
        return { emoji: "⭐", text: "Runner-Up", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
      default:
        return { emoji: "🎖️", text: "Top 10 Performer", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "submitted":
        return "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
      case "active":
        return "bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse";
      case "expired":
        return "bg-rose-500/10 border border-rose-500/30 text-rose-400";
      case "invalid":
        return "bg-slate-500/10 border border-slate-500/30 text-slate-400";
      default:
        return "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400";
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(Number(timestamp)).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center">
            <Trophy className="h-7 w-7 mr-3 text-amber-500" />
            Placement Mission
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {cycleInfo ? `Current Active Cycle: ${cycleInfo.name}` : "Compete with other Premium students in active placement assessments"}
          </p>
        </div>

        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setActiveSubTab("missions")}
            className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wider transition-all duration-200 uppercase
              ${activeSubTab === "missions"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Missions
          </button>
          <button
            onClick={() => setActiveSubTab("leaderboard")}
            className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wider transition-all duration-200 uppercase
              ${activeSubTab === "leaderboard"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {loading ? (
        activeSubTab === "missions" ? <MissionsSkeleton /> : <LeaderboardSkeleton />
      ) : activeSubTab === "missions" ? (
        isPremiumLocked ? (
          /* Locked Premium State for Free Users */
          <div className="max-w-xl mx-auto py-12 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="glass-panel border border-amber-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10"></div>
              <Lock className="w-16 h-16 text-amber-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Premium Content Locked
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                This section is exclusively for Premium Members. Upgrade to Premium to attempt weekly Placement Missions, test your skills in real-time constraints, and compete on the leaderboard!
              </p>
              <button
                onClick={() => {
                  window.location.hash = "#plans";
                  const plansItem = document.querySelector('[label="Premium Plans"]');
                  if (plansItem) plansItem.click();
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/10 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <span>Upgrade to Premium Membership</span>
              </button>
            </div>
          </div>
        ) : (missions.length === 0 && history.length === 0) ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold">No active mission modules found for this cycle.</p>
            <p className="text-sm mt-1">Please check back later for new placement modules.</p>
          </div>
        ) : (
          /* Premium Mission Modules List */
          <div className="space-y-6">
            {history.length > 0 && (
              <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800/80 pb-2">
                <button
                  onClick={() => setMissionsFilter("active")}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all
                    ${missionsFilter === "active"
                      ? "border-emerald-500 text-emerald-500"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  Active ({missions.length})
                </button>
                <button
                  onClick={() => setMissionsFilter("history")}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all
                    ${missionsFilter === "history"
                      ? "border-emerald-500 text-emerald-500"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  Mission History ({history.length})
                </button>
              </div>
            )}

            {(missionsFilter === "active" ? missions : history).length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold uppercase tracking-wider">No {missionsFilter} missions in this cycle.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in duration-200">
                {(missionsFilter === "active" ? missions : history).map((m) => (
                  <div
                    key={m.id}
                    className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusBadgeClass(m.status)}`}>
                          {m.status.replace("_", " ")}
                        </span>
                        <div className="flex items-center text-slate-500 text-xs font-mono">
                          <Timer className="w-4 h-4 mr-1 text-emerald-500" />
                          <span>{m.timeLimit || m.time_limit} Mins</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2 leading-tight uppercase">
                        {m.title}
                      </h3>
                      
                      {/* Mission Schedule Info */}
                      {(m.startTime || m.endTime) && (
                        <div className="text-[10px] font-mono text-slate-500 mb-4 space-y-0.5">
                          {m.startTime && (
                            <div>Starts: <span className="text-slate-700 dark:text-slate-300">{formatDateTime(m.startTime)}</span></div>
                          )}
                          {m.endTime && (
                            <div>Ends: <span className="text-slate-700 dark:text-slate-300">{formatDateTime(m.endTime)}</span></div>
                          )}
                        </div>
                      )}

                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                        {m.description || "Weekly Placement Mission Module. Complete to earn accuracy and speed XP."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                      {m.status === "submitted" ? (
                        <div className="flex flex-wrap gap-2 text-xs font-mono">
                          <span className="text-slate-500">XP: <strong className="text-amber-400 font-bold">{m.attempt.xpEarned}</strong></span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-500">Accuracy: <strong className="text-emerald-400 font-bold">{m.attempt.accuracy}%</strong></span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-mono">
                          <span>Questions: <strong className="text-emerald-400 font-bold">{m.questionCount}</strong></span>
                        </div>
                      )}

                      {m.lifecycleStatus === "SCHEDULED" ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 font-bold rounded-xl text-xs uppercase tracking-wider cursor-not-allowed border border-slate-300 dark:border-slate-700"
                        >
                          Scheduled
                        </button>
                      ) : m.lifecycleStatus === "EXPIRED" && m.status !== "submitted" && m.status !== "active" ? (
                        <span className="text-xs text-rose-500 font-bold uppercase tracking-wider flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Expired
                        </span>
                      ) : (
                        <>
                          {m.status === "not_started" && (
                            <button
                              onClick={() => onStartModule(m)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                            >
                              Start Attempt
                            </button>
                          )}
                          {m.status === "active" && (
                            <button
                              onClick={() => onStartModule(m)}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                            >
                              Resume Attempt
                            </button>
                          )}
                          {m.status === "submitted" && (
                            <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider flex items-center">
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Completed
                            </span>
                          )}
                          {m.status === "expired" && (
                            <span className="text-xs text-rose-500 font-bold uppercase tracking-wider flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Expired
                            </span>
                          )}
                          {m.status === "invalid" && (
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center" title="Invalidated by Administrator">
                              <HelpCircle className="w-4 h-4 mr-1" />
                              Invalid
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        /* Leaderboard snapshots */
        <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {leaderboard.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold">No rankings calculated for this cycle yet.</p>
              <p className="text-sm mt-1">Submit attempts to show up on the board at next aggregation run.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Student Name
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Badge
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                      XP Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {leaderboard.map((row) => {
                    const badgeInfo = getRankBadge(row.rank);
                    return (
                      <tr
                        key={row.rank}
                        className="hover:bg-slate-100/50 dark:hover:bg-slate-900/10 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeInfo.color}`}>
                            <span className="mr-1">{badgeInfo.emoji}</span>
                            {badgeInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-bold text-amber-500">
                          {row.xp} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
