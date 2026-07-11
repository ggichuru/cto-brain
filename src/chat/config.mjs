// cto-brain chat — config loading. Reads cto-brain.config.json / .mjs from the
// user's cwd, merges a safe DEFAULT (README + docs/, docs-only, local ollama),
// then applies flags and env. No secrets live in this config: the provider names
// an ENV VAR that holds its key; the key itself is never stored here.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

// Default scope: ground on the cwd's own README + docs/, docs-only, bounded.
export function defaultConfig(cwd = process.cwd()) {
  return {
    scopes: [
      {
        id: "project",
        label: path.basename(path.resolve(cwd)) || "project",
        root: ".",
        include: ["README.md", "readme.md", "AGENTS.md", "CLAUDE.md", "docs"],
        maxBytes: 80_000,
      },
    ],
    provider: { id: "ollama", model: "llama3.1" },
    auth: { host: "127.0.0.1", port: 8790 },
  };
}

const CONFIG_NAMES = ["cto-brain.config.json", "cto-brain.config.mjs"];

// Locate a config file: explicit path wins, else the first known name in cwd.
export function findConfigPath({ cwd = process.cwd(), configPath } = {}) {
  if (configPath) {
    const abs = path.resolve(cwd, configPath);
    if (!fs.existsSync(abs)) throw new Error(`config not found: ${abs}`);
    return abs;
  }
  for (const name of CONFIG_NAMES) {
    const abs = path.resolve(cwd, name);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

async function readConfigFile(abs) {
  if (abs.endsWith(".mjs")) {
    const mod = await import(pathToFileURL(abs).href);
    return mod.default || mod.config || {};
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function normalizeScopes(scopes, cwd) {
  const arr = Array.isArray(scopes) ? scopes : [];
  return arr
    .filter((s) => s && s.id)
    .map((s) => ({
      id: String(s.id),
      label: s.label || s.id,
      // root:null (or absent) → inline-text scope; otherwise resolve against cwd.
      root: s.root == null ? null : path.resolve(cwd, s.root),
      include: Array.isArray(s.include) ? s.include : undefined,
      maxBytes: Number(s.maxBytes) > 0 ? Number(s.maxBytes) : 80_000,
      text: typeof s.text === "string" ? s.text : undefined,
    }));
}

/**
 * Load + resolve the effective chat config.
 * @param {object} opts { cwd, configPath, flags, env }
 * flags: { provider, model, port, host }
 */
export async function loadChatConfig(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const env = opts.env || process.env;
  const flags = opts.flags || {};

  const abs = findConfigPath({ cwd, configPath: opts.configPath });
  const fileCfg = abs ? await readConfigFile(abs) : {};
  const base = defaultConfig(cwd);

  const provider = { ...base.provider, ...(fileCfg.provider || {}) };
  if (flags.provider) provider.id = flags.provider;
  if (flags.model) provider.model = flags.model;

  const scopesRaw = fileCfg.scopes && fileCfg.scopes.length ? fileCfg.scopes : base.scopes;
  const scopes = normalizeScopes(scopesRaw, cwd);
  if (!scopes.length) throw new Error("config has no usable scopes");

  const authCfg = { ...base.auth, ...(fileCfg.auth || {}) };
  const host = flags.host || env.CTO_CHAT_HOST || authCfg.host || "127.0.0.1";
  const port = Number(flags.port || env.CTO_CHAT_PORT || authCfg.port || 8790);

  // Gate 2 token: env/flag/config, or minted per-boot so the API is NEVER ungated.
  const token = flags.token || env.CTO_CHAT_TOKEN || authCfg.token || randomBytes(9).toString("hex");
  const tokenMinted = !(flags.token || env.CTO_CHAT_TOKEN || authCfg.token);

  return {
    configPath: abs,
    scopes,
    provider,
    auth: { host, port, token, tokenMinted },
  };
}
