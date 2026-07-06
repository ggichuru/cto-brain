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

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-providers checks passed.");
