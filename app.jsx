/*
 * ============================================================================
 * SPIDER GAME ENGINE — Pocket Studio (mobile edition)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 * The full engine, reshaped for one hand and a thumb:
 *   Studio  live viewport, transform tools, play with a virtual stick
 *   Scene   hierarchy + asset library, search, per-object actions
 *   AI      Spider AI agent (Meta Model API), steerable mid-run
 *   Code    multi-file editor with a code-key row, render to viewport
 *   More    projects, console, settings, licenses
 * Inspector and View live in bottom sheets so the viewport never gets covered
 * by a panel; every target is 44px, the tab bar clears the home indicator.
 * ============================================================================
 */
import React, { useCallback, useEffect, useState } from "react";
import { Boxes, Code2, Layers, MoreHorizontal, Play, Sparkles, Square } from "lucide-react";
import { useStudio } from "./src/mobile/useStudio.js";
import { InspectorSheet, ViewSheet } from "./src/mobile/Sheets.jsx";
import { cx, useToast } from "./src/mobile/ui.jsx";
import Studio from "./src/mobile/Studio.jsx";
import Scene from "./src/mobile/Scene.jsx";
import Chat from "./src/mobile/Chat.jsx";
import Code from "./src/mobile/Code.jsx";
import More from "./src/mobile/More.jsx";

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

const TABS = [
  { id: "studio", label: "Studio", icon: Layers },
  { id: "scene", label: "Scene", icon: Boxes },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "code", label: "Code", icon: Code2 },
  { id: "more", label: "More", icon: MoreHorizontal },
];

/** Apply theme to <html> and keep the browser chrome (status bar) in step. */
function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    const dark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#0a0d14" : "#f6f7fb"));
  }, [theme]);
}

export default function App() {
  const s = useStudio();
  const [tab, setTab] = useState("studio");
  const [inspector, setInspector] = useState(false);
  const [view, setView] = useState(false);
  const [morePage, setMorePage] = useState(null);
  const [toast, toastNode] = useToast();
  useTheme(s.settings.theme);

  const notify = useCallback((text, tone = "ok") => toast(text, tone), [toast]);
  const go = useCallback((id, page = null) => {
    setTab(id);
    if (id === "more") setMorePage(page);
  }, []);

  const onStudio = tab === "studio";
  const keepStudio = onStudio || s.busy;
  const hideChrome = onStudio && s.isPlaying;

  // Opening the inspector from the viewport should not steal the tab.
  const openInspector = useCallback((force = true) => {
    if (force || s.selectedId) setInspector(true);
  }, [s.selectedId]);

  return (
    <div className={cx("sp-app", hideChrome && "is-playing")}>
      <header className="sp-top">
        <button type="button" className="sp-project-btn" onClick={() => go("more", "projects")} aria-label="Switch project">
          <span className="sp-logo" aria-hidden="true">🕷️</span>
          <span className="sp-project-name">
            <small>Spider Pocket</small>
            <b>{s.project.name}</b>
          </span>
        </button>
        <button
          type="button"
          className={cx("sp-play", s.isPlaying && "is-live")}
          onClick={() => {
            if (!s.isPlaying) setTab("studio");
            s.togglePlay();
          }}
          aria-pressed={s.isPlaying}
        >
          {s.isPlaying ? <Square size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          {s.isPlaying ? "Stop" : "Play"}
        </button>
      </header>

      <main className="sp-main">
        {keepStudio && (
          <div className={cx("sp-pane", !onStudio && "is-parked")} aria-hidden={!onStudio}>
            <Studio s={s} notify={notify} onOpenInspector={openInspector} onOpenView={() => setView(true)} onGoAI={() => go("ai")} />
          </div>
        )}
        {tab === "scene" && (
          <div className="sp-pane">
            <Scene s={s} notify={notify} onOpenInspector={openInspector} onShowStudio={() => go("studio")} />
          </div>
        )}
        {tab === "ai" && (
          <div className="sp-pane">
            <Chat s={s} notify={notify} onOpenSettings={() => go("more", "settings")} onShowStudio={() => go("studio")} />
          </div>
        )}
        {tab === "code" && (
          <div className="sp-pane">
            <Code s={s} notify={notify} />
          </div>
        )}
        {tab === "more" && (
          <div className="sp-pane">
            <More s={s} notify={notify} initialPage={morePage} onPageChange={setMorePage} onOpened={() => go("studio")} />
          </div>
        )}
      </main>

      {!hideChrome && (
        <nav className="sp-tabbar" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={cx("sp-tab", tab === t.id && "is-on", t.id === "ai" && s.busy && "is-busy")} aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.id)}>
              <span className="sp-tab-ico">
                <t.icon size={21} strokeWidth={tab === t.id ? 2.4 : 2} />
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}

      <InspectorSheet s={s} open={inspector} onClose={() => setInspector(false)} notify={notify} onFocusStudio={() => { setInspector(false); go("studio"); }} />
      <ViewSheet s={s} open={view} onClose={() => setView(false)} />
      <div className="sp-toast-wrap">{toastNode}</div>
    </div>
  );
}
