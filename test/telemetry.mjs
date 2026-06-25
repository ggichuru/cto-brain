// Telemetry recorder + summarize tests — isolated to a temp brain home.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { recordEvent, summarize, runsPath } from "../src/telemetry/recorder.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const home = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-tele-"));

// empty home -> zeroed summary, no throw
const empty = summarize(home);
ok("empty summary total is 0", empty.total === 0);
ok("empty summary has routing block", empty.routing && empty.routing.fallbackRate === 0);

// record a spread of events
recordEvent({ kind: "cli_route", source: "router_select", task: "dispatch-builder", provider: "ollama", fallbackUsed: false, honest: true, latencyMs: 10 }, home);
recordEvent({ kind: "cli_route", source: "router_select", task: "reviewer-security", provider: "ollama", fallbackUsed: true, honest: true, latencyMs: 20 }, home);
recordEvent({ kind: "cli_route", source: "router_select", task: "dispatch-builder", provider: "vllm", fallbackUsed: false, honest: true, latencyMs: 30 }, home);
recordEvent({ kind: "mcp_tool", source: "router_plan", latencyMs: 40, ok: true }, home);
recordEvent({ kind: "mcp_tool", source: "router_plan", latencyMs: 50, ok: true }, home);

ok("runs.jsonl created", fs.existsSync(runsPath(home)));
const lines = fs.readFileSync(runsPath(home), "utf8").trim().split("\n");
ok("5 lines written", lines.length === 5);
ok("each line is valid JSON with ts", lines.every((l) => { try { return !!JSON.parse(l).ts; } catch { return false; } }));
ok("no baseUrl/secret field leaked", lines.every((l) => !/baseUrl|apiKey|token/i.test(l)));

const s = summarize(home);
ok("total is 5", s.total === 5);
ok("byKind cli_route=3", s.byKind["cli_route"] === 3);
ok("byKind mcp_tool=2", s.byKind["mcp_tool"] === 2);
ok("routing total is 3", s.routing.total === 3);
ok("fallbackRate is 1/3", s.routing.fallbackRate === +(1 / 3).toFixed(3));
ok("byTaskProvider dispatch-builder ollama=1 vllm=1", s.routing.byTaskProvider["dispatch-builder"].ollama === 1 && s.routing.byTaskProvider["dispatch-builder"].vllm === 1);
ok("toolCalls router_plan=2", s.toolCalls["router_plan"] === 2);
ok("latency p50 present", typeof s.latencyMs.p50 === "number");
ok("latency max is 50", s.latencyMs.max === 50);

// opt-out via env
process.env.CTO_BRAIN_NO_TELEMETRY = "1";
const before = fs.readFileSync(runsPath(home), "utf8");
recordEvent({ kind: "cli_route", task: "explore", provider: "ollama", latencyMs: 5 }, home);
const after = fs.readFileSync(runsPath(home), "utf8");
ok("CTO_BRAIN_NO_TELEMETRY suppresses writes", before === after);
delete process.env.CTO_BRAIN_NO_TELEMETRY;

// --- rotation: live file caps; backup keeps recent history; summary spans both ---
const rotHome = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-tele-rot-"));
process.env.CTO_BRAIN_TELEMETRY_MAX_BYTES = "300"; // tiny cap to force rotation fast
for (let i = 0; i < 40; i++) recordEvent({ kind: "cli_route", task: "explore", provider: "ollama", latencyMs: i }, rotHome);
ok("rotated backup runs.jsonl.1 created", fs.existsSync(runsPath(rotHome) + ".1"));
ok("live file stays bounded near the cap", fs.statSync(runsPath(rotHome)).size < 2000);
const rs = summarize(rotHome);
const liveLines = fs.readFileSync(runsPath(rotHome), "utf8").trim().split("\n").filter(Boolean).length;
// Single backup intentionally drops history older than the last rotation, so
// total < 40 is correct; what matters is the summary spans backup + live.
ok("summary spans backup + live (more than live alone)", rs.total > liveLines && rs.total <= 40);
delete process.env.CTO_BRAIN_TELEMETRY_MAX_BYTES;
fs.rmSync(rotHome, { recursive: true, force: true });

fs.rmSync(home, { recursive: true, force: true });

if (failures) { console.error("\n" + failures + " telemetry failure(s)"); process.exit(1); }
console.log("\nAll telemetry checks passed.");
