import { discoverLocal, DISCOVERY_TARGETS } from "../src/router/discover.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

ok("discovery targets defined", DISCOVERY_TARGETS.length >= 4);

const found = await discoverLocal({
  host: "127.0.0.1",
  timeoutMs: 300,
  env: {
    OLLAMA_HOST: "http://127.0.0.1:59997",
    DESK_ENGINE_URL: "http://127.0.0.1:59996",
  },
});

ok("discover returns array", Array.isArray(found));
for (const item of found) {
  ok(`discovered ${item.id} reachable`, item.reachable === true);
  ok(`discovered ${item.id} has id`, typeof item.id === "string");
}

ok("lmstudio in discovery targets", DISCOVERY_TARGETS.some((t) => t.presetId === "lmstudio" && t.port === 1234));
ok("llama-swap in discovery targets", DISCOVERY_TARGETS.some((t) => t.presetId === "llama-swap" && t.port === 8080));

// --- fake-fetch scenarios: fully offline, no real sockets ---
function fakeRes(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body ?? {}) };
}

const realFetch = globalThis.fetch;

// LM Studio answering /v1/models on :1234; everything else refused.
globalThis.fetch = async (url) => {
  if (String(url) === "http://127.0.0.1:1234/v1/models") {
    return fakeRes(200, { data: [{ id: "qwen2.5-coder-14b-mlx" }] });
  }
  throw new Error("ECONNREFUSED");
};
const lmFound = await discoverLocal({ host: "127.0.0.1", timeoutMs: 300, env: {} });
const lm = lmFound.find((f) => f.id === "lmstudio");
ok("lmstudio discovered on :1234", !!lm && lm.reachable === true);
ok("lmstudio probe carries models", lm?.models?.includes("qwen2.5-coder-14b-mlx"));

// A server on :8080 answering GET /running is llama-swap, not bare llama.cpp.
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u === "http://127.0.0.1:8080/v1/models") return fakeRes(200, { data: [{ id: "qwen3-coder-30b" }] });
  if (u === "http://127.0.0.1:8080/running") return fakeRes(200, { running: [] });
  throw new Error("ECONNREFUSED");
};
const swapFound = await discoverLocal({ host: "127.0.0.1", timeoutMs: 300, env: {} });
ok("llama-swap reported when /running answers", swapFound.some((f) => f.id === "llama-swap" && f.reachable === true));
ok("llamacpp not reported when /running answers", !swapFound.some((f) => f.id === "llamacpp"));

// Same server 404ing /running stays bare llama.cpp.
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u === "http://127.0.0.1:8080/v1/models") return fakeRes(200, { data: [{ id: "qwen3-coder-30b" }] });
  if (u === "http://127.0.0.1:8080/running") return fakeRes(404, { error: "not found" });
  throw new Error("ECONNREFUSED");
};
const cppFound = await discoverLocal({ host: "127.0.0.1", timeoutMs: 300, env: {} });
ok("llamacpp reported when /running 404s", cppFound.some((f) => f.id === "llamacpp" && f.reachable === true));
ok("llama-swap not reported when /running 404s", !cppFound.some((f) => f.id === "llama-swap"));

globalThis.fetch = realFetch;

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-discover checks passed.");
