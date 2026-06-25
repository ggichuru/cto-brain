// MCP Streamable-HTTP transport: real client over HTTP on an ephemeral
// loopback port. Hermetic (telemetry off, port 0). Covers the tool surface
// and the Origin (DNS-rebinding) guard.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createStreamableHttpServer } from "../src/mcp/streamableHttp.mjs";

process.env.CTO_BRAIN_NO_TELEMETRY = "1";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const { server, close } = await createStreamableHttpServer({ port: 0, allowedOrigins: ["https://allowed.test"] });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/mcp`;

try {
  // happy path: a native client (no browser Origin) connects + uses tools
  const client = new Client({ name: "http-e2e", version: "0" }, { capabilities: {} });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));
  ok("client connected over HTTP", true);

  const { tools } = await client.listTools();
  ok("listTools >= 9 over HTTP", Array.isArray(tools) && tools.length >= 9);
  ok("router_plan present", tools.some((t) => t.name === "router_plan"));

  const res = await client.callTool({ name: "router_plan", arguments: {} });
  const plan = JSON.parse(res.content[0].text);
  ok("router_plan over HTTP returns tasks", plan && plan.tasks && Object.keys(plan.tasks).length === 8);
  await client.close();

  // DNS-rebinding guard: a disallowed browser Origin is rejected pre-protocol
  const bad = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.test" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  ok("disallowed Origin -> 403", bad.status === 403);

  // allowed Origin is NOT 403 (may be 400/200 depending on session, just not forbidden)
  const good = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", origin: "https://allowed.test" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  ok("allowed Origin not forbidden", good.status !== 403);
} catch (e) {
  console.error("FAIL: http e2e threw:", e.message);
  failures++;
} finally {
  await close();
}

if (failures) { console.error("\n" + failures + " MCP-HTTP failure(s)"); process.exit(1); }
console.log("\nAll MCP-HTTP checks passed.");
