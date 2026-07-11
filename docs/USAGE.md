# The cto-brain handbook

You've installed a CTO in a box. This is how you actually use it — from the
first five minutes to running multi-agent builds, coding against your own
sovereign models, and watching the brain learn from every round.

Everything below is real: every command shown here runs in the test suite or
was proven on a live box before it was written down. Where something is
honest-but-rough, the text says so.

## What this thing is

cto-brain is the discipline of a good engineering lead, packaged: skills your
coding agents load, a router that picks the right model for each task, a gate
that stops secrets leaving the building, spec contracts so nothing gets built
without a written agreement, and a growth ledger so lessons stick instead of
evaporating when the chat window closes.

It never phones home. Everything lives in files you can read: `~/.cto-brain/`
for your machine, `.cto-brain/` in a repo for the project.

## The first five minutes

```bash
npm install -g cto-brain

cto-brain init                          # seed the system brain at ~/.cto-brain/
cto-brain init --project --name my-app  # give this repo its own brain + charter
cto-brain adapter wire                  # hand the skills to Claude Code / Cursor / Codex
cto-brain doctor --strict               # trust, then verify
```

That's it. Your agents now load nine skills — `cto-orchestration`,
`meta-brain`, `agentic-learning-loop`, `multi-agent-execution`, `grill`,
`tdd`, `spec-driven`, `diagnosing-bugs`, `domain-modeling` — and your repo
carries a `CHARTER.md` that says what this project is allowed to decide for
itself.

`cto-brain --help` is the full map. Add `--json` to any command when a script
is reading instead of you.

## The code terminal

```bash
cto-brain code
```

This opens a coding agent (opencode by default, with the cto agent wired in)
on your own local models — no cloud account, no key, no telemetry. Pick a
model from the menu, or skip the menu:

```bash
cto-brain code --model qwen2.5:7b-instruct     # explicit
cto-brain code --task dispatch-builder         # let the router pick by task
cto-brain code --backend codex                 # or aider — your choice of driver
cto-brain code -- run "write tests for src/parser.mjs"   # headless one-shot
```

Straight talk about local models, from our own measurements: a 7B instruct
model drives the agent loop fine — it writes files, uses tools, gets real
work done — but it will occasionally claim it verified something it never
ran. Keep the loop honest: you (or your test suite) are the verifier. Bigger
coder models often *print* tool calls as text instead of making them, which
is worse for agent work, not better. The picker warns you; since 0.11.0 the
warnings come from **recorded probes** (`~/.cto-brain/conformance.json`),
not guesses — evidence beats vibes.

## Routing: the right model for the job

Ask what's reachable before you assume:

```bash
cto-brain router probe --all    # every provider, local and cloud, plus discovery
cto-brain stack status          # the same, summarized
```

The router knows Ollama, vLLM, llama.cpp, **llama-swap**, **LM Studio**, the
Desk engine, jarvis-style sovereign gateways, and cloud APIs — and finds the
local ones on their default ports without being told. Then route work by what
it needs, not by brand loyalty:

```bash
cto-brain router select --task reviewer-security --prefer cloud
cto-brain router select --task dispatch-builder --prefer local
cto-brain router plan           # the whole task→model table at once
```

Every route names its fallback, and the sovereign floor — your own models on
your own metal — is always in the chain. Config layers merge in order
(package defaults → `~/.cto-brain/router.json` → `.cto-brain/router.json`),
so a repo can override your machine, and your machine can override ours.
Details live in [MODEL-ROUTER.md](./MODEL-ROUTER.md).

Remote gateway? `cto-brain gateway` runs a loopback OpenAI-wire bridge to an
Open WebUI/Ollama host (set `JARVIS_API_KEY`, point tools at
`http://127.0.0.1:11475/v1`).

## No code without a spec

The `spec-driven` skill enforces it; these verbs make it cheap:

```bash
cto-brain spec init add-dark-mode   # scaffolds specs/changes/add-dark-mode/
cto-brain spec check                # every proposal has its four sections, filled
```

A change contract is one page: Intent, Behavior, Acceptance criteria,
Non-goals. Freeze it, then hand each criterion to the `tdd` loop — red,
green, refactor. When implementation proves the spec wrong, fix the spec
first. The archived change dir becomes your decision record for free.

## Running a real build round

The shape of a multi-agent round, start to finish:

1. `cto-brain preflight dispatch` — briefs written? file scopes disjoint?
2. `cto-brain router probe --all` — prove your lanes before you dispatch.
3. Fan out builders (your agent platform does this; the skills tell it how).
4. Reviewers on the integrated tree — never skip because "the round is small."
5. One integrating commit. `cto-brain preflight commit` is the checklist.
6. Close the round — and this is the part most tools don't have:

```bash
cto-brain round-close --tag wave-3 \
  --summary "shipped the parser + 2 fixes" \
  --lesson "streaming JSON needs the reassembly buffer" \
  --outcome feature-shipped --tokens-out 250000
```

That one command writes the growth ledger (system and project), files the
lesson, and records cost-per-outcome telemetry. Later, `cto-brain telemetry
summary` tells you what a shipped feature actually costs you in tokens —
the learning loop with numbers attached.

## The brain grows — on purpose

- Lessons land in ledgers (`GROWTH.md` per project, one row per round).
- `cto-brain skill synth --topic "rate limiting" --dir ./svc` drafts a new
  skill from your own code, privacy-gated — it refuses to write secrets.
- `cto-brain eval` scores the brain's routing, honesty, and gating decisions
  against fixtures, so "is this thing actually learning?" has an answer.
- `cto-brain gate check --home .` scans for credential leaks before anything
  is shared or published. The gate also runs before every npm publish.

Keep it fresh: `npm update -g cto-brain && cto-brain sync --pull --wire`.
Sync never deletes — it's rsync-style, newest wins, your edits survive.

## Living in someone else's repo

Drop-in for a project, pinned like any dev tool:

```json
{
  "devDependencies": { "cto-brain": "^0.11.0" },
  "scripts": { "prepare": "cto-brain sync --project-only || true" }
}
```

Agents that speak MCP can skip the CLI entirely: `cto-brain mcp` serves the
router, gate, eval, and round-close as tools (stdio, or
`--transport=http --port 3737` for remote).

## When something is off

```bash
cto-brain doctor --strict     # says what's wired, what's missing, what to run
cto-brain router probe        # "is it reachable" beats "it should work"
```

If a model behaves oddly in the code terminal, check its conformance verdict
before blaming the tool — a model that can't emit structured tool calls
can't drive an agent loop, and the ledger knows which ones can.

## See also

- [MODEL-ROUTER.md](./MODEL-ROUTER.md) — providers, merge rules, task kinds
- [EXAMPLES.md](./EXAMPLES.md) — worked examples, copy-paste ready
- [ROADMAP.md](./ROADMAP.md) — where this is going, with honest gates
- [README.md](../README.md) — the full CLI reference table
