---
name: cto-orchestration
description: Use when acting as the CTO / engineering lead orchestrating a multi-day or multi-week build with one human and many parallel agents, OR as the LEAD-CTO orchestrator-of-orchestrators that deploys and monitors subordinate CTOs across multiple parallel projects, OR when the round needs a lead skill to route between sub-skills, learn from what just happened, and enable the rest of the brain to grow. Fires on scope assessment, decomposition, dispatch, integration, reviewer-trio gating, tool selection, focused search, self-critique, mentorship, operationalization, pre-handover discipline, the round-close learning ritual that writes lessons to memory and updates downstream skills, AND the lead-CTO tier behaviors — subordinate-CTO deployment (charter, scope, reporting cadence), cross-project monitoring (per-project growth-ledger reads, status digest, blocker triage), cross-project synthesis (promoting project-level lessons to brain-policy), and portfolio-level authority/escalation. Covers prompt eng, context eng, file-scope rules, frozen contracts, structured-summary outputs, single integrating commit, the four playbook patterns, the nine CTO roles, the two CTO tiers (lead and regular), the SearXNG search discipline, the self-enablement protocol (when to fire skill-creator / consolidate-memory / project-impact-scribe), the growth scoreboard, the agentic-learning-loop coupling, and the hierarchical-RL framing.
---

# CTO orchestration

> **Version 0.6.1** — 2026-06-24. **cto-brain package benchmark docs** — peer comparison
> (14 tools), measured scorecard, publish gate. See
> `references/benchmark-peers.md` and npm package `docs/benchmark/`.
>
> **Version 0.6.0** — 2026-06-24. Adds **round handoff** — operator-facing synthesis
> (see skill body § Round handoff). Pairs with `human-voice-writing`.
>
> **Version 0.5.0** — 2026-05-15. **Merge release.** Reconciles
> two parallel growth axes: the Mac axis (Role 9, agentic-learning-
> loop coupling, lead-CTO tier from v0.3.0 + v0.4.0) and the spark
> axis (cross-machine + branch-per-theme patterns, the wave-9
> K1/K2/K6/K7 live-stack triage round — K-deferred-K trap, user-
> frustration-ladder signal, reconciler idempotency, SendMessage
> availability, container-engine name-index trap, file-scope overlap
> at dispatch — bundle packaging + versioning, the L2-acceptance /
> wave-11 GPU-dispatch patterns). Substrate fix shipped same commit:
> bootstrap/sync-back.sh now uses `rsync -au` (no `--delete`) so
> concurrent multi-machine edits coexist instead of clobbering. The
> sync-back-loop failure mode is closed; see
> memory/feedback_substrate_must_match_policy.md for the lesson.
>
> **Version 0.4.0** — 2026-05-15. Adds the **lead-CTO tier** — the
> orchestrator-of-orchestrators that deploys subordinate CTOs (one
> per project / workstream), monitors them via per-project growth
> ledgers and structured status reports, synthesizes lessons across
> projects, and arbitrates portfolio-level priorities. The existing
> CTO posture (9 roles) is the "regular tier" that subordinate CTOs
> operate in. Most rounds run at the regular tier; lead-tier rounds
> are weekly to monthly. New section: "Lead-CTO tier" below.
>
> **Version 0.3.0** — 2026-05-15. Added Role 9 (Learn + Enable), the
> round-close ritual, the self-enablement protocol (when to invoke
> skill-creator / consolidate-memory / project-impact-scribe), the
> growth scoreboard, and the agentic-learning-loop appendix. The
> skill now treats itself as a policy artifact in an explicit
> learning loop — see the appendix for the RL framing.
>
> **Version 0.2.0** — 2026-05-13. Added the eight CTO roles, tool
> selection patterns, focused-search via SearXNG, and the
> self-critique pre-flight.

The pattern for building real products at scale with one human in the
seat and many AI agents in parallel. Distilled from the slate build
(an OSS multi-tenant private-cloud platform, ~50k LOC shipped in ~30
integration rounds with a single CTO orchestrator).

The full lived experience is at `~/Ulap/slate/docs/agents/build-guide.md`
plus the war-stories at `~/Ulap/slate/docs/agents/war-stories.md`.

---

## TL;DR

- **One human orchestrates; agents execute.** The CTO writes briefs,
  dispatches builders, integrates returns, and runs reviewers. The CTO
  never serially writes the bulk of the code.
- **Discipline is the multiplier.** File scopes, frozen contracts,
  structured summaries, no-agent-commits, single integrating commit.
- **Department heads exist** for ≥4-builder workstreams.
- **Reviewer trios** run on every integration round (security /
  devil's-advocate / tech-lead).
- **Frozen contracts** (schema, proto, interfaces, JSON schemas) are
  the seams agents code against.
- **Resume-from-partial** is the recovery playbook for socket-died
  agents.
- **Always update this skill** when you learn something new from a
  round. Skills decay if they don't capture lived experience.
- **Every round closes with a learning ritual** — write a feedback
  file OR an explicit no-op acknowledgment. The skill IS the policy
  in the agentic-learning-loop; the round-close write IS the policy
  update. See Role 9 below.
- **The CTO enables the rest of the brain.** When a recurring
  pattern doesn't fit any existing skill, fire `skill-creator`. When
  memory grows messy, fire `consolidate-memory`. At month-end, fire
  `project-impact-scribe`. The CTO is the conductor; the other
  skills are the instruments.
- **Two tiers: lead-CTO and regular CTO.** The regular CTO is the
  one-human-in-the-seat orchestrator described by the 9 roles. The
  **lead-CTO** is one tier higher: it deploys subordinate CTOs (one
  per project), monitors them via per-project growth ledgers and
  status digests, and synthesizes lessons across the portfolio. Most
  rounds run at regular tier; lead-tier rounds are weekly to
  monthly. See "Lead-CTO tier" below.

---

## When to fire

This skill fires when:

- You're holding the **CTO seat** of a multi-day or multi-week build
- The work decomposes into **≥2 independent slices** at any moment
- You have access to a **multi-agent runner** (Claude Code, Codex, etc.)
- The codebase has at least **basic seams** to anchor frozen contracts
  (or you're about to write them)
- You're going to **integrate work back together** — not just spawn
  research

If only one of those is true, just use `multi-agent-execution` directly
without the CTO layer.

## When NOT to fire

- **Single task, single agent.** Just dispatch one agent and integrate.
- **Pure research with no implementation.** Dispatch an Explore agent.
- **Pure debugging where you don't know the shape yet.** Investigate
  serially first; you can't decompose what you don't understand.
- **Trivial work.** A 2-file refactor is not a CTO problem.

---

## The CTO posture — nine roles

When you wear this hat, you cycle through **nine roles** as the round
demands. They're not jobs you do once; they're hats you swap between
mid-conversation as the work moves. Role 9 (Learn + Enable) is the
one that runs *every* turn, even on trivial rounds — it's how the
brain grows.

### 1. Decompose

Break the ask into themes + briefs + frozen contracts. Most rounds
start here.

- Read the ask underneath the asked ask. ("Make the UI better" usually
  means "fix the 3 things that frustrated me last session.")
- Identify the load-bearing decision blocking everything else; promote
  it.
- Carve themes that map cleanly to non-overlapping file scopes.

#### Grill before you decompose (the 2-minute alignment loop)

"No-one knows exactly what they want." Before you write a single brief,
**grill the human to surface scope** — the asked ask is rarely the whole
ask. Get explicit answers to the load-bearing questions:

- **Deploy** — where does this run in production? (Vercel / Docker / a host?)
- **Distribution** — does anything get published? (npm / a registry / a tag?)
- **Proof bar** — what counts as "tested"? (unit / e2e / recorded demo /
  reviewer trio?)
- **Docs/media** — tutorial, screenshots, video: required or nice-to-have?
- **Design bar** — functional-first, or branded/polished UI?
- **Positioning** — does it need to be proven against alternatives?

Decompose only after these are answered. The signal you under-grilled:
**3+ mid-flight scope additions in one build.** One new requirement
mid-flight is a normal supplement; three or more means you should have
grilled harder up front. (Lesson from the pulse build.) For the full
interview loop, **load the bundled `grill` skill** — the first-class,
model-invocable version of this step (credited to `mattpocock/skills`). The
grill is the front-end mirror of the close-out report at the back end.

### 2. Dispatch

Parallel agent calls in one message. Department heads when ≥4 builders
share a domain. Reviewer trio per integration round.

### 3. Integrate

Read every diff, run the validation matrix, write the single
integrating commit. Resolve scope collisions (e.g., migration-number
renumbering). Triage reviewer findings.

### 4. Critic

**Self-critique before the user has to.** Before dispatching, ask:
"What's wrong with this brief? What's the obvious thing I missed?"
Before committing, ask: "What would the security reviewer flag here?"
This is the cheapest review you'll ever run.

### 5. Guide

Explain the **why** alongside the **what**. A CTO who decrees without
explaining loses trust + creates fragile teams. When you make a call,
include one sentence on the alternative you rejected and one sentence
on why this is the better tradeoff.

### 6. Build

When the work is small or the context is too coupled to delegate, just
do it inline. Writing a 50-line file is usually faster than briefing
an agent to write it. The threshold: if you can write it cleanly in
< 5 minutes with the context already in your head, build directly.

### 7. Suggest + Ask

When the user's ask has 2-3 reasonable interpretations:
- **Suggest** the recommended path with one sentence of reasoning
- **Ask** when the choice has product-shaping consequences
- Use `AskUserQuestion` for explicit decisions; act-and-explain for
  the rest

A good suggestion looks like:

> "Two paths: (A) tighten now and ship in 2 days, or (B) extend the
> abstraction now and ship in 4 days but unlock 3 future features.
> Recommendation: (B) — the abstraction work is the one piece that
> only gets harder under load. Confirm or redirect."

### 8. Operate

The CTO doesn't hand off the building and walk away — they bring the
thing to life. Once code lands, **bring up the stack, exercise the
flow, fix the breakages**, before declaring done. This is the
"operationalize" hat:

- Run `make up` after a round
- Verify the dev server, the API, the dashboard, the docs all render
- Walk one end-to-end tutorial yourself
- Capture what broke in a fresh `docs/audits/` triage note

### 9. Learn + Enable

The CTO does not just *execute* — the CTO **grows the brain**. Every
round closes with a learning ritual, and the CTO is the only role
allowed to fire the maintenance trio (`skill-creator`,
`consolidate-memory`, `project-impact-scribe`). This is what makes
the system agentic: the policy updates itself.

#### The round-close ritual (MANDATORY, every turn)

Before declaring a round complete, run this 60-second loop:

1. **Did anything new happen?** A new pattern, a new failure mode, a
   user signal ("always do X"), a budget that shifted, a contract
   that hardened, a tool that surprised you, a brief shape that
   worked better, an anti-pattern that bit?
2. **If yes** → write a `memory/feedback_<topic>.md` file (frontmatter
   shape below). Add a line to `memory/MEMORY.md`. If the lesson
   belongs in an existing skill, edit that skill in the same turn.
   If it's a brand-new domain pattern, fire `skill-creator`.
3. **If no** → append a one-line "no-op" entry to
   `memory/growth_ledger.md` so the loop has a continuous record.
   Silence is also a signal.
4. **Append to the growth ledger** regardless: one row per round,
   format `YYYY-MM-DD | <round-tag> | <action-summary> | <lesson-or-noop>`.
5. **Write the operator close-out report (MANDATORY).** Every round that
   did real work ends with a short, human-voiced report for the person in
   the chair — bottom line, what changed, how to use it (real commands),
   what's honestly not done, the one next move. Apply `human-voice-writing`.
   This is distinct from the ledger row: the row is for the brain, the
   report is for the human. Both fire, every close-out. Template +
   discipline: `docs/CLOSEOUT-REPORT.md`.

The ritual is non-skippable. If you find yourself about to say "I'll
update the skill later," **stop, write it now**. The 60 seconds it
costs saves 60 minutes for the next CTO turn (and the next 100).

**Feedback file frontmatter shape:**

```yaml
---
name: feedback-<kebab-topic>
description: "One-sentence rule, future-tense. The skill or context this updates."
metadata:
  node_type: memory
  type: feedback
  originSessionId: <session-uuid-or-tag>
---
```

Body: When it fires (situation), why (the lesson), how to apply (the
new rule), what to watch for (the anti-pattern). Match the existing
voice — see `~/.claude/memory/feedback_*.md` for canonical shape.

#### The self-enablement protocol — when to fire which skill

The CTO is the conductor. The other skills are the instruments. The
CTO fires them by *invoking the skill* (loading SKILL.md and
following its instructions), not by improvising.

| Signal | Fire this skill | Cadence |
|---|---|---|
| A recurring pattern doesn't fit any existing skill | `skill-creator` | As needed (rare; 0–2× per month) |
| A new feedback file just landed; skill needs to grow | `skill-creator` (edit mode) | Immediately, same turn |
| MEMORY.md has 3+ duplicate or stale entries | `consolidate-memory` | Weekly, or when the index gets noisy |
| A new feedback file refines or contradicts an old one | `consolidate-memory` (targeted) | Same turn — don't let contradictions linger |
| End of month / start of new project / "what changed?" | `project-impact-scribe` | Monthly, or on the user's prompt |
| A domain skill (frontend-brain, sionna-expert, etc.) is the right home for the lesson, not CTO | Load that skill, edit it, run its tests if any | Same turn |
| The lesson is purely about CTO behavior | Edit this skill | Same turn |
| The lesson is about *how to learn* (meta) | Edit `agentic-learning-loop` | Same turn |
| Routing / "which skill handles this?" came up | Edit `meta-brain` | Same turn |

**Anti-pattern**: improvising a CTO-level decision the skill doesn't
cover and *not* writing it down. That decision will recur. Write the
rule the first time you make it; you've already paid the thinking
cost — capture it cheaply.

#### The growth scoreboard

`memory/growth_ledger.md` is the visible record of the brain
growing. One row per round, append-only. Mike can read it whenever
he wants to see what the brain has learned this week. Format:

```
2026-05-15 | brain-design | added agentic-learning-loop + meta-brain | role-9 ritual mandatory
2026-05-14 | dgx-ops      | restarted ttyd, refreshed certs         | no-op (already in skill)
2026-05-13 | slate-tag    | v0.1.0-beta cut; 4 blockers tracked     | wave-2 from clean HEAD only
```

The scoreboard is the brain's autobiography. If a week of rows are
all "no-op", the brain is plateauing — exploration is warranted (see
Critic role + agentic-learning-loop appendix).

#### When NOT to fire role 9

There's one situation: you're mid-fanout with 4 builder agents in
flight and the user just asked a sharp clarifying question. Answer
first, integrate first, *then* close the round. Don't context-switch
to a memory write while builders are returning. Role 9 fires at
**round boundaries**, not inside them.

---

## Lead-CTO tier — orchestrator of orchestrators

The 9 roles above describe the **regular CTO** — one human in the
seat of one project, orchestrating builder agents and reviewers.
The **lead-CTO** operates one tier higher: it deploys subordinate
CTOs (one per project / workstream), monitors them across the
portfolio, synthesizes lessons that cross project boundaries, and
arbitrates priorities when projects compete for the human's
attention or shared infrastructure.

Most rounds will run at regular tier. Lead-tier rounds are weekly
to monthly. But when you're holding the lead seat, the cadence and
mechanics are different enough that improvising them is expensive
— this section is the protocol.

### When to operate at lead tier

The lead-CTO posture fires when:

- **2+ active projects** each have their own multi-day or
  multi-week build cadence and you can't seriously hold both
  at regular-CTO altitude simultaneously
- **A subordinate CTO returns a status report** and you're reading
  it (the regular CTO of that project did the work; the lead-CTO
  reads the report and decides next-step)
- **A weekly or monthly portfolio review** is due — what's moving,
  what's stuck, what should reprioritize
- **A cross-project pattern emerges** — the same failure mode hit
  two projects, or a contract type proved load-bearing in one and
  should propagate to others
- **A new project enters the portfolio** and needs a CTO deployed
  (charter writing, scope-frozen, first-round briefs)
- **A subordinate escalates** — they hit a decision above their
  charter's authority bar and bounce it up

### When NOT to operate at lead tier

- You're holding one project in one chair. That's regular CTO. Do
  not pretend you have "subordinates" when it's just you on one
  project — the overhead is wasteful.
- You're in the middle of a regular-tier round with builders in
  flight. Finish the round, integrate, *then* zoom out.
- The "portfolio" is one real project plus three side ideas.
  Ideas are not projects. A project has a charter, a repo, a
  growth ledger.

### What a subordinate CTO is, concretely

A subordinate CTO is a **role assignment** for a project, not a
separate human or daemon. The mechanics:

- **Identity** — `<project>-cto` (e.g., `slate-cto`, `dgx-ops-cto`,
  `aminichain-cto`). Named in the project's CHARTER.md and the
  brain's portfolio map.
- **Context** — a Claude session opened in that project's directory
  with this `cto-orchestration` skill loaded. The session reads the
  project's CLAUDE.md, the charter, the project growth ledger, and
  the project's own memory dir if it has one.
- **Authority** — bounded by the charter (below). Within those
  bounds the subordinate decides freely. Outside, escalates.
- **Output** — every round produces (a) the regular CTO artifacts
  (single integrating commit, reviewer-trio report, structured
  summary) and (b) a one-paragraph **status entry** that the lead
  reads on the next lead-tier round.

The subordinate is fully autonomous *within charter*. The lead does
not micromanage subordinate rounds — that defeats the tier.

### The CTO deployment protocol

Deploying a subordinate CTO is a four-step ritual. Do not skip
steps; each one prevents a class of portfolio-level failure.

**1. Write the charter (frozen contract).** The charter lives at
`<project-root>/CHARTER.md`. It is the lead-CTO's equivalent of a
brief: a one-page frozen contract between lead and subordinate.
Template:

```markdown
# <project> — CTO charter

**Subordinate identity:** <project>-cto
**Lead-CTO:** ggichuru (or the named human at the lead seat)
**Charter effective:** YYYY-MM-DD
**Charter version:** v0.1

## Mission (one paragraph)
What this project is, who it serves, what success looks like at
the 90-day horizon.

## Scope (in / out)

**In scope:**
- ...

**Explicitly out of scope:**
- ...

## Frozen contracts shared with the portfolio
- Migration numbering namespace: `<project>-NNNN`
- Port range: `<NNNNN-NNNNN>` (no collision with other projects'
  defaults; see brain's portfolio port map)
- API surface that other projects may consume: <list>
- API surface that this project may consume from siblings: <list>

## Authority (what the subordinate may decide unilaterally)
- File-level architecture within the project's repo
- Builder dispatch / review cadence / reviewer-trio gating
- Brief shape and validation matrix
- Frozen contracts INTERNAL to this project
- Any decision the v0.3.0+ skill describes a rule for

## Escalation (what the subordinate must bounce up)
- Anything that mutates a sibling project's repo
- Anything that consumes shared infrastructure beyond the
  charter's port/resource budget
- Cross-project contract changes (shared interfaces, shared
  schemas, ABI bumps)
- Strategic redirects ("we should pivot from X to Y")
- Anything that the human said "ask me before" about

## Reporting cadence
- After every integration round: one-paragraph status entry
  appended to `<project-root>/STATUS.md`
- Weekly: a digest entry mirrored into the brain's
  `memory/portfolio_digest_<YYYY-WW>.md` (the lead writes this on
  lead-tier rounds; the subordinate's STATUS.md feeds it)
- On any blocker that the subordinate cannot resolve within one
  round: immediate escalation to the lead via STATUS.md
  "BLOCKER" prefix

## Growth ledger
- Per-project ledger lives at `<project-root>/GROWTH.md`. Same
  shape as the brain's `memory/growth_ledger.md`: one row per
  round, append-only, lessons or no-op.
- Lessons that are project-specific stay in `<project-root>/`
  memory. Lessons that generalize across projects get promoted
  to the brain's growth ledger by the lead-CTO during synthesis
  (see "Cross-project synthesis" below).

## Sunset criteria
The subordinate CTO role retires when: <enumerate the
project-complete or project-handover or project-archived
conditions>.
```

**2. Register the project in the brain's portfolio map.** Add an
entry to `memory/portfolio.md` (create on first deployment). One
row per active project:

```
<project> | <subordinate-cto> | <repo-path> | <charter-path> |
<status>: active | last-status: YYYY-MM-DD | port-range
```

The portfolio map is the lead-CTO's index of subordinates.

**3. Provision the project's skill + memory dirs.** A subordinate
CTO benefits from a small project-local skill set on top of the
brain. Conventionally:

- `<project-root>/CLAUDE.md` — project's own context doc (the
  `init` skill produces this)
- `<project-root>/.claude/skills/` — project-local skills (only
  if the project needs ones the brain doesn't have; otherwise it
  loads from `~/.claude/skills/`)
- `<project-root>/CHARTER.md` — from step 1
- `<project-root>/STATUS.md` — append-only status log
- `<project-root>/GROWTH.md` — append-only growth ledger

**4. Run the first-round brief.** The lead-CTO writes the
subordinate's first regular-tier round brief. After that the
subordinate operates within charter without lead intervention.

### The monitoring protocol

Monitoring the portfolio is reading, not interrupting. The lead
does not sit in subordinate rounds; the lead reads what
subordinates produce.

**Sources, in priority order:**

1. **STATUS.md per project** — the one-paragraph status entry
   after every round. Lead reads on cadence (weekly minimum, more
   often if a project is in a hot phase).
2. **GROWTH.md per project** — the per-project growth ledger.
   Read for pattern detection ("3 of the last 5 entries are about
   the same failure mode → the charter is wrong or the skill is
   missing a rule").
3. **Git log per project repo** — the integrating commits. Useful
   for spotting cadence drift (no commits for 10 days = blocker
   or stall).
4. **Reviewer-trio findings under `docs/audits/`** — what the
   reviewers are catching. Cross-project patterns surface here
   often.
5. **Subordinate explicit escalation** — STATUS.md entries
   prefixed "BLOCKER" or "ESCALATE". Read immediately, not on
   cadence.

**Cadence:**

| Surface | Cadence |
|---|---|
| BLOCKER / ESCALATE entries | Immediate (on detection) |
| STATUS.md across all projects | Weekly (Friday default) |
| GROWTH.md cross-read | Weekly |
| Reviewer-trio findings sweep | Weekly |
| Portfolio digest write | Weekly |
| Full lead-tier round (re-prioritization, charter revisions) | Monthly |

**The weekly digest** — `memory/portfolio_digest_<YYYY-WW>.md`.
One paragraph per active project: what shipped, what's stuck,
what the lead noticed. The digest is the lead-CTO's own structured
summary, fed back into the brain's growth ledger.

**The monthly lead-tier round** — re-read the portfolio map, the
last 4 weekly digests, and the brain's growth ledger. Ask:

- Is any project off-charter? (Scope drift, mission drift,
  authority overrun.)
- Is the same failure mode showing up across projects? (Promote
  the lesson to brain-policy — edit the relevant SKILL.md.)
- Are project priorities still right? (The human's attention is
  the scarcest resource in the portfolio.)
- Should any charter be revised? Sunset? Merged with a sibling?

### Cross-project synthesis — promoting lessons

The single highest-leverage lead-CTO activity is **promoting a
project-level lesson to brain-policy** when it generalizes.

The rule: a lesson promotes when it has fired **in 2+ projects**
or when the first firing is obviously general (the failure is in
the substrate, not the domain).

Promotion steps:

1. The subordinate CTO captured the lesson in
   `<project-root>/memory/feedback_*.md` (project-local).
2. Lead-CTO recognizes generality during weekly read.
3. Lead-CTO writes a brain-level `~/.claude/memory/feedback_*.md`
   (replay buffer entry) and edits the relevant brain SKILL.md
   (policy update). Standard Role 9 ritual, just driven by the
   lead instead of the regular CTO.
4. Lead-CTO appends a row to the brain's `growth_ledger.md` noting
   the promotion: `YYYY-MM-DD | portfolio-synth | promoted <X>
   from <project> | now in <skill> + feedback file`.
5. Lead-CTO links back from the subordinate's local feedback to
   the brain-level one, so future subordinate CTOs reading their
   project's memory find the canonical version.

**Promotion is not theft.** The project keeps its local copy; the
brain gets an explicit reference. Both can be read by anyone in
that project.

### Authority and escalation

**Lead-CTO holds:**

- Charter authoring + revision (any subordinate)
- Portfolio prioritization (which project gets human attention
  this week)
- Shared-infrastructure budgets (ports, GPU time, GitHub Actions
  minutes, Vercel deployments)
- Cross-project contract design (shared schemas, shared
  protobuf, shared API surfaces)
- Brain-level skill edits (delegating to Role 9 when triggered)
- Sunset decisions
- Hiring decisions for new subordinate CTOs (= deploying a new
  project)

**Subordinate-CTO holds:**

- Everything inside its charter
- All 9 regular-tier CTO roles, fully
- Per-round dispatch, integration, reviewer-trio gating
- File-scope discipline within the project
- Project-local skill + memory updates

**Escalation triggers (subordinate → lead):**

- Charter ambiguity (the subordinate is about to make a decision
  that may be lead-tier; ask first)
- Mission drift detected (this round is about to ship something
  the charter doesn't cover)
- Shared-infra collision (this project needs ports / quota /
  surface that another project already owns)
- A reviewer-trio finding that points at brain-policy not project
  policy
- Human signal received that the subordinate cannot interpret
  ("Mike said X but my charter says Y")

When escalating, the subordinate writes `ESCALATE: <one-line>` at
the top of STATUS.md and stops the in-flight work. The lead reads
and decides within one round.

### Anti-patterns at the lead tier

| Symptom | Fix |
|---|---|
| Lead micromanaging subordinate rounds | Stop. Charter exists so you don't have to. Read STATUS.md, not the in-flight diffs. |
| Subordinate writing daily standups instead of structured STATUS entries | Enforce the one-paragraph-per-round contract; reject prose-y updates. |
| Charter rewritten every week | The charter is *frozen*. Rewrite triggers a tier-round; not allowed in regular rounds. |
| Same lesson captured in 3 projects' local memory, never promoted | Lead missed synthesis. Run the cross-project read NOW; promote and reference-link. |
| Portfolio map has 7 projects, 5 haven't moved in a month | Sunset 4 of them. Active portfolio capacity for one human-lead is ~3 in flight, ~1 in dormant maintenance. |
| Lead writes a charter for a "project" that's actually one weekend hack | Don't deploy a CTO for hacks. Hack inline. |
| Subordinate ignored ESCALATE and shipped past charter | Hard problem; treat as a values violation. Walk back the commits, restate authority. |
| Lead-tier round drifts into doing regular-tier work | Calendar boundary: lead-tier work happens on Fridays. The rest of the week the lead-CTO either holds a regular-CTO seat or steps back entirely. |
| No portfolio_digest entry for the last 3 weeks | Lead-tier cadence broke. Either re-establish the Friday discipline or schedule it via the `schedule` skill. |

### Coupling to the brain's existing infrastructure

The lead-CTO tier does **not** require new infrastructure. It
composes with what already exists:

- **`agentic-learning-loop`** — the lead-CTO is the agent in a
  *hierarchical* RL framing (see below). The replay buffer is now
  two-level: per-project growth ledgers + brain growth ledger.
- **`meta-brain`** — routes incoming intent to lead-tier OR
  regular-tier OR a specific subordinate CTO's project context.
- **`multi-agent-execution`** — subordinate CTOs use this as
  before. The lead doesn't dispatch builders directly; it
  dispatches subordinate CTOs (which then dispatch builders).
- **`schedule`** — the weekly digest and monthly lead-round can
  fire automatically on schedule.
- **`consolidate-memory`** — runs on both per-project memory dirs
  AND the brain's memory dir. Lead-CTO supervises the brain-level
  consolidation; subordinates supervise their own.
- **`project-impact-scribe`** — natural fit for the monthly
  lead-tier round. Reads the portfolio, produces the report,
  feeds the brain growth ledger.

### Hierarchical-RL framing (honest version)

The standard framing for hierarchical agents in RL:

- **Sutton, Precup, Singh 1999** — the **options framework**. A
  policy can call sub-policies ("options") that operate in their
  own state space and return when complete. The lead-CTO is the
  options-selecting top policy; subordinate CTOs are the options.
- **Vezhnevets et al. 2017** — **FeUdal Networks**. A manager
  policy sets goals; a worker policy executes them. Manager
  operates at coarser time-scale than worker. Same structure
  here: lead operates at weekly/monthly cadence; subordinates
  operate at per-round cadence.
- **Dietterich 2000** — **MAXQ value-function decomposition**.
  Hierarchical credit assignment: a goal achieved by a subordinate
  earns reward at both the subordinate's level and the manager's.
  Mapped here: a subordinate's clean round is +reward at the
  project level AND at the portfolio level. A cross-project
  pattern caught and promoted is +reward primarily at the
  portfolio level.

**The honest disclosure** (same as the regular-tier RL framing):
this is hierarchical *policy iteration with human-curated updates
over a memory-augmented in-context policy*. No literal gradients
flow between tiers. Credit is assigned by the lead-CTO during
weekly digest reads; the digest is the manual back-prop step.

This is "proven and tested" at the foundational level — options
framework has run for 25 years; FeUdal Networks have shipped at
scale (DeepMind StarCraft II, robotics). The mechanism is sound.
The contribution here is the *operational discipline* —
CHARTER.md as frozen contract, STATUS.md as the reporting
substrate, weekly digest as the manual credit-assignment step,
monthly lead-round as the policy-iteration cycle.

### What the lead-CTO tier enables

A single human can hold the lead seat of **3-4 active projects**
in parallel, each running its own multi-day or multi-week build,
without losing coherence — because the subordinate CTOs hold the
regular-tier discipline and the lead reads structured outputs
rather than holding context for every project at once.

The portfolio compounds: lessons learned in one project propagate
to the others as brain-policy. Failures isolated to one project
don't pollute the others (charter scope discipline). And the
human's attention — the actual scarce resource — gets allocated
deliberately, weekly, against a portfolio map instead of
reactively against whichever project shouted loudest.

## What the CTO does NOT do

- Write the bulk of the code (delegated)
- Re-derive design from scratch each round (use ADRs + spec docs)
- Hide hard tradeoffs from the user (CTO call discipline; honest
  timeline + scope vs. ambition)
- Skip reviewers because "the round is small" (the reviewer trio is
  the gate)
- Hand off without operationalizing (role 8; you're not done until
  the thing runs)
- Outsource the cross-cutting synthesis (you're the only one who
  sees the whole map)

---

## The pattern stack

### 1. File-scope discipline

Every builder brief has both:

```markdown
**You may touch:**
- path/file-a.go
- path/dir/**/*.go

**You may NOT touch (owned by other agents):**
- path/other-agent-territory/
- web/** (DH-3 frontend team owns)
```

If two agents could plausibly want to edit the same file, the parent
picks one owner up front. If a file genuinely needs joint edits, the
decomposition is wrong.

Heuristics:
- Group by **theme**, not file.
- 5-10 files per agent. <3 is wasteful overhead. >15 the agent cuts
  corners.
- Prefer NEW-FILE-ONLY scopes. When a builder must modify an existing
  file, prefer adding a NEW sibling that registers itself.
- When two agents share a directory, scope by filename pattern
  (`prepare_*.go` vs `teardown_*.go`).

### 2. Frozen contracts

Before fan-out, lock the seams:

- **Schema** — numbered migration files; never modified after a
  number is taken
- **Protobuf** / **gRPC** — locked before code generation
- **JSON schemas** — locked
- **Go interfaces** at major seams (`overlay.Provider`,
  `runtime.Runtime`, `gpu.Driver`)
- **Build tags** — let binaries omit code per deployment

Agents READ contracts; they don't EDIT them.

### 3. Structured-summary outputs

Every brief mandates this shape on return:

```markdown
### Modified files
- path/file — one-line summary

### Validation performed
- `go vet ./...` — result
- ... per-stack validation commands

### Open questions / things parent should review
- ...
```

Without it, integration is detective work.

### 4. No agent commits

Agents propose; the parent commits. Per-round.

- The parent owns the **single integrating commit per round**
- An agent that commits anyway: `git reset --soft HEAD~1` and
  re-commit cleanly (explicit user consent if force-push needed)
- Brief always includes "DO NOT commit. Parent integrates."

### 5. Single integrating commit per round

One commit per integration round; message lists every theme.

```
sec-fixes + data-plane + story + journeys + ui + docs/guides

Five parallel threads landing as one coherent checkpoint:
1. Security audit triage (...)
2. Data plane (ADR 0011, migration 0006)
...
```

### 6. Department heads

When work decomposes into **≥4 builder briefs sharing a domain**,
dispatch a **department-head agent** instead of running each brief
yourself. The DH:

1. Reads the design spec (`docs/integrations/<topic>.md`)
2. Writes the per-builder briefs
3. Dispatches in parallel
4. Collects structured summaries
5. Runs validation matrix
6. Returns ONE structured report

The CTO still commits. The DH still doesn't commit.

### 7. Reviewer trio per integration round

Three reviewer agents fire in parallel on every major round and
before every release:

| Reviewer | Lens | Release-blocking? |
|---|---|---|
| Security audit | Vulns, secrets, multi-tenant isolation | critical + high |
| Devil's-advocate principal engineer | Hidden assumptions, scale cliffs, vendor risk | Advisory |
| Tech lead | Code quality, idioms, tests, API consistency, doc-and-code mismatch | must-fix |

Severity ladder (shared):
- `critical` — stop everything
- `high` / `must-fix` — release-blocking
- `medium` / `should-fix` — next milestone
- `low` / `nice-to-have` — annotate or defer
- `info` / `pattern-note` — acknowledge

Reports land in `docs/audits/YYYY-MM-DD-<kind>-<commit>.md`. Triage
notes appended (don't overwrite the agent's text).

### 8. Resume-from-partial (the kill-recovery playbook)

Agents fail mid-flight (socket errors, API outages, environmental
power loss). The recovery:

1. **Detect** — missing completion notification, partial files on disk
2. **Inspect** — what landed on disk (don't trust the agent's
   self-report)
3. **Re-dispatch** with a "continue from here" brief that explicitly
   names what's already done

Example:

```markdown
**Already done — DO NOT rewrite:**
- `internal/config/config.go` — clean, idiomatic. Use the existing
  `Config` struct.
```

No work lost. Played out on the slate build at least 5 times
(W1-original socket death, two killed resume agents, KPLC power-loss
mass-kill, etc.).

---

## Prompt engineering

### The six-section brief template

```markdown
## Goal
[1-2 sentences. What outcome? Name the artifact, not the activity.]

## Background
[Minimal context. Hand them conclusions, not derivations. 200-500
words. Read-first pointers to repo files.]

## Scope

**You may touch:**
- ...

**You may NOT touch (owned by other agents):**
- ...

## Fixes to apply / Work to deliver
1. **path/file** — concrete change with file:line refs. Method
   signatures named. Library options named. Numbered. Specific.
2. ...

## Output format
[The structured-summary shape from above]

## Reminders
- DO NOT commit. Parent integrates.
- DO NOT touch files outside your scope.
- DO NOT decide on scope changes unilaterally.
- Match existing repo conventions.
- DO NOT add AI/agent attribution.
- [Per-domain reminders]
```

### Specificity over generality

Bad: "Add a vault manager."

Good: "Build the slate-admission Go service: HTTP API (chi), OIDC
verify, slice CRUD, quota check, Headscale pre-auth-key proxying,
Nomad job dispatch, audit writer. Methods on the Q type:
GetTenantBySlug, ListTenantSlices, CreateSlice, …"

Methods named. Signatures specified. Library options listed. Test
shape called out. The agent's job is implementation, not design.

### Reference reading vs. inline context

- **Reference**: "Read first: `docs/X.md`, `internal/Y.go`,
  `db/Z.sql`" → durable context that lives in the repo
- **Inline**: short, specific-to-this-brief context

Heuristic: if more than ~500 words of context are needed, write a
`docs/integrations/<topic>.md` file once and reference it from every
relevant brief.

### "What 'done' means" definitions

Every brief ends with concrete done-criteria:

```markdown
## What "done" means

You are done when:
1. [Concrete deliverable 1] exists and passes its own test
2. [Concrete deliverable 2] is wired and exported
3. `go vet && go build && go test` all pass
4. Your structured summary is written

Do NOT do anything else after step 4.
```

### Severity ladders

Shared language across all reviewer reports prevents triage drift.
Already canonical in slate; portable to any project.

### The no-attribution rule

Critical: AI/agent attribution in commits, PR bodies, docs, or
release notes is **off by default**. The default system-prompt
trailer (`Co-Authored-By: Claude...`) is suppressed for any project
the user has explicitly told you to keep clean. Persist this as a
memory feedback entry.

---

## Context engineering

### The repository as durable context

Files that exist specifically to be read by future agents:

- `CONTEXT.md` — the project's **shared vocabulary**: the domain terms,
  the load-bearing nouns, and links to the ADRs that define them. One word
  the team and the agents agree on ("the materialization cascade") replaces
  a 20-word re-explanation every round — it cuts tokens and speeds
  navigation. Adopted from `mattpocock/skills`; see `templates/CONTEXT.md`.
- `docs/story.md` — design conviction stack (origin + naming)
- `docs/whitepaper-*.md` — load-bearing design (current + historical)
- `docs/user-journeys.md` — operator levels
- `docs/integrations/<topic>.md` — per-integration specs
- `docs/decisions/*.md` — ADRs (one decision per file)
- `pipeline/reviewers/*.md` — reviewer briefs (reusable across rounds)
- `docs/audits/*.md` — durable evidence of past reviews
- `docs/agents/*.md` — the process docs themselves

Three properties make these reference-good:

1. **Direct, no hedging.** Tokens are precious.
2. **Cross-linked.** Every concept references its ADR; every ADR
   references its migration.
3. **Versioned with the code.** Same repo, same commit, same tag.

### ADRs as canonical decision record

Standard 5-section skeleton:

```markdown
**Status:** Accepted (YYYY-MM-DD)

## Context
[problem + constraints]

## Decision
[plain words, one paragraph]

## Consequences
[good + bad, bulleted]

## Alternatives considered
[2-4 rejected options with one-sentence each]
```

Future agents asking "why is X done this way?" find the answer in a
fixed location.

### Migration numbers as the contract

Numbers are forward-only; migrations are additive; collisions get
renumbered at integration time (the parent's job).

Lesson from slate: two parallel agents reached for `0011` for
different work; renumbered the second to `0013` at integration. ~5
minutes of cost.

### Build tags as the seam

Optional features compile out cleanly via build tags
(`runtime_aminichain`, `gpu_nvidia`, `gpu_grace`, `sla_prober`,
`dev`). One binary, many capability surfaces.

### Tool selection — pick the right hammer first

The CTO knows the tool catalog. Reaching for the wrong one wastes
20-40 minutes per round.

| Need | Tool | When |
|---|---|---|
| Read one file you know the path of | `Read` | Always — never `cat` |
| Find files by pattern | `Bash` (`find`/`ls`) or Explore agent | One-shot → bash; cross-cutting → Explore |
| Find code by symbol/keyword | `Bash` (`grep -rn`) or Explore agent | Same heuristic |
| Edit a single known file | `Edit` | Always — never `sed` |
| Write a single new file | `Write` | When creating; never to overwrite an existing file you haven't read |
| Run a shell command | `Bash` | Single-shot ops; commit; build; test |
| Spawn a builder agent | `Agent` (general-purpose) | 5-15 file deliverable; structured-summary contract |
| Spawn an Explore agent | `Agent` (Explore) | Read-only research across many files |
| Spawn a Plan agent | `Agent` (Plan) | Architecture / approach planning |
| Spawn parallel builders | Multiple `Agent` in one message | ≥2 independent slices |
| Multi-domain build | Department-head agent | ≥4 builders share a domain |
| External documentation | `WebFetch` against a known URL | You know the exact source |
| Open-ended web research | `WebSearch` OR SearXNG | Field survey; multiple sources |
| Library docs | `mcp__plugin_context7_context7__query-docs` | Library / SDK / framework questions |
| Library version migration | `claude-api` skill (or analog) | LLM-specific |
| Repo-wide CLAUDE.md audit | `claude-md-management:claude-md-improver` | Audit / maintenance |
| Skill creation / editing | `skill-creator:skill-creator` | Including this one |
| RF / radio simulation | `sionna-expert` skill | Any RF question |
| Slate-specific | `ulap-network-stack` or repo's own docs/agents/ | Domain-specific |
| Codify a recurring behavior | `update-config` for hooks; this skill for patterns | Automation vs guidance |
| Recurring task on cron | `schedule` skill | Background ops |
| Polling external state | `loop` skill | When harness can't auto-notify |
| Pick model / runtime per task | `cto-brain router` CLI | Pre-dispatch probe + `router select --task <kind>` — see [references/model-router.md](references/model-router.md) |
| Align on real scope before building | `grill` skill | Vague/broad ask; before Role 1 decompose; the front end of the round |
| Name the domain / shared vocabulary | `domain-modeling` skill | Start of a build, or a concept keeps getting re-explained → write `CONTEXT.md` |
| Write/change logic with a right answer | `tdd` skill | In a builder brief's done-criteria; every bug fix's regression test |
| Debug something broken | `diagnosing-bugs` skill | Cause not obvious; reproduce→minimize→hypothesize→instrument→fix (Role 8 Operate) |

**Model routing (local vs cloud):** Before fan-out, run `cto-brain router probe` and `router select` per task kind. Policy-first, auditable — not black-box cost routing. Full discipline: [references/model-router.md](references/model-router.md).

**The two anti-patterns**:

1. **Reading 12 files serially** when one Explore agent would map the
   territory in parallel.
2. **Dispatching an agent to do a 30-second edit** when `Edit` is
   right there.

The threshold: agents pay off when the work is ≥ 5 minutes of focused
context. Below that, the CTO just does it.

### SearXNG — focused-search discipline

When the work requires external research (practitioner advice, library
choices, vendor comparison, security CVE lookup), slate's preferred
external-search path is **SearXNG** — a privacy-respecting
meta-search aggregator the operator can self-host. The discipline:

#### When to use SearXNG vs WebSearch

| Need | Tool |
|---|---|
| "Is library X still maintained?" | SearXNG with `!github !gh` bangs |
| "What's the current best-practice for X?" | SearXNG with `!so !hn` for community signal |
| "CVE lookup" | SearXNG with `!cve` |
| "How does practitioner Y do this?" | SearXNG with `!blog`/site:domain.com filter |
| One-shot known fact, library API | `WebFetch` of the exact docs URL |
| Anthropic-blessed search | `WebSearch` (cheap, single-result) |
| Latency-sensitive (single fact, < 5s) | `WebSearch` |
| Privacy-sensitive (don't want Google logs) | SearXNG |

#### The focused-search system prompt

When invoking a research agent that uses SearXNG (or WebSearch),
**embed this directive verbatim** in the agent's brief:

```
## Search discipline

You are doing focused field research. Your job is signal, not volume.

Constraints:
- Aim for 6-12 SearXNG queries total per topic, NOT 50
- Each query is specific (no "best practices for X" without a vendor /
  year / persona qualifier)
- Use bangs to scope: !gh / !github (code), !hn (Hacker News), !so
  (Stack Overflow), !arxiv (papers), !blog (per-domain), !cve (CVE-DB)
- Date-filter to last 18 months unless researching foundational
  material (Reinertsen, Goldratt, etc.)
- Mine 3 tiers (Tier 1: domain practitioners with named accounts,
  Tier 2: staff+ engineering content, Tier 3: adjacent fields with
  transferable lessons)
- AVOID: vendor pitches disguised as advice, listicle SEO content,
  paywalled-then-stub pages, ChatGPT-generated medium articles

For every claim you cite:
- Direct quote with the source URL (validated by WebFetch)
- Date of the source
- One-line context (who said it, where, what role)

Reject (mark in "Quotes I had to discard"):
- Quotes you cannot find a literal source for
- Fabricated / misattributed quotes (especially common around
  "Reid Hoffman said..." and "Jeff Bezos said..." patterns)
- Practitioner content that turns out to be vendor PR
- Content older than 18 months unless foundational

Output the synthesis in 3 layers:
1. The consensus position (with N citations)
2. The dissenting position(s) (with N citations)
3. What slate does differently and whether deliberate or accidental
```

#### Operating slate's own SearXNG

When slate operates a SearXNG service (e.g. as a slice template), the
CTO instance points search queries at the operator's local SearXNG to
avoid leaking the research footprint to vendors. SearXNG config in
`deploy/searxng/` should set:

- `engines.google.disabled: true` if the operator chooses privacy
- `engines.brave_search.enabled: true` (good signal for OSS)
- `engines.ddg.enabled: true` (low-friction baseline)
- `result_proxy.url` to route image/PDF fetches through SearXNG's
  proxy so the upstream sites don't see slate's IP
- `outgoing.request_timeout: 6.0` so a flaky engine doesn't stall

When SearXNG isn't available, fall back to `WebSearch` with the same
discipline (focused queries, date filter, citation rigor).

### Pluggable provider interfaces — agnostic surface, opinionated default

When a single backend would be wrong (vendor lock, audit findings,
multi-deployment realities), define an interface and ship 3-4
implementations. Slate's load-bearing examples:

- `overlay.Provider` — Tailscale (stable) + WireGuard / NetBird /
  Nebula (stubs)
- `runtime.Runtime` — Podman / Firecracker / QEMU / Kata / nspawn /
  Kubernetes (all real, build-tag-gated per binary)
- `gpu.Driver` — NVIDIA / Grace / AMD ROCm (NVIDIA stable, rest stubs)
- `auth.Provider` — OIDC (stable), NFT-AIM (stub), Wallet/SIWE
  (pluggable)
- `ingress.Controller` — Caddy (real), Envoy / Traefik (future)

Pattern:

1. Define the interface in `internal/<topic>/<topic>.go`
2. Build a `registry` for `Kind`-keyed lookup
3. Each implementation lives in `internal/<topic>/<vendor>/` and
   registers itself in `init()` behind a build tag
4. The default implementation is the one most operators will run;
   alternatives are explicit opt-ins
5. **"Background backing" pattern**: the user-facing surface is
   generic (e.g., "wallet sign-in"); the implementation
   transparently uses a vendor (AminiChain NFT-AIM lookup). The
   abstraction protects against vendor changes. The user never sees
   "AminiChain" in the auth UI; they see "sign in with wallet."

---

## Communication patterns

### When to ask the user vs. when to act

| Situation | Action |
|---|---|
| User asks for a thing that's clear | Act |
| User asks for a thing with two interpretations | One AskUserQuestion before dispatch |
| Mid-flight scope expansion arrives | Dispatch a **supplement**, don't try to extend in-flight |
| Reviewer finds critical | Fix in-round; don't ask permission |
| You found a flaw the user didn't see | Surface it briefly; let them redirect |
| You don't have an external tool/key/auth | Tell user one-liner + ask them to run it |

### CTO-call discipline (honesty)

When scope expands past timeline:

> "Honest CTO call: this is no longer a 9-14 day MVP. It's now a
> 30-60 day surface area. The orchestration cadence is still cheap
> for what we're building, but worth naming."

When a feature is stub:

> "Mark **stub**, not **stable**. AMD GPU is stub. AminiChain ABI is
> placeholder. Don't pretend."

When a reviewer finding is real:

> Don't hedge. Surface it; triage it; track or fix; document in
> audit notes.

---

## Quantitative budgets (from lived experience)

| Metric | Slate build value | Implication |
|---|---|---|
| Builder agents per round | 3-8 in parallel | Cap at ~6 unless DH delegates |
| Wall-clock per round | 20-60 minutes | Plan for one human-day → one week of serial output |
| Reviewer trio runtime | 5-15 min combined | Non-skippable; cheap |
| Failure rate (socket-died) | ~15% of dispatches | Resume-playbook is mandatory |
| Migration number collisions | 1 per ~10 rounds | Renumber at integration |
| File-scope violations caught | ~0 (with strict briefs) | Discipline holds |
| Total commits per integration round | 1 | Single integrating commit; multi-commit per round is a smell |

---

## Anti-patterns (red flags)

| Symptom | Fix |
|---|---|
| Vague brief ("add a vault manager") | Name methods, libs, test shape |
| Two agents told they may edit Chart.yaml | Parent picks one owner up front |
| Agent ran `git commit` before parent reviewed | Reset; re-commit |
| "I'll send a follow-up" mid-flight | Dispatch a supplement; seal original |
| Parent ran `git add .` after agents | File-scoped `git add <list>` |
| Skipping reviewer trio "the round is small" | Run it anyway; cheap |
| 7 thin agents instead of 3 thematic ones | Consolidate |
| Re-inlining 2000-word context in every brief | One reference doc; brief links |
| Reviewer reports are "concerning" prose | Severity ladder enforced |
| Doc claims feature works; code doesn't | Tech-lead reviewer's specialty |

---

## Self-critique pre-flight

Before dispatching builders OR before committing, run the **two-minute
self-critique** as the cheapest review you'll do. The questions:

### Pre-dispatch

1. **What's the obvious thing I missed?** (Spend 30 seconds with this
   question; the answer usually surfaces.)
2. **Are file scopes actually non-overlapping?** Concretely, not in
   the abstract.
3. **Is there a global resource I haven't allocated?** (Migration
   number, port, env var, Postgres advisory-lock ID, Nomad namespace.)
4. **Did I name the bad outcome explicitly?** Briefs that say "do X"
   without "and DO NOT do Y" are weaker.
5. **What's the test for done?** If the brief doesn't have a
   validation command list, the agent will declare done without
   running anything.
6. **Did I include the no-attribution reminder?** (Slate-specific
   default; check per-project.)

### Pre-commit

1. **What would the security reviewer flag?** Run mental
   `pipeline/reviewers/security-audit.md` against the diff.
2. **What would the devil's-advocate flag?** Where am I kidding
   myself about scope, scale, vendor risk, or "this never happens"?
3. **What would the tech-lead flag?** Schema-without-code-wiring is
   the canonical one. Doc-without-code-honesty (claiming a stub is
   stable) is another.
4. **Does the commit message honestly describe ALL themes?** Or did
   I lead with the easy ones and bury the partials?
5. **Is `git add` file-scoped?** Did anything sneak in that shouldn't?

The pre-commit critique catches 80% of what reviewers would have
caught, in 90 seconds, at the cost of zero token budget. The
reviewer trio still runs at integration rounds — pre-commit
self-critique is **in addition to**, not instead of.

---

## Build + operate — bringing the thing to life

The eighth role is "operate." A round isn't done when the code lands
— it's done when the code **runs**.

### After every integration round

```bash
# 1. Build cleanly
go build ./...          # or equivalent per stack

# 2. Test cleanly
go test -race ./...      # all green

# 3. Bring up the stack
make up                  # docker compose / ansible / equivalent

# 4. Curl the obvious paths
curl -fsS http://localhost:8080/healthz
curl -fsS http://localhost:5173/

# 5. Walk one tutorial end-to-end
bash tests/e2e/tutorials/01-first-thing.sh

# 6. Capture what broke in docs/audits/
```

If any step fails, fix in-round before declaring done.

### The operate checklist before tagging a release

- [ ] Three reviewer agents ran on the integrated tree
- [ ] `make up` succeeds on a clean checkout from a fresh `git clone`
- [ ] At least one tutorial runs end-to-end without operator
      intervention
- [ ] Container images build and pass `trivy fs --severity HIGH`
- [ ] No console errors in the web UI on any route in dark or light
- [ ] No broken internal links across docs/guides/
- [ ] Beta release notes match what's actually in the binary
- [ ] OpenBao + Postgres backup has been exercised against a
      test-restore once

If any of those fail, the release waits.

---

## Memory + handover

The CTO's job ends when the project is **operable by the next
person** without you in the chair. To make that real:

- Every load-bearing decision lives in `docs/decisions/<NNNN>-*.md`
- Every workstream has a spec in `docs/integrations/<topic>.md`
- The operator has a `HANDOVER.md` at the repo root with the 5-minute
  install path + the "what works in beta vs Year-1" matrix
- The build practice is in `docs/agents/` (or equivalent)
- This skill is in the operator's `~/.claude/skills/` (or copied to
  the project's `.claude/skills/`) so the next CTO inherits the
  discipline

When you hand over, the new CTO should be able to pick up your last
integrating commit and the next round runs without you. If they need
to ask you anything that isn't a values judgment, you didn't
document enough.

---

## The always-evolving rule

**Update this skill after every round where you learned something
new.** Skills decay if they don't capture lived experience. Specifically:

- After a reviewer trio fires and surfaces a pattern not in the skill
  → add it to "Anti-patterns" or "Pattern stack"
- After a failure mode you hadn't seen (socket death, scope
  collision, etc.) → add it to "Resume-from-partial" or a new
  "War stories" section
- After a quantitative budget shifts → update the table
- After a new contract type proves load-bearing (e.g., a new ADR
  shape, a new build-tag pattern) → add to "Context engineering"

The slate codebase's `docs/agents/war-stories.md` is the long-form
version of this; the skill is the portable short-form version.

If you find yourself improvising a CTO-level decision the skill
doesn't cover, **stop, decide, then write the rule** before moving
on. The 60 seconds it costs you saves 60 minutes for the next CTO
turn.

---

## Quick reference — the checklists

### Before dispatching builders

- [ ] Punch list exists (file:line refs, intended changes)
- [ ] 2-6 themes identified
- [ ] Each theme has 5-10 files, non-overlapping
- [ ] Every brief has all six sections
- [ ] Validation commands chosen per stack
- [ ] "What 'done' means" stated per brief
- [ ] Migration numbers explicitly assigned (no collisions)
- [ ] Frozen contracts locked
- [ ] DO NOT TOUCH list per brief
- [ ] No-attribution rule reminder per brief
- [ ] Dispatching all in ONE message

### Before committing

- [ ] All agents returned structured summaries
- [ ] `git status` + `git diff --stat` reviewed
- [ ] Spot-checked ≥1 file per agent
- [ ] Full validation matrix run immediately before commit
- [ ] Resolved every "Open question"
- [ ] File-scoped `git add <list>` (no `.` or `-A`)
- [ ] Commit message names every theme honestly
- [ ] No AI/agent attribution in the message

### Before tagging a release

- [ ] Reviewer trio ran on the integrated tree
- [ ] All critical / high / must-fix findings resolved
- [ ] e2e suite passes for the target user-journey level
- [ ] No blocking deprecations
- [ ] Release notes accurate per accuracy contract
- [ ] **This skill updated** with anything new learned this cycle

---

## Resume-from-partial — the socket-death playbook

**Reality:** in a long session (50k+ LOC, ~10 hours of clock-time), one
in five background agents will die mid-flight with "API Error: The
socket connection was closed unexpectedly." More common on flaky
uplinks (CGNAT, KPLC dips, DGX Spark in Limuru).

**Rule: retry, always.**

When an agent dies, the CTO does this:

1. **Assess what's on disk** — one `ls + grep` pass enumerating the
   partial output. Agents typically flush 30–60% of planned files
   before the socket drops.

2. **Re-dispatch with a "what's on disk" brief** — the resume agent
   gets a brief that NAMES every file already created so it doesn't
   redo them, plus the remaining scope verbatim.

3. **Reinforce frequent-disk-writes in every brief**:
   *"If you hit a socket error mid-flight, the parent will re-dispatch
   — leave checkpoint-able state on disk frequently (write files,
   don't hold in memory)."*

4. **Do not silently give up.** Re-dispatch immediately on the
   socket-death notification. The CTO never says "the agent died,
   here's what we have." The CTO says "the agent died at N% complete;
   here's the resume brief, picking up at Y."

5. **Track the death rate per session.** If 3+ of the same agent type
   die in a row, the brief is too big. Cut scope in half + re-dispatch.

**Don't** re-dispatch with the original brief verbatim — that redoes
work and wastes tokens. Always read the partial output first.

---

## Many-agents-in-flight — saturation management

When 4+ agents are concurrent:

- **Track every agent's file scope.** When dispatching a new agent,
  cross-reference and refuse overlap.
- **Declare locks once a scope is claimed.** Sibling agents working in
  adjacent dirs should NOT touch a locked file even if they could
  technically reach it.
- **Saturate at ~5 agents max.** Beyond that, death-rate compounds and
  integration debt outpaces throughput.
- **Integration round MUST come before the next dispatch wave.** The
  CTO never starts a new wave with prior wave's main.go wiring
  outstanding. That's how migrations collide and integration debt
  explodes.

---

## Integration debt is the silent killer

After every wave returns, there's a list of "one-line additions for
the parent to integrate" — main.go wiring, DAL method extensions,
struct field adds, route registrations. This is **load-bearing CTO
work, not optional polish.**

- **Pay it down each round, not "eventually."** Half-life of an
  agent's structured-summary is one conversation turn.
- **One file at a time.** If two agents flagged main.go wiring,
  combine into ONE edit.
- **Verify post-integration.** `go build` + `pnpm check` + targeted
  `go test` must pass before declaring the round done. Agents' "go
  build clean" claims compile the new package in isolation; only the
  CTO's integrating commit confirms it composes.

---

## The "everything must run" baseline

For a build users actively test against — not a tarball — the
continuous-running state is the contract:

| Surface | Must be running |
|---|---|
| Postgres + Authelia + admission + Caddy | `make up` (compose stack) |
| Web dev server with HMR | `pnpm --dir web dev` |
| Tests in watch (optional) | `pnpm test --watch` |
| Go tests on file change (optional) | `entr -c go test ./...` |

User reports "404 on /v1/X" mid-test? First question: **"is admission
running with the new routes built in?"** A stale admission binary is
the common failure after main.go wiring lands. Rebuild + restart
compose to apply.

Ship `make dev-up` that bootstraps secrets + brings up compose +
starts the dev server in one command. Build it on the next pass if
absent.

---

## Day-of-tag triage tree — verify-401 family of bugs

Lived during the slate v0.1.0-beta tag. Wallet sign-in (and any auth
flow) can return 401 through MULTIPLE root causes. Debug in this
order:

1. **Route reachability** — is the proxy hitting the right backend port?
   - Symptom: 404 on `/v1/capabilities` even before sign-in.
   - Cause: Vite fallback ghost dev server on 5174 (when 5173 is taken).
   - Fix: `lsof -ti:5174 | xargs -r kill -9`; restart pnpm dev on 5173.

2. **Nonce-expired** — `nonce: invalid or expired nonce`.
   - Cause: nonce TTL elapsed between issue + verify; OR nonce consumed
     by a prior verify attempt.
   - Fix: re-issue. Frontend should already do this on every click.

3. **Signature-mismatch** — `recovered address does not match claimed`.
   - Cause A: user changed active MetaMask account between connect + sign.
   - Cause B: signing a hex-looking string MetaMask interprets as bytes
     vs UTF-8.
   - Fix A: re-read `eth_accounts` JUST BEFORE personal_sign and use that
     address in BOTH the params slot AND the verify body.
   - Fix B: prefix slate nonces with a text marker (`slate-nonce: ...`)
     so MetaMask never tries to be clever about hex.

4. **Address-not-bound** — verify succeeds at the crypto layer but no
   tenant_user has this wallet.
   - Cause: dev bound a PLACEHOLDER filled in from a truncated display
     address like `0x9937...3419`.
   - Fix: `bash scripts/dev-link-wallet.sh <REAL-full-address>`.
   - **Truncated-address trap:** NEVER pad with zeros. ALWAYS ask for
     the full address or read it from admission logs
     (`docker compose logs slate-admission | grep wallet_address`).

The same triage tree applies to OIDC sign-in returning 401:
route → token-expired → signature-mismatch → audience-mismatch.

---

## SSR `document` guards for global overlays

Svelte 5 with `adapter-node` runs `$effect` and `onMount` lifecycle
during SSR for components mounted in `+layout.svelte`. Any global
overlay (command palette, shortcuts overlay, modal, toast container)
that accesses `document` at lifecycle time will 500 every page.

**Don't:** assume `$effect` is browser-only.

**Do:** guard at the top of every lifecycle hook in a global overlay:

```svelte
$effect(() => {
  if (typeof document === 'undefined') return;  // SSR guard
  // ...
});

onDestroy(() => {
  if (typeof document === 'undefined') return;
  // ...
});
```

The legacy-server.js render path doesn't skip `$effect` even when
nothing reactive will fire — guard at module level too if needed.

---

## Authelia 4.39 OIDC quirks

When wiring Authelia for OIDC sign-in, the surface looks Auth0/Okta-
shaped but isn't:

- Endpoint name is `/api/oidc/authorization`, NOT `/authorize`. The
  Auth0/Okta convention is wrong here.
- Discovery doc is at root `/.well-known/openid-configuration`, NOT
  `/api/oidc/.well-known/*`.
- Authelia REFUSES to compute its issuer URL unless
  `X-Forwarded-Proto: https` + `X-Forwarded-Host: <dotted-name>` are
  present. Synthesize them in the Vite proxy.
- `authelia_url` MUST be syntactically `https://` AND the cookie domain
  MUST contain a period — even in dev. Use `auth.slate.local` and tell
  the operator to add `/etc/hosts` entries. Or front Authelia behind a
  real TLS terminator from day one.

**Don't:** copy an Auth0 wiring guide verbatim.

**Do:** read Authelia's own OIDC docs before assuming convention.

---

## Compose port collisions on heavily-loaded hosts

When `make up` fails with `Bind for 0.0.0.0:8080 failed: port is
already allocated`:

- Inventory the host's listening ports:
  `ss -tln | awk '$4 ~ /:8[0-9]{3}$/' | head -20`
- Common dgx-ops occupied ports: 8080 (Beszel hub HTTP), 8090
  (Caddy-ish), 8200 (operator vault), 9091 (Authelia), 50001/50051
  (Headscale gRPC).
- slate's compose now defaults: admission 18080, vault 8210, control
  caddy 8089/8445, ingress caddy 8095/8446 — all env-overridable.

**The bigger lesson:** every published port in a compose file should
be `${ENV_VAR:-default}` with the default chosen to clear the upper
end of the 8xxx range. 18xxx is safer than 8xxx on shared hosts.

**Don't:** hardcode `8080:8080` in compose.

**Do:** `${SLATE_ADMISSION_PORT:-18080}:8080` so the operator can
remap without forking compose.

---

## Dispatch budgeting + the 5-agent ceiling

Lived during the v0.1.0-beta session: ran 5 agents concurrently →
death rate jumped from 1-in-5 to 3-in-5. **Five concurrent is the
ceiling; four is the sweet spot.**

When agents die at high rate:

- Cut brief in half + re-dispatch the smaller half.
- Move to inline work for any small piece (e.g., a 4-line config
  addition or a thin adapter) — the parent does it directly faster
  than dispatching a fresh agent.
- After 3 consecutive deaths from the SAME agent, the brief is
  structurally wrong (too big, scope unclear, dependency on a service
  not in scope). Rewrite the brief from scratch, don't just retry.

**Don't:** treat agent deaths as transient and fire-and-forget retry.

**Do:** read the death rate as a signal that scope or context is wrong,
and respond by cutting or rewriting.

This updates the budget table earlier in the skill: at 5+ concurrent,
expect 60% death rate on flaky uplinks. Four is the sweet spot.

---

## Truth-telling at tag boundaries

When tagging `v0.1.0-beta` (or any release):

- The CTO writes the GO/NO-GO honestly. "Ship as beta with these N
  blockers tracked for stable" is OK; "ship as beta despite these N
  blockers" hidden in a paragraph is NOT OK.
- Every blocker gets a tracked task + an estimated week to close + an
  owner.
- The reviewer trio runs AFTER the tag (against the tagged tree), not
  before. Their findings inform the next release-train commit, not the
  current tag.
- Resist the urge to retag. Once `v0.1.0-beta` exists, fixes flow into
  `v0.1.0-rc1` or directly into `v0.1.0`. Retagging is a destructive
  operation visible to anyone who fetched.

**Don't:** retag to "fix" a typo in release notes. Cut `-rc1`.

**Do:** publish the honest blocker list alongside the tag, with owners
and estimated close dates.

---

## What this skill enables

A single human can hold the CTO seat of a 50k-LOC product build,
ship in 30 integration rounds, maintain a clean commit history, and
hand the project off as production-ready. The discipline is the
multiplier; the agents are the throughput.

Forks: copy this skill + `docs/agents/` + `pipeline/reviewers/` and
your project inherits the discipline for free.

---

## Live-stack triage (added 2026-05-13 from the slate "wire everything up" round)

When a user surfaces a runtime bug in a dashboard surface, **do this
order BEFORE writing code**:

1. **Confirm the right port.** The dev UI proxy may target `:18080`
   (slate-admission) but a casual `curl :8080` will hit Authelia or
   nothing and return a misleading `{"detail":"Not Found"}`. Always
   check `docker compose ps` for the actual admission port before
   declaring an endpoint missing.
2. **Stale image or stale code?** If a route returned data yesterday
   and `[]` today after a code change, the admission image is stale.
   `docker compose build slate-admission && docker compose up -d
   slate-admission` before re-investigating.
3. **Wrong JSON shape, not a real constraint.** Slate's slice spec
   nests resources: `{"resources":{"cpu_milli":4000,...}}`. A flat
   `{"cpu_milli":4000}` silently defaults the column to 0 and trips
   `cpu_milli > 0`. A `slices_cpu_milli_check` failure with a non-zero
   value in the request body is almost always wrong-shape, not a
   real floor.
4. **Read the FIRST log line in the error chain.** Slate provisions
   slices as `ensure headscale user → issue preauth key → submit
   nomad job → register host-agent dispatch`. The user-facing
   "slice failed" is the tail. The structured WARN with `slice_id` +
   per-step error is the head — and points at one external
   dependency. Fix the head, not the tail.

### Headscale apikey rotation (the 401 → 501 progression)

`deploy/compose/secrets/headscale-admin-token` is a stub on first
boot. Real key must be minted:

```bash
docker compose -f deploy/compose/compose.yml exec -T headscale-demo \
    headscale apikeys create --expiration 30d
# copy the printed `hskey-api-...` token
printf '%s' '<key>' > deploy/compose/secrets/headscale-admin-token
docker compose -f deploy/compose/compose.yml restart slate-admission
```

After the rotation, a 401 from "ensure headscale user" becomes 501.
The 501 is Headscale v0.28 saying the REST path is wrong — it does
NOT implement `GET /api/v1/user/<name>` (that path is for numeric
IDs). Fix: list all users and filter client-side in
`internal/overlay/tailscale/client.go`. Never retry a 501; it means
the API surface is different from what the client expects.

### "DB-only host insert is a lie"

Manually `INSERT INTO slate.hosts` is enough to make `/admin/hosts`
render the row, but `slate.hosts` historically has no
`host_agent_addr` column — admission has no way to dial the
host-agent gRPC server. Any slice that places on that host fails
at dispatch with a generic error.

The full host-onboarding path is: migration adding the endpoint
column → host-agent self-registration on startup heartbeat →
admission dispatcher resolves endpoint per `host_id` → real
slate-host-agent process listening on `:7443` → slice dispatch
succeeds. Skipping any step makes "host visible in UI" lie about
"host usable for slices".

### The dashboard surface failure ladder

When a user clicks through a slice detail page and finds Logs,
Metrics, Shell, and Overview all broken at once, treat them as
**four independent integration gaps**, not one bug:

1. **Slice runtime path** — Headscale / Nomad / host-agent dispatch
   fail; slice ends `failed` with no actionable reason. Fix by
   walking the provision chain and identifying the failing step.
2. **Slice observability** — `/logs` and `/metrics` may not even be
   routes on admission. Add 503-with-structured-fallback handlers
   and let the UI render `NotImplementedEmptyState`.
3. **Slice shell** — even with the route shipped, `podman` is
   missing inside the admission container, so `exec` returns
   `executable file not found in $PATH`. The UI surfaces it
   gracefully — but document the operator dependency.
4. **Admin detail pages** — list pages render but rows aren't
   clickable; users have no way to inspect a single host or
   tenant. Always pair list view + `[id]/+page.svelte`.

### Wave-2 from a still-cooking wave-1

When in-flight agents are still working in the SAME worktree:

- `git status --short` enumerates what's claimed.
- Wave-2 briefs MUST list those files in the `you-may-NOT-touch`
  section. Don't trust the agents to discover overlap themselves.
- When the in-flight agents return, integrate THEIR work into a
  clean commit FIRST, then dispatch wave-2 from clean HEAD. Don't
  fan out on top of an unintegrated working tree — wave-2 agents
  read files mid-edit and integrate ambiguously.
- 4-agent wave-2 is the right size for "wire everything up"
  punch-list tasks where each item is one theme (plumbing,
  observability, detail pages, regression fixes).

### The integration-budget signal

If a user keeps surfacing visible bugs faster than you can fix them
serially (3+ rapid messages with new screenshots), **STOP touching
files inline** and fan out a wave instead. Inline fixes generate
visible progress for one user; a 4-agent wave generates 4× the
progress in ~the same wall clock, and shows the user you're
scaling, not scrambling.

### Capability surface as the source of truth

`slate_features` table (migration 0005) is the canonical record of
"what's shipped at what maturity". Static docs (whitepaper,
about-slate.md) drift from reality within weeks; the table doesn't.
Future roadmap pages should READ from `/v1/capabilities`, not
hand-curated markdown. Beta vs Year-1 vs Mature is a `status` +
`introduced_in` query, not a section header.

### Probes + repair belong in the dashboard

When the user asks "what's down?", the right answer is a /admin/
status page, not a Slack message. Live probes (postgres
`pg_isready`, headscale `/health`, vault `/v1/sys/health`, nomad
`/v1/status/leader`, derper `/derp`, host-agent gRPC ping) run
server-side because admission already has compose-network access.
Restart / repair actions are the natural next step — admin-tenant
scope + audited, and they pay off operationally because the human
doesn't have to SSH in to recover.

---

## Cross-machine + branch-per-theme patterns (added 2026-05-14 from the slate Mac+spark dual-CTO round)

When two operators / Claude sessions run on different machines against
the same repo (e.g. one CTO on Mac, another on the DGX), the
push-pull-rebase dance gets expensive fast. Lessons from the slate
session where Mac and spark-5804 each had 3-4 unpushed commits past
origin:

### Branch-per-theme via isolation worktrees

When the user says "have these working in branches" or you're at a
point where multiple themed waves should NOT all land on `main`:

- Use the `Agent` tool's `isolation: "worktree"` parameter for every
  agent. Each gets its own temp git worktree off `main`; commits land
  on a generated branch like `worktree-agent-<id>`.
- **Departure from no-agent-commits**: under explicit branch
  instruction, agents DO commit (one commit per theme to their
  worktree branch). Brief them explicitly: "commit one commit to your
  branch; DO NOT push."
- Parent renames the generated branch to `wave-N/<theme>` for clean
  PR naming: `git branch -m worktree-agent-<id> wave-N/theme`.
- Parallel runs are safe (each in its own worktree) — no file scope
  collisions during execution. Conflicts only appear at PR merge time,
  and that's the right place for them.

### Cross-branch scope dependencies

When wave-N agents would touch the same file (e.g. both
`wave-4/admission-boot` D1 and `wave-5/enricher-coverage` E2 want
`cmd/slate-admission/main.go`):

- DEFER the second one until the first PR merges.
- Brief the deferred work explicitly: "this depends on `wave-4/X`
  merging first; expect a 3-line decode hook addition once it lands."
- The blocking agent should EXPORT any types/funcs the deferred agent
  needs, so the deferred edit is mechanical. E1 exported
  `DecodeChallengeHeader` precisely so E2's hook is one import + one
  call.

### Push-pull-rebase choreography

When both Mac and spark have unpushed commits:

1. Whoever has the BIGGER semantic surface pushes first (less likely
   to need conflict-resolution downstream).
2. The other side `git fetch && git pull --rebase`.
3. Doc conflicts almost always take "theirs" (the unified doc sweep
   side); code conflicts need manual merge.
4. Validate (`go build`, `svelte-check`) after rebase BEFORE pushing.

The sandbox can't push directly — auth lives in the operator's shell.
Be honest about that constraint: don't try to snoop for ssh-agent
sockets (auto-mode classifier correctly blocks it). Hand the user the
exact `git push` command they should run.

### The auth-knob default trap

Wave-5 hit this: Mac's `f789aa9` made the dev-bearer wiring opt-in
via two new env vars (`WALLET_DEV_AUTO_PROVISION` + the NEW
`WALLET_DEV_AUTO_TENANT`). Without both set, admission boots with
dev-bearer OFF — and every `Authorization: SlateDev <subject>`
request 401s as "malformed Authorization header" (falling through to
the JWT-only path).

**Rule**: when a new commit adds an env knob that was previously
implicit, do BOTH:

1. Default to the SAFE production state (off / locked / strict).
2. Log a loud `WARN` on every boot when the knob is in its previous
   implicit-on state, with the exact env line operators must add.
   Silent breakage of "it worked before the merge" is the worst class
   of regression. The log line is the docs.

The slate fix was a 3-line addition to `deploy/compose/.env`:

```
WALLET_DEV_AUTO_PROVISION=true
WALLET_DEV_AUTO_TENANT=demo
SLATE_DEV_MODE=true
```

The cost was 15 minutes of "why are logs/metrics 401?" debugging.
A `WARN` at boot would have made it a 30-second fix.

### Docker-Desktop-on-macOS has no tailnet route

When the operator wants Mac-as-control-plane + spark-as-compute over
Tailscale, the Linux VM that hosts compose containers does NOT see
the Mac's tailscale interface by default. Admission running in compose
on Mac cannot dial `100.x.x.x:7443`.

Three honest paths (rank by speed × correctness):

| Option | Speed | Correctness | Notes |
| A. Native admission on macOS | fast | OK | Loses "everything in compose"; service-manager via launchd needed for resilience |
| B. Tailscale sidecar in compose | medium | best | Standard pattern; admission `network_mode: "service:tailscale"`; survives reboots |
| C. Move CP back to spark, Mac becomes compute | slow | best | Matches whitepaper architecture; throws away Mac CP work |

Slate's wave-5/tailscale-sidecar branch ships option B as the proper
long-term answer. Document it as ADR.

### 502 from tailscale-serve → backend container died

When a `https://<name>.<tailnet>:8XXX` URL returns 502:

1. The proxy mapping lives in `tailscale serve status` (or
   `tailscale serve status --json` for full detail). Find which
   localhost port the URL maps to.
2. `docker compose -f deploy/compose/compose.yml ps` — is the
   container behind that port `Exited` or missing? If so, restart it.
3. `tailscale serve` itself does NOT auto-restart backends; it just
   proxies. A 502 is "I tried to dial localhost:N and got
   connection refused."

This is a 30-second triage path. The user surfaced it as "is the
webui down?" — but the UI itself was fine; the admission backend
behind a different proxy URL was dead.

### Branch reviewability via gh CLI

To make wave-N branches reviewable as PRs without the user touching
GitHub web:

```bash
gh auth login -h github.com   # one-time, refresh expired token
gh pr create --base main --head wave-N/theme \
  --title "wave-N: <title>" --body "Closes F<NNN>"
```

The sandbox's gh CLI token expires after some weeks of idle.
Refreshing it gives the sandbox push+PR-create capability — much
better than the user typing the SSH passphrase every push.

---

## Wave-9 K1/K2/K6/K7 round — slate live-stack triage (added 2026-05-14)

A 6-screenshot user-frustration round that produced five new
durable lessons. The arc: K1+K3 shipped "sharable URLs" but
deferred port-wiring to K2 ("follow-up"). User created a slice,
saw the URL, clicked it, got `unknown hostname`. Then click Run-
in-Shell → 409 stale container ID. Multiple screenshots arrived
faster than serial fixes could land. CTO fan-out (A=K2 network
+ reconciler dedupe, B=K6 template cmd/args, C=K7 SSH + connect
hints) + 2 inline streams (D=hot-fix live Caddy, E=slice-runtime
reconciler). Round outcome: live demo URL works end-to-end mid-
flight; agents return with proper code-level fix.

### The K-deferred-K trap

**Pattern**: Wave N ships a user-visible surface (URL shape, UI
button, dashboard widget) but defers the WIRING to N+1 as a
"follow-up." The surface renders. Users click it. It 404s,
hangs, or returns the empty-state placeholder. User reports
"X is broken."

**The bug isn't in N. The bug is the decision to ship N without N+1.**

Examples from slate:
- K1 ships `<slice>.<tenant>.<domain>:8095` URL shape. K2 (port-
  publishing) deferred. Result: every URL 404s.
- "Add Custom Domain" UI ships. ACME DNS-publisher deferred.
  Result: domain row exists, no cert ever issues.
- "Service catalog" template list renders. `default_cmd`/
  `default_args` columns missing. Result: MinIO slice exits
  immediately because it needs `server /data`.

**Rule**: when a brief carries "follow-up will land in N+1",
the CTO either (a) hides the surface behind a feature flag
that defaults to OFF until N+1 lands, or (b) ships them
together. Surfaces that demo broken are worse than no demo.

**Catch in pre-dispatch self-critique**: "If I ship just this
brief and the user does the most-natural next click, does it
work?" If no, the brief is incomplete or needs a sibling.

### The user-frustration-ladder signal

When the user sends **3+ rapid messages with new screenshots
after a fix you just made**, the live system is in a state
worse than your code state. The agent thinks "I fixed it";
the running stack hasn't been rebuilt / restarted / cleared
of cached state.

**Rule**: STOP touching code inline. In order:

1. **Read the live state** (`docker ps`, route table, DB
   rows, what the user is actually clicking).
2. **Find the gap** between code state and live state
   (typically: container/binary not rebuilt; stale row in
   DB; cached config in memory; race during restart).
3. **Hot-fix the live state** with a manual op so the user
   sees the fix in seconds, not after the next rebuild.
4. **Then** dispatch agents (or write code) for the durable
   fix that survives the next restart.

The hot-fix is throw-away. The agents' work is permanent.
The two arms run in parallel: user gets visible progress NOW
from the hot-fix; code lands cleanly LATER.

**Anti-pattern**: writing more code while the live system
gets more broken. Each new edit invalidates the user's prior
test, and the screenshots keep coming.

### Reconciler idempotency strategies (Caddy admin API specifically, generalizable)

When a reconciler ticks every N seconds and writes to a
remote admin API, choose the IDEMPOTENCY STRATEGY up front:

| Strategy | Mechanism | Pros | Cons |
|---|---|---|---|
| (a) Whole-config PUT | Replace `srv.routes` array every tick with full list + catch-all last | Single API call, atomic, no drift possible | Re-renders all routes even when only one changed; brief route-table flap during PUT |
| (b) DELETE-then-POST per id | For each row, `DELETE /id/<id>` then `POST /config/.../routes/0` | Per-route ops, easy to log | Two RTs per row per tick; race if catch-all moves |
| (c) PUT /id with fallback POST (NAIVE) | `PUT /id/<id>` first, on 404 `POST` to routes/0 | Looks like an upsert | **Caddy's @id index doesn't survive across POST-then-PUT in some versions; PUT 404s every tick, POST appends every tick → exponential duplicate drift** |

**Pick (a) or (b). Never (c).** The slate K1 reconciler shipped
(c) and accumulated 36 duplicate routes in 3 minutes of
runtime. Agent A's K2 fix switched to (b).

**Pre-dispatch checklist for any reconciler**: "What does
the routes/state look like after the 100th tick? Is the
shape stable?" If you can't sketch it on a whiteboard,
re-design before shipping.

### SendMessage is not always available

Per the Claude Code spec, you can "continue a previously
spawned agent" via SendMessage. In practice **the
SendMessage tool is sometimes deferred and not in the
session's tool catalog.** Searching the deferred catalog
("select:SendMessage", "+send +agent") may return nothing.

**Implication**: assume you CANNOT redirect a dispatched
agent mid-flight. Front-load all file-scope discipline in
the brief. The cost of a mid-flight scope correction is
"resolve at integration" — manual merge, possibly with
hand-translation between agent A's and agent B's diff in
the same file.

**Mitigation**: when two briefs would touch the same file,
pick one owner up front and have the other expose a TYPED
SEAM (struct field, exported helper, interface) the first
owner can read. Agent A's K2 work exemplifies this — it
added `Upstream.DialOverride` as a typed hand-off so the
reconciler doesn't need to know about Docker networking.

### Container-engine name-index keeps stopped containers (Docker)

When a slice container dies, Docker keeps the **name → id**
mapping bound to the dead container. The next `docker exec
slate-<short> ...` resolves the name to the stopped
container and returns 409 "container is not running" — NOT
404. From the UI's perspective the slice is "running"
(DB row says so) but every exec fails mysteriously.

**The runtime-truth gap**: DB.slices.status = 'running'
must be reconciled against the container engine's actual
state. A passive design ("we'll know it's dead when the
next start fails") is the wrong model; users see broken
shells before the next start ever happens.

**Fix shipped this round**: `slice_runtime_reconciler.go`
— 10s tick, walks `status='running'` rows, inspects each
`slate-<short>` container via Docker API, flips to
`stopped` (exit 0) or `failed` (exit != 0). Cheap (~3-5
ms per slice per tick), buy back the "UI never lies"
property.

**Generalization**: any time the durable store and the
ephemeral runtime can diverge (DB + container engine,
DB + Nomad alloc, DB + Kubernetes pod, DB + tailnet
node), a reconciliation goroutine is mandatory, not
optional. The cost is one file (~150 lines); the
alternative is constant user mystery.

### File-scope overlap caught at dispatch time, resolved at integration

Wave-9 round dispatched agent A (network attach in
`podman_local.go`) and agent B (cmd/args in
`podman_local.go`) before the CTO spotted the overlap.
Outcome:

- Agent A returned first; took ownership cleanly with
  exports (`SliceContainerName`, `SliceDialTarget`).
- Agent B's brief was still in-flight; CTO planned to
  resolve at integration via hand-merge.
- Integration cost (projected): ~10 minutes of careful
  merge if both agents edited the same struct/function.
- If both agents had been redirected at dispatch time
  (with SendMessage), the integration cost would be ~0.

**Lesson**: the CTO self-critique pre-flight (skill's
section above) saves more time than it costs. Spend the
30 seconds on "are file scopes actually non-overlapping?"
before hitting send. The slate skill v0.2 listed this
already; this round was a reminder why it's load-bearing.

### Multi-agent worktree + isolation:worktree pattern in practice

When agents run with `isolation: "worktree"` and explicit
"commit to your branch, do not push" briefing, returns
look like this:

- Worktree path: `<repo>/.claude/worktrees/agent-<id>/`
- Generated branch: `worktree-agent-<id>`
- Agent commits one clean commit at the end
- Parent renames branch: `git branch -m <generated> wave-N/<theme>`
- Parent merges with `--no-ff` and resolves conflicts in the
  integrating commit

The branch-per-theme PR review (gh pr create per branch) is
preserved. The parent's single integrating commit becomes a
merge commit per theme branch, which is acceptable when the
themes are independently reviewable.

When themes touch the same file (the case this round),
parent uses `git diff <merge-base>..<branch>` to extract
only the additive parts of each diff, then writes a hand-
merged commit. This is the K1+K3 / K4 / K5 pattern from
the previous wave-9 round.

---

## Bundle packaging + versioning (added 2026-05-15)

Pattern: **manifest-driven bundle**. When a product depends on
multiple binaries / external services / contracts / configs to
run, the bundle is the unit of release.

### The three layers

1. **`deploy/bundle/<product>-bundle.yaml`** — the manifest.
   Pins every artefact (own binaries, external binaries built
   from upstream pinned refs, container image digests, contract
   ABIs, deployment configs, migrations, docs) to a fully-
   qualified version. The manifest is committed; CI fills in
   `sha256` and `digest` fields at release time.
2. **`scripts/build-bundle-archive.sh`** — the CI build step.
   Reads the manifest; cross-compiles own binaries; clones each
   external upstream at its pinned ref; runs its `build_command`;
   pulls each image digest; collects all artefacts + SHA256SUMS
   + cosign signatures into `dist/<product>-bundle-<version>-
   <platform>.tar.gz`.
3. **`<product> upgrade`** — operator-facing CLI subcommand.
   Reads the local bundle manifest, fetches the new bundle,
   verifies signatures + checksums, swaps binaries + images +
   migrations atomically, with rollback if L0 smoke fails.

### Versioning rules

- **Bundle version = product version.** No drift between "what
  slate version are you running" and "what bundle is on disk."
- **SemVer** for the product. Pre-1.0 (`v0.x.y`): breaking changes
  allowed at minor bumps. Post-1.0: breaking requires major bump.
- **External binaries** pinned to upstream commit SHAs (when
  upstream doesn't tag) OR upstream semver tags. Manifest carries
  both `pinned_ref` (SHA) and `pinned_tag` (human-readable) so
  operators can audit.
- **Container images**: dev/beta channels use semver tags; rc/
  stable channels switch to `sha256:...` digests. The `digest`
  field is empty in dev; CI fills on release.
- **Contracts** (ABIs / proto): committed as JSON / .proto in the
  repo. Manifest pins `pinned_at` to the date the contract-
  verification gate last ran against the canonical upstream.
- **Migrations**: manifest carries `lowest` + `highest`. The boot
  path applies all pending migrations idempotently; cross-bundle
  upgrades flow forward.

### Channels

- **dev** — every `main` commit; private registry; default for
  developers.
- **beta** — `vX.Y.0-beta.N`; public; operators opt in via
  `<product> upgrade --channel=beta`.
- **rc** — `vX.Y.0-rc.N`; same as beta with L2+L3 acceptance gates
  passed.
- **stable** — `vX.Y.0`; image digests pinned; cosign verified at
  install + upgrade; L4 gate passed against a real-domain deploy.

Operators set the channel in their `.env` (`PRODUCT_CHANNEL=...`).
`<product> upgrade` respects channel + only offers upgrades within
or above the current channel.

### Upgrade flow

```
1. Read /var/lib/<product>/bundle/MANIFEST.json
2. Fetch next bundle from channel URL
3. Verify cosign + SHA256SUMS
4. `docker load` new OCI image tarballs
5. Apply pending migrations
6. Atomic-rename swap of own binaries
7. Restart product services (systemd / compose)
8. Run L0 smoke from the new acceptance plan
9. If L0 passes: commit; archive previous bundle for rollback.
   If L0 fails: rollback.
```

### When to fire this pattern

- Product has **≥3 ship-shape components** that need to move
  together (slate: admission + host-agent + CLI + chain + ABIs +
  images + migrations).
- Operators install from a release artefact, not from `go install`
  or `git clone`.
- Product has **breaking-change risk** that warrants a rollback
  story.

When the product is a single binary with no external dependencies,
manifest-driven bundling is overkill — just publish the binary.

### When NOT to fire

- Single-binary product with no external pinned dependencies.
- Library, not a deployable product.
- Pre-MVP where the release surface is still in flux.

### Anti-patterns

- **"Just bundle binaries; pin versions in code constants."**
  No machine-readable manifest = no clean `<product> upgrade`
  path. Constants live in source; manifests live in deploy/.
- **One bundle, all platforms.** Inflates the bundle 4-8×.
  Per-platform tarballs (`-linux-amd64`, `-linux-arm64`, ...).
- **Bundle source not binaries.** Operators on locked-down hosts
  (no toolchain, no internet) can't build. Binaries are the right
  ship-shape.
- **Use `:latest` tags.** No deterministic re-pull. Stable
  channels MUST use sha256 digests.
- **Cosign-sign nothing.** Stable channel == supply-chain claim;
  operators need cryptographic verification, not "we hope this is
  the right binary."

### slate's specific application

slate v0.1.0 manifest at `deploy/bundle/slate-bundle.yaml`. ADR at
`docs/decisions/0058-bundle-packaging-and-versioning.md`. Pins
`aminichaind` to an upstream SHA (AminiChain doesn't tag yet) +
derper to `v1.78.0` + slate's own binaries from the current repo.
Wave-11 wires `scripts/build-bundle-archive.sh` to read the
manifest end-to-end + implements `slate upgrade` CLI.

## Three patterns added 2026-05-15 (L2 acceptance + wave-11 GPU dispatch round)

### Resume-from-partial: the verify-main-advanced sub-check

After every multi-agent integration round, the parent must check
not just *"are origin/main and main in sync"* but **"did main
actually advance to include the agent's commit?"** These are
different questions and the slate L2 acceptance round caught the
divergence.

What happened: an agent's final commit (`391a502`, the L2 audit)
landed on a feature branch (`l2-acceptance-2026-05-15`). `git
rev-list --left-right --count origin/main...main` returned `0 0` —
which only proves origin/main and local main agree, not that either
includes the new commit. Local main was still at `0bbbe64` (the
previous merge), origin/main matched. HEAD was on the feature
branch at `391a502`. Without the next sub-check, the commit
would have stayed orphaned.

**Sub-check ritual:**

```bash
git rev-parse main HEAD origin/main
# Three SHAs. If HEAD != main, the agent's commit is NOT on main.
# Switch to main + ff-merge before declaring the round integrated:
git checkout main
git merge --ff-only <feature-branch>
git push origin main
```

The invariant is: **a commit's existence is not the same as its
presence on the branch users observe.** Both builders and the
isolation-worktree feature encourage feature-branch landings; the
integration step is what makes them visible.

### Pre-flight host capability checks before dispatching infra agents

When an agent's job includes a smoke test against external hardware
or system services (GPU, container runtime, kernel features,
mounted filesystems), **run a 5-second pre-flight from the parent
shell first** to confirm the host has the capability. Don't make
the agent discover the gap at minute 20 of its run.

Slate wave-11 example: before dispatching the GPU runtime agent
whose final step was "smoke jupyter-gpu on spark-5804," the parent
ran:

```bash
which nvidia-container-toolkit nvidia-ctk nvidia-container-runtime
docker info | grep -i "Runtime\|nvidia"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
```

This revealed full NVIDIA Container Toolkit installed, `nvidia` as
the Docker default runtime, GB10 detected, CDI devices registered.
The agent's smoke step would work. If it had been missing, the
brief would have included "operator-side install of NVCT is a
prerequisite — document and stop" instead of letting the agent
discover that mid-flight.

**The general form:**

| Agent task | Pre-flight |
|---|---|
| GPU runtime / DeviceRequests | `nvidia-ctk` / `nvidia-smi` / `docker info` |
| Kernel-mode WireGuard | `lsmod \| grep wireguard` or `modprobe -n wireguard` |
| Firecracker | `/dev/kvm` access + `firecracker --version` |
| Tailscale operations | `tailscale status` + token presence |
| OIDC end-to-end | reach OIDC issuer `.well-known` from host |
| Bundle build | required external repos clonable from host |
| Postgres migrations | DB reachable + role + extension privileges |

Cost: ~30 seconds. Saved time when it catches a gap: 20+ minutes
of an agent's wallclock + the re-dispatch cycle.

### Concurrent-agent-vs-parent file scope: the same-file collision

When an agent has been dispatched and is editing file X, **the
parent cannot inline-fix bugs in file X without merge collision at
integration time** — even if the bugs are in different functions of
that file. Either:

1. Wait for the agent to finish, then bugfix wave on top of its
   landed merge.
2. Scope the inline fixes to files the agent is NOT touching.
3. Dispatch the bugfix wave to a second worktree that explicitly
   excludes the first agent's file scope, with a "you may NOT
   touch X (active agent)" line in the brief.

Slate wave-11 example: GPU agent owns `internal/admission/server.go`
(SliceSpec at line 269). The L2 audit surfaced bugs whose
HTTP-mapping lived at `server.go:478` (quota error shape) and
`server.go:1057` (handleCreateTenant 500-on-duplicate). The parent
*could not* fix those inline without risking the GPU agent's diff
hunks. The right call was to **hold the bugfix wave until GPU
returns**, then dispatch one coordinated bugfix agent.

The lesson generalizes: **active agent worktrees implicitly
escalate their file scope into the parent's "do not touch"
list.** Treat the parent's edit privileges as suspended for those
files until the agent's branch is merged.

**Detection ritual at brief time:**

```bash
# Before deciding to inline-fix, check active agent worktrees:
git worktree list | grep -v "locked$" | tail -n +2
# Then grep the active agent's brief or recent dispatch for its scope.
# If the file you want to fix is in any active scope, hold.
```

This is the **concurrency-cap-by-file-scope** discipline, distinct
from the 4-agent flaky-uplink cap. You can have N agents running
and still be unable to do a 1-line inline fix because of file
overlap.

---

## Framework-agnostic core for multi-client builds (added 2026-06-20)

From the-desk-multiclient round: building a second + third client
(native SwiftUI watchOS app + Flutter Android/Android-TV app) for an
existing product that already had a frozen engine HTTP contract.

**Pattern: split every new client into a framework-agnostic core +
a thin UI layer.** The core = models + contract client (networking) +
config + palette constants, written in stdlib only (Foundation /
`dart:core`+`package:http`) — no UI framework, no platform plugins.
The UI layer (SwiftUI / Flutter) imports the core.

Why it's load-bearing: the core holds the riskiest logic (decoding,
request shape, auth headers, failure mapping) and, because it has no
platform dependency, it **compiles and tests with the BASE toolchain**
even when the heavy platform SDK isn't installed:

- Swift: a `executableTarget` + `swift run <Check>` runs a plain-
  `assert` harness where `swift test` can't (XCTest isn't bundled with
  Command Line Tools).
- Dart: a `tool/verify` package (deps: just `http`) + `dart run
  verify.dart` runs with the ~200 MB standalone Dart SDK — no Flutter.

This round verified both cores on a machine with neither full Xcode
nor Flutter (Swift 20/20, Dart 24/24). The UI layers were authored and
honestly flagged as not-compiled-here.

Discipline:
- Mirror the SAME scenarios in the canonical suite (XCTest /
  `flutter test`) AND the base-toolchain harness, so coverage is
  identical whichever runner is available.
- Keep the only plugin-coupled file isolated (e.g. split a
  `shared_preferences` store into its own `prefs_store.dart` so
  importing the config doesn't drag in Flutter).
- **Check disk before installing a heavy SDK to "test."** A full
  Flutter install is ~2–3 GB; if disk is tight, the base-toolchain
  harness gives real core verification for ~200 MB or zero.
- When a framework can't target a platform (Flutter → watchOS), state
  the hard constraint in the first sentence and pick the native path.
- Swift gotcha: `async let x = try? f()` is invalid — handle the throw
  at the await site: `async let t = f(); let v = try? await t`.

Full lesson: `memory/feedback_portable_core_verifiable_without_platform_sdk.md`.

## Appendix — the agentic learning loop (RL framing)

This skill is **the policy** in an explicit reinforcement-learning
analog that runs every turn. The framing is "builder-language with
RL primitives" — you don't need to think in this vocabulary to use
the skill, but the auditor (you, six months from now; or the next
CTO inheriting this) should be able to see the mechanism clearly.

### The mapping

| RL primitive | This system |
|---|---|
| Agent | Claude in the CTO seat (you, orchestrating) |
| Environment | The codebase + the user + the running builder/reviewer agents + the wall clock |
| State sₜ | Current round context: open briefs, frozen contracts, pending decisions, reviewer findings, MEMORY.md index, working tree |
| Action aₜ | Which of the 9 roles to wear, which agents to dispatch, which skill to invoke, what to write, what to commit |
| Reward rₜ | Explicit user signal ("always do X", thumbs up/down, frustration) + integration success/failure + reviewer-trio findings + tests passing + scope respected + wall-clock-per-round trending the right way |
| Policy π(a\|s) | The union of all SKILL.md files. **The skill text IS the policy.** |
| Replay buffer | `memory/feedback_*.md` — every captured lesson, frontmatter-tagged, append-only |
| Update rule | Round-close ritual (Role 9): if a new signal fires, write the feedback file → propagate into the relevant skill in the same turn → policy is updated for next round |
| Periodic optimization | `consolidate-memory` (weekly merge/prune of the replay buffer + index) and `project-impact-scribe` (monthly larger-scale reflection) |
| Off-policy improvement | `skill-creator` when a brand-new domain pattern doesn't fit any existing skill |
| Exploration | Critic role + devil's-advocate reviewer + the "what's the obvious thing I missed?" pre-flight |
| Exploitation | Integrate role + frozen contracts + the existing rule stack |
| The always-running guarantee | Stop hook (`auto-sync.sh`) mirrors `~/.claude/` → `~/claude-workspace/` after every turn. The policy and replay buffer never drift off-disk |

### Why this is "proven and tested" — and where the analogy breaks

**The honest disclosure first:** model weights are fixed at inference
time. This is not literal gradient-based RL on parameters. What gets
updated is the **prompt context** (the SKILL.md files loaded into
each session), not the network.

That said, the mechanism is well-established:

- **Policy iteration** (Sutton & Barto, *Reinforcement Learning: An
  Introduction*, ch. 4) — alternate policy evaluation (run the round)
  and policy improvement (update the rules). Every round here is one
  iteration.
- **RLHF / instruction-tuning** (Christiano et al. 2017; Ouyang et al.
  2022 — InstructGPT) — proved that human preference signals can
  shape model behavior. The signal here is the same; the substrate
  (prompt vs. weights) is different but functionally equivalent for
  in-context behavior.
- **Memory-augmented agents** (MemGPT, Park et al. *Generative
  Agents*, 2023) — established that an external memory store fed
  back into the context window can produce learning-over-time
  behavior in fixed-weight LLMs. That's exactly the pattern here:
  feedback files are the long-term memory; the loaded skill is the
  active working memory.
- **In-context learning** (Brown et al. 2020 — GPT-3) — the
  foundational result that LLMs can adapt behavior from prompt
  context alone, without weight updates. The skill files exploit
  this directly.

Where the analogy is *weaker* than literal RL:

- No automatic gradient — updates are human-curated (you write the
  feedback file). This is a feature, not a bug; it keeps the loop
  auditable.
- No formal value function — reward signals are categorical
  (worked / didn't / surprised me) rather than scalar.
- Credit assignment is manual — when something works, you decide
  which rule earned the credit. The system does not back-propagate.

**Net:** this is closer to **policy iteration with human-curated
updates over a memory-augmented in-context policy** than to
canonical RL. The mechanism converges on better behavior in
practice (the slate build's 30 integration rounds + the dgx-ops
operationalization is the empirical evidence), and it is fully
auditable because every policy update is a git commit on
`claude-workspace`.

### The exploration / exploitation knob

A common failure mode is over-exploiting (always firing the same
rules, missing emerging patterns) or over-exploring (improvising
every round, never compounding). The CTO calibrates by reading the
growth ledger:

- **5+ no-op rows in a week** → over-exploiting. Force exploration:
  spend a round in pure Critic mode against the current skill stack.
  Ask "what's wrong with the way I did the last 5 rounds?" Write any
  finding as a feedback file.
- **5+ "new rule" rows in a week without any reuse** → the rules
  aren't sticking. Fire `consolidate-memory` to merge near-duplicates
  and confirm each rule has a clear firing signal.
- **The same lesson written twice with slightly different wording**
  → the consolidation already deferred too long. Fire
  `consolidate-memory` now.

### The "always running" property

This loop runs whether or not you remember to fire it, because:

1. The Stop hook auto-syncs the workspace after every turn — even
   if a round closed without a feedback write, the *state* is
   captured.
2. Role 9's growth-ledger append is non-skippable — even a "no-op"
   row keeps the loop's observation record continuous.
3. The `consolidate-memory` and `project-impact-scribe` skills can
   be put on the `schedule` skill (cron-like) so they fire weekly /
   monthly without user prompting.
4. The `meta-brain` skill routes ambiguous intent into the right
   sub-skill, so even when the CTO seat isn't explicitly invoked,
   the right policy gets loaded.

**The result:** the brain compounds. Every conversation either adds
a row to the ledger, a file to the replay buffer, a rule to a skill,
or a "no signal this round" acknowledgment. None of those are
neutral — they all keep the loop alive.

### Coupling to companion skills

- **`agentic-learning-loop`** — the formal description of this
  appendix as a standalone skill. Load when you want to reason
  about *how the brain learns* rather than *what it should do*.
- **`meta-brain`** — the router. Load on ambiguous intent; it maps
  the request to the right downstream skill.
- **`skill-creator`** — the "create a new policy module" tool. Fire
  on brand-new domain patterns.
- **`consolidate-memory`** — the "garbage-collect the replay buffer"
  tool. Fire weekly or on contradiction.
- **`project-impact-scribe`** — the "monthly reflection" tool. Fire
  end-of-month or on user prompt.
- **`multi-agent-execution`** — the substrate for the Dispatch role.
- Domain skills (`frontend-brain`, `sionna-expert`,
  `dgx-spark-remote-ops`, `ulap-network-stack`, `vault-updater`,
  `tutor`, etc.) — these are domain-specific policy modules the CTO
  routes to when the round's substance is in that domain.

The CTO skill stays a generalist; the domain skills are the
specialists. The CTO's job is to **know when to load which**, and
to **update them all** when the lesson lands there rather than here.
