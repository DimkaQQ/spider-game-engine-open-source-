/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — desktop brand marks
 */
import React from "react";

/* Angular, pointed legs: straight segments with a sharp knee, not soft curves. */
const LEGS_L = [
  "M13.4 12.4 L8 6.8 L3.4 9.8",
  "M12.8 14.8 L6.2 12.6 L2.6 17.2",
  "M12.8 17.6 L6 19 L3.8 25.4",
  "M13.8 20.4 L9.6 23.6 L9.2 29",
];
const mirror = (d) => d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x, y) => `${(32 - parseFloat(x)).toFixed(1)} ${y}`);

/** Spider Engine mark: a hunting spider, angular legs, slit red eyes, fangs. */
export function SpiderMark({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="Spider Engine">
      <defs>
        <linearGradient id="sm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#09090f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sm-bg)" />
      <g fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="miter">
        {LEGS_L.map((d) => (
          <path key={d} d={d} />
        ))}
        {LEGS_L.map((d) => (
          <path key={`r${d}`} d={mirror(d)} />
        ))}
      </g>
      {/* abdomen: pointed, with a hunter mark */}
      <path d="M16 13.4 L20.4 19.4 L16 26.6 L11.6 19.4 Z" fill="#e2e8f0" />
      <path d="M16 17 L18 20.2 L16 23.6 L14 20.2 Z" fill="#dc2626" />
      {/* head + slanted eyes + fangs */}
      <path d="M12.8 9.4 L16 7.6 L19.2 9.4 L18.4 13.2 L13.6 13.2 Z" fill="#e2e8f0" />
      <path d="M13.4 10 L15.3 10.9 L13.8 11.7 Z" fill="#ef4444" />
      <path d="M18.6 10 L16.7 10.9 L18.2 11.7 Z" fill="#ef4444" />
      <path d="M14.4 13 L14.9 14.6 L15.4 13 M16.6 13 L17.1 14.6 L17.6 13" fill="none" stroke="#e2e8f0" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** M4 SPIDER studio mark: forward-leaning M4 with a speed slash, built to feel fast. */
export function M4Mark({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="M4 Spider">
      <defs>
        <linearGradient id="m4-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="0.6" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#be185d" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#m4-bg)" />
      {/* diagonal slash + speed lines */}
      <path d="M21 3 L12 29 L9.4 29 L18.4 3 Z" fill="#fff" fillOpacity=".12" />
      <path d="M2.5 11 H8 M1 16 H6 M3.5 21 H7" stroke="#fff" strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" />
      <g transform="skewX(-12) translate(4.2 0)">
        <text x="17" y="22" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="15.5" letterSpacing="-1" fill="#fff">
          M4
        </text>
      </g>
      <path d="M22 5 L27.5 5 L25 8.4 Z" fill="#fde047" />
    </svg>
  );
}
