// cto-brain chat — the Secure-Brain chat server. A zero-dependency, doc-grounded
// chat any user can point at their own project and their own models.
//
// Three gates, all fail-closed:
//   Gate 1 (transport) — binds 127.0.0.1 by default; expose to a tailnet only by
//                        explicit host. Origin/Host checked against loopback to
//                        block DNS-rebinding from a browser.
//   Gate 2 (API token) — every /api/* call needs the token (X-CTO-Token header or
//                        ?token=). No token → 401. Pages load so you can enter it.
//   Gate 3 (scope ACL) — the chat grounds ONLY on configured scopes, reading ONLY
//                        docs, secret-screened on path AND content, bounded. See
//                        grounding.mjs. A doc that looks secret is skipped whole.
//
// The provider API key lives server-side only (read from env), forwarded upstream
// as a header, NEVER returned to the browser or baked into a page.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { timingSafeEqual } from "node:crypto";

import { buildGrounding } from "./grounding.mjs";
import { systemPromptFor } from "./persona.mjs";
import { resolveChatProvider, buildUpstreamRequest } from "./provider.mjs";
import { ollamaLineToSSE } from "../gateway/bridge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Gate 1 helpers (DNS-rebinding guard) ────────────────────────────────────
function isLoopbackHost(h) {
  return h === "127.0.0.1" || h === "localhost" || h === "::1" || h === "[::1]";
}
function originAllowed(req) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (!isLoopbackHost(new URL(origin).hostname)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

// ── Gate 2 helper (constant-time token check) ───────────────────────────────
function tokenOk(provided, token) {
  if (typeof provided !== "string" || provided.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(token));
  } catch {
    return false;
  }
}

// ── HTTP plumbing ───────────────────────────────────────────────────────────
function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}
function sendJson(res, status, obj) {
  send(res, status, "application/json", JSON.stringify(obj));
}
async function readBody(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function sseDelta(res, text) {
  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
}

// Bounded grounding cache: live scopes are rebuilt per boot, cached per process.
function makeGroundingCache() {
  const cache = new Map();
  return async (scope) => {
    if (cache.has(scope.id)) return cache.get(scope.id);
    const g = await buildGrounding(scope);
    cache.set(scope.id, g);
    return g;
  };
}

// ── The chat handler (SSE, OpenAI-shaped deltas out) ────────────────────────
async function handleChat(req, res, ctx) {
  const { scopesById, defaultScopeId, provider, groundingFor } = ctx;

  let resolved;
  try {
    resolved = resolveChatProvider(provider, process.env);
  } catch (err) {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
    sseDelta(res, `Provider misconfigured: ${err.message}`);
    res.write("data: [DONE]\n\n");
    return void res.end();
  }
  if (resolved.keyRequired && !resolved.hasKey) {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
    sseDelta(res, `Server is missing inference credentials (set ${resolved.apiKeyEnv} in the server's environment).`);
    res.write("data: [DONE]\n\n");
    return void res.end();
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return void sendJson(res, 400, { error: "malformed request body" });
  }

  const incoming = Array.isArray(payload.messages) ? payload.messages : [];
  const scope = scopesById.get(payload.scope) || scopesById.get(payload.project) || scopesById.get(defaultScopeId);
  const model = resolved.models.some((m) => m.id === payload.model) ? payload.model : resolved.model;

  let grounding;
  try {
    grounding = await groundingFor(scope);
  } catch {
    grounding = "";
  }

  const cleaned = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20_000) }));
  const messages = [{ role: "system", content: systemPromptFor(scope, grounding) }, ...cleaned];

  const { url, headers, body } = buildUpstreamRequest(resolved, { model, messages, stream: true });

  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });

  let upstream;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    });
  } catch (err) {
    sseDelta(res, `Could not reach the model at ${resolved.baseUrl} (${err.code || err.message}).`);
    res.write("data: [DONE]\n\n");
    return void res.end();
  }
  if (!upstream.ok) {
    let detail = "";
    try {
      detail = (await upstream.text()).slice(0, 300).replace(/sk-[A-Za-z0-9-]+/g, "sk-***");
    } catch {
      /* ignore */
    }
    sseDelta(res, `The model endpoint returned ${upstream.status} (${upstream.statusText}). ${detail}`);
    res.write("data: [DONE]\n\n");
    return void res.end();
  }

  try {
    if (resolved.wire === "openai") {
      // Already OpenAI SSE — pass the frames straight through.
      for await (const chunk of upstream.body) res.write(chunk);
    } else if (resolved.wire === "ollama") {
      await pumpOllama(upstream, res, model);
    } else {
      await pumpAnthropic(upstream, res);
    }
  } catch (err) {
    sseDelta(res, `\n\n[stream interrupted: ${err.message}]`);
  }
  if (resolved.wire !== "openai") res.write("data: [DONE]\n\n");
  res.end();
}

// Ollama ND-JSON → OpenAI SSE (reuses the tested gateway translator).
async function pumpOllama(upstream, res, model) {
  const meta = { id: `chatcmpl-${Date.now()}`, created: Math.floor(Date.now() / 1000), model };
  let buffer = "";
  for await (const chunk of upstream.body) {
    buffer += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        res.write(ollamaLineToSSE(JSON.parse(line), meta));
      } catch {
        /* skip partial */
      }
    }
  }
}

// Anthropic SSE → OpenAI-shaped content deltas (text only).
async function pumpAnthropic(upstream, res) {
  let buffer = "";
  for await (const chunk of upstream.body) {
    buffer += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const evt = JSON.parse(data);
        const text = evt?.delta?.text;
        if (typeof text === "string" && text.length) sseDelta(res, text);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Start the chat server.
 * @param {object} cfg - the loaded config from loadChatConfig()
 * @returns {Promise<{server, url, token, host, port, close}>}
 */
export async function startChatServer(cfg) {
  const host = cfg.auth.host;
  const port = Number(cfg.auth.port);
  const token = cfg.auth.token;
  const provider = cfg.provider;

  const scopesById = new Map(cfg.scopes.map((s) => [s.id, s]));
  const defaultScopeId = cfg.scopes[0].id;
  const groundingFor = makeGroundingCache();
  const ctx = { scopesById, defaultScopeId, provider, groundingFor };

  let indexHtml;
  try {
    indexHtml = await readFile(join(__dirname, "index.html"), "utf8");
  } catch {
    indexHtml = "<!doctype html><title>cto-brain chat</title><p>index.html missing.</p>";
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${host}:${port}`);
      const p = url.pathname;

      if (!originAllowed(req)) return void sendJson(res, 403, { error: "origin not allowed" });

      // Public page — loads so the operator can paste the token; APIs stay gated.
      if (req.method === "GET" && (p === "/" || p === "/index.html")) {
        return void send(res, 200, "text/html; charset=utf-8", indexHtml);
      }

      if (p.startsWith("/api/")) {
        // Gate 2: token on every API call. Fail closed.
        const provided = req.headers["x-cto-token"] || url.searchParams.get("token");
        if (!tokenOk(provided, token)) return void sendJson(res, 401, { error: "unauthorized" });

        if (req.method === "GET" && p === "/api/models") {
          const resolved = safeResolve(provider);
          return void sendJson(res, 200, {
            models: resolved.models,
            default: resolved.model,
            provider: { id: resolved.id, tier: resolved.tier, baseUrl: resolved.baseUrl },
          });
        }
        if (req.method === "GET" && p === "/api/projects") {
          return void sendJson(res, 200, {
            projects: cfg.scopes.map((s) => ({ id: s.id, label: s.label, live: !!s.root })),
            default: defaultScopeId,
          });
        }
        if (req.method === "POST" && p === "/api/chat") return void handleChat(req, res, ctx);
      }

      sendJson(res, 404, { error: "not found" });
    } catch (err) {
      process.stderr.write(`cto-brain chat error: ${err && err.message ? err.message : err}\n`);
      if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
      else try { res.end(); } catch { /* ignore */ }
    }
  });

  await new Promise((resolve) => server.listen(port, host, resolve));
  const addr = server.address();
  const boundPort = addr && typeof addr === "object" ? addr.port : port;

  async function close() {
    await new Promise((resolve) => server.close(() => resolve()));
  }
  return { server, url: `http://${host}:${boundPort}`, token, host, port: boundPort, close };
}

// Resolve without throwing — /api/models must not 500 on a bad key/base.
function safeResolve(provider) {
  try {
    const r = resolveChatProvider(provider, process.env);
    return { id: r.id, tier: r.tier, baseUrl: r.baseUrl, model: r.model, models: r.models };
  } catch (err) {
    return { id: provider.id || "unknown", tier: "unknown", baseUrl: "", model: "", models: [], error: err.message };
  }
}
