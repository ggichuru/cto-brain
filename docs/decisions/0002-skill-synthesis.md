# ADR 0002 — Skill synthesis (privacy-first), design only

**Status:** Proposed (2026-06-25). Design-first — **no code ships until this ADR is accepted.**

## Context

The operator wants cto-brain to "build itself out" — discover relevant skills
or patterns in a workspace it's running in, and synthesize new reusable skills
— **without exposing any user info, IP, or keys.** This is high value (the
brain compounds) and high risk (reading a workspace can ingest secrets and
proprietary code). The risk, not the feature, is what this ADR governs.

## Decision (proposed)

Add a `cto-brain skill synth` capability with **privacy enforced by
construction**, reusing cto-brain's existing guardrails rather than inventing
new ones:

1. **Gate-before-read.** Every candidate file is checked against the credential
   patterns + `.cto-brainignore` (`src/sync/non-destructive.mjs`,
   `src/gate/pack.mjs`) *before* its contents are read into synthesis. A file
   that trips the gate is never opened.
2. **Pattern-only output.** Synthesis emits *abstracted patterns and process*
   — never verbatim proprietary code, file paths, identifiers, URLs, env, or
   keys. Same discipline as telemetry (metadata, not content).
3. **Draft + human review, never auto-publish.** Output lands as a draft under
   `.cto-brain/skills-draft/`, runs through `gate check`, and is promoted to a
   real skill only by an explicit human step. No synthesized skill is ever
   auto-wired or auto-packed.
4. **Allowlist scope.** The operator names which directories synthesis may scan;
   default scope is the project's own `.cto-brain/` + explicitly passed paths,
   not the whole filesystem.
5. **Provenance, not content.** A draft records *that* a pattern was observed
   (and in how many places), not the source text.

## Consequences

**Good:** the brain can grow its own skill set from lived workspace experience,
auditably, with the credential gate as a hard floor. **Bad / watch:** "pattern
abstraction" is a model judgment — a sloppy synthesis could still echo
proprietary specifics, so the **gate runs again on the draft** and a human
reviews before promotion; drafts are gitignored by default. Net new surface is
one module + one command behind the existing gate — no new dependency, no
runtime, no network.

## Alternatives considered

- **Read freely, redact after** — rejected; gate-before-read is safer than
  redact-after (you can't leak what you never opened).
- **Auto-promote synthesized skills** — rejected; violates the human-review and
  no-auto-publish invariants.
- **Embed source snippets for fidelity** — rejected; that is exactly the IP/secret
  exposure the operator forbade. Pattern-only or nothing.
- **Do nothing** — rejected; the compounding-skills value is real, but only
  worth it with these guardrails.

## Acceptance criteria (before any code)

Operator sign-off on: the gate-before-read rule, pattern-only output, draft +
human-review (no auto-publish), and the allowlist default scope.
