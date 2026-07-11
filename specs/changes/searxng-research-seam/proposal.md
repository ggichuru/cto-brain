# Change: searxng-research-seam

**Status:** Proposed (2026-07-11), NOT frozen — operator charge: "always keep
up to date with the latest developments; always use your internal customizable
searxng engine to enable browsing, updating and deep research." Grounded live:
the-desk-searxng answers JSON on http://127.0.0.1:8888 (10 results verified
2026-07-11; some upstream engines rate-limit-suspended, aggregate holds).

## Intent
Make the self-hosted SearXNG instance cto-brain's standing research surface:
research/update flows query the operator's own meta-search engine (privacy,
no vendor search logs) instead of vendor APIs, with honest fallback when the
engine is down. This is the "stay current" leg of the learning loop — the
brain re-checks fast-moving facts (tool-parser landscape, model rosters,
peer tooling) against live sources on its own engine.

## Behavior
New src/research/searx.mjs: searchSearx({query, baseUrl, categories}) hits
GET /search?format=json on SEARXNG_BASE_URL (default http://127.0.0.1:8888),
returns normalized {results:[{title,url,snippet,engine}], unresponsive:[...]};
degrades honestly (structured error, never a throw) when unreachable. CLI:
`cto-brain research <query> [--json]` prints ranked results. MCP tool
`research_search` exposes the same. Doctor gains a searxng reachability line.
The deep-research discipline docs (cto-orchestration SearXNG section) point
at this seam. Downstream (later change): the skill-synth "stay current" pass
and quarterly re-verify of research docs cite it.

## Acceptance criteria
- Pure tests with injected fetch: result normalization, unresponsive-engine
  passthrough, down-engine structured failure (no throw), env-var base URL.
- Live leg env-gated (SEARXNG_LIVE=1): real query returns >0 results on this box.
- CLI + MCP surfaces registered; npm test green offline.

## Non-goals
- No bundled SearXNG deployment (compose file is dgx-ops territory; we consume).
- No scraping/fetch-and-summarize pipeline this change (research harness owns that).
- No result caching policy yet.

## Frozen contracts
(At freeze:) src/research/searx.mjs exports; SEARXNG_BASE_URL env; result shape
{title,url,snippet,engine}.
