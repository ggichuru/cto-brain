# Peer agent-skill collections — study & adoption round (2026-07-03)

Four public agent-skill repos deep-dived by a lead-CTO + 5-agent team to decide
what a mature private brain (9-role CTO orchestration + SDD/TDD doctrine + local-
sovereignty routing + grill/tdd/diagnosing-bugs/domain-modeling + growth ledger)
should adopt. Verdict-first, sources cited. Read-only study; nothing from these
repos was copied wholesale (license notes below).

## Repos studied (sources)

| Repo | Stars | License | Last push | What it is |
|---|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | ~158k | Apache-2.0 (examples) / proprietary (doc skills); no root LICENSE | 2026-07-01 | Canonical — home of the Agent Skills spec + Anthropic's production skills |
| [obra/superpowers](https://github.com/obra/superpowers) | ~245k | MIT | 2026-07-02 | Process-doctrine SDLC-as-skills + `writing-skills` meta-doctrine. Already installed here as a plugin |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | ~69k | MIT | 2026-07-02 | 24 production-engineering skills (security, obs, perf, CI/CD, a11y) |
| [leonardoaraujosantos/my_ai_skills](https://github.com/leonardoaraujosantos/my_ai_skills) | 1 | README says MIT but **no LICENSE file** — unenforceable | 2026-07-03 | Personal 28-skill collection; battle-tested spine + long tail of Mac-pathed utilities |

Agent Skills spec canonical location: **agentskills.io/specification** (the repo's
`spec/agent-skills-spec.md` is now a pointer). Reference linter:
github.com/agentskills/agentskills (`skills-ref validate`).

## Adopted (with integration shape)

1. **Skill-conformance linter** → `~/.cto-brain/scripts/validate-skills.mjs`
   (original impl; spec checklist from anthropics/skills). name==dir, description
   ≤1024 w/ trigger clause, ≤500-line body, known-frontmatter-keys, no leftover
   markers. Run at round-close when a skill is touched. It immediately caught
   real drift (domain-skill descriptions over cap; a workspace dir with no
   SKILL.md; unknown `type`/`version` keys).
2. **Authoring-is-TDD meta-doctrine** → `agentic-learning-loop` §4b: baseline-
   fail before authoring; description = trigger-only (agents follow the summary
   and skip the body); match-form-to-failure table; no-nuance-clauses; micro-test
   wording with variance-as-failure-metric. (superpowers `writing-skills`,
   anthropics `skill-creator`.)
3. **Baseline-delta benchmarking** → `agentic-learning-loop` §4b: with-skill vs
   baseline paired subagents, value is a measured delta; grader critiques the
   eval itself (productized hollow-GREEN lesson). (anthropics skill-creator.)
4. **Dispatch scar-tissue** → `cto-orchestration` "Adopted from the peer-repo
   study round": file-handoffs (paths, never pasted history), record BASE not
   `HEAD~1`, 4-status agent contract, never-hand-the-reviewer-your-CLAIM +
   finding-classification precedence + doubt-theater tripwire, model-tier-per-role
   (name the model), 3-failed-fixes→question-the-architecture. (superpowers
   subagent-driven-dev + addyosmani doubt-driven.)
5. **Shared-finding ledger contract** → `cto-orchestration/references/shared-
   finding-ledger.md`: append-only, monotonic IDs, lock-before-append, empty-run-
   still-logs, no-repro-no-severity, coverage-&-blind-spots footer. (my_ai_skills
   pentest `_shared/finding-schema.md`, restated — no text copied.)
6. **Domain checklists** (MIT, attributed) → `cto-orchestration/references/`:
   `observability-checklist.md` + `accessibility-checklist.md` from
   addyosmani/agent-skills. Security-reviewer upgrades (STRIDE, OWASP LLM Top-10,
   SSRF/TOCTOU, dep-audit reachability×severity) folded as brief guidance.
7. **Verification mechanics** → freshness rule (evidence from a command run IN
   THIS MESSAGE), revert-proof regression tests, satisfaction-ban before verify.
   (superpowers verification-before-completion.)

## Rejected (and why)

- superpowers' **1%-rule mandatory-skill-check bootstrap** — fights meta-brain's
  judgment routing; its SessionStart hook already injects the mandate every
  session (known noise). Serial-only implementers + universal design-gate —
  our file-scope/frozen-contract machinery + grill threshold supersede them.
- **openspec CLI dependency**, HTML eval-viewers, `.skill` packaging — we have
  our own npm distributor; mine the prose patterns, skip the tooling.
- addyosmani **spec/tdd/debug/planning skills** — dual-doctrine risk; ours is
  stricter. Its **ci-cd skill lacks the real hardening** (SHA-pinned actions,
  OIDC, provenance) — CI supply-chain remains an UNFILLED gap to source elsewhere.
- my_ai_skills **15 personal utilities** (Mac-pathed), **code-review architecture
  dogma** (hard-codes Hexagonal/MVVM), **sync-skills**.

## Open follow-ups

- Wire `validate-skills.mjs` into `cto-brain gate check` / `pack` (needs a package
  commit + test).
- Trigger-eval sets for the 3 colliding skills (meta-brain / cto-brain /
  cto-orchestration).
- Fill the CI supply-chain hardening gap (no studied repo had it done right).
- Retro-lint & trim the over-cap domain-skill descriptions.
