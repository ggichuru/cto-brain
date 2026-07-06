# cto-brain

Portable **CTO orchestration brain** for multi-agent builds — auditable policy
([agentskills.io](https://agentskills.io)), two-level local sync, cross-platform
adapters, and hybrid public/encrypted skill packs.

**License:** [MIT](./LICENSE) · **Node:** ≥ 20 · **npm:** [`cto-brain`](https://www.npmjs.com/package/cto-brain) · **Zero runtime deps** except the MCP SDK

[![ci](https://github.com/ggichuru/cto-brain/actions/workflows/ci.yml/badge.svg)](https://github.com/ggichuru/cto-brain/actions/workflows/ci.yml)

## Quick start

```bash
npm install -g cto-brain
# or: npx cto-brain init

cto-brain init --project --name my-app
cto-brain adapter wire
cto-brain doctor --strict
```

## What you get

| Layer | Path | Purpose |
|-------|------|---------|
| System brain | `~/.cto-brain/` | Global skills, memory, portfolio, growth ledger |
| Project brain | `.cto-brain/` | Project addendum, local skills, project memory |
| Agent adapters | `~/.claude/skills`, `.cursor/skills`, `~/.agents/skills` | Wired via `cto-brain adapter wire` |

Bundled core skills (8):

- `cto-orchestration` — 9 CTO roles, reviewer trio, file-scope discipline
- `meta-brain` — intent router
- `agentic-learning-loop` — Role 9 learning ritual + skill-authoring-is-TDD
- `multi-agent-execution` — parallel dispatch substrate
- `grill` — scope interview before building (mattpocock/skills)
- `tdd` — red-green-refactor with a fast feedback loop
- `diagnosing-bugs` — reproduce → minimize → hypothesize → instrument → fix
- `domain-modeling` — build + maintain `CONTEXT.md` shared vocabulary

## Documentation

| Doc | Description |
|-----|-------------|
| **[docs/USAGE.md](docs/USAGE.md)** | **How to build software with cto-brain (start here)** |
| **[docs/EXAMPLES.md](docs/EXAMPLES.md)** | **Worked examples — the tool in a real round (test-verified)** |
| [docs/CLOSEOUT-REPORT.md](docs/CLOSEOUT-REPORT.md) | The standing operator close-out report ritual + template |
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/MODEL-ROUTER.md](docs/MODEL-ROUTER.md) | Policy-first model + stack routing (two-level merge) |
| [docs/ENCRYPTED-PACKS.md](docs/ENCRYPTED-PACKS.md) | Public / signed / encrypted skill tiers |
| [docs/benchmark/](docs/benchmark/README.md) | vs 14 peers — methodology + scorecard |
| [docs/PUBLISH.md](docs/PUBLISH.md) | npm publish + 2FA gate |
| [docs/PRODUCTION.md](docs/PRODUCTION.md) | Production readiness — GO verdict, known limitations, deploy guidance |
| [docs/MCP.md](docs/MCP.md) | Run cto-brain as an MCP server; register in Claude/Cursor/Codex |
| [docs/A2A.md](docs/A2A.md) | Emit an A2A agent card so peer agents can discover cto-brain |
| [docs/SKILL-SYNTH.md](docs/SKILL-SYNTH.md) | Privacy-first skill synthesis (draft-only, gate-before-read) — ADR 0002 |
| [docs/EVAL.md](docs/EVAL.md) | Eval harness — scoring the brain's routing/honesty/gate decisions |
| [docs/POSITIONING.md](docs/POSITIONING.md) | Where cto-brain sits in the 2026 agent stack (control plane vs runtime) |
| [docs/GROWTH-AGENT-BRIEF.md](docs/GROWTH-AGENT-BRIEF.md) | Brief for an agent tasked with growing/architecting/stewarding cto-brain |
| [docs/AGENT-SYSTEM-PROMPT.md](docs/AGENT-SYSTEM-PROMPT.md) | Self-contained, tool-verified system prompt for a no-repo-access steward agent |
| [docs/AGENT-ONBOARDING.md](docs/AGENT-ONBOARDING.md) | Onboarding for an agent that knows nothing — learn cto-brain from npm + GitHub |
| [docs/reports/](docs/reports/) | Dated operator close-out reports (round handoffs) |
| [docs/research/agentic-orchestration-2026.md](docs/research/agentic-orchestration-2026.md) | Verified research: orchestrate-many-models (Fugu) vs one-big-model (Fable/Mythos) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev setup + test gate |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |

## Always-fresh workflow

```bash
npm update -g cto-brain
cto-brain sync --pull          # package → system brain
cto-brain install              # system → agent dirs
cto-brain sync                 # system ↔ project
cto-brain round-close --tag wave-1 --summary "landed X" --lesson "no-op"
```

Promote project lessons to system brain (lead-CTO synthesis):

```bash
cto-brain sync --promote
```

## CLI reference

| Command | Description |
|---------|-------------|
| `init [--project] [--name]` | Bootstrap system + optional project brain |
| `sync [--pull\|--promote\|--project-only]` | Non-destructive mtime-wins sync (`rsync -au`, never `--delete`) |
| `install` | Wire skills to Claude/Cursor/Codex adapters |
| `doctor [--strict]` | Health check: skills, credentials, adapters |
| `adapter list\|wire` | List or wire platform skill directories |
| `round-close` | Append growth ledger row + optional feedback scaffold |
| `deploy-cto` | CHARTER + portfolio registration + first-round brief |
| `digest` | Weekly lead-CTO portfolio digest template |
| `gate check` | Scan for credential leaks before pack/share |
| `pack` / `unpack` | Signed or encrypted skill packs |
| `preflight dispatch\|commit` | Pre-flight checklists |
| `router list\|probe\|select\|plan\|init` | Policy-first model + stack routing |
| `stack status` | Probe configured stacks (Desk, Ollama, …) |
| `mcp` | Run cto-brain as an MCP server (stdio) — see [docs/MCP.md](docs/MCP.md) |
| `telemetry summary` | KPIs from local run telemetry (fallback rate, per-task providers, latency) |
| `eval` | Score the brain's own routing/honesty/gate decisions ([docs/EVAL.md](docs/EVAL.md)) |
| `hook install` | Stop-hook script for post-turn project sync |

**Output modes:** commands print human-readable, colorized output in a
terminal and raw JSON when piped or given `--json` (so `… | jq` and CI stay
byte-stable). Color honors `NO_COLOR`; force off with `--no-color`.

Routing decisions and MCP tool calls are logged **locally only** to
`~/.cto-brain/telemetry/runs.jsonl` (provider/model/latency — never secrets or
URLs; nothing leaves your machine). Opt out with `CTO_BRAIN_NO_TELEMETRY=1`.

## Security & IP (hybrid model)

| Tier | Mechanism |
|------|-----------|
| **public** | npm core skills (orchestration process only) |
| **signed** | Tarball + SHA256 manifest |
| **encrypted** | AES-256-CBC via OpenSSL (passphrase out-of-band) |

See [docs/ENCRYPTED-PACKS.md](docs/ENCRYPTED-PACKS.md) for proprietary skill distribution.

`.cto-brainignore` excludes secrets from sync/pack. `gate check` aborts on credential-like paths.

## Project integration

Add to `package.json` for auto-sync on install:

```json
{
  "devDependencies": { "cto-brain": "^0.7.0" },
  "scripts": {
    "prepare": "cto-brain sync --project-only || true"
  }
}
```

Compatible with [agentskills.io](https://agentskills.io) and [skills-npm](https://github.com/antfu/skills-npm).

## Open source

- **Core skills** in this repo are MIT — orchestration *process* only, no proprietary domain IP.
- **Proprietary domain skills** stay out of npm; use encrypted packs ([docs/ENCRYPTED-PACKS.md](docs/ENCRYPTED-PACKS.md)).
- **Before publish:** `cto-brain gate check --home .` and `npm test` (also run via `prepublishOnly`).
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) · **Security:** [SECURITY.md](SECURITY.md)

## Where it sits (vs Fugu, vs Fable/Mythos)

The 2026 landscape splits on one axis — *orchestrate-many-models* vs *one-big-agentic-model*:

- **Sakana Fugu** orchestrates a swappable pool of frontier LLMs behind one endpoint (a learned Conductor/TRINITY) — but routing is model-decided and **opaque**.
- **Claude Fable 5 / Mythos 5** are single Mythos-class **models** — capable, but single-vendor (both were export-suspended worldwide on 2026-06-12).

**cto-brain is neither — it's the policy layer *above* either.** It optimizes *how humans + agents ship*: **auditable** task→provider routing, honest fallback, frozen contracts, reviewer trio, single integrating commit, growth-ledger learning, and a security gate — provider-agnostic and local-first, so a single-vendor outage just reroutes. See [docs/POSITIONING.md](docs/POSITIONING.md) and [docs/research/agentic-orchestration-2026.md](docs/research/agentic-orchestration-2026.md).

## Model router

Pick local vs cloud runtime per task kind with auditable rules (not black-box routing):

```bash
cto-brain router init --system   # ~/.cto-brain/router.json
cto-brain router init            # .cto-brain/router.json
cto-brain router probe
cto-brain router plan            # full task matrix for CI / dispatch
cto-brain router select --task dispatch-builder --prefer local
cto-brain stack status
```

See [docs/USAGE.md](docs/USAGE.md) and [docs/MODEL-ROUTER.md](docs/MODEL-ROUTER.md).

## Benchmark vs 14 peers

How cto-brain compares on install size, process score, and model routing vs Orchestray,
Fugu, skills-npm, LangGraph, and others: **[docs/benchmark/README.md](docs/benchmark/README.md)**.

Re-measure locally: `node scripts/benchmark-self.mjs`

## License

MIT
