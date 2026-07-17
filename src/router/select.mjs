/**
 * Policy-first model routing — auditable rules, not learned black-box routing.
 */

import { getProvider, hasCloudCredential, resolveBaseUrl } from "./providers.mjs";

export const TASK_KINDS = [
  "dispatch-builder",
  "autonomous-build",
  "explore",
  "reviewer-security",
  "reviewer-tech",
  "inline-edit",
  "integrate",
  "research",
];

/** task kind → { preferTier, fallbackChain, defaultModel hints } */
export const ROUTING_RULES = {
  "dispatch-builder": {
    preferTier: "local",
    fallbackChain: ["ollama", "jarvis", "vllm", "llamacpp", "llama-swap", "lmstudio", "openai-compatible", "anthropic", "openai", "openrouter", "moonshot", "together", "fugu", "cursor", "codex"],
    defaultModels: { ollama: "qwen2.5-coder:14b", jarvis: "qwen2.5-coder:14b", vllm: "", anthropic: "claude-sonnet-4-20250514" },
    rationale: "Builders run token-heavy; local coders OK when probe succeeds.",
  },
  "autonomous-build": {
    preferTier: "local",
    fallbackChain: ["ollama", "jarvis", "vllm", "llamacpp", "llama-swap", "lmstudio", "openai-compatible", "anthropic", "openai", "openrouter", "moonshot", "together", "fugu", "cursor", "codex"],
    defaultModels: { ollama: "qwen2.5-coder:14b", jarvis: "qwen2.5-coder:14b", anthropic: "claude-sonnet-4-20250514", openai: "gpt-4o" },
    rationale: "Sustained agentic coding loops; local first, cloud when keys or IDE session available.",
  },
  explore: {
    preferTier: "local",
    fallbackChain: ["ollama", "jarvis", "vllm", "llama-swap", "lmstudio", "anthropic", "openai", "openrouter"],
    defaultModels: { ollama: "llama3.1" },
    rationale: "Read-only exploration; local sufficient for map-the-territory work.",
  },
  "reviewer-security": {
    preferTier: "cloud",
    fallbackChain: ["anthropic", "openai", "openrouter", "moonshot", "fugu", "jarvis", "ollama"],
    defaultModels: { anthropic: "claude-sonnet-4-20250514", jarvis: "llama3.1:70b-instruct-q4_K_M" },
    rationale: "Security review benefits from stronger cloud models when available; jarvis (sovereign) for offline/local-prefer.",
  },
  "reviewer-tech": {
    preferTier: "cloud",
    fallbackChain: ["anthropic", "openai", "openrouter", "moonshot", "fugu", "jarvis", "ollama"],
    defaultModels: { anthropic: "claude-sonnet-4-20250514", jarvis: "llama3.1:70b-instruct-q4_K_M" },
    rationale: "Tech-lead review: contract drift + API consistency need strong reasoning; jarvis (sovereign) for offline/local-prefer.",
  },
  "inline-edit": {
    preferTier: "local",
    fallbackChain: ["ollama", "jarvis", "vllm", "llama-swap", "lmstudio", "anthropic"],
    defaultModels: { ollama: "qwen2.5-coder:7b", jarvis: "qwen2.5-coder:14b" },
    rationale: "Parent inline work under 5 minutes — local fast path.",
  },
  research: {
    preferTier: "auto",
    fallbackChain: ["openai", "openrouter", "together", "fugu", "anthropic", "jarvis", "ollama"],
    defaultModels: { openai: "gpt-4o-mini", openrouter: "moonshotai/kimi-k3", fugu: "fugu-ultra", jarvis: "llama3.1:70b-instruct-q4_K_M" },
    rationale: "External research: cloud preferred; local/sovereign if keys absent.",
  },
  integrate: {
    preferTier: "cloud",
    fallbackChain: ["anthropic", "openai", "openrouter", "moonshot", "fugu", "jarvis", "ollama", "vllm"],
    defaultModels: { anthropic: "claude-sonnet-4-20250514", jarvis: "llama3.1:70b-instruct-q4_K_M" },
    rationale: "Integration + merge decisions benefit from strong reasoning when cloud creds exist; jarvis (sovereign) as local fallback.",
  },
};

export function selectRoute(opts = {}) {
  const task = opts.task || "dispatch-builder";
  const prefer = opts.prefer || opts.config?.routing?.defaultPrefer || "auto";
  const rule = ROUTING_RULES[task];
  if (!rule) {
    return {
      provider: null,
      model: null,
      baseUrl: null,
      reason: `Unknown task kind: ${task}. Valid: ${TASK_KINDS.join(", ")}`,
      honest: true,
      task,
    };
  }

  const taskOverride = getTaskOverride(opts.config, task);

  const probes = opts.probes || [];
  const probeById = Object.fromEntries(probes.filter((p) => p.reachable).map((p) => [p.id, p]));
  const env = opts.env || process.env;

  const chain = buildChain(rule, prefer, taskOverride, opts.config);

  const recordStub = opts.config?.agentic?.recordStubProviders !== false;

  for (const providerId of chain) {
    const preset = getProvider(providerId);
    if (!preset) continue;

    if (preset.stub) {
      if (recordStub && (providerId === "cursor" || providerId === "codex") && prefer !== "local") {
        return {
          provider: providerId,
          model: preset.defaultModel,
          baseUrl: null,
          tier: preset.tier,
          task,
          prefer,
          mode: "ide-bound",
          reason: `${preset.stubReason} Enabled in router.json; embed intent in brief — dispatch via IDE/CLI.`,
          honest: true,
          fallbackUsed: true,
        };
      }
      continue;
    }

    const probed = probeById[providerId];
    const credOk = hasCloudCredential(preset, env);

    if (preset.tier === "cloud" && preset.keyRequired && !credOk) continue;
    if (preset.tier === "local" && !probed && !opts.allowUnprobedLocal) continue;

    const model = pickModel(preset, probed, rule, taskOverride);
    const baseUrl = probed?.baseUrl || resolveBaseUrl(preset, env);
    const modelAvailable = checkModelAvailable(model, probed);
    let reason = buildReason(preset, probed, rule, taskOverride, prefer);
    if (modelAvailable === false) {
      reason += `; WARNING: model '${model}' is not in the probed list [${(probed.models || []).join(", ")}] — pull it on ${providerId} or set router.json to an available tag`;
    }

    return {
      provider: providerId,
      model,
      baseUrl,
      tier: preset.tier,
      task,
      prefer,
      reason,
      honest: true,
      fallbackUsed: probed ? false : preset.tier === "cloud" && credOk,
      modelAvailable, // true = in probe list; false = NOT present (dispatch will fail); null = no list to check (cloud/unprobed)
    };
  }

  return {
    provider: null,
    model: null,
    baseUrl: null,
    task,
    prefer,
    reason: `No reachable provider for task '${task}' with prefer=${prefer}. Run: cto-brain router probe --all`,
    honest: true,
  };
}

function buildChain(rule, prefer, taskOverride, config) {
  let chain = [...rule.fallbackChain];
  const enabled = config?.enabledProviders;
  if (enabled?.length) {
    chain = chain.filter((id) => enabled.includes(id));
  }
  if (taskOverride?.provider) {
    chain = [taskOverride.provider, ...chain.filter((id) => id !== taskOverride.provider)];
  }
  let effectivePrefer = prefer;
  if (prefer === "auto") {
    effectivePrefer = taskOverride?.tier || rule.preferTier || "auto";
  }
  if (effectivePrefer === "local") {
    chain = [...chain.filter((id) => {
      const p = getProvider(id);
      return p && p.tier === "local";
    }), ...chain.filter((id) => {
      const p = getProvider(id);
      return p && p.tier === "cloud";
    })];
  } else if (effectivePrefer === "cloud") {
    chain = [...chain.filter((id) => {
      const p = getProvider(id);
      return p && p.tier === "cloud" && !p.stub;
    }), ...chain.filter((id) => {
      const p = getProvider(id);
      return p && p.tier === "local";
    })];
  }
  return chain;
}

function getTaskOverride(config, task) {
  if (!config?.routing) return null;
  const r = config.routing;
  if (task === "dispatch-builder" && r.builder) return r.builder;
  if (task === "autonomous-build" && (r["autonomous-build"] || r.autonomous)) {
    return r["autonomous-build"] || r.autonomous;
  }
  if (task.startsWith("reviewer-") && r.reviewer) return r.reviewer;
  if (task === "explore" && r.explore) return r.explore;
  if (task === "research" && r.research) return r.research;
  if (task === "integrate" && r.integrate) return r.integrate;
  if (task === "inline-edit" && r["inline-edit"]) return r["inline-edit"];
  if (r[task]) return r[task];
  return null;
}

// Honest model-availability check: only meaningful when a local provider was
// probed and returned a model list. true=present, false=missing (dispatch will
// fail), null=can't tell (cloud, or no model list).
function checkModelAvailable(model, probed) {
  if (!model) return null;
  if (probed && Array.isArray(probed.models) && probed.models.length) {
    return probed.models.includes(model);
  }
  return null;
}

function pickModel(preset, probed, rule, taskOverride) {
  if (taskOverride?.model && (!taskOverride.provider || taskOverride.provider === preset.id)) {
    return taskOverride.model;
  }
  if (probed?.models?.length) return probed.models[0];
  return rule.defaultModels?.[preset.id] || preset.defaultModel || "";
}

function buildReason(preset, probed, rule, taskOverride, prefer) {
  const parts = [rule.rationale];
  if (taskOverride?.model && (!taskOverride.provider || taskOverride.provider === preset.id)) {
    parts.push(`project override model=${taskOverride.model}`);
  }
  if (probed) parts.push(`probe OK (${probed.models?.length || 0} models)`);
  else if (preset.keyRequired) parts.push("cloud credential present");
  parts.push(`prefer=${prefer}`);
  return parts.join("; ");
}
