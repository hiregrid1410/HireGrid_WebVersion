import React from "react";

/**
 * SecurityIllustration — Lightweight SVG-only security visual for operator login.
 * Shield + lock + orbital ring with nodes. No images, no animation libraries.
 */
export default function SecurityIllustration() {
  return (
    <svg
      viewBox="0 0 280 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-[280px]"
      aria-hidden="true"
      role="presentation"
    >
      {/* Definitions */}
      <defs>
        <radialGradient id="shieldGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow circle */}
      <circle cx="140" cy="170" r="120" fill="url(#glowGrad)" />

      {/* Outer orbital ring */}
      <ellipse
        cx="140"
        cy="170"
        rx="118"
        ry="118"
        stroke="rgba(37,99,235,0.18)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />

      {/* Middle orbital ring */}
      <ellipse
        cx="140"
        cy="170"
        rx="88"
        ry="88"
        stroke="rgba(59,130,246,0.15)"
        strokeWidth="1"
        strokeDasharray="3 8"
      />

      {/* Orbital nodes — outer ring */}
      {/* Top */}
      <circle cx="140" cy="52" r="5" fill="#2563EB" opacity="0.70" filter="url(#glow)" />
      <circle cx="140" cy="52" r="2.5" fill="#60A5FA" />
      {/* Right */}
      <circle cx="258" cy="170" r="5" fill="#2563EB" opacity="0.70" filter="url(#glow)" />
      <circle cx="258" cy="170" r="2.5" fill="#60A5FA" />
      {/* Bottom-left */}
      <circle cx="57" cy="253" r="4" fill="#1D4ED8" opacity="0.60" filter="url(#glow)" />
      <circle cx="57" cy="253" r="2" fill="#93C5FD" />
      {/* Top-right */}
      <circle cx="228" cy="87" r="4" fill="#1D4ED8" opacity="0.55" filter="url(#glow)" />
      <circle cx="228" cy="87" r="2" fill="#93C5FD" />
      {/* Bottom-right */}
      <circle cx="225" cy="258" r="3.5" fill="#2563EB" opacity="0.50" />
      <circle cx="225" cy="258" r="1.8" fill="#BFDBFE" />

      {/* Connector lines */}
      <line x1="140" y1="57" x2="228" y2="87" stroke="rgba(59,130,246,0.18)" strokeWidth="1" />
      <line x1="228" y1="87" x2="258" y2="170" stroke="rgba(59,130,246,0.18)" strokeWidth="1" />
      <line x1="140" y1="57" x2="57" y2="253" stroke="rgba(59,130,246,0.12)" strokeWidth="1" strokeDasharray="3 5" />

      {/* Shield body */}
      <path
        d="M140 75 L200 100 L200 155 C200 195 170 220 140 235 C110 220 80 195 80 155 L80 100 Z"
        fill="url(#shieldGrad)"
        stroke="rgba(59,130,246,0.55)"
        strokeWidth="1.5"
        filter="url(#softGlow)"
      />

      {/* Shield inner border */}
      <path
        d="M140 84 L192 106 L192 153 C192 188 166 211 140 225 C114 211 88 188 88 153 L88 106 Z"
        fill="none"
        stroke="rgba(96,165,250,0.22)"
        strokeWidth="1"
      />

      {/* Shield top accent line */}
      <path
        d="M110 110 L170 110"
        stroke="rgba(96,165,250,0.30)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Lock body — shackle */}
      <path
        d="M125 152 L125 143 C125 131 155 131 155 143 L155 152"
        stroke="#60A5FA"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
      />

      {/* Lock body — case */}
      <rect
        x="118"
        y="152"
        width="44"
        height="34"
        rx="6"
        fill="rgba(37,99,235,0.40)"
        stroke="#3B82F6"
        strokeWidth="1.5"
        filter="url(#glow)"
      />

      {/* Lock keyhole circle */}
      <circle cx="140" cy="166" r="6" fill="rgba(6,24,48,0.70)" stroke="#60A5FA" strokeWidth="1.5" />

      {/* Lock keyhole slot */}
      <rect x="138" y="168" width="4" height="8" rx="2" fill="#60A5FA" opacity="0.80" />

      {/* Data nodes — bottom floating */}
      {/* Node 1 — left */}
      <rect x="22" y="168" width="30" height="30" rx="8"
        fill="rgba(37,99,235,0.12)" stroke="rgba(59,130,246,0.35)" strokeWidth="1"
      />
      {/* person icon in node */}
      <circle cx="37" cy="177" r="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <path d="M29 192 C29 186 45 186 45 192" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Node 2 — upper right */}
      <rect x="228" y="30" width="30" height="30" rx="8"
        fill="rgba(37,99,235,0.12)" stroke="rgba(59,130,246,0.35)" strokeWidth="1"
      />
      {/* grid icon in node */}
      <line x1="235" y1="41" x2="251" y2="41" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="235" y1="45" x2="251" y2="45" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="235" y1="49" x2="244" y2="49" stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" />

      {/* Node 3 — bottom right */}
      <rect x="228" y="278" width="30" height="30" rx="8"
        fill="rgba(37,99,235,0.12)" stroke="rgba(59,130,246,0.35)" strokeWidth="1"
      />
      {/* shield-small icon */}
      <path d="M243 285 L250 288 L250 294 C250 298 246 301 243 303 C240 301 236 298 236 294 L236 288 Z"
        fill="none" stroke="#60A5FA" strokeWidth="1.5" />

      {/* Connector lines to nodes */}
      <line x1="52" y1="183" x2="80" y2="170" stroke="rgba(59,130,246,0.20)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="228" y1="45" x2="200" y2="100" stroke="rgba(59,130,246,0.20)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="228" y1="285" x2="200" y2="210" stroke="rgba(59,130,246,0.20)" strokeWidth="1" strokeDasharray="3 4" />

      {/* Center glow */}
      <circle cx="140" cy="169" r="40" fill="url(#centerGlow)" />
    </svg>
  );
}
