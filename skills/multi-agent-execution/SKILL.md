---
name: multi-agent-execution
description: Default for technical execution with 2+ independent work units (audits, refactors, multi-file fixes, multi-themed work). Triggers parallel general-purpose subagent dispatch with non-overlapping file scopes, structured briefs, no-agent-commits rule, and a single integrating commit. Fire instead of serial editing whenever a punch list spans more than one theme (docs + code + config), more than 5 files, or 2+ independent slices.
---

# Multi-Agent Execution (Default Mode for Technical Work)

## Overview

For non-trivial technical execution, **default to parallel agent dispatch** rather than serial single-Claude editing. A parent Claude decomposes the work into non-overlapping file scopes, dispatches one `general-purpose` agent per scope with a structured brief, and integrates the returned diffs into a single commit at the end.

**Core principle:** One agent per **theme** (not per file, not per task). Each agent owns a file scope no other agent may touch. Parent integrates, validates, and commits.

**Why this is the default:** Two waves in a single session compressed ~60 minutes of serial editing into ~15 minutes of wall-clock with zero merge conflicts. Quality was at least as good — agents stayed focused because their scopes were narrow, and the parent caught integration issues that a tunnel-visioned serial run would have missed.

## When to Fire (Triggers)

Fire this skill at the **start** of a task when ANY of the following is true:

- The punch list has **≥2 independent work units** (e.g. "fix the chart" AND "fix the manifests" AND "fix the scripts").
- The change touches **≥5 files** spread across more than one directory or subsystem.
- An audit has been completed and produced **explicit per-file fixes** (file:line references with intended changes).
- The work spans **mixed types** that map cleanly to separate concerns:
  - docs + code + config
  - chart templates + manifests + scripts
  - tests + implementation + integration glue
- A user gives a numbered list of tasks where most items are independent.

Search keywords that should trigger this skill: "audit", "punch list", "fix all of these", "package this up", "make this shareable", "refactor across", "OpenShift packaging", "Helm chart cleanup", "ship a release", "multi-file fix".

## When NOT to Fire (Anti-Triggers)

Do NOT use multi-agent execution when:

- **Single small change** — one file, one function, one config key. Just edit it.
- **Sequential dependencies** — Task B needs Task A's output. Agents cannot share state mid-flight.
- **Ambiguous scope** — no concrete punch list yet. Stay in brainstorming/exploration mode; you cannot brief agents on work that hasn't been defined.
- **Exploratory debugging** — you don't know what's broken yet. Investigate first (possibly with `systematic-debugging`), THEN dispatch.
- **One file, many small edits** — overhead of an agent dispatch exceeds the editing cost.
- **Tightly coupled cross-cutting refactor** — e.g. renaming a type used in 30 files. A serial agent or a single subagent is safer because any agent reading file N needs the canonical decision made in file 1.

When in doubt, ask: "Could a fresh agent with only this brief and no other context do this slice correctly?" If no, the work isn't decomposable yet.

## Decomposition Rules

### 1. Group by theme, not by file

| Good decomposition | Bad decomposition |
|---|---|
| Agent A: chart templates + Chart.yaml + values.yaml | Agent A: Chart.yaml |
| Agent B: all manifests under `manifests/` | Agent B: values.yaml |
| Agent C: scripts + Makefile + .gitignore | Agent C: deployment.yaml |

Themes scale to the work. 1-file agents are wasteful overhead. 30-file agents lose focus.

### 2. Target 5–10 files per agent

- < 3 files: probably should have been merged with another agent or done inline by parent.
- 5–10 files: healthy. Each agent has enough work to justify the dispatch but stays in working memory.
- \> 15 files: split it further — the agent will start cutting corners.

### 3. Non-overlapping file scopes are mandatory

Every brief must include both:

- **You may touch:** explicit list of files (or globs).
- **You may NOT touch:** explicit list of files the OTHER agents own.

If two agents could plausibly want to touch the same file, the parent picks one owner up front. If the file genuinely needs joint edits, that is a signal the decomposition is wrong — collapse those two agents into one.

### 4. Don't over-split

A 4-file change with two clearly separated themes is **one agent**, not four. Parent overhead (briefing, integrating, validating) has a fixed cost per agent. Three well-loaded agents beat seven thin ones every time.

## Briefing Template

Every agent brief MUST contain these six sections in this order:

```markdown
## Goal
[1–2 sentences. What outcome does this agent deliver?]

## Background
[Minimal context the agent needs. Do NOT make them re-derive the audit;
hand them the conclusions. Mention any conventions (Helm chart style,
manifest style, repo layout) they should match. Keep this tight — they
have their own context window.]

## Scope

**You may touch:**
- path/to/file-a.yaml
- path/to/dir/**/*.yaml
- path/to/script.sh

**You may NOT touch (owned by other agents):**
- chart/templates/**         (Agent A owns chart)
- manifests/**               (Agent B owns manifests)
- scripts/**, Makefile       (Agent C owns scripts)

## Fixes to apply
1. **chart/templates/deployment.yaml** — Line 42: change `imagePullPolicy: Always` to `imagePullPolicy: IfNotPresent`. Reason: matches OpenShift convention; Always re-pulls every restart and wedges on disconnected clusters.
2. **chart/values.yaml** — Add `securityContext.runAsNonRoot: true` under the top-level `securityContext` block (currently missing). Reason: OpenShift SCC enforces this.
3. **chart/templates/_helpers.tpl** — Add a `chart.imagePullPolicy` helper that returns `IfNotPresent` for tagged images and `Always` for `:latest`. Reason: cleaner than hardcoding in deployment.yaml.
   [...continue, numbered, with file:line references and the exact intended change...]

## Output format
Return a structured summary with EXACTLY this shape:

### Modified files
- path/file.yaml — one-line summary of change
- path/other.yaml — one-line summary of change

### Validation performed
- Ran `helm lint chart/` — passes
- Ran `helm template chart/ | grep imagePullPolicy` — confirms IfNotPresent everywhere

### Open questions / things parent should review
- [List anything ambiguous you resolved, or flag things parent should double-check]

## Reminders
- DO NOT commit. Parent will integrate and commit.
- DO NOT touch files outside your scope, even if you spot a problem there — flag it in "Open questions" instead.
- DO NOT decide on scope changes unilaterally. If the fix list seems wrong, return a question instead of improvising.
- Match existing repo conventions (Helm style, indentation, naming).
```

## Coordination Rules

These are load-bearing — every one of them has saved a wave at some point:

1. **No agent commits.** Period. Parent integrates everything in a single commit at the end. If an agent commits, the parent loses the ability to integrate, validate, and write a coherent commit message that honestly describes the whole change.
2. **No agent decides scope on its own.** Parent provides the exact file list and the exact fixes. An agent that "noticed something else broken" should surface it, not fix it.
3. **Each agent's last step is a structured summary** in the shape above. Without it, parent integration becomes an investigation.
4. **Parent does not dispatch and walk away.** Parent stays present to answer follow-up questions, integrate returns as they come in, and start validation early.
5. **Dispatch in one batch when possible.** Issue all `Task(...)` calls in a single message so they run truly concurrently. Sequential dispatches lose most of the wall-clock benefit.
6. **Agents do not read this skill.** They are `general-purpose` subagents with their own (much narrower) context. The brief is self-contained.

## Integration Phase (parent's job after agents return)

```
1. git status                      # see total damage
2. git diff --stat                 # what changed, how much
3. For each scope:
     - git diff <file>             # spot-check a few changes per agent
     - Run scope-appropriate validation (table below)
4. If any validation fails:
     - Fix inline OR dispatch a focused fix-agent for that scope
     - Never paper over with a vague "looks good"
5. git add <explicit file list>    # NEVER `git add .` or `git add -A`
6. git commit with a comprehensive message that honestly describes
   the WHOLE commit, not just one agent's slice. List each theme.
```

### Commit message shape

```
<scope>: <one-line summary>

- <theme A>: <one-line summary of what changed and why>
- <theme B>: <one-line summary>
- <theme C>: <one-line summary>

<optional longer body for non-obvious decisions>
```

## Validation Patterns by Tool

Spot-check the agents' work BEFORE committing. Use the most rigorous available check; an agent passing its own validation is not the same as parent validating from a fresh shell.

| Stack | Validation command(s) |
|---|---|
| Helm chart | `helm lint chart/`, `helm template chart/ > /tmp/out.yaml`, `grep -c '<expected-token>' /tmp/out.yaml`, `helm template chart/ \| kubectl apply --dry-run=client -f -` |
| Kubernetes manifests | `kustomize build manifests/`, `oc kustomize manifests/`, `kubectl apply --dry-run=client -f manifests/` |
| Bash scripts | `bash -n script.sh` (syntax), `shellcheck script.sh` (quality), `bash script.sh --help` (smoke) |
| Python | `python -m py_compile module.py`, `pytest --collect-only` (test discovery, not run), `ruff check`, `mypy --no-incremental` |
| TypeScript / JS | `tsc --noEmit`, `eslint .`, `pnpm build` (build smoke) |
| Go | `go vet ./...`, `go build ./...`, `gofmt -d .` |
| YAML config | `yamllint .` or `python -c 'import yaml; yaml.safe_load(open("file.yaml"))'` |
| JSON config | `jq . file.json > /dev/null` |
| Dockerfile | `docker build --check .` (BuildKit), or at minimum `hadolint Dockerfile` |
| Makefile | `make -n <target>` (dry-run) |
| Terraform | `terraform fmt -check`, `terraform validate` |

If you don't have a validation command for the stack, write one before dispatching — "I'll eyeball it" is the failure mode this skill exists to prevent.

## Anti-Patterns / Red Flags

| Symptom | Why it's wrong | Fix |
|---|---|---|
| Two agents listed in their briefs as "touching `Chart.yaml`" | Overlapping scopes guarantee merge pain | Parent picks one owner up front |
| Agent prompt says "fix anything you find broken" | Agent will scope-creep and out-of-scope edit | Replace with numbered explicit fix list |
| One agent per file (e.g. 12 agents for 12 files) | Dispatch overhead dwarfs the work | Group into 2–3 thematic agents |
| Agent ran `git commit` before parent reviewed | Loses single-commit integration; commit message will be partial | Always include "DO NOT commit" in brief; if an agent commits anyway, parent does a `git reset --soft HEAD~1` (with explicit user consent) before re-committing |
| Parent ran `git add .` after agents returned | Sweeps in stray files (editor backups, secret blobs, OS junk) | Always file-scoped `git add <list>` |
| Parent committed without running any validation | Skill exists because serial editing makes this mistake too; multi-agent makes it 3× as easy | Validation table is non-optional |
| Parent dispatched agents one-by-one (waiting for each) | Loses the wall-clock benefit | Single message, multiple `Task(...)` calls |
| Briefs omit "you may NOT touch" lists | Agent will edit something on a tangent and conflict with peer | "You may NOT touch" is non-negotiable |
| Briefs reference an audit file the agent must read | Agent burns context reading & re-deriving | Paste the audit conclusions into the brief |
| Agent returned a chatty narrative instead of structured summary | Integration becomes detective work | Brief must specify exact output shape |

## Worked Example

**Scenario:** OpenShift packaging cleanup for a demo repo. Audit produced ~14 distinct fixes spread across the Helm chart, raw manifests, and operational scripts.

**Decision:** Three independent themes, no shared files, all changes self-contained. Fires the skill cleanly.

**Decomposition (Wave 1):**

- Agent A — **chart core + templates** (~5 files): `Chart.yaml`, `values.yaml`, `templates/deployment.yaml`, `templates/_helpers.tpl`, `templates/service.yaml`. Brief includes: bump apiVersion, fix imagePullPolicy, add securityContext, parameterize image tag.
- Agent B — **raw manifests** (~5 files): `manifests/namespace.yaml`, `manifests/serviceaccount.yaml`, `manifests/role.yaml`, `manifests/rolebinding.yaml`, `manifests/scc.yaml`. Brief includes: align labels with chart, fix SCC, add missing rolebinding subject.
- Agent C — **scripts + repo hygiene** (~5 files): `scripts/install.sh`, `scripts/uninstall.sh`, `Makefile`, `.gitignore`, `README` install section. Brief includes: fix non-portable bash, add `make install`/`make uninstall`, gitignore build artifacts.

**Each brief specified non-overlapping "may touch / may NOT touch", numbered fixes with file:line refs, structured-summary output, and "no commits."**

**Integration:**
- `git status` → 14 files modified, no surprises.
- `helm template chart/` → renders clean, all expected security flags present.
- `oc kustomize manifests/` → builds clean.
- `bash -n scripts/install.sh && shellcheck scripts/install.sh` → passes.
- One commit, file-scoped `git add`, message lists all three themes.

**Wall clock:** ~7 minutes vs. an estimated ~30+ minutes serial. Zero merge conflicts. One agent caught a problem the audit missed and flagged it in "Open questions" — parent fixed inline before commit.

**Wave 2 (same session, shareability pass):** Same pattern, four agents — quickstart docs, bench reliability, liveness probes, single-command installer + tarball target. Same outcome: clean returns, single commit, big wall-clock win.

## Quick Reference

**Parent's checklist before dispatching:**
- [ ] Punch list exists (file:line refs, intended changes)
- [ ] Themes identified (2–4 of them, not more)
- [ ] Each theme has 5–10 files, non-overlapping with peers
- [ ] Each brief has all six sections (Goal / Background / Scope / Fixes / Output / Reminders)
- [ ] Validation commands chosen for each stack
- [ ] Dispatching all agents in ONE message

**Parent's checklist before committing:**
- [ ] All agents returned structured summaries
- [ ] `git status` + `git diff --stat` reviewed
- [ ] Spot-checked at least one file per agent via `git diff`
- [ ] Ran scope-appropriate validation for every theme
- [ ] Resolved any "Open questions" the agents flagged
- [ ] File-scoped `git add` (no `.` or `-A`)
- [ ] Commit message honestly describes ALL themes, not just one

## Why This Is the Default

Mike's preference, validated empirically twice in a single session: for any work that decomposes into independent thematic slices, parallel agent dispatch beats serial editing on wall clock, on focus, and on the parent's ability to spot integration issues. Serial editing is the fallback for genuinely indivisible work — not the default.
