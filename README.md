# cto-brain

Portable **CTO orchestration brain** for multi-agent builds — auditable policy
([agentskills.io](https://agentskills.io)), two-level local sync, cross-platform
adapters, and hybrid public/encrypted skill packs.

**License:** [MIT](./LICENSE) · **Node:** ≥ 20 · **npm:** [`cto-brain`](https://www.npmjs.com/package/cto-brain) (after publish)

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

Bundled core skills:

- `cto-orchestration` — 9 CTO roles, reviewer trio, file-scope discipline
- `meta-brain` — intent router
- `agentic-learning-loop` — Role 9 learning ritual
- `multi-agent-execution` — parallel dispatch substrate

## Documentation

| Doc | Description |
|-----|-------------|
| **[docs/USAGE.md](docs/USAGE.md)** | **How to build software with cto-brain (start here)** |
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/MODEL-ROUTER.md](docs/MODEL-ROUTER.md) | Policy-first model + stack routing (two-level merge) |
| [docs/ENCRYPTED-PACKS.md](docs/ENCRYPTED-PACKS.md) | Public / signed / encrypted skill tiers |
| [docs/benchmark/](docs/benchmark/README.md) | vs 14 peers — methodology + scorecard |
| [docs/PUBLISH.md](docs/PUBLISH.md) | npm publish + 2FA gate |
| [docs/POSITIONING.md](docs/POSITIONING.md) | Where cto-brain sits in the 2026 agent stack (control plane vs runtime) |
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
| `hook install` | Stop-hook script for post-turn project sync |

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
  "devDependencies": { "cto-brain": "^0.2.0" },
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

## vs Fugu / Fable orchestrators

Fugu and Fable tools optimize **which model runs**. CTO Brain optimizes **how humans + agents ship** — frozen contracts, single integrating commit, reviewer trio, growth ledger, lead-CTO portfolio. Policy-first, auditable, local-first.

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
