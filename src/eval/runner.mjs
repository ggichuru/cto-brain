// Eval runner — scores cto-brain's own decisions against declarative cases.
// Complements the unit tests: produces a SCORECARD (pass rate per dimension),
// not just pass/fail, so routing/gate quality is measurable over time.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { selectRoute } from "../router/select.mjs";
import { gateCheck } from "../gate/pack.mjs";
import { ensureDir } from "../paths.mjs";
import { EVAL_CASES } from "./cases.mjs";

function runRouteCase(input) {
  const r = selectRoute(input) || {};
  return { provider: r.provider ?? null, tier: r.tier ?? null, honest: r.honest ?? null, fallbackUsed: r.fallbackUsed ?? null };
}

function runGateCase(input) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-eval-"));
  try {
    for (const [rel, content] of Object.entries(input.files || {})) {
      const full = path.join(dir, rel);
      ensureDir(path.dirname(full));
      fs.writeFileSync(full, content);
    }
    const r = gateCheck(dir);
    return { ok: r.ok };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Compare only the keys present in `expect`.
function matches(actual, expect) {
  const mismatches = [];
  for (const [k, v] of Object.entries(expect)) {
    if (actual[k] !== v) mismatches.push(`${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(actual[k])}`);
  }
  return { pass: mismatches.length === 0, mismatches };
}

export function runEval(cases = EVAL_CASES) {
  const results = [];
  for (const c of cases) {
    let actual;
    try {
      actual = c.kind === "gate" ? runGateCase(c.input) : runRouteCase(c.input);
    } catch (err) {
      results.push({ name: c.name, dimension: c.dimension, kind: c.kind, pass: false, expect: c.expect, actual: null, detail: `threw: ${err.message}` });
      continue;
    }
    const { pass, mismatches } = matches(actual, c.expect);
    results.push({ name: c.name, dimension: c.dimension, kind: c.kind, pass, expect: c.expect, actual, detail: mismatches.join("; ") || "ok" });
  }

  const byDimension = {};
  for (const r of results) {
    const d = (byDimension[r.dimension] ||= { passed: 0, total: 0 });
    d.total++;
    if (r.pass) d.passed++;
  }
  for (const d of Object.values(byDimension)) d.passRate = +(d.passed / d.total).toFixed(3);

  const passed = results.filter((r) => r.pass).length;
  return {
    generated: null, // stamped by the caller; Date.* avoided in the pure path
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length ? +(passed / results.length).toFixed(3) : 0,
    byDimension,
    cases: results,
  };
}
