import {
  getProvider,
  listProviders,
  resolveBaseUrl,
  hasCloudCredential,
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

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-providers checks passed.");
