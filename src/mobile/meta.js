/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Meta AI tooling
 * One place for every Meta developer API the studio can use besides chat:
 *   - Muse Voice Transcribe  (speech to text, WebSocket realtime + HTTP fallback)
 *   - Muse Image             (text to image, used for textures and sprite props)
 *   - SAM 3.1                (photo to cutout, via the Responses API)
 *   - Muse Wonder            (planning step before a big build)
 * All calls go straight from the browser to https://api.meta.ai/v1 with the key the user saved
 * for the Meta provider. Nothing is proxied or stored by this app.
 */
import { loadKey } from "./ai.js";

export const META_BASE = "https://api.meta.ai/v1";
export const META_TOOLS = [
  { id: "voice", name: "Muse Voice Transcribe", what: "Dictate prompts with the mic button", model: "muse-voice-transcribe" },
  { id: "image", name: "Muse Image", what: "Generate textures and sprite props from text", model: "muse-image-1.0" },
  { id: "sam", name: "SAM 3.1", what: "Cut an object out of a photo to use as a prop", model: "sam-3.1" },
  { id: "wonder", name: "Muse Wonder", what: "Plan a big game before the build starts", model: "muse-wonder" },
  { id: "spark", name: "Muse Spark 1.3", what: "Main agent model, 1M-token context and vision", model: "muse-spark-1.3" },
  { id: "baseten", name: "Muse Spark Open (Baseten)", what: "Open-weights Muse Spark on your own Baseten endpoint", model: "meta-models/muse-spark-open-1026" },
];

export const metaKey = () => loadKey("meta");
export const hasMetaKey = () => Boolean(metaKey());

const authHeaders = (key) => ({ "content-type": "application/json", authorization: `Bearer ${key}` });

async function fail(res, what) {
  let detail = "";
  try {
    const j = await res.json();
    detail = j?.error?.message || j?.message || "";
  } catch {}
  throw new Error(`${what} failed (${res.status})${detail ? `: ${detail}` : ""}`);
}

/* ------------------------------ Muse Image ------------------------------ */

/** Text to image through the Responses API. Returns a data URL (png). */
export async function generateImage(prompt, { size = "1024x1024", transparent = false, signal } = {}) {
  const key = metaKey();
  if (!key) throw new Error("Add your Meta key in Settings > AI providers first.");
  const text = transparent ? `${prompt}. Single object centered, plain flat background, no shadow, no text.` : prompt;
  const res = await fetch(`${META_BASE}/responses`, {
    method: "POST",
    headers: authHeaders(key),
    signal,
    body: JSON.stringify({
      model: "muse-image-1.0",
      input: text,
      tools: [{ type: "image_generation", size }],
    }),
  });
  if (!res.ok) await fail(res, "Muse Image");
  const data = await res.json();
  const call = (data.output || []).find((o) => o.type === "image_generation_call" && o.result);
  if (!call) throw new Error("Muse Image returned no picture.");
  return `data:image/png;base64,${call.result}`;
}

/* -------------------------------- SAM 3.1 -------------------------------- */

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read the photo."));
    r.readAsDataURL(file);
  });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not open the image."));
    img.src = src;
  });
}

/** Pull polygons or an RLE-free mask list out of whatever shape the SAM reply uses. */
function pickMasks(data) {
  const out = [];
  const walk = (v) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    if (Array.isArray(v.polygon) || Array.isArray(v.polygons)) out.push(v.polygons || [v.polygon]);
    if (typeof v.mask === "string" && v.mask.length > 64) out.push({ png: v.mask });
    Object.values(v).forEach(walk);
  };
  walk(data);
  return out;
}

/**
 * Photo to cutout. Sends the photo to SAM 3.1 with a text prompt ("the red car") and returns a
 * transparent PNG data URL with only the matched object. If SAM returns nothing usable the photo
 * is returned untouched so the caller can still use it as a texture.
 */
export async function cutOut(file, what = "the main object", { signal } = {}) {
  const key = metaKey();
  if (!key) throw new Error("Add your Meta key in Settings > AI providers first.");
  const src = await fileToDataUrl(file);
  const res = await fetch(`${META_BASE}/responses`, {
    method: "POST",
    headers: authHeaders(key),
    signal,
    body: JSON.stringify({
      model: "sam-3.1",
      input: [{ role: "user", content: [{ type: "input_text", text: what }, { type: "input_image", image_url: src }] }],
    }),
  });
  if (!res.ok) await fail(res, "SAM 3.1");
  const masks = pickMasks(await res.json());
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext("2d");
  const first = masks[0];
  if (!first) return { url: src, matched: false };

  if (first.png) {
    const mask = await loadImage(first.png.startsWith("data:") ? first.png : `data:image/png;base64,${first.png}`);
    g.drawImage(mask, 0, 0, c.width, c.height);
    g.globalCompositeOperation = "source-in";
    g.drawImage(img, 0, 0);
    return { url: c.toDataURL("image/png"), matched: true };
  }
  // polygon list in pixel or 0..1 coordinates
  g.beginPath();
  for (const poly of first) {
    for (let i = 0; i + 1 < poly.length; i += 2) {
      const px = poly[i] <= 1 ? poly[i] * c.width : poly[i];
      const py = poly[i + 1] <= 1 ? poly[i + 1] * c.height : poly[i + 1];
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
  }
  g.clip();
  g.drawImage(img, 0, 0);
  return { url: c.toDataURL("image/png"), matched: true };
}

/* --------------------------- Muse Voice Transcribe --------------------------- */

export const museVoiceSupported = () => typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext) && window.WebSocket);

/**
 * Realtime dictation over wss://api.meta.ai/v1/asr/realtime. Microphone audio is converted to
 * 16 kHz PCM16 and streamed; partial and final text come back as JSON events.
 * Returns { stop }.
 */
export async function startMuseVoice({ language, onText, onEnd, onError }) {
  const key = metaKey();
  if (!key) {
    onError?.("Add your Meta key in Settings > AI providers to use Muse Voice.");
    onEnd?.();
    return { stop() {} };
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch {
    onError?.("Microphone is blocked. Allow it for this site in the browser settings.");
    onEnd?.();
    return { stop() {} };
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const ws = new WebSocket("wss://api.meta.ai/v1/asr/realtime");
  ws.binaryType = "arraybuffer";
  let done = false;
  let committed = "";
  let partial = "";
  let node;
  let source;

  const cleanup = () => {
    if (done) return;
    done = true;
    try { node?.disconnect(); source?.disconnect(); } catch {}
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
    try { ws.close(); } catch {}
    onEnd?.();
  };

  ws.onopen = () => {
    ws.send(JSON.stringify({
      authorization: { accessToken: key },
      config: { language: language || undefined, encoding: "pcm_s16le", sampleRate: ctx.sampleRate },
    }));
    source = ctx.createMediaStreamSource(stream);
    node = ctx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = (e) => {
      if (ws.readyState !== 1) return;
      const f = e.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(f.length);
      for (let i = 0; i < f.length; i++) pcm[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
      ws.send(pcm.buffer);
    };
    source.connect(node);
    node.connect(ctx.destination);
  };
  ws.onmessage = (ev) => {
    if (typeof ev.data !== "string") return;
    let m;
    try { m = JSON.parse(ev.data); } catch { return; }
    if (m.error) {
      onError?.(`Muse Voice: ${m.error.message || m.error}`);
      return cleanup();
    }
    const t = m.transcript ?? m.text ?? "";
    if (!t) return;
    if (m.is_final || m.final || m.type === "final") {
      committed = `${committed} ${t}`.trim();
      partial = "";
    } else partial = t;
    onText?.(`${committed} ${partial}`.trim());
    if (m.type === "end" || m.done) cleanup();
  };
  ws.onerror = () => {
    onError?.("Muse Voice could not connect. Check your Meta key and connection.");
    cleanup();
  };
  ws.onclose = () => cleanup();

  return {
    stop() {
      if (done) return;
      try { if (ws.readyState === 1) ws.send(JSON.stringify({ endStream: true })); } catch {}
      setTimeout(cleanup, 1500); // let the final transcript arrive
    },
  };
}

/* ------------------------------- Muse Wonder ------------------------------- */

/** Ask Muse Wonder for a short build plan. Returns plain text, or "" when it is unavailable. */
export async function planGame(request, { signal } = {}) {
  const key = metaKey();
  if (!key) return "";
  try {
    const res = await fetch(`${META_BASE}/chat/completions`, {
      method: "POST",
      headers: authHeaders(key),
      signal,
      body: JSON.stringify({
        model: "muse-wonder",
        max_tokens: 900,
        messages: [
          { role: "system", content: "You plan small 3D browser games for a React Three Fiber engine. Reply with at most 8 short numbered steps: world, player controls, enemies or goals, scoring, polish. No code." },
          { role: "user", content: request },
        ],
      }),
    });
    if (!res.ok) return "";
    const j = await res.json();
    return String(j?.choices?.[0]?.message?.content || "").trim();
  } catch {
    return "";
  }
}
