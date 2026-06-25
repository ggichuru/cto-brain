// Human-readable renderers for CLI command results. Each takes the same data
// object the command already returns (and prints as JSON under --json/pipes)
// and returns a terminal-friendly string. No side effects.

import { heading, kv, table, sym, dim, bold, green, red, yellow, gray, cyan } from "./ui.mjs";

function statusMark(s) {
  if (s === "reachable" || s === "ok" || s === true) return sym.ok();
  if (s === "degraded") return sym.warn();
  return sym.bad();
}

export function renderRouterList(rows) {
  const body = table(
    ["PROVIDER", "TIER", "LABEL"],
    rows.map((r) => [r.id, r.tier, r.label + (r.stub ? gray(" (stub)") : "")])
  );
  return `${heading("Providers")}\n${body}`;
}

export function renderRouterSelect(route) {
  if (!route || !route.provider) {
    return `${sym.bad()} ${bold("no route")} ${dim("— nothing reachable / honest")}\n${kv([["task", route?.task ?? "?"], ["reason", route?.reason ?? ""]])}`;
  }
  return [
    `${sym.ok()} ${bold(route.task)} ${cyan("›")} ${bold(route.provider)} ${dim("/")} ${route.model || dim("(default)")}`,
    kv([
      ["tier", route.tier],
      ["baseUrl", route.baseUrl || dim("n/a")],
      ["honest", route.honest ? green("yes") : red("no")],
      ["fallback", route.fallbackUsed ? yellow("used") : dim("no")],
      ["reason", route.reason || ""],
    ]),
  ].join("\n");
}

export function renderRouterPlan(plan) {
  const head = kv([
    ["prefer", plan.prefer],
    ["layers", `${plan.layers?.system ? "system" : dim("system")} + ${plan.layers?.project ? "project" : dim("project")}`],
    ["providers", (plan.enabledProviders || []).join(", ") || dim("(defaults)")],
  ]);
  const rows = Object.entries(plan.tasks || {}).map(([task, r]) => [
    task,
    r.provider ? bold(r.provider) : red("none"),
    r.model || dim("—"),
    r.tier || dim("—"),
    r.honest ? green("✓") : red("✗"),
  ]);
  const body = table(["TASK", "PROVIDER", "MODEL", "TIER", "HONEST"], rows);
  return `${heading("Routing plan")}\n${head}\n\n${body}`;
}

function renderProbeList(items) {
  return items
    .map((p) => {
      const models = p.models && p.models.length ? dim(` (${p.models.join(", ")})`) : "";
      const reason = p.reason ? dim(` — ${p.reason}`) : "";
      return `  ${statusMark(p.status)} ${p.id}${models}${reason}`;
    })
    .join("\n");
}

export function renderProbe(report) {
  const out = [];
  if (report.stacks?.length) out.push(`${heading("Configured stacks")}\n${renderProbeList(report.stacks)}`);
  if (report.providers?.length) out.push(`${heading("Providers")}\n${renderProbeList(report.providers)}`);
  if (report.discovered?.length) out.push(`${heading("Discovered")}\n${renderProbeList(report.discovered)}`);
  return out.join("\n\n") || dim("no stacks configured");
}

export function renderStackStatus(res) {
  const s = res.summary || {};
  const body = res.stacks?.length ? renderProbeList(res.stacks) : dim("none configured");
  return `${heading("Stacks")} ${dim(`(${s.reachable ?? 0}/${s.total ?? 0} up)`)}\n${body}`;
}

export function renderAdapterStatus(status) {
  const rows = (status.adapters || []).flatMap((a) =>
    (a.paths || []).map((p) => [a.id, p.wired ? sym.ok() : sym.bad(), String(p.skillCount ?? 0), p.path])
  );
  const head = kv([
    ["enabled", (status.enabled || []).join(", ") || dim("none")],
    ["scope", status.scope || dim("?")],
    ["lastWired", status.lastWired || dim("never")],
  ]);
  const body = rows.length ? "\n\n" + table(["ADAPTER", "WIRED", "SKILLS", "PATH"], rows) : "";
  return `${heading("Adapters")}\n${head}${body}`;
}

export function renderTelemetry(s) {
  const r = s.routing || {};
  const lat = s.latencyMs || {};
  const head = kv([
    ["events", String(s.total ?? 0)],
    ["fallback rate", r.total ? `${(r.fallbackRate * 100).toFixed(1)}%` : dim("n/a")],
    ["latency p50/p95/max", `${lat.p50 ?? "—"} / ${lat.p95 ?? "—"} / ${lat.max ?? "—"} ms`],
  ]);
  const byKind = Object.entries(s.byKind || {});
  const kinds = byKind.length ? "\n\n" + table(["KIND", "COUNT"], byKind.map(([k, v]) => [k, String(v)])) : "";
  return `${heading("Telemetry summary")}\n${head}${kinds}`;
}

export function renderEval(sc) {
  const passColor = sc.failed === 0 ? green : red;
  const head = kv([
    ["result", `${passColor(`${sc.passed}/${sc.total}`)} ${dim(`(${(sc.passRate * 100).toFixed(0)}%)`)}`],
  ]);
  const dims = Object.entries(sc.byDimension || {}).map(([d, v]) => [
    d,
    `${v.passed}/${v.total}`,
    v.passRate === 1 ? green("✓") : yellow(`${(v.passRate * 100).toFixed(0)}%`),
  ]);
  const body = dims.length ? "\n\n" + table(["DIMENSION", "PASS", ""], dims) : "";
  const fails = (sc.cases || []).filter((c) => !c.pass);
  const failList = fails.length
    ? "\n\n" + bold(red("Failures:")) + "\n" + fails.map((c) => `  ${sym.bad()} ${c.name} ${dim("— " + c.detail)}`).join("\n")
    : "";
  return `${heading("Eval scorecard")}\n${head}${body}${failList}`;
}
