// Run telemetry — append-only JSONL of routing decisions and MCP tool calls.
//
// Recording happens at the CLI / MCP boundary (src/cli/router.mjs,
// src/mcp/tools.mjs), never inside the pure routing functions. It is
// best-effort: a telemetry failure must never break a command. No secrets are
// recorded — provider id + model only, never baseUrl or env.

import fs from "node:fs";
import path from "node:path";
import { systemBrainHome, ensureDir } from "../paths.mjs";

export function telemetryDir(home = systemBrainHome()) {
  return path.join(home, "telemetry");
}

export function runsPath(home = systemBrainHome()) {
  return path.join(telemetryDir(home), "runs.jsonl");
}

function telemetryDisabled() {
  const v = process.env.CTO_BRAIN_NO_TELEMETRY;
  return v === "1" || v === "true";
}

// Append one event. Best-effort: swallows all errors (telemetry must never
// break a command). `latencyMs` is end-to-end for the recorded op — for routing
// events it includes the stack-probe round-trips, not just selection logic.
export function recordEvent(event = {}, home = systemBrainHome()) {
  if (telemetryDisabled()) return false;
  try {
    const row = {
      ts: new Date().toISOString(),
      kind: event.kind || "unknown",
      ...(event.task != null ? { task: event.task } : {}),
      ...(event.provider != null ? { provider: event.provider } : {}),
      ...(event.model != null ? { model: event.model } : {}),
      ...(event.fallbackUsed != null ? { fallbackUsed: !!event.fallbackUsed } : {}),
      ...(event.honest != null ? { honest: !!event.honest } : {}),
      ...(event.latencyMs != null ? { latencyMs: Math.round(event.latencyMs) } : {}),
      ...(event.source != null ? { source: event.source } : {}),
      ...(event.ok != null ? { ok: !!event.ok } : {}),
    };
    ensureDir(telemetryDir(home));
    fs.appendFileSync(runsPath(home), JSON.stringify(row) + "\n");
    return true;
  } catch {
    return false;
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

// Aggregate the JSONL into the report's KPI set.
export function summarize(home = systemBrainHome()) {
  const summary = {
    total: 0,
    byKind: {},
    routing: { total: 0, fallbackUsed: 0, fallbackRate: 0, byTaskProvider: {} },
    toolCalls: {},
    latencyMs: { p50: null, p95: null, max: null },
  };
  let raw;
  try {
    raw = fs.readFileSync(runsPath(home), "utf8");
  } catch {
    return summary; // no telemetry yet
  }
  const latencies = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    summary.total++;
    summary.byKind[e.kind] = (summary.byKind[e.kind] || 0) + 1;
    if (typeof e.latencyMs === "number") latencies.push(e.latencyMs);
    if (e.kind === "mcp_tool" && e.source) {
      summary.toolCalls[e.source] = (summary.toolCalls[e.source] || 0) + 1;
    }
    if (e.task && e.provider) {
      summary.routing.total++;
      if (e.fallbackUsed) summary.routing.fallbackUsed++;
      const byTask = (summary.routing.byTaskProvider[e.task] ||= {});
      byTask[e.provider] = (byTask[e.provider] || 0) + 1;
    }
  }
  if (summary.routing.total) {
    summary.routing.fallbackRate = +(summary.routing.fallbackUsed / summary.routing.total).toFixed(3);
  }
  latencies.sort((a, b) => a - b);
  summary.latencyMs.p50 = percentile(latencies, 50);
  summary.latencyMs.p95 = percentile(latencies, 95);
  summary.latencyMs.max = latencies.length ? latencies[latencies.length - 1] : null;
  return summary;
}
