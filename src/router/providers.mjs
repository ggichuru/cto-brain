/** Provider presets — auditable registry, not a learned router. */

export const PROVIDER_PRESETS = [
  {
    id: "ollama",
    label: "Ollama (local)",
    baseUrl: "http://127.0.0.1:11434",
    envKey: "OLLAMA_HOST",
    defaultModel: "llama3.1",
    tier: "local",
    probePath: "/api/tags",
    openAiCompatible: false,
  },
  {
    id: "vllm",
    label: "vLLM (local)",
    baseUrl: "http://127.0.0.1:8000",
    envKey: "VLLM_BASE_URL",
    defaultModel: "",
    tier: "local",
    probePath: "/v1/models",
    openAiCompatible: true,
  },
  {
    id: "llamacpp",
    label: "llama.cpp server (local)",
    baseUrl: "http://127.0.0.1:8080",
    envKey: "LLAMACPP_BASE_URL",
    defaultModel: "",
    tier: "local",
    probePath: "/v1/models",
    openAiCompatible: true,
  },
  {
    id: "llama-swap",
    label: "llama-swap (local gateway)",
    baseUrl: "http://127.0.0.1:8080",
    envKey: "LLAMA_SWAP_BASE_URL",
    defaultModel: "",
    tier: "local",
    probePath: "/v1/models",
    openAiCompatible: true,
    note: "Also serves Anthropic /v1/messages — Anthropic-wire clients can point straight at it.",
  },
  {
    id: "lmstudio",
    label: "LM Studio (local)",
    baseUrl: "http://127.0.0.1:1234",
    envKey: "LMSTUDIO_BASE_URL",
    defaultModel: "",
    tier: "local",
    probePath: "/v1/models",
    openAiCompatible: true,
  },
  {
    id: "openai-compatible",
    label: "OpenAI-compatible (custom local)",
    baseUrl: "http://127.0.0.1:8000",
    envKey: "OPENAI_BASE_URL",
    defaultModel: "",
    tier: "local",
    probePath: "/v1/models",
    openAiCompatible: true,
  },
  {
    id: "fugu",
    label: "Sakana Fugu",
    baseUrl: "https://api.sakana.ai/v1",
    envKey: "SAKANA_API_KEY",
    altEnvKeys: ["FUGU_API_KEY"],
    defaultModel: "fugu",
    tier: "cloud",
    probePath: null,
    openAiCompatible: true,
    keyRequired: true,
  },
  {
    id: "anthropic",
    label: "Anthropic API",
    baseUrl: "https://api.anthropic.com",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-20250514",
    tier: "cloud",
    probePath: null,
    keyRequired: true,
  },
  {
    id: "openai",
    label: "OpenAI API",
    baseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    tier: "cloud",
    probePath: null,
    keyRequired: true,
  },
  {
    id: "cursor",
    label: "Cursor (IDE session)",
    baseUrl: null,
    envKey: null,
    defaultModel: null,
    tier: "cloud",
    probePath: null,
    stub: true,
    stubReason: "Cursor model access is IDE-bound; cto-brain cannot probe or dispatch directly.",
  },
  {
    id: "codex",
    label: "Codex CLI (ChatGPT session)",
    baseUrl: null,
    envKey: null,
    defaultModel: null,
    tier: "cloud",
    probePath: null,
    stub: true,
    stubReason: "Use Codex CLI in terminal; cto-brain records routing intent only.",
  },
  {
    id: "desk-engine",
    label: "The Desk engine",
    baseUrl: "http://127.0.0.1:8787",
    envKey: "DESK_ENGINE_URL",
    defaultModel: null,
    tier: "local",
    probePath: "/health",
    stackType: "desk",
  },
  {
    id: "openrouter",
    label: "OpenRouter (gateway — 400+ models)",
    baseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_BASE_URL",
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: "openrouter/auto",
    tier: "cloud",
    probePath: null,
    openAiCompatible: true,
    keyRequired: true,
    note: "Breadth lane: one key reaches 400+ frontier/gateway models. Slugs are provider/model (e.g. moonshotai/kimi-k3, anthropic/claude-*).",
  },
  {
    id: "moonshot",
    label: "Moonshot / Kimi (direct)",
    baseUrl: "https://api.moonshot.ai/v1",
    envKey: "MOONSHOT_BASE_URL",
    apiKeyEnv: "MOONSHOT_API_KEY",
    defaultModel: "kimi-k2",
    tier: "cloud",
    probePath: null,
    openAiCompatible: true,
    keyRequired: true,
    note: "Direct depth: first-party SLA + native /anthropic path. K3 (frontier escalation) via model id kimi-k3.",
  },
  {
    id: "together",
    label: "Together AI (fine-tune + Code Interpreter)",
    baseUrl: "https://api.together.xyz/v1",
    envKey: "TOGETHER_BASE_URL",
    apiKeyEnv: "TOGETHER_API_KEY",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    tier: "cloud",
    probePath: null,
    openAiCompatible: true,
    keyRequired: true,
    note: "Escape hatch: cloud fine-tune (LoRA adapter comes home) + Code Interpreter (untrusted-exec lane); reach giant open weights (Kimi-K2-Instruct) here.",
  },
  {
    id: "jarvis",
    label: "jarvis (sovereign gateway)",
    baseUrl: "https://jarvis.mkulyma.com",
    envKey: "JARVIS_BASE_URL",
    apiKeyEnv: "JARVIS_API_KEY",
    defaultModel: "qwen2.5-coder:14b",
    tier: "local",
    probePath: "/api/models",
    openAiCompatible: true,
    keyRequired: true,
  },
];

export function getProvider(id) {
  return PROVIDER_PRESETS.find((p) => p.id === id) || null;
}

export function listProviders() {
  return PROVIDER_PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    tier: p.tier,
    baseUrl: p.baseUrl,
    defaultModel: p.defaultModel,
    stub: !!p.stub,
  }));
}

export function resolveBaseUrl(preset, env = process.env) {
  if (!preset) return null;
  if (preset.envKey && env[preset.envKey]) {
    return String(env[preset.envKey]).replace(/\/+$/, "");
  }
  return preset.baseUrl;
}

/**
 * Resolve the env var name that holds the API key for a preset. Most presets
 * carry the key in `envKey`; presets whose `envKey` is a base-URL override
 * (e.g. jarvis: envKey=JARVIS_BASE_URL) declare the key in `apiKeyEnv`.
 */
export function apiKeyEnvName(preset) {
  if (!preset) return null;
  return preset.apiKeyEnv || preset.envKey || null;
}

/** True when the API key env (or any alt) is set in env. */
export function hasApiKey(preset, env = process.env) {
  if (!preset) return false;
  const keyEnv = apiKeyEnvName(preset);
  if (keyEnv && env[keyEnv]) return true;
  for (const k of preset.altEnvKeys || []) {
    if (env[k]) return true;
  }
  return false;
}

export function hasCloudCredential(preset, env = process.env) {
  if (!preset || preset.stub) return false;
  if (preset.keyRequired) {
    return hasApiKey(preset, env);
  }
  return preset.tier === "cloud";
}
