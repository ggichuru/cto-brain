# Changelog

All notable changes to **cto-brain**. Versions follow SemVer; pre-1.0 minors
may add features freely. npm latest is 0.2.0 (0.3.0–0.7.0 publish pending).

## 0.7.0
- **Privacy-first skill synthesis** (`cto-brain skill synth`, ADR 0002): discover
  skill-like patterns in an allowlisted workspace and emit a DRAFT skill —
  gate-before-read, provenance-only output, refuse-on-secret/abs-path/URL/env,
  draft-only to `.cto-brain/skills-draft/`, human-review before promotion.

## 0.6.0
- **MCP Streamable-HTTP transport** (`cto-brain mcp --transport=http`): run as a
  remote service; loopback-only default + Origin/DNS-rebinding 403 guard.
- Arg parser accepts `--key=value` (not just `--key value`).

## 0.5.0
- **A2A Agent Card** (`cto-brain agent-card`, `agent_card` MCP tool) derived from
  the live tool registry.
- ADR 0001 (remote transport & discovery), ADR 0002 (skill synthesis).
- Benchmark docs refreshed; eval-based proof-of-performance added.

## 0.4.0
- **CLI UX**: human-readable colorized output in a terminal, raw JSON when piped
  or `--json`; grouped `--help`; `--no-color`. Zero new deps.

## 0.3.0
- **Eval harness** (`cto-brain eval`, `eval_run` MCP tool): scores routing /
  honesty / gate decisions; gated in CI.
- Provider probing honors `enabledProviders`.

## 0.2.0
- **MCP server** (`cto-brain mcp`, stdio): 7 tools wrapping router/gate/adapter/
  round-close. First runtime dependency (`@modelcontextprotocol/sdk`).
- Local run telemetry (`cto-brain telemetry summary`).

## 0.1.x
- Initial: portable system + project brain, policy-first model router, two-level
  non-destructive sync, credential gate, signed/encrypted skill packs, cross-IDE
  adapters, growth ledger / round-close, lead-CTO portfolio.
