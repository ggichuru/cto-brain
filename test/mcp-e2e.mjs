// End-to-end MCP transport test: spawns the real stdio server via the SDK
// client, lists tools, and calls one over JSON-RPC. Covers server.mjs wiring
// (Server + setRequestHandler + StdioServerTransport) that the unit test skips.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.join(here, "..", "bin", "cto-brain.mjs");

const transport = new StdioClientTransport({ command: process.execPath, args: [binPath, "mcp"] });
const client = new Client({ name: "cto-brain-e2e", version: "0" }, { capabilities: {} });

try {
  await client.connect(transport);
  ok("client connected over stdio", true);

  const { tools } = await client.listTools();
  ok("listTools returns >= 7 tools", Array.isArray(tools) && tools.length >= 7);
  ok("listTools includes router_select", tools.some((t) => t.name === "router_select"));
  ok("every tool has inputSchema", tools.every((t) => t.inputSchema && t.inputSchema.type === "object"));

  const res = await client.callTool({ name: "router_plan", arguments: {} });
  ok("callTool returns content array", Array.isArray(res.content) && res.content.length > 0);
  ok("callTool content is text", res.content[0].type === "text");
  const plan = JSON.parse(res.content[0].text);
  ok("router_plan over MCP has tasks matrix", plan && plan.tasks && Object.keys(plan.tasks).length === 8);

  const err = await client.callTool({ name: "no_such_tool", arguments: {} });
  ok("unknown tool returns isError", err.isError === true);
} catch (e) {
  console.error("FAIL: e2e threw:", e.message);
  failures++;
} finally {
  await client.close().catch(() => {});
}

if (failures) { console.error("\n" + failures + " MCP e2e failure(s)"); process.exit(1); }
console.log("\nAll MCP e2e checks passed.");
