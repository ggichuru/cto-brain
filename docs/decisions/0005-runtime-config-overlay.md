# ADR 0005 — Runtime configuration overlay instead of global-config mutation

**Status:** Accepted (2026-07-17). Supersedes the reconcile approach (PR #9) as
the target, while keeping it as the TUI safety net.

## Context

Today `cto-code` writes the kernel's **user-owned global config**
`~/.config/opencode/opencode.jsonc` (`src/cli/opencode-setup.mjs` — create,
`--reconfigure` rewrite, and now `reconcileOllamaModels` in-place re-serialization
of the whole file). PR #9 fixed the "model not valid" bug this caused (stale model
map vs live roster) with a fail-safe reconcile, but the underlying pattern remains
fragile: cto-code mutating a file the user also owns and hand-edits.

Empirical finding: OpenCode 1.18.3 honors **`OPENCODE_CONFIG_CONTENT`** (inline
JSON config merged **last**, at `local` scope), **`OPENCODE_CONFIG`** (extra config
path), **`OPENCODE_CONFIG_DIR`**, and **`OPENCODE_PERMISSION`** (inline permission
overlay) — all verified in the compiled config loader. A runtime overlay that never
touches the user's file is therefore a supported, first-class mechanism.

The repo has **no XDG state-dir helper** today (`src/paths.mjs` roots everything at
`~/.cto-brain`; only `opencode-setup.mjs` reads `XDG_CONFIG_HOME`).

## Decision

**Compile a per-launch OpenCode runtime configuration and inject it via
`OPENCODE_CONFIG_CONTENT` (and `OPENCODE_PERMISSION`), rather than rewriting the
user's global config.** The pipeline:

```
discover → normalize catalog → probe → select route → COMPILE overlay
  → inject (OPENCODE_CONFIG_CONTENT / SDK config) → launch/connect
```

- The user's global `opencode.jsonc` is **read as the base** and **never
  destructively rewritten**. cto-code's overlay (provider baseURL, selected model,
  `cto` agent, permission set, MCP profile) merges last, at `local` scope.
- cto-code's own generated/runtime state lives under an **XDG-compatible state
  directory** (`XDG_STATE_HOME/cto-code`, fallback `~/.local/state/cto-code`) with
  **atomic writes, JSON-schema validation, and a process lock**.
- The reconcile fix (PR #9) is **retained as the fallback for the plain TUI launch
  path** (where no overlay is injected), because it is already proven and
  fail-safe (skips on empty roster / non-JSON config). Once the overlay path is the
  default, global-file writes become opt-in (`--reconfigure` only).

## Consequences

**Good:** the user's config is respected — no surprise rewrites, no clobbering of
hand edits or comments; each launch gets a fresh, correct config computed from the
live roster + policy (the "model not valid" class of bug disappears at the root,
not just its symptom); runtime state is isolated and XDG-clean; overlays compose
naturally with the SDK path (ADR-0004), which accepts config inline.

**Bad / accepted risk:** two config-provenance paths during migration (global file
for TUI fallback, overlay for the main path) — documented and time-boxed; the
overlay must reproduce everything `buildOpencodeConfig` writes today (provider,
agent, instructions, MCP) or behavior regresses.

**Rejected alternative:** *keep rewriting the global file, just more carefully.*
Rejected — it is the user's file; even a careful rewrite races with the user's own
edits and other tools, and the reconcile round-trip re-serializes the whole
document. Overlay injection removes the shared-ownership hazard entirely.
