// MCP tool registry + dispatcher tests — no transport, no network dependency.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TOOLS, listTools, callTool } from "../src/mcp/tools.mjs";
import { TASK_KINDS } from "../src/cli/router.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

// --- registry shape ---
ok("TOOLS is a non-empty array", Array.isArray(TOOLS) && TOOLS.length >= 5);
for (const t of TOOLS) {
  ok(`${t.name}: has description`, typeof t.description === "string" && t.description.length > 0);
  ok(`${t.name}: inputSchema is object schema`, t.inputSchema && t.inputSchema.type === "object");
  ok(`${t.name}: handler is function`, typeof t.handler === "function");
}

const names = TOOLS.map((t) => t.name);
for (const expected of ["router_select", "router_plan", "router_probe", "stack_status", "gate_check", "adapter_status", "eval_run", "agent_card", "round_close"]) {
  ok(`tool present: ${expected}`, names.includes(expected));
}

// --- listTools() is wire-safe (no handler leaked) ---
const listed = listTools();
ok("listTools returns same count", listed.length === TOOLS.length);
ok("listTools omits handler", listed.every((t) => !("handler" in t)));
ok("listTools keeps name/description/inputSchema", listed.every((t) => t.name && t.description && t.inputSchema));

// --- router_select schema is task-bound ---
const sel = TOOLS.find((t) => t.name === "router_select");
ok("router_select requires task", Array.isArray(sel.inputSchema.required) && sel.inputSchema.required.includes("task"));
ok("router_select task enum matches TASK_KINDS", sel.inputSchema.properties.task.enum.length === TASK_KINDS.length);

// --- round_close flagged as a write tool ---
const rc = TOOLS.find((t) => t.name === "round_close");
ok("round_close marked WRITE", /write/i.test(rc.description));

// --- round_close advertises optional outcome-telemetry fields ---
ok("round_close schema has outcome (string)", rc.inputSchema.properties.outcome && rc.inputSchema.properties.outcome.type === "string");
ok("round_close schema has tokensIn/tokensOut (number)", rc.inputSchema.properties.tokensIn?.type === "number" && rc.inputSchema.properties.tokensOut?.type === "number");
ok("outcome fields stay optional", ["outcome", "tokensIn", "tokensOut"].every((f) => !rc.inputSchema.required.includes(f)));

// --- dispatcher: unknown tool throws ---
let threw = false;
try { await callTool("does_not_exist", {}); } catch { threw = true; }
ok("callTool throws on unknown tool", threw);

// --- dispatcher: real calls return data (filesystem-only / deterministic) ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-mcp-"));
const gate = await callTool("gate_check", { home: tmp });
ok("gate_check returns object with ok boolean", gate && typeof gate.ok === "boolean");

const plan = await callTool("router_plan", {});
ok("router_plan returns tasks matrix", plan && plan.tasks && typeof plan.tasks === "object");
ok("router_plan covers all task kinds", Object.keys(plan.tasks).length === TASK_KINDS.length);

const adapters = await callTool("adapter_status", {});
ok("adapter_status returns object", adapters && typeof adapters === "object");

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) { console.error("\n" + failures + " MCP failure(s)"); process.exit(1); }
console.log("\nAll MCP checks passed.");
