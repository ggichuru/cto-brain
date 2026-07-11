import fs from "node:fs";
import path from "node:path";
import { ensureDir, systemBrainHome } from "../paths.mjs";

/**
 * Tool-conformance ledger.
 *
 * Tool-calling reliability is a per-model-family parser pairing that must be
 * PROBED, not guessed: some models return real `tool_calls` arrays, others
 * print the call as text (verified on this box: qwen2.5:7b-instruct →
 * structured; qwen2.5-coder:14b → text). Verdicts persist to
 * ~/.cto-brain/conformance.json and override the toolCapable() heuristic —
 * a routing belief only changes behavior by recorded evidence.
 */

export const VERDICTS = ["structured", "text-embedded", "none", "error"];

/** Does this content look like a tool call the model printed as prose? */
function looksLikeToolCallText(text) {
  const t = String(text || "");
  if (!t) return false;
  if (/<\/?(tool_call|function_call|tool)>/i.test(t)) return true;
  // JSON-call printed in content: an object naming a function + its args
  return /["']name["']\s*:/.test(t) && /["'](arguments|parameters)["']\s*:/.test(t);
}

/** Pull the assistant message out of a reply body for the given wire. */
function extractMessage(body, wire) {
  if (wire === "ollama") return body.message && typeof body.message === "object" ? body.message : null;
  const choice = Array.isArray(body.choices) ? body.choices[0] : null;
  return choice && choice.message && typeof choice.message === "object" ? choice.message : null;
}

/**
 * Classify one chat reply into a tool-conformance verdict. Pure — no network.
 *
 * @param {object|string} body  parsed reply body (or raw text, best-effort parsed)
 * @param {"openai"|"ollama"} [wire]  wire shape; auto-detected when omitted
 * @returns {"structured"|"text-embedded"|"none"|"error"}
 *   structured     — a real tool_calls array (the model can drive an agentic loop)
 *   text-embedded  — tool-call-shaped text printed in content (looks capable, isn't)
 *   none           — plain prose, no tool attempt
 *   error          — error body / unrecognized shape / garbage
 */
export function classifyToolReply(body, wire) {
  let b = body;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      return "error";
    }
  }
  if (!b || typeof b !== "object" || b.error) return "error";

  const w = wire || (Array.isArray(b.choices) ? "openai" : b.message ? "ollama" : null);
  if (!w) return "error";

  const msg = extractMessage(b, w);
  if (!msg) return "error";

  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) return "structured";
  const content = typeof msg.content === "string" ? msg.content : "";
  if (looksLikeToolCallText(content)) return "text-embedded";
  return "none";
}

// ── ledger ────────────────────────────────────────────────────────────────────

export function conformancePath(home = systemBrainHome()) {
  return path.join(home, "conformance.json");
}

function validRow(r) {
  return r && typeof r === "object" && typeof r.model === "string" && VERDICTS.includes(r.verdict);
}

/**
 * Load verdict rows {provider, model, verdict, probedAt} from the ledger.
 * Absent or corrupt file degrades to [] — fail-open to the heuristic, never a
 * crash: a broken ledger must not take routing down.
 */
export function loadVerdicts(home = systemBrainHome()) {
  try {
    const rows = JSON.parse(fs.readFileSync(conformancePath(home), "utf8"));
    return Array.isArray(rows) ? rows.filter(validRow) : [];
  } catch {
    return [];
  }
}

/** Persist verdict rows. Returns the ledger path. */
export function saveVerdicts(rows, home = systemBrainHome()) {
  ensureDir(home);
  const p = conformancePath(home);
  fs.writeFileSync(p, JSON.stringify(rows || [], null, 2) + "\n", "utf8");
  return p;
}

/** Rows → { [modelId]: verdict } for toolCapable(). Later rows win. */
export function toVerdictMap(rows) {
  const map = {};
  for (const r of rows || []) {
    if (validRow(r)) map[r.model] = r.verdict;
  }
  return map;
}

// ── probe ─────────────────────────────────────────────────────────────────────

// One canonical single-tool request — the minimum a model must answer with a
// structured call to be trusted with an agentic loop.
const CANONICAL_TOOL = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather for a city.",
    parameters: {
      type: "object",
      properties: { city: { type: "string", description: "City name" } },
      required: ["city"],
    },
  },
};
const CANONICAL_MESSAGES = [{ role: "user", content: "What is the weather in Nairobi? Use the get_weather tool." }];

/**
 * Probe one model's tool conformance with a single live call (env-gated by
 * callers — never runs in offline tests). Provider-agnostic: any
 * OpenAI-compatible /v1/chat/completions or Ollama-native /api/chat.
 *
 * @returns {Promise<{provider:string, model:string, wire:string, verdict:string, probedAt:string}>}
 */
export async function probeToolConformance(baseUrl, model, wire = "openai", opts = {}) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const url = wire === "ollama" ? `${base}/api/chat` : `${base}/v1/chat/completions`;
  const payload = {
    model,
    messages: CANONICAL_MESSAGES,
    tools: [CANONICAL_TOOL],
    ...(wire === "ollama" ? { stream: false } : {}),
  };
  const headers = {
    "content-type": "application/json",
    ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
  };

  let verdict = "error";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(opts.timeoutMs || 120000),
    });
    const text = await res.text();
    verdict = res.ok ? classifyToolReply(text, wire) : "error";
  } catch {
    verdict = "error";
  }

  return {
    provider: opts.provider || wire,
    model,
    wire,
    verdict,
    probedAt: new Date().toISOString(),
  };
}
