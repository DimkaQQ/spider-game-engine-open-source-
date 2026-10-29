/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio sheets: Inspector + View
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React from "react";
import { Copy, Eye, EyeOff, Pause, Play, Trash2, Crosshair } from "lucide-react";
import { MATERIAL_PRESETS } from "../game/index.js";
import { NumField, Range, Segmented, Sheet, Swatches, Toggle, cx } from "./ui.jsx";

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#f8fafc", "#64748b", "#111827"];

function Vec3({ title, value, onChange, step, min, tone = true, decimals = 2 }) {
  const v = value || { x: 0, y: 0, z: 0 };
  return (
    <div className="sp-vec">
      <h4>{title}</h4>
      <div className="sp-vec-row">
        {["x", "y", "z"].map((a) => (
          <NumField key={a} label={a.toUpperCase()} tone={tone ? a : undefined} value={v[a] ?? 0} step={step} min={min} decimals={decimals} onChange={(n) => onChange({ ...v, [a]: n })} />
        ))}
      </div>
    </div>
  );
}

export function InspectorSheet({ s, open, onClose, onFocusStudio, notify }) {
  const n = s.selected;
  if (!open) return null;
  const set = (patch, opts) => n && s.updateNode(n.id, patch, opts);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title={n ? n.name || n.id : "Inspector"}
      subtitle={n ? `${n.mesh || n.type || "actor"} · ${n.tag || "Untagged"}` : "Nothing selected"}
      actions={
        n && (
          <button
            type="button"
            className="sp-icon-btn"
            aria-label={n.visible === false ? "Show" : "Hide"}
            onClick={() => s.toggleVisible(n.id)}
          >
            {n.visible === false ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )
      }
    >
      {!n ? (
        <p className="sp-muted">Tap an object in the viewport or pick one in Scene.</p>
      ) : (
        <div className="sp-stack">
          <label className="sp-field">
            <span>Name</span>
            <input value={n.name || ""} onChange={(e) => set({ name: e.target.value })} spellCheck={false} autoCapitalize="off" enterKeyHint="done" />
          </label>

          <Vec3 title="Position" value={n.pos} step={0.5} onChange={(pos) => set({ pos })} decimals={1} />
          <Vec3 title="Rotation °" value={n.rot} step={15} onChange={(rot) => set({ rot })} decimals={0} />
          <Vec3 title="Scale" value={n.scale} step={0.25} min={0.05} onChange={(scale) => set({ scale })} />

          <div className="sp-field">
            <span>Color</span>
            <Swatches value={n.tint || n.color} colors={COLORS} onChange={(c) => set({ color: c, tint: c })} />
          </div>

          <div className="sp-field">
            <span>Material</span>
            <div className="sp-chips" role="listbox" aria-label="Material presets">
              {Object.entries(MATERIAL_PRESETS).map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={n.mat0 === name}
                  className={cx("sp-chip", n.mat0 === name && "is-on")}
                  onClick={() => set({ mat0: name, tint: hex, color: hex })}
                >
                  <i style={{ background: hex }} />
                  {name.replace(/^M_/, "").replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="sp-card sp-stack-sm">
            <Toggle checked={!!n.physics} onChange={(v) => set({ physics: v })} label="Physics" hint="Falls under gravity while playing" />
            {n.physics && <NumField label="Mass" value={n.mass ?? 100} step={25} min={1} decimals={0} onChange={(mass) => set({ mass })} />}
            <div className="sp-field">
              <span>Collision</span>
              <Segmented
                size="sm"
                label="Collision"
                value={n.collision || "BlockAll"}
                onChange={(collision) => set({ collision })}
                options={[
                  { value: "BlockAll", label: "Block" },
                  { value: "Overlap", label: "Overlap" },
                  { value: "NoCollision", label: "None" },
                ]}
              />
            </div>
          </div>

          <div className="sp-row-actions">
            <button type="button" className="sp-btn" onClick={() => { onFocusStudio?.(); }}>
              <Crosshair size={16} /> Show in Studio
            </button>
            <button type="button" className="sp-btn" onClick={() => { s.duplicate(n.id); notify("Duplicated", "ok"); }}>
              <Copy size={16} /> Duplicate
            </button>
            <button
              type="button"
              className="sp-btn is-danger"
              onClick={() => {
                s.removeNode(n.id);
                onClose();
                notify("Deleted", "ok");
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function ViewSheet({ s, open, onClose }) {
  const { settings, setSettings, timeOfDay, setTimeOfDay, timelinePlaying, setTimelinePlaying } = s;
  const clock = (t) => {
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  return (
    <Sheet open={open} onClose={onClose} title="View" subtitle="How the viewport looks. Doesn't change your game.">
      <div className="sp-stack">
        <div className="sp-field">
          <span>Shading</span>
          <Segmented label="Shading" value={settings.viewMode} onChange={(viewMode) => setSettings({ viewMode })} options={["Lit", "Wireframe", "Unlit"]} />
        </div>
        <div className="sp-field">
          <span>Projection</span>
          <Segmented label="Projection" value={settings.projection} onChange={(projection) => setSettings({ projection })} options={["Perspective", "Orthographic"]} />
        </div>
        <div className="sp-field">
          <span>Gizmo space</span>
          <Segmented label="Space" value={settings.space} onChange={(space) => setSettings({ space })} options={["Global", "Local"]} />
        </div>
        <div className="sp-card sp-stack-sm">
          <Toggle checked={settings.rtx} onChange={(rtx) => setSettings({ rtx })} label="Real-time shadows" hint="Dual shadow-casting lights" />
          <Toggle checked={settings.grid} onChange={(grid) => setSettings({ grid })} label="Helper grid" />
        </div>
        <Range label="Camera zoom" min={0.5} max={2.5} step={0.1} value={settings.zoom} onChange={(zoom) => setSettings({ zoom })} format={(v) => `${v.toFixed(1)}×`} />
        <div className="sp-time">
          <Range label="Time of day" min={4} max={22} step={0.1} value={timeOfDay} onChange={(v) => { setTimelinePlaying(false); setTimeOfDay(v); }} format={clock} />
          <button type="button" className="sp-btn" onClick={() => setTimelinePlaying(!timelinePlaying)}>
            {timelinePlaying ? <Pause size={16} /> : <Play size={16} />} {timelinePlaying ? "Pause day cycle" : "Play day cycle"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
