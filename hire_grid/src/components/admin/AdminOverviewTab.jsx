import React, { useState, useEffect } from "react";
import {
  Users,
  FolderOpen,
  CreditCard,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Clock,
  BookOpen,
  Award,
  GitMerge,
  RotateCcw,
  Trophy,
  BarChart3,
  Shield,
  Settings,
  MonitorSmartphone,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import { PlatformBadge } from "./PlatformSelector";

export function AdminOverviewTab({ onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalContent: 0,
    totalRevenue: 0,
    pendingPaymentsCount: 0,
    pendingDevicesCount: 0,
    activeStaffCount: 0,
    webContentCount: 0,
    appContentCount: 0,
    bothContentCount: 0,
    recentPayments: [],
    recentDevices: []
  });

  const [growthTimeframe, setGrowthTimeframe] = useState("30D");

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [
        usersRes,
        compRes,
        modRes,
        plansRes,
        paymentsRes,
        devicesRes
      ] = await Promise.all([
        api.get("/users").catch(() => ({ success: false, users: [] })),
        api.get("/companies").catch(() => ({ success: false, companies: [] })),
        api.get("/modules").catch(() => ({ success: false, modules: [] })),
        api.get("/plans").catch(() => ({ success: false, plans: [] })),
        api.get("/payment-requests").catch(() => []),
        api.get("/device-requests").catch(() => [])
      ]);

      const allUsers = usersRes.users || [];
      const students = allUsers.filter(u => u.role === "student");
      const staff = allUsers.filter(u => u.role === "admin" || u.role === "content_manager");

      const companies = compRes.companies || [];
      const modules = modRes.modules || [];
      const plans = plansRes.plans || [];

      // Calculate platform breakdown across companies and modules
      let webCount = 0;
      let appCount = 0;
      let bothCount = 0;

      [...companies, ...modules].forEach(item => {
        const p = (item.platform || "both").toLowerCase();
        if (p === "web") webCount++;
        else if (p === "app") appCount++;
        else bothCount++;
      });

      const totalContent = companies.length + modules.length;

      // Payments
      const paymentList = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.requests || []);
      const pendingPayments = paymentList.filter(p => (p.status || "pending").toLowerCase() === "pending");
      const approvedPayments = paymentList.filter(p => (p.status || "").toLowerCase() === "approved");
      const totalRevenue = approvedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Devices
      const deviceList = Array.isArray(devicesRes) ? devicesRes : (devicesRes.requests || []);
      const pendingDevices = deviceList.filter(d => (d.status || "pending").toLowerCase() === "pending");

      setStats({
        totalStudents: students.length,
        totalContent,
        totalRevenue,
        pendingPaymentsCount: pendingPayments.length,
        pendingDevicesCount: pendingDevices.length,
        activeStaffCount: staff.length,
        webContentCount: webCount,
        appContentCount: appCount,
        bothContentCount: bothCount,
        recentPayments: paymentList.slice(0, 5),
        recentDevices: deviceList.slice(0, 5)
      });
    } catch (e) {
      console.error("Error loading admin overview stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleApprovePayment = async (paymentId) => {
    try {
      await api.put(`/payment-requests/${paymentId}`, { status: "approved" });
      showToast("Payment request approved successfully", "success");
      fetchOverviewData();
    } catch (e) {
      showToast(e.message || "Failed to approve payment", "error");
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      await api.put(`/payment-requests/${paymentId}`, { status: "rejected" });
      showToast("Payment request rejected", "info");
      fetchOverviewData();
    } catch (e) {
      showToast(e.message || "Failed to reject payment", "error");
    }
  };

  const handleApproveDevice = async (deviceId) => {
    try {
      await api.put(`/device-requests/${deviceId}`, { status: "approved" });
      showToast("Device reset approved", "success");
      fetchOverviewData();
    } catch (e) {
      showToast(e.message || "Failed to approve device", "error");
    }
  };

  const handleRejectDevice = async (deviceId) => {
    try {
      await api.put(`/device-requests/${deviceId}`, { status: "rejected" });
      showToast("Device request rejected", "info");
      fetchOverviewData();
    } catch (e) {
      showToast(e.message || "Failed to reject device", "error");
    }
  };

  // Platform Distribution Donut Data
  const totalContentItems = stats.webContentCount + stats.appContentCount + stats.bothContentCount || 1;
  const webPct = Math.round((stats.webContentCount / totalContentItems) * 100);
  const appPct = Math.round((stats.appContentCount / totalContentItems) * 100);
  const bothPct = 100 - webPct - appPct;

  const donutData = [
    { name: "Web Only", value: stats.webContentCount || 1, color: "#8B5CF6", pct: `${webPct}%` },
    { name: "App Only", value: stats.appContentCount || 1, color: "#10B981", pct: `${appPct}%` },
    { name: "Both", value: stats.bothContentCount || 1, color: "#3B82F6", pct: `${bothPct}%` }
  ];

  // User Growth Chart Data
  const userGrowthData = [
    { date: "1 Jul", web: Math.max(10, Math.round(stats.totalStudents * 0.45)), app: Math.max(15, Math.round(stats.totalStudents * 0.55)) },
    { date: "8 Jul", web: Math.max(18, Math.round(stats.totalStudents * 0.52)), app: Math.max(25, Math.round(stats.totalStudents * 0.68)) },
    { date: "15 Jul", web: Math.max(22, Math.round(stats.totalStudents * 0.60)), app: Math.max(30, Math.round(stats.totalStudents * 0.78)) },
    { date: "22 Jul", web: Math.max(28, Math.round(stats.totalStudents * 0.69)), app: Math.max(40, Math.round(stats.totalStudents * 0.88)) },
    { date: "Today", web: Math.max(35, Math.round(stats.totalStudents * 0.75)), app: Math.max(50, stats.totalStudents) }
  ];

  // 15 Quick Access Navigation Cards
  const quickAccessTabs = [
    { id: "dashboard", title: "1. Dashboard", subtitle: "Overview & Analytics", icon: <BarChart3 className="w-4 h-4 text-blue-400" />, workspace: "overview", subtab: "dashboard" },
    { id: "payments", title: "2. Payment Requests", subtitle: "Approve/Reject Payments", icon: <CreditCard className="w-4 h-4 text-rose-400" />, workspace: "operations", subtab: "purchase_requests", badge: stats.pendingPaymentsCount },
    { id: "devices", title: "3. Device Requests", subtitle: "Manage Device Access", icon: <Smartphone className="w-4 h-4 text-purple-400" />, workspace: "operations", subtab: "device_access", badge: stats.pendingDevicesCount },
    { id: "students", title: "4. Students", subtitle: "Manage All Students", icon: <Users className="w-4 h-4 text-emerald-400" />, workspace: "people", subtab: "users" },
    { id: "cms", title: "5. Content Managers", subtitle: "Manage Staff Access", icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />, workspace: "people", subtab: "users" },
    { id: "companies", title: "6. Companies", subtitle: "Manage Company Profiles", icon: <BookOpen className="w-4 h-4 text-blue-400" />, workspace: "content", subtab: "companies" },
    { id: "branches", title: "7. Branches", subtitle: "Manage Branches", icon: <GitMerge className="w-4 h-4 text-indigo-400" />, workspace: "content", subtab: "branch_access" },
    { id: "hierarchy", title: "8. Hierarchy Builder", subtitle: "Subjects → Topics → Sub Topics", icon: <FolderOpen className="w-4 h-4 text-amber-400" />, workspace: "content", subtab: "hierarchy" },
    { id: "modules", title: "9. Modules", subtitle: "Create & Manage Modules", icon: <BookOpen className="w-4 h-4 text-teal-400" />, workspace: "content", subtab: "modules" },
    { id: "exams", title: "10. Exams", subtitle: "Create & Manage Exams", icon: <Award className="w-4 h-4 text-rose-400" />, workspace: "content", subtab: "exams" },
    { id: "plans", title: "11. Plans", subtitle: "Subscription Plans", icon: <CreditCard className="w-4 h-4 text-emerald-400" />, workspace: "content", subtab: "plans" },
    { id: "revision", title: "12. Revision Content", subtitle: "Daily Revision Modules", icon: <RotateCcw className="w-4 h-4 text-purple-400" />, workspace: "content", subtab: "revision_modules" },
    { id: "missions", title: "13. Placement Missions", subtitle: "Company Placement Challenges", icon: <Trophy className="w-4 h-4 text-yellow-400" />, workspace: "placement", subtab: "placement_mission" },
    { id: "analytics", title: "14. Analytics", subtitle: "Detailed Reports", icon: <TrendingUp className="w-4 h-4 text-sky-400" />, workspace: "monitoring", subtab: "analytics" },
    { id: "security", title: "15. Security & Settings", subtitle: "Logs and System Control", icon: <Shield className="w-4 h-4 text-rose-400" />, workspace: "system", subtab: "settings" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Good Morning, Admin! 👋
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your platform today.
          </p>
        </div>

        {/* Date and Platform Filter Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <button
            onClick={fetchOverviewData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:border-blue-400 transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Row 1: Key Metric Stat Cards (6 in a row matching Image 1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Stat 1: Total Students */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Students
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalStudents.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
              <span className="text-slate-400 font-normal ml-0.5">this month</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Total Content */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Content
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalContent.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+8%</span>
              <span className="text-slate-400 font-normal ml-0.5">this month</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Payment Requests */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Requests
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.pendingPaymentsCount}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <span>{stats.pendingPaymentsCount} pending review</span>
            </div>
          </div>
        </div>

        {/* Stat 5: Device Requests */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Device Requests
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.pendingDevicesCount}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <span>{stats.pendingDevicesCount} pending reset</span>
            </div>
          </div>
        </div>

        {/* Stat 6: Active Staff */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-2xl shadow-xs hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Staff
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.activeStaffCount}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span>All staff active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts & Distribution (Matching Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Platform-wise User Growth Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform-wise User Growth
              </h3>
              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Web Users
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> App Users
                </span>
              </div>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
              {["7D", "30D", "3M", "6M", "1Y"].map(t => (
                <button
                  key={t}
                  onClick={() => setGrowthTimeframe(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    growthTimeframe === t
                      ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0E1629",
                    borderColor: "#1E293B",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                />
                <Line type="monotone" dataKey="web" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="app" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Platform Content Distribution Donut Chart */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Content Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Companies & Modules across platforms
            </p>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalContent}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                Web Only
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{webPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                App Only
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{appPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Both (Web & App)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{bothPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity Tables (Payment Requests & Device Requests) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Payment Requests */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Payment Requests
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("operations", "purchase_requests")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-2.5">Student</th>
                  <th className="pb-2.5">Item / Plan</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {stats.recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No pending payment requests.
                    </td>
                  </tr>
                ) : (
                  stats.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                        {p.userName || "Student"}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">
                        {p.itemName || "Subscription"}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        ₹{p.amount || 0}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (p.status || "").toLowerCase() === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : (p.status || "").toLowerCase() === "rejected"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        }`}>
                          {p.status || "pending"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {(p.status || "").toLowerCase() === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                              title="Approve Payment"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                              title="Reject Payment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Device Requests */}
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Device Requests
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("operations", "device_access")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-2.5">Student</th>
                  <th className="pb-2.5">Current Device</th>
                  <th className="pb-2.5">New Device</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {stats.recentDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No device reset requests.
                    </td>
                  </tr>
                ) : (
                  stats.recentDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                        {d.userName || "Student"}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {d.deviceId ? d.deviceId.substring(0, 10) + "..." : "None"}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                        {d.deviceName || "New Device"}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (d.status || "").toLowerCase() === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : (d.status || "").toLowerCase() === "rejected"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        }`}>
                          {d.status || "pending"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {(d.status || "").toLowerCase() === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveDevice(d.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                              title="Approve Device Reset"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectDevice(d.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                              title="Reject Device Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: 15 Quick Access Navigation Cards (Matching Image 1 Bottom Grid) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Administrative Workspaces & Quick Actions
          </h3>
          <span className="text-xs text-slate-400 font-mono">15 Managed Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {quickAccessTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigateTab(tab.workspace, tab.subtab)}
              className="flex flex-col text-left p-3.5 rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/50 hover:shadow-md transition-all group relative cursor-pointer"
            >
              {tab.badge > 0 && (
                <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 w-fit group-hover:scale-105 transition-transform">
                {tab.icon}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5 group-hover:text-blue-500 transition-colors">
                {tab.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {tab.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
