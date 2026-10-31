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

test("SAM: the real recorded response decodes into a mask with the parser", async () => {
  const fs = await import("node:fs");
  const body = JSON.parse(fs.readFileSync(new URL("./fixtures/sam-real-response.json", import.meta.url), "utf8"));
  const masks = await meta.masksFromResponse(body);
  assert.equal(masks.length, 1);
  const m = masks[0];
  assert.deepEqual([m.mask.width, m.mask.height], [710, 839]);
  assert.deepEqual(m.bounds, { left: 445, top: 373, right: 1155, bottom: 1212 });
});

test("SAM prompts are short noun phrases", () => {
  assert.equal(meta.samPhrase("Cut out the red car"), "red car");
  assert.equal(meta.samPhrase("the tree"), "tree");
  assert.equal(meta.samPhrase(""), "object");
});

test("image type comes from the bytes: the API returns WebP", () => {
  assert.equal(meta.imageMime("UklGRnoRAQBXRUJQ"), "image/webp");
  assert.equal(meta.imageMime("iVBORw0KGgo"), "image/png");
  assert.equal(meta.imageMime("/9j/4AAQ"), "image/jpeg");
});

test("Wonder is asked by its real model id with room to think", async () => {
  let body;
  globalThis.fetch = async (_u, init) => ((body = JSON.parse(init.body)), reply({ choices: [{ message: { content: "1. World" } }] }));
  await meta.planGame("make a racer");
  assert.equal(body.model, "muse-wonder-1.0");
  assert.ok(body.max_tokens >= 4000);
});

test("WAV encoder writes a valid 16 kHz mono header", async () => {
  const wav = meta.encodeWav(new Int16Array([0, 1000, -1000, 32767]), 16000);
  const b = new DataView(await wav.arrayBuffer());
  const tag = (o) => String.fromCharCode(b.getUint8(o), b.getUint8(o + 1), b.getUint8(o + 2), b.getUint8(o + 3));
  assert.equal(tag(0), "RIFF");
  assert.equal(tag(8), "WAVE");
  assert.equal(b.getUint32(24, true), 16000);
  assert.equal(b.getUint16(22, true), 1);
  assert.equal(b.getUint32(40, true), 8);
  assert.equal(wav.size, 44 + 8);
});

test("HTTP transcription sends the request and audio parts the API asks for", async () => {
  let form;
  globalThis.fetch = async (url, init) => ((form = { url, body: init.body }), reply({ transcript: " hello there " }));
  const text = await meta.transcribeWav(meta.encodeWav(new Int16Array(100)), { language: "en" });
  assert.equal(text, "hello there");
  assert.equal(form.url, "https://api.meta.ai/v1/asr/transcribe");
  assert.ok(form.body.has("request") && form.body.has("audio"));
  const req = JSON.parse(await form.body.get("request").text());
  assert.equal(req.model, "muse-voice-transcribe-1.0");
  assert.equal(req.audioEncoding, "WAV");
});

test("reasoning models get a budget big enough to think and answer", async () => {
  const { chat, providerById, isReasoningModel } = await import("../src/mobile/ai.js");
  assert.equal(isReasoningModel("meta", "muse-spark-1.3"), true);
  assert.equal(isReasoningModel("openai", "gpt-4o"), false);
  let sent;
  globalThis.fetch = async (_u, init) => {
    sent = JSON.parse(init.body);
    return { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }), body: null, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: "Yes." } }] }) };
  };
  const text = await chat({ provider: providerById("meta"), key: "k", model: "muse-spark-1.3", messages: [{ role: "user", content: "Done?" }], maxTokens: 500 });
  assert.equal(text, "Yes.");
  assert.ok((sent.max_tokens ?? sent.max_completion_tokens) >= 6000, `sent ${sent.max_tokens}`);
});

test("an empty reply caused by the length limit is retried with a larger budget", async () => {
  const { chat, providerById } = await import("../src/mobile/ai.js");
  const budgets = [];
  globalThis.fetch = async (_u, init) => {
    const b = JSON.parse(init.body);
    budgets.push(b.max_tokens ?? b.max_completion_tokens);
    const empty = budgets.length === 1;
    return { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }), body: null, json: async () => ({ choices: [{ finish_reason: empty ? "length" : "stop", message: { content: empty ? null : "Answer" } }] }) };
  };
  const text = await chat({ provider: providerById("meta"), key: "k", model: "muse-spark-1.3", messages: [{ role: "user", content: "hi" }], maxTokens: 6000 });
  assert.equal(text, "Answer");
  assert.ok(budgets[1] > budgets[0], budgets.join(","));
});
