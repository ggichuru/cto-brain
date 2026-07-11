// Round-close outcome telemetry — closing a round is the natural boundary
// where cost-per-outcome accrues, so every close writes a quantitative row.
// Hermetic: temp brain homes, subprocess CLI run via CTO_BRAIN_HOME.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { roundClose } from "../src/cli/round-close.mjs";
import { summarize, runsPath } from "../src/telemetry/recorder.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(here, "..", "bin", "cto-brain.mjs");

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const lastRow = (home) =>
  JSON.parse(fs.readFileSync(runsPath(home), "utf8").trim().split("\n").pop());

// --- closing a round with outcome + tokens appends a runs.jsonl row ---
const home = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-rco-"));
const r = roundClose({
  systemHome: home, cwd: home, tag: "r1", summary: "shipped", lesson: "l",
  outcome: "green-criterion", tokensIn: 1200, tokensOut: 300,
});
ok("growth ledger row written", r.system && fs.readFileSync(r.system.ledgerPath, "utf8").includes("r1"));
ok("runs.jsonl created in the same home", fs.existsSync(runsPath(home)));
const row = lastRow(home);
ok("row kind=round_close", row.kind === "round_close");
ok("row outcome tag round-trips", row.outcome === "green-criterion");
ok("row tokensIn=1200 tokensOut=300", row.tokensIn === 1200 && row.tokensOut === 300);
ok("row ok:true", row.ok === true);
const s = summarize(home);
ok("summary outcomes[tag].count=1", s.outcomes["green-criterion"] && s.outcomes["green-criterion"].count === 1);
ok("summary tokensPerOutcome=1500", s.outcomes["green-criterion"].tokensPerOutcome === 1500);

// --- omitting outcome defaults to 'round-closed'; string tokens coerce ---
roundClose({ systemHome: home, cwd: home, tag: "r2", summary: "s", tokensIn: "800", tokensOut: "200" });
const def = lastRow(home);
ok("default outcome is round-closed", def.outcome === "round-closed");
ok("string token flags coerce to numbers", def.tokensIn === 800 && def.tokensOut === 200);

// --- omitting token flags: outcome row without token fields, no NaN ---
roundClose({ systemHome: home, cwd: home, tag: "r3", summary: "s", outcome: "merged" });
const bare = lastRow(home);
ok("tokenless row keeps outcome", bare.outcome === "merged");
ok("tokenless row has no token fields", !("tokensIn" in bare) && !("tokensOut" in bare));
ok("no NaN anywhere in the file", !/NaN/.test(fs.readFileSync(runsPath(home), "utf8")));

// --- CTO_BRAIN_NO_TELEMETRY=1: ritual still completes, nothing recorded ---
const quiet = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-rco-quiet-"));
process.env.CTO_BRAIN_NO_TELEMETRY = "1";
const rq = roundClose({ systemHome: quiet, cwd: quiet, tag: "rq", summary: "s", outcome: "x", tokensIn: 1, tokensOut: 1 });
delete process.env.CTO_BRAIN_NO_TELEMETRY;
ok("opt-out: growth ledger row still written", rq.system && fs.readFileSync(rq.system.ledgerPath, "utf8").includes("rq"));
ok("opt-out: no runs.jsonl written", !fs.existsSync(runsPath(quiet)));

// --- CLI flags: --outcome/--tokens-in/--tokens-out reach the telemetry row ---
const cliHome = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-rco-cli-"));
execFileSync(process.execPath, [BIN, "round-close", "--tag", "cli", "--summary", "s", "--outcome", "cli-run", "--tokens-in", "10", "--tokens-out", "5"], {
  cwd: cliHome, env: { ...process.env, CTO_BRAIN_HOME: cliHome }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
});
const cliRow = lastRow(cliHome);
ok("CLI row kind=round_close outcome=cli-run", cliRow.kind === "round_close" && cliRow.outcome === "cli-run");
ok("CLI token flags parsed as numbers", cliRow.tokensIn === 10 && cliRow.tokensOut === 5);

fs.rmSync(home, { recursive: true, force: true });
fs.rmSync(quiet, { recursive: true, force: true });
fs.rmSync(cliHome, { recursive: true, force: true });

if (failures) { console.error("\n" + failures + " round-close-outcome failure(s)"); process.exit(1); }
console.log("\nAll round-close-outcome checks passed.");
