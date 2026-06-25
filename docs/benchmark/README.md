# Benchmark — cto-brain vs 14 peers

This folder documents how **cto-brain** compares to the fourteen tools named in the
[repository README](../../README.md) (June 2026). The comparison is
**not** “which LLM is smartest.” It is: **which toolchain helps one human orchestrate
many agents and ship software with auditable discipline.**

## Why this benchmark exists

Commercial orchestrators (Fugu, Orchestray, Fable plugins) and frameworks (LangGraph,
CrewAI) solve different problems:

| Axis | Question |
|------|----------|
| **Model routing** | Which model runs this prompt? |
| **Build orchestration** | How do humans + agents integrate work without scope collisions, secret leaks, or silent partials? |

**cto-brain** is optimized for the second axis. The router (`cto-brain router select`)
picks *where* to run by **policy + probe**, not learned cost optimization.

The two endpoints of the *first* axis (verified June 2026 — see
[docs/research/agentic-orchestration-2026.md](../research/agentic-orchestration-2026.md)):
**Sakana Fugu** *orchestrates many models* (a learned Conductor/TRINITY behind one API,
but routing is model-decided and opaque); **Claude Fable 5 / Mythos 5** are *single
Mythos-class models* (capable, single-vendor — both were export-suspended worldwide on
2026-06-12). cto-brain is neither — it's the **auditable policy layer above either**, so a
single-vendor outage just reroutes. (No public head-to-head Fugu benchmark survived
verification, so none is cited here.)

If you need frontier reasoning on hard tasks, use Fugu or a frontier model. If you need
**file-scope briefs, reviewer trio, growth ledger, two-level brain sync, secret gating,
and a falsifiable eval of the brain's own decisions**, use cto-brain (and still dispatch
through Claude Code, Cursor, or Codex).

## What we measured

### cto-brain (local, reproducible)

Run on your machine:

```bash
cd /path/to/cto-brain
node scripts/benchmark-self.mjs
npm test
npm pack --dry-run
```

Captured metrics:

- npm tarball size, unpacked size, file count
- npm dependency count (runtime)
- CLI command count, router task kinds, provider presets, bundled skills
- Skill LOC (`wc -l skills/*/SKILL.md`)
- Test suite count and `ok:` assertion count
- Wall time: full test run, `router probe`, `gate check`

### Peers (public registry / docs)

Where a tool ships on npm or PyPI, we read **`npm view`** / PyPI JSON (version,
`dist.unpackedSize`, dependency count, weekly downloads when listed). Cloud-only or
IDE-only tools have **N/A** for install size; we document how they work from official
READMEs and product pages instead.

**Last full pass:** 2026-06-24 (ggichuru workstation, Node 22).

## Files in this folder

| File | Contents |
|------|----------|
| [SCORECARD.md](./SCORECARD.md) | Numbers tables, process score (/12), head-to-head summary |
| [COMPETITORS.md](./COMPETITORS.md) | Who each of the 14 is, how it works, where cto-brain differs |

## Process score (/12) — definition

Twelve **load-bearing CTO features** from `skills/cto-orchestration/SKILL.md`:

1. System + project brain (`~/.cto-brain` + `.cto-brain`)
2. Cross-IDE skill wire (≥3 targets: Claude, Cursor, Codex)
3. Non-destructive sync (`rsync -au`, never `--delete`)
4. Secret gate before pack/publish (`gate check`, `prepublishOnly`)
5. Encrypted skill packs (OpenSSL tier)
6. File-scope + single integrating commit (documented in bundled skill)
7. Reviewer trio (three fixed briefs in `pipeline/reviewers/`)
8. Growth ledger + `round-close` (Role 9)
9. Lead-CTO portfolio (`deploy-cto`, `digest`, `sync --promote`)
10. Policy-first router + auditable `reason` JSON
11. Local stack probe (Ollama, vLLM, Desk engine, …)
12. agentskills.io bundle (`package.json` → `agentskills.skills`)

Scoring: **1** = shipped in tool, **0.5** = partial overlap, **0** = not present.
Scores are conservative; see [COMPETITORS.md](./COMPETITORS.md) for nuance.

## Honest limits of this benchmark

- **No external model benchmark** — we do not run SWE-bench / HumanEval across routers.
  cto-brain instead ships an internal **eval harness** (`cto-brain eval`) that scores its
  own routing/honesty/gate decisions and gates CI — proof of *policy* correctness, not
  model IQ. See [SCORECARD.md §B2](./SCORECARD.md) and [docs/EVAL.md](../EVAL.md).
- **Download counts change weekly** — re-check `npm view orchestray` before citing.
- **Partial scores are judgment calls** — Orchestray has patterns/KB but not Role 9;
  we mark 0.5, not 1.
- **cto-brain does not auto-run multi-agent waves** — Orchestray executes inside Claude
  Code; cto-brain is policy + CLI; you still dispatch.

## Publish gate (what passed before npm)

```bash
cto-brain gate check --home .
npm test                    # 18 suites; prepublishOnly runs gate + tests
npm pack --dry-run          # 63 files; no .cto-brain/, test/, or node_modules in tarball
```

npm publish additionally requires **npm account 2FA (authorization and writes)** or a
granular token with publish + bypass 2FA. A 403 on publish with all tests green is an
account policy issue, not a package failure. See [PUBLISH.md](../PUBLISH.md).

## Related docs

- [docs/README.md](../README.md) — full documentation index
- [PUBLISH.md](../PUBLISH.md) — npm publish checklist
- [MODEL-ROUTER.md](../MODEL-ROUTER.md) — router schema and task kinds
- [ENCRYPTED-PACKS.md](../ENCRYPTED-PACKS.md) — hybrid public/encrypted skills
- `skills/cto-orchestration/references/benchmark-peers.md` — skill-side pointer
- `skills/cto-orchestration/references/model-router.md` — CTO dispatch discipline
