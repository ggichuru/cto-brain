# cto-brain as a discoverable A2A agent

cto-brain can emit an [Agent2Agent (A2A)](https://a2a-protocol.org) **Agent
Card** so peer agents can discover it and delegate work to its skills.

```bash
cto-brain agent-card                     # print the card JSON
cto-brain agent-card --out .well-known/agent-card.json   # write to disk
```

## What the card contains

An A2A v1.0 `AgentCard` describing cto-brain as a remote agent. Its **skills
are derived from the live MCP tool registry** (`src/mcp/tools.mjs`), so the
card can never drift from what the brain actually exposes — every MCP tool
(`router_select`, `router_plan`, `router_probe`, `stack_status`, `gate_check`,
`adapter_status`, `eval_run`, `agent_card`, `round_close`) appears as a skill,
tagged `read` or `write`.

It contains **only public capability metadata** — name, description, version
(pinned to `package.json`), input/output modes, and skill descriptions. No
secrets, env, URLs, or keys are ever included (verified by `test/a2a.mjs`).

## The `url` field

A2A agents publish their card at the standardized path
`/.well-known/agent-card.json` (RFC 8615) and advertise a reachable `url`.
cto-brain has **no hosted HTTP endpoint yet** — that arrives with the MCP
Streamable-HTTP transport (roadmap brick 2). Until then the card honestly
reports a placeholder (`stdio:cto-brain mcp`) unless you supply a real one:

```bash
cto-brain agent-card --url https://your-host/mcp
# or: CTO_BRAIN_PUBLIC_URL=https://your-host/mcp cto-brain agent-card
```

When the HTTP transport lands, the server will serve this exact card at
`/.well-known/agent-card.json` with the live `url` filled in. The card is also
available to MCP clients today via the `agent_card` tool.
