# cto-brain — growth ledger (append-only)

Format: `YYYY-MM-DD | <round-tag> | <action-summary> | <lesson-or-noop>`

Project-specific lessons stay here. General brain policy → system `~/.cto-brain/memory/growth_ledger.md` via `cto-brain sync --promote`.

2026-06-24 | ship-0.1.2 | bumped 0.1.1→0.1.2; npm 0.1.1 was stale (published from 8ee880e, before adapter feature b3901ea) | npm published versions are immutable — a stale publish forces a version bump, never a republish; check `npm view <pkg> gitHead` vs HEAD before claiming "shipped"
2026-06-24 | ship-0.1.2 | gh secret list empty → release.yml NPM_TOKEN missing | tag-driven release silently fails at publish without the secret; verify secrets before pushing the tag
