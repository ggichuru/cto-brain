// All-model gateway: OpenRouter/Together/Moonshot presets, credential-gated
// opencode cloud provider blocks (sovereign default preserved), and the
// cto-code --lane resolution. Offline-green: no network, keys are fake.

import {
  getProvider,
  hasCloudCredential,
  resolveBaseUrl,
  apiKeyEnvName,
} from "../src/router/providers.mjs";
import { buildOpencodeConfig, cloudProviderBlocks } from "../src/cli/opencode-setup.mjs";
import { parseCodeArgs, resolveCloudLane } from "../src/cli/code.mjs";
import { ROUTING_RULES } from "../src/router/select.mjs";
import { DEFAULT_ROUTER_CONFIG } from "../src/router/config.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

// ── presets ──────────────────────────────────────────────────────────────────
for (const id of ["openrouter", "together", "moonshot"]) {
  const p = getProvider(id);
  ok(`${id} preset present`, p?.id === id);
  ok(`${id} tier cloud`, p?.tier === "cloud");
  ok(`${id} openAiCompatible`, p?.openAiCompatible === true);
  ok(`${id} keyRequired`, p?.keyRequired === true);
  ok(`${id} probePath /models`, p?.probePath === "/models");
  ok(`${id} baseUrl is https`, /^https:\/\//.test(p?.baseUrl || ""));
  // credential-gated: no key -> no credential; key present -> credential
  ok(`${id} no cred without key`, hasCloudCredential(p, {}) === false);
  ok(`${id} cred with key`, hasCloudCredential(p, { [apiKeyEnvName(p)]: "x" }) === true);
}

ok("openrouter baseUrl", resolveBaseUrl(getProvider("openrouter"), {}) === "https://openrouter.ai/api/v1");
ok("openrouter default is kimi-k3", getProvider("openrouter").defaultModel === "moonshotai/kimi-k3");
ok("moonshot default is kimi-k3", getProvider("moonshot").defaultModel === "kimi-k3");
ok("moonshot alt key KIMI_API_KEY counts", hasCloudCredential(getProvider("moonshot"), { KIMI_API_KEY: "x" }) === true);

// routable: in default enabledProviders whitelist + in a fallback chain
for (const id of ["openrouter", "together", "moonshot"]) {
  ok(`${id} enabled by default config`, DEFAULT_ROUTER_CONFIG.enabledProviders.includes(id));
}
ok("openrouter in research chain", ROUTING_RULES.research.fallbackChain.includes("openrouter"));
ok("moonshot in reviewer-tech chain", ROUTING_RULES["reviewer-tech"].fallbackChain.includes("moonshot"));
// local-first ordering preserved: locals still precede the cloud boundary
for (const task of ["dispatch-builder", "autonomous-build"]) {
  const c = ROUTING_RULES[task].fallbackChain;
  ok(`${task}: llama-swap before anthropic`, c.indexOf("llama-swap") < c.indexOf("anthropic"));
  ok(`${task}: openrouter after anthropic (cloud cluster)`, c.indexOf("openrouter") > c.indexOf("anthropic"));
}

// ── opencode cloud provider blocks: SOVEREIGN DEFAULT ─────────────────────────
ok("no cloud blocks without keys", Object.keys(cloudProviderBlocks({})).length === 0);

const orBlocks = cloudProviderBlocks({ OPENROUTER_API_KEY: "sk-or-x" });
ok("openrouter block appears with key", !!orBlocks.openrouter);
ok("openrouter block uses openai-compatible", orBlocks.openrouter.npm === "@ai-sdk/openai-compatible");
ok("openrouter block baseURL", orBlocks.openrouter.options.baseURL === "https://openrouter.ai/api/v1");
ok("openrouter key via {env:} template, not inlined", orBlocks.openrouter.options.apiKey === "{env:OPENROUTER_API_KEY}");
ok("openrouter surfaces kimi-k3", !!orBlocks.openrouter.models["moonshotai/kimi-k3"]);
ok("only the keyed gateway appears", Object.keys(cloudProviderBlocks({ OPENROUTER_API_KEY: "x" })).length === 1);
ok("moonshot alt key surfaces block", !!cloudProviderBlocks({ KIMI_API_KEY: "x" }).moonshot);

// buildOpencodeConfig stays sovereign by default; cloud is additive when keyed
const localModels = ["qwen2.5:7b-instruct"];
const bare = buildOpencodeConfig(localModels, { mcpBin: "/x", env: {} });
ok("bare config: ollama provider present", !!bare.provider.ollama);
ok("bare config: NO cloud providers", !bare.provider.openrouter && !bare.provider.together && !bare.provider.moonshot);
ok("bare config: default model is local ollama", (bare.model || "").startsWith("ollama/"));

const keyed = buildOpencodeConfig(localModels, { mcpBin: "/x", env: { OPENROUTER_API_KEY: "x", MOONSHOT_API_KEY: "y" } });
ok("keyed config: ollama still present", !!keyed.provider.ollama);
ok("keyed config: openrouter added", !!keyed.provider.openrouter);
ok("keyed config: moonshot added", !!keyed.provider.moonshot);
ok("keyed config: together NOT added (no key)", !keyed.provider.together);
ok("keyed config: default STILL sovereign local", (keyed.model || "").startsWith("ollama/"));

// ── cto-code --lane parsing + resolution ─────────────────────────────────────
ok("parse --lane openrouter", parseCodeArgs(["code", "--lane", "openrouter"]).lane === "openrouter");
ok("parse --lane=moonshot", parseCodeArgs(["code", "--lane=moonshot"]).lane === "moonshot");
ok("parse no lane -> null", parseCodeArgs(["code"]).lane === null);

ok("resolveCloudLane sovereign default -> null (local path)", resolveCloudLane({ lane: null }, {}) === null);
ok("resolveCloudLane explicit sovereign -> null", resolveCloudLane({ lane: "sovereign" }, {}) === null);
ok("resolveCloudLane unknown lane -> error", !!resolveCloudLane({ lane: "bogus" }, {}).error);
const noKey = resolveCloudLane({ lane: "openrouter" }, {});
ok("resolveCloudLane no key -> error", !!noKey.error);
ok("resolveCloudLane no-key error names the env var", /OPENROUTER_API_KEY/.test(noKey.error));
const withKey = resolveCloudLane({ lane: "openrouter" }, { OPENROUTER_API_KEY: "x" });
ok("resolveCloudLane with key resolves", withKey.providerId === "openrouter");
ok("resolveCloudLane defaults to kimi-k3", withKey.modelId === "moonshotai/kimi-k3");
const override = resolveCloudLane({ lane: "openrouter", model: "anthropic/claude-sonnet-4" }, { OPENROUTER_API_KEY: "x" });
ok("resolveCloudLane honors --model", override.modelId === "anthropic/claude-sonnet-4");
ok("resolveCloudLane moonshot alt key resolves", resolveCloudLane({ lane: "moonshot" }, { KIMI_API_KEY: "x" }).modelId === "kimi-k3");

if (failures) { console.error("\n" + failures + " failure(s)"); process.exit(1); }
console.log("\nAll router-gateway checks passed.");
