// cto-brain console — state assembler.
//
// Gathers the whole operational picture of the brain into one frozen shape,
// from the SAME functions the CLI/MCP already expose. Every source is guarded:
// a missing or throwing source degrades to an honest { error } island, never a
// crashed page. READ-ONLY — this module computes and reads, never mutates the
// brain (no config writes, no telemetry records, no adapter wiring).
//
// Frozen contract — buildState() resolves to:
//   { generated, version, prefer, router, stacks, adapters, telemetry,
//     eval, portfolio, ledger }
// Each top-level section is either its data or { error: "<reason>" }.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { systemBrainHome } from "../paths.mjs";
import { routerPlan, stackStatus } from "../cli/router.mjs";
import { adapterStatus } from "../cli/adapters.mjs";
import { summarize } from "../telemetry/recorder.mjs";
import { runEval } from "../eval/runner.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

function pkgVersion() {
  try {
    const raw = fs.readFileSync(path.join(here, "..", "..", "package.json"), "utf8");
    return JSON.parse(raw).version || "unknown";
  } catch {
    return "unknown";
  }
}

// Run a producer, returning its value or an honest error island. Never throws.
async function island(fn) {
  try {
    return await fn();
  } catch (e) {
    return { error: String(e && e.message ? e.message : e) };
  }
}

// Parse the growth ledger tail into structured rows (newest first).
function readLedger(home, rows = 12) {
  const p = path.join(home, "memory", "growth_ledger.md");
  let raw;
  try {
    raw = fs.readFileSync(p, "utf8");
  } catch {
    return { path: p, error: "ledger not readable", rows: [] };
  }
  const parsed = raw
    .split("\n")
    .filter((l) => /^\d{4}-\d{2}-\d{2}\s*\|/.test(l))
    .slice(-rows)
    .reverse()
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      return { date: parts[0] || "", tag: parts[1] || "", summary: parts[2] || "", lesson: parts[3] || "" };
    });
  return { path: p, rows: parsed };
}

// Parse the portfolio map (one project per non-comment, non-empty row).
function readPortfolio(home) {
  const p = path.join(home, "memory", "portfolio.md");
  let raw;
  try {
    raw = fs.readFileSync(p, "utf8");
  } catch {
    return { path: p, error: "portfolio not readable", projects: [] };
  }
  const projects = raw
    .split("\n")
    .filter((l) => l.includes("|") && !/^\s*#/.test(l) && !/^\s*Format:/i.test(l) && !/^\s*project\s*\|/i.test(l))
    .map((l) => l.split("|").map((s) => s.trim()))
    .filter((c) => c.length >= 3 && c[0])
    .map((c) => ({ project: c[0], cto: c[1] || "", repo: c[2] || "", status: c[4] || "", notes: c[c.length - 1] || "" }));
  return { path: p, projects };
}

/**
 * Assemble the full console state. All sections best-effort/guarded.
 * @param {object} opts { prefer, cwd, env, home }
 */
export async function buildState(opts = {}) {
  const home = opts.home || systemBrainHome();
  const cwd = opts.cwd || process.cwd();
  const prefer = opts.prefer || "auto";

  const [router, stacks, adapters, telemetry, evalResult] = await Promise.all([
    island(() => routerPlan({ prefer, cwd, env: opts.env })),
    island(() => stackStatus({ cwd, env: opts.env })),
    island(() => adapterStatus({ home })),
    island(() => summarize(home)),
    island(() => runEval()),
  ]);

  return {
    generated: new Date().toISOString(),
    version: pkgVersion(),
    prefer,
    router,
    stacks,
    adapters,
    telemetry,
    eval: evalResult,
    portfolio: readPortfolio(home),
    ledger: readLedger(home),
  };
}
