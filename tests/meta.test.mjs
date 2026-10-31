// Contract tests for src/mobile/meta.js against mocked Meta API replies.
// Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";

const store = new Map([["spider-meta-key-raw", "LLM|1|secret"]]);
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const meta = await import("../src/mobile/meta.js");

const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test("generateImage posts to /responses with the image model and returns a png data URL", async () => {
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init, body: JSON.parse(init.body) };
    return reply({ output: [{ type: "image_generation_call", result: "QUJD" }] });
  };
  const url = await meta.generateImage("a stone statue");
  assert.equal(seen.url, "https://api.meta.ai/v1/responses");
  assert.equal(seen.body.model, "muse-image-1.0");
  assert.equal(seen.init.headers.authorization, "Bearer LLM|1|secret");
  assert.equal(url, "data:image/png;base64,QUJD");
});

test("generateImage reports API errors with status and message", async () => {
  globalThis.fetch = async () => reply({ error: { message: "bad key" } }, 401);
  await assert.rejects(() => meta.generateImage("x"), /Muse Image failed \(401\): bad key/);
});

test("generateImage refuses to call the API without a key", async () => {
  store.delete("spider-meta-key-raw");
  let called = false;
  globalThis.fetch = async () => ((called = true), reply({}));
  await assert.rejects(() => meta.generateImage("x"), /Meta key/);
  assert.equal(called, false);
  store.set("spider-meta-key-raw", "LLM|1|secret");
});

test("planGame returns the plan text and swallows failures", async () => {
  globalThis.fetch = async () => reply({ choices: [{ message: { content: " 1. World\n2. Player " } }] });
  assert.equal(await meta.planGame("make a racer"), "1. World\n2. Player");
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  assert.equal(await meta.planGame("make a racer"), "");
});

test("the tool list names every integration", () => {
  const ids = meta.META_TOOLS.map((t) => t.id).sort();
  assert.deepEqual(ids, ["baseten", "image", "sam", "spark", "voice", "wonder"]);
});
