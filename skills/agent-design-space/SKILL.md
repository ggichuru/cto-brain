---
name: agent-design-space
description: >
  The design lens for building agentic (not completion) systems — the recurring
  questions every production agent must answer, and the values that decide them.
  Fires whenever the work is about the *harness* around a model rather than the
  model itself: permission/safety posture, context management, subagent
  isolation, extensibility (skills/hooks/MCP/plugins), memory & persistence,
  recovery, verification oracles, or the WHERE/WHEN/WHAT/WITH-WHOM boundaries of
  where an agent runs. Also fires on "is our harness right", "should this be a
  skill or a subagent", "how do we compact", "how should permissions work",
  "how do we know it actually succeeded", "make jarvis/ubongo/cto-code
  proactive / multi-project / multi-user". Distilled from VILA-Lab's "Dive into
  Claude Code" (arXiv:2604.14228) into original doctrine for this stack — a
  design-review lens cto-brain runs a build through, not a coding recipe.
metadata:
  type: reference
  source: "Liu, Zhao, Shang, Shen — Dive into Claude Code (arXiv:2604.14228), VILA-Lab/MBZUAI+UCL. Paper is CC BY-NC-SA 4.0: this skill is original synthesis + citation, never a copy of its prose or diagrams."
  version: 0.1.0
  last_updated: 2026-07-16
---

# agent-design-space — the harness design lens

> **The thesis, in one line:** in a real agentic system almost none of the value
> is the model's reasoning — it is the *deterministic machinery wrapped around a
> model that reasons freely*. The paper measured Claude Code v2.1.88 at roughly
> **1.6% AI decision logic, 98.4% operational infrastructure**. As frontier
> models converge, the differentiator moves from decision *scaffolding*
> (planners, state graphs) to a rich operational *harness*. **This is our whole
> sovereignty bet stated as engineering:** invest in the harness, treat the
> model as swappable — including down to the local floor.

This skill is a **lens, not a builder.** `cto-brain` runs a build; this skill is
the checklist it holds the build against. It answers *what questions a harness
must decide* and *which of our surfaces already decides them*. It never writes
code by itself — it tells `cto-brain` / `cto-orchestration` where the harness is
thin.

---

## When to fire

- You are designing or reviewing the *harness* — permissions, context/compaction,
  subagent isolation, extensibility, memory, recovery, verification — not the
  business logic inside it.
- Someone asks "should this be a skill or a subagent?", "how do we know it
  actually succeeded?", "how should permissions work here?", "how do we compact?"
- You are pushing an agent past a boundary: run it **elsewhere** (remote/edge),
  **unprompted** (scheduled/reactive), across **many projects**, or for **many
  users** — the WHERE/WHEN/WHAT/WITH-WHOM axes below.
- A new agentic surface enters the stack (jarvis, ubongo, cto-code, a gateway)
  and needs its design space made explicit before it grows.

## When NOT to fire

- The deliverable is business logic with a definable right answer → `tdd`.
- You need the spec written → `spec-driven`. This lens feeds the spec; it isn't it.
- Prompt wording / context ordering for a chosen model → `prompting-context-engineering`.
- Dispatch mechanics (briefs, file scopes, integrating commit) → `cto-orchestration`.

---

## The four questions every production agent must answer

Before any agentic surface ships, name its answer to all four. A blank answer is
a design hole, not a default.

1. **Where does reasoning live?** — Model reasons about *what* to do; the harness
   decides *whether* to allow it. Bias to **minimal scaffolding, maximal harness**
   (Principle 7). If you find yourself building a planner/state-graph to constrain
   a capable model, ask whether a stronger harness (gates, compaction, oracles)
   would serve better.
2. **What is the binding resource constraint?** — Almost always the **context
   window**. Treat it as scarce, *managed* infrastructure (provision, monitor,
   compress in layers) — not a fixed wall you hit and crash into.
3. **What is the default safety posture?** — **Deny-first: deny > ask > allow,
   strictest rule wins.** A broad deny is never overridable by a narrow allow.
4. **How many execution engines?** — Prefer **one loop** behind every interface
   (CLI, API, IDE, gateway). Divergent engines per surface is where behavior
   drift and safety gaps breed.

---

## The 13 design principles — used as a review checklist

Each principle is an *axis* (a question with a spectrum of answers), followed by
**our answer / where we already implement it**. Run a harness against this list;
every "we don't" is a candidate slice.

1. **Deny-first with human escalation** — unrecognized action → block or escalate,
   never silently allow. *Ours: fail-closed gate instinct (amini-cloud, blockchain
   gate contracts); the confirm-gate in ubongo.*
2. **Graduated trust, not a fixed level** — trust is a spectrum traversed over
   time, not a switch. *Ours: thin today — trust resets each session (see #6).*
3. **Defense in depth** — multiple overlapping safety layers via *different*
   techniques; no single gate suffices. Watch the failure mode: **layers that all
   degrade under the same constraint fail together.**
4. **Externalized, programmable policy** — policy in configs + lifecycle hooks,
   not hardcoded. *Ours: hooks (Stop-hook sync, ntfy alerts), settings.json.*
5. **Context as a scarce resource, progressively managed** — compact in graduated
   layers, cheapest first (see the compaction ladder below). *Ours: `/compact`
   discipline; extend upstream.*
6. **Append-only durable state** — logs over mutable snapshots; optimize for
   **forensic reconstruction over query power**. *Ours: growth ledgers, JSONL
   telemetry.*
7. **Minimal scaffolding, maximal harness** — invest in infra that lets the model
   reason freely, not scaffolding that constrains it. *Ours: the sovereignty bet.*
8. **Values over rules** — contextual judgment backed by deterministic guardrails,
   not rigid decision trees. *Ours: KKP as the value layer.*
9. **Composable extensibility at graduated context cost** — layered mechanisms at
   different costs, not one unified API (see cost model below). *Ours: skills +
   hooks + MCP + adapters.*
10. **Reversibility-weighted risk** — lighter oversight for reversible/read-only
    actions, heavier for destructive/outward-facing. *Ours: the "confirm hard-to-
    reverse actions" rule.*
11. **Transparent file-based config & memory** — user-visible, version-controlled
    files; no opaque DB/embeddings. *Ours: MEMORY.md + pointer index — the paper
    independently validates this exact pattern (LLM scans headers, picks ≤5 files;
    no vector DB).*
12. **Isolated subagent boundaries** — subagents get an isolated context, escalate
    permissions to the parent (`bubble`), and **return a summary, never their
    transcript**. *Ours: `multi-agent-execution` default; Workflow subagents.*
13. **Graceful recovery** — silently recover the recoverable; reserve human
    attention for the genuinely unrecoverable. *Ours: agent-death-recovery.*

---

## The three cross-cutting patterns (the meta-lessons)

When in doubt, these three decide the shape:

- **Graduated layering over monolithic mechanisms.** Layer several strategies at
  increasing cost (compaction, safety, extensibility) — never one gate, one
  compressor, one API.
- **Append-only, auditability over query power.** Design state so a human (or an
  auditor, or tomorrow's session) can reconstruct exactly what happened.
- **Model judgment inside a deterministic harness.** Let the model reason freely
  about *what*; let deterministic infra decide *whether*. As models improve, move
  investment from scaffolding → harness robustness.

---

## Two load-bearing cost models to internalize

**Skill vs subagent (the context-cost lever).** Injecting a skill's instructions
runs in the *current* context window — cheap, but it spends your live budget.
Spawning a subagent opens a *new* isolated window — context-safe, but costs
multiples more tokens and returns only a summary. **Rule:** inline a skill for
guidance you want *in* the working context; spawn a subagent when the work is
noisy, isolatable, and you only need the conclusion. This is the exact lever
behind `multi-agent-execution` and the Workflow `pipeline`/`parallel` choice.

**The extensibility cost ladder** (cheapest → dearest context cost):

| Mechanism | Context cost | Reach for it when |
|---|---|---|
| **Hook** | negligible | cross-cutting automation (sync, alerts, guards) |
| **Skill** | low (lazy-loaded) | reusable guidance/doctrine, loaded on trigger |
| **Plugin** | low | bundling commands+agents+skills+hooks together |
| **MCP** | medium–high (schemas) | external tool reach you can't get otherwise |

Corollary: **MCP is a supply chain.** Tools/skills need versioning, deprecation,
rollback, and allowlists — a tool's return value is *untrusted input* (a poisoned
API payload can carry instructions). Never wire an auto-loaded hook/MCP you
wouldn't run as a boot script with your own authority.

---

## The graduated compaction ladder (cheapest-first, before every model call)

Don't summarize-or-truncate in one step. Apply least-disruptive first:

1. **Per-result budget** — cap oversized tool results; replace with references.
2. **Snip** — trim old history lightly.
3. **Microcompact** — fine-grained, cache-aware compression.
4. **Context collapse** — read-time projection into a side store (non-destructive).
5. **Full auto-compact** — model-generated summary; last resort only.

Plus the standing scarcity moves: lazy-load memory, defer tool schemas until
needed (this very environment does — ToolSearch), and have subagents return
summaries. *For local models specifically, layers 1–2 matter most — the "262k
default ctx broke the 30s timeout" lesson lives here.*

---

## The four future axes — WHERE / WHEN / WHAT / WITH-WHOM

The frontier of the harness is *its boundary*. For any agentic surface, name
where it sits on each axis today and where it's going. This is the roadmap lens
for jarvis, ubongo, cto-code, and the gateways.

| Axis | Today (single) | Frontier (evolve toward) | Our surface heading there |
|---|---|---|---|
| **WHERE** it runs | one machine/container | remote / cloud / edge, dynamically chosen | ubongo p9-body-senses, distributed-substrate |
| **WHEN** it acts | user-initiated turns | proactive: scheduled, reactive, background | ubongo p11-bounded-autonomy, cron/loop |
| **WHAT** it spans | single project | many projects / org contexts | lead-CTO tier, cross-project synthesis |
| **WITH WHOM** | single user/session | multi-user, hierarchical approval chains | lead-CTO → subordinate CTOs; governance |

**The invariant across all four:** the *execution boundary is the safety
boundary.* Every time you push an axis outward, the deny-first gate, the
isolation, and the audit log must extend with it — never after it.

---

## Close the observability → improvement loop (the sharpest takeaway)

The paper's strongest forward call, and our strongest existing alignment:
**traces must feed evaluation, failure-clustering, and prompt/tool repair — not
end as passive logs.** Two concrete demands:

1. **Verification oracles independent of the agent's own reasoning.** An agent can
   meet surface criteria while the real outcome failed (silent/hallucinated
   success). Wire an *external* success test — the clean-bootstrap → up → health →
   exercise-demo loop; RestartCount deltas; PSI — as the verdict, never the
   agent's self-report. (`closing-check-finds-bugs`, `monitoring-blind-spots`.)
2. **Harness self-improvement from traces.** Hold the model fixed and search the
   *harness* — memory, retrieval, context construction, prompts, tool selection —
   against logged runs. This is precisely `agentic-learning-loop`'s job; the
   external references worth studying are Meta-Harness and agentic-harness-
   engineering (their own licenses apply — study, don't paste).

---

## How to use this lens in a build round

1. **At scope time** (`cto-brain` step 0–1): run the new surface through *The four
   questions* and any of *the 13 principles* it touches. Each unanswered question
   is a spec line.
2. **At design time:** apply the two cost models (skill-vs-subagent, extensibility
   ladder) to decide *where* new capability lives.
3. **At verify time** (`cto-brain` step 5): demand an **independent oracle**, not a
   self-report. If there's no oracle, the verdict is UNPROVEN.
4. **At roadmap time:** place the surface on the four future axes; the next
   faithful step is usually one axis, one notch — never all four at once.

---

## Composition map

| Skill | Relationship |
|---|---|
| `cto-brain` | Runs the build; loads this lens at scope/design/verify. This skill feeds its spec, never replaces it. |
| `cto-orchestration` | Owns dispatch; this lens explains *why* isolation + summary-return + deny-first are the defaults. |
| `agentic-learning-loop` | Owns the observability→improvement loop this skill names as the sharpest takeaway. |
| `spec-driven` / `tdd` | This lens surfaces the questions; those turn them into spec + failing tests. |
| `prompting-context-engineering` | The compaction ladder + skill-vs-subagent cost model are its context-engineering moves, stated as design principles. |
| Domain surfaces (ubongo, cto-code, jarvis, amini-cloud) | Each is a harness this lens reviews; the four future axes are their shared roadmap. |

---

## Source & license

Distilled from **"Dive into Claude Code: The Design Space of Today's and Future
AI Agent Systems"** — Liu, Zhao, Shang, Shen (VILA-Lab, MBZUAI + UCL),
arXiv:2604.14228, analyzing Claude Code v2.1.88. The paper and its repo are
**CC BY-NC-SA 4.0 (non-commercial, ShareAlike)**. This skill is **original
synthesis for our stack with attribution** — it reproduces none of the paper's
prose or diagrams. Adopt the ideas and cite the work; do not paste its text into
any commercial/proprietary surface. External reference implementations it links
(Meta-Harness, agentic-harness-engineering, superpowers, addyosmani/agent-skills)
carry their own licenses — check each before lifting code.
