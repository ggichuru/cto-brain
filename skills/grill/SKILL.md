---
name: grill
description: Fire BEFORE building anything non-trivial, or whenever a request is vague, broad, or likely to grow. A structured interview that surfaces the real scope — deploy target, distribution, proof bar, docs/media, design bar, positioning — and gets explicit sign-off before any brief is written. The front-end mirror of the close-out report. Model- or user-invocable. Inspired by mattpocock/skills `/grill`.
---

# Grill — align before you build

"No-one knows exactly what they want." The first stated ask is rarely the
whole ask. Grilling extracts the real one *before* you commit to a plan, so
you don't discover the scope mid-build (every late discovery forces a re-plan).

## When to fire
- Before decomposing any multi-step or multi-round build (it's the front end
  of `cto-orchestration` Role 1).
- Any time the request is vague ("make it better", "build me an X"), broad,
  or smells like it will grow.
- When you catch yourself about to assume a scope decision the human never made.

## When NOT to fire
- A single, fully-specified, reversible task. Just do it.
- Mid-flight, for one new requirement — that's a normal supplement, not a
  reason to stop and re-grill. (But **3+ mid-flight additions** = you skipped
  this skill; grill next time.)

## The loop

1. **Restate the ask in one sentence**, then ask "is that right?" Cheapest
   possible misalignment catch.
2. **Surface the load-bearing scope questions** — ask only the ones whose
   answer changes the plan:
   - **Deploy** — where does this run in production? (cloud / container / host / nowhere yet?)
   - **Distribution** — does anything get published? (a package, a registry, a tag, a link?)
   - **Proof bar** — what counts as done/tested? (it compiles / unit / e2e / recorded demo / a reviewer pass?)
   - **Docs & media** — README only, or tutorial + screenshots + video?
   - **Design bar** — functional-first, or branded/polished?
   - **Positioning** — does it need to beat or compare against alternatives?
   - **Constraints** — deadline, stack lock-ins, things you must not touch.
3. **Name what you're assuming** for anything they didn't answer, and let them
   correct it. Defaults are fine; *silent* defaults are not.
4. **Play back the resolved scope** as a short list and get a yes before fanning out.

## Output
A 5–10 line scope contract: the one-sentence goal, the answered scope
questions, the explicit assumptions, and the out-of-scope list. This becomes
the top of the first brief (and, in a CTO round, anchors the frozen contract).

## Anti-patterns
- Interrogating with 20 questions. Ask the 4–6 that move the plan; infer the rest.
- Grilling a trivial task into paralysis. Match grill depth to build size.
- Treating the asked ask as the whole ask. The job is the real one underneath.

## Pairs with
`cto-orchestration` (Role 1), `domain-modeling` (the answers seed `CONTEXT.md`),
and the close-out report (grill opens the round; the report closes it).
