# ADR 0003 — OpenCode as the execution kernel

**Status:** Accepted (2026-07-17). Grounds the cto-code platform charter.

## Context

`cto-code` must reach the workflow quality of Codex / Claude Code: sessions,
diffs/revert, permissions, LSP, agents/subagents, skill loading, MCP execution,
custom tools, and a TUI/web/remote client. Building any of these from scratch is
a multi-year effort and a maintenance liability.

An empirical audit of the installed **OpenCode 1.18.3** (MIT, native
`opencode-linux-arm64`) established that it already provides all of these as
first-class, configurable primitives, and that **every** capability the charter
wants is reachable through configuration, the plugin API, or `@opencode-ai/sdk`
— **no fork is required** (see `docs/architecture/CTO-CODE-OPEN-CODE-PLATFORM.md`
§0.1, §1.3, and the kernel-feasibility table).

## Decision

**Treat OpenCode as the execution kernel and cto-code as the control plane.** The
boundary is fixed:

- **Kernel (OpenCode) owns:** repo read/write, shell execution, sessions/messages
  (sqlite-persisted), diffs/revert, permissions, LSP/formatters, agent & subagent
  execution, `SKILL.md` loading, MCP tool execution, custom tools, and the
  TUI/web/server/ACP clients.
- **Control plane (cto-code) owns:** provider discovery, the typed model catalog,
  capability probes, route selection, sovereignty/cost/latency policy, the agent
  registry, skill install/validation, MCP profiles, workspace/worktree management,
  remote host/session management, credentials/availability, telemetry/evidence,
  packaging/upgrades, and doctor.

The control plane **decides and injects**; the kernel **executes**. cto-code must
not re-implement a kernel primitive.

**Do not fork OpenCode** unless a required capability is proven impossible through
configuration, plugins, custom tools, the server API, or the SDK. Pin a tested
OpenCode version range; a conformance test asserts the config keys and server
routes we depend on so upstream drift fails loudly, not silently.

## Consequences

**Good:** we inherit a maintained, high-quality execution surface; effort
concentrates on the sovereign control-plane value (routing, policy, sovereignty,
evidence) that no kernel provides; the two-layer split makes the kernel
replaceable in principle (via the `CodingKernel` interface, ADR-0004).

**Bad / accepted risk:** we depend on an external project we do not control;
config-schema and plugin-hook shapes can change between releases (`keybinds`
already migrated to `tui.json`). Mitigated by version pinning + the conformance
test + interface isolation.

**Rejected alternative:** *build our own coding-agent kernel.* Rejected — it
duplicates years of solved work (sessions, diffs, permissions, LSP), and none of
the charter's requirements need it; the audit found zero fork-forcing gaps.

**Rejected alternative:** *stay a thin `opencode run` launcher.* Rejected on
reliability grounds — see ADR-0004.
