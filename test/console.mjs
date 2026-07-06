// cto-brain console tests — state assembler, renderer, and the read-only server.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { buildState } from "../src/console/state.mjs";
import { renderHtml, renderCards } from "../src/console/render.mjs";
import { createConsoleServer, startConsole } from "../src/console/server.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

// --- a temp brain home with a portfolio + ledger so those sections have data ---
const home = fs.mkdtempSync(path.join(os.tmpdir(), "ctob-console-"));
fs.mkdirSync(path.join(home, "memory"), { recursive: true });
// append-only order: oldest first, newest at the bottom (round-a is newest)
fs.writeFileSync(path.join(home, "memory", "growth_ledger.md"),
  "# ledger\nFormat: x\n2026-07-05 | round-b | did another | no-op\n2026-07-06 | round-a | did a thing | learned a lesson\n");
fs.writeFileSync(path.join(home, "memory", "portfolio.md"),
  "# Portfolio\nFormat: x\nproject | cto | repo | charter | status | last | notes\nslate | slate-cto | /x | /c | active | 2026-07-01 | note\n");

// --- state shape ---
const state = await buildState({ home, prefer: "auto" });
const SECTIONS = ["generated", "version", "prefer", "router", "stacks", "adapters", "telemetry", "eval", "portfolio", "ledger"];
for (const s of SECTIONS) ok(`state has ${s}`, s in state);
ok("version is a string", typeof state.version === "string");
ok("ledger parsed newest-first", state.ledger.rows[0].tag === "round-a");
ok("ledger row carries summary", state.ledger.rows[0].summary === "did a thing");
ok("portfolio parsed", state.portfolio.projects[0].project === "slate");
ok("portfolio status parsed", state.portfolio.projects[0].status === "active");
ok("eval section present (pure)", state.eval && typeof state.eval.total === "number");

// --- a source that throws degrades to an error island, never crashes buildState ---
const badHome = path.join(home, "does-not-exist-nested", "deeper");
const state2 = await buildState({ home: badHome, prefer: "auto" });
ok("missing home still returns full shape", SECTIONS.every((s) => s in state2));
ok("ledger island honest on missing", "error" in state2.ledger || state2.ledger.rows.length === 0);

// --- renderer: self-contained, no external hosts, contains data ---
const html = renderHtml(state);
ok("html is a doctype page", /^<!doctype html>/i.test(html));
ok("html contains the version", html.includes(state.version));
ok("html contains a ledger slug", html.includes("round-a"));
ok("html says read-only", /read-only/i.test(html));
ok("html has NO external http(s) host", !/https?:\/\/(?!localhost)/i.test(html.replace(/http:\/\/localhost/g, "")));
ok("html has no cdn/font/script src=", !/<(script|link|img)[^>]+(src|href)=["']https?:/i.test(html));
ok("renderCards is a fragment (no doctype)", !/doctype/i.test(renderCards(state)));

// --- server: read-only routes + origin guard ---
const { server, port, url } = await startConsole({ host: "127.0.0.1", port: 0, stateOpts: { home } });
ok("server started with a url", /^http:\/\/127\.0\.0\.1:\d+\/$/.test(url));

function req(method, pathname, headers = {}) {
  return new Promise((resolve) => {
    const r = http.request({ host: "127.0.0.1", port, path: pathname, method, headers }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body, ctype: res.headers["content-type"] || "" }));
    });
    r.on("error", () => resolve({ status: 0, body: "", ctype: "" }));
    r.end();
  });
}

const root = await req("GET", "/");
ok("GET / is 200 html", root.status === 200 && root.ctype.includes("text/html"));
ok("GET / body is the page", /cto-brain console/.test(root.body));
const api = await req("GET", "/api/state");
ok("GET /api/state is 200 json", api.status === 200 && api.ctype.includes("application/json"));
ok("api body parses to the shape", (() => { try { return SECTIONS.every((s) => s in JSON.parse(api.body)); } catch { return false; } })());
const cards = await req("GET", "/api/cards");
ok("GET /api/cards is 200 html fragment", cards.status === 200 && !/doctype/i.test(cards.body));
const health = await req("GET", "/healthz");
ok("GET /healthz ok:true", health.status === 200 && /"ok":true/.test(health.body));
const notfound = await req("GET", "/nope");
ok("unknown path 404", notfound.status === 404);
const post = await req("POST", "/");
ok("POST refused 405 (read-only)", post.status === 405);
const badOrigin = await req("GET", "/", { origin: "http://evil.example" });
ok("cross-origin browser request 403", badOrigin.status === 403);
const goodNoOrigin = await req("GET", "/healthz");
ok("no-Origin request allowed", goodNoOrigin.status === 200);

await new Promise((r) => server.close(r));
fs.rmSync(home, { recursive: true, force: true });

if (failures) { console.error("\n" + failures + " console failure(s)"); process.exit(1); }
console.log("\nAll console checks passed.");
