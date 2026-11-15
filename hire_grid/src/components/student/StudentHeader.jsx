import React, { useState } from "react";
import { Menu, Flame, Search } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";

export function StudentHeader({
  user,
  stats,
  medalInfo,
  activeTab,
  onMenuClick,
  onEditProfile,
  onSearch,
}) {
  const [searchValue, setSearchValue] = useState("");

  const getInitials = (name) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  // Safe fallback metrics
  const streakCount = stats?.streak ?? stats?.dayStreak ?? 0;

  return (
    <header className="h-16 bg-[#FAF7F0] dark:bg-[#111827] border-b border-[#E7E1D5] dark:border-[#374151] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#F3F4F6] hover:bg-[#E8F3EC] dark:hover:bg-[#193B2A] transition cursor-pointer"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Input matching Reference Design */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search companies, subjects, tests, questions..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1F2937] border border-[#E7E1D5] dark:border-[#374151] rounded-xl text-xs sm:text-sm text-[#374151] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#14532D] dark:focus:ring-[#22C55E] focus:border-[#14532D] transition-all shadow-2xs"
          />
        </form>
      </div>

      {/* Right: Streak Indicator, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Streak Indicator matching reference: green pill with green flame */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3EC] dark:bg-[#193B2A] border border-[#14532D]/20 dark:border-[#22C55E]/30 text-[#14532D] dark:text-[#22C55E] text-xs font-semibold shadow-2xs"
          title="Daily Learning Streak"
        >
          <Flame size={14} className="fill-[#14532D] text-[#14532D] dark:fill-[#22C55E] dark:text-[#22C55E]" />
          <span>{streakCount} Day Streak</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle className="ml-0.5" />

        {/* User Profile Info & Button */}
        <button
          onClick={onEditProfile}
          className="flex items-center gap-2.5 pl-2 pr-1 sm:pr-2 py-1 rounded-xl hover:bg-[#E8F3EC]/60 dark:hover:bg-[#1F2937] transition group cursor-pointer"
          title="Open Profile Settings"
        >
          <div className="w-8 h-8 rounded-full bg-[#14532D] dark:bg-[#22C55E] flex items-center justify-center font-bold text-white dark:text-[#111827] text-xs shadow-2xs">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#374151] dark:text-[#F3F4F6] group-hover:text-[#14532D] dark:group-hover:text-[#22C55E] truncate max-w-[130px] leading-tight">
              {user?.name || "kaju"}
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] truncate max-w-[130px]">
              {user?.branch || "Electrical Engineering"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
export default StudentHeader;
