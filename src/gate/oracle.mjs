// Independent verification oracle for the gate surface.
//
// Doctrine (agent-design-space, surface audit — "Verification oracle"):
// a claimed outcome must be validated by a signal INDEPENDENT of the agent's
// own reasoning. "Make 'proven' require an external check, never a self-report."
// An agent can satisfy every surface criterion while the real outcome silently
// failed (a hallucinated / silent success); the verdict must therefore be the
// property of an external check, not of the caller's assertion.
//
// verifyOutcome({ claim, oracle }) resolves a claimed outcome against an
// independent oracle and returns a verdict. The self-report (`claim`) is
// recorded but is NEVER the source of "proven" — only the oracle is.
//
// Oracle shapes (any one):
//   - { command: ["cmd", "arg", ...] }  -> spawned argv, exit 0 == pass (no shell)
//   - { result: true|false }            -> a supplied external verifier result
//   - true | false                      -> shorthand for a supplied result
// Anything else fails CLOSED (cannot prove).

import { spawnSync } from "node:child_process";

export function verifyOutcome({ claim, oracle } = {}) {
  const selfReport = normalizeClaim(claim);

  // No independent oracle -> a self-report can never prove an outcome. Be honest
  // about it rather than silently trusting the claim.
  if (oracle === undefined || oracle === null) {
    return {
      proven: false,
      verdict: "unverified",
      source: "self-report",
      selfReport,
      silentFailureCaught: false,
      honest: true,
      detail: "no independent oracle supplied; a self-report cannot prove an outcome",
    };
  }

  const evidence = runOracle(oracle);
  const proven = evidence.passed === true;
  return {
    proven,
    verdict: proven ? "proven" : "disproven",
    source: evidence.source,
    selfReport,
    // The dangerous case the oracle exists to catch: agent claimed success but
    // the independent check disagrees.
    silentFailureCaught: selfReport === true && evidence.passed === false,
    oracle: evidence.summary,
    honest: true,
    detail: evidence.detail,
  };
}

function normalizeClaim(claim) {
  if (claim == null) return null;
  if (typeof claim === "boolean") return claim;
  if (typeof claim === "object" && typeof claim.passed === "boolean") return claim.passed;
  return null;
}

function runOracle(oracle) {
  // 1) Supplied external verifier result — the boolean IS the source of truth.
  if (typeof oracle === "boolean") {
    return { passed: oracle, source: "result", summary: { result: oracle }, detail: `external result: ${oracle}` };
  }
  if (oracle && typeof oracle.result === "boolean") {
    return { passed: oracle.result, source: "result", summary: { result: oracle.result }, detail: `external result: ${oracle.result}` };
  }

  // 2) External command — exit code 0 is the source of truth.
  const argv = oracle && oracle.command;
  if (Array.isArray(argv) && argv.length && typeof argv[0] === "string") {
    const [cmd, ...rest] = argv;
    const r = spawnSync(cmd, rest, {
      encoding: "utf8",
      timeout: Number(oracle.timeoutMs) || 30000,
      cwd: oracle.cwd || undefined,
      shell: false,
    });
    if (r.error) {
      return {
        passed: false,
        source: "command-exit",
        summary: { command: argv, exitCode: null, error: String(r.error.message || r.error) },
        detail: `oracle command failed to run: ${r.error.message || r.error}`,
      };
    }
    const passed = r.status === 0;
    return {
      passed,
      source: "command-exit",
      summary: { command: argv, exitCode: r.status, signal: r.signal ?? null },
      detail: passed
        ? "oracle command exited 0"
        : `oracle command exited ${r.status}${r.signal ? ` (signal ${r.signal})` : ""}`,
    };
  }

  // Unrecognized oracle shape -> fail closed. An unverifiable claim is not proven.
  return { passed: false, source: "invalid", summary: { oracle }, detail: "unrecognized oracle shape; failing closed" };
}
