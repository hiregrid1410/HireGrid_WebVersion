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
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  // Safe fallback metrics
  const streakCount = stats?.streak ?? stats?.dayStreak ?? 12;

  return (
    <header className="std-header bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Input matching Reference Image 3 */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search companies, subjects, tests, questions..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/70 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right: Gamification Badges, Notifications, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Streak Indicator */}
        <div 
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm"
          title="Daily Learning Streak"
        >
          <Flame size={15} className="fill-amber-400 text-amber-400 animate-pulse" />
          <span>{streakCount} Day Streak</span>
        </div>



        {/* Theme Toggle */}
        <ThemeToggle className="ml-0.5" />

        {/* User Profile Info & Button */}
        <button
          onClick={onEditProfile}
          className="flex items-center gap-2.5 pl-2 pr-1 sm:pr-3 py-1 rounded-xl hover:bg-slate-800/80 transition group border border-transparent hover:border-slate-700/60"
          title="Open Profile Settings"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-md group-hover:scale-105 transition-transform">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate max-w-[130px]">
              {user?.name || "Rahul Sharma"}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
              {user?.branch || "Computer Engineering"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
