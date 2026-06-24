# cto-brain — growth ledger (append-only)

Format: `YYYY-MM-DD | <round-tag> | <action-summary> | <lesson-or-noop>`

Project-specific lessons stay here. General brain policy → system `~/.cto-brain/memory/growth_ledger.md` via `cto-brain sync --promote`.

2026-06-24 | ship-0.1.2 | bumped 0.1.1→0.1.2; npm 0.1.1 was stale (published from 8ee880e, before adapter feature b3901ea) | npm published versions are immutable — a stale publish forces a version bump, never a republish; check `npm view <pkg> gitHead` vs HEAD before claiming "shipped"
2026-06-24 | ship-0.1.2 | gh secret list empty → release.yml NPM_TOKEN missing | tag-driven release silently fails at publish without the secret; verify secrets before pushing the tag
2026-06-24 | mcp-roundA | added MCP server (src/mcp/tools+server, `cto-brain mcp`); wrapped 7 existing fns as MCP tools; first runtime dep @modelcontextprotocol/sdk | gate check already excludes node_modules so first dep didn't break the security gate; reviewer trio caught ledger log-injection in round_close (sanitize tool args) + missing e2e transport test (added) — unit-testing a registry without the transport is a real coverage gap
