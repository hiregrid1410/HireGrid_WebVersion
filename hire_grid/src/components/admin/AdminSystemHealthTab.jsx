import React, { useState, useEffect } from "react";
import { collection, db, getDocs, limit, query, orderBy } from "../../firebase";
import {
  Users,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Trophy,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle,
} from "lucide-react";

export function AdminSystemHealthTab() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    premiumStudents: 0,
    pendingPurchases: 0,
    pendingDevices: 0,
    criticalAlerts: 0,
    unreadFeedbacks: 0,
    averageExamScore: 0,
    placementParticipants: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    let students = 0;
    let premium = 0;
    let purchases = 0;
    let devices = 0;
    let alerts = 0;
    let feedbacks = 0;

    try {
      const usersSnap = await getDocs(collection(db, "users")).catch(() => ({ size: 0, docs: [] }));
      students = usersSnap.size;
      usersSnap.docs.forEach((d) => {
        if (d.data()?.hasFullPremium) premium++;
      });
    } catch (e) {}

    try {
      const purchaseSnap = await getDocs(collection(db, "payment_requests")).catch(() => ({ docs: [] }));
      purchaseSnap.docs.forEach((d) => {
        if (d.data()?.status === "pending") purchases++;
      });
    } catch (e) {}

    try {
      const deviceSnap = await getDocs(collection(db, "device_requests")).catch(() => ({ docs: [] }));
      deviceSnap.docs.forEach((d) => {
        if (d.data()?.status === "pending") devices++;
      });
    } catch (e) {}

    try {
      const securitySnap = await getDocs(collection(db, "security_logs")).catch(() => ({ size: 0 }));
      alerts = securitySnap.size;
    } catch (e) {}

    try {
      const feedbackSnap = await getDocs(collection(db, "feedbacks")).catch(() => ({ size: 0 }));
      feedbacks = feedbackSnap.size;
    } catch (e) {}

    // Pull mock activities for recent list
    const activities = [
      { id: 1, type: "premium", text: "Premium access granted to Jayvir Sharma", time: "2m ago" },
      { id: 2, type: "device", text: "Device change approved for Sujith Mishra", time: "15m ago" },
      { id: 3, type: "feedback", text: "New platform feedback submitted by Aditya", time: "30m ago" },
      { id: 4, type: "user", text: "New student registration: Ayush Patni", time: "1h ago" },
    ];

    // Mock top students
    const topStudents = [
      { rank: 1, name: "Ishan Mansuri", score: 980, branch: "Computer Science" },
      { rank: 2, name: "Darshan Makwana", score: 845, branch: "Mechanical" },
      { rank: 3, name: "Sujith Mishra", score: 790, branch: "Information Technology" },
      { rank: 4, name: "Jayvir Sharma", score: 780, branch: "Electrical" },
    ];

    setStats({
      totalStudents: students,
      premiumStudents: premium,
      pendingPurchases: purchases,
      pendingDevices: devices,
      criticalAlerts: alerts,
      unreadFeedbacks: feedbacks,
      averageExamScore: 78, // Placeholder
      placementParticipants: 24, // Placeholder
    });
    setRecentActivities(activities);
    setLeaderboard(topStudents);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            System Operational Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Real-time metric telemetry and platform operation controls.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors"
          >
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={stats.totalStudents}
          change="+12% this month"
          icon={<Users className="w-5 h-5 text-emerald-500" />}
        />
        <KPICard
          title="Active Premium"
          value={stats.premiumStudents}
          change="+18.6% this month"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
        />
        <KPICard
          title="Pending Requests"
          value={stats.pendingPurchases + stats.pendingDevices}
          change={`${stats.pendingPurchases} urgent payment`}
          icon={<CreditCard className="w-5 h-5 text-amber-500" />}
        />
        <KPICard
          title="Security Alerts"
          value={stats.criticalAlerts}
          change="3 critical flags"
          icon={<ShieldAlert className="w-5 h-5 text-rose-500" />}
        />
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Needs Attention & Placement summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Attention */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 uppercase font-mono tracking-wider text-xs">
              Needs Attention
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              <AttentionItem
                title="Purchase Requests"
                desc={`${stats.pendingPurchases} payments awaiting validation`}
                actionLabel="Review"
                color="emerald"
              />
              <AttentionItem
                title="Device Access Requests"
                desc={`${stats.pendingDevices} login locks to review`}
                actionLabel="Review"
                color="emerald"
              />
              <AttentionItem
                title="Flagged Exam Attempts"
                desc="4 attempts flagged by anti-cheat guard"
                actionLabel="Inspect"
                color="rose"
              />
              <AttentionItem
                title="New Student Feedback"
                desc={`${stats.unreadFeedbacks} feedback messages received`}
                actionLabel="Open"
                color="teal"
              />
            </div>
          </div>

          {/* Placement Mission summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider text-xs">
                Placement Mission (Current Cycle)
              </h3>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold">
                Week 3 - Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">
                  Participants
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-white">781</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">
                  Completed
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-white">535</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">
                  Average Score
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-white">67%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-6">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "68%" }} />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
                  68% Completed
                </p>
              </div>
              <button className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                View Mission <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity & Top Students */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 uppercase font-mono tracking-wider text-xs">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <p className="text-slate-700 dark:text-slate-350">{act.text}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider">
              View All Activity
            </button>
          </div>

          {/* Top Students / Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 uppercase font-mono tracking-wider text-xs">
              Top Performing Students
            </h3>
            <div className="space-y-4">
              {leaderboard.map((student) => (
                <div key={student.rank} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-slate-400 font-mono">
                      {student.rank}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{student.branch}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {student.score} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:scale-[1.01]">
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">
          {title}
        </p>
        <h4 className="text-3xl font-black text-slate-800 dark:text-white mt-2 leading-none">
          {value}
        </h4>
        <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {change}
        </p>
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl shadow-sm">
        {icon}
      </div>
    </div>
  );
}

function AttentionItem({ title, desc, actionLabel, color }) {
  const accentColors = {
    emerald: "text-emerald-500 hover:text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-500 hover:text-rose-600 bg-rose-500/10 border-rose-500/20",
    teal: "text-teal-500 hover:text-teal-600 bg-teal-500/10 border-teal-500/20",
  };

  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{desc}</p>
      </div>
      <button
        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${accentColors[color]}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
