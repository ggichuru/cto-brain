# Building software with cto-brain

This guide walks through the full operator workflow: bootstrap brains, sync skills, wire agents, route models per task, and run agentic multi-agent builds.

## 1. Install and bootstrap

```bash
npm install -g cto-brain
# or add as devDependency and use npx

cto-brain init                    # ~/.cto-brain/ — skills, memory, system router.json
cto-brain init --project --name my-app   # also .cto-brain/ + CHARTER.md in cwd
cto-brain adapter wire            # skills → Claude / Cursor / Codex dirs
cto-brain doctor --strict
```

`init` seeds the **system brain** at `~/.cto-brain/` (override with `CTO_BRAIN_HOME`). With `--project`, it also creates `.cto-brain/` in the current repo and copies system skills down.

## 2. Wire skills to your tools

Pick which agent platforms receive bundled skills (`cto-orchestration`, `meta-brain`, `agentic-learning-loop`, `multi-agent-execution`):

```bash
# One-time setup
cto-brain init --project --name my-app
cto-brain adapter pick --adapters claude-code,cursor
cto-brain adapter wire --project

# See targets and wiring state
cto-brain adapter list
cto-brain adapter status
```

Daily refresh:

```bash
cto-brain sync --pull && cto-brain adapter wire
# or auto-wire after sync:
cto-brain sync --pull --wire
```

| Adapter id | Label | Skill paths |
|------------|-------|-------------|
| `claude-code` | Claude Code | `~/.claude/skills`, `.claude/skills` (project) |
| `cursor` | Cursor | `~/.cursor/skills`, `.cursor/skills` (project) |
| `codex` | Codex / OpenAI agents | `~/.agents/skills` |
| `opencode` | OpenCode | `~/.config/opencode/skills` |
| `generic` | Generic | `.agents/skills` (project) |

Preferences persist at `~/.cto-brain/settings/adapters.json`. Override for one run:

```bash
CTO_BRAIN_ADAPTERS=claude-code,cursor,codex cto-brain adapter wire
```

Scope flags: `--project` (project dirs only), `--global` (user dirs only), default `both`.

## 3. Keep skills fresh

```bash
npm update -g cto-brain
cto-brain sync --pull             # npm package → system brain
cto-brain install                 # system → agent adapter dirs
cto-brain sync                    # system ↔ project (mtime-wins, never deletes)
```

Promote project lessons back to the system brain (lead-CTO):

```bash
cto-brain sync --promote
```

## 4. Two-level router config

Model routing uses **merged** config from three layers (later wins):

| Layer | Path | Scope |
|-------|------|-------|
| Package defaults | built into `cto-brain` | all installs |
| System | `~/.cto-brain/router.json` | your machine defaults |
| Project | `.cto-brain/router.json` | per-repo overrides |

Initialize each layer:

```bash
cto-brain router init --system    # ~/.cto-brain/router.json
cto-brain router init             # .cto-brain/router.json (seeds from merged system+defaults)
cto-brain router init --force     # overwrite existing project file
```

Examples: [router.system.json.example](./router.system.json.example) (core) and [router.json.example](./router.json.example) (project).

Key fields:

- `enabledProviders` — filter fallback chains
- `routing.defaultPrefer` — `auto` (task-tier default), `local`, or `cloud`
- `routing.<task>` — per-task overrides (`builder`, `autonomous-build`, `integrate`, …)
- `agentic` — dispatch pipeline knobs (`maxConcurrentBuilders`, `autoProbeBeforeDispatch`, …)
- `stacks` — URLs for Desk, Ollama, vLLM, llama.cpp

See [MODEL-ROUTER.md](./MODEL-ROUTER.md) for merge rules and task kinds.

## 5. Probe and select routes

Before dispatch, prove what is reachable:

```bash
cto-brain router probe            # local stacks only
cto-brain router probe --all      # include cloud credential checks
cto-brain stack status            # configured stacks summary
```

Pick a route for one task kind:

```bash
cto-brain router select --task dispatch-builder --prefer local
cto-brain router select --task reviewer-security --prefer cloud
cto-brain router select --task autonomous-build    # uses defaultPrefer (auto)
```

Task kinds: `dispatch-builder`, `autonomous-build`, `explore`, `reviewer-security`, `reviewer-tech`, `inline-edit`, `integrate`, `research`.

## 6. Programmatic routing plan

For CI scripts and autonomous dispatch pipelines, dump the full task matrix:

```bash
cto-brain router plan
cto-brain router plan --prefer cloud
```

Output includes `tasks` (one route per kind), `layers` (which config files exist), `configPaths`, and `agentic` settings. Import the same API from Node:

```javascript
import { routerPlan } from "cto-brain/src/cli/router.mjs";

const plan = await routerPlan({ cwd: process.cwd(), prefer: "auto" });
for (const [task, route] of Object.entries(plan.tasks)) {
  console.log(task, route.provider, route.model);
}
```

## 7. Agentic coding workflow

Typical round for shipping features with multiple agents:

1. **Preflight** — `cto-brain preflight dispatch` (punch list, file scopes, briefs)
2. **Probe** — `cto-brain router probe --all`
3. **Plan** — `cto-brain router plan` (or per-lane `router select`)
4. **Dispatch** — fan out builders with six-section briefs; use `autonomous-build` routes for sustained loops
5. **Review** — `reviewer-security` + `reviewer-tech` on cloud when keys exist
6. **Integrate** — `integrate` task kind for merge / conflict decisions
7. **Close** — `cto-brain round-close --tag wave-N --summary "…" --lesson "…"`
8. **Commit** — `cto-brain preflight commit`; single integrating commit, no AI attribution

Load bundled skills in your agent (`cto-orchestration`, `multi-agent-execution`, `agentic-learning-loop`) via `cto-brain adapter wire` or `cto-brain adapter pick` + `adapter wire`.

## 8. Project integration

Add to `package.json`:

```json
{
  "devDependencies": { "cto-brain": "^0.7.0" },
  "scripts": {
    "prepare": "cto-brain sync --project-only || true"
  }
}
```

## See also

- [MODEL-ROUTER.md](./MODEL-ROUTER.md) — policy rules, providers, merge semantics
- [README.md](../README.md) — CLI reference table
- `skills/cto-orchestration/references/model-router.md` — orchestration discipline
