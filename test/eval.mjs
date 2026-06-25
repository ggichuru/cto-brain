// Meta-test for the eval harness: the suite runs, scores, and detects failure.
import { runEval } from "../src/eval/runner.mjs";
import { EVAL_CASES } from "../src/eval/cases.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const sc = runEval();
ok("scorecard total matches case count", sc.total === EVAL_CASES.length);
ok("scorecard has passed/failed/passRate", typeof sc.passed === "number" && typeof sc.failed === "number" && typeof sc.passRate === "number");
ok("every real case passes (brain behaves as specified)", sc.failed === 0);
ok("passRate is 1 when all pass", sc.passRate === 1);

for (const dim of ["routing", "honesty", "gate"]) {
  ok(`dimension present: ${dim}`, sc.byDimension[dim] && sc.byDimension[dim].total > 0);
  ok(`dimension ${dim} passRate computed`, typeof sc.byDimension[dim].passRate === "number");
}

ok("every case carries a detail string", sc.cases.every((c) => typeof c.detail === "string"));

// The harness must DETECT failure, not just report green.
const sabotage = [{ name: "deliberately wrong", dimension: "routing", kind: "route",
  input: { task: "dispatch-builder", prefer: "local", probes: [], env: {} },
  expect: { provider: "this-provider-cannot-exist" } }];
const bad = runEval(sabotage);
ok("harness detects a failing case", bad.failed === 1 && bad.passed === 0);
ok("failing case passRate is 0", bad.passRate === 0);

if (failures) { console.error("\n" + failures + " eval-harness failure(s)"); process.exit(1); }
console.log("\nAll eval-harness checks passed.");
