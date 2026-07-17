// Independent verification oracle for the gate surface.
//
// Doctrine (agent-design-space, surface audit Surface "Verification oracle"):
// "Make 'proven' require an external check, never a self-report." An agent can
// satisfy every surface criterion while the real outcome silently failed; the
// oracle closes that hole by making the verdict the property of a signal that
// is INDEPENDENT of the agent's own reasoning.
//
// This test is the executable form of that call:
//   (a) a self-reported pass + a FAILING external oracle  -> NOT proven
//   (b) a passing external oracle                          -> proven
//   (c) no oracle supplied -> gate_check keeps its existing (secret-scan) shape.

import { verifyOutcome } from "../src/gate/oracle.mjs";
import { callTool } from "../src/mcp/tools.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

// ---- (a) self-report cannot override a failing independent oracle ----
const lied = verifyOutcome({ claim: { passed: true }, oracle: { command: ["false"] } });
ok("failing oracle => not proven despite self-reported pass", lied.proven === false);
ok("failing oracle => verdict is not 'proven'", lied.verdict !== "proven");
ok("self-report is preserved for the record", lied.selfReport === true);
ok("silent hallucinated success is flagged", lied.silentFailureCaught === true);
ok("oracle exit code is the recorded evidence", lied.oracle && lied.oracle.exitCode !== 0);

// A boolean supplied verifier result is an equally-valid independent source.
const liedResult = verifyOutcome({ claim: true, oracle: { result: false } });
ok("failing supplied-result oracle => not proven", liedResult.proven === false);

// ---- (b) a passing independent oracle is what yields 'proven' ----
const proven = verifyOutcome({ claim: { passed: true }, oracle: { command: ["true"] } });
ok("passing oracle => proven", proven.proven === true);
ok("passing oracle => verdict is 'proven'", proven.verdict === "proven");
ok("passing oracle => no silent-failure flag", proven.silentFailureCaught === false);

// 'proven' must come from the ORACLE, not the claim: no self-report at all,
// but a passing external check still proves the outcome.
const provenNoClaim = verifyOutcome({ oracle: { result: true } });
ok("passing oracle proves outcome even with no self-report", provenNoClaim.proven === true);

// Self-report alone (no oracle) can NEVER be proven — the whole point.
const bare = verifyOutcome({ claim: { passed: true } });
ok("self-report alone is never proven", bare.proven === false);
ok("self-report alone is honest about being unverified", bare.honest === true && bare.verdict !== "proven");

// A malformed oracle fails closed (cannot prove).
const malformed = verifyOutcome({ claim: true, oracle: { nonsense: 1 } });
ok("malformed oracle fails closed (not proven)", malformed.proven === false);

// ---- MCP gate_check surface: oracle path is reachable via the tool ----
const toolFail = await callTool("gate_check", { claim: { passed: true }, oracle: { command: ["false"] } });
ok("gate_check tool: failing oracle => not proven", toolFail.proven === false);
const toolPass = await callTool("gate_check", { oracle: { result: true } });
ok("gate_check tool: passing oracle => proven", toolPass.proven === true);

// ---- (c) backward-compat: no oracle => unchanged secret-scan behavior ----
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-gate-oracle-"));
fs.mkdirSync(path.join(tmp, "skills", "clean"), { recursive: true });
fs.writeFileSync(
  path.join(tmp, "skills", "clean", "SKILL.md"),
  "---\nname: clean\ndescription: Use when testing the gate.\n---\n\nok\n",
  "utf8"
);
const legacyClean = await callTool("gate_check", { home: tmp });
ok("no oracle => legacy scan shape (ok:true) unchanged", legacyClean.ok === true && legacyClean.proven === undefined);
fs.writeFileSync(path.join(tmp, "credentials.json"), "{}", "utf8");
const legacyDirty = await callTool("gate_check", { home: tmp });
ok("no oracle => legacy scan still fails on credential file", legacyDirty.ok === false);
fs.rmSync(tmp, { recursive: true, force: true });

if (failures) { console.error("\n" + failures + " gate-oracle failure(s)"); process.exit(1); }
console.log("\nAll gate-oracle checks passed.");
