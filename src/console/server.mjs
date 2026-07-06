// cto-brain console — HTTP server (read-only).
//
// Security posture (same as the MCP HTTP transport):
//   - Binds 127.0.0.1 by default (loopback-only); a non-loopback host is an
//     explicit operator opt-in.
//   - Origin allowlist blocks DNS-rebinding: no-Origin (curl/native) is allowed;
//     a disallowed cross-origin browser request gets 403.
//   - ONLY GET, and only on the four read routes. Any other method/path → 404/405.
//     No route mutates brain state — the console cannot write config, memory,
//     telemetry, or adapters.
// stdlib http only; no framework, no new dependency.

import http from "node:http";
import { buildState } from "./state.mjs";
import { renderHtml, renderCards } from "./render.mjs";

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);

function originAllowed(origin, allowedOrigins) {
  if (!origin) return true; // native client / curl over loopback
  return allowedOrigins.includes(origin);
}

/**
 * Create (but do not start) the console server.
 * @param {object} opts { host, port, allowOrigin: string[], stateOpts }
 */
export function createConsoleServer(opts = {}) {
  const allowedOrigins = opts.allowOrigin || [];
  const stateOpts = opts.stateOpts || {};

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!originAllowed(origin, allowedOrigins)) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden origin");
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405, { "content-type": "text/plain", allow: "GET" });
      res.end("read-only: GET only");
      return;
    }
    const url = new URL(req.url, "http://localhost");
    const prefer = url.searchParams.get("prefer") || stateOpts.prefer;

    try {
      if (url.pathname === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (url.pathname === "/api/state") {
        const state = await buildState({ ...stateOpts, prefer });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(state));
        return;
      }
      if (url.pathname === "/api/cards") {
        const state = await buildState({ ...stateOpts, prefer });
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(renderCards(state));
        return;
      }
      if (url.pathname === "/") {
        const state = await buildState({ ...stateOpts, prefer });
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(renderHtml(state));
        return;
      }
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(e && e.message ? e.message : e) }));
    }
  });

  return server;
}

/**
 * Start the console server. Resolves with { server, host, port, url }.
 */
export function startConsole(opts = {}) {
  const host = opts.host || "127.0.0.1";
  const port = Number(opts.port) || 7799;
  if (!LOOPBACK.has(host) && (!opts.allowOrigin || opts.allowOrigin.length === 0)) {
    // Off-loopback bind with no Origin allowlist is a footgun; warn loudly.
    console.error(`cto-brain console: binding non-loopback host ${host} with NO --allow-origin — browsers on the network can reach it. Prefer 127.0.0.1 or a tailscale-serve front.`);
  }
  const server = createConsoleServer(opts);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const url = `http://${LOOPBACK.has(host) ? "127.0.0.1" : host}:${port}/`;
      resolve({ server, host, port, url });
    });
  });
}
