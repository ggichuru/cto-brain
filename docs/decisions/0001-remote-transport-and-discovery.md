# ADR 0001 — Remote transport & agent discovery

**Status:** Partially accepted (2026-06-25). A2A Agent Card: **Accepted, shipped (v0.5.0)**. MCP Streamable-HTTP transport: **Proposed**.

## Context

cto-brain's MCP server runs over **stdio** only — its lifecycle is bound to a
single local workstation, and it is not discoverable by peer agents. Two gaps:
(1) other agents can't find or describe cto-brain's capabilities; (2) it can't
run as a shared remote service behind a proxy/load balancer.

## Decision

Two standard interfaces, sequenced by risk:

1. **A2A Agent Card (shipped).** Emit an A2A v1.0 `AgentCard` whose skills are
   derived from the live MCP tool registry, via `cto-brain agent-card`, the
   `agent_card` MCP tool, and `buildAgentCard()` (`src/a2a/card.mjs`). Public
   metadata only — no secrets/URLs/keys. Served at `/.well-known/agent-card.json`
   once a hosted endpoint exists.

2. **MCP Streamable-HTTP transport (proposed).** Add an HTTP transport
   (`POST/GET/DELETE /mcp`, `MCP-Session-Id`, SSE event stream, `Last-Event-ID`
   resumption) alongside stdio, so the brain can run as a remote service and
   the agent card can advertise a real `url`. Implemented with the existing
   `@modelcontextprotocol/sdk` — **no new runtime dependency.**

## Consequences

**Good:** discoverable by A2A peers; deployable behind reverse proxies; card
can't drift from real tools. **Bad / to manage (HTTP brick):** a network
attack surface — requires `Origin` validation (DNS-rebinding defense), bind to
`127.0.0.1` by default, TLS/authz delegated to a fronting proxy, and in-memory
session/SSE cleanup. These are why the HTTP transport is its own gated round,
not bundled with the (zero-risk, static-JSON) card.

## Alternatives considered

- **Bespoke discovery JSON** — rejected; A2A is the emerging standard.
- **Hand-maintained card** — rejected; deriving from the tool registry keeps it
  honest and zero-maintenance.
- **Replace stdio with HTTP** — rejected; stdio stays the default for local use;
  HTTP is additive.
