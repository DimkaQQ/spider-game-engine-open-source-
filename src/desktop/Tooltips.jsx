/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — hover tooltips for icon-only controls
 *
 * One delegated listener: any button/link/control that has a title or aria-label,
 * or shows only an icon, gets a styled tooltip after a short hover. The native
 * `title` is moved to data-tip so the browser's own slow tooltip never doubles it.
 */
import React, { useEffect, useRef, useState } from "react";

const ICON_NAMES = {
  "rotate-ccw": "Undo",
  "rotate-cw": "Redo",
  "trash-2": "Delete",
  trash: "Delete",
  "folder-open": "Open folder",
  folder: "Folder",
  plus: "Add",
  download: "Import",
  save: "Save",
  grid: "Grid view",
  x: "Close",
  copy: "Copy",
  "maximize-2": "Fullscreen",
  "minimize-2": "Exit fullscreen",
  camera: "Screenshot",
  "more-vertical": "More",
  search: "Search",
  send: "Send",
  eye: "Show / hide",
  "eye-off": "Show / hide",
  "chevron-down": "Expand",
  "chevron-up": "Collapse",
  terminal: "Console",
  "refresh-cw": "Refresh",
  settings: "Settings",
  "panel-left-close": "Collapse menu",
  "panel-left-open": "Expand menu",
};

function labelFor(el) {
  const own = el.getAttribute("data-tip") || el.getAttribute("title");
  if (own) {
    if (el.hasAttribute("title")) {
      el.setAttribute("data-tip", el.getAttribute("title"));
      el.removeAttribute("title");
    }
    return own.trim();
  }
  const aria = el.getAttribute("aria-label");
  if (aria) return aria.trim();
  const visible = (el.innerText || "").trim();
  if (visible) return ""; // already labelled on screen
  const hidden = (el.textContent || "").trim(); // label hidden by a narrow-panel rule
  if (hidden) return hidden;
  const svg = el.querySelector("svg");
  if (svg) {
    const m = String(svg.getAttribute("class") || "").match(/lucide-([a-z0-9-]+)/);
    if (m) return ICON_NAMES[m[1]] || m[1].replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  }
  return "";
}

export default function AutoTooltips() {
  const [tip, setTip] = useState(null);
  const timer = useRef(null);
  const current = useRef(null);

  useEffect(() => {
    const hide = () => {
      clearTimeout(timer.current);
      current.current = null;
      setTip(null);
    };
    const over = (e) => {
      const el = e.target?.closest?.("button, a, [role='button'], [role='tab'], [data-tip], [title], summary, label[for]");
      if (!el || el === current.current) return;
      hide();
      const text = labelFor(el);
      if (!text) return;
      current.current = el;
      timer.current = setTimeout(() => {
        if (!document.contains(el)) return;
        const r = el.getBoundingClientRect();
        setTip({ text, x: r.left + r.width / 2, top: r.top, bottom: r.bottom });
      }, 350);
    };
    const out = (e) => {
      if (current.current && !current.current.contains(e.relatedTarget)) hide();
    };
    document.addEventListener("mouseover", over, true);
    document.addEventListener("mouseout", out, true);
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("mouseover", over, true);
      document.removeEventListener("mouseout", out, true);
      document.removeEventListener("mousedown", hide, true);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("blur", hide);
      clearTimeout(timer.current);
    };
  }, []);

  if (!tip) return null;
  const below = tip.top < 44;
  const x = Math.min(Math.max(tip.x, 90), window.innerWidth - 90);
  return (
    <div className={`sp-tip ${below ? "is-below" : ""}`} style={{ left: x, top: below ? tip.bottom + 8 : tip.top - 8 }} role="tooltip">
      {tip.text}
    </div>
  );
}
