import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-between w-14 h-8 px-1 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#14532D]/50 cursor-pointer ${
        isDark ? "bg-[#1F2937] border border-[#374151] text-[#FBBF24]" : "bg-[#E8F3EC] border border-[#E7E1D5] text-[#14532D]"
      } ${className}`}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label="Toggle theme"
    >
      <Sun className={`w-4 h-4 transition-opacity duration-300 ${isDark ? "opacity-40 text-[#6B7280]" : "opacity-100 text-[#B45309]"}`} />
      <Moon className={`w-4 h-4 transition-opacity duration-300 ${isDark ? "opacity-100 text-[#22C55E]" : "opacity-40 text-[#9CA3AF]"}`} />
      <span
        className={`absolute w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? "translate-x-6 bg-[#111827] border border-[#374151]" : "translate-x-0 bg-white"
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-[#22C55E]" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#B45309]" />
        )}
      </span>
    </button>
  );
}
