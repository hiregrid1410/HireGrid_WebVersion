import React from "react";

export function ProgressCircuitLoader({
  progress = 0,
  indeterminate = false,
  label = "Loading...",
  fullScreen = false,
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (indeterminate ? 0.3 : Math.min(Math.max(progress, 0), 100) / 100));

  const content = (
    <div className="flex flex-col items-center justify-center space-y-6 text-center select-none p-6 animate-in fade-in duration-300">
      {/* Visual Reference 1: Animated SVG Circuit Loader */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Background glow shadow */}
        <div className="absolute inset-8 rounded-full bg-emerald-500/5 blur-xl animate-pulse"></div>

        <svg width="220" height="220" viewBox="0 0 220 220" className="relative drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <defs>
            <linearGradient id="circuitLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" /> {/* Emerald */}
              <stop offset="50%" stopColor="#06B6D4" /> {/* Cyan */}
              <stop offset="100%" stopColor="#2563EB" /> {/* Blue */}
            </linearGradient>
          </defs>

          {/* Outer circuit ring (rotating) */}
          <circle
            cx="110"
            cy="110"
            r="94"
            stroke="rgba(6, 182, 212, 0.1)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="40 20 10 30"
            className="animate-spin"
            style={{ animationDuration: "16s" }}
          />

          {/* Inner rotating accent ring */}
          <circle
            cx="110"
            cy="110"
            r="84"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="10 30 50 15"
            className="animate-spin"
            style={{ animationDuration: "10s", animationDirection: "reverse" }}
          />

          {/* Main Progress Ring */}
          <circle
            cx="110"
            cy="110"
            r="72"
            stroke="url(#circuitLoaderGrad)"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={indeterminate ? "animate-spin" : "transition-all duration-300 ease-out"}
            style={indeterminate ? { animationDuration: "2s", transformOrigin: "center" } : {}}
          />

          {/* Circular inner frame */}
          <circle
            cx="110"
            cy="110"
            r="62"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="1"
            fill="none"
          />

          {/* Left PCB Circuit Nodes */}
          <g stroke="url(#circuitLoaderGrad)" strokeWidth="1.5" fill="none" opacity="0.75" className="hidden sm:block">
            <path d="M 38 110 L 10 110" />
            <circle cx="10" cy="110" r="3.5" fill="#10B981" />
            
            <path d="M 42 95 L 22 95 L 14 85" />
            <circle cx="14" cy="85" r="3.5" fill="#06B6D4" />
            
            <path d="M 42 125 L 22 125 L 14 135" />
            <circle cx="14" cy="135" r="3.5" fill="#2563EB" />
          </g>

          {/* Right PCB Circuit Nodes */}
          <g stroke="url(#circuitLoaderGrad)" strokeWidth="1.5" fill="none" opacity="0.75" className="hidden sm:block">
            <path d="M 182 110 L 210 110" />
            <circle cx="210" cy="110" r="3.5" fill="#10B981" />
            
            <path d="M 178 95 L 198 95 L 206 85" />
            <circle cx="206" cy="85" r="3.5" fill="#06B6D4" />
            
            <path d="M 178 125 L 198 125 L 206 135" />
            <circle cx="206" cy="135" r="3.5" fill="#2563EB" />
          </g>

          {/* Center Text (Numerical progress or pulsing indicator) */}
          {!indeterminate && (
            <text
              x="110"
              y="119"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace"
              className="tracking-tight"
            >
              {Math.round(progress)}%
            </text>
          )}
        </svg>

        {/* Indeterminate central pulsing indicator */}
        {indeterminate && (
          <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
            <div className="absolute w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ping"></div>
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_12px_#10B981] animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Label under loader */}
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-100 uppercase tracking-widest animate-pulse font-mono">
          {label}
        </p>
        {!indeterminate && progress > 0 && (
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
            Please wait, processing task...
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#070D19] flex items-center justify-center overflow-hidden">
        {/* Ambient background glow points */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        {content}
      </div>
    );
  }

  return content;
}
