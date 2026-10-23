import React from "react";
import { Globe, Smartphone, MonitorSmartphone } from "lucide-react";

/**
 * Reusable "Show on" Selector for Admin Forms
 * Allows selecting: Web + App (both), Web only (web), App only (app)
 */
export function PlatformSelector({ value = "both", onChange, label = "Show on (Platform Target)" }) {
  const currentVal = value || "both";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange("both")}
          className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
            currentVal === "both"
              ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <MonitorSmartphone className="w-4 h-4 text-indigo-500" />
          <span>Web + App</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("web")}
          className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
            currentVal === "web"
              ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm ring-1 ring-purple-500"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Globe className="w-4 h-4 text-purple-500" />
          <span>Web only</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("app")}
          className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
            currentVal === "app"
              ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>App only</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Small platform badge for list items
 */
export function PlatformBadge({ platform = "both" }) {
  const norm = (platform || "both").toLowerCase();

  if (norm === "web") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
        <Globe className="w-3 h-3" />
        <span>Web only</span>
      </span>
    );
  }

  if (norm === "app") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
        <Smartphone className="w-3 h-3" />
        <span>App only</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
      <MonitorSmartphone className="w-3 h-3" />
      <span>Web + App</span>
    </span>
  );
}

/**
 * Platform filter tabs for admin list views (All / Web + App / Web only / App only)
 */
export function PlatformFilterTabs({ selectedPlatform = "all", onSelectPlatform }) {
  const tabs = [
    { id: "all", label: "All" },
    { id: "both", label: "Web + App" },
    { id: "web", label: "Web only" },
    { id: "app", label: "App only" },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit text-xs font-medium">
      {tabs.map((tab) => {
        const isActive = selectedPlatform === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectPlatform(tab.id)}
            className={`px-3 py-1.5 rounded-md transition-all ${
              isActive
                ? "bg-white text-slate-800 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
