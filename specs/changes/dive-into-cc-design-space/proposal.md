# Change: dive-into-cc-design-space

**Status:** Proposed (2026-07-16), NOT frozen — operator charge: "ingest this
paper fully and implement it into our stack, our skills, our packages; enable
cto-code and cto-brain DNA and ubongo; make sure it enables our local stack."
Grounded live: both the paper (arXiv:2604.14228, "Dive into Claude Code",
VILA-Lab/MBZUAI+UCL, analyzing Claude Code v2.1.88) and its repo
(github.com/VILA-Lab/Dive-into-Claude-Code) were ingested in full 2026-07-16.

## Intent
Turn the paper's design space into standing doctrine for this stack. The paper's
load-bearing finding — a real agentic system is ~1.6% model reasoning and ~98.4%
deterministic harness — *is our sovereignty bet stated as engineering*: invest in
the harness, treat the model as swappable to the local floor. This change installs
a reusable **design lens** (the 13 principles, the four questions, the two cost
models, the graduated compaction ladder, the WHERE/WHEN/WHAT/WITH-WHOM future
axes, and the observability→improvement loop), wires it into the build doctrine
(cto-brain / cto-orchestration / agentic-learning-loop), hardens the **cto-code**
sovereign terminal's system prompt with it, and hands ubongo an OpenSpec change
mapping the four future axes onto its phases.

## Behavior
- **New skill `agent-design-space`** (the frozen contract, already authored):
  original synthesis of the paper mapped to our surfaces, cited, license-clean.
  Ships in the public cto-brain package skills list, is present in `~/.claude/
  skills/`, and is copied into the private system brain (`~/.cto-brain/skills/`).
- **Doctrine deltas (additive):** cto-brain SKILL gains a "design-space lens"
  reference at scope/design/verify; cto-orchestration names the skill-vs-subagent
  and extensibility cost models as the *why* behind isolation + summary-return;
  agentic-learning-loop names the verification-oracle + harness-self-improvement
  demand explicitly. Each links `[[agent-design-space]]`; each bumps its version.
- **cto-code hardening:** the `CTO_PROMPT` and `cto` agent wired into opencode
  (src/cli/opencode-setup.mjs) gain the deny-first posture, the
  minimal-scaffolding-maximal-harness framing, the graduated-compaction awareness,
  and the "verify with an independent oracle, never self-report" rule — so the
  sovereign local terminal carries the DNA. A short doc lands at
  docs/integrations/cto-code-design-space.md.
- **ubongo OpenSpec change** `dive-into-cc-future-axes`: maps WHERE→p9, WHEN→p11,
  WHAT→cross-project, WITH-WHOM→governance, and pins the "execution boundary IS
  the safety boundary" invariant across its confirm-gate.
- **MEMORY.md** gains one pointer line.

## Acceptance criteria
- `agent-design-space` present in all three skill locations; validates against the
  package's skill lint (`node test/skill-lint.mjs`) and skills-valid test.
- Package `agentskills.skills` in package.json lists `./skills/agent-design-space`.
- cto-brain / cto-orchestration / agentic-learning-loop each contain a
  `[[agent-design-space]]` link and a bumped version line.
- `src/cli/opencode-setup.mjs` `CTO_PROMPT` contains the deny-first + harness-first
  + oracle rules; existing opencode-setup behavior unchanged (`npm test` green).
- `npm test` green offline (all suites); no secret/gate regressions.
- ubongo `openspec/changes/dive-into-cc-future-axes/` has proposal.md + tasks.md.

## Non-goals
- No new runtime code paths in the agent loop or router this change (doctrine +
  prompt wiring only). The compaction ladder is documented as design guidance, not
  re-implemented here.
- No copying of the paper's prose/diagrams anywhere (CC BY-NC-SA; original
  synthesis + citation only).
- No implementation of the four future axes themselves — ubongo change scopes them
  as proposals, not builds.
- No change to the local model roster or router policy (the paper *validates* the
  existing sovereign-first routing; it does not change it).

## Frozen contracts
(At freeze:) skill name `agent-design-space` and its section headings (four
questions / 13 principles / two cost models / compaction ladder / four future
axes / observability loop); the package skills-list entry path; the `[[agent-
design-space]]` link convention across the three doctrine skills.
