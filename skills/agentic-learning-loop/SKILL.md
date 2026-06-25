---
name: agentic-learning-loop
description: Use when reasoning about HOW this brain learns — not what it should do, but the mechanism by which it gets better over time. Fires on questions about the round-close ritual, feedback file shape, the replay buffer, the policy update rule, exploration vs exploitation calibration, the always-running guarantee, periodic optimization cadence, or "is this thing actually learning or are we just writing docs?" Also fires when designing a new sub-skill that needs to plug into the loop, when debugging why a lesson isn't sticking, when the growth ledger shows a plateau, or when adapting the loop to a new domain. The formal description of the learning system that the cto-orchestration skill is the lead policy of.
---

# Agentic learning loop

> **Version 0.1.0** — 2026-05-15. The formal description of the
> brain's learning mechanism. Companion to `cto-orchestration` (the
> lead policy) and `meta-brain` (the router). Read this when you
> want to reason about how the system gets better, not what to do
> next.

The brain is an **agentic learning system** in the technical sense:
it has a policy, a replay buffer, an update rule, and a loop that
runs every turn. This skill describes the loop, names the
primitives, and tells you what to do when the loop is
under-performing.

---

## TL;DR

- **Policy** = the union of all `SKILL.md` files in
  `~/.claude/skills/` (mirrored at `~/claude-workspace/skills/`).
- **Replay buffer** = `~/.claude/memory/feedback_*.md` (mirrored to
  `~/claude-workspace/memory/`). Append-only. Frontmatter-tagged.
- **Update rule** = the round-close ritual in
  `cto-orchestration` Role 9: write a feedback file → propagate the
  lesson into the relevant skill **in the same turn**.
- **Periodic optimization** = `consolidate-memory` (weekly merge /
  prune) and `project-impact-scribe` (monthly reflection).
- **New-domain pattern** = `skill-creator` (rarely, 0–2× per month).
- **Exploration** = Critic role + devil's-advocate reviewer + the
  "what's wrong with this round?" pre-flight.
- **Exploitation** = Integrate role + frozen contracts + the
  existing rule stack.
- **Visibility** = `memory/growth_ledger.md`. One row per round.
  Append-only. The brain's autobiography.
- **Always-running guarantee** = the Stop hook (`auto-sync.sh`)
  syncs after every turn. State never drifts off-disk.

---

## When to fire

Load this skill when:

- You're designing a new skill and need to know how it plugs into
  the learning loop.
- The growth ledger shows a plateau (5+ no-op rows in a week) or a
  storm (5+ new rules without reuse) and you need to calibrate.
- A user asks "is this thing actually learning?" or "how does the
  brain grow?" and you need to answer with mechanism, not metaphor.
- A feedback file fired but the lesson didn't propagate — debugging
  the update step.
- You're about to put `consolidate-memory` or `project-impact-scribe`
  on a schedule and need to know the right cadence.
- A reviewer trio surfaced something meta — "you keep doing X
  inconsistently across skills" — and the fix is in the loop, not
  in any one skill.

## When NOT to fire

- Day-to-day CTO work — that's `cto-orchestration`.
- Routing a fresh ambiguous intent — that's `meta-brain`.
- Domain-specific work — load the domain skill.
- Writing a single new feedback file in a normal round — that's
  just Role 9; you don't need to reason about the meta.

---

## The mechanism

### 1. The policy

Every `SKILL.md` file is a **policy module**. Together they form
the full policy π(action | state). Each policy module:

- Has a `name` and a `description` frontmatter that triggers loading
  on intent match.
- Encodes lived experience as concrete rules (when to fire, when
  not to, what to do, what to avoid).
- Is versioned with a `Version X.Y.Z — YYYY-MM-DD` line near the
  top.
- Grows monotonically — old rules are not deleted unless explicitly
  contradicted by a newer lesson (in which case the contradiction
  is recorded in `consolidate-memory`'s notes).

**The skill text IS the policy.** When you edit a SKILL.md, you are
literally updating the policy. There is no other policy.

### 2. The replay buffer

`~/.claude/memory/feedback_*.md` (mirrored to
`~/claude-workspace/memory/`) is the replay buffer. Each file is one
experienced lesson:

```yaml
---
name: feedback-<kebab-topic>
description: "One-sentence rule, future-tense."
metadata:
  node_type: memory
  type: feedback
  originSessionId: <session-uuid-or-tag>
---

When acting on <situation>, do <rule>.

Why: <one paragraph — the lesson from lived experience>

How to apply: <numbered list — concrete steps>

Anti-pattern to watch for: <what failure looks like>
```

Properties:

- **Append-only.** Lessons are not deleted; they are *consolidated*.
- **Frontmatter-tagged.** The `metadata.type: feedback` tag lets
  `consolidate-memory` find them as a group.
- **Cross-referenced from MEMORY.md.** Every new feedback file gets
  an index entry in the same turn.
- **Mirrored.** The Stop hook copies `~/.claude/memory/` →
  `~/claude-workspace/memory/` so the buffer survives
  machine-loss.

### 3. The update rule (Role 9 of cto-orchestration)

```
At the end of every round:
  signal = "did anything new happen?"

  if signal:
    1. Write memory/feedback_<topic>.md
    2. Add line to memory/MEMORY.md
    3. Edit the relevant SKILL.md (CTO, domain, or this one) IN THE SAME TURN
       — if no skill is the right home, fire skill-creator
    4. Append row to memory/growth_ledger.md
  else:
    append "no-op" row to memory/growth_ledger.md

  (always) auto-sync hook fires → ~/claude-workspace/ updated
```

The rule is non-skippable. **Deferring the update step is the most
common bug in the loop.** "I'll write it later" never works, because
six rounds later the context has decayed and you don't write it at
all. Write it now.

### 4. Periodic optimization

The replay buffer needs maintenance. Without it, duplicates
accumulate, stale rules linger, and the policy degrades.

| Skill | Cadence | What it does |
|---|---|---|
| `consolidate-memory` | Weekly (or on contradiction / 3+ near-dupes) | Merge similar feedback files, prune entries about issues that are now structurally fixed, rewrite MEMORY.md index for clarity |
| `project-impact-scribe` | Monthly (or on user prompt) | Larger-scale reflection across the whole monorepo; produces the AMINI Project & Impact Report; surfaces patterns invisible at the round level |
| `skill-creator` | As needed (rare; 0–2× per month) | When a recurring pattern doesn't fit any existing skill, create a new policy module |

These can be put on the `schedule` skill so they fire automatically:
`schedule consolidate-memory weekly`, `schedule project-impact-scribe
monthly`. Already-stored growth ledger rows make the inputs
deterministic.

### 5. Exploration vs exploitation

The default disposition is **exploitation** — follow the existing
rules, dispatch the proven brief shapes, integrate cleanly, ship.
That's how 90% of rounds should run.

Exploration is forced when:

- The growth ledger shows 5+ consecutive no-op rows → the brain is
  plateauing. Run a pure-Critic round against the current skill
  stack ("what's wrong with how I've been working?") and write any
  finding as a feedback file.
- A reviewer trio surfaces something the existing skills don't
  cover → that's exploration handed to you. Capture the rule.
- The user says "let's try X differently" → explicit exploration
  budget granted by the human.
- A new domain enters (new project, new stack, new partner) → the
  early rounds are exploration-heavy by definition; write the
  early lessons aggressively because they compound.

**Exploration without capture is wasted exploration.** If a round
explores and produces no feedback file, the variance was
unobservable.

### 6. The always-running guarantee

Three mechanisms keep the loop alive even when the CTO seat is
empty:

1. **Stop hook auto-sync** — after every Claude turn, `auto-sync.sh`
   mirrors `~/.claude/skills/` + `~/.claude/memory/` +
   `~/.claude/settings/*.json` to `~/claude-workspace/`. State
   cannot drift off-disk. (Setup: `bootstrap/install-hook.sh`.)
2. **Growth ledger append** — every round writes at least a no-op
   row. The loop's observation record is continuous.
3. **Scheduled maintenance** — `consolidate-memory` and
   `project-impact-scribe` can be registered with the `schedule`
   skill so they fire on their own cadence without user prompting.

The user does not need to remember to "make the brain learn." The
mechanism is in the structure.

---

## How to plug a new skill into the loop

When `skill-creator` produces a new skill, wire it in cleanly:

1. **File location.** `~/.claude/skills/<name>/SKILL.md`. The Stop
   hook will mirror it to `~/claude-workspace/skills/<name>/`.
2. **Frontmatter.** Must have `name` and `description`. The
   `description` is what triggers loading — be specific about
   when-to-fire and when-not-to-fire.
3. **Version line.** `> **Version 0.1.0** — YYYY-MM-DD` near the
   top. Bump on every meaningful edit.
4. **When to fire / When NOT to fire** sections. Both required.
   These are the policy module's gating conditions.
5. **Cross-link.** If the new skill is downstream of CTO, add it to
   `cto-orchestration`'s self-enablement protocol table. If it's a
   peer of `agentic-learning-loop`, add a coupling-to-companion-skills
   row here. If it's domain-specific, add an entry to the
   `meta-brain` skill's catalog.
6. **MEMORY.md entry.** One-line index entry pointing to the skill's
   purpose.
7. **Initial feedback corpus.** If the skill was born from a
   feedback file, that file is the first "lesson" — link it in the
   skill body so the genesis is auditable.

---

## How to debug a stuck loop

### Symptom: rules don't stick

The same mistake recurs across rounds even though a feedback file
exists for it.

**Diagnosis:** the lesson is in the replay buffer but did not
propagate to a SKILL.md. The buffer informs the policy only via the
update step.

**Fix:** in the next round-close ritual, edit the relevant skill to
encode the rule explicitly. Add a row to the appropriate
table / anti-patterns list / pattern stack section.

### Symptom: the growth ledger is mostly no-op

Many rounds, few captured lessons.

**Diagnosis:** either (a) the rounds are genuinely routine (good —
the policy is mature for this domain) or (b) signals are firing but
not being captured (bad — exploration deficit).

**Fix:** run a single pure-Critic round. Read the last 5 rounds'
ledger entries. Ask: "for each, was anything surprising? did I make
any judgment call I might do differently next time? did the user
react in a way I didn't predict?" Write any finding as a feedback
file. If the answer is genuinely "no surprises", the domain is
mature — schedule `project-impact-scribe` for the larger view.

### Symptom: contradictory rules

Two feedback files say opposite things.

**Diagnosis:** the domain shifted between the two writes, or the
older rule was wrong.

**Fix:** fire `consolidate-memory` immediately. Determine which rule
is current; rewrite as one feedback file naming the deprecation
explicitly. Edit any skill that referenced the deprecated rule.

### Symptom: a skill never fires when it should

The description doesn't match the way the user actually frames the
intent.

**Diagnosis:** description-engineering problem. The frontmatter
`description` is the trigger; if the keywords aren't there, the
skill stays cold.

**Fix:** `skill-creator` in edit mode, focused on the description.
Add the user's actual phrasings. Add adjacent vocab (the
`skill-creator` skill has guidance on this — it covers description
optimization specifically).

### Symptom: the loop feels like documentation, not learning

The criticism: "this is just writing docs and calling it RL."

**Response:** the difference is *closed-loop coupling*. Docs that
nobody reads back are dead. The skill-loading mechanism reads the
policy back into context every relevant turn. That's the loop. The
feedback files don't sit in a drawer; they propagate into the
skills, which then shape the next round's behavior, which produces
the next observation. Same closed loop as any RL system — just with
human-curated updates and a prompt-context substrate instead of
gradient-updated weights.

If the loop genuinely feels stuck, the diagnostic is whether the
last 10 rounds' rules ever fired in subsequent rounds. If yes, the
loop is working. If no, the propagation step is broken.

---

## Companion skills

- `cto-orchestration` — the lead policy. Role 9 is the update
  trigger. Every round closes through it.
- `meta-brain` — the router. Loads the right policy module on
  ambiguous intent.
- `skill-creator` — creates new policy modules.
- `consolidate-memory` — replay-buffer maintenance.
- `project-impact-scribe` — monthly reflection layer.
- `schedule` — automates the maintenance cadence.

### IC disciplines (model-invoked, fired inside a round)

These are **policy modules at the inner-loop scale** — the agent fires them
mid-task while executing, and their outputs feed the loop's reward signal
(a clean `tdd` cycle, a confirmed `diagnosing-bugs` root cause, and an
upfront `grill` all reduce the rework that shows up as negative reward).
Credited to `mattpocock/skills`.

- `grill` — surfaces real scope before a round starts (front end of Role 1).
  Under-grilling shows up later as mid-flight scope churn → negative reward.
- `tdd` — the fast feedback loop; a failing-then-passing test is the
  cheapest local reward signal there is.
- `diagnosing-bugs` — turns a failure into a confirmed cause + regression
  test (a captured lesson, not a guess).
- `domain-modeling` — maintains `CONTEXT.md`, the project-local shared
  vocabulary that lowers the token cost of every future round.

When you add such a discipline, classify it **model-invoked** (see
`meta-brain` → Skill invocation classes) and list it here so the loop
accounts for it.

---

## What this skill enables

A learning system that:

- Compounds. Every round either captures a lesson or confirms the
  domain is stable. No round is neutral.
- Audits. Every policy update is a git commit on
  `claude-workspace`. You can walk backward through the brain's
  history.
- Survives machine loss. The Stop hook + the
  `claude-workspace` repo make the policy and replay buffer
  portable.
- Runs without being asked. The mechanism is in the structure;
  the human only needs to provide signal.

The brain isn't a metaphor. It's a closed-loop policy-iteration
system with a memory-augmented in-context policy. The mechanism is
established (Sutton & Barto policy iteration + Brown et al. 2020
in-context learning + Park et al. 2023 generative agents). The
contribution here is the *operational discipline* — the Role 9
ritual, the feedback frontmatter shape, the growth ledger, the
maintenance cadence — that makes the mechanism actually run every
day.

---

## The always-evolving rule

This skill is also a policy module. Update it whenever:

- The loop's mechanism gets refined (new update rule, new replay
  buffer shape, new periodic optimizer)
- A debugging pattern not in "How to debug a stuck loop" emerges
- A new companion skill joins the brain
- The exploration / exploitation calibration heuristics shift

Same rule as `cto-orchestration`: if you find yourself improvising
a learning-loop decision this skill doesn't cover, **stop, decide,
write the rule**, then move on.
