/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — desktop first-run tour / Help → Quick Tour
 */
import React, { useEffect, useState } from "react";
import { Play, Move, Camera, Box, Plus, Bot, HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DESKTOP_STEPS } from "../onboarding.js";

const ICONS = { play: Play, move: Move, camera: Camera, scene: Box, add: Plus, ai: Bot, help: HelpCircle };

export default function Tour({ open, onClose }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (open) setI(0);
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, DESKTOP_STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const step = DESKTOP_STEPS[i];
  const Icon = ICONS[step.icon] || HelpCircle;
  const last = i === DESKTOP_STEPS.length - 1;
  return (
    <div className="absolute inset-0 z-[70] bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Quick tour">
      <div className="w-[460px] max-w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Quick tour · {i + 1} / {DESKTOP_STEPS.length}</span>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer" aria-label="Close tour">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pt-4 pb-5 min-h-[190px]">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900 mb-1.5">{step.title}</h2>
          <p className="text-[13px] leading-relaxed text-slate-600">{step.text}</p>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {DESKTOP_STEPS.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-indigo-600" : "w-1.5 bg-slate-300"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!last && (
              <button onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                Skip
              </button>
            )}
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={() => (last ? onClose() : setI(i + 1))}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
            >
              {last ? "Start building" : "Next"} {!last && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
