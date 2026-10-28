#!/usr/bin/env node
/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Spider Engine MCP server — tools for any MCP client (Claude Code/Desktop, agents).
// LIVE path: POSTs to the running engine at http://127.0.0.1:9287/mcp
// FILE path: if the engine is closed, scene tools operate on a project folder's GameWorld.scene.json
//   Set SPIDER_PROJECT_DIR to the folder, or pass sceneDir per call.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const BRIDGE = process.env.SPIDER_BRIDGE || "http://127.0.0.1:9287";
const DEFAULT_DIR = process.env.SPIDER_PROJECT_DIR || process.cwd();

async function bridge(tool, args) {
  const res = await fetch(`${BRIDGE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, args })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "bridge failed");
  return data.result;
}

async function liveOrFile(tool, args, fileFn) {
  try {
    return await bridge(tool, args);
  } catch (e) {
    if (!String(e?.message || e).includes("fetch")) throw e;
    return fileFn(); // engine closed → work on files
  }
}

function scenePath(dir) {
  return path.join(dir || DEFAULT_DIR, "GameWorld.scene.json");
}
function loadScene(dir) {
  const p = scenePath(dir);
  if (!fs.existsSync(p)) throw new Error(`no GameWorld.scene.json in ${dir || DEFAULT_DIR} — open the engine and save once, or set SPIDER_PROJECT_DIR`);
  return { groups: JSON.parse(fs.readFileSync(p, "utf8")).groups || JSON.parse(fs.readFileSync(p, "utf8")).groups, path: p };
}
function actorsOf(groups) {
  return groups.flatMap((g) => g.children || []);
}

const server = new McpServer({ name: "spider-engine", version: "0.9.0" });

server.tool("engine_status", {}, async () => {
  try {
    const r = await fetch(`${BRIDGE}/health`).then((x) => x.json());
    return { content: [{ type: "text", text: `ENGINE LIVE — tools: ${r.tools.join(", ")}` }] };
  } catch {
    return { content: [{ type: "text", text: `engine closed — file mode on ${DEFAULT_DIR}. Open the Spider Engine app for live control.` }] };
  }
});

server.tool("list_scene", { sceneDir: z.string().optional() }, async ({ sceneDir }) => {
  const out = await liveOrFile("listScene", {}, () => {
    const { groups, path: p } = loadScene(sceneDir);
    const actors = actorsOf(groups);
    return { file: p, count: actors.length, actors: actors.slice(0, 80).map((c) => ({ id: c.id, name: c.name, pos: c.pos, mesh: c.mesh, visible: c.visible })) };
  });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out, null, 2) }] };
});

server.tool("spawn_object", { name: z.string(), sceneDir: z.string().optional() }, async ({ name, sceneDir }) => {
  const out = await liveOrFile("spawnObject", { name }, () => {
    const { groups, path: p } = loadScene(sceneDir);
    const g = groups[0];
    const node = { id: `spawn-${Date.now()}`, name: `${name}_01`, type: "mesh", color: "#6366f1", visible: true, pos: { x: 0, y: 0, z: 10 }, rot: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, tag: "Imported", layer: "Default", mesh: `SM_${name}`, mat0: "M_Imported_Base", mat1: "M_Imported_Detail", anim: "None", physics: false, mass: 100, collision: "BlockAll" };
    g.children = [...(g.children || []), node];
    fs.writeFileSync(p, JSON.stringify({ engine: "Spider Engine 0.9.0", scene: "GameWorld", exported: new Date().toISOString(), groups }, null, 2));
    return `spawned ${node.name} into ${p} (takes effect on next open — engine is closed)`;
  });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("move_object", { id: z.string(), x: z.number().optional(), y: z.number().optional(), z: z.number().optional(), sceneDir: z.string().optional() }, async ({ id, x, y, z, sceneDir }) => {
  const out = await liveOrFile("moveObject", { id, x, y, z }, () => {
    const { groups, path: p } = loadScene(sceneDir);
    let found = null;
    for (const g of groups) for (const c of g.children || []) {
      if (c.id === id || c.name === id) {
        if (x !== undefined) c.pos.x = x;
        if (y !== undefined) c.pos.y = y;
        if (z !== undefined) c.pos.z = z;
        found = c;
      }
    }
    if (!found) throw new Error(`actor not found: ${id}`);
    fs.writeFileSync(p, JSON.stringify({ engine: "Spider Engine 0.9.0", scene: "GameWorld", exported: new Date().toISOString(), groups }, null, 2));
    return `moved ${found.name} to (${found.pos.x}, ${found.pos.y}, ${found.pos.z}) in ${p}`;
  });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("set_visibility", { id: z.string(), visible: z.boolean(), sceneDir: z.string().optional() }, async ({ id, visible, sceneDir }) => {
  const out = await liveOrFile("setVisibility", { id, visible }, () => {
    const { groups, path: p } = loadScene(sceneDir);
    let found = null;
    for (const g of groups) for (const c of g.children || []) {
      if (c.id === id || c.name === id) { c.visible = visible; found = c; }
    }
    if (!found) throw new Error(`actor not found: ${id}`);
    fs.writeFileSync(p, JSON.stringify({ engine: "Spider Engine 0.9.0", scene: "GameWorld", exported: new Date().toISOString(), groups }, null, 2));
    return `${found.name} is now ${visible ? "visible" : "hidden"} in ${p}`;
  });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("set_time", { t: z.number() }, async ({ t }) => {
  const out = await bridge("setTime", { t });
  return { content: [{ type: "text", text: JSON.stringify(out) }] };
});

server.tool("play", { on: z.boolean() }, async ({ on }) => {
  const out = await bridge("play", { on });
  return { content: [{ type: "text", text: JSON.stringify(out) }] };
});

server.tool("get_score", {}, async () => {
  const out = await bridge("getScore", {});
  return { content: [{ type: "text", text: JSON.stringify(out) }] };
});

server.tool("spawn_set", { items: z.array(z.object({ asset: z.string(), x: z.number().optional(), y: z.number().optional(), z: z.number().optional() })) }, async ({ items }) => {
  const out = await bridge("spawn_set", { items });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("set_actor", { id: z.string(), patch: z.record(z.string(), z.any()).optional() }, async ({ id, patch }) => {
  const out = await bridge("set_actor", { id, patch: patch || {} });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("remove_prop", { id: z.string() }, async ({ id }) => {
  const out = await bridge("remove_prop", { id });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("scaffold_board_game", { game: z.string().optional() }, async ({ game }) => {
  const out = await bridge("scaffold_board_game", { game: game || "chess" });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("render_jsx", { code: z.string(), name: z.string().optional() }, async ({ code, name }) => {
  const out = await bridge("render_jsx", { code, name: name || "DynamicComponent.jsx" });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("get_active_component", {}, async () => {
  const out = await bridge("getActiveComponent", {});
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool("get_logs", {}, async () => {
  const out = await bridge("getLogs", {});
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool("capture_screenshot", {}, async () => {
  const out = await bridge("captureScreenshot", {});
  return { content: [{ type: "text", text: JSON.stringify(out) }] };
});

server.tool("check_3d_view", {}, async () => {
  const out = await bridge("check3DView", {});
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("edit_file", { name: z.string(), old: z.string(), text: z.string(), dir: z.string().optional() }, async ({ name, old, text, dir }) => {
  const out = await bridge("editFile", { name, old, text, dir });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("create_file", { name: z.string(), content: z.string(), dir: z.string().optional() }, async ({ name, content, dir }) => {
  const out = await bridge("createFile", { name, content, dir });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("create_multiple_files", { files: z.array(z.object({ name: z.string(), content: z.string(), dir: z.string().optional() })), dir: z.string().optional() }, async ({ files, dir }) => {
  const out = await bridge("create_multiple_files", { files, dir });
  return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out) }] };
});

server.tool("ask_engine", { text: z.string() }, async ({ text }) => {
  const out = await bridge("ask", { text });
  return { content: [{ type: "text", text: "sent to the live engine Ask AI — watch it act" }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
