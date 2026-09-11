---
name: documentation-discipline
description: >-
  The default documentation discipline for every project. Fires whenever docs are written,
  changed, or judged: a README, CHANGELOG, architecture doc, guide, spec, doc-comment, or any
  docs/ file; when a code change alters behaviour a doc describes; at round-close before
  handing work back; and on "update the docs", "is this doc current", "fix the docs",
  "document this", "write a changelog", "our docs mislead people", "keep docs and code in
  sync". Enforces three things that decide whether documentation helps or harms: doc-to-code
  TRUTH (a doc contradicting the code is a bug, fixed the same round); CURRENCY plus a
  changelog entry; and READABILITY, leading with what the thing IS so a newcomer understands
  and a maintainer can keep it true. Apply by default even when not named.
metadata:
  type: reference
---

# Documentation discipline

Documentation is the promise the code makes to the people who did not write it —
the next maintainer, the teammate onboarding, the partner evaluating, the future
you. A doc that is wrong is worse than no doc: it misleads with the authority of
the repo behind it. This skill is the standing discipline that keeps docs *true,
current, and readable* on every project, by default, without being asked.

It exists because of a real failure: an engineer read a product as "a front for
our chain" because the docs led with the chain. The code was fine. The docs lied
by emphasis. That is the class of bug this skill prevents — not just factual
errors, but *framing* errors, staleness, and prose only its author can read.

---

## The core principle

**A doc is code's shadow. When they disagree, the code is the truth and the doc
is the bug — fix it in the same round.** Never quietly let prose drift from
behavior, and never "spec the bug" by editing a doc to match a defect (if the
code is wrong, that's a code bug; file it — don't launder it through the docs).

Three properties, always, in this order:

1. **True** — every claim matches the code, verified, not remembered.
2. **Current** — the README and every doc the change touched are up to date *this
   round*, and the change is in the changelog.
3. **Readable** — it leads with what the thing *is*, in plain human voice, so a
   newcomer understands and a maintainer can keep it true.

---

## When to fire

- You are writing or editing any README, CHANGELOG, architecture doc, guide,
  runbook, spec, ADR, doc-comment, or `docs/**` file.
- A code change alters behavior, an API, a flag, a default, a port, a command, or
  a capability that a doc describes — the doc must move with it.
- Round-close, before handing work back: the "did I leave the docs true?" gate.
- Someone asks "update the docs", "is this current", "does the README explain
  this", "our docs mislead", "document this", "write the changelog", "make it
  readable".
- You notice a doc that reads like marketing, buries the lede, or can only be
  understood by its author.

## When NOT to fire

- Pure code with no documented surface and no user-facing behavior change (a
  private refactor with green tests) — though check whether a doc-comment or
  CHANGELOG line is owed.
- A throwaway spike you will delete. (If it survives, it owes docs.)
- The actual writing *craft* question ("how do I phrase this system prompt")
  belongs to `prompting-context-engineering`; this skill decides *what must be
  documented and that it's true*, and calls that skill for the *how*.

---

## The discipline — a round-close checklist

Run this before you consider documentation work done. It is short on purpose;
each item prevents a specific, real failure.

- [ ] **Truth pass.** Every load-bearing claim in the docs I touched traces to a
      file, a command output, or an observed fact — not memory. Names (binaries,
      services, flags, ports, endpoints, tags) match the current code. I grepped
      to confirm, I didn't recall.
- [ ] **Lede pass.** The doc leads with *what the thing is* in the first
      paragraph. The most important truth is at the top, not buried. Emphasis
      matches reality (don't give a 10%-built feature top billing over the
      product).
- [ ] **Currency pass.** The README and every other doc this change touched are
      updated in THIS round. No "I'll fix the docs later." (Later is where docs
      go to rot.)
- [ ] **Changelog pass.** The change is recorded — CHANGELOG.md, release notes,
      or the project's equivalent — in one honest line a human can read.
- [ ] **Honesty pass.** Proven / beta / planned / stubbed / optional are labeled
      as such. No capability is implied beyond what the code does. Diagrams draw
      optional/simulated/roadmap parts as optional/simulated/roadmap (see
      arch-topology-diagrams).
- [ ] **Readability pass.** A newcomer could read it and understand. Plain words,
      short sentences, the operator's calm human voice (see the voice guide
      below). No unexplained jargon, no hype, no AI-tells.
- [ ] **Link pass.** Cross-links resolve; a reader can get from the overview to
      the detail and back. New canonical docs are linked from the README/index.

If a project has a docs-accuracy audit tool (e.g. `vault-updater`, an OpenSpec
`validate`, a link-checker), run it — but the checklist above is the discipline
even when no tool exists.

---

## Doc↔code truth — how to actually verify

Don't trust the doc and don't trust your memory. Trust the repo.

- **Names and surfaces:** grep for the binary/service/flag/port/endpoint the doc
  names. If the doc says `slate-admission` and the code says `amini-admission`,
  the doc is stale. If it says "port 8080" grep the compose/config.
- **Optionality and defaults:** a doc claiming "X is on" must match the default in
  config. "off by default" is a checkable fact (`grep DEFAULT`, read the compose
  env). This is exactly where framing bugs hide.
- **Build tags / feature flags:** if a capability is behind a tag or flag, the
  doc must say so. A capability the stock build doesn't include must never be
  described as always-present.
- **Counts and status:** "18 templates", "252 tests", "v0.3.1-beta" — verify with
  a command (`git ls-files`, `wc -l`, `git describe`) and date the review.
- **When code reveals the doc's model was wrong:** stop and fix the doc's model,
  don't patch one sentence and leave the frame broken.

The test: *every box, number, and claim should be traceable to a file or an
observed fact. If you can't trace it, don't state it as fact — mark it unverified
or cut it.*

---

## Changelog discipline

A changelog is the project's memory of what changed and why. Keep it honest and
human.

- **One entry per meaningful change**, written for a reader who wasn't there.
  What changed, and why it matters — not the diff.
- **Group by type** if the project uses Keep-a-Changelog (Added / Changed /
  Fixed / Removed / Security) or Conventional Commits — follow the project's
  existing convention; don't impose a new one.
- **Behavior, flags, defaults, and breaking changes are mandatory entries.** A
  silent default change is how you burn the next operator.
- **Date and version** releases. Unreleased work goes under an `Unreleased`
  heading so it's never lost.
- If there is no changelog and the project is real, propose one — a `CHANGELOG.md`
  is cheap and compounds.

---

## The writing voice — readable, human, maintainable

Documentation is read by tired people trying to get something done. Write for
them. The craft details live in `prompting-context-engineering`; the doc-specific
rules:

- **Lead with what it is.** First sentence: what the thing is and what it's for.
  Not history, not the chain, not the cleverest feature — the plain identity.
- **Plain words, short sentences.** Prefer the concrete noun to the abstract one.
  Explain a term the first time you use it. If a sentence needs two commas and a
  semicolon, split it.
- **Calm human voice.** Grounded, honest, no hype, no marketing punchlines, no AI
  tells ("delve", "seamless", "robust", "leverage", "in today's fast-paced…").
  Sound like a thoughtful engineer explaining to a colleague. Match the
  operator's stated preference: calm, Zen, enable the reader to see and learn.
- **Honest about maturity.** Say proven vs beta vs planned plainly. "🟡 MVP" over
  "✅ stable" prematurely. A reader trusts a doc that admits its gaps.
- **Structure for scanning.** Headings, short paragraphs, tables for
  comparisons, a one-line TL;DR up top for anything long. A maintainer should
  find the part they need without reading the whole thing.
- **Write so it can be kept true.** Prefer statements that are easy to verify and
  update. Avoid numbers you won't maintain; when you use one, date it or point at
  the command that produces it.

**Two-line litmus test for any doc you write:** *Would a newcomer understand what
this is from the first paragraph? Would a maintainer be able to tell, a year from
now, whether it's still true?* If either is "no", revise.

---

## Applying this to a repo — the currency sweep

When asked to "confirm the docs are up to date" (or on adopting this skill in a
new repo), do a bounded sweep, not a rewrite:

1. **Inventory the doc surface:** README, CHANGELOG, `docs/**`, per-component
   READMEs, the architecture docs, any `PORT_MAP`/`CAPABILITIES`/SSOT files.
2. **Spot-check the load-bearing claims** against code (names, ports, defaults,
   flags, counts, status) — the truth pass, at repo scale.
3. **Check the lede of the top-of-funnel docs** (README, elevator/overview): do
   they lead with what the product is, with honest emphasis?
4. **Check currency:** does the doc reflect the current code, or a past version?
5. **Report** what's true, what's stale, what's misleading — with file:line — and
   fix the cheap ones in place; list the rest. Prefer surgical edits to rewrites.
6. **Leave a dated `last_reviewed`** where the project's docs carry one.

Keep the predicate tight and count-guarded — a bulk doc-fix that over-reaches is
its own failure mode. Fix what you can trace; flag the rest.

---

## Composition

| Skill | Relationship |
|---|---|
| `cto-brain` | The build doctrine this serves. Docs are part of "done"; the honesty protocol is shared. This skill is the documentation arm of that doctrine. |
| `prompting-context-engineering` | The writing/clarity craft. This skill decides *what* must be documented and that it's *true*; that skill helps with *how* to phrase it well. |
| `arch-topology-diagrams` | Diagrams true to code, with optional/simulated/roadmap parts marked. Invoke it when the doc needs an architecture picture. |
| `vault-updater` | The periodic, tool-assisted accuracy audit for a specific vault + monorepo docs. This skill is the always-on discipline; that is the scheduled backstop. |
| `spec-driven` / `openspec` | When a capability-behavior change happens, the spec is the authoritative doc; keep it and the prose in sync. |

**The standing rule:** documentation is not a phase that comes after the work —
it is part of the work. Every round that changes behavior leaves the docs true,
current, and readable, or the round is not done.
