# Integration: spec contracts (openspec-style, dependency-free)

**Status:** Frozen contract for the 0.11.0 build (2026-07-11).

## Intent

Give cto-brain a first-class spec-driven-development surface — the "no code
without a spec" half of the SDD×TDD doctrine — shaped like the openspec
change-contract workflow but **built in, with zero new dependencies**. The
2026-07-03 peer-study round consciously rejected the openspec CLI as a
dependency; this adopts the *mechanics* (proposal → tasks → frozen spec →
archive) natively.

## Behavior

1. **`cto-brain spec init <change-id> [--dir <root>]`** scaffolds an
   openspec-style change contract at `<root>/specs/changes/<change-id>/`:
   - `proposal.md` — intent, behavior, acceptance criteria, non-goals,
     frozen contracts (from `templates/spec/proposal.md`)
   - `tasks.md` — the red-green checklist (from `templates/spec/tasks.md`)
   - Refuses (exit 1, no clobber) if the change dir already exists.
2. **`cto-brain spec check [--dir <root>]`** lints every
   `specs/changes/*/proposal.md` under the root:
   - Required sections: `## Intent`, `## Behavior`, `## Acceptance criteria`,
     `## Non-goals`. Missing section → error.
   - Empty required section (no non-blank line before next `##`) → error.
   - Returns JSON `{ ok, checked, errors: [{file, missing|empty}] }`;
     exit 1 when `ok` is false. No changes dir → ok:true, checked:0.
3. **`skills/spec-driven/SKILL.md`** — bundled model-invoked skill carrying
   the SDD discipline (spec anatomy, drift-is-a-bug, change-contract
   protocol, composition with tdd + agentic-learning-loop). Lint-clean under
   the 0.10.0 skill-lint gate; listed in `package.json` `agentskills`.

## Acceptance criteria

- `node test/spec-contracts.mjs` green: scaffold creates both files with
  template content; re-init same id throws; check passes a complete
  proposal; check errors on a missing section AND an empty section;
  check ok on a root with no specs dir.
- `npm test` green end-to-end (suite line added to package.json).
- `cto-brain gate check --home .` still ok (new skill passes lint).
- README bundled-skills count updated (8 → 9); CHANGELOG 0.11.0 entry;
  version bumped to 0.11.0.

## Non-goals

- No openspec CLI/npm dependency, no `openspec/` dir-name compatibility
  claim, no spec→code drift *detection* (that stays doctrine, not tooling),
  no MCP tool for spec ops in this round.

## Frozen contracts

- Module: `src/spec/contract.mjs` exporting pure
  `scaffoldChange({ id, root, templatesDir })` and `checkSpecs({ root })`.
- Layout: `specs/changes/<id>/{proposal.md,tasks.md}` relative to `--dir`
  (default cwd).
- Templates: `templates/spec/proposal.md`, `templates/spec/tasks.md`
  (already shipped via package.json `files: ["templates"]`).
