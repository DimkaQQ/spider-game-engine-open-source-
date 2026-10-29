/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Meta Model API client for the Pocket Studio
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import { META_KEYS, read, write } from "./store.js";

export const DEFAULT_MODELS = ["muse-spark-1.3", "muse-spark-1.3-contributor", "muse-spark-1.2", "muse-wonder"];

export const sanitizeKey = (s) => String(s || "").replace(/[\s​-‍﻿ ]+/g, "").trim();

export function loadKey() {
  try {
    const raw = sanitizeKey(localStorage.getItem(META_KEYS.key));
    return raw && raw !== "[objectObject]" ? raw : "";
  } catch {
    return "";
  }
}
export function saveKey(key) {
  try {
    if (key) localStorage.setItem(META_KEYS.key, sanitizeKey(key));
    else localStorage.removeItem(META_KEYS.key);
  } catch {}
}
export const loadModels = () => {
  const m = read(META_KEYS.models, null);
  return Array.isArray(m) && m.length ? m : DEFAULT_MODELS;
};
export const loadModel = () => {
  try {
    return localStorage.getItem(META_KEYS.model) || DEFAULT_MODELS[0];
  } catch {
    return DEFAULT_MODELS[0];
  }
};
export const saveModel = (m) => {
  try {
    localStorage.setItem(META_KEYS.model, m);
  } catch {}
};

export function friendlyModel(id) {
  const low = String(id).toLowerCase();
  if (low.includes("wonder") && low.includes("full")) return { name: "Wonder Full", desc: "Most advanced, hardest tasks" };
  if (low.includes("wonder")) return { name: "Wonder", desc: "Complex tasks, plans and delegates" };
  if (low.includes("1.3") && low.includes("contributor")) return { name: "Spark 1.3 Contributor", desc: "Agentic coding tier" };
  if (low.includes("1.3")) return { name: "Spark 1.3", desc: "High-capacity agentic reasoning" };
  if (low.includes("1.2")) return { name: "Spark 1.2", desc: "Fast answers" };
  if (low.includes("1.1")) return { name: "Spark 1.1", desc: "Fastest answers" };
  if (low.includes("spark")) return { name: "Spark", desc: "Agentic help" };
  const pretty = String(id).replace(/^muse-/, "").replace(/-/g, " ");
  return { name: pretty.charAt(0).toUpperCase() + pretty.slice(1), desc: "Meta model" };
}

export async function fetchModels(key) {
  const k = sanitizeKey(key);
  if (!k) throw new Error("Key is empty");
  let res;
  try {
    res = await fetch("https://api.meta.ai/v1/models", { headers: { Authorization: `Bearer ${k}` } });
  } catch (e) {
    throw new Error(`Network error reaching api.meta.ai (${e?.message || "offline?"})`);
  }
  if (!res.ok) {
    throw new Error(
      `Meta API ${res.status}${res.status === 401 || res.status === 403 ? ": key rejected, check it in the dev.meta.ai dashboard" : ""}`
    );
  }
  const data = await res.json();
  const ids = (data?.data || []).map((m) => m.id).filter(Boolean);
  if (!ids.length) throw new Error("Meta API returned an empty model list");
  write(META_KEYS.models, ids);
  return ids;
}

export function pickModelText(d) {
  if (!d) return "";
  if (typeof d === "string") return d;
  const c = d.choices?.[0];
  const m = c?.message?.content;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.map((p) => p?.text || "").join("");
  return c?.text || d.output_text || "";
}

/**
 * Streamed chat completion with model fallback on 400/5xx.
 * messages: [{role, content}], onToken(chunk), signal: AbortSignal.
 */
export async function chat({ key, model, messages, onToken, signal, maxTokens = 4096 }) {
  const k = sanitizeKey(key);
  if (!k) throw new Error("No Meta API key. Add one in More → Settings → AI.");
  const candidates = [
    model,
    ...(String(model).includes("contributor") ? [String(model).replace("-contributor", "")] : []),
    "muse-spark-1.3",
    "muse-spark-1.2",
  ].filter((m, i, a) => m && a.indexOf(m) === i);

  let lastErr = null;
  for (let attempt = 0; attempt < Math.min(3, candidates.length + 1); attempt++) {
    if (signal?.aborted) throw new Error("Stopped.");
    const current = candidates[Math.min(attempt, candidates.length - 1)];
    const stream = attempt === 0;
    const msgs = attempt >= 2 ? [messages[0], messages[messages.length - 1]] : messages;
    try {
      const res = await fetch("https://api.meta.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
        body: JSON.stringify({ model: current, messages: msgs, max_tokens: maxTokens, ...(stream ? { stream: true } : {}) }),
        signal,
      });
      if (!res.ok) {
        let detail = `Meta API ${res.status}`;
        try {
          const err = await res.json();
          detail += `: ${err?.error?.message || err?.message || JSON.stringify(err).slice(0, 160)}`;
        } catch {}
        if (res.status === 400 || res.status >= 500) {
          lastErr = new Error(detail);
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw new Error(detail);
      }
      if (stream && res.body?.getReader) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let full = "";
        let lastEvt = null;
        const feed = (chunk) => {
          buf += chunk;
          const parts = buf.replace(/\r\n/g, "\n").split("\n\n");
          buf = parts.pop() || "";
          for (const part of parts) {
            for (const line of part.split("\n")) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const payload = t.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const d = JSON.parse(payload);
                lastEvt = d;
                const s =
                  d.choices?.[0]?.delta?.content ||
                  (typeof d.choices?.[0]?.message?.content === "string" ? d.choices[0].message.content : "") ||
                  d.choices?.[0]?.delta?.text ||
                  d.choices?.[0]?.text ||
                  d.output_text ||
                  "";
                if (s) {
                  full += s;
                  onToken?.(s, full);
                }
              } catch {}
            }
          }
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (value) feed(dec.decode(value, { stream: true }));
          if (done) break;
        }
        feed("\n\n");
        if (full.trim()) return full.trim();
        const t = pickModelText(lastEvt);
        if (t) return t;
        continue;
      }
      const data = await res.json();
      const text = pickModelText(data);
      if (text) {
        onToken?.(text, text);
        return text;
      }
      throw new Error("Empty model response");
    } catch (e) {
      if (signal?.aborted || e?.name === "AbortError") throw new Error("Stopped.");
      lastErr = e;
      if (attempt < 2) continue;
      throw e;
    }
  }
  throw lastErr || new Error("Meta API failed after retries");
}
