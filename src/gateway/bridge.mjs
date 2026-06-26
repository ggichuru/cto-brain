// cto-brain gateway — local OpenAI→Ollama bridge for jarvis.mkulyma.com.
//
// jarvis (Open WebUI fronting local Ollama) exposes an OpenAI-shaped model
// catalog (`GET /api/models`) and a WORKING completion surface only on the
// native Ollama API (`POST /ollama/api/chat`). Its documented OpenAI endpoint
// (`POST /api/chat/completions`) is broken server-side for API-key calls, and
// `/openai/v1/*` / `/ollama/v1/*` are 403 (not in the key allowlist). See
// docs/integrations/jarvis-code-terminal.md (frozen contract).
//
// This server speaks the OpenAI wire on loopback so OpenAI-compatible clients
// (codex, SDKs) can talk to jarvis, translating OpenAI⇄Ollama on the way.
//
// Security posture (modeled on src/mcp/streamableHttp.mjs):
//   - Binds 127.0.0.1 by default (loopback-only).
//   - Validates Origin/Host against a loopback allowlist to block DNS-rebinding:
//     a no-Origin request (real local CLI/SDK) is allowed; a disallowed
//     cross-origin browser request is rejected 403.
//   - Logs to stderr only; never logs headers, bodies, or the API key.
//   - The API key is read from env and only ever forwarded upstream as a Bearer
//     header — never written to a file or echoed back to the client.

import http from "node:http";
import { randomUUID } from "node:crypto";

const DEFAULT_PORT = 11475;
const DEFAULT_JARVIS_BASE = "https://jarvis.mkulyma.com";

// ── Pure translation helpers (unit-tested) ──────────────────────────────────

// jarvis /api/models → OpenAI list. Catalog is already OpenAI-ish
// ({data:[{id,name,owned_by}]}); we normalize to {id, object:"model", owned_by}.
export function openAIModelsFromJarvis(data) {
  const arr = Array.isArray(data) ? data : [];
  return arr
    .map((m) => {
      if (!m) return null;
      const id = m.id || m.name;
      if (!id) return null;
      return { id, object: "model", owned_by: m.owned_by || "jarvis" };
    })
    .filter(Boolean);
}

// Ollama non-stream chat object → OpenAI chat.completion.
// Ollama shape: {message:{role,content,tool_calls?}, done:true,
//   prompt_eval_count?, eval_count?, model?, ...}
export function ollamaToOpenAIChat(obj, model) {
  const o = obj || {};
  const msg = o.message || {};
  const message = {
    role: msg.role || "assistant",
    content: typeof msg.content === "string" ? msg.content : msg.content ?? "",
  };
  // best-effort / unverified: pass ollama tool_calls back in OpenAI shape.
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
    message.tool_calls = ollamaToolCallsToOpenAI(msg.tool_calls);
  }
  const promptTokens = num(o.prompt_eval_count);
  const completionTokens = num(o.eval_count);
  return {
    id: `chatcmpl-${randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: o.model || model || "unknown",
    choices: [
      {
        index: 0,
        message,
        finish_reason: message.tool_calls ? "tool_calls" : "stop",
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

// best-effort / UNVERIFIED stub: map ollama message.tool_calls to OpenAI.
// Ollama emits {function:{name, arguments:{...}}}; OpenAI wants
// {id, type:"function", function:{name, arguments:"<json-string>"}}.
export function ollamaToolCallsToOpenAI(toolCalls) {
  const arr = Array.isArray(toolCalls) ? toolCalls : [];
  return arr.map((tc, i) => {
    const fn = (tc && tc.function) || {};
    let args = fn.arguments;
    if (typeof args !== "string") {
      try {
        args = JSON.stringify(args ?? {});
      } catch {
        args = "{}";
      }
    }
    return {
      id: (tc && tc.id) || `call_${i}_${randomUUID().slice(0, 8)}`,
      type: "function",
      index: i,
      function: { name: fn.name || "", arguments: args },
    };
  });
}

// One ollama ND-JSON stream object → one OpenAI SSE chunk frame (string),
// already terminated with the blank line. `obj` is the parsed ollama line.
//   - non-final: delta.content = chunk text, finish_reason null.
//   - final (done:true): empty delta, finish_reason "stop" (or "tool_calls").
export function ollamaLineToSSE(obj, { id, created, model } = {}) {
  const o = obj || {};
  const done = o.done === true;
  const msg = o.message || {};
  const delta = {};
  let finish = null;

  if (done) {
    finish = "stop";
  } else {
    if (msg.role) delta.role = msg.role;
    if (typeof msg.content === "string" && msg.content.length) delta.content = msg.content;
    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      delta.tool_calls = ollamaToolCallsToOpenAI(msg.tool_calls);
      finish = null;
    }
  }

  const chunk = {
    id: id || `chatcmpl-${randomUUID()}`,
    object: "chat.completion.chunk",
    created: created || Math.floor(Date.now() / 1000),
    model: o.model || model || "unknown",
    choices: [{ index: 0, delta, finish_reason: finish }],
  };
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

function num(v) {
  return Number.isFinite(v) ? v : 0;
}

// Build the upstream ollama /api/chat body from an OpenAI chat-completions body.
function ollamaBodyFromOpenAI(body, stream) {
  const out = {
    model: body.model,
    messages: Array.isArray(body.messages) ? body.messages : [],
    stream: !!stream,
  };
  const options = {};
  if (body.temperature != null) options.temperature = body.temperature;
  if (body.top_p != null) options.top_p = body.top_p;
  if (body.max_tokens != null) options.num_predict = body.max_tokens;
  if (Object.keys(options).length) out.options = options;
  // best-effort / unverified: pass an OpenAI tools array straight through.
  if (Array.isArray(body.tools) && body.tools.length) out.tools = body.tools;
  if (body.tool_choice != null) out.tool_choice = body.tool_choice;
  return out;
}

// ── HTTP plumbing ───────────────────────────────────────────────────────────

// Allow when: no Origin (native client/curl/SDK) OR Origin host is loopback.
// Also guard the Host header (DNS-rebinding: reject a non-loopback Host).
function requestAllowed(req, host) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const h = new URL(origin).hostname;
      if (!isLoopbackHost(h)) return false;
    } catch {
      return false;
    }
  }
  const hostHeader = req.headers.host;
  if (hostHeader) {
    const hn = hostHeader.split(":")[0];
    if (!isLoopbackHost(hn)) return false;
  }
  return true;
}

function isLoopbackHost(h) {
  return h === "127.0.0.1" || h === "localhost" || h === "::1" || h === "[::1]";
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(body);
}

async function readBody(req, maxBytes = 16 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * Build and start the OpenAI→Ollama bridge on loopback.
 *
 * @param {object} [opts]
 * @param {number} [opts.port]      Defaults to CTO_GATEWAY_PORT or 11475.
 * @param {string} [opts.host]      Defaults to 127.0.0.1.
 * @param {string} [opts.jarvisBase] Upstream base, default JARVIS_BASE_URL or jarvis.mkulyma.com.
 * @param {string} [opts.apiKey]    Bearer key, default process.env.JARVIS_API_KEY.
 * @param {AbortSignal} [opts.signal] Optional abort signal to close the server.
 * @returns {Promise<{server: import("node:http").Server, url: string, port: number, close: () => Promise<void>}>}
 */
export async function startGateway(opts = {}) {
  const host = opts.host || "127.0.0.1";
  const port = Number(opts.port || process.env.CTO_GATEWAY_PORT || DEFAULT_PORT);
  const jarvisBase = (opts.jarvisBase || process.env.JARVIS_BASE_URL || DEFAULT_JARVIS_BASE).replace(/\/+$/, "");
  const apiKey = opts.apiKey !== undefined ? opts.apiKey : process.env.JARVIS_API_KEY;

  const authHeaders = () => {
    const h = { "content-type": "application/json" };
    if (apiKey) h.authorization = `Bearer ${apiKey}`;
    return h;
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || host}`);
      const pathName = url.pathname;

      if (!requestAllowed(req, host)) {
        sendJson(res, 403, { error: "origin/host not allowed" });
        return;
      }

      // Health — always available, never needs the key.
      if (pathName === "/healthz" && req.method === "GET") {
        sendJson(res, 200, { ok: true, jarvisBase, hasKey: !!apiKey });
        return;
      }

      // Everything under /v1 needs the key.
      if (pathName.startsWith("/v1/")) {
        if (!apiKey) {
          sendJson(res, 503, { error: "JARVIS_API_KEY not set" });
          return;
        }

        if (pathName === "/v1/models" && req.method === "GET") {
          await handleModels(res, jarvisBase, authHeaders);
          return;
        }

        if (pathName === "/v1/chat/completions" && req.method === "POST") {
          await handleChat(req, res, jarvisBase, authHeaders);
          return;
        }
      }

      sendJson(res, 404, { error: "not found" });
    } catch (err) {
      process.stderr.write(`cto-brain gateway error: ${err && err.message ? err.message : err}\n`);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "internal error" });
      } else {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
    }
  });

  await new Promise((resolve) => server.listen(port, host, resolve));
  const addr = server.address();
  const boundPort = addr && typeof addr === "object" ? addr.port : port;
  const url = `http://${host}:${boundPort}/v1`;

  async function close() {
    await new Promise((resolve) => server.close(() => resolve()));
  }

  if (opts.signal) {
    if (opts.signal.aborted) await close();
    else opts.signal.addEventListener("abort", () => close(), { once: true });
  }

  return { server, url, port: boundPort, close };
}

async function handleModels(res, jarvisBase, authHeaders) {
  let upstream;
  try {
    upstream = await fetch(`${jarvisBase}/api/models`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    sendJson(res, 502, { error: { message: `upstream models fetch failed: ${err.message}`, type: "upstream_error" } });
    return;
  }
  const text = await upstream.text();
  if (!upstream.ok) {
    sendJson(res, 502, { error: { message: `upstream /api/models ${upstream.status}`, type: "upstream_error" } });
    return;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    sendJson(res, 502, { error: { message: "upstream returned non-JSON model list", type: "upstream_error" } });
    return;
  }
  sendJson(res, 200, { object: "list", data: openAIModelsFromJarvis(json && json.data) });
}

async function handleChat(req, res, jarvisBase, authHeaders) {
  const raw = await readBody(req);
  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    sendJson(res, 400, { error: { message: "invalid JSON body", type: "invalid_request_error" } });
    return;
  }
  if (!body.model) {
    sendJson(res, 400, { error: { message: "'model' is required", type: "invalid_request_error" } });
    return;
  }

  const wantStream = body.stream === true;
  const ollamaBody = ollamaBodyFromOpenAI(body, wantStream);

  let upstream;
  try {
    upstream = await fetch(`${jarvisBase}/ollama/api/chat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(ollamaBody),
      signal: AbortSignal.timeout(300000),
    });
  } catch (err) {
    sendJson(res, 502, { error: { message: `upstream chat failed: ${err.message}`, type: "upstream_error" } });
    return;
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    sendJson(res, 502, {
      error: { message: `upstream /ollama/api/chat ${upstream.status}`, type: "upstream_error", detail: errText.slice(0, 500) },
    });
    return;
  }

  if (!wantStream) {
    const text = await upstream.text();
    let obj;
    try {
      obj = JSON.parse(text);
    } catch {
      sendJson(res, 502, { error: { message: "upstream returned non-JSON completion", type: "upstream_error" } });
      return;
    }
    sendJson(res, 200, ollamaToOpenAIChat(obj, body.model));
    return;
  }

  // Streaming: ollama emits newline-delimited JSON; we re-emit OpenAI SSE.
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  const id = `chatcmpl-${randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const meta = { id, created, model: body.model };

  let buffer = "";
  let sawDone = false;
  try {
    for await (const chunk of upstream.body) {
      buffer += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        let obj;
        try {
          obj = JSON.parse(line);
        } catch {
          continue; // skip partial/garbage lines
        }
        res.write(ollamaLineToSSE(obj, meta));
        if (obj && obj.done === true) sawDone = true;
      }
    }
    // Flush any trailing buffered line (no terminal newline).
    const tail = buffer.trim();
    if (tail) {
      try {
        const obj = JSON.parse(tail);
        res.write(ollamaLineToSSE(obj, meta));
        if (obj && obj.done === true) sawDone = true;
      } catch {
        /* ignore */
      }
    }
    // Guarantee a final stop chunk if upstream never sent done:true.
    if (!sawDone) {
      res.write(ollamaLineToSSE({ done: true, model: body.model }, meta));
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    process.stderr.write(`cto-brain gateway stream error: ${err && err.message ? err.message : err}\n`);
    try {
      res.write("data: [DONE]\n\n");
      res.end();
    } catch {
      /* ignore */
    }
  }
}
