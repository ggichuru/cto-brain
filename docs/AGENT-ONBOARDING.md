# Onboarding: learn cto-brain from scratch (for an agent)

You've been handed this and you know nothing about cto-brain. This page gets you
from zero to using it, pulling only from the public sources:

- npm: https://www.npmjs.com/package/cto-brain
- GitHub: https://github.com/ggichuru/cto-brain

## What it is (one paragraph)

cto-brain is a portable **CTO control plane** for multi-agent software builds — a
policy, routing, memory, and governance layer shipped as an npm package (CLI +
bundled skills + an MCP server). It decides which model/stack handles which task,
gates what's unsafe to share, records what each round taught, and exposes all of
that to other agents over MCP. It does **not** run your code, host a sandbox, or
schedule workflows — it rides on top of an execution agent (Claude Code, Cursor,
Codex) that does. Hold that boundary.

## Pull it

```bash
# fastest: run without installing
npx cto-brain --help

# or install the CLI
npm install -g cto-brain
cto-brain --help

# or read the source
git clone https://github.com/ggichuru/cto-brain && cd cto-brain
npm install        # pulls the one runtime dep (@modelcontextprotocol/sdk)
node bin/cto-brain.mjs --help
```

**Version note (read this):** the npm registry version and the GitHub `main`
line can differ from a working copy. Don't assume a number — check it, and check
the live tool surface rather than trusting any doc's counts:

```bash
npm view cto-brain version            # what's published
cto-brain --help                      # grouped commands + examples
cto-brain router plan --json          # the real task→model matrix
```

## Learn it fast (in this order)

1. `cto-brain --help` — the grouped command list with examples.
2. `README.md` — what you get + the CLI reference table + the docs index.
3. `docs/EXAMPLES.md` — the tool used in a real round, every command test-verified.
4. `docs/USAGE.md` — the full operator workflow.
5. `docs/MODEL-ROUTER.md` — how routing decides (policy-first, not learned).
6. `docs/MCP.md` + `docs/A2A.md` — calling it as a tool / making it discoverable.
7. `docs/POSITIONING.md` — where it sits vs Fugu (orchestrate-many) and Fable/Mythos (single models).
8. `skills/*/SKILL.md` — the four bundled skills (the actual operating policy).

For a single self-contained briefing you can adopt as a system prompt, read
`docs/AGENT-SYSTEM-PROMPT.md`. To help grow the project, read
`docs/GROWTH-AGENT-BRIEF.md`.

## Verify it works (don't take the docs' word)

```bash
cto-brain eval            # scores its own routing/honesty/gate decisions
cto-brain router probe    # what stacks are reachable right now
cto-brain doctor          # skills present? gate clean?
```

## Use it (the surfaces)

- **CLI** — `cto-brain router select --task reviewer-security`, `gate check`, `eval`,
  `telemetry summary`. Add `--json` for machine output; a terminal gets tables.
- **MCP (the big one)** — `cto-brain mcp` (stdio) or `cto-brain mcp --transport=http
  --port 3737`. Then any MCP client gets the tools (`router_*`, `gate_check`,
  `adapter_status`, `eval_run`, `agent_card`, and the write tool `round_close`).
- **Import** — it's an npm package: `import { routerSelect } from "cto-brain/src/cli/router.mjs"`.
- **A2A** — `cto-brain agent-card` emits a discovery card built from the live tools.

## Rules you must respect

- It's the policy layer, not a runtime. Don't make it execute code or host processes.
- Routing is honest: if it returns `provider: null` or `modelAvailable: false`,
  believe it — don't dispatch anyway.
- The credential gate is a hard floor. Don't route secrets through telemetry,
  the agent card, a pack, or a synthesized skill.
- Synthesized skills (`skill synth`) are drafts under `.cto-brain/skills-draft/`.
  A human promotes them. Never auto-publish or auto-wire one.

That's enough to start. When in doubt, run the tool and read its JSON, not a doc.
