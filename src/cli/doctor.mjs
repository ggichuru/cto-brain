import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureDir, exists, packageRoot, systemBrainHome } from "../paths.mjs";
import { scanForCredentials } from "../sync/non-destructive.mjs";
import { systemLayout } from "../sync/brain-sync.mjs";
import { detectInstalledAdapters, wireSkills } from "../adapters/index.mjs";
import { bundledSkillsDir, listSkillNames } from "../paths.mjs";

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

  const adapters = detectInstalledAdapters();
  const wired = adapters.filter((a) => a.dirs.length);
  if (wired.length) ok.push(`adapters with skill dirs: ${wired.map((a) => a.id).join(", ")}`);
  else issues.push({ level: "warn", msg: "no adapter skill dirs found — run: cto-brain adapter wire" });

  if (!exists(layout.growthLedger)) {
    issues.push({ level: "warn", msg: "growth_ledger.md missing — run: cto-brain init" });
  }

  const errors = issues.filter((i) => i.level === "error");
  const healthy = strict ? errors.length === 0 : errors.length === 0;

  return { healthy, ok, issues, home, bundled, installed, adapters: wired };
}

export function installToAgents(opts = {}) {
  return wireSkills({
    brainHome: opts.systemHome || systemBrainHome(),
    adapters: opts.adapters || ["claude-code", "cursor", "codex"],
    cwd: opts.cwd,
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
