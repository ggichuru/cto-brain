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
