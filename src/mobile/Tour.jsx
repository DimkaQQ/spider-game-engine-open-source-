/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — mobile first-run tour / More → Help
 */
import React, { useEffect, useState } from "react";
import { Bot, Box, Camera, ChevronLeft, ChevronRight, HelpCircle, Move, Play, Plus } from "lucide-react";
import { MOBILE_STEPS } from "../onboarding.js";
import { Sheet } from "./ui.jsx";

const ICONS = { play: Play, move: Move, camera: Camera, scene: Box, add: Plus, ai: Bot, help: HelpCircle };

export default function TourSheet({ open, onClose }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (open) setI(0);
  }, [open]);
  const step = MOBILE_STEPS[i];
  const Icon = ICONS[step.icon] || HelpCircle;
  const last = i === MOBILE_STEPS.length - 1;
  return (
    <Sheet open={open} onClose={onClose} title="Quick tour" subtitle={`${i + 1} of ${MOBILE_STEPS.length}`}>
      <div className="sp-tour">
        <span className="sp-tour-ico">
          <Icon size={24} />
        </span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="sp-tour-dots" aria-hidden="true">
          {MOBILE_STEPS.map((_, n) => (
            <i key={n} className={n === i ? "is-on" : ""} />
          ))}
        </div>
        <div className="sp-row-actions">
          {i > 0 ? (
            <button type="button" className="sp-btn" onClick={() => setI(i - 1)}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button type="button" className="sp-btn" onClick={onClose}>
              Skip
            </button>
          )}
          <button type="button" className="sp-btn is-primary" onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? "Start building" : "Next"} {!last && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
