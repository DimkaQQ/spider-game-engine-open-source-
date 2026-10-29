/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: viewport tab
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useCallback, useRef, useState } from "react";
import {
  Camera, ChevronUp, Copy, Eye, EyeOff, MousePointer2, Move, Redo2, Rotate3d, Scale3d,
  SlidersHorizontal, Bot, Trash2, Undo2, Coins as CoinsIcon,
} from "lucide-react";
import GameViewport, { viewportApi } from "../engine/GameViewport.jsx";
import { cx } from "./ui.jsx";

const GIZMOS = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "move", icon: Move, label: "Move" },
  { id: "rotate", icon: Rotate3d, label: "Rotate" },
  { id: "scale", icon: Scale3d, label: "Scale" },
];

const CAMERAS = [
  { id: "Viewport", label: "Free" },
  { id: "Game View", label: "Game" },
  { id: "Cinematic", label: "Cine" },
];

/** Virtual stick: writes analog jx/jz into the engine key map (changes throttled to ~16 steps). */
function Joystick({ onChange }) {
  const base = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const last = useRef("");
  const R = 44;

  const apply = (e) => {
    const r = base.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    const jx = Math.abs(dx) < 8 ? 0 : Number((dx / R).toFixed(1));
    const jz = Math.abs(dy) < 8 ? 0 : Number((-dy / R).toFixed(1));
    const sig = `${jx}|${jz}`;
    if (sig !== last.current) {
      last.current = sig;
      onChange({ jx, jz });
    }
  };
  const end = () => {
    setKnob({ x: 0, y: 0 });
    last.current = "";
    onChange({ jx: 0, jz: 0 });
  };
  return (
    <div
      ref={base}
      className="sp-stick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e);
      }}
      onPointerMove={(e) => e.buttons && apply(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Movement stick"
    >
      <span className="sp-stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

export default function Studio({ s, onOpenInspector, onOpenView, notify, onGoAI, desktop = false }) {
  const {
    groups, selectedId, setSelectedId, selected, isPlaying, gizmo, setGizmo, cameraMode, setCameraMode,
    settings, activeJsx, activeJsxName, setFps, fps, keys, setKeys, jump, score, coins, togglePlay,
    undo, redo, undoCount, toggleVisible, duplicate, removeNode, onViewportTransform, timeOfDay, files, resetScore,
  } = s;

  const left = coins.filter((c) => !c.taken).length;
  const customGame = Boolean(activeJsx);

  const shot = useCallback(() => {
    try {
      const url = viewportApi.capture?.(true, 1280);
      notify(url ? "Screenshot saved" : "Viewport not ready yet", url ? "ok" : "warn");
    } catch {
      notify("Screenshot failed", "warn");
    }
  }, [notify]);

  const empty = !activeJsx && groups.every((g) => !(g.children || []).length);

  return (
    <section className="sp-studio">
      <div className="sp-viewport">
        <GameViewport
          sceneGroups={groups}
          selectedNodeId={selectedId}
          onSelectNode={setSelectedId}
          onTransformNode={onViewportTransform}
          isPlaying={isPlaying}
          keysPressed={keys}
          timeOfDay={timeOfDay}
          rtxEnabled={settings.rtx}
          showGrid={settings.grid}
          viewMode={settings.viewMode}
          activeGizmo={gizmo}
          cameraZoom={settings.zoom}
          projection={settings.projection}
          space={settings.space}
          cameraMode={cameraMode}
          coins={coins}
          onFps={setFps}
          activeJsxCode={activeJsx}
          activeJsxName={activeJsxName || "GameComponent.jsx"}
          projectFiles={files}
        />

        {/* top-right quick actions */}
        <div className="sp-float sp-float-tr">
          {!isPlaying && (
            <>
              <button type="button" className="sp-fab" onClick={undo} disabled={!undoCount.u} aria-label="Undo">
                <Undo2 size={18} />
              </button>
              <button type="button" className="sp-fab" onClick={redo} disabled={!undoCount.r} aria-label="Redo">
                <Redo2 size={18} />
              </button>
            </>
          )}
          <button type="button" className="sp-fab" onClick={shot} aria-label="Screenshot">
            <Camera size={18} />
          </button>
          <button type="button" className="sp-fab" onClick={onOpenView} aria-label="View options">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* tool rail */}
        {!isPlaying && (
          <div className="sp-float sp-float-tl sp-rail" role="toolbar" aria-label="Transform tools">
            {GIZMOS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={cx("sp-rail-btn", gizmo === g.id && "is-on")}
                aria-label={g.label}
                aria-pressed={gizmo === g.id}
                onClick={() => setGizmo(g.id)}
              >
                <g.icon size={19} />
              </button>
            ))}
          </div>
        )}

        {fps > 0 && <div className="sp-fps">{fps} fps</div>}

        {/* play HUD */}
        {isPlaying && (
          <>
            {!customGame && (
              <div className="sp-hud" aria-live="polite">
                <span className="sp-hud-pill">
                  <CoinsIcon size={14} /> <b>{score}</b>
                </span>
                <span className="sp-hud-pill">{left} left</span>
                {left === 0 && (
                  <button type="button" className="sp-hud-pill is-action" onClick={resetScore}>
                    Replay
                  </button>
                )}
              </div>
            )}
            {!customGame && desktop && <div className="sp-hud-keys">WASD to move · Space to jump</div>}
            {!customGame && !desktop && (
              <>
                <Joystick onChange={(v) => setKeys((k) => ({ ...k, ...v }))} />
                <button
                  type="button"
                  className="sp-jump"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    jump();
                  }}
                >
                  Jump
                </button>
              </>
            )}
          </>
        )}

        {/* camera pills */}
        {!isPlaying && (
          <div className="sp-cams" role="radiogroup" aria-label="Camera">
            {CAMERAS.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={cameraMode === c.id} className={cx(cameraMode === c.id && "is-on")} onClick={() => setCameraMode(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {empty && !isPlaying && (
          <div className="sp-hint-card">
            <b>Blank level</b>
            <span>Add something from Scene, or ask the AI to build a game.</span>
            <button type="button" onClick={onGoAI}>
              <Bot size={14} /> Ask AI
            </button>
          </div>
        )}
      </div>

      {/* selection dock (above tab bar, never over the stick) */}
      {!isPlaying && !desktop && selected && (
        <div className="sp-dock">
          <button type="button" className="sp-dock-main" onClick={() => onOpenInspector(true)} aria-label="Open inspector">
            <span className="sp-dot" style={{ background: selected.tint || selected.color || "#6366f1" }} />
            <span className="sp-dock-text">
              <b>{selected.name || selected.id}</b>
              <small>
                {Math.round(selected.pos?.x ?? 0)}, {Math.round(selected.pos?.y ?? 0)}, {Math.round(selected.pos?.z ?? 0)}
              </small>
            </span>
            <ChevronUp size={16} />
          </button>
          <button type="button" className="sp-icon-btn" onClick={() => toggleVisible(selected.id)} aria-label={selected.visible === false ? "Show" : "Hide"}>
            {selected.visible === false ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button type="button" className="sp-icon-btn" onClick={() => duplicate(selected.id)} aria-label="Duplicate">
            <Copy size={18} />
          </button>
          <button
            type="button"
            className="sp-icon-btn is-danger"
            onClick={() => {
              removeNode(selected.id);
              notify(`Removed ${selected.name || selected.id}`, "ok");
            }}
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

