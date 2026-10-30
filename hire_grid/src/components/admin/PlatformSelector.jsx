import React, { useState } from "react";
import { Globe, Smartphone, MonitorSmartphone, AlertTriangle } from "lucide-react";

/**
 * Reusable "Publish to" Selector for Admin / Content Manager Forms
 * Required field with clear labels for Web, App, Both.
 */
export function PlatformSelector({ 
  value = "both", 
  onChange, 
  label = "Publish to (Platform Target) *", 
  required = true 
}) {
  const currentVal = value || "both";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onChange("both")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all ${
            currentVal === "both"
              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm ring-2 ring-indigo-400"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          <MonitorSmartphone className="w-4 h-4 text-indigo-500" />
          <span>Both (Web & App)</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("web")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all ${
            currentVal === "web"
              ? "bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm ring-2 ring-purple-400"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Globe className="w-4 h-4 text-purple-500" />
          <span>Web only</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("app")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all ${
            currentVal === "app"
              ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-400"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>App only</span>
        </button>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Choose where students can discover and attempt this content.
      </p>
    </div>
  );
}

/**
 * Small platform badge for list items & cards
 */
export function PlatformBadge({ platform = "both" }) {
  const norm = (platform || "both").toLowerCase();

  if (norm === "web") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        <Globe className="w-3 h-3" />
        <span>Web only</span>
      </span>
    );
  }

  if (norm === "app") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <Smartphone className="w-3 h-3" />
        <span>App only</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
      <MonitorSmartphone className="w-3 h-3" />
      <span>Both</span>
    </span>
  );
}

/**
 * Platform filter tabs for admin list views (All | Web only | App only | Both) with counts
 */
export function PlatformFilterTabs({ selectedPlatform = "all", onSelectPlatform, counts = null }) {
  const tabs = [
    { id: "all", label: "All", count: counts?.all },
    { id: "web", label: "Web only", count: counts?.web },
    { id: "app", label: "App only", count: counts?.app },
    { id: "both", label: "Both", count: counts?.both },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit text-xs font-medium border border-slate-200 dark:border-slate-700">
      {tabs.map((tab) => {
        const isActive = selectedPlatform === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectPlatform(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-100"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Prominent Segmented Switch for Content Manager Dashboard
 * Switches between "Web Content" and "App Content" and remembers choice in localStorage.
 */
export function ContentManagerSegmentedSwitch({ selectedPart = "web", onChange }) {
  return (
    <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300/80 dark:border-slate-700 shadow-inner">
      <button
        type="button"
        onClick={() => onChange("web")}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
          selectedPart === "web"
            ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-md ring-1 ring-purple-400/50"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Globe className={`w-4 h-4 ${selectedPart === "web" ? "text-purple-600 dark:text-purple-400" : ""}`} />
        <span>Web Content</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("app")}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
          selectedPart === "app"
            ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-emerald-400/50"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Smartphone className={`w-4 h-4 ${selectedPart === "app" ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
        <span>App Content</span>
      </button>
    </div>
  );
}

/**
 * Confirmation dialog for platform change impact preview (D11)
 */
export function PlatformImpactConfirmDialog({ isOpen, onConfirm, onCancel, oldPlatform, newPlatform, itemName = "item" }) {
  if (!isOpen) return null;

  const getImpactMessage = () => {
    if (oldPlatform === "both" && newPlatform === "web") {
      return `Changing "${itemName}" to Web only will immediately hide it from all mobile app students. Previous test scores and attempt history will remain visible in their profile, but no new attempts can be taken on mobile.`;
    }
    if (oldPlatform === "both" && newPlatform === "app") {
      return `Changing "${itemName}" to App only will immediately hide it from the website. Existing attempts and scores are preserved, but web students will no longer see this item.`;
    }
    if (oldPlatform === "web" && newPlatform === "app") {
      return `Moving "${itemName}" from Web to App will hide it on the website and make it discoverable only in the mobile app.`;
    }
    if (oldPlatform === "app" && newPlatform === "web") {
      return `Moving "${itemName}" from App to Web will hide it in the mobile app and make it discoverable only on the website.`;
    }
    return `Changing target platform from "${oldPlatform}" to "${newPlatform}".`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950/50 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Platform Visibility Change</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Impact preview (D11)</p>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          {getImpactMessage()}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
}
