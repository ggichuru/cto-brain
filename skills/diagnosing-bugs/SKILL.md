---
name: diagnosing-bugs
description: Model-invoked discipline for debugging without guessing. Fire when something is broken and the cause is not obvious. Reproduce, minimize, hypothesize, instrument, then fix — and lock the fix with a regression test. Read the FIRST error in the chain, not the last. Stops the flailing-edit anti-pattern. Inspired by mattpocock/skills `/diagnosing-bugs`.
---

# Diagnosing bugs — find the cause before you change code

Random edits make bugs worse and hide the real cause. This is the disciplined
path from "it's broken" to "here's why, and here's the test that proves it
won't come back."

## When to fire
- Anything broken whose cause isn't immediately obvious.
- A test that flakes, a 500 with no clear stack, "it worked yesterday."

## When NOT to fire
- The cause is obvious and the fix is one line. Just fix it (then add a test).

## The loop

1. **Reproduce.** Get a reliable, minimal repro — a command, a request, a
   failing test. If you can't reproduce it, you can't fix it; make reproducing
   it the first job. A flaky repro means you don't understand the trigger yet.
2. **Read the head of the error chain, not the tail.** The user-facing message
   ("save failed") is the tail. The first structured error/log line is the
   head and points at one cause. Fix the head.
3. **Minimize.** Strip the repro to the smallest input/code that still fails.
   Each thing you remove that *doesn't* change the failure rules out a suspect.
4. **Hypothesize, one at a time.** State a specific, falsifiable guess ("the
   pool reuses a connection without the pragma"). Predict what you'd observe if
   it were true.
5. **Instrument to confirm — don't fix on a hunch.** Add a log/assert/breakpoint
   that proves or kills the hypothesis. Confirm the cause before changing code.
6. **Fix at the cause**, not the symptom. Then **write the regression test**
   (the repro becomes a permanent test — this is the red step of `tdd`).
7. **Verify** the fix on the original repro and run the suite.

## Anti-patterns
- **Flailing edits** — changing things hoping one sticks. Each blind edit adds
  a variable and can mask the real cause. Stop; reproduce; instrument.
- **Fixing the tail** — patching the surface message while the head still fires.
- **No regression test** — a fix with no test invites the bug back next refactor.
- **Trusting "it should work"** — instrument and observe; the bug lives exactly
  where your assumption was wrong.

## Pairs with
`tdd` (the fix ends in a regression test), `cto-orchestration` Role 8 Operate
(operate the running stack to reproduce; read the first log line).
