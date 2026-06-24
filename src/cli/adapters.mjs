import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { adapters, getAdapter, wireSkills as wireSkillsCore } from "../adapters/index.mjs";
import {
  adaptersSettingsPath,
  loadAdapterSettings,
  resolveEnabledAdapters,
  resolveScope,
  saveAdapterSettings,
} from "../adapters/settings.mjs";
import { exists, listSkillNames, systemBrainHome } from "../paths.mjs";

const REQUIRED_SKILLS = ["cto-orchestration", "meta-brain"];

function isDirWired(dir) {
  if (!exists(dir)) return false;
  return REQUIRED_SKILLS.every((name) => exists(path.join(dir, name, "SKILL.md")));
}

export function resolveAdapterPaths(adapter, cwd, scope) {
  return adapter.skillDirs(cwd, { scope });
}

export function adapterList(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const home = opts.home || systemBrainHome();
  const scope = resolveScope({ ...opts, home });
  const settings = loadAdapterSettings(home);

  return adapters.map((a) => {
    const paths = resolveAdapterPaths(a, cwd, scope);
    const entries = paths.map((p) => ({
      path: p,
      exists: exists(p),
      wired: isDirWired(p),
      skillCount: exists(p) ? listSkillNames(p).length : 0,
    }));
    return {
      id: a.id,
      label: a.label,
      paths: entries,
      wired: entries.some((e) => e.wired),
      enabled: settings.enabled.includes(a.id),
    };
  });
}

export function adapterStatus(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const home = opts.home || systemBrainHome();
  const settings = loadAdapterSettings(home);
  const list = adapterList({ cwd, home, scope: settings.scope });
  const enabled = resolveEnabledAdapters({ home, adapters: opts.adapters });

  return {
    settingsPath: adaptersSettingsPath(home),
    enabled,
    scope: settings.scope,
    lastWired: settings.lastWired,
    adapters: list.filter((a) => enabled.includes(a.id)),
    all: list,
  };
}

export async function adapterPick(opts = {}) {
  const home = opts.home || systemBrainHome();

  if (opts.list) {
    return {
      listed: true,
      adapters: adapters.map((a, i) => ({ index: i + 1, id: a.id, label: a.label })),
    };
  }

  let enabled;
  if (opts.adapters) {
    enabled = String(opts.adapters).split(",").map((s) => s.trim()).filter(Boolean);
  } else if (process.env.CTO_BRAIN_ADAPTERS) {
    enabled = process.env.CTO_BRAIN_ADAPTERS.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (process.env.CI === "true" || process.env.CI === "1") {
    throw new Error("Non-interactive: use --adapters or set CTO_BRAIN_ADAPTERS in CI");
  } else {
    enabled = await interactivePick();
  }

  for (const id of enabled) getAdapter(id);

  const prev = loadAdapterSettings(home);
  const settings = {
    ...prev,
    enabled,
    scope: opts.scope || prev.scope,
  };
  const settingsPath = saveAdapterSettings(settings, home);
  return { enabled, scope: settings.scope, settingsPath };
}

async function interactivePick() {
  const lines = adapters.map((a, i) => `${i + 1}. ${a.id} — ${a.label}`);
  process.stdout.write(`Pick adapters (comma-separated numbers or ids):\n${lines.join("\n")}\n> `);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.once("line", (line) => {
      rl.close();
      resolve(line.trim());
    });
  });

  if (!answer) return resolveEnabledAdapters({});

  const parts = answer.split(",").map((s) => s.trim()).filter(Boolean);
  const picked = [];
  for (const part of parts) {
    const num = Number(part);
    if (Number.isInteger(num) && num >= 1 && num <= adapters.length) {
      picked.push(adapters[num - 1].id);
    } else {
      getAdapter(part);
      picked.push(part);
    }
  }
  return [...new Set(picked)];
}

export function wireSkills(opts = {}) {
  const home = opts.brainHome || systemBrainHome();
  const ids = resolveEnabledAdapters({ ...opts, home });
  const scope = resolveScope({ ...opts, home });
  const result = wireSkillsCore({
    ...opts,
    brainHome: home,
    adapters: ids,
    scope,
  });

  const settings = loadAdapterSettings(home);
  settings.lastWired = new Date().toISOString().slice(0, 10);
  settings.scope = scope;
  if (!opts.adapters && !process.env.CTO_BRAIN_ADAPTERS) {
    settings.enabled = ids;
  }
  saveAdapterSettings(settings, home);

  return { ...result, enabled: ids, scope };
}

export function formatAdapterListTable(rows) {
  const out = ["id\tlabel\tpath\twired\tskills"];
  for (const row of rows) {
    for (const p of row.paths) {
      out.push(`${row.id}\t${row.label}\t${p.path}\t${p.wired ? "yes" : "no"}\t${p.skillCount}`);
    }
    if (!row.paths.length) {
      out.push(`${row.id}\t${row.label}\t(none)\tno\t0`);
    }
  }
  return out.join("\n");
}
