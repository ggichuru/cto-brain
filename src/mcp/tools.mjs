// MCP tool registry for cto-brain.
//
// Each tool wraps an EXISTING importable function — no router/gate/adapter
// logic is reimplemented here. The registry (TOOLS) and the dispatcher
// (callTool) are transport-agnostic so they can be unit-tested without
// spinning up a stdio server. src/mcp/server.mjs adds the transport.

import { routerSelect, routerPlan, routerProbe, stackStatus, TASK_KINDS } from "../cli/router.mjs";
import { adapterStatus } from "../cli/adapters.mjs";
import { roundClose } from "../cli/round-close.mjs";
import { gateCheck } from "../gate/pack.mjs";
import { systemBrainHome } from "../paths.mjs";

const PREFER_ENUM = ["auto", "local", "cloud"];

// Ledger rows are pipe-delimited, one per line — strip newlines and pipes so a
// tool caller can't inject extra rows / columns into the growth ledger.
function sanitizeLedgerField(s) {
  if (s == null) return s;
  return String(s).replace(/[\r\n|]+/g, " ").trim();
}

export const TOOLS = [
  {
    name: "router_select",
    description:
      "Pick the model/provider route for a single task kind, honest about reachability. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", enum: [...TASK_KINDS], description: "Task kind to route." },
        prefer: { type: "string", enum: PREFER_ENUM, description: "Tier preference (default auto)." },
      },
      required: ["task"],
    },
    handler: (args) => routerSelect({ cwd: process.cwd(), task: args.task, prefer: args.prefer }),
  },
  {
    name: "router_plan",
    description:
      "Full task->provider/model matrix across all task kinds, plus config layers and agentic settings. Read-only.",
    inputSchema: {
      type: "object",
      properties: { prefer: { type: "string", enum: PREFER_ENUM, description: "Tier preference (default auto)." } },
    },
    handler: (args) => routerPlan({ cwd: process.cwd(), prefer: args.prefer }),
  },
  {
    name: "router_probe",
    description:
      "Probe configured + discovered stacks (Ollama/vLLM/Desk/llama.cpp) for reachability and models. Read-only.",
    inputSchema: {
      type: "object",
      properties: { all: { type: "boolean", description: "Include cloud credential checks." } },
    },
    handler: async (args) => (await routerProbe({ cwd: process.cwd(), all: !!args.all })).report,
  },
  {
    name: "stack_status",
    description: "Summary of configured stacks from router.json. Read-only.",
    inputSchema: { type: "object", properties: {} },
    handler: () => stackStatus({ cwd: process.cwd() }),
  },
  {
    name: "gate_check",
    description:
      "Security gate: scan a brain home for credential-like files and secrets in skills. Read-only.",
    inputSchema: {
      type: "object",
      properties: { home: { type: "string", description: "Brain home to scan (default system brain)." } },
    },
    handler: (args) => gateCheck(args.home || systemBrainHome()),
  },
  {
    name: "adapter_status",
    description: "Where cto-brain skills are wired (Claude Code / Cursor / Codex / ...). Read-only.",
    inputSchema: {
      type: "object",
      properties: { adapters: { type: "string", description: "Comma-separated adapter ids to limit to." } },
    },
    handler: (args) => adapterStatus({ cwd: process.cwd(), adapters: args.adapters }),
  },
  {
    name: "round_close",
    description:
      "WRITE: append a round entry to the growth ledger and optionally scaffold a feedback file. Mutates project + system memory.",
    inputSchema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "Round tag." },
        summary: { type: "string", description: "One-line action summary." },
        lesson: { type: "string", description: "Lesson learned, or omit for no-op." },
        feedback: { type: "string", description: "Feedback topic to scaffold (kebab)." },
      },
      required: ["tag", "summary"],
    },
    handler: (args) =>
      roundClose({
        cwd: process.cwd(),
        tag: sanitizeLedgerField(args.tag),
        summary: sanitizeLedgerField(args.summary),
        lesson: sanitizeLedgerField(args.lesson),
        feedbackTopic: args.feedback,
      }),
  },
];

const TOOL_INDEX = new Map(TOOLS.map((t) => [t.name, t]));

export function listTools() {
  return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

// Dispatch a tool by name, returning its raw data. Throws on unknown tool.
// Transport/formatting and (later) telemetry wrap around this.
export async function callTool(name, args = {}) {
  const tool = TOOL_INDEX.get(name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  return await tool.handler(args || {});
}
