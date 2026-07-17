// Tests for the pure OpenCode config-overlay compiler (ADR-0005).
//
// This module must build the runtime config OBJECT + JSON string injected via
// OPENCODE_CONFIG_CONTENT — it writes NO files and reads NO files. The model-map
// filtering must mirror buildOpencodeConfig / capabilities.mjs EXACTLY.

import { test } from "node:test";
import assert from "node:assert/strict";
import { compileOpencodeConfig, compileConfigContent } from "../src/cli/config-compiler.mjs";

const MCP_BIN = "/home/ulap01/bin/cto-brain";

test("excludes box-tanking giants (>20B) from the model map by default", () => {
  const models = ["llama3.1:70b-instruct-q4_K_M", "qwen2.5:7b-instruct"];
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN });
  const map = cfg.provider.ollama.models;
  assert.ok(!("llama3.1:70b-instruct-q4_K_M" in map), "70b giant must be absent");
  assert.ok("qwen2.5:7b-instruct" in map, "7b must be present");
  assert.deepEqual(map["qwen2.5:7b-instruct"], { name: "qwen2.5:7b-instruct (local)" });
});

test("ensureModel force-includes a giant even though it fails the GPU filter", () => {
  const models = ["qwen2.5:7b-instruct"];
  const giant = "llama3.1:70b-instruct-q4_K_M";
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN, ensureModel: giant });
  const map = cfg.provider.ollama.models;
  assert.ok(giant in map, "explicit opt-in giant must be listed despite failing fitsLocalGpu");
  assert.ok("qwen2.5:7b-instruct" in map);
});

test("ensureModel does not double-add a model already in the map", () => {
  const models = ["qwen2.5:7b-instruct"];
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN, ensureModel: "qwen2.5:7b-instruct" });
  assert.equal(Object.keys(cfg.provider.ollama.models).length, 1);
});

test("default model is a tool-capable pick (not the coder)", () => {
  const models = ["qwen2.5-coder:14b", "qwen2.5:7b-instruct"];
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN });
  assert.ok(cfg.model.startsWith("ollama/"), "model must be ollama-namespaced");
  assert.equal(cfg.model, "ollama/qwen2.5:7b-instruct");
});

test("explicit opts.model wins and is normalized (strip a leading ollama/)", () => {
  const models = ["qwen2.5:7b-instruct", "qwen2.5-coder:14b"];
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN, model: "ollama/qwen2.5-coder:14b" });
  assert.equal(cfg.model, "ollama/qwen2.5-coder:14b");
  const cfg2 = compileOpencodeConfig(models, { mcpBin: MCP_BIN, model: "qwen2.5-coder:14b" });
  assert.equal(cfg2.model, "ollama/qwen2.5-coder:14b");
});

test("mcp block carries [mcpBin, 'mcp'] when mcpBin provided; omitted when falsy", () => {
  const models = ["qwen2.5:7b-instruct"];
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN });
  assert.deepEqual(cfg.mcp["cto-brain"], { type: "local", command: [MCP_BIN, "mcp"], enabled: true });

  const cfgNoBin = compileOpencodeConfig(models, {});
  assert.ok(!("mcp" in cfgNoBin), "mcp block omitted when mcpBin falsy");
});

test("agent and permission included when provided, ABSENT when not", () => {
  const models = ["qwen2.5:7b-instruct"];
  const agent = { cto: { mode: "primary" } };
  const permission = { edit: "allow" };
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN, agent, permission });
  assert.deepEqual(cfg.agent, agent);
  assert.deepEqual(cfg.permission, permission);

  const bare = compileOpencodeConfig(models, { mcpBin: MCP_BIN });
  assert.ok(!("agent" in bare), "agent key must not exist when not provided");
  assert.ok(!("permission" in bare), "permission key must not exist when not provided");
});

test("instructions defaults to the cto-brain.md path and is overridable", () => {
  const models = ["qwen2.5:7b-instruct"];
  const cfg = compileOpencodeConfig(models, { mcpBin: MCP_BIN });
  assert.deepEqual(cfg.instructions, ["~/.config/opencode/cto-brain.md"]);

  const custom = ["/tmp/a.md", "/tmp/b.md"];
  const cfg2 = compileOpencodeConfig(models, { mcpBin: MCP_BIN, instructions: custom });
  assert.deepEqual(cfg2.instructions, custom);
});

test("shape mirrors buildOpencodeConfig (schema + provider)", () => {
  const cfg = compileOpencodeConfig(["qwen2.5:7b-instruct"], { mcpBin: MCP_BIN });
  assert.equal(cfg.$schema, "https://opencode.ai/config.json");
  assert.equal(cfg.provider.ollama.npm, "@ai-sdk/openai-compatible");
  assert.equal(cfg.provider.ollama.name, "Ollama (local)");
  assert.equal(cfg.provider.ollama.options.baseURL, "http://127.0.0.1:11434/v1");

  const cfg2 = compileOpencodeConfig(["qwen2.5:7b-instruct"], { mcpBin: MCP_BIN, baseUrl: "http://x/v1" });
  assert.equal(cfg2.provider.ollama.options.baseURL, "http://x/v1");
});

test("vision models get a ', vision' suffix", () => {
  const cfg = compileOpencodeConfig(["qwen2.5vl:7b"], { mcpBin: MCP_BIN });
  assert.deepEqual(cfg.provider.ollama.models["qwen2.5vl:7b"], { name: "qwen2.5vl:7b (local, vision)" });
});

test("compileConfigContent returns a string that JSON.parses to the same object", () => {
  const models = ["qwen2.5:7b-instruct", "qwen2.5-coder:14b"];
  const opts = { mcpBin: MCP_BIN, agent: { cto: {} }, permission: { edit: "ask" } };
  const str = compileConfigContent(models, opts);
  assert.equal(typeof str, "string");
  const parsed = JSON.parse(str);
  assert.deepEqual(parsed, compileOpencodeConfig(models, opts));
});

test("empty models → provider.ollama.models is {} and model is omitted", () => {
  const cfg = compileOpencodeConfig([], { mcpBin: MCP_BIN });
  assert.deepEqual(cfg.provider.ollama.models, {});
  assert.ok(!("model" in cfg), "model key omitted when no chat models");
  // and it still stringifies cleanly
  assert.doesNotThrow(() => JSON.parse(compileConfigContent([], { mcpBin: MCP_BIN })));
});
