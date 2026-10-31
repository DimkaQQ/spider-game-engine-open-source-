/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — multi-provider model client for Pocket Studio
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 *
 * Every provider is either "openai" (chat/completions, the format most vendors copy)
 * or "anthropic" (messages API). Keys live only in this browser.
 */
import { read, write } from "./store.js";
import { demoChat } from "./demo.js";

export const PROVIDERS = [
  { id: "demo", name: "Demo (no key needed)", short: "Demo", kind: "demo", baseUrl: "demo://local", keyHint: "No key needed", models: ["scripted-demo"] },
  { id: "meta", name: "Meta", kind: "openai", baseUrl: "https://api.meta.ai/v1", keyHint: "Key from dev.meta.ai", models: ["muse-spark-1.3", "muse-spark-1.3-contributor", "muse-spark-1.2", "muse-wonder-1.0"] },
  { id: "baseten", name: "Baseten (Muse Spark Open)", short: "Baseten", kind: "openai", baseUrl: "https://inference.baseten.co/v1", keyHint: "Baseten API key", models: ["meta-models/muse-spark-open-1026"] },
  { id: "openai", name: "OpenAI", kind: "openai", baseUrl: "https://api.openai.com/v1", keyHint: "sk-…", models: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"] },
  { id: "anthropic", name: "Anthropic", kind: "anthropic", baseUrl: "https://api.anthropic.com/v1", keyHint: "sk-ant-…", models: ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"] },
  { id: "google", name: "Google Gemini", kind: "openai", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", keyHint: "AIza…", models: ["gemini-2.5-pro", "gemini-2.5-flash"] },
  { id: "deepseek", name: "DeepSeek", kind: "openai", baseUrl: "https://api.deepseek.com/v1", keyHint: "sk-…", models: ["deepseek-chat", "deepseek-reasoner"] },
  { id: "xai", name: "xAI", kind: "openai", baseUrl: "https://api.x.ai/v1", keyHint: "xai-…", models: ["grok-4", "grok-3"] },
  { id: "mistral", name: "Mistral", kind: "openai", baseUrl: "https://api.mistral.ai/v1", keyHint: "Mistral key", models: ["mistral-large-latest", "codestral-latest"] },
  { id: "groq", name: "Groq", kind: "openai", baseUrl: "https://api.groq.com/openai/v1", keyHint: "gsk_…", models: ["llama-3.3-70b-versatile"] },
  { id: "openrouter", name: "OpenRouter", kind: "openai", baseUrl: "https://openrouter.ai/api/v1", keyHint: "sk-or-…", models: ["anthropic/claude-sonnet-4.5", "openai/gpt-4.1"] },
  { id: "custom", name: "Custom (OpenAI-compatible)", short: "Custom", kind: "openai", baseUrl: "", keyHint: "Key (optional for local)", custom: true, models: [] },
];

export const providerById = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];

const CFG = "spider-ai-config";
const keyName = (id) => (id === "meta" ? "spider-meta-key-raw" : `spider-ai-key-${id}`);

export const sanitizeKey = (s) => String(s || "").replace(/[\s​-‍﻿ ]+/g, "").trim();

export function loadConfig() {
  const c = read(CFG, {});
  return { provider: c.provider || "meta", models: c.models || {}, model: c.model || {}, baseUrls: c.baseUrls || {} };
}
export const saveConfig = (c) => write(CFG, c);

export function loadKey(id) {
  if (id === "demo") return "demo";
  try {
    const k = sanitizeKey(localStorage.getItem(keyName(id)));
    return k && k !== "[objectObject]" ? k : "";
  } catch {
    return "";
  }
}
export function saveKey(id, key) {
  try {
    if (key) localStorage.setItem(keyName(id), sanitizeKey(key));
    else localStorage.removeItem(keyName(id));
  } catch {}
}
export const configuredProviders = () => PROVIDERS.filter((p) => loadKey(p.id) || (p.custom && (loadConfig().baseUrls.custom || "")));

export function baseUrlFor(provider, cfg) {
  return (provider.custom ? cfg.baseUrls.custom || "" : provider.baseUrl).replace(/\/+$/, "");
}

export function friendlyModel(providerId, id) {
  const low = String(id).toLowerCase();
  if (providerId === "meta") {
    if (low.includes("wonder")) return { name: low.includes("full") ? "Wonder Full" : "Wonder", desc: "Complex tasks, plans and delegates" };
    if (low.includes("1.3") && low.includes("contributor")) return { name: "Spark 1.3 Contributor", desc: "Agentic coding tier" };
    if (low.includes("1.3")) return { name: "Spark 1.3", desc: "High-capacity agentic reasoning" };
    if (low.includes("1.2")) return { name: "Spark 1.2", desc: "Fast answers" };
    if (low.includes("spark")) return { name: "Spark", desc: "Agentic help" };
  }
  return { name: String(id).replace(/^models\//, ""), desc: providerById(providerId).name };
}

const NOT_CHAT = /embed|whisper|tts|dall-e|moderation|image|audio|transcribe|realtime|rerank|guard|vision-preview|babbage|davinci/i;

function headers(provider, key) {
  const h = { "Content-Type": "application/json" };
  if (provider.kind === "anthropic") {
    h["x-api-key"] = key;
    h["anthropic-version"] = "2023-06-01";
    h["anthropic-dangerous-direct-browser-access"] = "true";
  } else if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

export async function fetchModels(provider, key, cfg) {
  if (provider.kind === "demo") return provider.models;
  const base = baseUrlFor(provider, cfg);
  if (!base) throw new Error("Enter the base URL first");
  if (!key && !provider.custom) throw new Error("Key is empty");
  let res;
  try {
    res = await fetch(`${base}/models${provider.kind === "anthropic" ? "?limit=100" : ""}`, { headers: headers(provider, key) });
  } catch (e) {
    throw new Error(`Cannot reach ${new URL(base).host}. The provider may block direct browser calls (CORS), or you are offline.`);
  }
  if (!res.ok) {
    throw new Error(`${provider.name} ${res.status}${res.status === 401 || res.status === 403 ? ": key rejected" : ""}`);
  }
  const data = await res.json();
  const ids = (data?.data || data?.models || []).map((m) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean).map((id) => String(id).replace(/^models\//, "")).filter((id) => !NOT_CHAT.test(id));
  if (!ids.length) throw new Error("The provider returned no chat models");
  return [...new Set(ids)];
}

export function pickModelText(d) {
  if (!d) return "";
  if (typeof d === "string") return d;
  if (Array.isArray(d.content)) return d.content.map((p) => p?.text || "").join(""); // anthropic
  const c = d.choices?.[0];
  const m = c?.message?.content;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.map((p) => p?.text || "").join("");
  return c?.text || d.output_text || "";
}

/* ---------- anthropic message conversion ---------- */
function toAnthropic(messages) {
  const system = messages.filter((m) => m.role === "system").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n\n");
  const out = [];
  for (const m of messages.filter((x) => x.role !== "system")) {
    const role = m.role === "assistant" ? "assistant" : "user";
    let content;
    if (Array.isArray(m.content)) {
      content = m.content
        .map((p) => {
          if (p.type === "image_url") {
            const mm = String(p.image_url?.url || "").match(/^data:(.+?);base64,(.+)$/);
            return mm ? { type: "image", source: { type: "base64", media_type: mm[1], data: mm[2] } } : null;
          }
          return { type: "text", text: p.text || "" };
        })
        .filter(Boolean);
    } else content = [{ type: "text", text: String(m.content ?? "") || "(empty)" }];
    const last = out[out.length - 1];
    if (last && last.role === role) last.content.push(...content);
    else out.push({ role, content });
  }
  if (out.length && out[0].role !== "user") out.unshift({ role: "user", content: [{ type: "text", text: "Begin." }] });
  return { system, messages: out };
}

async function readSSE(res, onEvent, onActivity) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
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
          onEvent(JSON.parse(payload));
        } catch {}
      }
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (value) {
      onActivity?.();
      feed(dec.decode(value, { stream: true }));
    }
    if (done) break;
  }
  feed("\n\n");
}

/** Longest reply we ask each model for. Too high a value is rejected by some APIs; chat() then halves it. */
export function outputLimit(providerId, model) {
  const m = String(model || "").toLowerCase();
  if (providerId === "anthropic" || /claude/.test(m)) return 32000;
  if (providerId === "google" || /gemini/.test(m)) return 32768;
  if (/gpt-4\.1/.test(m)) return 32768;
  if (/gpt-4o/.test(m)) return 16384;
  if (/deepseek-reasoner/.test(m)) return 32768;
  if (/deepseek/.test(m)) return 8192;
  if (providerId === "meta" || providerId === "baseten" || /muse/.test(m)) return 16000;
  return 8192;
}

// a limit the provider rejected once is remembered for the session, so every later call starts below it
const learnedLimit = new Map();

const STALL_MS = () => (typeof window !== "undefined" && window.__STALL_MS) || 90000;

/**
 * One chat turn. messages: [{role, content}] in OpenAI shape (images as image_url parts).
 * Streams via onToken(chunk). Returns the text.
 *  - onFinish({ finishReason, truncated, usage }) tells the caller if the reply was cut by the output limit.
 *  - A stream that goes silent for 90 s is aborted and retried once.
 *  - A 400 that complains about the token limit is retried with half the limit.
 *  - Meta falls back to sibling models on 400.
 */
export async function chat({ provider, key, model, baseUrl, messages, onToken, onFinish, signal, maxTokens }) {
  if (provider.kind === "demo") return demoChat({ messages, onToken, onFinish, signal });
  const base = String(baseUrl || provider.baseUrl).replace(/\/+$/, "");
  if (!base) throw new Error("No base URL set for this provider. Open More, then Settings, then AI.");
  if (!key && !provider.custom) throw new Error(`No ${provider.name} key yet. Open More, then Settings, then AI.`);

  const candidates =
    provider.id === "meta"
      ? [model, ...(String(model).includes("contributor") ? [String(model).replace("-contributor", "")] : []), "muse-spark-1.3", "muse-spark-1.2"].filter((m, i, a) => m && a.indexOf(m) === i)
      : [model];

  const limitKey = `${provider.id}:${model}`;
  let limit = Math.min(maxTokens || outputLimit(provider.id, model), learnedLimit.get(limitKey) || Infinity);
  let lastErr = null;
  let modelStep = 0;
  let stalls = 0;
  const MAX_ATTEMPTS = 6;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new Error("Stopped.");
    const current = candidates[Math.min(modelStep, candidates.length - 1)];

    // our own controller: aborts on user stop OR on a silent stream
    const ctl = new AbortController();
    const onUserAbort = () => ctl.abort();
    signal?.addEventListener("abort", onUserAbort);
    let stalled = false;
    let timer = null;
    const poke = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        stalled = true;
        ctl.abort();
      }, STALL_MS());
    };

    try {
      poke();
      let res;
      if (provider.kind === "anthropic") {
        const conv = toAnthropic(messages);
        res = await fetch(`${base}/messages`, {
          method: "POST",
          headers: headers(provider, key),
          body: JSON.stringify({ model: current, max_tokens: limit, system: conv.system || undefined, messages: conv.messages, stream: true }),
          signal: ctl.signal,
        });
      } else {
        res = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: headers(provider, key),
          body: JSON.stringify({ model: current, messages, max_tokens: limit, stream: true }),
          signal: ctl.signal,
        });
      }
      poke();
      if (!res.ok) {
        let detail = `${provider.name} ${res.status}`;
        let raw = "";
        try {
          const err = await res.json();
          raw = JSON.stringify(err);
          detail += `: ${err?.error?.message || err?.message || raw.slice(0, 160)}`;
        } catch {}
        // token limit rejected: halve and retry (not counted as a model failure)
        if (res.status === 400 && /max_tokens|max_completion_tokens|output token|too large|exceeds|maximum/i.test(raw || detail) && limit > 4096) {
          limit = Math.max(4096, Math.floor(limit / 2));
          learnedLimit.set(limitKey, limit);
          lastErr = new Error(detail);
          continue;
        }
        if (res.status === 429) {
          lastErr = new Error(detail);
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        if (res.status === 400 && provider.id === "meta" && modelStep < candidates.length - 1) {
          modelStep++;
          lastErr = new Error(detail);
          continue;
        }
        if (res.status >= 500) {
          lastErr = new Error(detail);
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
          continue;
        }
        throw new Error(detail);
      }

      let full = "";
      let finishReason = null;
      let usage = null;
      let last = null;
      if (res.body?.getReader) {
        await readSSE(
          res,
          (d) => {
            last = d;
            let s = "";
            if (provider.kind === "anthropic") {
              if (d.type === "content_block_delta") s = d.delta?.text || "";
              if (d.type === "message_delta") {
                if (d.delta?.stop_reason) finishReason = d.delta.stop_reason;
                if (d.usage) usage = { ...(usage || {}), ...d.usage };
              }
              if (d.type === "message_start" && d.message?.usage) usage = { ...d.message.usage };
              if (d.type === "error") throw new Error(d.error?.message || "Anthropic stream error");
            } else {
              const c = d.choices?.[0];
              s = c?.delta?.content || (typeof c?.message?.content === "string" ? c.message.content : "") || c?.delta?.text || c?.text || d.output_text || "";
              if (c?.finish_reason) finishReason = c.finish_reason;
              if (d.usage) usage = d.usage;
            }
            if (s) {
              full += s;
              onToken?.(s, full);
            }
          },
          poke
        );
      } else {
        const data = await res.json();
        full = pickModelText(data);
        finishReason = data?.choices?.[0]?.finish_reason || data?.stop_reason || null;
        usage = data?.usage || null;
        if (full) onToken?.(full, full);
      }
      if (!full.trim()) full = pickModelText(last);
      if (!full.trim()) throw new Error("Empty model response");
      const truncated = finishReason === "length" || finishReason === "max_tokens" || finishReason === "MAX_TOKENS";
      onFinish?.({ finishReason, truncated, usage, maxTokens: limit, model: current });
      return full.trim();
    } catch (e) {
      if (signal?.aborted) throw new Error("Stopped.");
      if (stalled) {
        stalls++;
        lastErr = new Error(`${provider.name} stopped sending data for ${Math.round(STALL_MS() / 1000)} s`);
        if (stalls >= 2) throw lastErr;
        continue;
      }
      if (e?.name === "AbortError") throw new Error("Network request was interrupted.");
      if (e instanceof TypeError) e = new Error(`Cannot reach ${new URL(base).host}. The provider may block direct browser calls (CORS), or you are offline.`);
      lastErr = e;
      if (/\b5\d\d\b|timeout|network/i.test(String(e.message)) && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onUserAbort);
    }
  }
  throw lastErr || new Error(`${provider.name} failed after retries`);
}
