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

// One rotated backup keeps the live file bounded without losing recent history.
function rotatedPath(home = systemBrainHome()) {
  return runsPath(home) + ".1";
}

function telemetryDisabled() {
  const v = process.env.CTO_BRAIN_NO_TELEMETRY;
  return v === "1" || v === "true";
}

// Max bytes for the live runs.jsonl before it rotates to runs.jsonl.1
// (overwriting the previous backup). Default 5 MB; override for tests/ops.
function maxBytes() {
  const v = Number(process.env.CTO_BRAIN_TELEMETRY_MAX_BYTES);
  return Number.isFinite(v) && v > 0 ? v : 5 * 1024 * 1024;
}

// Rotate before append if the live file has grown past the cap. Best-effort.
function rotateIfNeeded(home) {
  try {
    const p = runsPath(home);
    if (fs.statSync(p).size >= maxBytes()) {
      fs.renameSync(p, rotatedPath(home)); // overwrites prior .1
    }
  } catch {
    /* no file yet, or stat/rename raced — fine */
  }
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
    rotateIfNeeded(home);
    // Single atomic line write — under concurrency, writes interleave by whole
    // lines, never torn; summarize() skips any unparseable line defensively.
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
  // Span the rotated backup + the live file so a recent rotation doesn't drop
  // history from the summary. Oldest first.
  let raw = "";
  for (const p of [rotatedPath(home), runsPath(home)]) {
    try { raw += fs.readFileSync(p, "utf8"); } catch { /* missing is fine */ }
  }
  if (!raw) return summary; // no telemetry yet
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
