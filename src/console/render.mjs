// cto-brain console — HTML renderer.
//
// renderHtml(state) → a fully self-contained page (inline CSS + a tiny inline
// auto-refresh script). NO external hosts: no CDN, no web fonts, no remote
// images — everything ships in the string so the console works air-gapped and
// can't leak a request. Server-side rendered (works with JS off); the only
// script re-fetches /api/state every 15s and swaps the <main>.

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function section(title, sub, body) {
  return `<section><h2>${esc(title)}${sub ? ` <span class="sub">${esc(sub)}</span>` : ""}</h2>${body}</section>`;
}

function errIsland(x) {
  return x && typeof x === "object" && "error" in x ? `<p class="err">unavailable — ${esc(x.error)}</p>` : null;
}

function routerCard(router) {
  const e = errIsland(router);
  if (e) return section("Routing", "", e);
  const rows = Object.entries(router.tasks || {}).map(([task, r]) => {
    const avail = r.modelAvailable === false ? '<span class="pill warn">absent</span>' : '<span class="pill ok">available</span>';
    const tier = r.tier === "cloud" ? '<span class="pill cloud">cloud</span>' : '<span class="pill local">local</span>';
    return `<tr><td>${esc(task)}</td><td>${esc(r.provider)}</td><td class="mono">${esc(r.model)}</td><td>${tier}</td><td>${avail}</td></tr>`;
  });
  return section("Routing", `prefer=${router.prefer} · ${(router.enabledProviders || []).length} providers`,
    `<table><thead><tr><th>task</th><th>provider</th><th>model</th><th>tier</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>`);
}

function stacksCard(stacks) {
  const e = errIsland(stacks);
  if (e) return section("Stacks & providers", "", e);
  const list = stacks.stacks || stacks.providers || [];
  const rows = list.map((s) => {
    const up = s.reachable ? '<span class="pill ok">reachable</span>' : `<span class="pill down">${esc(s.status || "down")}</span>`;
    const models = Array.isArray(s.models) && s.models.length ? `${s.models.length} models` : "";
    return `<tr><td>${esc(s.id || s.label)}</td><td>${esc(s.tier || s.type || "")}</td><td>${up}</td><td class="dim">${esc(models)}</td></tr>`;
  });
  const sum = stacks.summary ? `${stacks.summary.reachable}/${stacks.summary.total} reachable` : "";
  return section("Stacks & providers", sum,
    `<table><thead><tr><th>id</th><th>kind</th><th>state</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>`);
}

function adaptersCard(adapters) {
  const e = errIsland(adapters);
  if (e) return section("Adapters", "", e);
  const rows = (adapters.adapters || []).map((a) => {
    const n = a.paths && a.paths[0] ? a.paths[0].skillCount : 0;
    const wired = a.wired ? '<span class="pill ok">wired</span>' : '<span class="pill down">not wired</span>';
    return `<tr><td>${esc(a.label || a.id)}</td><td>${wired}</td><td class="dim">${esc(n)} skills</td></tr>`;
  });
  return section("Adapters", (adapters.enabled || []).join(" · "),
    `<table><tbody>${rows.join("")}</tbody></table>`);
}

function telemetryCard(t) {
  const e = errIsland(t);
  if (e) return section("Telemetry", "", e);
  const lat = t.latencyMs || {};
  const kpis = [
    ["events", t.total ?? 0],
    ["fallback", t.routing && t.routing.total ? `${(t.routing.fallbackRate * 100).toFixed(0)}%` : "n/a"],
    ["p50 / p95 / max", `${lat.p50 ?? "—"} / ${lat.p95 ?? "—"} / ${lat.max ?? "—"} ms`],
  ].map(([k, v]) => `<div class="kpi"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("");
  const outcomes = Object.entries(t.outcomes || {});
  const outTable = outcomes.length
    ? `<table><thead><tr><th>outcome</th><th>count</th><th>tokens/outcome</th></tr></thead><tbody>${outcomes
        .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v.count)}</td><td class="mono">${esc(v.tokensPerOutcome ?? 0)}</td></tr>`)
        .join("")}</tbody></table>`
    : `<p class="dim">no cost-per-outcome events yet — honest UNPROVEN until callers emit outcome tags.</p>`;
  return section("Telemetry", "local only", `<div class="kpis">${kpis}</div>${outTable}`);
}

function evalCard(ev) {
  const e = errIsland(ev);
  if (e) return section("Eval", "", e);
  const cls = ev.failed === 0 ? "ok" : "down";
  const dims = Object.entries(ev.byDimension || {})
    .map(([d, v]) => `<tr><td>${esc(d)}</td><td>${esc(v.passed)}/${esc(v.total)}</td><td>${v.passRate === 1 ? "✓" : `${(v.passRate * 100).toFixed(0)}%`}</td></tr>`)
    .join("");
  return section("Eval scorecard", `<span class="pill ${cls}">${ev.passed}/${ev.total}</span>`,
    `<table><tbody>${dims}</tbody></table>`);
}

function portfolioCard(p) {
  const e = errIsland(p);
  if (e) return section("Portfolio", "", e);
  const rows = (p.projects || []).map((x) =>
    `<tr><td>${esc(x.project)}</td><td class="dim">${esc(x.cto)}</td><td><span class="pill ${x.status === "active" ? "ok" : "warn"}">${esc(x.status || "?")}</span></td></tr>`);
  return section("Portfolio", `${(p.projects || []).length} projects`, `<table><tbody>${rows.join("")}</tbody></table>`);
}

function ledgerCard(l) {
  const e = errIsland(l);
  if (e) return section("Growth ledger", "", e);
  const rows = (l.rows || []).map((r) =>
    `<div class="lrow"><span class="when">${esc(r.date)}</span><span class="lbody"><span class="slug">${esc(r.tag)}</span>${esc(r.summary.slice(0, 200))}</span></div>`).join("");
  return section("Growth ledger", "what the brain has learned", `<div class="ledger">${rows || '<p class="dim">no rounds yet.</p>'}</div>`);
}

const STYLE = `
:root{--bg:#faf9f6;--fg:#1a1a17;--dim:#6b6a64;--card:#fff;--line:#e6e4dd;--moss:#5a7d4f;--rust:#a5583a;--cloud:#3a5a8a;--warn:#a5833a;--down:#a5413a}
@media(prefers-color-scheme:dark){:root{--bg:#14140f;--fg:#eceae2;--dim:#9a988f;--card:#1e1e18;--line:#2e2d26;--moss:#8fb37f;--rust:#d08a68;--cloud:#7fa3d0;--warn:#d0b06a;--down:#d08078}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{padding:20px 24px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
h1{font:600 20px/1 ui-sans-serif,system-ui;margin:0;letter-spacing:-.01em}
.ver{color:var(--moss);font-weight:600}.stamp{color:var(--dim);font-size:13px;margin-left:auto}
main{max-width:1100px;margin:0 auto;padding:8px 16px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;align-items:start}
section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;overflow-x:auto}
h2{font:600 14px/1 ui-sans-serif;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}
h2 .sub{text-transform:none;letter-spacing:0;font-weight:400;color:var(--dim)}
table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:var(--dim);font-weight:500;padding:4px 8px 4px 0;font-size:11px;text-transform:uppercase}
td{padding:5px 8px 5px 0;border-top:1px solid var(--line)}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.dim{color:var(--dim)}.err{color:var(--down);font-size:13px}
.pill{display:inline-block;padding:1px 8px;border-radius:20px;font-size:11px;border:1px solid currentColor}
.pill.ok,.pill.local{color:var(--moss)}.pill.down{color:var(--down)}.pill.cloud{color:var(--cloud)}.pill.warn{color:var(--warn)}
.kpis{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:12px}.kpi{display:flex;flex-direction:column}.kpi .k{font-size:11px;color:var(--dim);text-transform:uppercase}.kpi .v{font-size:18px;font-weight:600}
.ledger{display:flex;flex-direction:column;gap:8px}.lrow{display:flex;gap:12px;font-size:13px}.when{color:var(--dim);font-family:ui-monospace,monospace;font-size:11px;white-space:nowrap;padding-top:2px}
.lbody{color:var(--fg)}.slug{display:inline-block;color:var(--rust);font-weight:600;margin-right:8px}
footer{max-width:1100px;margin:0 auto;padding:0 16px 40px;color:var(--dim);font-size:12px}
`;

// The card grid, given a state object. Exported so both server-render and the
// client refresh use the SAME renderer (no drift).
export function renderCards(state) {
  return [
    routerCard(state.router),
    stacksCard(state.stacks),
    adaptersCard(state.adapters),
    telemetryCard(state.telemetry),
    evalCard(state.eval),
    portfolioCard(state.portfolio),
    ledgerCard(state.ledger),
  ].join("");
}

export function renderHtml(state) {
  const stamp = new Date(state.generated).toLocaleString();
  // Ship renderCards to the client so refresh re-renders identically. It is a
  // pure function of `state`; we serialize it and its helpers by re-declaring
  // them client-side via a compact bundle is overkill — instead the refresh
  // just replaces innerHTML from a server round-trip's pre-rendered cards.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>cto-brain console</title><style>${STYLE}</style></head>
<body>
<header><h1>cto-brain <span class="ver">v${esc(state.version)}</span></h1>
<span class="dim">read-only control plane · actions live in the CLI &amp; channels</span>
<span class="stamp" id="stamp">generated ${esc(stamp)}</span></header>
<main id="cards">${renderCards(state)}</main>
<footer>Read-only window over the brain's live state — routing, stacks, adapters, telemetry, eval, portfolio, and the growth ledger. Nothing here mutates the brain; every change flows through <span class="mono">cto-brain</span> and the gated channels. Loopback-only by default.</footer>
<script>${clientRefresh()}</script>
</body></html>`;
}

// Client refresh re-fetches the pre-rendered cards from /api/cards (first-party,
// server-escaped HTML) so the SERVER stays the single renderer — no render logic
// is duplicated in the browser, and innerHTML only ever receives our own
// esc()'d output over same-origin, never third-party content.
function clientRefresh() {
  return `
(function(){
  async function tick(){
    try{
      const cards=await fetch('/api/cards');if(!cards.ok)return;
      document.getElementById('cards').innerHTML=await cards.text();
      const s=await (await fetch('/api/state')).json();
      document.getElementById('stamp').textContent='updated '+new Date(s.generated).toLocaleTimeString();
    }catch(e){}
  }
  setInterval(tick,15000);
})();`;
}
