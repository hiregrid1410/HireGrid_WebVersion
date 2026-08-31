import React from "react";

// Base Shimmer block
export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl bg-slate-900 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function TextSkeleton({ width = "100%", height = "12px", className = "" }) {
  return <Skeleton className={`h-3 ${className}`} style={{ width, height }} />;
}

export function AvatarSkeleton({ size = "40px", className = "" }) {
  return <Skeleton className={`rounded-full shrink-0 ${className}`} style={{ width: size, height: size }} />;
}

// KPI Dashboard stats
export function KPICardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-850 p-5 rounded-2xl h-28 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <TextSkeleton width="45%" height="10px" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <TextSkeleton width="30%" height="24px" className="mt-2" />
          <TextSkeleton width="60%" height="9px" className="mt-1" />
        </div>
      ))}
    </div>
  );
}

// Dashboard wrapper layout skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Row */}
      <KPICardsSkeleton />

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left main pane */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4">
            <TextSkeleton width="25%" height="16px" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right side pane */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4">
            <TextSkeleton width="40%" height="14px" />
            <div className="flex items-center gap-3">
              <AvatarSkeleton size="44px" />
              <div className="flex-1 space-y-2">
                <TextSkeleton width="70%" />
                <TextSkeleton width="40%" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AvatarSkeleton size="44px" />
              <div className="flex-1 space-y-2">
                <TextSkeleton width="60%" />
                <TextSkeleton width="30%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tables Skeleton
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-slate-850 flex items-center justify-between">
        <TextSkeleton width="20%" height="14px" />
        <TextSkeleton width="15%" height="14px" />
      </div>
      <div className="p-6 space-y-6">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex justify-between items-center gap-4 border-b border-slate-850/40 pb-4 last:border-b-0 last:pb-0">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="flex-1 space-y-2">
                <TextSkeleton width={cIdx === 0 ? "75%" : "50%"} />
                {cIdx === 0 && <TextSkeleton width="40%" height="8px" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Company directory cards
export function CompanyCardSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[180px] space-y-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <TextSkeleton width="60%" height="14px" />
          <TextSkeleton width="40%" height="9px" />
        </div>
      ))}
    </div>
  );
}

// Module card list
export function ModuleCardSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border border-slate-850 rounded-2xl bg-slate-900 flex flex-col justify-between min-h-[220px] space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <TextSkeleton width="70%" height="16px" />
              <Skeleton className="w-16 h-5 rounded" />
            </div>
            <TextSkeleton width="30%" height="10px" className="mt-1" />
            <div className="space-y-1.5 pt-3">
              <TextSkeleton width="95%" />
              <TextSkeleton width="80%" />
              <TextSkeleton width="60%" />
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-850/50">
            <div className="flex gap-4">
              <TextSkeleton width="20%" height="9px" />
              <TextSkeleton width="25%" height="9px" />
            </div>
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Premium plans
export function PlanCardSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-850 rounded-3xl p-8 flex flex-col justify-between h-[500px] relative overflow-hidden space-y-6">
          <div className="space-y-4">
            <TextSkeleton width="40%" height="16px" />
            <TextSkeleton width="80%" height="10px" />
            <div className="py-4">
              <TextSkeleton width="50%" height="32px" />
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-850/50">
              <TextSkeleton width="90%" />
              <TextSkeleton width="85%" />
              <TextSkeleton width="90%" />
              <TextSkeleton width="70%" />
            </div>
          </div>
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// Leaderboard list
export function LeaderboardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-5">
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <TextSkeleton width="30%" height="14px" />
        <TextSkeleton width="15%" height="14px" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-850/40 last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <AvatarSkeleton size="36px" />
              <div className="space-y-1.5">
                <TextSkeleton width="90px" />
                <TextSkeleton width="60px" height="8px" />
              </div>
            </div>
            <TextSkeleton width="50px" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Placement Missions
export function MissionsSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-5">
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <TextSkeleton width="40%" height="14px" />
        <TextSkeleton width="10%" height="14px" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850/50">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <TextSkeleton width="60%" />
              <TextSkeleton width="30%" />
            </div>
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile detail
export function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="lg:col-span-4 bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col items-center text-center space-y-6">
        <AvatarSkeleton size="96px" />
        <TextSkeleton width="60%" height="18px" />
        <TextSkeleton width="40%" height="10px" />
        <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-slate-850">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
      <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
        <TextSkeleton width="30%" height="16px" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <TextSkeleton width="40%" height="9px" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <TextSkeleton width="40%" height="9px" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <TextSkeleton width="40%" height="9px" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <TextSkeleton width="40%" height="9px" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
