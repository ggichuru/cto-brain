# ADR 0009 — Worktree-per-task isolation

**Status:** Accepted (2026-07-17).

## Context

The charter wants a workspace manager where each substantial task can receive its
own git worktree, branch, OpenCode session, model route, permission profile, and
evidence directory; parallel specialist reviewers (correctness, security,
performance, tests, maintainability) consolidated into one severity-ranked report;
and a guarantee that **parallel agents never write to the same worktree**.

OpenCode's plugin/session context already exposes a `worktree` handle, sessions
persist independently in sqlite, and per-session model/agent/permission are
supported (ADR-0003). So the isolation primitive is a **git worktree per task**
bound to its **own OpenCode session** — the control plane orchestrates; the kernel
executes each in isolation.

This mirrors the pattern this very platform round already uses (the reconcile fix
and this architecture report each live in their own `.claude/worktrees/*` branch).

## Decision

**Adopt worktree-per-task isolation as the unit of parallel work.** A workspace
manager provisions, per substantial task: its own **git worktree + branch**, its
own **OpenCode session** (via the SDK adapter), its own **model route**, its own
**permission profile**, and its own **evidence directory**. Commands:
`cto-code task {create, list, attach, diff, merge, discard}`.

- **Never allow two parallel agents to write to the same worktree** — the manager
  assigns exactly one writer per worktree; read-only agents (reviewers, explorers)
  get read access and cannot edit.
- **Parallel review** runs specialist agents (correctness, security, performance,
  tests, maintainability) each in its own read-only session, consolidated into a
  single **severity-ranked** report.
- Merges are explicit and approval-gated (`git push`/merge is `ask` per the
  permission model, ADR-0007); `discard` cleans the worktree + branch.
- Worktrees are created off a fresh base ref; unchanged ones are auto-removed.

## Consequences

**Good:** true parallelism without cross-task interference; each task's diff,
evidence, and route are independently reviewable and reversible; failed/abandoned
tasks discard cleanly without touching the user's working copy; matches the
platform's own proven operating pattern.

**Bad / accepted risk:** worktrees cost disk and setup time (~hundreds of ms +
copy) — provision them only for *substantial* tasks, not trivial edits; many
concurrent worktrees + sessions increase resource pressure on the box (bounded by a
concurrency cap); merge/rebase conflict handling across many branches needs a clear
policy (surface conflicts, never auto-resolve).

**Rejected alternative:** *single shared workspace with file-level locking.*
Rejected — locking within one working tree is fragile, serializes writers, and
still lets a crashed agent leave partial edits in the user's tree; a worktree is the
OS/git-native isolation boundary and discards atomically.
