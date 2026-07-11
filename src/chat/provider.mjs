// cto-brain chat — the model-agnostic provider layer. Resolves a chat provider
// THROUGH src/router/providers.mjs so local (ollama, vLLM, LM Studio, llama.cpp,
// llama-swap), any OpenAI-compatible base-URL+key, anthropic, and the sovereign
// jarvis gateway all work with the same config. The API key is read from the env
// var the preset names — never written to disk, never sent to the browser.

import { getProvider, resolveBaseUrl } from "../router/providers.mjs";

// A preset's `envKey` is a base-URL override for local/gateway presets, but the
// API key itself for the cloud presets (openai/anthropic/fugu, keyRequired with
// no separate apiKeyEnv). Only honor an env base-URL override in the first case.
function envKeyIsBaseUrl(preset) {
  return !!preset.apiKeyEnv || !preset.keyRequired;
}

// The env var that holds the API key: config override, the preset's dedicated
// apiKeyEnv, or (only when the preset's envKey IS the key) the envKey itself.
function apiKeyEnvFor(preset, override) {
  return override || preset.apiKeyEnv || (preset.keyRequired ? preset.envKey : null);
}

// Which upstream wire a preset speaks. Anthropic has its own messages API;
// ollama's native /api/chat is ND-JSON; everything else is OpenAI-compatible.
export function wireFor(preset) {
  if (!preset) return "openai";
  if (preset.id === "anthropic") return "anthropic";
  if (preset.openAiCompatible === false) return "ollama";
  return "openai";
}

// Build the upstream chat endpoint for a resolved base URL + wire.
export function chatUrlFor(baseUrl, wire) {
  const b = String(baseUrl || "").replace(/\/+$/, "");
  if (wire === "ollama") return `${b}/api/chat`;
  if (wire === "anthropic") return `${b}/v1/messages`;
  // OpenAI-compatible: don't double the /v1 when the base already carries it.
  return /\/v1$/.test(b) ? `${b}/chat/completions` : `${b}/v1/chat/completions`;
}

// Read the API key for a resolved provider from env (preset key, config
// override, or any documented alt env). Returns undefined if unset.
function readApiKey(preset, apiKeyEnv, env) {
  if (apiKeyEnv && env[apiKeyEnv]) return env[apiKeyEnv];
  for (const k of (preset && preset.altEnvKeys) || []) {
    if (env[k]) return env[k];
  }
  return undefined;
}

/**
 * Resolve a chat provider from config through the provider registry.
 * @param {object} providerConfig - { id, baseUrl?, model?, apiKeyEnv?, models? }
 * @param {object} [env]
 * @returns resolved descriptor (no secrets leave this object except `apiKey`,
 *          which callers forward upstream only and never serialize to a client).
 */
export function resolveChatProvider(providerConfig = {}, env = process.env) {
  const id = providerConfig.id || "ollama";
  const preset = getProvider(id);
  if (!preset) throw new Error(`unknown provider: ${id} (see \`cto-brain router list\`)`);
  if (preset.stub) throw new Error(`provider ${id} is a stub (${preset.stubReason || "not dispatchable"})`);

  const resolvedBase = envKeyIsBaseUrl(preset) ? resolveBaseUrl(preset, env) : preset.baseUrl;
  const baseUrl = (providerConfig.baseUrl || resolvedBase || "").replace(/\/+$/, "");
  const model = providerConfig.model || preset.defaultModel || "";
  const apiKeyEnv = apiKeyEnvFor(preset, providerConfig.apiKeyEnv);
  const apiKey = readApiKey(preset, apiKeyEnv, env);
  const wire = wireFor(preset);

  // Selectable models: config list wins; else the single resolved default.
  let models = Array.isArray(providerConfig.models) && providerConfig.models.length
    ? providerConfig.models.map((m) => (typeof m === "string" ? { id: m, label: m } : { id: m.id, label: m.label || m.id }))
    : [];
  if (!models.length && model) models = [{ id: model, label: model }];

  return {
    id,
    label: preset.label,
    tier: preset.tier,
    baseUrl,
    model,
    models,
    wire,
    chatUrl: chatUrlFor(baseUrl, wire),
    apiKeyEnv,
    keyRequired: !!preset.keyRequired,
    hasKey: !!apiKey,
    apiKey, // forward upstream only; never send to the browser
  };
}

// Build the upstream request (url, headers, body) for a resolved provider and a
// prepared message list. `stream` toggles server-sent streaming upstream.
export function buildUpstreamRequest(resolved, { model, messages, stream = true, temperature = 0.4 } = {}) {
  const m = model || resolved.model;
  const headers = { "content-type": "application/json" };
  let url = resolved.chatUrl;
  let body;

  if (resolved.wire === "anthropic") {
    headers["anthropic-version"] = "2023-06-01";
    if (resolved.apiKey) headers["x-api-key"] = resolved.apiKey;
    const system = messages.find((x) => x.role === "system");
    const turns = messages.filter((x) => x.role === "user" || x.role === "assistant");
    body = {
      model: m,
      max_tokens: 2048,
      stream,
      temperature,
      ...(system ? { system: system.content } : {}),
      messages: turns.map((x) => ({ role: x.role, content: x.content })),
    };
  } else {
    // openai + ollama both accept {model, messages, stream}. Ollama ignores the
    // Bearer header; OpenAI-compatible hosts require it when a key is set.
    if (resolved.apiKey) headers.authorization = `Bearer ${resolved.apiKey}`;
    body = { model: m, messages, stream };
    if (resolved.wire === "openai") body.temperature = temperature;
    else body.options = { temperature }; // ollama-native
  }
  return { url, headers, body };
}
