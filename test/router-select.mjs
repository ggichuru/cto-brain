import { selectRoute, TASK_KINDS, ROUTING_RULES } from "../src/router/select.mjs";
import { DEFAULT_ROUTER_CONFIG } from "../src/router/config.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const mockLocalProbe = {
  id: "ollama",
  reachable: true,
  models: ["qwen2.5-coder:14b"],
  baseUrl: "http://127.0.0.1:11434",
};

const mockCloudEnv = { ANTHROPIC_API_KEY: "test-key" };

for (const task of TASK_KINDS) {
  const r = selectRoute({
    task,
    prefer: "auto",
    probes: [mockLocalProbe],
    env: mockCloudEnv,
  });
  ok(`${task} returns honest flag`, r.honest === true);
  ok(`${task} has reason string`, typeof r.reason === "string" && r.reason.length > 0);
  ok(`${task} has task field`, r.task === task);
  ok(`${task} rule exists`, !!ROUTING_RULES[task]);
}

const localOnly = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLocalProbe],
});
ok("local prefer picks ollama", localOnly.provider === "ollama");
ok("local prefer has model", localOnly.model === "qwen2.5-coder:14b");

const noProbe = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [],
});
ok("no local probe returns null provider", noProbe.provider === null);
ok("no local probe honest", noProbe.honest === true);

const cloudReview = selectRoute({
  task: "reviewer-security",
  prefer: "cloud",
  probes: [],
  env: mockCloudEnv,
});
ok("cloud reviewer picks anthropic", cloudReview.provider === "anthropic");

const cloudReviewNoKey = selectRoute({
  task: "reviewer-security",
  prefer: "cloud",
  probes: [mockLocalProbe],
  env: {},
});
ok("cloud prefer without keys falls back local", cloudReviewNoKey.provider === "ollama");
ok("override model not on wrong provider", cloudReviewNoKey.model !== "sonnet");

const autoReview = selectRoute({
  task: "reviewer-tech",
  prefer: "auto",
  probes: [],
  env: mockCloudEnv,
});
ok("auto reviewer-tier picks cloud", autoReview.provider === "anthropic");

const autoBuilder = selectRoute({
  task: "dispatch-builder",
  prefer: "auto",
  probes: [mockLocalProbe],
  env: mockCloudEnv,
});
ok("auto builder-tier picks local", autoBuilder.provider === "ollama");

const researchCloud = selectRoute({
  task: "research",
  prefer: "auto",
  probes: [],
  env: { OPENAI_API_KEY: "test" },
});
ok("research auto picks openai", researchCloud.provider === "openai");

const inlineLocal = selectRoute({
  task: "inline-edit",
  prefer: "local",
  probes: [mockLocalProbe],
});
ok("inline-edit local ollama", inlineLocal.provider === "ollama");

const withOverride = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLocalProbe],
  config: {
    routing: {
      builder: { provider: "ollama", model: "custom-model:7b" },
    },
  },
});
ok("project override model", withOverride.model === "custom-model:7b");
ok("project override provider", withOverride.provider === "ollama");

const unknown = selectRoute({ task: "not-a-task" });
ok("unknown task null provider", unknown.provider === null);

// --- jarvis sovereign gateway selection ---
const mockJarvisProbe = {
  id: "jarvis",
  reachable: true,
  models: ["qwen2.5-coder:14b", "llama3.1:70b-instruct-q4_K_M", "nomic-embed-text:latest"],
  baseUrl: "https://jarvis.mkulyma.com",
  tier: "local",
};

// jarvis is in dispatch-builder's chain; with only a jarvis probe (no ollama),
// local-prefer should select jarvis.
const jarvisBuilder = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockJarvisProbe],
});
ok("jarvis selectable for builder (local)", jarvisBuilder.provider === "jarvis");
ok("jarvis builder picks probed model", jarvisBuilder.model === "qwen2.5-coder:14b");
ok("jarvis builder baseUrl from probe", jarvisBuilder.baseUrl === "https://jarvis.mkulyma.com");
ok("jarvis builder honest", jarvisBuilder.honest === true);

// when both ollama and jarvis probe, ollama wins (chain order ollama, jarvis)
const bothLocal = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLocalProbe, mockJarvisProbe],
});
ok("ollama wins over jarvis when both probed", bothLocal.provider === "ollama");

// jarvis as sovereign fallback for reviewer when no cloud key + local prefer
const jarvisReview = selectRoute({
  task: "reviewer-tech",
  prefer: "local",
  probes: [mockJarvisProbe],
  env: {},
});
ok("jarvis sovereign reviewer fallback", jarvisReview.provider === "jarvis");

// unprobed jarvis (no key / down) must NOT be selected for local-tier task
const jarvisUnprobed = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [],
});
ok("unprobed jarvis not selected", jarvisUnprobed.provider === null);

// --- llama-swap / lmstudio local gateways ---
const mockLlamaSwapProbe = {
  id: "llama-swap",
  reachable: true,
  models: ["qwen3-coder-30b", "glm-4.5-air"],
  baseUrl: "http://127.0.0.1:8080",
};

// ollama down, llama-swap reachable: local builder routes to llama-swap.
const swapBuilder = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLlamaSwapProbe],
});
ok("llama-swap selectable for builder (local)", swapBuilder.provider === "llama-swap");
ok("llama-swap builder picks probed model", swapBuilder.model === "qwen3-coder-30b");
ok("llama-swap builder baseUrl from probe", swapBuilder.baseUrl === "http://127.0.0.1:8080");
ok("llama-swap builder honest", swapBuilder.honest === true);

const mockLmStudioProbe = {
  id: "lmstudio",
  reachable: true,
  models: ["qwen2.5-coder-14b-mlx"],
  baseUrl: "http://127.0.0.1:1234",
};

const lmBuilder = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLmStudioProbe],
});
ok("lmstudio selectable for builder (local)", lmBuilder.provider === "lmstudio");
ok("lmstudio builder picks probed model", lmBuilder.model === "qwen2.5-coder-14b-mlx");
ok("lmstudio builder baseUrl from probe", lmBuilder.baseUrl === "http://127.0.0.1:1234");

// fallbackChain ordering: ollama -> llamacpp -> llama-swap/lmstudio -> cloud
for (const task of ["dispatch-builder", "autonomous-build"]) {
  const chain = ROUTING_RULES[task].fallbackChain;
  const iOllama = chain.indexOf("ollama");
  const iCpp = chain.indexOf("llamacpp");
  const iSwap = chain.indexOf("llama-swap");
  const iLm = chain.indexOf("lmstudio");
  const iCloud = chain.indexOf("anthropic");
  ok(`${task} chain has llama-swap`, iSwap !== -1);
  ok(`${task} chain has lmstudio`, iLm !== -1);
  ok(`${task} chain ollama before llamacpp`, iOllama !== -1 && iOllama < iCpp);
  ok(`${task} chain llamacpp before llama-swap`, iCpp < iSwap);
  ok(`${task} chain llamacpp before lmstudio`, iCpp < iLm);
  ok(`${task} chain llama-swap before cloud`, iCloud !== -1 && iSwap < iCloud);
  ok(`${task} chain lmstudio before cloud`, iLm < iCloud);
}

// remaining local-first chains carry them too, before any cloud entry
for (const task of ["explore", "inline-edit"]) {
  const chain = ROUTING_RULES[task].fallbackChain;
  const iSwap = chain.indexOf("llama-swap");
  const iLm = chain.indexOf("lmstudio");
  const iCloud = chain.indexOf("anthropic");
  ok(`${task} chain has llama-swap before cloud`, iSwap !== -1 && iSwap < iCloud);
  ok(`${task} chain has lmstudio before cloud`, iLm !== -1 && iLm < iCloud);
}

// default enabledProviders must not filter the new presets out
const enabledDefault = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLlamaSwapProbe],
  config: { enabledProviders: DEFAULT_ROUTER_CONFIG.enabledProviders },
});
ok("llama-swap enabled by default config", enabledDefault.provider === "llama-swap");

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-select checks passed.");
