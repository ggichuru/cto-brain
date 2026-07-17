# ADR 0004 — SDK/server integration instead of shell-only orchestration

**Status:** Accepted (2026-07-17).

## Context

`cto-code` currently drives OpenCode by spawning `opencode ... -m ollama/<model>`
(TUI) and, for anything programmatic, `opencode run`. Live testing of
`opencode run` with an MCP tool call, three identical invocations back-to-back,
produced **three different outcomes**:

| Attempt | Time | Outcome |
|---|---|---|
| 1 | 15.1s | **silent empty output, exit code 0** (no MCP call, no text) |
| 2 | 24.9s | clean success (`cto-brain_stack_status` returned data) |
| 3 | 40.5s | success after two `SchemaError` tool failures |

A caller checking `$?` cannot distinguish attempt 1 from success. Each `run` also
cold-spawns the stdio MCP server (15–40s startup). This is structurally unsuitable
as a programmatic or CI API.

Separately verified (live): `opencode serve` exposes an OpenAPI 3.1 HTTP API
(`/session*`, `/session/:id/{message,prompt_async,command,diff,revert,
permissions/:id}`, SSE `/event`), HTTP Basic auth gates it (401 without creds),
sessions persist in sqlite across restarts, and **`@opencode-ai/sdk@1.18.3`**
(published, MIT) exports `createOpencodeClient`/`createOpencode` with typed
`session.{create,prompt,promptAsync,command,diff,revert,…}` and
`event.subscribe()`.

## Decision

**Introduce a `CodingKernel` interface and make the primary OpenCode adapter
speak to `opencode serve` via `@opencode-ai/sdk`, not `opencode run`.**

```ts
interface CodingKernel {
  start(o: KernelStartOptions): Promise<KernelHandle>;
  createSession(i: CreateSessionInput): Promise<CodingSession>;
  prompt(i: PromptInput): Promise<PromptResult>;
  command(i: CommandInput): Promise<CommandResult>;
  subscribe(sessionId: string): AsyncIterable<KernelEvent>;
  cancel(sessionId: string): Promise<void>;
  respondToPermission(i: PermissionResponse): Promise<void>;
  getDiff(sessionId: string): Promise<SessionDiff>;
  close(): Promise<void>;
}
```

The adapter may start an embedded server or connect to an existing one; it
streams `/event` SSE for tokens, tool calls, and permission requests, and asserts
on the typed message body (`{info:{role,tokens,cost}, parts:[…]}`). A **thin
`opencode run` launch path is kept only as a compatibility fallback** for the
interactive TUI. Codex and Aider remain secondary adapters where genuinely
supported. OpenCode-specific code lives behind `CodingKernel` and does not leak
across the project.

**Remote addendum:** off-box access is `remote client → authenticated encrypted
gateway → host agent → opencode serve (loopback) → isolated worktree`. The
gateway terminates auth; a loopback-bound `opencode serve` is **never** exposed
directly. HTTP Basic + Tailscale ACL + short-lived credentials + audit trail.

## Consequences

**Good:** deterministic, assertable results (no silent exit-0); a warm long-lived
server instead of 15–40s cold MCP re-spawns; real observability via the SSE event
stream; first-class permission/diff/revert handling; reconnect to persisted
sessions; a clean seam to swap kernels or add remote transport.

**Bad / accepted risk:** the SDK adds a dependency and a server lifecycle to
manage (health, port discovery — the server binds a random port by default and
must be read from startup, not assumed `4096`). MCP execution *through* serve/SDK
is currently **inferred, not proven** — the implementing PR must include a live
test that an MCP tool fires over serve before the `run` path is retired.

**Rejected alternative:** *harden `opencode run` (retries, output parsing).*
Rejected — the silent exit-0 failure has no reliable textual signal to retry on,
and cold-spawn latency is inherent; serve+SDK removes the failure class instead of
papering over it.
