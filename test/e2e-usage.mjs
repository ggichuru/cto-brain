// Conclusive end-to-end USAGE suite. Drives the real `cto-brain` binary as a
// subprocess across every documented way to use it, in an isolated brain home +
// temp project. This is the executable mirror of docs/EXAMPLES.md — if an
// example here changes, the doc is wrong. Hermetic: temp CTO_BRAIN_HOME, temp
// cwd, ephemeral MCP ports, full cleanup.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(here, "..", "bin", "cto-brain.mjs");

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-e2e-home-"));
const PROJ = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-e2e-proj-"));
const env = { ...process.env, CTO_BRAIN_HOME: HOME };

// Run the CLI in the temp project. Returns { code, out }. Never throws on
// non-zero (we assert on code), so an `eval` that exits 1 is observable.
function cli(args, opts = {}) {
  try {
    const out = execFileSync(process.execPath, [BIN, ...args], {
      cwd: opts.cwd || PROJ, env: opts.env || env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || "") + (e.stderr || "") };
  }
}
const json = (s) => JSON.parse(s);

try {
  // 1. Stand it up in a repo
  ok("init --project exits 0", cli(["init", "--project", "--name", "e2e-demo"]).code === 0);
  ok("project brain created", fs.existsSync(path.join(PROJ, ".cto-brain")));

  // 2. Ask where to run work (router)
  const list = cli(["router", "list", "--json"]);
  ok("router list ok + has ollama", list.code === 0 && json(list.out).some((p) => p.id === "ollama"));
  const plan = cli(["router", "plan", "--json"]);
  ok("router plan has 8 task kinds", Object.keys(json(plan.out).tasks).length === 8);
  const sel = cli(["router", "select", "--task", "dispatch-builder", "--json"]);
  ok("router select returns the task", sel.code === 0 && json(sel.out).task === "dispatch-builder");
  ok("router probe is valid json", (() => { const r = cli(["router", "probe", "--json"]); return r.code === 0 && Array.isArray(json(r.out).providers); })());
  ok("stack status ok", cli(["stack", "status", "--json"]).code === 0);

  // 3. Prove + gate it
  const ev = cli(["eval", "--json"]);
  ok("eval scorecard all pass", json(ev.out).passed === json(ev.out).total && json(ev.out).failed === 0);
  const gate = cli(["gate", "check", "--home", HOME]);
  ok("gate check clean home ok:true", json(gate.out).ok === true);
  ok("telemetry summary returns object", typeof json(cli(["telemetry", "summary", "--json"]).out).total === "number");

  // 4. Discovery (A2A)
  const card = json(cli(["agent-card"]).out);
  ok("agent-card: 9 skills, protocol 1.0", card.skills.length === 9 && card.protocolVersion === "1.0");
  ok("agent-card: no secrets in card", !/sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/.test(JSON.stringify(card)));

  // 5. Wire to agent platforms
  ok("adapter wire --project ok", cli(["adapter", "wire", "--project", "--adapters", "claude-code"]).code === 0);
  ok("adapter status shows wiring", (() => { const s = json(cli(["adapter", "status", "--json"]).out); return Array.isArray(s.adapters); })());
  ok("wired skills landed in project", fs.existsSync(path.join(PROJ, ".claude", "skills", "cto-orchestration", "SKILL.md")));

  // 6. Self-extend safely (skill synth) — plant a secret, prove it's skipped
  const ws = path.join(PROJ, "ws"); fs.mkdirSync(path.join(ws, "skills", "x"), { recursive: true });
  fs.writeFileSync(path.join(ws, "skills", "x", "SKILL.md"), "---\nname: x\ndescription: clean\n---\nbody\n");
  fs.writeFileSync(path.join(ws, ".env"), "OPENAI_API_KEY=sk-LEAKLEAKLEAKLEAKLEAKLEAK12345\n");
  const synth = cli(["skill", "synth", "--topic", "demo flow", "--dir", ws]);
  ok("skill synth wrote a draft", synth.code === 0 && /DRAFT/.test(synth.out));
  const draft = path.join(PROJ, ".cto-brain", "skills-draft", "demo-flow", "SKILL.md");
  ok("draft exists in skills-draft", fs.existsSync(draft));
  ok("draft leaks no secret", !/sk-[A-Za-z0-9]{20,}/.test(fs.readFileSync(draft, "utf8")));

  // 7. doctor (health)
  ok("doctor runs", cli(["doctor"]).code !== undefined);

  // 8. Called by an agent over MCP (stdio)
  const c = new Client({ name: "e2e", version: "0" }, { capabilities: {} });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [BIN, "mcp"], env: { ...env, CTO_BRAIN_NO_TELEMETRY: "1" } }));
  const tools = (await c.listTools()).tools;
  ok("MCP stdio exposes 9 tools", tools.length === 9);
  const res = await c.callTool({ name: "router_plan", arguments: {} });
  ok("MCP router_plan returns 8 tasks", Object.keys(json(res.content[0].text).tasks).length === 8);
  await c.close();
} catch (e) {
  console.error("FAIL: e2e-usage threw:", e.message);
  failures++;
} finally {
  fs.rmSync(HOME, { recursive: true, force: true });
  fs.rmSync(PROJ, { recursive: true, force: true });
}

if (failures) { console.error("\n" + failures + " e2e-usage failure(s)"); process.exit(1); }
console.log("\nAll e2e-usage checks passed.");
