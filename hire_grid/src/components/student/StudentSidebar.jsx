import React from "react";
import {
  Layout,
  BookOpen,
  Building2,
  Trophy,
  CreditCard,
  BarChart2,
  Award,
  Wallet,
  ShieldCheck,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
} from "lucide-react";

export function StudentSidebar({
  activeTab,
  onTabSelect,
  user,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Layout, target: "dashboard" },
    { id: "my-learning", label: "My Learning", icon: BookOpen, target: "general" },
    { id: "companies", label: "Companies", icon: Building2, target: "companies" },
    { id: "exams", label: "Exams", icon: Award, target: "companies" },
    { id: "placement-missions", label: "Placement Missions", icon: Trophy, target: "placement-mission" },
    { id: "my-plans", label: "My Plans", icon: CreditCard, target: "plans" },
    { id: "analytics", label: "Analytics", icon: BarChart2, target: "dashboard" },
    { id: "leaderboard", label: "Leaderboard", icon: Award, target: "placement-mission" },
    { id: "payments", label: "Payments", icon: Wallet, target: "plans" },
    { id: "device-security", label: "Device & Security", icon: ShieldCheck, target: "profile" },
    { id: "notifications", label: "Notifications", icon: Bell, target: "dashboard" },
    { id: "help-support", label: "Help & Support", icon: HelpCircle, target: "feedback" },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Top Header / Logo */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          {sidebarOpen ? (
            <img
              src="/dark_logo.png"
              alt="HireGrid"
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <img
              src="/dark_logo.png"
              alt="HireGrid"
              className="h-7 w-auto max-w-[36px] object-contain"
            />
          )}
        </div>
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden lg:flex"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-200 ${!sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.target &&
            (item.id === "dashboard"
              ? activeTab === "dashboard"
              : item.id === "companies"
              ? activeTab === "companies"
              : item.id === "placement-missions"
              ? activeTab === "placement-mission"
              : item.id === "my-plans"
              ? activeTab === "plans"
              : activeTab === item.target);

          return (
            <button
              key={item.id}
              onClick={() => onTabSelect(item.target)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                }`}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Sign Out */}
      {sidebarOpen ? (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-800/80 flex flex-col items-center gap-2">
          <button
            onClick={onLogout}
            title="Logout"
            className="w-10 h-10 rounded-xl text-rose-400 hover:bg-rose-950/30 flex items-center justify-center transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
