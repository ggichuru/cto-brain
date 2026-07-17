// opencode-setup: the generated config's model map must track the LIVE ollama
// roster, or opencode rejects a picked-but-unlisted model ("model not valid").
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildOpencodeConfig, reconcileOllamaModels } from "../src/cli/opencode-setup.mjs";

let pass = 0;
const ok = (name, fn) => { fn(); pass++; process.stdout.write(`  ok  ${name}\n`); };

function tmpCfg(obj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "octest-"));
  const p = path.join(dir, "opencode.jsonc");
  if (typeof obj === "string") fs.writeFileSync(p, obj);
  else fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
  return p;
}
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const baseCfg = (models) => ({
  $schema: "https://opencode.ai/config.json",
  model: `ollama/${models[0]}`,
  provider: { ollama: { npm: "@ai-sdk/openai-compatible", options: { baseURL: "x" },
    models: Object.fromEntries(models.map((m) => [m, { name: `${m} (local)` }])) } },
  mcp: { "cto-brain": { type: "local", command: ["/bin/cto-brain", "mcp"], enabled: true } },
});

// buildOpencodeConfig
ok("build excludes box-tanking giants (>20B) by default", () => {
  const cfg = buildOpencodeConfig(["qwen2.5:7b-instruct", "llama3.1:70b-instruct-q4_K_M"]);
  assert.ok(cfg.provider.ollama.models["qwen2.5:7b-instruct"]);
  assert.ok(!cfg.provider.ollama.models["llama3.1:70b-instruct-q4_K_M"]);
});
ok("build force-includes an explicit ensureModel even when large", () => {
  const cfg = buildOpencodeConfig(["qwen2.5:7b-instruct", "llama3.1:70b-instruct-q4_K_M"],
    { ensureModel: "llama3.1:70b-instruct-q4_K_M" });
  assert.ok(cfg.provider.ollama.models["llama3.1:70b-instruct-q4_K_M"]);
});

// reconcileOllamaModels — the load-bearing fix
ok("reconcile adds a newly-pulled live model to a stale config", () => {
  const p = tmpCfg(baseCfg(["qwen2.5:7b-instruct"]));
  const r = reconcileOllamaModels(p, ["qwen2.5:7b-instruct", "qwen2.5:14b-instruct"]);
  assert.strictEqual(r.changed, true);
  assert.ok(read(p).provider.ollama.models["qwen2.5:14b-instruct"]);
});
ok("reconcile prunes a model that is no longer live", () => {
  const p = tmpCfg(baseCfg(["qwen2.5:7b-instruct", "gemma4:12b"]));
  const r = reconcileOllamaModels(p, ["qwen2.5:7b-instruct"]);
  assert.strictEqual(r.changed, true);
  assert.ok(!read(p).provider.ollama.models["gemma4:12b"]);
});
ok("reconcile repairs the default model when it vanishes", () => {
  const p = tmpCfg({ ...baseCfg(["gemma4:12b"]), model: "ollama/gemma4:12b" });
  reconcileOllamaModels(p, ["qwen2.5:7b-instruct"]);
  const cfg = read(p);
  assert.notStrictEqual(cfg.model, "ollama/gemma4:12b");
  assert.ok(cfg.provider.ollama.models[cfg.model.replace(/^ollama\//, "")]);
});
ok("reconcile force-includes an explicit ensureModel even if large", () => {
  const p = tmpCfg(baseCfg(["qwen2.5:7b-instruct"]));
  const r = reconcileOllamaModels(p, ["qwen2.5:7b-instruct"], { ensureModel: "llama3.1:70b-instruct-q4_K_M" });
  assert.strictEqual(r.changed, true);
  assert.ok(read(p).provider.ollama.models["llama3.1:70b-instruct-q4_K_M"]);
});
ok("reconcile no-ops on an already-current config (idempotent)", () => {
  const p = tmpCfg(baseCfg(["qwen2.5:7b-instruct", "qwen2.5-coder:14b"]));
  const r = reconcileOllamaModels(p, ["qwen2.5:7b-instruct", "qwen2.5-coder:14b"]);
  assert.strictEqual(r.changed, false);
});
ok("reconcile never wipes the map when ollama is unreachable (empty roster)", () => {
  const p = tmpCfg(baseCfg(["qwen2.5:7b-instruct"]));
  const r = reconcileOllamaModels(p, []);
  assert.strictEqual(r.changed, false);
  assert.ok(read(p).provider.ollama.models["qwen2.5:7b-instruct"]);
});
ok("reconcile leaves a hand-edited (commented) config untouched", () => {
  const p = tmpCfg('{\n  // user comment\n  "model": "ollama/qwen2.5:7b-instruct"\n}\n');
  const before = fs.readFileSync(p, "utf8");
  const r = reconcileOllamaModels(p, ["qwen2.5:7b-instruct", "qwen2.5:14b-instruct"]);
  assert.strictEqual(r.changed, false);
  assert.strictEqual(fs.readFileSync(p, "utf8"), before);
});
ok("reconcile preserves a user-customized model display name", () => {
  const cfg = baseCfg(["qwen2.5:7b-instruct"]);
  cfg.provider.ollama.models["qwen2.5:7b-instruct"] = { name: "My Favorite" };
  const p = tmpCfg(cfg);
  reconcileOllamaModels(p, ["qwen2.5:7b-instruct", "qwen2.5:14b-instruct"]);
  assert.strictEqual(read(p).provider.ollama.models["qwen2.5:7b-instruct"].name, "My Favorite");
});

process.stdout.write(`opencode-setup: ${pass} passed\n`);
