import fs from "node:fs";
import path from "node:path";
import { ensureDir, exists, readText, systemBrainHome } from "../paths.mjs";

export const DEFAULT_ADAPTERS = ["claude-code", "cursor"];
export const DEFAULT_SCOPE = "both";

export function adaptersSettingsPath(home = systemBrainHome()) {
  return path.join(home, "settings", "adapters.json");
}

export function loadAdapterSettings(home = systemBrainHome()) {
  const p = adaptersSettingsPath(home);
  if (!exists(p)) {
    return { enabled: [...DEFAULT_ADAPTERS], scope: DEFAULT_SCOPE, lastWired: null };
  }
  try {
    const data = JSON.parse(readText(p));
    return {
      enabled: Array.isArray(data.enabled) && data.enabled.length ? data.enabled : [...DEFAULT_ADAPTERS],
      scope: data.scope || DEFAULT_SCOPE,
      lastWired: data.lastWired || null,
    };
  } catch {
    return { enabled: [...DEFAULT_ADAPTERS], scope: DEFAULT_SCOPE, lastWired: null };
  }
}

export function saveAdapterSettings(settings, home = systemBrainHome()) {
  const p = adaptersSettingsPath(home);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  return p;
}

/** Env CTO_BRAIN_ADAPTERS → explicit list → saved settings → defaults. */
export function resolveEnabledAdapters(opts = {}) {
  const envList = process.env.CTO_BRAIN_ADAPTERS;
  if (envList) {
    return envList.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (opts.adapters) {
    const raw = Array.isArray(opts.adapters) ? opts.adapters : String(opts.adapters).split(",");
    return raw.map((s) => s.trim()).filter(Boolean);
  }
  const settings = loadAdapterSettings(opts.home || opts.brainHome);
  return settings.enabled?.length ? settings.enabled : [...DEFAULT_ADAPTERS];
}

export function resolveScope(opts = {}) {
  if (opts.project && !opts.global) return "project";
  if (opts.global && !opts.project) return "global";
  if (opts.scope) return opts.scope;
  return loadAdapterSettings(opts.home || opts.brainHome).scope || DEFAULT_SCOPE;
}
