/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — desktop brand marks
 */
import React from "react";

const LEGS_L = [
  "M13.2 12.6 C9.4 7.8 6 8 4 11",
  "M12.6 15 C8.6 12.8 5.2 14 3.6 17.4",
  "M12.6 18 C8.4 18 5.6 20 4.6 24",
  "M13.6 21 C11 22.4 9.2 25 9.2 28.2",
];
const mirror = (d) => d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x, y) => `${(32 - parseFloat(x)).toFixed(1)} ${y}`);

/** Spider Engine mark: a spider on a dark tile. Scales cleanly from 16px to 64px. */
export function SpiderMark({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="Spider Engine">
      <defs>
        <linearGradient id="sm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#312e81" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sm-bg)" />
      <g fill="none" stroke="#e0e7ff" strokeWidth="1.5" strokeLinecap="round">
        {LEGS_L.map((d) => (
          <path key={d} d={d} />
        ))}
        {LEGS_L.map((d) => (
          <path key={`r${d}`} d={mirror(d)} />
        ))}
      </g>
      <ellipse cx="16" cy="19" rx="4.1" ry="5.3" fill="#e0e7ff" />
      <circle cx="16" cy="12.2" r="2.7" fill="#e0e7ff" />
      <circle cx="14.9" cy="11.8" r="0.7" fill="#4f46e5" />
      <circle cx="17.1" cy="11.8" r="0.7" fill="#4f46e5" />
      <path d="M16 15.2 V22.5" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** M4 SPIDER studio mark. */
export function M4Mark({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="M4 Spider">
      <defs>
        <linearGradient id="m4-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#m4-bg)" />
      <path d="M5 4 C9 9 9 14 5 19 M5 4 C12 7 18 7 27 4" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1" strokeLinecap="round" />
      <text x="16" y="21.5" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="14" letterSpacing="-0.5" fill="#fff">
        M4
      </text>
      <circle cx="16" cy="25.6" r="1.2" fill="#fff" fillOpacity=".85" />
    </svg>
  );
}
