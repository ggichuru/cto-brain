---
name: domain-modeling
description: Model-invoked discipline for building and maintaining a project's shared vocabulary in CONTEXT.md. Fire when a project keeps re-explaining the same concept, when a new load-bearing noun appears, or at the start of a build to name the domain. One agreed word replaces a 20-word paragraph every round — cutting tokens and speeding navigation. Inspired by mattpocock/skills `/domain-modeling`.
---

# Domain modeling — name the domain once

Most verbosity and most misunderstanding come from the team and the agents not
sharing words for the same things. Domain modeling fixes that by maintaining a
single `CONTEXT.md`: the project's agreed vocabulary, the load-bearing nouns,
and links to the ADRs that define them.

## When to fire
- Start of a build — name the core concepts before writing code.
- A concept gets re-explained across two rounds (the re-explanation is the signal).
- A new load-bearing noun appears (a status enum, a lifecycle, a role, an entity).
- An agent or person uses two different words for the same thing — collapse them.

## The discipline

1. **Find the nouns that carry weight.** The entities, states, and lifecycles
   the system is *about* — not every variable, the ones that recur in
   conversation and code.
2. **Name each one, once.** Pick the word the team will actually say. Define it
   in one line. Ambiguity here costs a paragraph every future round.
3. **Write it to `CONTEXT.md`** (see `templates/CONTEXT.md`): a term table
   (term · one-line meaning · defining ADR), the load-bearing nouns with where
   they live in code, and the conventions the project assumes.
4. **Link, don't duplicate.** Each term points at its ADR (`docs/decisions/`)
   for the *why*; `CONTEXT.md` holds only the *what* + the word.
5. **Keep it short and current.** When a term changes meaning, update the line
   and the ADR in the same turn. A stale glossary is worse than none.

## Why it pays
- **Tokens.** "the materialization cascade" replaces re-deriving the concept
  every prompt.
- **Navigation.** A new agent reads `CONTEXT.md` and `docs/decisions/` and is
  oriented without spelunking the code.
- **Alignment.** Shared words are shared mental models; disagreements surface
  as "we mean different things by X" instead of silent divergence.

## Output
A current `CONTEXT.md` at the repo root. In a CTO round, it's part of the
durable-context set (alongside ADRs and the frozen contract) and the first
thing a builder brief points a fresh agent to read.

## Pairs with
`grill` (the grill's answers seed the first terms), `cto-orchestration`
(Context engineering — `CONTEXT.md` is now a first-class durable-context file).
