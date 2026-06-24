import { PROVIDER_PRESETS } from "./providers.mjs";
import { probeAll, probeStack } from "./probe.mjs";
import { discoverLocal } from "./discover.mjs";
import { loadRouterConfig } from "./config.mjs";

export async function connectStack(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const { config } = loadRouterConfig(cwd);
  const stacks = opts.stacks || config.stacks || [];
  const results = [];

  for (const stack of stacks) {
    results.push(await probeStack(stack, opts));
  }

  return {
    stacks: results,
    summary: summarizeStacks(results),
  };
}

function summarizeStacks(results) {
  const up = results.filter((r) => r.reachable).length;
  const down = results.length - up;
  return { total: results.length, reachable: up, down };
}

export async function probeConfiguredAndDiscovered(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const { config } = loadRouterConfig(cwd);
  const env = opts.env || process.env;

  const stackResults = [];
  for (const stack of config.stacks || []) {
    stackResults.push(await probeStack(stack, opts));
  }

  let providerPresets = PROVIDER_PRESETS;
  if (!opts.all) {
    providerPresets = PROVIDER_PRESETS.filter((p) => p.tier === "local" || p.id === "desk-engine");
  }

  const providerResults = await probeAll(providerPresets, { env, timeoutMs: opts.timeoutMs });

  const discovered = opts.all ? await discoverLocal({ env, host: opts.host }) : [];

  return {
    stacks: stackResults,
    providers: providerResults,
    discovered,
    configPath: loadRouterConfig(cwd).path,
  };
}

export async function buildProbeIndex(opts = {}) {
  const report = await probeConfiguredAndDiscovered(opts);
  const index = {};
  for (const p of [...report.providers, ...report.discovered]) {
    if (p.reachable) index[p.id] = p;
  }
  for (const s of report.stacks) {
    if (s.reachable && s.type === "ollama") index.ollama = { ...index.ollama, ...s, id: "ollama" };
    if (s.reachable && s.type === "desk") index["desk-engine"] = { ...index["desk-engine"], ...s, id: "desk-engine" };
  }
  return { report, probes: Object.values(index) };
}
