// The long-session memory claims, checked: retrieval over project files and scene, verbatim tail, structured summary.
import test from "node:test";
import assert from "node:assert/strict";
import { ragStore, retrieveRagContext } from "../src/engine/ragEngine.js";
import { buildMemory, fitMessages, joinContinuation, isSmallTalk, memoryBudget } from "../src/mobile/context.js";

const chat = (n) =>
  Array.from({ length: n }, (_, i) =>
    i % 2 === 0
      ? { role: "user", text: `Request ${i / 2 + 1}: add feature number ${i / 2 + 1} to the racing game` }
      : { role: "assistant", text: `Added feature ${(i + 1) / 2}. It works.`, steps: [{ tool: "render_jsx", file: `Part${(i + 1) / 2}.jsx` }] }
  );

test("retrieval finds a function inside a project file", () => {
  ragStore.setProject({ files: [{ name: "Boss.jsx", content: "// boss fight\nfunction spawnGiantDragonBoss(scene) {\n  const hp = 5000; // dragon hit points\n  return { hp };\n}\nexport default spawnGiantDragonBoss;\n".repeat(3) }], nodes: [] });
  const ctx = retrieveRagContext("fix the giant dragon boss hit points");
  assert.match(ctx, /spawnGiantDragonBoss/);
});

test("retrieval finds scene objects, and a new project replaces the old one", () => {
  ragStore.setProject({ files: [], nodes: [{ name: "Lighthouse_12", mesh: "tower", pos: { x: 4, y: 0, z: -9 } }] });
  assert.match(retrieveRagContext("where is the lighthouse"), /Lighthouse_12/);
  ragStore.setProject({ files: [], nodes: [] });
  assert.equal(retrieveRagContext("where is the lighthouse"), "");
});

test("retrieval understands a Russian prompt", () => {
  ragStore.setProject({ files: [{ name: "Игра.jsx", content: "// счёт игрока\nfunction обновитьСчёт(очки) {\n  return очки + 10; // добавить очки за монету\n}\nexport default обновитьСчёт;\n".repeat(3) }], nodes: [] });
  assert.match(retrieveRagContext("исправь счёт очки за монету"), /обновитьСчёт/);
});

test("a short chat is kept verbatim", () => {
  const m = buildMemory(chat(6), 100000);
  assert.equal(m.compacted, false);
  assert.match(m.text, /Request 3/);
});

test("a long chat keeps the newest turns verbatim, pins the first goal and lists files", () => {
  const msgs = chat(80);
  const m = buildMemory(msgs, 3000);
  assert.equal(m.compacted, true);
  assert.ok(m.text.length <= 3000, `length ${m.text.length}`);
  assert.match(m.text, /Request 40: add feature number 40/); // newest user turn, verbatim
  assert.match(m.text, /User asked, in order:\n1\. Request 1:/); // original goal pinned
  assert.ok(m.kept >= 4);
});

test("the older part is summarised with files written", () => {
  const m = buildMemory(chat(80), 3500);
  assert.match(m.text, /Files written so far: .*Part1\.jsx/);
});

test("fitMessages shrinks old bulky turns and keeps system prompt, goal and newest turns", () => {
  const big = "x".repeat(60000);
  const messages = [{ role: "system", content: "SYS" }, { role: "user", content: "GOAL: build a racer" }];
  for (let i = 0; i < 12; i++) messages.push({ role: "assistant", content: big }, { role: "user", content: `OBSERVATION: ${big}` });
  messages.push({ role: "user", content: "LATEST QUESTION" });
  const r = fitMessages(messages, 100000, 8000);
  assert.equal(r.compacted, true);
  assert.ok(r.after < r.before);
  assert.equal(r.messages[0].content, "SYS");
  assert.equal(r.messages[1].content, "GOAL: build a racer");
  assert.equal(r.messages.at(-1).content, "LATEST QUESTION");
});

test("continuation joins cut-off replies without repeating the seam", () => {
  assert.equal(joinContinuation('{"thought":"a","action":{"tool":"render_jsx","ar', 'render_jsx","args":{}}}'), '{"thought":"a","action":{"tool":"render_jsx","args":{}}}');
});

test("small talk is answered, build requests are not mistaken for it", () => {
  assert.equal(isSmallTalk("Done?"), true);
  assert.equal(isSmallTalk("make the car red"), false);
});

test("memory budget grows with the window", () => {
  assert.ok(memoryBudget(1_000_000) > memoryBudget(200_000));
});

test("built-in engine patterns are retrieved for matching goals and not for small talk", () => {
  ragStore.setProject({ files: [], nodes: [] });
  assert.match(retrieveRagContext("make a racing car drive with drift"), /Car Driving/);
  assert.match(retrieveRagContext("enemies that chase the player and shoot"), /Enemy Homing/);
  assert.equal(retrieveRagContext("hello how are you"), "");
});
