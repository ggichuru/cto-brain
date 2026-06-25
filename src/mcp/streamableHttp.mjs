// cto-brain MCP server (Streamable-HTTP transport).
//
// Lets the brain run as a remote service alongside stdio, exposing the SAME
// tool registry over HTTP. All tool logic still lives in ./tools.mjs via the
// shared createServer() — this file is transport wiring + security only.
//
// Security posture (load-bearing):
//   - Binds to 127.0.0.1 by default (loopback-only) to keep the brain off the
//     network unless the operator opts in.
//   - Validates the Origin header against an allowlist to block DNS-rebinding
//     attacks: a no-Origin request (a real local CLI/SDK client) is allowed,
//     but a disallowed cross-origin browser request is rejected with HTTP 403.
//   - Logs to stderr only and never logs request headers, bodies, or secrets.

import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.mjs";

const MCP_PATH = "/mcp";

// Allow a request through when:
//   - it carries no Origin header (native MCP clients / curl / SDK over loopback), or
//   - its Origin is in the operator-provided allowlist.
// Anything else is a cross-origin browser request we refuse (DNS-rebinding guard).
function originAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

/**
 * Build (but do NOT listen on) an HTTP server that speaks MCP Streamable-HTTP.
 *
 * @param {object} [opts]
 * @param {number} [opts.port=3737]        Port to bind (caller calls listen()).
 * @param {string} [opts.host="127.0.0.1"] Interface to bind — loopback by default.
 * @param {string[]} [opts.allowedOrigins] Origin allowlist for DNS-rebinding protection.
 * @returns {Promise<{ server: import("node:http").Server, url: string, close: () => Promise<void> }>}
 */
export async function createStreamableHttpServer({
  port = 3737,
  host = "127.0.0.1",
  allowedOrigins = [],
} = {}) {
  const brain = createServer();

  // Stateful transport: a single sessionId-keyed transport handles all sessions,
  // so we can connect it once and reuse it across requests.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await brain.connect(transport);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || host}`);
      if (url.pathname !== MCP_PATH) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "not found" }));
        return;
      }

      // DNS-rebinding guard: reject disallowed cross-origin requests before the
      // protocol layer ever sees them.
      if (!originAllowed(req.headers.origin, allowedOrigins)) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "origin not allowed" }));
        return;
      }

      if (req.method === "POST" || req.method === "GET" || req.method === "DELETE") {
        await transport.handleRequest(req, res);
        return;
      }

      res.writeHead(405, { "content-type": "application/json", allow: "GET, POST, DELETE" });
      res.end(JSON.stringify({ error: "method not allowed" }));
    } catch (err) {
      // Never leak headers/bodies — only the error message, on stderr.
      process.stderr.write(`cto-brain MCP http error: ${err && err.message ? err.message : err}\n`);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "internal error" }));
      } else {
        res.end();
      }
    }
  });

  const url = `http://${host}:${port}${MCP_PATH}`;

  async function close() {
    await transport.close().catch(() => {});
    await new Promise((resolve) => server.close(() => resolve()));
  }

  return { server, url, close };
}

// Create the HTTP server AND listen. Logs the bound URL to stderr. Used by
// `cto-brain mcp --transport=http`.
export async function startHttpServer({ port = 3737, host = "127.0.0.1", allowedOrigins = [] } = {}) {
  const { server, url } = await createStreamableHttpServer({ port, host, allowedOrigins });
  await new Promise((resolve) => server.listen(port, host, resolve));
  const actual = server.address();
  const boundUrl = actual && typeof actual === "object" ? `http://${host}:${actual.port}${MCP_PATH}` : url;
  process.stderr.write(`cto-brain MCP server running on ${boundUrl}\n`);
  if (!allowedOrigins.length) {
    process.stderr.write("  (loopback-only; pass --allow-origin to permit a browser origin)\n");
  }
  return server;
}
