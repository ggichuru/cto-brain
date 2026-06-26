import net from "node:net";
import { getProvider, resolveBaseUrl, apiKeyEnvName, hasApiKey } from "./providers.mjs";

const DEFAULT_TIMEOUT_MS = 2000;

async function fetchJson(url, timeoutMs = DEFAULT_TIMEOUT_MS, headers = undefined) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      ...(headers ? { headers } : {}),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, json: null };
  }
}

export async function tcpReachable(host, port, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    const done = (v) => {
      socket.destroy();
      resolve(v);
    };
    socket.on("connect", () => done(true));
    socket.on("error", () => done(false));
    socket.on("timeout", () => done(false));
  });
}

export async function probeProvider(preset, opts = {}) {
  const env = opts.env || process.env;
  const baseUrl = opts.url || resolveBaseUrl(preset, env);
  const result = {
    id: preset.id,
    label: preset.label,
    tier: preset.tier,
    baseUrl,
    reachable: false,
    degraded: false,
    status: "down",
    reason: "",
    models: [],
    honest: true,
  };

  if (preset.stub) {
    result.status = "stub";
    result.reason = preset.stubReason || "Platform stub — not probeable from cto-brain.";
    return result;
  }

  if (preset.keyRequired && !hasApiKey(preset, env)) {
    result.status = "down";
    result.reason = `No API key (${apiKeyEnvName(preset)}) — configure BYOC or pick a local runtime.`;
    return result;
  }

  if (!baseUrl) {
    result.reason = "No base URL configured.";
    return result;
  }

  let u;
  try {
    u = new URL(baseUrl);
  } catch {
    result.reason = `Invalid base URL: ${baseUrl}`;
    return result;
  }

  if (preset.probePath) {
    const probeUrl = `${baseUrl.replace(/\/+$/, "")}${preset.probePath}`;
    const headers = bearerHeaders(preset, env);
    const r = await fetchJson(probeUrl, opts.timeoutMs, headers);
    if (r.ok) {
      result.reachable = true;
      result.status = "reachable";
      result.reason = `HTTP ${r.status} on ${preset.probePath}`;
      result.models = extractModels(preset, r.json);
      return result;
    }
    result.degraded = r.status > 0;
    result.reason = r.error || `HTTP ${r.status || "fail"} on ${preset.probePath}`;
    if (result.degraded) result.status = "degraded";
    return result;
  }

  const port = u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
  const tcp = await tcpReachable(u.hostname, port, opts.timeoutMs);
  if (tcp) {
    result.reachable = true;
    result.status = "reachable";
    result.reason = `TCP reachable on ${u.hostname}:${port}`;
  } else {
    result.reason = `TCP unreachable on ${u.hostname}:${port}`;
  }
  return result;
}

/**
 * Build auth headers for a probe. Key-required openAI-compatible presets
 * (e.g. jarvis) send `Authorization: Bearer <key>` from their key env. Returns
 * undefined when no key is available so loopback/local probes stay unchanged.
 */
function bearerHeaders(preset, env) {
  if (!preset || !preset.keyRequired) return undefined;
  const keyEnv = apiKeyEnvName(preset);
  const key = keyEnv ? env[keyEnv] : null;
  const alt = !key ? (preset.altEnvKeys || []).map((k) => env[k]).find(Boolean) : null;
  const token = key || alt;
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
}

function extractModels(preset, json) {
  if (!json) return [];
  if (preset.id === "ollama" && Array.isArray(json.models)) {
    return json.models.map((m) => m.name || m.model).filter(Boolean);
  }
  if (json.data && Array.isArray(json.data)) {
    return json.data.map((m) => m.id || m.name).filter(Boolean);
  }
  if (Array.isArray(json.models)) {
    return json.models.map((m) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
  }
  return [];
}

export async function probeAll(presets, opts = {}) {
  const results = [];
  for (const p of presets) {
    results.push(await probeProvider(p, opts));
  }
  return results;
}

export async function probeStack(stack, opts = {}) {
  const type = stack.type || "generic";
  const url = stack.url;
  if (!url) {
    return { id: stack.id, url, status: "down", reachable: false, reason: "missing url" };
  }

  if (type === "desk") {
    const r = await fetchJson(`${url.replace(/\/+$/, "")}/health`, opts.timeoutMs);
    return {
      id: stack.id,
      url,
      type,
      reachable: r.ok,
      status: r.ok ? "reachable" : r.status ? "degraded" : "down",
      reason: r.ok ? "Desk engine /health OK" : r.error || `HTTP ${r.status}`,
      payload: r.json,
    };
  }

  if (type === "ollama") {
    const preset = getProvider("ollama");
    return { ...(await probeProvider(preset, { ...opts, url })), id: stack.id, type };
  }

  if (type === "vllm" || type === "openai-compatible") {
    const preset = getProvider(type === "vllm" ? "vllm" : "openai-compatible");
    return { ...(await probeProvider(preset, { ...opts, url })), id: stack.id, type };
  }

  const r = await fetchJson(`${url.replace(/\/+$/, "")}/health`, opts.timeoutMs);
  if (r.ok) {
    return { id: stack.id, url, type, reachable: true, status: "reachable", reason: "/health OK" };
  }
  try {
    const u = new URL(url);
    const port = u.port ? Number(u.port) : 80;
    const tcp = await tcpReachable(u.hostname, port, opts.timeoutMs);
    return {
      id: stack.id,
      url,
      type,
      reachable: tcp,
      status: tcp ? "reachable" : "down",
      reason: tcp ? "TCP open" : "unreachable",
    };
  } catch (err) {
    return { id: stack.id, url, type, reachable: false, status: "down", reason: err.message };
  }
}
