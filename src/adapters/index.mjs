import fs from "node:fs";
import path from "node:path";
import { ensureDir, exists, listSkillNames, systemBrainHome, claudeMemoryTarget } from "../paths.mjs";
import { syncDir } from "../sync/non-destructive.mjs";

/** @typedef {'claude-code'|'cursor'|'codex'|'opencode'|'generic'} AdapterId */

/**
 * @typedef {Object} BrainAdapter
 * @property {AdapterId} id
 * @property {string} label
 * @property {(cwd?: string) => string[]} skillDirs
 * @property {(cwd?: string) => string | null} [rulesFile]
 */

function scopeDirs({ globalDirs, projectDirs, scope = "both" }) {
  if (scope === "global") return globalDirs;
  if (scope === "project") return projectDirs;
  return [...projectDirs, ...globalDirs];
}

export const adapters = /** @type {BrainAdapter[]} */ ([
  {
    id: "claude-code",
    label: "Claude Code",
    skillDirs: (cwd = process.cwd(), opts = {}) => {
      const scope = opts.scope || "both";
      const home = process.env.CLAUDE_HOME || path.join(process.env.HOME || "", ".claude");
      return scopeDirs({
        scope,
        globalDirs: [path.join(home, "skills")],
        projectDirs: [path.join(cwd, ".claude", "skills")],
      });
    },
  },
  {
    id: "cursor",
    label: "Cursor",
    skillDirs: (cwd = process.cwd(), opts = {}) => {
      const scope = opts.scope || "both";
      return scopeDirs({
        scope,
        globalDirs: [path.join(process.env.HOME || "", ".cursor", "skills")],
        projectDirs: [path.join(cwd, ".cursor", "skills")],
      });
    },
    rulesFile: (cwd = process.cwd()) => path.join(cwd, ".cursor", "rules", "cto-brain.mdc"),
  },
  {
    id: "codex",
    label: "Codex / OpenAI agents",
    skillDirs: (_cwd = process.cwd(), opts = {}) => {
      const scope = opts.scope || "both";
      const global = path.join(process.env.HOME || "", ".agents", "skills");
      if (scope === "project") return [];
      return [global];
    },
  },
  {
    id: "opencode",
    label: "OpenCode",
    skillDirs: (_cwd = process.cwd(), opts = {}) => {
      const scope = opts.scope || "both";
      const global = path.join(process.env.HOME || "", ".config", "opencode", "skills");
      if (scope === "project") return [];
      return [global];
    },
  },
  {
    id: "generic",
    label: "Generic (project .agents/skills)",
    skillDirs: (cwd = process.cwd(), opts = {}) => {
      const scope = opts.scope || "both";
      const project = path.join(cwd, ".agents", "skills");
      if (scope === "global") return [];
      return [project];
    },
  },
]);

export function getAdapter(id) {
  const a = adapters.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown adapter: ${id}. Try: ${adapters.map((x) => x.id).join(", ")}`);
  return a;
}

export function wireSkills(opts = {}) {
  const brainHome = opts.brainHome || systemBrainHome();
  const skillsSrc = path.join(brainHome, "skills");
  if (!exists(skillsSrc)) {
    throw new Error(`System brain skills missing at ${skillsSrc}. Run: cto-brain init`);
  }

  const ids = opts.adapters || ["claude-code", "cursor"];
  const scope = opts.scope || "both";
  const wired = [];

  for (const id of ids) {
    const adapter = getAdapter(id);
    for (const destRoot of adapter.skillDirs(opts.cwd, { scope })) {
      ensureDir(destRoot);
      const r = syncDir(skillsSrc, destRoot);
      wired.push({ adapter: id, dest: destRoot, ...r });
    }

    if (adapter.rulesFile && opts.withRules !== false) {
      const rulesPath = adapter.rulesFile(opts.cwd);
      ensureDir(path.dirname(rulesPath));
      if (!exists(rulesPath)) {
        fs.writeFileSync(
          rulesPath,
          `---
description: Load cto-orchestration and meta-brain for multi-agent build rounds
globs:
alwaysApply: false
---

When holding the CTO seat or routing ambiguous engineering intent, load skills from \`.cto-brain/skills/\` or system brain via \`cto-brain adapter wire\`. Default route: meta-brain → cto-orchestration.
`,
          "utf8"
        );
        wired.push({ adapter: id, rules: rulesPath, created: true });
      }
    }
  }

  // Claude memory mirror (optional)
  if (ids.includes("claude-code") && opts.syncMemory) {
    const memSrc = path.join(brainHome, "memory");
    const memDest = claudeMemoryTarget();
    if (exists(memSrc)) {
      ensureDir(memDest);
      wired.push({ adapter: "claude-code", memory: memDest, ...syncDir(memSrc, memDest) });
    }
  }

  return { skills: listSkillNames(skillsSrc), wired };
}

export function detectInstalledAdapters(cwd = process.cwd(), scope = "both") {
  return adapters.map((a) => ({
    id: a.id,
    label: a.label,
    dirs: a.skillDirs(cwd, { scope }).filter((d) => exists(d)),
  }));
}

export function adapterHasCoreSkills(dir) {
  return ["cto-orchestration", "meta-brain"].every(
    (name) => exists(path.join(dir, name, "SKILL.md"))
  );
}
