/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — context window sizing and automatic compaction
 *
 * The agent prompt is built from: system prompt + scene snapshot + earlier chat + this run's history.
 * We estimate tokens (about 4 characters each) and compact the earlier chat before it can overflow.
 */

export const WINDOWS = { "128k": 128000, "200k": 200000, "1m": 1000000 };

/** Context window in tokens. `setting` is the user's choice: auto | 128k | 200k | 1m. */
export function contextWindow(providerId, model, setting = "auto") {
  if (setting && setting !== "auto" && WINDOWS[setting]) return WINDOWS[setting];
  const m = String(model || "").toLowerCase();
  if (/gemini/.test(m) || /gpt-4\.1/.test(m)) return WINDOWS["1m"];
  if (providerId === "meta" || /muse/.test(m)) return WINDOWS["1m"]; // Muse models: 1M, per the hackathon team
  if (/claude/.test(m)) return WINDOWS["200k"];
  return WINDOWS["128k"];
}

export const estimateTokens = (text) => Math.ceil(String(text || "").length / 4);

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function turnLines(messages) {
  return messages
    .filter((m) => !m.queued && m.text)
    .map((m) => {
      if (m.role === "user") return { who: "User", text: m.text };
      const tools = m.steps?.length ? ` [tools: ${[...new Set(m.steps.map((s) => s.tool))].join(", ")}]` : "";
      return { who: m.ok === false ? "Assistant (failed)" : "Assistant", text: `${m.text}${tools}` };
    });
}

/**
 * Earlier chat as plain text that fits `budgetChars`.
 * Tier 1 keeps everything. Tier 2 shortens long turns. Tier 3 keeps the newest turns whole and
 * reduces older ones to one short line each. Tier 4 drops the oldest lines.
 * Returns { text, compacted, turns, kept }.
 */
export function buildMemory(messages, budgetChars) {
  const turns = turnLines(messages);
  const render = (list) => list.map((t) => `${t.who}: ${t.text}`).join("\n");
  let text = render(turns);
  if (text.length <= budgetChars) return { text, compacted: false, turns: turns.length, kept: turns.length };

  const short = turns.map((t) => ({ ...t, text: clip(t.text, 400) }));
  text = render(short);
  if (text.length <= budgetChars) return { text, compacted: true, turns: turns.length, kept: turns.length };

  let tail = 0;
  let used = 0;
  for (let i = short.length - 1; i >= 0; i--) {
    const len = short[i].text.length + short[i].who.length + 2;
    if (used + len > budgetChars * 0.6) break;
    used += len;
    tail++;
  }
  const older = short.slice(0, short.length - tail).map((t) => ({ ...t, text: clip(t.text, 110) }));
  let list = [...older, ...short.slice(short.length - tail)];
  text = render(list);
  while (text.length > budgetChars && list.length > 2) {
    list = list.slice(1);
    text = render(list);
  }
  return { text: `(earlier messages were compacted)\n${text}`, compacted: true, turns: turns.length, kept: list.length };
}

/** How much of the window the earlier chat may use, in characters. */
export const memoryBudget = (windowTokens) => Math.floor(windowTokens * 4 * 0.3);

/** How many agent turns to keep inside one run, and how long an observation may be. */
export function runLimits(windowTokens) {
  if (windowTokens >= 500000) return { historyKeep: 40, obsChars: 6000 };
  if (windowTokens >= 190000) return { historyKeep: 16, obsChars: 3000 };
  return { historyKeep: 8, obsChars: 1200 };
}
