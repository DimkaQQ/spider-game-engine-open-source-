/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Adaptive Context Management & Verbatim Tail Retention
 * 
 * Architecture:
 * 1. Preserves the active conversation tail 100% verbatim (no micro-clipping).
 * 2. High threshold activation: only triggers when context fills beyond safety buffer.
 * 3. Structured head summarization: older turns are cleanly digested into bullet summaries,
 *    never mangling code or recent instructions.
 */

export const WINDOWS = { "128k": 128000, "200k": 200000, "1m": 1000000 };

/** Context window in tokens. `setting` is the user's choice: auto | 128k | 200k | 1m. */
export function contextWindow(providerId, model, setting = "auto") {
  if (setting && setting !== "auto" && WINDOWS[setting]) return WINDOWS[setting];
  const m = String(model || "").toLowerCase();
  if (/gemini/.test(m) || /gpt-4\.1/.test(m)) return WINDOWS["1m"];
  if (providerId === "meta" || /muse/.test(m)) return WINDOWS["1m"];
  if (/claude/.test(m)) return WINDOWS["200k"];
  return WINDOWS["128k"];
}

export const estimateTokens = (text) => Math.ceil(String(text || "").length / 4);

function turnLines(messages) {
  const result = [];
  for (const m of (messages || [])) {
    if (m.queued) continue;
    if (m.role) {
      if (m.text) {
        if (m.role === "user") {
          result.push({ who: "User", text: m.text });
        } else {
          const tools = m.steps?.length ? ` [tools: ${[...new Set(m.steps.map((s) => s.tool))].join(", ")}]` : "";
          result.push({ who: m.ok === false ? "Assistant (failed)" : "Assistant", text: `${m.text}${tools}` });
        }
      }
    } else if (m.q || m.a) {
      if (m.q) result.push({ who: "User", text: m.q });
      if (m.a) result.push({ who: m.ok === false ? "Assistant (failed)" : "Assistant", text: m.a });
    }
  }
  return result;
}

/**
 * Adaptive memory compaction:
 * - Keeps the recent tail (~75% of budget) 100% VERBATIM with zero loss.
 * - Older head turns are digested into a clean structured session summary.
 * - Root user goal is always pinned at the top.
 */
export function buildMemory(messages, budgetChars) {
  const turns = turnLines(messages);
  const render = (list) => list.map((t) => `${t.who}: ${t.text}`).join("\n\n");
  let text = render(turns);

  // Fits within budget: keep 100% verbatim
  if (text.length <= budgetChars) {
    return { text, compacted: false, turns: turns.length, kept: turns.length };
  }

  // Tail Reservation: Reserve 75% of budget exclusively for the most recent turns
  const tailBudget = budgetChars * 0.75;
  let tailCount = 0;
  let tailChars = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const len = turns[i].text.length + turns[i].who.length + 4;
    if (tailChars + len > tailBudget && tailCount >= 4) break;
    tailChars += len;
    tailCount++;
  }

  const headTurns = turns.slice(0, turns.length - tailCount);
  const tailTurns = turns.slice(turns.length - tailCount);

  // Structured summary of the older head turns
  const headSummary = headTurns.map((t) => {
    const firstLine = t.text.split("\n")[0].trim();
    const digest = firstLine.length > 250 ? `${firstLine.slice(0, 247)}…` : firstLine;
    return `• ${t.who}: ${digest}`;
  }).join("\n");

  const tailText = render(tailTurns);
  const combined = `[Prior Session Context - Summary of Earlier Turns]:\n${headSummary}\n\n[Recent Conversation - Verbatim]:\n${tailText}`;

  if (combined.length <= budgetChars) {
    return { text: combined, compacted: true, turns: turns.length, kept: tailTurns.length };
  }

  // If still overflowing under extreme history, progressively drop oldest summary bullets
  const summaryLines = headSummary.split("\n");
  let prunedSummary = summaryLines;
  let finalText = combined;
  while (finalText.length > budgetChars && prunedSummary.length > 1) {
    prunedSummary = prunedSummary.slice(1);
    finalText = `[Prior Session Context - Summary of Earlier Turns (compacted)]:\n${prunedSummary.join("\n")}\n\n[Recent Conversation - Verbatim]:\n${tailText}`;
  }

  return { text: finalText, compacted: true, turns: turns.length, kept: tailTurns.length };
}

/** Adaptive memory budget (40-60% of window depending on token scale). */
export function memoryBudget(windowTokens) {
  const ratio = windowTokens >= 500000 ? 0.6 : windowTokens >= 190000 ? 0.5 : 0.4;
  return Math.floor(windowTokens * 4 * ratio);
}

/** Dynamic run limits: generous verbatim history and high observation headroom. */
export function runLimits(windowTokens) {
  if (windowTokens >= 500000) return { historyKeep: 60, obsChars: 16000 };
  if (windowTokens >= 190000) return { historyKeep: 40, obsChars: 8000 };
  return { historyKeep: 25, obsChars: 4000 };
}

/* ------------------------------------------------------------------
 * Automatic compaction of one request. The system prompt, the earlier chat and the agent's
 * own steps together must fit in the window with room left for the model's reply. When they
 * do not, the oldest bulky parts are shrunk first (old code and tool output), then whole
 * old turns are dropped. The newest turns and the original goal always stay verbatim.
 * ------------------------------------------------------------------ */
const textOf = (c) => (typeof c === "string" ? c : Array.isArray(c) ? c.map((p) => p?.text || (p?.type === "image_url" ? "[image]" : "")).join("") : "");
const sizeOf = (m) => textOf(m.content).length + (Array.isArray(m.content) ? 800 * m.content.filter((p) => p?.type === "image_url").length : 0);

export function fitMessages(messages, windowTokens, replyTokens = 8000) {
  const budget = Math.max(8000, Math.floor((windowTokens - replyTokens) * 0.85) * 4); // characters
  const total = () => messages.reduce((n, m) => n + sizeOf(m), 0);
  if (total() <= budget) return { messages, compacted: false, before: total(), after: total() };

  const before = total();
  const out = messages.map((m) => ({ ...m }));
  const keepTail = 4; // newest messages stay as they are
  const clip = (m, n, what) => {
    const t = textOf(m.content);
    if (t.length <= n) return;
    m.content = `${t.slice(0, n)}\n...[${t.length - n} chars of ${what} omitted to save space]`;
  };
  const used = () => out.reduce((n, m) => n + sizeOf(m), 0);

  // 1. old images go first
  for (let i = 2; i < out.length - keepTail && used() > budget; i++) {
    if (Array.isArray(out[i].content)) out[i].content = textOf(out[i].content);
  }
  // 2. shrink old bulky turns, oldest first, in two passes (generous then tight)
  for (const limit of [2500, 600]) {
    for (let i = 2; i < out.length - keepTail && used() > budget; i++) clip(out[i], limit, out[i].role === "assistant" ? "earlier code or reply" : "tool output");
  }
  // 3. drop the oldest middle turns (keep system, goal, newest)
  while (used() > budget && out.length > keepTail + 3) out.splice(2, 2);
  // 4. last resort: shorten the system prompt tail
  if (used() > budget && out[0]?.role === "system") {
    const over = used() - budget;
    const sys = textOf(out[0].content);
    out[0].content = sys.slice(0, Math.max(4000, sys.length - over));
  }
  return { messages: out, compacted: true, before, after: used() };
}

/** Short chit-chat ("Done?", "thanks", "why?") that needs an answer, not a new build run. */
const BUILD_WORDS =
  /\b(make|add|create|build|change|fix|remove|delete|spawn|set|move|rotate|scale|color|colour|paint|generate|write|update|increase|decrease|replace|rename|improve|apply|put|turn|resize|сделай|добавь|создай|измени|исправь|удали|поменяй)\b/i;
export function isSmallTalk(text) {
  const t = String(text || "").trim();
  if (!t || t.length > 40 || t.split(/\s+/).length > 6) return false;
  if (BUILD_WORDS.test(t)) return false;
  return /^(done|ready|ok|okay|k|thanks|thank you|thx|ty|nice|cool|great|good|wow|hi|hello|hey|yes|no|yep|nope|why|what|how|when|where|which|is it|are you|did you|can you|does it|готово|спасибо|привет|да|нет|почему|что)\b/i.test(t) || /\?$/.test(t);
}

/**
 * Join a continuation onto the text before it. Removes text the model repeated at the seam and
 * handles the case where it started the whole reply again.
 */
export function joinContinuation(prev, next) {
  const a = String(prev || "");
  const b = String(next || "");
  if (!a) return b;
  const trimmed = b.replace(/^\s*```(?:json)?\s*/i, "");
  if (a.length > 200 && /^\s*\{\s*"(thought|action|tool|final)"/.test(trimmed) && !/^\s*\{\s*"(thought|action|tool|final)"/.test(a.slice(a.length - 20))) {
    return trimmed; // it restarted from the top: use the fresh, complete reply
  }
  const max = Math.min(300, a.length, trimmed.length);
  for (let k = max; k >= 8; k--) {
    if (a.endsWith(trimmed.slice(0, k))) return a + trimmed.slice(k);
  }
  return a + trimmed;
}
