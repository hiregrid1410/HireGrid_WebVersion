import React from "react";
import {
  Layout,
  BookOpen,
  Building2,
  Award,
  Trophy,
  CreditCard,
  BarChart2,
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
    { id: "notifications", label: "Notifications", icon: Bell, target: "dashboard", hasDot: true },
    { id: "help-support", label: "Help & Support", icon: HelpCircle, target: "feedback" },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#FAF7F0] dark:bg-[#111827] border-r border-[#E7E1D5] dark:border-[#374151] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Top Header / Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E7E1D5] dark:border-[#374151] shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {sidebarOpen ? (
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-[#374151] dark:text-[#F3F4F6]">
                HireGrid<span className="text-[#14532D] dark:text-[#22C55E]">X</span>
              </span>
            </div>
          ) : (
            <button
              onClick={onToggleSidebar}
              className="mx-auto p-1 text-xl font-bold text-[#374151] dark:text-[#F3F4F6] hover:text-[#14532D] transition cursor-pointer"
              title="Expand Sidebar"
            >
              H<span className="text-[#14532D] dark:text-[#22C55E]">X</span>
            </button>
          )}
        </div>
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#374151] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-[#E8F3EC] dark:hover:bg-[#193B2A] transition hidden lg:flex cursor-pointer"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-200 ${!sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === "dashboard" && activeTab === "dashboard") ||
            (item.id === "my-learning" && activeTab === "general") ||
            (item.id === "companies" && activeTab === "companies") ||
            (item.id === "placement-missions" && activeTab === "placement-mission") ||
            (item.id === "my-plans" && activeTab === "plans") ||
            (item.id === "device-security" && activeTab === "profile") ||
            (item.id === "help-support" && activeTab === "feedback");

          return (
            <button
              key={item.id}
              onClick={() => onTabSelect(item.target)}
              title={item.label}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group cursor-pointer ${
                isActive
                  ? "bg-[#14532D] text-white shadow-xs dark:bg-[#22C55E] dark:text-[#111827]"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F3F4F6] hover:bg-[#E8F3EC]/70 dark:hover:bg-[#1F2937]"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-white dark:text-[#111827]"
                      : "text-[#6B7280] dark:text-[#9CA3AF] group-hover:text-[#14532D] dark:group-hover:text-[#22C55E]"
                  }`}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </div>

              {sidebarOpen && item.hasDot && (
                <span className="w-2 h-2 rounded-full bg-[#15803D] dark:bg-[#22C55E] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Sign Out */}
      <div className="p-3 border-t border-[#E7E1D5] dark:border-[#374151]">
        {sidebarOpen ? (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold text-[#14532D] dark:text-[#22C55E] hover:bg-[#E8F3EC] dark:hover:bg-[#193B2A] rounded-xl transition cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={onLogout}
            title="Sign Out"
            className="w-10 h-10 mx-auto rounded-xl text-[#14532D] dark:text-[#22C55E] hover:bg-[#E8F3EC] dark:hover:bg-[#193B2A] flex items-center justify-center transition cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
export default StudentSidebar;
