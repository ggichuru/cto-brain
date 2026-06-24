import fs from "node:fs";
import path from "node:path";
import { ensureDir, exists, projectBrainDir } from "../paths.mjs";

export const DEFAULT_ROUTER_CONFIG = {
  stacks: [
    { id: "desk-engine", url: "http://127.0.0.1:8787", type: "desk" },
    { id: "ollama", url: "http://127.0.0.1:11434", type: "ollama" },
  ],
  routing: {
    defaultPrefer: "local",
    builder: { tier: "local", model: "qwen2.5-coder:14b", provider: "ollama" },
    reviewer: { tier: "cloud", model: "sonnet", provider: "anthropic" },
    explore: { tier: "local", provider: "ollama" },
    research: { tier: "cloud", provider: "openai" },
  },
};

export function routerConfigPath(cwd = process.cwd()) {
  return path.join(projectBrainDir(cwd), "router.json");
}

export function loadRouterConfig(cwd = process.cwd()) {
  const p = routerConfigPath(cwd);
  if (!exists(p)) {
    return { path: p, config: structuredClone(DEFAULT_ROUTER_CONFIG), exists: false };
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const config = mergeRouterConfig(DEFAULT_ROUTER_CONFIG, raw);
  return { path: p, config, exists: true };
}

export function mergeRouterConfig(base, override) {
  return {
    stacks: override.stacks || base.stacks,
    routing: { ...base.routing, ...(override.routing || {}) },
  };
}

export function initRouterConfig(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const p = routerConfigPath(cwd);
  ensureDir(path.dirname(p));
  if (exists(p) && !opts.force) {
    return { path: p, created: false };
  }
  fs.writeFileSync(p, JSON.stringify(DEFAULT_ROUTER_CONFIG, null, 2) + "\n", "utf8");
  return { path: p, created: true };
}
