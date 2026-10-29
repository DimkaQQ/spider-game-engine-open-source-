/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio UI primitives
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Minus, Plus, Check } from "lucide-react";

export const cx = (...a) => a.filter(Boolean).join(" ");

/** Bottom sheet: backdrop tap, Esc, and swipe-down on the grabber to dismiss. */
export function Sheet({ open, onClose, title, subtitle, children, tall = false, actions, noBackdrop = false }) {
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setDrag(0);
  }, [open]);

  const down = (e) => {
    start.current = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (start.current == null) return;
    setDrag(Math.max(0, e.clientY - start.current));
  };
  const up = () => {
    if (start.current == null) return;
    const d = drag;
    start.current = null;
    if (d > 90) onClose?.();
    setDrag(0);
  };

  if (!open) return null;
  return (
    <div className={cx("sp-sheet-root", noBackdrop && "is-clear")} role="dialog" aria-modal={!noBackdrop} aria-label={title}>
      {!noBackdrop && <div className="sp-backdrop" onClick={onClose} />}
      <div
        ref={ref}
        className={cx("sp-sheet", tall && "is-tall", drag > 0 && "is-dragging")}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <div className="sp-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <span />
        </div>
        {(title || actions) && (
          <header className="sp-sheet-head">
            <div className="sp-sheet-titles">
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="sp-sheet-actions">
              {actions}
              <button type="button" className="sp-icon-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </header>
        )}
        <div className="sp-sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options, size = "md", label }) {
  return (
    <div className={cx("sp-seg", `is-${size}`)} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <button key={v} type="button" role="radio" aria-checked={value === v} className={cx(value === v && "is-on")} onClick={() => onChange(v)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="sp-toggle-row" onClick={() => onChange(!checked)}>
      <span className="sp-toggle-text">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <span className={cx("sp-switch", checked && "is-on")}>
        <i />
      </span>
    </button>
  );
}

export function Range({ value, onChange, min, max, step = 0.1, label, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="sp-range">
      <span className="sp-range-head">
        <b>{label}</b>
        <output>{format ? format(value) : value}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--pct": `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Numeric field: − / + steppers, label-scrub (drag the letter), tabular figures. */
export function NumField({ label, value, onChange, step = 1, min, max, tone, decimals = 2 }) {
  const [draft, setDraft] = useState(null);
  const scrub = useRef(null);
  const clamp = (n) => {
    let v = n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    return Number(v.toFixed(decimals));
  };
  const commit = (raw) => {
    const n = parseFloat(String(raw).replace(",", "."));
    if (Number.isFinite(n)) onChange(clamp(n));
    setDraft(null);
  };
  const bump = (dir) => onChange(clamp((Number(value) || 0) + dir * step));

  const down = (e) => {
    scrub.current = { x: e.clientX, v: Number(value) || 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!scrub.current) return;
    const dx = e.clientX - scrub.current.x;
    onChange(clamp(scrub.current.v + Math.round(dx / 6) * step));
  };
  const up = () => (scrub.current = null);

  const shown = draft ?? String(Number(Number(value).toFixed(decimals)));
  return (
    <div className="sp-num">
      <span
        className="sp-num-label"
        data-tone={tone}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-hidden="true"
      >
        {label}
      </span>
      <button type="button" className="sp-num-step" onClick={() => bump(-1)} aria-label={`${label} minus`}>
        <Minus size={14} />
      </button>
      <input
        inputMode="decimal"
        value={shown}
        aria-label={label}
        onFocus={(e) => {
          setDraft(String(Number(Number(value).toFixed(decimals))));
          e.target.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
      <button type="button" className="sp-num-step" onClick={() => bump(1)} aria-label={`${label} plus`}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export function Swatches({ value, onChange, colors }) {
  return (
    <div className="sp-swatches" role="listbox" aria-label="Color">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="option"
          aria-selected={value === c}
          aria-label={c}
          className={cx(value?.toLowerCase() === c && "is-on")}
          style={{ background: c }}
          onClick={() => onChange(c)}
        >
          {value?.toLowerCase() === c && <Check size={14} strokeWidth={3} />}
        </button>
      ))}
      <label className="sp-swatch-custom" aria-label="Custom color">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#6366f1"} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="sp-empty">
      {Icon && (
        <span className="sp-empty-ico">
          <Icon size={26} />
        </span>
      )}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((text, tone = "info") => {
    clearTimeout(timer.current);
    setToast({ text, tone, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  const node = toast ? (
    <div key={toast.id} className={cx("sp-toast", `is-${toast.tone}`)} role="status" aria-live="polite">
      {toast.text}
    </div>
  ) : null;
  return [show, node];
}
