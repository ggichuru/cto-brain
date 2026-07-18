import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureDir, exists, packageRoot, systemBrainHome } from "../paths.mjs";
import { scanForCredentials } from "../sync/non-destructive.mjs";
import { systemLayout } from "../sync/brain-sync.mjs";
import { adapterHasCoreSkills, detectInstalledAdapters } from "../adapters/index.mjs";
import { adapterStatus, wireSkills } from "./adapters.mjs";
import { loadAdapterSettings } from "../adapters/settings.mjs";
import { bundledSkillsDir, listSkillNames } from "../paths.mjs";
import { PROVIDER_PRESETS, getProvider, hasCloudCredential, resolveBaseUrl } from "../router/providers.mjs";

export function runDoctor(opts = {}) {
  const strict = opts.strict === true;
  const issues = [];
  const ok = [];

  const home = opts.systemHome || systemBrainHome();
  const layout = systemLayout(home);
  const bundled = listSkillNames(bundledSkillsDir());
  const installed = exists(layout.skills) ? listSkillNames(layout.skills) : [];

  for (const name of bundled) {
    if (installed.includes(name)) ok.push(`skill present: ${name}`);
    else issues.push({ level: strict ? "error" : "warn", msg: `missing system skill: ${name}` });
  }

  const credHits = scanForCredentials(home);
  if (credHits.length) {
    issues.push({ level: "error", msg: `credential paths in brain home: ${credHits.join(", ")}` });
  } else {
    ok.push("no credential-like files in system brain");
  }

  const rsync = spawnSync("rsync", ["--version"], { encoding: "utf8" });
  if (rsync.status === 0) ok.push("rsync available (non-destructive sync)");
  else issues.push({ level: "warn", msg: "rsync not found — using mtime-wins copy fallback" });

  const adapterPrefs = loadAdapterSettings(home);
  ok.push(`enabled adapters: ${adapterPrefs.enabled.join(", ")} (scope=${adapterPrefs.scope})`);

  const status = adapterStatus({ home, cwd: opts.cwd || process.cwd() });
  let anyCoreWired = false;
  for (const a of status.adapters) {
    for (const p of a.paths) {
      if (!p.exists) {
        if (strict) {
          issues.push({ level: "warn", msg: `adapter ${a.id}: missing dir ${p.path}` });
        }
        continue;
      }
      if (adapterHasCoreSkills(p.path)) {
        ok.push(`adapter ${a.id}: core skills wired at ${p.path} (${p.skillCount} skills)`);
        anyCoreWired = true;
      } else if (strict) {
        issues.push({
          level: "error",
          msg: `adapter ${a.id}: ${p.path} missing cto-orchestration or meta-brain — run: cto-brain adapter wire`,
        });
      }
    }
  }

  const adapters = detectInstalledAdapters(opts.cwd, adapterPrefs.scope);
  const wired = adapters.filter((a) => a.dirs.length);
  if (wired.length) ok.push(`adapters with skill dirs: ${wired.map((a) => a.id).join(", ")}`);
  else if (!anyCoreWired) {
    issues.push({ level: strict ? "error" : "warn", msg: "no adapter skill dirs found — run: cto-brain adapter wire" });
  }

  if (!exists(layout.growthLedger)) {
    issues.push({ level: "warn", msg: "growth_ledger.md missing — run: cto-brain init" });
  }

  const errors = issues.filter((i) => i.level === "error");
  const healthy = strict ? errors.length === 0 : errors.length === 0;

  return { healthy, ok, issues, home, bundled, installed, adapters: wired, adapterStatus: status };
}

// --- Kernel / platform health probe for `cto-code doctor` (charter) ---
//
// Every side-effecting dependency is injected so tests are hermetic (no real
// network, subprocess, or home). kernelHealth NEVER throws: each probe is
// wrapped so a failure becomes a section with ok:false + a reason, never an
// exception. It NEVER records secret VALUES — only booleans for presence.

// Default opencode config path, respecting XDG_CONFIG_HOME like opencode-setup.
function defaultOpencodeConfigPath(env = process.env) {
  const base = env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "opencode", "opencode.jsonc");
}

function isExecutable(file) {
  try {
    const st = fs.statSync(file);
    return st.isFile() && (st.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

function resolveCommand(cmd, env = process.env) {
  if (cmd.includes(path.sep)) return isExecutable(cmd) ? cmd : cmd;

  const dirs = [
    ...(env.PATH || "").split(path.delimiter).filter(Boolean),
    process.execPath ? path.dirname(process.execPath) : null,
    path.join(os.homedir(), ".local", "bin"),
    path.join(os.homedir(), ".npm-global", "bin"),
    path.join(os.homedir(), "bin"),
  ].filter(Boolean);

  for (const dir of dirs) {
    const p = path.join(dir, cmd);
    if (isExecutable(p)) return p;
  }
  return cmd;
}

export async function kernelHealth(opts = {}) {
  const env = opts.env || process.env;
  const cwd = opts.cwd || process.cwd();
  const exec = opts.exec || ((cmd, args) => spawnSync(resolveCommand(cmd, env), args, { encoding: "utf8", cwd, env }));
  const fetchFn = opts.fetchFn || ((...a) => fetch(...a));
  const readFileFn = opts.readFileFn || ((p) => fs.readFileSync(p, "utf8"));
  const existsFn = opts.existsFn || exists;
  const listSkillDirs = opts.listSkillDirs || ((dir) => listSkillNames(dir));
  const listAgents =
    opts.listAgents ||
    ((dir) => {
      try {
        return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
      } catch {
        return [];
      }
    });
  const opencodeConfigPath = opts.opencodeConfigPath || defaultOpencodeConfigPath(env);
  const homeSkillsDir = opts.homeSkillsDir || path.join(os.homedir(), ".claude", "skills");
  const configBase = env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  const opencodeSkillsDir = opts.opencodeSkillsDir || path.join(configBase, "opencode", "skills");
  const opencodeAgentDir = opts.opencodeAgentDir || path.join(configBase, "opencode", "agent");

  const ok = [];
  const warn = [];

  // --- opencode CLI ---
  const opencode = { installed: false, version: null };
  try {
    const res = exec("opencode", ["--version"]) || {};
    if (res.status === 0) {
      const out = String(res.stdout || "");
      const m = out.match(/(\d+\.\d+\.\d+[\w.-]*)/);
      opencode.version = m ? m[1] : out.trim() || null;
      opencode.installed = true;
      ok.push(`opencode installed${opencode.version ? ` (v${opencode.version})` : ""}`);
    } else {
      warn.push("opencode CLI not found — install it to use the sovereign coding terminal");
    }
  } catch {
    warn.push("opencode CLI not found — install it to use the sovereign coding terminal");
  }

  // --- ollama reachability ---
  const ollamaPreset = getProvider("ollama");
  const host = resolveBaseUrl(ollamaPreset, env) || "http://127.0.0.1:11434";
  const ollama = { reachable: false, host, models: 0 };
  try {
    const res = await fetchFn(`${host}/api/tags`);
    if (res && res.ok) {
      const body = await res.json();
      ollama.models = Array.isArray(body?.models) ? body.models.length : 0;
      ollama.reachable = true;
      ok.push(`ollama reachable at ${host} (${ollama.models} model${ollama.models === 1 ? "" : "s"})`);
    } else {
      warn.push(`ollama not reachable at ${host} — local sovereign lane is down`);
    }
  } catch {
    warn.push(`ollama not reachable at ${host} — local sovereign lane is down`);
  }

  // --- providers (credential PRESENCE only, never values) ---
  const providers = [];
  let anyCred = false;
  for (const p of PROVIDER_PRESETS) {
    let credentialPresent = false;
    try {
      credentialPresent = hasCloudCredential(p, env) === true;
    } catch {
      credentialPresent = false;
    }
    if (credentialPresent) anyCred = true;
    providers.push({ id: p.id, tier: p.tier, credentialPresent, keyRequired: !!p.keyRequired });
  }
  if (anyCred) ok.push("provider credentials configured");
  else warn.push("no provider credentials found — cloud lanes unavailable (local-only)");

  // --- mcp: opencode config exists + wires cto-brain ---
  const mcp = { opencodeConfig: false, ctoBrainWired: false };
  try {
    mcp.opencodeConfig = existsFn(opencodeConfigPath) === true;
  } catch {
    mcp.opencodeConfig = false;
  }
  if (mcp.opencodeConfig) {
    try {
      const raw = String(readFileFn(opencodeConfigPath) || "");
      mcp.ctoBrainWired = raw.includes("cto-brain");
    } catch {
      mcp.ctoBrainWired = false;
    }
    if (mcp.ctoBrainWired) ok.push("cto-brain MCP wired into opencode");
    else warn.push("opencode config present but cto-brain MCP not wired — run: cto-brain opencode setup");
  } else {
    warn.push("no opencode config found — run: cto-brain opencode setup");
  }

  // --- skills counts ---
  const skills = { claude: 0, opencode: 0 };
  try {
    skills.claude = (listSkillDirs(homeSkillsDir) || []).length;
  } catch {
    skills.claude = 0;
  }
  try {
    skills.opencode = (listSkillDirs(opencodeSkillsDir) || []).length;
  } catch {
    skills.opencode = 0;
  }

  // --- agents count ---
  const agents = { opencode: 0 };
  try {
    agents.opencode = (listAgents(opencodeAgentDir) || []).length;
  } catch {
    agents.opencode = 0;
  }

  // --- gateway: jarvis key presence only ---
  const gateway = { jarvisKeyPresent: !!env.JARVIS_API_KEY };
  if (gateway.jarvisKeyPresent) ok.push("jarvis gateway key present");

  // --- git status ---
  const git = { repo: false, clean: null, dirtyCount: null };
  try {
    const res = exec("git", ["status", "--porcelain"]) || {};
    if (res.status === 0) {
      git.repo = true;
      const lines = String(res.stdout || "")
        .split("\n")
        .filter((l) => l.trim().length > 0);
      git.dirtyCount = lines.length;
      git.clean = lines.length === 0;
      if (git.clean) ok.push("git working tree clean");
      else warn.push(`git working tree dirty (${git.dirtyCount} uncommitted change${git.dirtyCount === 1 ? "" : "s"})`);
    }
  } catch {
    // not a repo / git missing → leave repo:false, clean:null, dirtyCount:null
  }

  return { opencode, ollama, providers, mcp, skills, agents, gateway, git, ok, warn };
}

export function installToAgents(opts = {}) {
  return wireSkills({
    brainHome: opts.systemHome || systemBrainHome(),
    adapters: opts.adapters,
    cwd: opts.cwd,
    scope: opts.scope,
    project: opts.project,
    global: opts.global,
    syncMemory: opts.syncMemory !== false,
    withRules: opts.withRules !== false,
  });
}

export function hookInstallScript() {
  const root = packageRoot();
  return `#!/usr/bin/env bash
# cto-brain Stop hook — sync project brain after each agent turn
set -euo pipefail
cto-brain sync --project-only 2>/dev/null || node "${path.join(root, "bin", "cto-brain.mjs")}" sync --project-only
`;
}

export function writeHookInstall(opts = {}) {
  const claudeSettings = path.join(process.env.CLAUDE_HOME || path.join(process.env.HOME || "", ".claude"), "settings.json");
  const scriptPath = path.join(systemBrainHome(), "hooks", "cto-brain-stop.sh");
  ensureDir(path.dirname(scriptPath));
  fs.writeFileSync(scriptPath, hookInstallScript(), { mode: 0o755 });
  return { scriptPath, claudeSettings, note: "Add Stop hook manually to Claude settings if desired", script: scriptPath };
}
