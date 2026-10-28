/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// MCP end-to-end test: live bridge tools + MCP server (live + file mode).
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BRIDGE = "http://127.0.0.1:9287";
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log(`PASS  ${name}`); } else { fail++; console.log(`FAIL  ${name} ${extra}`); } };

async function bridge(tool, args) {
  const r = await fetch(`${BRIDGE}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool, args }) });
  return r.json();
}

function startServer(env = {}) {
  return new Promise((resolve) => {
    const child = spawn("node", ["server.js"], { cwd: "C:\\Users\\vvvr8\\Downloads\\game engine\\mcp-server", env: { ...process.env, ...env }, stdio: ["pipe", "pipe", "pipe"] });
    let buf = "";
    const pending = new Map();
    let id = 100;
    child.stdout.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
        } catch {}
      }
    });
    child.stderr.on("data", () => {});
    const send = (method, params) => new Promise((res) => { const i = id++; pending.set(i, res); child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: i, method, params }) + "\n"); });
    const notify = (method) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method }) + "\n");
    setTimeout(() => resolve({ child, send, notify }), 1200);
  });
}

(async () => {
  // ---- 1. bridge health ----
  try {
    const h = await fetch(`${BRIDGE}/health`).then((r) => r.json());
    ok("bridge/health", h.ok && h.tools.length >= 12, JSON.stringify(h));
  } catch (e) { ok("bridge/health", false, String(e)); }

  // ---- 2. live tools via bridge ----
  const before = await bridge("listScene", {});
  ok("bridge/listScene", before.ok && Array.isArray(before.result), JSON.stringify(before).slice(0, 120));
  const n0 = Array.isArray(before.result) ? before.result.length : -1;

  const sp = await bridge("spawnObject", { name: "castle" });
  ok("bridge/spawnObject", sp.ok && sp.result && sp.result.ok && !!sp.result.id, JSON.stringify(sp));

  const after = await bridge("listScene", {});
  const spawned = Array.isArray(after.result) ? after.result.find((a) => sp.result && a.id === sp.result.id) : null;
  ok("bridge/spawn-visible", !!spawned, `id ${sp.result && sp.result.id}`);

  if (spawned) {
    const mv = await bridge("moveObject", { id: spawned.id, x: 5, z: 5 });
    ok("bridge/moveObject", mv.ok, JSON.stringify(mv));
    const hid = await bridge("setVisibility", { id: spawned.id, visible: false });
    ok("bridge/setVisibility-hide", hid.ok, JSON.stringify(hid));
    const sho = await bridge("setVisibility", { id: spawned.id, visible: true });
    ok("bridge/setVisibility-show", sho.ok, JSON.stringify(sho));
    // leave the test prop hidden so the user's viewport stays clean
    await bridge("setVisibility", { id: spawned.id, visible: false });
  } else { ok("bridge/moveObject", false, "no spawned node"); ok("bridge/setVisibility-hide", false, "no spawned node"); ok("bridge/setVisibility-show", false, "no spawned node"); }

  const t1 = await bridge("setTime", { t: 21 });
  ok("bridge/setTime", t1.ok, JSON.stringify(t1));
  const t2 = await bridge("setTime", { t: 14.5 });
  ok("bridge/setTime-restore", t2.ok && t2.result && t2.result.time === 14.5, JSON.stringify(t2));

  const sc = await bridge("getScore", {});
  ok("bridge/getScore", sc.ok, JSON.stringify(sc));


/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

  const ask = await bridge("ask", { text: "help" });
  ok("bridge/ask", ask.ok, JSON.stringify(ask));

  // generic agent tools through the same bridge
  const bulk = await bridge("spawn_set", { items: [{ asset: "crate", x: -8, z: 20 }, { asset: "rocks", x: -4, z: 20 }] });
  const bulkIds = bulk.result && bulk.result.ids;
  ok("bridge/spawn_set", bulk.ok && Array.isArray(bulkIds) && bulkIds.length === 2, JSON.stringify(bulk).slice(0, 200));
  if (bulkIds && bulkIds[0]) {
    const pa = await bridge("set_actor", { id: bulkIds[0], patch: { pos: { x: -8, y: 2, z: 20 } } });
    ok("bridge/set_actor", pa.ok, JSON.stringify(pa).slice(0, 160));
    const rm = await bridge("remove_prop", { id: bulkIds[1] });
    ok("bridge/remove_prop", rm.ok, JSON.stringify(rm).slice(0, 160));
    const rm2 = await bridge("remove_prop", { id: bulkIds[0] });
    ok("bridge/remove_prop-cleanup", rm2.ok, JSON.stringify(rm2).slice(0, 160));
  } else {
    ok("bridge/set_actor", false, "spawn_set gave no ids");
    ok("bridge/remove_prop", false, "spawn_set gave no ids");
    ok("bridge/remove_prop-cleanup", false, "spawn_set gave no ids");
  }

  const bad = await bridge("nope", {});
  ok("bridge/unknown-tool-errors", bad.ok === false, JSON.stringify(bad));

  // ---- 3. MCP server: tools/list ----
  const srv = await startServer({});
  await srv.send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } });
  srv.notify("notifications/initialized");
  const tools = await srv.send("tools/list", {});
  const names = (tools.result?.tools || []).map((t) => t.name);
  const expected = ["engine_status", "list_scene", "spawn_object", "spawn_set", "move_object", "set_actor", "remove_prop", "set_visibility", "set_time", "play", "get_score", "ask_engine", "scaffold_board_game"];
  ok("mcp/tools-list", expected.every((t) => names.includes(t)), names.join(","));

  const call = async (name, args) => {
    const r = await srv.send("tools/call", { name, arguments: args });
    const text = r.result?.content?.[0]?.text || "";
    return { err: !!r.error, text, raw: r };
  };

  let r = await call("engine_status", {});
  ok("mcp/engine_status-live", !r.err && r.text.includes("LIVE"), r.text.slice(0, 80));

  r = await call("list_scene", {});
  ok("mcp/list_scene-live", !r.err && r.text.includes("spawn-"), r.text.slice(0, 120));

  // ---- 4. file mode (engine bridge unreachable simulation can't be forced while app runs,
  // so test file ops directly against a scratch scene copy) ----
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spider-test-"));
  const srcScene = "C:\\Users\\vvvr8\\Downloads\\game engine\\src\\game\\levels\\GameWorld.scene.json";
  fs.copyFileSync(srcScene, path.join(tmp, "GameWorld.scene.json"));
  const srv2 = await startServer({ SPIDER_PROJECT_DIR: tmp });
  await srv2.send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } });
  srv2.notify("notifications/initialized");
  const call2 = async (name, args) => {
    const rr = await srv2.send("tools/call", { name, arguments: args });
    return { err: !!rr.error, text: rr.result?.content?.[0]?.text || "" };
  };
  // kill bridge env? file mode triggers only when fetch fails — engine IS up, so file path won't run.
  // Instead verify file tools shape by pointing bridge at dead port:
  srv2.child.kill();
  const srv3 = await startServer({ SPIDER_PROJECT_DIR: tmp, SPIDER_BRIDGE: "http://127.0.0.1:59999" });
  await srv3.send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } });
  srv3.notify("notifications/initialized");
  const call3 = async (name, args) => {
    const rr = await srv3.send("tools/call", { name, arguments: args });
    return { err: !!rr.error, text: rr.result?.content?.[0]?.text || "" };
  };
  r = await call3("list_scene", {});
  ok("mcp/file-list_scene", !r.err && r.text.includes("Terrain"), r.text.slice(0, 100));
  r = await call3("spawn_object", { name: "bridge" });
  ok("mcp/file-spawn", !r.err && r.text.includes("spawned"), r.text.slice(0, 120));
  r = await call3("move_object", { id: "terrain", x: 1, z: 2 });
  ok("mcp/file-move", !r.err && r.text.includes("(1, 0, 2)"), r.text.slice(0, 120));
  r = await call3("set_visibility", { id: "terrain", visible: false });
  ok("mcp/file-hide", !r.err && r.text.includes("hidden"), r.text.slice(0, 120));
  const disk = JSON.parse(fs.readFileSync(path.join(tmp, "GameWorld.scene.json"), "utf8"));
  const terr = disk.groups.flatMap((g) => g.children).find((c) => c.id === "terrain");
  ok("mcp/file-persisted", terr && terr.visible === false && terr.pos.x === 1, JSON.stringify(terr && { v: terr.visible, x: terr.pos.x }));

  srv.child.kill(); srv2.child.kill(); srv3.child.kill();
  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("HARNESS CRASH", e); process.exit(2); });
