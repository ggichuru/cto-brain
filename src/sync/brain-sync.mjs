import fs from "node:fs";
import path from "node:path";
import {
  bundledSkillsDir,
  ensureDir,
  exists,
  listSkillNames,
  projectBrainDir,
  systemBrainHome,
  templatesDir,
} from "../paths.mjs";
import { copyFileIfNewer, scanForCredentials, syncDir } from "./non-destructive.mjs";
import { initRouterConfig } from "../router/config.mjs";

export function systemLayout(home = systemBrainHome()) {
  return {
    home,
    skills: path.join(home, "skills"),
    memory: path.join(home, "memory"),
    portfolio: path.join(home, "memory", "portfolio.md"),
    growthLedger: path.join(home, "memory", "growth_ledger.md"),
    settings: path.join(home, "settings"),
  };
}

export function projectLayout(cwd = process.cwd()) {
  const root = projectBrainDir(cwd);
  return {
    home: root,
    skills: path.join(root, "skills"),
    memory: path.join(root, "memory"),
    addendum: path.join(root, "project-addendum.md"),
    charter: path.join(cwd, "CHARTER.md"),
    status: path.join(cwd, "STATUS.md"),
    growth: path.join(cwd, "GROWTH.md"),
  };
}

/** npm package bundled skills → system brain */
export function pullPackageToSystem(home = systemBrainHome()) {
  const layout = systemLayout(home);
  ensureDir(layout.skills);
  const bundled = bundledSkillsDir();
  const r = syncDir(bundled, layout.skills);
  return { layout, ...r, skills: listSkillNames(layout.skills) };
}

/** system ↔ project non-destructive sync */
export function syncSystemProject(opts = {}) {
  const sys = systemLayout(opts.systemHome);
  const proj = projectLayout(opts.cwd);
  const results = [];

  if (opts.promote) {
    if (exists(proj.memory)) {
      results.push({ path: "memory", ...syncDir(proj.memory, sys.memory, { excludes: [] }) });
    }
    if (exists(proj.skills)) {
      results.push({ path: "skills", ...syncDir(proj.skills, sys.skills) });
    }
    return { direction: "promote", sys, proj, results };
  }

  if (opts.pull) {
    results.push({ path: "skills", ...syncDir(sys.skills, proj.skills) });
    results.push({ path: "memory", ...syncDir(sys.memory, proj.memory) });
    return { direction: "pull", sys, proj, results };
  }

  if (opts.projectOnly) {
    if (exists(sys.skills)) {
      results.push({ path: "skills", ...syncDir(sys.skills, proj.skills) });
    }
    if (exists(sys.memory)) {
      results.push({ path: "memory", ...syncDir(sys.memory, proj.memory) });
    }
    return { direction: "project-only", sys, proj, results };
  }

  // bidirectional: newer wins per file via separate passes
  if (exists(sys.skills) && exists(proj.skills)) {
    syncDir(sys.skills, proj.skills);
    syncDir(proj.skills, sys.skills);
    results.push({ path: "skills", method: "bidirectional" });
  } else if (exists(sys.skills)) {
    results.push({ path: "skills", ...syncDir(sys.skills, proj.skills) });
  }

  if (exists(sys.memory) && exists(proj.memory)) {
    syncDir(sys.memory, proj.memory);
    syncDir(proj.memory, sys.memory);
    results.push({ path: "memory", method: "bidirectional" });
  } else if (exists(sys.memory)) {
    results.push({ path: "memory", ...syncDir(sys.memory, proj.memory) });
  }

  return { direction: "bidirectional", sys, proj, results };
}

export function initSystemBrain(home = systemBrainHome()) {
  const layout = systemLayout(home);
  ensureDir(layout.skills);
  ensureDir(layout.memory);
  ensureDir(layout.settings);

  pullPackageToSystem(home);

  if (!exists(layout.growthLedger)) {
    fs.writeFileSync(
      layout.growthLedger,
      "# Brain growth ledger (append-only)\n\nFormat: `YYYY-MM-DD | <round-tag> | <action-summary> | <lesson-or-noop>`\n\n",
      "utf8"
    );
  }

  if (!exists(layout.portfolio)) {
    fs.writeFileSync(
      layout.portfolio,
      `# Portfolio — lead-CTO map\n\nFormat: project | subordinate-cto | repo-path | charter | status | last-status | notes\n\n`,
      "utf8"
    );
  }

  return layout;
}

export function initProjectBrain(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const proj = projectLayout(cwd);
  ensureDir(proj.home);
  ensureDir(proj.skills);
  ensureDir(proj.memory);

  const tpl = templatesDir();
  const charterTpl = path.join(tpl, "CHARTER.md");
  const statusTpl = path.join(tpl, "STATUS.md");
  const growthTpl = path.join(tpl, "GROWTH.md");
  const addendumTpl = path.join(tpl, "project-addendum.md");

  const projectName = opts.projectName || path.basename(cwd);

  if (!exists(proj.charter) && exists(charterTpl)) {
    fs.writeFileSync(proj.charter, renderTemplate(fs.readFileSync(charterTpl, "utf8"), { projectName, cwd }), "utf8");
  }
  if (!exists(proj.status) && exists(statusTpl)) {
    fs.writeFileSync(proj.status, renderTemplate(fs.readFileSync(statusTpl, "utf8"), { projectName, cwd }), "utf8");
  }
  if (!exists(proj.growth) && exists(growthTpl)) {
    fs.writeFileSync(proj.growth, renderTemplate(fs.readFileSync(growthTpl, "utf8"), { projectName, cwd }), "utf8");
  }
  if (!exists(proj.addendum) && exists(addendumTpl)) {
    fs.writeFileSync(proj.addendum, renderTemplate(fs.readFileSync(addendumTpl, "utf8"), { projectName }), "utf8");
  }

  initSystemBrain(opts.systemHome);
  syncSystemProject({ cwd, projectOnly: true, systemHome: opts.systemHome });
  initRouterConfig({ cwd });

  return proj;
}

function renderTemplate(text, vars) {
  const projectName = vars.projectName || "project";
  const slug = projectName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return text
    .replace(/\{\{projectName\}\}/g, projectName)
    .replace(/\{\{ctoId\}\}/g, vars.ctoId || `${slug}-cto`)
    .replace(/\{\{cwd\}\}/g, vars.cwd || process.cwd())
    .replace(/\{\{date\}\}/g, new Date().toISOString().slice(0, 10));
}

export function assertNoCredentials(root) {
  const hits = scanForCredentials(root);
  if (hits.length) {
    const err = new Error(`Credential-like paths detected: ${hits.join(", ")}`);
    err.hits = hits;
    throw err;
  }
}
