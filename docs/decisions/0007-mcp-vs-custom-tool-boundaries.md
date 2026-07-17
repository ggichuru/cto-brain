# ADR 0007 — MCP versus custom-tool (and skill) boundaries

**Status:** Accepted (2026-07-17).

## Context

The charter asks to split cto-brain into a **skill** layer (reasoning workflow,
principles, verification, decision-record format) and an **MCP** layer (real tools
and external context only), to add an **OpenCode plugin** for policy/audit, and to
add **local custom tools** — without exposing static instructions as MCP tools or
auto-enabling everything.

Finding from the control-plane map: cto-brain's MCP surface is **already almost
entirely real tools**. Of 9 registered tools, 7 query live state or write data
(`router_select`, `router_plan`, `router_probe`, `stack_status`, `gate_check`,
`adapter_status`, `round_close`), `eval_run` is a borderline measurement, and only
`agent_card` is a genuine "should be a resource, not a callable tool" case. The
prose that *would* be skill-owned (`CTO_PROMPT`, `ctoAgent`, `AIDER_CONVENTIONS`)
lives in `src/cli/opencode-setup.mjs` as config-file content — **not** exposed
through MCP. OpenCode also natively supports plugins (policy hooks that deny by
throwing a reason) and local custom tools (`@opencode-ai/plugin` `tool()`).

## Decision

Four layers, each with a single clear job:

1. **Skill (`SKILL.md`)** — *how to think*: CTO reasoning workflow, architecture
   principles, context-engineering process, verification requirements, decision-
   record format, communication standards, definition of done. Static guidance.
   **Never an MCP tool.**
2. **MCP server** — *real tools + external context only*: query live infra/state,
   retrieve prior decisions, inspect hosts/deployments, read project state, record
   approved decisions, invoke explicitly authorized org operations. Use MCP for
   **external, remote, or independently deployed** systems. **Do not expose static
   instructions as MCP tools; do not auto-enable all tools.** Move `agent_card` to
   an MCP **resource** / `.well-known` artifact.
3. **OpenCode custom tools** (`.opencode/tool/*.ts`) — *trusted local operations*:
   model-route inspection, host-capability inspection, worktree creation,
   verification execution, evidence capture, model-health probing, decision
   recording, context-budget inspection. Use custom tools for **local, trusted**
   operations; MCP for external ones.
4. **OpenCode plugin** (`packages/opencode-plugin`) — *policy & evidence*, via
   hooks: secret-file protection, dangerous-command policy, tool-execution audit,
   route-decision metadata, completion notifications, verification reminders,
   post-edit formatting, usage/latency telemetry, error normalization. A
   `tool.execute.before` hook **denies by throwing a reason** — denials explain
   what was blocked and why. The plugin must not silently alter user commands.

**MCP profiles** gate exposure: `minimal` (default), `coding`, `github`,
`research`, `operations`, `full`; each declares enabled servers/tools,
permissions, context overhead, required credentials, and health. Commands:
`cto-code mcp {list, doctor, enable <profile>, auth <server>}`. **Never print
credentials.**

## Consequences

**Good:** clean, testable separation; the skill layer stays model-portable prose,
the MCP layer stays honest (real tools only), local trusted ops don't pay MCP's
transport/permission overhead, and safety becomes **deterministic** (plugin hook +
permission patterns) rather than prompt-instruction hope. Minimal-by-default MCP
keeps context lean.

**Bad / accepted risk:** four layers is more surface to document and keep in their
lanes; the plugin hook field signatures are **UNPROVEN** (docs-level) and must be
confirmed against `@opencode-ai/plugin` types before policy hooks ship. Splitting
prose out of `opencode-setup.mjs` into a skill must preserve the current `cto`
agent behavior.

**Rejected alternative:** *put everything (guidance + tools) in the MCP server.*
Rejected — static instructions as MCP tools waste context and blur the "tool =
does something / skill = says how" line; the audit shows cto-brain already avoids
this, and we should keep it that way.
