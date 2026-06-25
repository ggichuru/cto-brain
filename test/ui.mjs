// CLI UI primitives + renderers: color gating, alignment, and JSON switch.
import { setColorEnabled, bold, table, kv, sym, useJson } from "../src/cli/ui.mjs";
import * as render from "../src/cli/render.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}
const ESC = "";

// --- color gating ---
setColorEnabled(false);
ok("color off: bold is a no-op", bold("x") === "x");
ok("color off: no ANSI in table", !table(["A", "B"], [["1", "2"]]).includes(ESC));
ok("color off: sym is plain glyph", sym.ok() === "✓");

setColorEnabled(true);
ok("color on: bold injects ESC", bold("x").includes(ESC));
ok("color on: sym injects ESC", sym.ok().includes(ESC));
setColorEnabled(false); // reset for clean substring checks below

// --- layout helpers ---
const t = table(["TASK", "PROVIDER"], [["build", "ollama"]]);
ok("table includes headers + cells", t.includes("TASK") && t.includes("build") && t.includes("ollama"));
const k = kv([["prefer", "local"], ["layers", "x"]]);
ok("kv includes keys + values", k.includes("prefer") && k.includes("local"));

// --- renderers (color off → clean substrings) ---
const plan = { prefer: "local", layers: { system: true, project: true }, enabledProviders: ["ollama"],
  tasks: { "dispatch-builder": { provider: "ollama", model: "m", tier: "local", honest: true } } };
const p = render.renderRouterPlan(plan);
ok("plan render: heading + task + provider", p.includes("Routing plan") && p.includes("dispatch-builder") && p.includes("ollama"));

const sc = { total: 2, passed: 2, failed: 0, passRate: 1, byDimension: { routing: { passed: 2, total: 2, passRate: 1 } }, cases: [] };
ok("eval render: scorecard + ratio", render.renderEval(sc).includes("Eval scorecard") && render.renderEval(sc).includes("2/2"));

const probe = { stacks: [{ id: "ollama", status: "reachable", models: ["m"] }], providers: [{ id: "vllm", status: "down" }], discovered: [] };
const pr = render.renderProbe(probe);
ok("probe render: shows reachable + down ids", pr.includes("ollama") && pr.includes("vllm"));

const route = { task: "explore", provider: "ollama", model: "m", tier: "local", honest: true, fallbackUsed: false, baseUrl: "x" };
ok("select render: task + provider", render.renderRouterSelect(route).includes("explore") && render.renderRouterSelect(route).includes("ollama"));
ok("select render: null route is honest", render.renderRouterSelect({ task: "x", provider: null, honest: true }).includes("no route"));

// --- JSON switch ---
ok("useJson honors --json", useJson({ json: true }) === true);

if (failures) { console.error("\n" + failures + " UI failure(s)"); process.exit(1); }
console.log("\nAll UI checks passed.");
