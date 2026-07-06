import fs from "node:fs";
import path from "node:path";
import { ensureDir, exists, projectBrainDir, readText, systemBrainHome } from "../paths.mjs";

/** Core defaults — all providers enabled; project + system layers override. */
export const DEFAULT_ROUTER_CONFIG = {
  version: 1,
  stacks: [
    { id: "desk-engine", url: "http://127.0.0.1:8787", type: "desk" },
    { id: "ollama", url: "http://127.0.0.1:11434", type: "ollama" },
    { id: "vllm", url: "http://127.0.0.1:8000", type: "vllm" },
    { id: "llamacpp", url: "http://127.0.0.1:8080", type: "llamacpp" },
  ],
  enabledProviders: [
    "ollama",
    "jarvis",
    "vllm",
    "llamacpp",
    "openai-compatible",
    "desk-engine",
    "anthropic",
    "openai",
    "fugu",
    "cursor",
    "codex",
  ],
  routing: {
    defaultPrefer: "auto",
    builder: { tier: "local", provider: "ollama", model: "qwen2.5-coder:14b" },
    explore: { tier: "local", provider: "ollama", model: "llama3.1" },
    "inline-edit": { tier: "local", provider: "ollama", model: "qwen2.5-coder:7b" },
    reviewer: { tier: "cloud", provider: "anthropic", model: "claude-sonnet-4-20250514" },
    research: { tier: "auto", provider: "openai", model: "gpt-4o-mini" },
    "autonomous-build": { tier: "local", provider: "ollama", model: "qwen2.5-coder:14b" },
    integrate: { tier: "cloud", provider: "anthropic", model: "claude-sonnet-4-20250514" },
  },
  agentic: {
    maxConcurrentBuilders: 4,
    autoProbeBeforeDispatch: true,
    recordStubProviders: true,
    roundCloseAfterIntegrate: true,
  },
};

export function routerConfigPath(cwd = process.cwd()) {
  return path.join(projectBrainDir(cwd), "router.json");
}

export function systemRouterConfigPath(home = systemBrainHome()) {
  return path.join(home, "router.json");
}

export function mergeRouterConfig(base, override) {
  if (!override) return structuredClone(base);
  return {
    version: override.version ?? base.version ?? 1,
    stacks: override.stacks || base.stacks,
    enabledProviders: override.enabledProviders || base.enabledProviders,
    routing: { ...base.routing, ...(override.routing || {}) },
    agentic: { ...(base.agentic || {}), ...(override.agentic || {}) },
  };
}

/** Merge order: package defaults → ~/.cto-brain/router.json → .cto-brain/router.json */
export function loadMergedRouterConfig(cwd = process.cwd(), systemHome = systemBrainHome()) {
  let config = structuredClone(DEFAULT_ROUTER_CONFIG);
  const systemPath = systemRouterConfigPath(systemHome);
  const projectPath = routerConfigPath(cwd);
  let systemExists = false;
  let projectExists = false;

  if (exists(systemPath)) {
    config = mergeRouterConfig(config, JSON.parse(readText(systemPath)));
    systemExists = true;
  }
  if (exists(projectPath)) {
    config = mergeRouterConfig(config, JSON.parse(readText(projectPath)));
    projectExists = true;
  }

  return { config, systemPath, projectPath, systemExists, projectExists };
}

export function loadRouterConfig(cwd = process.cwd()) {
  const merged = loadMergedRouterConfig(cwd);
  return {
    path: merged.projectPath,
    systemPath: merged.systemPath,
    config: merged.config,
    exists: merged.projectExists || merged.systemExists,
    layers: {
      project: merged.projectExists,
      system: merged.systemExists,
    },
  };
}

export function initRouterConfig(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const p = routerConfigPath(cwd);
  ensureDir(path.dirname(p));
  if (exists(p) && !opts.force) {
    return { path: p, created: false, scope: "project" };
  }
  const seed = opts.seedFromSystem !== false ? loadMergedRouterConfig(cwd).config : structuredClone(DEFAULT_ROUTER_CONFIG);
  fs.writeFileSync(p, JSON.stringify(seed, null, 2) + "\n", "utf8");
  return { path: p, created: true, scope: "project" };
}

export function initSystemRouterConfig(opts = {}) {
  const home = opts.home || systemBrainHome();
  const p = systemRouterConfigPath(home);
  ensureDir(home);
  if (exists(p) && !opts.force) {
    return { path: p, created: false, scope: "system" };
  }
  fs.writeFileSync(p, JSON.stringify(DEFAULT_ROUTER_CONFIG, null, 2) + "\n", "utf8");
  return { path: p, created: true, scope: "system" };
}
