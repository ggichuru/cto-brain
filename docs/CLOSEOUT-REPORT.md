# The close-out report (standing ritual)

**Rule:** every round closes with an operator-facing report. Not optional, not
"when it's a big round." If work happened, the report happens — written in a human
voice (apply the `human-voice-writing` discipline), aimed at the person in the
chair, not at a builder agent.

This sits next to the Role 9 growth-ledger write. Role 9 records *what the brain
learned* (one ledger row, for the brain). The close-out report tells *the operator
what changed and what to do* (a short memo, for the human). Both fire at the round
boundary.

## When

After the integrating commit, after subagents return, at a chair handoff, or when
the operator asks "where are we." Not mid-fanout with builders still running —
finish the round first.

## Shape (≈300–600 words, skimmable in under 3 minutes)

1. **Bottom line** — what shipped, gate status (tests/build), and the one thing
   still blocking "done" if anything.
2. **What changed** — plain before→after. No synonym soup; name the actual
   capability and the version.
3. **How to use it** — concrete, copy-paste commands grouped by job-to-be-done,
   using the tool in real work (not isolated demos).
4. **What's honestly not done** — known gaps with workarounds. Mark stub vs stable.
5. **The one move** — single recommended next action, with the command.

## Voice rules (from human-voice-writing)

- No throat-clearing openers, no "delve / leverage / seamless / robust /
  comprehensive," no tricolons of synonyms, ≤2 em-dashes per section.
- Stake + concrete: real commands, real numbers, real versions, named owners.
- Vary sentence length. End on the next move or a fact, never a pep talk.

## Template

```markdown
# <project>: where it stands, what changed, how to drive it
*Written <date>, from the CTO seat, after <round tag>.*

## Bottom line
<2–4 sentences: shipped, gate status, the one blocker.>

## What changed
<before → after, plain; name the capability + version.>

## How to use it
<job-to-be-done blocks with copy-paste commands, the tool in real work.>

## What's honestly not done
<gaps + workarounds; stub vs stable.>

## The one move
<single next action + the command.>
```

The canonical worked example of this report lives in the session history (the
v0.2→0.7 close-out) and the genre is the engineering-lead memo in
`skills/cto-orchestration/SKILL.md` → "Round handoff."
