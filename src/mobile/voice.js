/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — voice input for the AI prompt
 * Uses the browser's built-in speech recognition (Chrome, Edge, Safari; not Firefox).
 * Audio goes to the browser vendor's recognizer, nothing is stored by this app.
 */
export const voiceSupported = () => typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export function voiceLang(setting) {
  if (setting === "en") return "en-US";
  if (setting === "ru") return "ru-RU";
  return (typeof navigator !== "undefined" && navigator.language) || "en-US";
}

/** Start one dictation. Returns { stop }. onText gets the full transcript so far. */
export function startVoice({ lang, onText, onEnd, onError }) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new Rec();
  r.lang = lang;
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    let t = "";
    for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
    onText(t.trim());
  };
  r.onerror = (e) => {
    const code = e.error;
    if (code === "no-speech" || code === "aborted") return;
    onError?.(
      code === "not-allowed" || code === "service-not-allowed"
        ? "Microphone is blocked. Allow it for this site in the browser settings."
        : code === "network"
          ? "Speech recognition needs an internet connection."
          : `Voice input failed (${code}).`
    );
  };
  r.onend = () => onEnd?.();
  try {
    r.start();
  } catch (e) {
    onError?.("Could not start the microphone.");
    onEnd?.();
  }
  return { stop: () => { try { r.stop(); } catch {} } };
}
