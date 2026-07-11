# Change: spec-contracts

**Status:** Shipped in 0.11.0 (2026-07-11). Archived as the decision record —
this change dir was scaffolded by the tool it specifies (dogfood).

## Intent
Give cto-brain a first-class SDD surface: openspec-style change contracts
without the openspec dependency (the 2026-07-03 peer-study round rejected the
CLI dependency; we adopt the mechanics natively).

## Behavior
`cto-brain spec init <change-id>` scaffolds
`specs/changes/<id>/{proposal.md,tasks.md}` from `templates/spec/`, refusing
to clobber an existing change. `cto-brain spec check` lints every proposal
for the four required sections, treats empty sections as errors, prints a
JSON report, and exits 1 on failure. A ninth bundled skill `spec-driven`
carries the discipline (propose → freeze → implement via tdd → verify →
archive; drift-is-a-bug).

## Acceptance criteria
- `node test/spec-contracts.mjs` — 10 checks green (scaffold, no-clobber,
  check pass/missing/empty/no-dir).
- `npm test` green with the new suite line; `gate check --home .` ok with
  the new skill.
- README count 8→9, CHANGELOG 0.11.0 entry, version bump.

## Non-goals
- No openspec CLI/npm dependency; no spec→code drift detection tooling;
  no MCP spec tool this round.

## Frozen contracts
- `src/spec/contract.mjs` exports pure `scaffoldChange({id, root, templatesDir})`
  and `checkSpecs({root})`.
- Layout `specs/changes/<id>/{proposal.md,tasks.md}`; templates in
  `templates/spec/` (shipped via package.json `files`).
