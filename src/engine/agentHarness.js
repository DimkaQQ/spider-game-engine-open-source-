// Spider AI agent harness — goal → plan → act → observe → recover.
// The model reasons in ReAct JSON; every tool below executes for real.
export const MAX_STEPS = 8;

export function toolDefs() {
  return [
    { name: "listScene", desc: "List actors: id, name, pos, mesh, visible", args: {} },
    { name: "spawnObject", desc: "Spawn an environment asset by name", args: { name: "asset name query" } },
    { name: "moveObject", desc: "Move actor by id or name", args: { id: "actor id or name", x: "number?", y: "number?", z: "number?" } },
    { name: "setVisibility", desc: "Show/hide actor", args: { id: "actor id or name", visible: "true|false" } },
    { name: "setTime", desc: "Solar time 4-22", args: { t: "number" } },
    { name: "play", desc: "Start/stop Play mode", args: { on: "true|false" } },
    { name: "saveScene", desc: "Embed assets + write GameWorld.scene.json to the project folder", args: {} },
    { name: "createFile", desc: "Create/overwrite a text file in the project folder", args: { name: "filename", content: "text" } },
    { name: "readFile", desc: "Read a text file from the project folder", args: { name: "filename" } },
    { name: "editFile", desc: "append|replace|write a project file", args: { name: "filename", op: "append|replace|write", text: "text", old: "for replace: search text" } }
  ];
}

export function systemPrompt(snapshot) {
  return [
    "You are Spider AI, an agentic game-engine assistant inside Spider Engine (React + Three.js).",
    "Work in ReAct loops. Reply with EXACTLY one JSON object per turn, no other text:",
    '{"thought":"<why this step>","action":{"tool":"<tool>","args":{...}}}',
    "or when the goal is done:",
    '{"thought":"<summary>","final":"<result for the user, under 80 words>"}',
    "Rules: max 8 steps; prefer fewest actions; never invent actor ids — call listScene first if unsure;",
    "no delete/destroy tools exist — say so instead of attempting; keep thoughts to one line.",
    "Available tools:",
    ...toolDefs().map((t) => `- ${t.name}(${Object.entries(t.args).map(([k, v]) => `${k}: ${v}`).join(", ")}) — ${t.desc}`),
    "LIVE SCENE:",
    snapshot
  ].join("\n");
}

export function parseAgentReply(raw) {
  const m = String(raw || "").match(/\{[\s\S]*\}/);
  if (!m) return { error: "no-json", raw };
  try {
    const o = JSON.parse(m[0]);
    if (o && typeof o === "object" && o.action && o.action.tool) return { thought: o.thought || "", action: o.action };
    if (o && typeof o === "object" && typeof o.final === "string") return { thought: o.thought || "", final: o.final };
    return { error: "bad-shape", raw };
  } catch {
    return { error: "no-json", raw };
  }
}

export async function runAgent(task, { ctx, callModel, onEvent, maxSteps = MAX_STEPS }) {
  const history = [];
  for (let step = 1; step <= maxSteps; step++) {
    const reply = await callModel(task, history);
    const parsed = parseAgentReply(reply.raw);
    if (parsed.error) {
      const obs = `PARSE ERROR (${parsed.error}). Reply with exactly one JSON object, no other text.`;
      history.push({ role: "assistant", text: String(raw0(reply)).slice(0, 500) }, { role: "user", text: obs });
      onEvent && onEvent({ type: "error", step, message: obs });
      continue;
    }
    if (parsed.final !== undefined) {
      onEvent && onEvent({ type: "thought", step, thought: parsed.thought });
      return parsed.final;
    }
    const { tool, args } = parsed.action;
    onEvent && onEvent({ type: "thought", step, thought: parsed.thought });
    onEvent && onEvent({ type: "action", step, tool, args });
    let observation;
    try {
      observation = await ctx.runTool(tool, args || {});
    } catch (e) {
      observation = `TOOL ERROR: ${e && e.message ? e.message : e}`;
    }
    observation = String(observation).slice(0, 1200);
    onEvent && onEvent({ type: "observation", step, observation });
    history.push(
      { role: "assistant", text: JSON.stringify({ thought: parsed.thought, action: parsed.action }) },
      { role: "user", text: `OBSERVATION: ${observation}` }
    );
  }
  return "I ran out of steps (8). Partial work is already in the scene — ask me to continue from here.";
}

function raw0(reply) {
  return reply && reply.raw ? reply.raw : reply;
}
