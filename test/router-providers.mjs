import {
  getProvider,
  listProviders,
  resolveBaseUrl,
  hasCloudCredential,
  hasApiKey,
  apiKeyEnvName,
  PROVIDER_PRESETS,
} from "../src/router/providers.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

ok("presets non-empty", PROVIDER_PRESETS.length >= 8);
ok("getProvider ollama", getProvider("ollama")?.id === "ollama");
ok("getProvider missing null", getProvider("nope") === null);

const listed = listProviders();
ok("listProviders length", listed.length === PROVIDER_PRESETS.length);
ok("list marks cursor stub", listed.find((p) => p.id === "cursor")?.stub === true);

const ollama = getProvider("ollama");
ok("resolveBaseUrl default", resolveBaseUrl(ollama) === "http://127.0.0.1:11434");
ok("resolveBaseUrl env override", resolveBaseUrl(ollama, { OLLAMA_HOST: "http://10.0.0.5:11434/" }) === "http://10.0.0.5:11434");

const anthropic = getProvider("anthropic");
ok("hasCloudCredential false without key", hasCloudCredential(anthropic, {}) === false);
ok("hasCloudCredential true with key", hasCloudCredential(anthropic, { ANTHROPIC_API_KEY: "x" }) === true);

const fugu = getProvider("fugu");
ok("fugu alt key", hasCloudCredential(fugu, { FUGU_API_KEY: "x" }) === true);
ok("cursor stub no cred", hasCloudCredential(getProvider("cursor"), { CURSOR: "x" }) === false);

// --- jarvis sovereign gateway preset ---
const jarvis = getProvider("jarvis");
ok("jarvis preset present", jarvis?.id === "jarvis");
ok("jarvis label", jarvis?.label === "jarvis (sovereign gateway)");
ok("jarvis tier local", jarvis?.tier === "local");
ok("jarvis openAiCompatible", jarvis?.openAiCompatible === true);
ok("jarvis keyRequired", jarvis?.keyRequired === true);
ok("jarvis probePath /api/models", jarvis?.probePath === "/api/models");
ok("jarvis default model", jarvis?.defaultModel === "qwen2.5-coder:14b");
ok("jarvis baseUrl default", resolveBaseUrl(jarvis, {}) === "https://jarvis.mkulyma.com");
ok("jarvis baseUrl env override", resolveBaseUrl(jarvis, { JARVIS_BASE_URL: "http://127.0.0.1:11475/" }) === "http://127.0.0.1:11475");
ok("jarvis key env name", apiKeyEnvName(jarvis) === "JARVIS_API_KEY");
ok("jarvis hasApiKey false without key", hasApiKey(jarvis, {}) === false);
ok("jarvis hasApiKey true with key", hasApiKey(jarvis, { JARVIS_API_KEY: "x" }) === true);
ok("jarvis cred false without key", hasCloudCredential(jarvis, {}) === false);
ok("jarvis cred true with key", hasCloudCredential(jarvis, { JARVIS_API_KEY: "x" }) === true);
// JARVIS_BASE_URL alone (no key) must NOT count as a credential
ok("jarvis baseUrl env is not a key", hasApiKey(jarvis, { JARVIS_BASE_URL: "http://x" }) === false);

const listedJarvis = listProviders().find((p) => p.id === "jarvis");
ok("jarvis listed", !!listedJarvis);
ok("jarvis listed not stub", listedJarvis?.stub === false);

// --- llama-swap preset (single-box gateway; also serves Anthropic /v1/messages) ---
const llamaSwap = getProvider("llama-swap");
ok("llama-swap preset present", llamaSwap?.id === "llama-swap");
ok("llama-swap tier local", llamaSwap?.tier === "local");
ok("llama-swap openAiCompatible", llamaSwap?.openAiCompatible === true);
ok("llama-swap probePath /v1/models", llamaSwap?.probePath === "/v1/models");
ok("llama-swap envKey", llamaSwap?.envKey === "LLAMA_SWAP_BASE_URL");
ok("llama-swap baseUrl default", resolveBaseUrl(llamaSwap, {}) === "http://127.0.0.1:8080");
ok(
  "llama-swap baseUrl env override",
  resolveBaseUrl(llamaSwap, { LLAMA_SWAP_BASE_URL: "http://10.0.0.9:9292/" }) === "http://10.0.0.9:9292"
);
ok("llama-swap note documents /v1/messages", typeof llamaSwap?.note === "string" && llamaSwap.note.includes("/v1/messages"));
ok("llama-swap listed", listProviders().some((p) => p.id === "llama-swap"));

// --- lmstudio preset (the common Mac laptop case) ---
const lmstudio = getProvider("lmstudio");
ok("lmstudio preset present", lmstudio?.id === "lmstudio");
ok("lmstudio tier local", lmstudio?.tier === "local");
ok("lmstudio openAiCompatible", lmstudio?.openAiCompatible === true);
ok("lmstudio probePath /v1/models", lmstudio?.probePath === "/v1/models");
ok("lmstudio envKey", lmstudio?.envKey === "LMSTUDIO_BASE_URL");
ok("lmstudio baseUrl default", resolveBaseUrl(lmstudio, {}) === "http://127.0.0.1:1234");
ok(
  "lmstudio baseUrl env override",
  resolveBaseUrl(lmstudio, { LMSTUDIO_BASE_URL: "http://10.0.0.9:1234/" }) === "http://10.0.0.9:1234"
);
ok("lmstudio listed", listProviders().some((p) => p.id === "lmstudio"));

// --- all-model gateway cloud presets (openrouter / moonshot / together) ---
const gateways = [
  {
    id: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    baseEnv: "OPENROUTER_BASE_URL",
    keyEnv: "OPENROUTER_API_KEY",
    defaultModel: "openrouter/auto",
    baseOverride: "http://127.0.0.1:9001/v1",
  },
  {
    id: "moonshot",
    baseUrl: "https://api.moonshot.ai/v1",
    baseEnv: "MOONSHOT_BASE_URL",
    keyEnv: "MOONSHOT_API_KEY",
    defaultModel: "kimi-k2",
    baseOverride: "http://127.0.0.1:9002/v1",
  },
  {
    id: "together",
    baseUrl: "https://api.together.xyz/v1",
    baseEnv: "TOGETHER_BASE_URL",
    keyEnv: "TOGETHER_API_KEY",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    baseOverride: "http://127.0.0.1:9003/v1",
  },
];

for (const g of gateways) {
  const p = getProvider(g.id);
  ok(`${g.id} preset present`, p?.id === g.id);
  ok(`${g.id} tier cloud`, p?.tier === "cloud");
  ok(`${g.id} keyRequired`, p?.keyRequired === true);
  ok(`${g.id} openAiCompatible`, p?.openAiCompatible === true);
  ok(`${g.id} baseUrl default`, p?.baseUrl === g.baseUrl);
  ok(`${g.id} envKey is base-url override`, p?.envKey === g.baseEnv);
  ok(`${g.id} apiKeyEnv is the key`, apiKeyEnvName(p) === g.keyEnv);
  ok(`${g.id} default model`, p?.defaultModel === g.defaultModel);
  ok(`${g.id} resolveBaseUrl default`, resolveBaseUrl(p, {}) === g.baseUrl);
  ok(
    `${g.id} resolveBaseUrl env override`,
    resolveBaseUrl(p, { [g.baseEnv]: g.baseOverride + "/" }) === g.baseOverride
  );
  ok(`${g.id} hasApiKey false without key`, hasApiKey(p, {}) === false);
  ok(`${g.id} hasApiKey true with key`, hasApiKey(p, { [g.keyEnv]: "x" }) === true);
  // a bare base-URL env must NOT be mistaken for a credential
  ok(`${g.id} base-url env is not a key`, hasApiKey(p, { [g.baseEnv]: "http://x" }) === false);
  ok(`${g.id} cred false without key`, hasCloudCredential(p, {}) === false);
  ok(`${g.id} cred true with key`, hasCloudCredential(p, { [g.keyEnv]: "x" }) === true);
  ok(`${g.id} listed`, listProviders().some((x) => x.id === g.id));
}

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-providers checks passed.");
