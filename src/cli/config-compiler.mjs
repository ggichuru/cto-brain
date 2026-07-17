// Pure OpenCode config-OVERLAY compiler (ADR-0005).
//
// `cto-code` must stop destructively rewriting the user's global
// ~/.config/opencode/opencode.jsonc. Instead it compiles a runtime config
// OVERLAY and injects it via the `OPENCODE_CONFIG_CONTENT` env var — OpenCode
// merges that content LAST (`local` scope), leaving the user's own config
// untouched.
//
// This module is that PURE compiler: it builds the config OBJECT and its JSON
// string. It writes NO files and reads NO files. The model-map filtering mirrors
// buildOpencodeConfig (opencode-setup.mjs) + capabilities.mjs EXACTLY, so the
// overlay lists the same GPU-safe roster and defaults to the same tool-capable
// model.

import { tagModel, pickByTask, pickToolModel, fitsLocalGpu } from "../router/capabilities.mjs";

/**
 * Compile the OpenCode config-overlay OBJECT from the live local-model roster.
 *
 * @param {string[]} models  model ids from discovery
 * @param {object} [opts]
 * @param {string} [opts.baseUrl]      ollama OpenAI-compatible base URL
 * @param {string} [opts.mcpBin]       absolute cto-brain binary path (mcp block omitted if falsy)
 * @param {string} [opts.model]        explicit default model (a leading `ollama/` is stripped)
 * @param {string} [opts.ensureModel]  force-list this model even if it fails the GPU filter
 * @param {object} [opts.agent]        top-level `agent` map (omitted when not provided)
 * @param {string[]} [opts.instructions]  instruction file paths
 * @param {object} [opts.permission]   top-level `permission` map (omitted when not provided)
 * @returns {object} config object shaped like buildOpencodeConfig's output
 */
export function compileOpencodeConfig(models, opts = {}) {
  const {
    baseUrl = "http://127.0.0.1:11434/v1",
    mcpBin,
    model,
    ensureModel,
    agent,
    instructions,
    permission,
  } = opts;

  // Only list GPU-safe chat models — exclude box-tanking giants (>~20b on GB10
  // spill to CPU) so opencode's own picker can't load one and tank the machine.
  const chat = (models || []).filter((id) => tagModel(id).chat && fitsLocalGpu(id));
  const modelsMap = {};
  for (const id of chat) {
    const t = tagModel(id);
    const suffix = t.capability === "vision" ? ", vision" : "";
    modelsMap[id] = { name: `${id} (local${suffix})` };
  }
  // An explicit opt-in must be listed even if it fails fitsLocalGpu — the user
  // asked for it by name, so honor it (but never double-add).
  if (ensureModel && !(ensureModel in modelsMap)) {
    const t = tagModel(ensureModel);
    const suffix = t.capability === "vision" ? ", vision" : "";
    modelsMap[ensureModel] = { name: `${ensureModel} (local${suffix})` };
  }

  // Default to a TOOL-CAPABLE model — opencode is agentic (every action is a
  // tool call), so a coder that prints tool calls as text can't drive it.
  let chosen;
  if (model) {
    chosen = model.replace(/^ollama\//, "");
  } else {
    chosen = pickToolModel(chat, "dispatch-builder") || pickByTask(chat, "dispatch-builder") || chat[0];
  }

  const config = {
    $schema: "https://opencode.ai/config.json",
    instructions: instructions ?? ["~/.config/opencode/cto-brain.md"],
    model: chosen ? `ollama/${chosen}` : undefined,
    provider: {
      ollama: {
        npm: "@ai-sdk/openai-compatible",
        name: "Ollama (local)",
        options: { baseURL: baseUrl },
        models: modelsMap,
      },
    },
  };

  // Only emit the mcp block when we have a binary for opencode to spawn.
  if (mcpBin) {
    config.mcp = { "cto-brain": { type: "local", command: [mcpBin, "mcp"], enabled: true } };
  }

  // Include agent / permission only when provided — never emit `undefined` keys.
  if (agent !== undefined) config.agent = agent;
  if (permission !== undefined) config.permission = permission;

  // Drop `model` entirely when nothing was chosen (empty roster) rather than
  // carrying an `undefined` value the JSON string would silently drop anyway.
  if (config.model === undefined) delete config.model;

  return config;
}

/**
 * Compile the overlay to the JSON string assigned to `OPENCODE_CONFIG_CONTENT`.
 * JSON.stringify already drops any `undefined`, so the string round-trips to a
 * deep-equal object.
 *
 * @param {string[]} models
 * @param {object} [opts] — see compileOpencodeConfig
 * @returns {string}
 */
export function compileConfigContent(models, opts = {}) {
  return JSON.stringify(compileOpencodeConfig(models, opts));
}
