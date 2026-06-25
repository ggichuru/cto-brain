# Examples — cto-brain in real work

These aren't toy snippets. They walk one real round: you and a few agents adding
rate limiting to an API, with cto-brain as the senior engineer in the room. Every
command here is exercised by `test/e2e-usage.mjs`, so if an example drifts from
the code, CI fails. Output shown is human-mode (a terminal); add `--json` to any
read command for scripts and CI.

## 0. Stand up the brain in the repo

You're in the API repo. Wire the operating model in once:

```bash
cto-brain init --project --name api-gateway
cto-brain adapter wire --adapters claude-code,cursor    # skills into your agents
cto-brain doctor --strict                               # skills present? gate clean?
```

Now Claude Code and Cursor load the cto-orchestration discipline, and `.cto-brain/`
holds this repo's router config, growth ledger, and memory.

## 1. Decide where each piece of the round runs

The round has three slices: write the limiter (builder), review it for security,
integrate. Ask the brain how to route each, instead of guessing:

```bash
cto-brain router probe                  # what's actually reachable right now
cto-brain router select --task dispatch-builder       # → local ollama (token-heavy, cheap)
cto-brain router select --task reviewer-security --prefer cloud   # → anthropic if a key is set
cto-brain router plan                   # the whole task→model table at once
```

`router select` is honest: with no cloud key and Ollama up, `reviewer-security`
comes back on local with `honest: true`, not a fabricated cloud route. That's the
difference from a black-box router — you can see *why* it chose what it chose.

## 2. Dispatch the work (you still drive the agents)

cto-brain doesn't run the agents; it tells you how. You dispatch builders in Claude
Code using the file-scope + six-section-brief discipline the skill loaded. The brain's
job during the round is the next three steps.

## 3. Gate before anything leaves the machine

Before you commit or share a skill pack, scan for leaked credentials:

```bash
cto-brain gate check --home .
# { "ok": true, "problems": [] }
```

Wire this into your own `prepublishOnly` or a pre-commit hook so a key never ships.

## 4. Prove the brain's own decisions are sane

```bash
cto-brain eval
#   result  11/11 (100%)
#   routing 5/5  ✓   honesty 2/2  ✓   gate 4/4  ✓
```

This gates CI. If a router or gate change regresses, the round doesn't close.

## 5. Close the round and record the lesson

```bash
cto-brain round-close --tag rate-limit-wave-1 \
  --summary "token-bucket limiter + security review; one integrating commit" \
  --lesson "per-IP buckets need a sweep goroutine or memory grows unbounded"
cto-brain telemetry summary     # fallback rate, per-task providers, latency this round
```

The lesson lands in the growth ledger; telemetry shows how routing actually behaved.

## 6. Let an agent call the brain mid-round (MCP)

Your platform or a coding agent can query the brain as a tool instead of shelling out.
Register it once:

```bash
claude mcp add cto-brain -- cto-brain mcp        # stdio, local
```

Or run it as a shared service for a fleet:

```bash
cto-brain mcp --transport=http --port 3737       # loopback-only; --allow-origin for remote
```

Then any MCP client gets nine tools (`router_select`, `router_plan`, `router_probe`,
`stack_status`, `gate_check`, `adapter_status`, `eval_run`, `agent_card`, and the
write tool `round_close`). A minimal client:

```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const c = new Client({ name: "my-platform", version: "1" }, { capabilities: {} });
await c.connect(new StdioClientTransport({ command: "cto-brain", args: ["mcp"] }));
const plan = JSON.parse((await c.callTool({ name: "router_plan", arguments: {} })).content[0].text);
```

## 7. Make the brain discoverable to other agents (A2A)

```bash
cto-brain agent-card --url https://your-host/mcp --out .well-known/agent-card.json
```

The card lists the brain's skills (built from the live tool registry, so it can't
misreport) for peer agents to discover and delegate to. It carries capability
metadata only, never keys or URLs.

## 8. Let the brain draft a skill from a real project (safely)

You ran the rate-limit round three times across services and want the pattern as a
reusable skill. Point synth at the project:

```bash
cto-brain skill synth --topic "api rate limiting" --dir ./services/payments
# Wrote DRAFT .cto-brain/skills-draft/api-rate-limiting/SKILL.md from N candidate(s). gate: ok
```

It checks every file against the credential gate *before* reading it, writes the
pattern (not your source), refuses if a secret slips through, and leaves a draft for
you to read. Nothing is auto-published. Promote it by hand when it's right:

```bash
# review the draft, then:
mv .cto-brain/skills-draft/api-rate-limiting skills/api-rate-limiting
cto-brain gate check --home .          # re-gate before it ships
```

## 9. Call it from your own Node service

cto-brain is an npm package, so a Node platform can import the decisions directly,
no subprocess:

```js
import { routerSelect } from "cto-brain/src/cli/router.mjs";
import { runEval } from "cto-brain/src/eval/runner.mjs";
const route = await routerSelect({ task: "integrate", prefer: "auto" });
const scorecard = runEval();
```

---

**Keeping it fresh:** `npm update -g cto-brain && cto-brain sync --pull && cto-brain adapter wire`.
For the full command list, `cto-brain` with no args (grouped `--help`). For deployment
limits, see [PRODUCTION.md](./PRODUCTION.md).
