# cto-brain — status log (append-only)

One paragraph per integration round. Prefix `BLOCKER:` or `ESCALATE:` for lead-tier attention.

2026-06-24 — ship 0.1.2 round. Discovered npm 0.1.1 was published from `8ee880e`, one commit behind HEAD `b3901ea` which adds the adapter-management feature (`src/cli/adapters.mjs`, `adapter pick/wire/status`) — so the published tarball lacked the headline feature. npm versions are immutable, so corrected by bumping to 0.1.2. CI green (gate + 12 suites). BLOCKER: repo secret `NPM_TOKEN` is not set, so the tag-driven `release.yml` cannot publish — either add the secret or fall back to direct `npm publish`.

2026-06-25 — shipped v0.2.0 to npm (MCP server + local telemetry, built across two reviewer-trio-gated rounds). Published via manual `npm publish`; prepublishOnly ran the gate + 15 suites green. npm latest=0.2.0, published gitHead matches HEAD (46381f8), origin/main in sync — clean, no stale-publish trap. Also wired the last 2 live projects (Wedding, aminichain): all 7 projects now carry .cto-brain + the 4 skills on claude-code+cursor. Open items (non-blocking): release.yml is still armed on v* tags, so do NOT push a v0.2.0 tag (would attempt a doomed re-publish); and the operator-machine global CLI is still 0.1.1 (run `npm i -g cto-brain@latest` to get mcp/telemetry).
