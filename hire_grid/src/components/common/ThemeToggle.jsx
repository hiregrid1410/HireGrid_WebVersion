import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved !== null) {
      return saved === "dark";
    }
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-between w-14 h-8 px-1 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        isDark ? "bg-slate-800 border border-slate-700 text-amber-400" : "bg-emerald-100 border border-emerald-300 text-emerald-700"
      } ${className}`}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label="Toggle theme"
    >
      <Sun className={`w-4 h-4 transition-opacity duration-300 ${isDark ? "opacity-40 text-slate-400" : "opacity-100 text-amber-500"}`} />
      <Moon className={`w-4 h-4 transition-opacity duration-300 ${isDark ? "opacity-100 text-indigo-300" : "opacity-40 text-slate-500"}`} />
      <span
        className={`absolute w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? "translate-x-6 bg-slate-900 border border-slate-700" : "translate-x-0 bg-white"
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}
