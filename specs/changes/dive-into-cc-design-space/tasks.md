# Tasks: dive-into-cc-design-space

Red before green, always. One criterion at a time; a test you didn't watch
fail proves nothing. Doctrine change — the "test" is the package skill lint +
skills-valid + full suite staying green, plus openspec validate.

- [x] SPEC — proposal.md + tasks.md written; frozen contract = `agent-design-space` skill authored.
- [ ] SKILL — `agent-design-space` present in package skills/, ~/.claude/skills/, private brain; package.json skills-list updated.
- [ ] RED — run `npm test` to confirm skills-valid/skill-lint currently pass pre-change (baseline), then confirm they still pass after the new skill lands (skill-lint is the oracle).
- [ ] DOCTRINE — cto-brain / cto-orchestration / agentic-learning-loop SKILLs get `[[agent-design-space]]` links + version bumps (both package copies and live ~/.claude copies).
- [ ] CTO-CODE — `CTO_PROMPT` + `cto` agent in src/cli/opencode-setup.mjs hardened (deny-first, harness-first, oracle); doc at docs/integrations/cto-code-design-space.md.
- [ ] UBONGO — openspec change `dive-into-cc-future-axes` (proposal + tasks) in its own worktree.
- [ ] VERIFY — `npm test` green (whole suite); `opencode-setup` config still builds; openspec validate; verdict proven/UNPROVEN.
- [ ] REFLECT — round-close: growth-ledger row; MEMORY.md pointer; archive intent.
