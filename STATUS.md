# cto-brain — status log (append-only)

One paragraph per integration round. Prefix `BLOCKER:` or `ESCALATE:` for lead-tier attention.

2026-06-24 — ship 0.1.2 round. Discovered npm 0.1.1 was published from `8ee880e`, one commit behind HEAD `b3901ea` which adds the adapter-management feature (`src/cli/adapters.mjs`, `adapter pick/wire/status`) — so the published tarball lacked the headline feature. npm versions are immutable, so corrected by bumping to 0.1.2. CI green (gate + 12 suites). BLOCKER: repo secret `NPM_TOKEN` is not set, so the tag-driven `release.yml` cannot publish — either add the secret or fall back to direct `npm publish`.
