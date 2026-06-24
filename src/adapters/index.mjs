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

export const adapters = /** @type {BrainAdapter[]} */ ([
  {
    id: "claude-code",
    label: "Claude Code",
    skillDirs: () => {
      const home = process.env.CLAUDE_HOME || path.join(process.env.HOME || "", ".claude");
      return [path.join(home, "skills")];
    },
  },
  {
    id: "cursor",
    label: "Cursor",
    skillDirs: (cwd = process.cwd()) => [
      path.join(cwd, ".cursor", "skills"),
      path.join(process.env.HOME || "", ".cursor", "skills"),
    ],
    rulesFile: (cwd = process.cwd()) => path.join(cwd, ".cursor", "rules", "cto-brain.mdc"),
  },
  {
    id: "codex",
    label: "Codex / OpenAI agents",
    skillDirs: () => [path.join(process.env.HOME || "", ".agents", "skills")],
  },
  {
    id: "opencode",
    label: "OpenCode",
    skillDirs: () => [path.join(process.env.HOME || "", ".config", "opencode", "skills")],
  },
  {
    id: "generic",
    label: "Generic (project .agents/skills)",
    skillDirs: (cwd = process.cwd()) => [path.join(cwd, ".agents", "skills")],
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
  const wired = [];

  for (const id of ids) {
    const adapter = getAdapter(id);
    for (const destRoot of adapter.skillDirs(opts.cwd)) {
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

export function detectInstalledAdapters() {
  return adapters.map((a) => ({
    id: a.id,
    label: a.label,
    dirs: a.skillDirs().filter((d) => exists(d)),
  }));
}
