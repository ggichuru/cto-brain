---
name: meta-brain
description: Use FIRST on any ambiguous intent — the router that maps the user's request to the right downstream skill(s). Fires on session start, on intent shifts mid-conversation, when the user mentions something the model doesn't have a clear single-skill home for, when multiple skills could fire, when the user asks "what skills do I have" / "what can the brain do", when a new project domain enters, or when you need to know whether to load CTO vs domain vs maintenance trio vs a brand-new skill. The brain's switchboard. Knows the catalog, the precedence order, the maintenance cadence, and the "if unsure" fallback.
---

# Meta-brain — the router

> **Version 0.2.0** — 2026-05-15. Added the lead-CTO vs
> regular-CTO tier distinction in routing. A multi-project /
> portfolio / cross-project intent fires lead-tier of
> `cto-orchestration`; a single-project intent fires regular tier.
> The skill is the same; the tier is the posture chosen on entry.
>
> **Version 0.1.0** — 2026-05-15. The top-level router that maps
> incoming intent to the right downstream skill. Sits above
> `cto-orchestration` as the very first read on ambiguous intent;
> cedes control to whichever skill the routing decision picks. Read
> this when you don't know which skill to load — it tells you.

The brain is a constellation of skills. Each one is a specialized
policy module. **Meta-brain is the routing layer** — it answers the
question "given this request, which skill (or skills) should be in
context?"

---

## TL;DR

- **Load first** on ambiguous or fresh intent. Cede control after
  routing.
- **The default route on a build/engineering ask** is
  `cto-orchestration`.
- **The default route on a meta-cognition ask** ("how does this
  work?", "is it learning?", "why does the brain do X?") is
  `agentic-learning-loop`.
- **The default route on a domain ask** is the matching domain
  skill (`frontend-brain`, `sionna-expert`,
  `dgx-spark-remote-ops`, `ulap-network-stack`, `vault-updater`,
  `tutor`, etc.).
- **The maintenance trio** (`skill-creator`, `consolidate-memory`,
  `project-impact-scribe`) is fired by CTO Role 9, not directly by
  the user — unless the user explicitly asks.
- **If genuinely unsure**, fire the routing question via
  `AskUserQuestion` with 2–3 candidate routes. Don't guess silently.

---

## When to fire

- Session start (especially after a `/compact` or `/continue`).
- The user's request could plausibly map to 2+ skills.
- A new project / domain has just entered the conversation.
- The user asks meta questions: "what skills do I have", "what
  can the brain do", "which skill handles X".
- You feel the urge to write a long response without loading any
  skill — that's a routing miss; load this first.

## When NOT to fire

- Inside an active CTO round mid-dispatch (you're already routed).
- The user's intent is unambiguous and a specific skill obviously
  fires (just load that skill).
- The user has explicitly named the skill ("use cto-orchestration
  for this").

---

## The brain catalog

This is the canonical, ordered list of skills currently in the
brain. Versioned. Keep it in sync when skills are added or removed.

### Meta-cognitive layer (the lead trio)

| Skill | Purpose | Fire when |
|---|---|---|
| `cto-orchestration` (regular tier) | The 9 CTO roles. Single-project orchestration. The pattern stack. Integration discipline. | Multi-step build *within one project*, agent dispatch, integration, review. **Default route for single-project engineering work.** |
| `cto-orchestration` (lead tier) | Orchestrator-of-orchestrators. Deploys subordinate CTOs (one per project), monitors via per-project growth ledgers + STATUS.md, synthesizes lessons across the portfolio. | 2+ active projects with concurrent cadence, portfolio review, weekly digest, monthly lead-round, cross-project pattern detection, charter authoring, subordinate-CTO deployment. **Same skill file; different tier of operation. See the skill's "Lead-CTO tier" section.** |
| `agentic-learning-loop` | Formal description of HOW the brain learns. State / action / reward / policy / replay buffer / update rule / periodic optimization. | Meta-cognition questions, designing a new skill that plugs into the loop, debugging a stuck loop, calibrating exploration vs exploitation. |
| `meta-brain` (this skill) | The router. Maps intent → skill. | Ambiguous intent. New domain. Session start. "Which skill?" questions. |

### Maintenance trio (fired by CTO Role 9, not usually direct)

| Skill | Purpose | Fire cadence |
|---|---|---|
| `skill-creator` | Create new policy modules, edit existing ones, optimize descriptions. | As needed (rare; 0–2× per month). On brand-new domain patterns. |
| `consolidate-memory` | Reflective pass over feedback files — merge duplicates, fix stale facts, prune the MEMORY.md index. | Weekly, or on contradiction / 3+ near-duplicates. |
| `project-impact-scribe` | Larger-scale monthly reflection. Captures brain-dumps, learns the surrounding code, produces the AMINI Project & Impact Report. | Monthly, end-of-month, or on explicit user prompt. |

### Execution substrate

| Skill | Purpose | Fire when |
|---|---|---|
| `multi-agent-execution` | The substrate for the CTO Dispatch role. Parallel agent fan-out, structured-summary contract. | Whenever CTO decomposes into ≥2 independent slices. CTO loads this implicitly. |
| `cto-brain router` | Policy-first model + stack routing (local Ollama/vLLM vs cloud APIs). CLI: `router list`, `router probe`, `router select --task <kind>`, `stack status`. | Pre-dispatch probe; pick runtime per builder vs reviewer lane; connect to already-running Desk engine / Ollama stacks. |
| `schedule` | Cron-like scheduling for skills that should fire on their own cadence. | Setting up the maintenance trio to auto-fire. Background ops. |

### IC disciplines (model-invoked, inner-loop)

The inner-loop disciplines a single agent fires while building — bundled with
cto-brain, credited to `mattpocock/skills`. They are **model-invoked**: a
user-invoked workflow (e.g. `cto-orchestration`) may call them; they never call
a user-invoked skill (see "Skill invocation classes").

| Skill | Purpose | Fire when |
|---|---|---|
| `grill` | Structured interview to surface real scope before building. | Before decomposing anything non-trivial; when a request is vague or likely to grow. (Front end of CTO Role 1.) |
| `tdd` | Red-green-refactor against a fast feedback loop. | Building/changing logic with a definable correct answer; every bug fix's regression test. |
| `diagnosing-bugs` | Reproduce → minimize → hypothesize → instrument → fix → regression-test. | Anything broken whose cause isn't obvious. Read the FIRST error, not the last. |
| `domain-modeling` | Build + maintain `CONTEXT.md` shared vocabulary. | Start of a build; when a concept gets re-explained; when a load-bearing noun appears. |

### Domain skills (project- or topic-specific)

> The domain rows below are **the author's own portfolio skills — examples, NOT
> bundled with the npm package.** They show the shape of a domain skill and how
> meta-brain routes to one. On a fresh install this table is your template: add
> your own project/domain skills here (`cto-brain init --project`, then author a
> skill), and delete the rows that don't apply to you. The core machinery
> (routing, the lead trio, the maintenance trio, the IC disciplines) IS bundled
> and project-agnostic.

| Skill | Domain | Fire when |
|---|---|---|
| `frontend-brain` | Frontend / UX product engineering | Frontend builds, UI/UX work, dashboard surfaces |
| `frontend-product-engineer` | Senior frontend / product eng patterns | React, Next.js, TypeScript, Tailwind, design-system, accessibility, "make this look better" |
| `dgx-spark-remote-ops` | DGX Spark FE node ops (spark-5804, Limuru) | Anything spark-5804 / dgx-ops / remote-ops |
| `ulap-network-stack` | Slate / ULAP network topology | Slate-specific networking, Headscale, overlay providers |
| `sionna-expert` / `sionna-rf-site-planning` | Sionna RT, RF site planning, 5G coverage | Anything RF, radio, propagation, coverage maps |
| `vault-updater` | OpenBao / Vault updates | Vault secret rotation, policy edits |
| `tutor` | Pedagogical mode | When Mike explicitly asks for tutor mode |
| `mkulyma-brand-council` | The four-agent brand council for mkulyma | Anything carrying the mkulyma name — brand, voice, naming, visuals |

### Document-creation skills (cowork plugins)

| Skill | Purpose |
|---|---|
| `docx` | Word document creation / editing |
| `xlsx` | Excel spreadsheets |
| `pptx` | PowerPoint decks |
| `pdf` | PDF creation, extraction, merge, split, OCR, forms |
| `canvas-design` | Visual art, posters, design pieces |
| `web-artifacts-builder` | Elaborate HTML / React / shadcn artifacts |
| `doc-coauthoring` | Structured workflow for docs / proposals / specs |

### Cowork / setup skills

| Skill | Purpose |
|---|---|
| `setup-cowork` | Guided Cowork onboarding |
| `cowork-plugin-management:create-cowork-plugin` | Build a new plugin from scratch |
| `cowork-plugin-management:cowork-plugin-customizer` | Tailor an existing plugin to an org |

---

## The routing decision tree

```
1. Is the request ambiguous or fresh-domain?
   → Read this skill, decide, then load the routed skill.
2. Is it engineering / building / agent-dispatch / integration?
   → cto-orchestration. Then pick a tier:
     a. Multi-project / portfolio / cross-project / weekly digest /
        deploy-a-CTO / monitor-other-CTOs → LEAD TIER. Read the
        "Lead-CTO tier" section first.
     b. Single project, regular round (decompose / dispatch /
        integrate / reviewer trio) → REGULAR TIER. The 9 roles
        as usual.
3. Is it a meta-cognition question ("how does this work")?
   → agentic-learning-loop.
4. Is it a specific domain (frontend, RF, dgx-ops, slate, mkulyma)?
   → that domain skill, optionally with cto-orchestration on top
     if the work is multi-day. If the domain is one of several
     active projects, the lead-CTO may also be on top (lead-tier
     reads it through the project's STATUS.md, doesn't dive in).
5. Is it document creation (docx / xlsx / pptx / pdf / canvas)?
   → that document skill. Always load BEFORE writing the file.
6. Is it a brand-new pattern with no obvious home?
   → cto-orchestration first (it'll Role-9 over to skill-creator
     when ready).
7. Is the user explicitly asking "what skills do I have / what can
   the brain do"?
   → render the catalog via the skills widget (mcp__skills__list_skills)
     or directly answer from this skill's catalog above.
8. Is the user asking about the portfolio, projects in flight,
   "what's going on across X", "which project should I prioritize"?
   → cto-orchestration LEAD TIER. Read memory/portfolio.md +
     latest memory/portfolio_digest_*.md.
9. Genuinely unsure between 2–3 routes?
   → AskUserQuestion with the candidates. Don't guess silently.
```

---

## Precedence rules

When 2+ skills could fire, use this precedence:

1. **User-named skill wins.** If the user said "use X", load X.
2. **Domain skill beats CTO** when the work is single-domain and
   short — load the domain skill, skip CTO.
3. **CTO beats domain skill** when the work is multi-day, multi-domain,
   or requires fan-out — load CTO; it'll bring in the domain skill
   via Role 2 (Dispatch) or Role 7 (Suggest+Ask) or as reference.
4. **Document skill always loads BEFORE writing the file.** Never
   skip docx/xlsx/pptx/pdf SKILL.md when creating those file types.
5. **Maintenance trio fires from CTO Role 9, not direct user
   prompt** — unless the user explicitly asks ("clean up memory",
   "write the monthly report").
6. **mkulyma-brand-council** fires alongside any other skill when
   the work touches the mkulyma brand. It's a steward, not a
   replacement.

---

## Skill invocation classes (composition contract)

Borrowed from `mattpocock/skills` and adopted here: every skill is one of
two classes, and the class governs how it may be composed.

- **User-invoked** — orchestrate a workflow; reached by the human via a
  slash command or named request. Examples: `cto-orchestration`,
  `project-impact-scribe`, the document-creation skills.
- **Model-invoked** — hold a reusable discipline the agent fires on its own
  mid-task. Examples: `agentic-learning-loop` (the Role-9 ritual),
  `multi-agent-execution`, `human-voice-writing`.

**The composition rule:** a user-invoked skill MAY call model-invoked
skills, but a user-invoked skill must **never** call another user-invoked
skill. (cto-orchestration loading `human-voice-writing` is fine;
cto-orchestration "calling" project-impact-scribe is not — it *routes* to
it via Role 9, a hand-off, not a nested call.) This keeps orchestration
flat and auditable: one workflow owner per round, disciplines layered
underneath. When you add a skill (see "How to extend"), declare its class.

---

## What this skill enables

- **Cold-start routing.** A fresh session with a vague intent
  doesn't drift; the router picks a lane.
- **No-guess loading.** Skills load deliberately, not by reflex
  pattern-match.
- **Catalog visibility.** The user can ask "what's in the brain"
  and get a structured answer.
- **Composition.** Multiple skills can be in context at once when
  the work spans domains.
- **Audit.** Routing decisions are explicit; you can read back why
  a given skill was loaded.

---

## How to extend

When a new skill is added (`skill-creator` ships it):

1. Add a row to the appropriate catalog table above.
2. Update the routing decision tree if a new branch is needed.
3. If the new skill belongs in the meta-cognitive layer, also
   update `cto-orchestration`'s self-enablement protocol table
   and `agentic-learning-loop`'s companion-skills section.
4. Bump this skill's version line and date.
5. Append a row to `memory/growth_ledger.md` describing the brain
   change.

When a skill is deprecated:

1. Mark it `(deprecated)` in the catalog with a one-line reason +
   replacement pointer. Don't delete the row immediately —
   `meta-brain` is also a history of the brain.
2. Add a note to `consolidate-memory` to fold any feedback files
   that referenced the deprecated skill into the replacement.

---

## The always-evolving rule

Same rule as the rest of the brain. If you find yourself improvising
a routing decision this skill doesn't cover, **stop, decide, write
the rule** here before moving on. Routing is the cheapest place to
update the brain — the cost of a stale router is wasted skill-load
time across hundreds of future rounds.
