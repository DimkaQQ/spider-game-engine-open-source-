/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: scene tab (hierarchy + library)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useMemo, useState } from "react";
import { Boxes, ChevronDown, ChevronRight, Copy, Eye, EyeOff, MoreHorizontal, Plus, Search, Trash2, Pencil, Crosshair } from "lucide-react";
import { PRIMITIVE_SHAPES } from "../game/index.js";
import { Empty, Segmented, Sheet, cx } from "./ui.jsx";

const GLYPH = {
  box: "▣", sphere: "●", cylinder: "▮", cone: "▲", torus: "◎", ramp: "◢", platform: "▬",
  pawn: "♟", knight: "♞", bishop: "♝", rook: "♜", queen: "♛", king: "♚", chessboard: "▦",
};

function NodeRow({ n, active, onSelect, onToggle, onMore }) {
  return (
    <li className={cx("sp-node", active && "is-active", n.visible === false && "is-hidden")}>
      <button type="button" className="sp-node-main" onClick={() => onSelect(n.id)} aria-current={active ? "true" : undefined}>
        <span className="sp-dot" style={{ background: n.tint || n.color || "#6366f1" }} />
        <span className="sp-node-text">
          <b>{n.name || n.id}</b>
          <small>{n.mesh || n.type || "actor"}</small>
        </span>
      </button>
      <button type="button" className="sp-icon-btn" onClick={() => onToggle(n.id)} aria-label={n.visible === false ? "Show" : "Hide"}>
        {n.visible === false ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
      <button type="button" className="sp-icon-btn" onClick={() => onMore(n)} aria-label="More">
        <MoreHorizontal size={18} />
      </button>
    </li>
  );
}

export default function Scene({ s, onOpenInspector, onShowInStudio, notify }) {
  const [mode, setMode] = useState("tree");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Primitive");
  const [menu, setMenu] = useState(null);

  const query = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      s.groups
        .map((g) => ({
          ...g,
          shown: (g.children || []).filter((c) => !query || String(c.name || c.id).toLowerCase().includes(query) || String(c.mesh || "").toLowerCase().includes(query)),
        }))
        .filter((g) => !query || g.shown.length),
    [s.groups, query]
  );

  const cats = useMemo(() => [...new Set(PRIMITIVE_SHAPES.map((a) => a.category))], []);
  const assets = PRIMITIVE_SHAPES.filter((a) => a.category === cat);

  return (
    <section className="sp-page">
      <header className="sp-page-head">
        <h1>Scene</h1>
        <span className="sp-count">{s.flat.length} objects</span>
      </header>
      <Segmented
        label="Scene view"
        value={mode}
        onChange={setMode}
        options={[
          { value: "tree", label: "Hierarchy" },
          { value: "lib", label: "Library" },
        ]}
      />

      {mode === "tree" && (
        <>
          <label className="sp-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects" inputMode="search" enterKeyHint="search" />
          </label>
          <div className="sp-scroll">
            {!groups.length ? (
              <Empty icon={Boxes} title={query ? "No matches" : "Empty scene"} text={query ? `Nothing named “${q}”.` : "Open the Library to add your first object."} action={!query && <button type="button" className="sp-btn is-primary" onClick={() => setMode("lib")}>Open library</button>} />
            ) : (
              groups.map((g) => {
                const open = query ? true : g.expanded !== false;
                return (
                  <div key={g.id} className="sp-group">
                    <button type="button" className="sp-group-head" onClick={() => s.toggleGroup(g.id)} aria-expanded={open}>
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <b>{g.name}</b>
                      <span>{(g.children || []).length}</span>
                    </button>
                    {open && (
                      <ul>
                        {g.shown.map((n) => (
                          <NodeRow
                            key={n.id}
                            n={n}
                            active={s.selectedId === n.id}
                            onSelect={(id) => {
                              s.setSelectedId(id);
                              onOpenInspector(true);
                            }}
                            onToggle={s.toggleVisible}
                            onMore={setMenu}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {mode === "lib" && (
        <>
          <div className="sp-chips sp-chips-row" role="tablist" aria-label="Asset categories">
            {cats.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={cat === c} className={cx("sp-chip", cat === c && "is-on")} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="sp-scroll">
            <ul className="sp-assets">
              {assets.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="sp-asset"
                    onClick={() => {
                      const n = s.spawn(a);
                      notify(`Added ${n.name}`, "ok");
                    }}
                  >
                    <span className="sp-asset-art" style={{ "--c": a.color }}>
                      {GLYPH[a.mesh] || "◆"}
                    </span>
                    <b>{a.name}</b>
                    <span className="sp-asset-add">
                      <Plus size={14} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name || menu?.id} subtitle={menu?.mesh}>
        {menu && (
          <div className="sp-menu">
            <button type="button" onClick={() => { s.setSelectedId(menu.id); setMenu(null); onShowInStudio(); }}>
              <Crosshair size={18} /> Show in Studio
            </button>
            <button type="button" onClick={() => { s.setSelectedId(menu.id); setMenu(null); onOpenInspector(true); }}>
              <Pencil size={18} /> Edit properties
            </button>
            <button type="button" onClick={() => { s.duplicate(menu.id); setMenu(null); notify("Duplicated", "ok"); }}>
              <Copy size={18} /> Duplicate
            </button>
            <button type="button" className="is-danger" onClick={() => { s.removeNode(menu.id); setMenu(null); notify("Deleted", "ok"); }}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        )}
      </Sheet>
    </section>
  );
}
