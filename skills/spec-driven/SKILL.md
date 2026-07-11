---
name: spec-driven
description: Model-invoked discipline for spec-driven development — no code without a spec, openspec-style change contracts without the openspec dependency. Fire when a feature, fix, or refactor is about to be built without a written spec, when scope is agreed and needs freezing before implementation, when implementation reveals the spec was wrong (drift), or on "spec this", "write the spec first", "spec contract". Scaffold with `cto-brain spec init <change-id>`; lint with `cto-brain spec check`. Not for exploratory spikes or one-line fixes.
---

# Spec-driven development — the contract before the code

The spec is the source of truth; code is its shadow. A written, frozen spec is
what lets tests mean something, lets parallel agents code against the same
seams, and lets tomorrow's session (or a different model) pick the work up.

## When to fire
- A non-trivial feature, fix, or refactor is about to be written with no spec.
- Scope just got agreed (e.g. after a `grill` interview) and needs freezing.
- Implementation contradicts the spec — **stop and amend the spec first**.
- Multiple agents are about to fan out and need frozen contracts to code against.

## When NOT to fire
- Exploratory spikes where the shape is unknown — spike, then spec the keeper.
- Trivial edits (a `chmod`, a typo, a one-line config). Doctrine is for
  load-bearing work.

## The change-contract workflow (openspec-style, built in)

1. **Propose** — `cto-brain spec init <change-id>` scaffolds
   `specs/changes/<change-id>/{proposal.md,tasks.md}`. Fill every required
   section: **Intent** (why), **Behavior** (what, observable), **Acceptance
   criteria** (the tests-to-be), **Non-goals** (the scope fence), **Frozen
   contracts** (schemas, interfaces, layouts agents code against).
2. **Freeze** — `cto-brain spec check` must pass (all sections present and
   non-empty). A frozen proposal is a contract: agents READ it, they don't
   edit it mid-flight.
3. **Implement** — hand each acceptance criterion to the `tdd` loop: red,
   green, refactor. One criterion at a time.
4. **Verify** — whole suite plus one end-to-end walk. Verdict is one of
   proven / UNPROVEN / blocked — a failing criterion is never "mostly done".
5. **Archive** — when shipped, the change dir stays as the decision record;
   its version history is the project's register of what was agreed and when.

## Rules that keep it honest
- **Spec drift is a bug.** Code silently diverging from the spec is the
  failure mode this skill exists to stop. Amend the proposal, then the code.
- **Acceptance criteria are executable.** Each one must map to a test a
  reviewer can run; "works well" is not a criterion.
- **Non-goals are load-bearing.** An empty Non-goals section means unbounded
  scope — `spec check` treats empty sections as errors for this reason.
- **The spec and tests ARE the portability layer.** A well-specced,
  well-tested change can be handed to any model or agent tomorrow.

## Pairs with
`grill` (surfaces the scope the spec freezes), `tdd` (implements each
criterion), `domain-modeling` (the spec uses CONTEXT.md vocabulary),
`agentic-learning-loop` (the archived change feeds the round-close ritual),
`cto-orchestration` (frozen contracts are the seams builder briefs cite).
