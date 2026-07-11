# Tasks: secure-brain-chat

Red before green, always. One criterion at a time; a test you didn't watch
fail proves nothing.

- [x] RED — grounding test with planted `.env` + `sk-…` doc (fail-closed)
- [x] GREEN — grounding walk: docs-only, traversal guard, path+content denylist, maxBytes
- [x] GREEN — provider resolution through providers.mjs (local/openai-compatible/anthropic)
- [x] GREEN — server three gates + SSE; `cto-brain chat` CLI + `--help`
- [x] GREEN — self-contained chat UI + example config + README section
- [x] VERIFY — `npm test` green (639 assertions); live boot: gates 401/200, SSE degrades honestly
- [ ] REFLECT — round-close: growth-ledger row; archive this change
