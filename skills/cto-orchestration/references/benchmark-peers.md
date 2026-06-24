# Peer benchmark (cto-brain npm package)

When evaluating orchestration tooling or writing a CTO handoff, read the **published
benchmark docs** in the cto-brain package (or repo):

| Doc | Path |
|-----|------|
| Overview + methodology | `docs/benchmark/README.md` |
| Numbers | `docs/benchmark/SCORECARD.md` |
| The 14 peers explained | `docs/benchmark/COMPETITORS.md` |

Re-measure cto-brain column:

```bash
npm run benchmark   # in cto-brain repo
```

## Axes (do not conflate)

| Axis | Examples | cto-brain role |
|------|----------|----------------|
| **Model routing** | Sakana Fugu, jro-fable, Orchestray tiers | Optional overlay via `router select`; policy-first, not black-box |
| **Build orchestration** | File scope, reviewer trio, growth ledger, lead-CTO | **Primary** — bundled `cto-orchestration` skill + CLI |

## The 14 peers (names only)

Sakana Fugu · Orchestray · fable5-orchestrator · fable-harness · jro-fable · Omegacode ·
skills-npm · agentskills.io · LangGraph.js · CrewAI · Continue.dev · Cursor rules ·
Claude Code skills · Codex skills

Full profiles: `docs/benchmark/COMPETITORS.md`.

## When to cite numbers

- Snapshot date and version must accompany any external citation.
- Re-run `npm view orchestray` for peer download counts before publishing comparisons.
- Process score (/12) definitions live in `docs/benchmark/README.md` — do not round up partial scores.
