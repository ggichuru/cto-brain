// The model-agnostic layer: provider resolution routes THROUGH
// src/router/providers.mjs to the configured baseUrl/model/key. No live call —
// we assert the resolved descriptor and the built upstream request.

import { resolveChatProvider, buildUpstreamRequest, chatUrlFor, wireFor } from "../src/chat/provider.mjs";
import { getProvider } from "../src/router/providers.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

// --- OpenAI-compatible custom base + key from env ---
{
  const env = { OPENAI_API_KEY: "sk-secret-should-stay-server-side" };
  const r = resolveChatProvider({ id: "openai-compatible", baseUrl: "http://gpu-box:8000", model: "my-model", apiKeyEnv: "OPENAI_API_KEY" }, env);
  ok("openai-compatible routes to configured baseUrl", r.baseUrl === "http://gpu-box:8000");
  ok("openai-compatible uses configured model", r.model === "my-model");
  ok("openai-compatible wire is openai", r.wire === "openai");
  ok("openai-compatible chatUrl", r.chatUrl === "http://gpu-box:8000/v1/chat/completions");
  ok("openai-compatible sees the key", r.hasKey === true);
  const req = buildUpstreamRequest(r, { messages: [{ role: "user", content: "hi" }] });
  ok("upstream Bearer set from env key", req.headers.authorization === "Bearer sk-secret-should-stay-server-side");
  ok("upstream body carries model", req.body.model === "my-model");
  ok("upstream body streams", req.body.stream === true);
}

// --- base URL already ending in /v1 must not double ---
{
  const r = resolveChatProvider({ id: "openai", model: "gpt-4o-mini" }, { OPENAI_API_KEY: "sk-x" });
  ok("openai default baseUrl via preset", r.baseUrl === "https://api.openai.com/v1");
  ok("openai chatUrl no double v1", r.chatUrl === "https://api.openai.com/v1/chat/completions");
  ok("openai keyRequired", r.keyRequired === true);
}

// --- env base-URL override flows through resolveBaseUrl ---
{
  const r = resolveChatProvider({ id: "openai-compatible", model: "m" }, { OPENAI_BASE_URL: "http://10.0.0.5:8000/" });
  ok("env OPENAI_BASE_URL override", r.baseUrl === "http://10.0.0.5:8000");
  ok("no key → hasKey false", r.hasKey === false);
}

// --- local ollama: native wire, no key required ---
{
  const r = resolveChatProvider({ id: "ollama", model: "llama3.1" }, {});
  ok("ollama wire native", r.wire === "ollama");
  ok("ollama chatUrl /api/chat", r.chatUrl === "http://127.0.0.1:11434/api/chat");
  ok("ollama keyRequired false", r.keyRequired === false);
  const req = buildUpstreamRequest(r, { messages: [{ role: "user", content: "hi" }] });
  ok("ollama no Bearer header", req.headers.authorization === undefined);
  ok("ollama temperature in options", req.body.options && typeof req.body.options.temperature === "number");
}

// --- anthropic: messages wire, x-api-key header, system split out ---
{
  const r = resolveChatProvider({ id: "anthropic", model: "claude-x" }, { ANTHROPIC_API_KEY: "sk-ant-abc" });
  ok("anthropic wire", r.wire === "anthropic");
  ok("anthropic chatUrl /v1/messages", r.chatUrl === "https://api.anthropic.com/v1/messages");
  const req = buildUpstreamRequest(r, { messages: [{ role: "system", content: "SYS" }, { role: "user", content: "hi" }] });
  ok("anthropic x-api-key header", req.headers["x-api-key"] === "sk-ant-abc");
  ok("anthropic version header", req.headers["anthropic-version"] === "2023-06-01");
  ok("anthropic system split out of messages", req.body.system === "SYS" && req.body.messages.length === 1);
  ok("anthropic no Authorization Bearer", req.headers.authorization === undefined);
}

// --- multi-model (Fast/Deep) ---
{
  const r = resolveChatProvider({ id: "ollama", model: "llama3.1", models: [{ id: "llama3.1", label: "Fast" }, { id: "llama3.1:70b", label: "Deep" }] }, {});
  ok("models list preserved", r.models.length === 2 && r.models[1].label === "Deep");
}

// --- pure helpers + guards ---
ok("wireFor unknown → openai", wireFor(null) === "openai");
ok("chatUrlFor strips trailing slash", chatUrlFor("http://x:8000/", "openai") === "http://x:8000/v1/chat/completions");
ok("unknown provider throws", (() => { try { resolveChatProvider({ id: "nope" }, {}); return false; } catch { return true; } })());
ok("stub provider (cursor) throws", (() => { try { resolveChatProvider({ id: "cursor" }, {}); return false; } catch { return true; } })());
ok("preset registry reused (not reimplemented)", getProvider("ollama")?.id === "ollama");

if (failures) { console.error("\n" + failures + " failure(s)"); process.exit(1); }
console.log("\nAll chat-provider checks passed.");
