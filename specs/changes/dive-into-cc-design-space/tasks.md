# Tasks: dive-into-cc-design-space

Red before green, always. Doctrine change — the "test" is the package skill lint +
skills-valid + full suite staying green. Living doc: checked off as landed.

- [x] SPEC — proposal.md + tasks.md written; frozen contract = `agent-design-space` skill authored.
- [x] SKILL — `agent-design-space` present in package `skills/`, `~/.claude/skills/`, private brain `~/.cto-brain/skills/`; package.json skills-list updated.
- [x] VERIFY-BASELINE — `npm test` green before change (26 suites); confirmed skill-lint/skills-valid pass with the new skill (frontmatter 1255 chars < 4096; name==dir; kebab-case).
- [x] CTO-CODE — `CTO_PROMPT` + `cto` agent in src/cli/opencode-setup.mjs hardened (deny-first, harness-first, compact-cheapest-first + smart-zone task sizing, independent oracle); doc at docs/integrations/cto-code-design-space.md.
- [x] DOCTRINE (partial) — cto-brain SKILL (live `~/.claude`) gains `[[agent-design-space]]` composition-map row. **Deferred polish:** the same link into cto-orchestration + agentic-learning-loop (live + package copies) — 5 copies, low-load-bearing; tracked here, not blocking.
- [x] VERIFY — `npm test` green (whole suite, 26); opencode-setup config still builds; verdict: **proven**.
- [x] SHIP — committed `a365ead` on `feat/dive-into-cc-design-space`; pushed to origin.
- [x] REFLECT — GROWTH.md row `dive-into-cc-design-space`; round-close ritual (memory pointer + round_close).
- [ ] UBONGO — openspec change `dive-into-cc-future-axes` (WHERE/WHEN/WHAT/WITH-WHOM → ubongo phases) — rolled into the platform program (see `sovereign-compute-fabric` ULTRAPLAN).
- [ ] FOLLOW-ON — the platform build (host-assessment, headroom scheduler, fine-tune, any-host deploy) spins its own OpenSpec changes; this change stays the doctrine foundation they build on.

## What this round learned (feeds the platform program)
- The paper's 1.6%/98.4% finding = the sovereignty bet as engineering: invest in harness, model swappable.
- License is load-bearing: CC BY-NC-SA → synthesize + cite, never paste, into MIT/commercial surfaces.
- Smart-zone (aihero): budget dispatch against the *measured* smart zone (low tens of K for a 7B), not the advertised window; pin Ollama `num_ctx` to it; one task/fresh session; review in clean context.
- Two genuinely greenfield gaps for the platform: **hardware-capacity sensing** and **headroom-aware scheduling**; **any-host deploy/DNS** needs a charter decision (currently dgx-ops territory).
