/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: code tab
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, FilePlus2, Pencil, Play, RotateCcw, Square, Trash2, Wand2, Copy as CopyIcon } from "lucide-react";
import { STARTER_CODE } from "./store.js";
import { Sheet, cx } from "./ui.jsx";

const SNIPPETS = [
  { label: "Box", code: `<mesh position={[0,0.5,0]} castShadow>\n  <boxGeometry args={[1,1,1]} />\n  <meshStandardMaterial color="#3b82f6" />\n</mesh>` },
  { label: "Ball", code: `<mesh position={[0,0.5,0]} castShadow>\n  <sphereGeometry args={[0.5,20,20]} />\n  <meshStandardMaterial color="#ef4444" />\n</mesh>` },
  { label: "Light", code: `<directionalLight position={[8,16,10]} intensity={1.5} castShadow />` },
  { label: "Ground", code: `<mesh rotation-x={-Math.PI/2} receiveShadow>\n  <planeGeometry args={[20,20]} />\n  <meshStandardMaterial color="#15803d" />\n</mesh>` },
  { label: "useFrame", code: `useFrame((_, dt) => {\n  // runs every frame\n});` },
  { label: "Tap", code: `onPointerDown={(e) => { e.stopPropagation(); /* tap */ }}` },
];

const KEYS = ["Tab", "{", "}", "(", ")", "<", ">", "/", "=", '"', ";", "[", "]", "$"];

export default function Code({ s, notify }) {
  const { files, activeJsxName, codeError } = s;
  const [active, setActive] = useState(() => s.project.mountedFile || files[0]?.name);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState(null); // {type:'new'|'rename', value}
  const gutter = useRef(null);
  const area = useRef(null);

  const file = files.find((f) => f.name === active) || files[0];

  useEffect(() => {
    if (!files.find((f) => f.name === active)) setActive(files[0]?.name);
  }, [files, active]);

  // pull the file into the editor when it changes underneath us (switch tab, AI edit)
  useEffect(() => {
    if (!dirty) setDraft(file?.content ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, file?.content]);

  const switchTo = (name) => {
    if (dirty && file) s.saveFile(file.name, draft);
    setDirty(false);
    setActive(name);
  };

  // autosave typing
  useEffect(() => {
    if (!file || !dirty) return undefined;
    const t = setTimeout(() => {
      s.saveFile(file.name, draft);
      setDirty(false);
    }, 600);
    return () => clearTimeout(t);
  }, [draft, dirty, file, s]);

  const lines = draft.split("\n").length;
  const mounted = activeJsxName === file?.name;

  const insertAtCursor = (text) => {
    const el = area.current;
    if (!el) return;
    const a = el.selectionStart ?? draft.length;
    const b = el.selectionEnd ?? a;
    const ins = text === "Tab" ? "  " : text;
    const next = draft.slice(0, a) + ins + draft.slice(b);
    setDraft(next);
    setDirty(true);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + ins.length;
    });
  };

  const insertSnippet = (code) => {
    const marker = "    </group>";
    const idx = draft.lastIndexOf(marker);
    const block = `      ${code.split("\n").join("\n      ")}\n`;
    const next = idx === -1 ? `${draft}\n${code}\n` : draft.slice(0, idx) + block + draft.slice(idx);
    setDraft(next);
    setDirty(true);
    notify("Snippet added", "ok");
  };

  const render = () => {
    const r = s.mountCode(file.name, draft);
    setDirty(false);
    if (r.ok) notify("Mounted in viewport", "ok");
    else notify("Compile error", "warn");
    return r.ok;
  };

  if (!file) {
    return (
      <section className="sp-page">
        <header className="sp-page-head">
          <h1>Code</h1>
        </header>
        <button type="button" className="sp-btn is-primary" onClick={() => setDialog({ type: "new", value: "GameComponent.jsx" })}>
          <FilePlus2 size={16} /> New file
        </button>
      </section>
    );
  }

  return (
    <section className="sp-code-page">
      <div className="sp-filebar" role="tablist" aria-label="Project files">
        {files.map((f) => (
          <button
            key={f.name}
            type="button"
            role="tab"
            aria-selected={f.name === file.name}
            className={cx("sp-file", f.name === file.name && "is-on")}
            onClick={() => switchTo(f.name)}
          >
            {f.name === activeJsxName && <i className="sp-live" title="Mounted" />}
            {f.name}
          </button>
        ))}
        <button type="button" className="sp-file is-add" onClick={() => setDialog({ type: "new", value: "" })} aria-label="New file">
          <FilePlus2 size={16} />
        </button>
      </div>

      <div className="sp-code-bar">
        <button type="button" className="sp-btn is-primary" onClick={render}>
          <Play size={16} /> Render
        </button>
        {mounted && (
          <button type="button" className="sp-btn" onClick={() => { s.unmountCode(); notify("Unmounted", "ok"); }}>
            <Square size={15} /> Unmount
          </button>
        )}
        <span className="sp-grow" />
        <span className="sp-save-state">{dirty ? "Saving…" : "Saved"}</span>
        <button type="button" className="sp-icon-btn" onClick={() => setMenu(true)} aria-label="File actions">
          <Wand2 size={18} />
        </button>
      </div>

      {codeError && <div className="sp-error" role="alert">{codeError}</div>}

      <div className="sp-snippets" role="toolbar" aria-label="Snippets">
        {SNIPPETS.map((x) => (
          <button key={x.label} type="button" className="sp-chip" onClick={() => insertSnippet(x.code)}>
            + {x.label}
          </button>
        ))}
      </div>

      <div className="sp-editor">
        <div className="sp-gutter" ref={gutter} aria-hidden="true">
          <pre>{Array.from({ length: lines }, (_, i) => i + 1).join("\n")}</pre>
        </div>
        <textarea
          ref={area}
          className="sp-textarea"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setDirty(true);
          }}
          onScroll={(e) => {
            if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              insertAtCursor("Tab");
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          aria-label={`Editing ${file.name}`}
        />
      </div>

      <div className="sp-keys" role="toolbar" aria-label="Code keys">
        {KEYS.map((k) => (
          <button key={k} type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => insertAtCursor(k)}>
            {k === "Tab" ? "⇥" : k}
          </button>
        ))}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={file.name} subtitle={`${lines} lines`}>
        <div className="sp-menu">
          <button type="button" onClick={() => { navigator.clipboard?.writeText(draft); setMenu(false); notify("Copied", "ok"); }}>
            <ClipboardCopy size={18} /> Copy code
          </button>
          <button type="button" onClick={() => { setMenu(false); setDialog({ type: "rename", value: file.name }); }}>
            <Pencil size={18} /> Rename
          </button>
          <button type="button" onClick={() => { const n = s.createFile(file.name.replace(/(\.\w+)$/, "_copy$1"), draft); setActive(n); setMenu(false); notify("Duplicated", "ok"); }}>
            <CopyIcon size={18} /> Duplicate
          </button>
          <button type="button" onClick={() => { setDraft(STARTER_CODE); setDirty(true); setMenu(false); }}>
            <RotateCcw size={18} /> Reset to starter
          </button>
          <button type="button" className="is-danger" disabled={files.length < 2} onClick={() => { s.deleteFile(file.name); setMenu(false); notify("File deleted", "ok"); }}>
            <Trash2 size={18} /> Delete file
          </button>
        </div>
      </Sheet>

      <Sheet open={!!dialog} onClose={() => setDialog(null)} title={dialog?.type === "new" ? "New file" : "Rename file"}>
        {dialog && (
          <form
            className="sp-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dialog.value.trim()) return;
              if (dialog.type === "new") {
                const n = s.createFile(dialog.value);
                setActive(n);
              } else {
                s.renameFile(file.name, dialog.value);
                setActive(dialog.value.trim().replace(/[^\w.\-]/g, "_"));
              }
              setDialog(null);
            }}
          >
            <label className="sp-field">
              <span>File name</span>
              <input autoFocus value={dialog.value} onChange={(e) => setDialog({ ...dialog, value: e.target.value })} placeholder="Player.jsx" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="done" />
            </label>
            <button type="submit" className="sp-btn is-primary is-block">
              <Check size={16} /> {dialog.type === "new" ? "Create" : "Rename"}
            </button>
          </form>
        )}
      </Sheet>
    </section>
  );
}

