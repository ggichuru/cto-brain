---
name: tdd
description: Model-invoked discipline for writing code against a fast feedback loop — red, green, refactor. Fire when building or changing logic that has a definable correct answer (parsers, calculations, state machines, API handlers, bug fixes). Write the failing test first, make it pass with the least code, then refactor on green. Not for exploratory spikes or pure UI styling. Inspired by mattpocock/skills `/tdd`.
---

# TDD — red, green, refactor

A tight feedback loop is the cheapest constraint on correctness. Write the
test that fails, write only enough code to pass it, then clean up while the
test holds you safe.

## When to fire
- Logic with a definable correct answer: parsers, calculations, validators,
  state machines, API handlers, data transforms.
- **Bug fixes** — the regression test that reproduces the bug *is* the red step.
- Anywhere you'd otherwise "write it and eyeball it."

## When NOT to fire
- Exploratory spikes / prototypes where the shape is unknown (spike first,
  then re-TDD the keeper — see `/prototype` thinking).
- Pure visual styling with no logic.
- Throwaway one-off scripts.

## The loop

1. **Red** — write one small failing test that states the next increment of
   behavior. Run it; watch it fail *for the right reason* (a wrong assert is a
   silent trap). One behavior per test.
2. **Green** — write the **least** code that makes it pass. Resist designing
   ahead; the next test will pull the design forward. Run the whole file green.
3. **Refactor** — with the suite green, improve names, remove duplication,
   extract functions. Re-run after every change. Never refactor on red.
4. Repeat in small steps. The smaller the red→green hop, the faster the loop
   and the clearer the failure when it breaks.

## Rules that keep it honest
- **Test behavior, not implementation.** Assert on the public surface so
  refactors don't break tests.
- **One reason to fail per test.** If a test can fail two ways, split it.
- **See it fail before you make it pass.** A test that never failed proves nothing.
- **Keep the loop fast.** If the suite takes minutes, the loop dies — isolate
  the unit, mock the slow edges.

## Done
The behavior is covered by a test that failed before the code existed and
passes now; the suite is green; the code is refactored. In a CTO round, this
is what "tested" means in a builder brief's done-criteria.

## Pairs with
`diagnosing-bugs` (its fix step ends in a TDD regression test),
`cto-orchestration` (builder briefs cite the test as the done-bar).
