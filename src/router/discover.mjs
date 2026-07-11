import { PROVIDER_PRESETS } from "./providers.mjs";
import { probeProvider } from "./probe.mjs";

/** Common localhost defaults for already-running stacks. */
export const DISCOVERY_TARGETS = [
  { id: "ollama", port: 11434, presetId: "ollama" },
  { id: "vllm", port: 8000, presetId: "vllm" },
  { id: "llamacpp", port: 8080, presetId: "llamacpp" },
  { id: "llama-swap", port: 8080, presetId: "llama-swap" },
  { id: "lmstudio", port: 1234, presetId: "lmstudio" },
  { id: "desk-engine", port: 8787, presetId: "desk-engine" },
];

// llama-swap answers GET /running (its swap-state endpoint); bare llama.cpp
// 404s it. Same port (8080), same /v1/models shape — this is the only honest tell.
async function isLlamaSwap(url, timeoutMs = 2000) {
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/running`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function discoverLocal(opts = {}) {
  const env = opts.env || process.env;
  const host = opts.host || "127.0.0.1";
  const found = [];

  // One /running probe per URL, shared by the llamacpp and llama-swap targets —
  // a per-target probe could time out on one call and not the other, making the
  // same server claim both identities (or neither).
  const swapVerdicts = new Map();
  for (const t of DISCOVERY_TARGETS) {
    const preset = PROVIDER_PRESETS.find((p) => p.id === t.presetId);
    if (!preset) continue;
    const url = env[`${t.presetId.toUpperCase().replace(/-/g, "_")}_URL`] ||
      `http://${host}:${t.port}`;
    const r = await probeProvider(preset, { ...opts, url, env });
    if (!r.reachable) continue;
    if (t.presetId === "llamacpp" || t.presetId === "llama-swap") {
      // Both targets default to :8080; each claims the server only when the
      // /running tell matches its identity.
      if (!swapVerdicts.has(url)) swapVerdicts.set(url, await isLlamaSwap(url, opts.timeoutMs));
      if (swapVerdicts.get(url) !== (t.presetId === "llama-swap")) continue;
    }
    found.push({ ...r, discovered: true, host, port: t.port });
  }

  if (env.OLLAMA_HOST) {
    const preset = PROVIDER_PRESETS.find((p) => p.id === "ollama");
    const r = await probeProvider(preset, { ...opts, env });
    if (r.reachable && !found.some((f) => f.id === "ollama")) {
      found.push({ ...r, discovered: true, source: "OLLAMA_HOST" });
    }
  }

  if (env.DESK_ENGINE_URL || env.DESK_HOST) {
    const url = env.DESK_ENGINE_URL || `http://${env.DESK_HOST || "127.0.0.1"}:8787`;
    const preset = PROVIDER_PRESETS.find((p) => p.id === "desk-engine");
    const r = await probeProvider(preset, { ...opts, url, env });
    if (r.reachable && !found.some((f) => f.id === "desk-engine")) {
      found.push({ ...r, discovered: true, source: "env" });
    }
  }

  // jarvis sovereign gateway — remote, key-gated. Only probed when its key is
  // present; probeProvider skips gracefully (status "down", no throw) otherwise.
  if (env.JARVIS_API_KEY) {
    const preset = PROVIDER_PRESETS.find((p) => p.id === "jarvis");
    if (preset) {
      const r = await probeProvider(preset, { ...opts, env });
      if (r.reachable && !found.some((f) => f.id === "jarvis")) {
        found.push({ ...r, discovered: true, source: "JARVIS_API_KEY" });
      }
    }
  }

  return found;
}
