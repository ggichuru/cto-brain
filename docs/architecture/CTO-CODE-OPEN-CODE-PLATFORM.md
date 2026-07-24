# cto-code × OpenCode — Platform Architecture

**Status:** Foundational design (First-Action deliverable). Grounds the 12-PR
platform charter in the *actual* capabilities of the installed toolchain before
any broad implementation begins.

**Date:** 2026-07-17 · **cto-brain:** v0.11.1 · **OpenCode:** 1.18.3 (MIT, native
`opencode-linux-arm64`) · **@opencode-ai/sdk:** 1.18.3 (published, MIT)

> This document reflects the code as inspected on 2026-07-17 via four independent
> read-only research passes (OpenCode capability audit, OpenCode runtime/SDK live
> verification, cto-brain control-plane map, gateway-bridge map). Every capability
> claim is tagged **PROVEN** (verified by CLI/HTTP/binary evidence) or **UNPROVEN**
> (inferred, needs an empirical test before it is relied upon). No claim here is
> "it works" unless it was executed.

---

## 0. Executive summary — the load-bearing findings

1. **No fork is required.** Every kernel capability the charter wants —
   native skills, primary/subagent definitions, per-pattern permissions, policy
   hooks, custom tools, a headless server + typed SDK, runtime config overlay,
   per-agent MCP gating — is reachable through OpenCode 1.18.3 configuration, its
   plugin API, or `@opencode-ai/sdk`. **PROVEN** (see §1, ADR-0003).

2. **`opencode run` is empirically unreliable for programmatic use.** Three
   identical MCP invocations produced: silent empty output with **exit code 0**
   (1×), clean success (1×), and success-after-two-schema-errors (1×). A caller
   checking `$?` cannot distinguish the silent failure from success. This is the
   spine of the SDK-migration decision (§4, ADR-0004). **PROVEN.**

3. **OpenCode already ingests `~/.claude/skills/` by default.** The binary carries
   `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` / `OPENCODE_DISABLE_EXTERNAL_SKILLS`
   flags; Claude-Code skills load unless explicitly disabled. The user's 40 local
   skills are therefore *already* visible to `cto-code`'s OpenCode. The skills
   work is **validation + canonical storage + discoverability**, not copy/translate
   into three directories (§5, ADR-0006). **PROVEN** (flags in binary; live
   directory-spelling of loose files **UNPROVEN**).

4. **Runtime config overlay is a first-class, supported mechanism.**
   `OPENCODE_CONFIG_CONTENT` (inline JSON, merged **last**, `local` scope) and
   `OPENCODE_PERMISSION` (inline permission overlay) are honored by the config
   loader. cto-code should compile a per-launch overlay and inject it, **not**
   rewrite the user's global `~/.config/opencode/opencode.jsonc` (§3, ADR-0005).
   **PROVEN** (env-var table in the compiled binary).

5. **The control plane is further along than the charter assumes — but wired
   wrong.** cto-brain already has a router pipeline, an MCP server (mostly *real*
   tools), a telemetry recorder, an A2A card, a doctor, and — critically — a
   **fully-built, unit-tested, but completely unwired empirical tool-conformance
   ledger** (`src/router/conformance.mjs`). There are **two parallel
   model-selection lanes that never meet** (router `select.mjs` vs terminal
   `capabilities.mjs`). Much of the "capability-aware routing" charter work is
   *connecting what exists*, not building anew (§2, ADR-0008). **PROVEN by grep.**

6. **Cloud breadth is thinner than memory claims.** `PROVIDER_PRESETS` has
   OpenAI, Anthropic, and Fugu — **no OpenRouter, Moonshot, or Together**. The
   "all-model gateway" is aspirational in code today (§2). **PROVEN.**

---

## 1. Current architecture (as-built, 2026-07-17)

### 1.1 The two processes today

```
 cto-brain code                      opencode (CLI child process)
 ───────────────                     ────────────────────────────
 listLocalChatModels()  ── /api/tags ─► ollama :11434
 resolveModel()  (capabilities.mjs)
 ensureOpencodeWiring()  ───writes──►  ~/.config/opencode/opencode.jsonc  ◄── SHARED USER CONFIG
 spawn("opencode",                     ~/.config/opencode/agent/cto.md
   ["--agent","cto",                   ~/.config/opencode/cto-brain.md
    "-m","ollama/<model>"])  ─exec──►  opencode TUI ──► ollama /v1
                                          └─ MCP: spawns `cto-brain mcp` (stdio, per-run)
```

The control plane is a **launcher that mutates the kernel's own config file and
then shells out**. This is the sharpest boundary blur (see §7).

### 1.2 Control-plane subsystems (cto-brain repo, flat `src/`)

| Subsystem | Files | State |
|---|---|---|
| CLI dispatch | `bin/cto-brain.mjs` (`switch(cmd)` @162) | 24 subcommands |
| Router pipeline | `src/router/{select,providers,capabilities,probe,discover,conformance,config,stack}.mjs` | mature; see §2 |
| Terminal launcher | `src/cli/code.mjs`, `src/cli/opencode-setup.mjs` | opencode/codex/aider backends |
| MCP server | `src/mcp/{server,tools,streamableHttp}.mjs` | 9 tools (7 real + `eval_run` + `agent_card`), stdio + loopback HTTP |
| Gateway bridge | `src/gateway/{bridge,index}.mjs` | OpenAI↔jarvis; **not wired to launcher** |
| Telemetry | `src/telemetry/recorder.mjs` | JSONL @ `~/.cto-brain/telemetry/runs.jsonl` |
| Doctor | `src/cli/doctor.mjs` | skills/creds/adapters only |
| Adapters/sync | `src/adapters/*`, `src/sync/*` | non-destructive skill wiring |
| A2A / gate / spec / eval / synth | `src/{a2a,gate,spec,eval,synth}/*` | supporting |

State root is `CTO_BRAIN_HOME || ~/.cto-brain` (`src/paths.mjs:24`). **There is no
XDG_STATE_HOME/XDG_DATA_HOME helper today** — relevant to ADR-0005.

### 1.3 OpenCode 1.18.3 kernel surface (PROVEN)

- **Config keys:** `provider, model, small_model, default_agent, agent,
  subagent_depth, permission, mcp, instructions, plugin, command, skills, tools,
  formatter, lsp, share, server, compaction, experimental` (schema
  `https://opencode.ai/config.json`). `keybinds`/`theme`/`tui` migrated out to
  `tui.json`.
- **Runtime overlay:** `OPENCODE_CONFIG_CONTENT` (inline JSON, merged last),
  `OPENCODE_CONFIG` (path), `OPENCODE_CONFIG_DIR`, `OPENCODE_PERMISSION` (inline).
- **Skills:** native `SKILL.md` loader; discovery incl. `.claude/skills/` +
  `~/.claude/skills/` + `.opencode/skills/` + `.agents/skills/`; frontmatter
  requires `name` + `description`. Exposed via a `skill` tool + `skill` permission.
- **Agents/subagents:** `agent.<name>` config block and/or `.opencode/agent/*.md`
  frontmatter; fields `model, mode(primary|subagent|all), temperature, prompt,
  tools, permission, hidden, disable, steps, description`; `subagent_depth` caps
  nesting; per-agent `permission.task` gates which subagents are callable.
- **Permissions:** `permission` object keyed by `read, edit, bash, task, webfetch,
  websearch, skill, …`; each value is `ask|allow|deny` or a **per-pattern map**
  (`"bash": {"*":"ask","git push *":"deny","rm *":"deny"}`), last-match-wins,
  per-agent overrides, runtime-overridable via `OPENCODE_PERMISSION`.
- **Plugins:** `async ({project, client, $, directory, worktree}) => ({hooks})`;
  hooks `tool.execute.before/after`, `permission.asked/replied`, `chat.message/
  params/headers`, `event`, session/file events. **A `tool.execute.before` hook
  denies by throwing — the thrown message is the denial reason.**
- **Custom tools:** `.opencode/tool/*.ts`, `tool({description, args, execute})`
  from `@opencode-ai/plugin`; returns a string.
- **Server:** `opencode serve --hostname --port --cors`; OpenAPI 3.1 at `/doc`
  (162 paths); `/session*`, `/session/:id/{message,prompt_async,command,shell,
  diff,revert,unrevert,permissions/:id,abort,fork}`, SSE `/event` (first frame
  `server.connected`); HTTP Basic via `OPENCODE_SERVER_USERNAME/_PASSWORD`
  (401 without creds — verified). Sessions persist in **sqlite** at
  `~/.local/share/opencode/opencode.db` across restarts (verified).
- **SDK:** `@opencode-ai/sdk@1.18.3` exports `createOpencodeClient(config)`,
  `createOpencode()` (spawn+connect), namespaced client (`session.{create,prompt,
  promptAsync,message,command,shell,diff,revert,unrevert,abort,fork,…}`,
  `event.subscribe()`, `mcp.{status,add,connect}`, `provider`, `file`, `find`,
  `tui`, `permission` routes).

**UNPROVEN and to be tested before relied on:** loose-file directory spelling
(`agent` vs `agents`, `skill` vs `skills`), exact plugin-hook field signatures,
MCP tool execution *through* the serve/SDK path (only proven through `opencode
run`), and the full `/session/:id/*` route list under load.

---

## 2. The routing reality (feeds ADR-0008)

Three model-selection systems exist; they do not compose:

- **Lane A — router (`select.mjs::selectRoute`).** Hard-filter, first-match over an
  ordered `fallbackChain`; model = `probed.models[0]` (**naive first**). Imports
  `providers.mjs` only. Return: `{provider, model, baseUrl, tier, task, prefer,
  reason(string), honest, fallbackUsed, modelAvailable}`. **No scoring, no
  capability awareness.** Consumed by the CLI `router` command, the MCP tools, and
  eval.
- **Lane B — terminal (`capabilities.mjs`).** `tagModel/toolCapable/pickToolModel`
  — **name-based heuristics** (string-match `coder`/`vl`/`-instruct`; param-count
  regex for size). Consumed **only** by `code.mjs` + `opencode-setup.mjs`.
  `select.mjs` never imports it.
- **Lane C — conformance (`conformance.mjs`).** A full empirical tool-call probe +
  persisted verdict ledger (`probeToolConformance`, `loadVerdicts`, `toVerdictMap`,
  `saveVerdicts`). Unit-tested. **Zero callers in `src/`/`bin/`** — the empirical
  signal the charter asks for already exists and feeds nothing.

`PROVIDER_PRESETS` (`providers.mjs:3`): local — `ollama, vllm, llamacpp,
llama-swap, lmstudio, openai-compatible, desk-engine`; cloud — `openai, anthropic,
fugu` (key-gated), `cursor`/`codex` (IDE stubs), `jarvis` (remote, tagged
`local`). **Missing vs the "all-model" charter: openrouter, moonshot, together.**

**Consequence:** "capability- and policy-aware routing with a structured route
explanation" is largely a *convergence* task — unify A+B, wire C, add a soft-score
pass and a typed `RouteDecision` — not a greenfield build.

---

## 3. Target architecture

### 3.1 Boundary contract — kernel vs control plane

```
┌──────────────────────── cto-code CONTROL PLANE (cto-brain) ────────────────────────┐
│ provider discovery · model catalog (typed) · capability probes · route selection    │
│ sovereignty/cost/latency policy · agent registry · skill install/validate           │
│ MCP profiles · workspace/worktree mgmt · remote host/session mgmt · credentials     │
│ telemetry/evidence · packaging/upgrades · doctor                                    │
└───────────────┬──────────────────────────────────────────────────────┬─────────────┘
                │ compiles runtime overlay + agent/skill/permission set  │ SDK/HTTP
                ▼                                                        ▼
┌──────────────────────────── OpenCode EXECUTION KERNEL ─────────────────────────────┐
│ repo read/write · shell · sessions/messages (sqlite) · diff/revert · permissions    │
│ LSP/formatters · agent & subagent execution · SKILL.md loading · MCP tool execution │
│ custom tools · TUI / web / server / ACP clients                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Rule:** the control plane never re-implements a kernel primitive (repo I/O,
shell, sessions, permissions, provider transport). It *decides* and *injects*; the
kernel *executes*. (ADR-0003.)

### 3.2 The compile-and-inject data flow (replaces config mutation)

```
discover providers ─► normalize typed catalog ─► probe capabilities+health
      ─► select route (hard filter + soft score) ─► compile OpenCode runtime config
      ─► inject via OPENCODE_CONFIG_CONTENT / SDK config ─► launch (TUI) or connect (serve+SDK)
```

- **Typed model record** (per charter): providerId, modelId, canonicalId, endpoint,
  locality(local|lan|cloud), contextCapacity, toolCall, structuredOutput, reasoning,
  vision, quant, expectedLatency, observedThroughput, sovereignty, cost, health,
  lastProbe, digest. Capabilities come from **probes + a declared catalog**, never
  name-inference alone (Lane C, promoted).
- **Runtime state dir:** `XDG_STATE_HOME/cto-code` (fallback `~/.local/state/
  cto-code`) with atomic writes, JSON-schema validation, and a process lock. The
  user's global opencode config is read-as-base, **never destructively rewritten**
  (ADR-0005).
- **Route decision** is a typed object with `selected`, `taskClass`, `reasons[]`,
  `rejected[]`, `policy{localOnly,maxCostUsd}` — inspectable by the user.

### 3.3 Kernel adapter (`CodingKernel`)

A single interface isolates OpenCode specifics (ADR-0004). OpenCode is the first
and primary implementation, backed by `@opencode-ai/sdk` + `opencode serve`; a
thin `opencode run` launch path remains only as a compatibility fallback. Codex
and Aider stay as secondary adapters where genuinely supported.

---

## 4. Data flows (runtime)

**Local interactive (default):** `cto-code code` → discover ollama → probe/score →
compile overlay (provider baseURL loopback, `cto` agent, permission set, MCP
profile `coding`) → `OPENCODE_CONFIG_CONTENT=<overlay> opencode --agent cto -m
ollama/<model>` (TUI). No global file written.

**Programmatic / CI:** control plane starts (or connects to) `opencode serve` on
loopback → creates a session over the SDK → `session.prompt` → consumes `/event`
SSE for tokens/tool-calls/permissions → asserts on the typed message body. Avoids
the `opencode run` silent-exit-0 failure (§0.2).

**Remote / off-box:** remote client → authenticated gateway (host agent) → local
`opencode serve` bound to loopback → isolated repo worktree. The gateway
terminates auth; the kernel is never exposed unauthenticated (ADR-0004 remote
addendum, §6, and the gateway map).

---

## 5. Trust boundaries

| Boundary | Control today | Target |
|---|---|---|
| Local repo ↔ cloud model | Policy string `prefer`; no data-classification gate | Hard filter: `localOnly` blocks repo content egress; cloud requires cred+policy+budget+classification (ADR-0008) |
| Secrets on disk | none (model can read `.env`) | Plugin `tool.execute.before` denies secret-file reads with a reason (ADR-0007 / plugin PR) |
| Gateway ↔ off-box client | **loopback-only + Host-header allowlist**, no inbound auth (bridge only attaches `JARVIS_API_KEY` upstream) | Authenticated gateway (bearer / short-lived creds), Tailscale ACL, repo allowlist, audit trail (§6) |
| `opencode serve` exposure | HTTP Basic (`OPENCODE_SERVER_USERNAME/_PASSWORD`), loopback default | Never public; reached only via the authenticated gateway + loopback bind |
| Credential handling | env-var presence checks; telemetry stores provider+model only (no secrets) | Same discipline extended; doctor reports availability **without printing secrets** |
| JARVIS_API_KEY locality | stays on spark; laptop never sees it (bridge attaches it upstream) | Preserved; any new inbound gateway secret is a *separate* shared secret |

## 6. Remote access (gateway) — current blockers (PROVEN)

`src/gateway/bridge.mjs` is an OpenAI-compatible server (`startGateway`,
`/v1/models`, `/v1/chat/completions`, `/healthz`) that proxies to jarvis
(`/ollama/api/chat`). Two hard blockers for off-box use:

1. **Binds loopback.** `case "gateway"` never passes `host` → 127.0.0.1 only.
   Needs an opt-in `--host 0.0.0.0` (or `tailscale serve` fronting).
2. **Host-header allowlist rejects non-loopback** (`requestAllowed`) → a tailnet
   client gets 403 even when bound to 0.0.0.0. Must allow an explicit trusted host
   when non-loopback, and add an inbound bearer (the bridge has **no inbound
   auth** today).

Target remote path (ADR-0004 remote addendum): `remote client → authenticated
encrypted gateway → host agent → opencode serve (loopback) → isolated worktree`,
with host registration/identity, session authorization, repo allowlists, event
streaming, cancellation, rate limiting, short-lived credentials, and an audit
trail. **No unauthenticated OpenCode server is ever exposed to the internet; no
unrestricted remote shell by default.**

## 7. Failure modes (observed + designed-for)

| Failure | Cause | Today | Target mitigation |
|---|---|---|---|
| Silent empty result, exit 0 | `opencode run` non-determinism (1/3) | undetectable by `$?` | serve+SDK typed body assertion (ADR-0004) |
| "model not valid" | stale global `opencode.jsonc` model map vs live roster | **fixed** by reconcile (PR #9) | superseded by runtime overlay (ADR-0005) — no stale global map at all |
| Tool calls printed as text | model not tool-capable (coder/gemma) | name-heuristic `toolCapable` | empirical conformance ledger wired into the hard filter (Lane C, ADR-0008) |
| Empty roster wipes config | ollama down during reconcile | reconcile **skips on empty roster** (fail-safe) | overlay computed fresh per launch; base config untouched |
| Cloud used on private repo | policy is advisory prose | `prefer` string only | hard `localOnly` filter blocks egress (ADR-0008) |
| Destructive shell command | no deterministic guard | prompt-instruction only | permission per-pattern deny + plugin policy hook (ADR-0007) |
| MCP server cold-spawn per run | `opencode run` respawns stdio MCP each call (15–40s) | latency + flakiness | warm long-lived server session (ADR-0004) |

## 8. Migration sequence (12 PRs; keep each independently reviewable)

1. **Model reconciliation (harden).** ✅ **Done — PR #9** (`reconcileOllamaModels`,
   v0.11.1, 10 tests + full suite green; reproduction: `qwen2.5:14b-instruct`
   returned `4` post-fix, `UnknownError` pre-fix). *Interim* — superseded by (2)'s
   overlay, kept as the safety net for the TUI launch path.
2. Runtime config compiler + `cto-code doctor` expansion (ADR-0005).
3. Canonical skills package + idempotent installer/validator (ADR-0006).
4. Native OpenCode agents, commands, permissions (ADR-0003/0007).
5. cto-brain skill ↔ MCP separation (ADR-0007).
6. OpenCode plugin (policy hooks) + custom tools (ADR-0007).
7. OpenCode SDK kernel adapter (ADR-0004).
8. Provider adapters + empirical capability probes (Lane C wiring; ADR-0008).
9. Policy-aware model routing (unify Lanes A+B+C; typed `RouteDecision`; ADR-0008).
10. Worktree + parallel-agent manager (ADR-0009).
11. Remote gateway integration (§6; ADR-0004 remote addendum).
12. Packaging, signed release, npm-publish prep.

## 9. Accepted risks

- **OpenCode is an external kernel we don't control.** Config-schema and
  plugin-hook shapes can change across releases (keybinds already moved to
  `tui.json` in ≤1.18.3). Mitigation: pin a tested OpenCode version range; the
  `CodingKernel` interface localizes churn; a conformance test asserts the config
  keys/routes we depend on.
- **Directory-spelling and plugin-hook signatures are UNPROVEN.** We commit no
  loose-file kernel layout until an empirical test confirms the loader accepts it.
- **`opencode serve` MCP execution is inferred, not proven.** PR #7 must include a
  live test that an MCP tool fires through serve/SDK before we declare the run
  path retired.
- **Gateway exposed off-box widens the attack surface.** Accepted only behind
  Tailscale ACL + inbound auth + audit; never public.
- **cto-code depends on the user's ollama roster + hardware.** Sovereignty is a
  chosen trade-off; routing must report honestly when a sovereign model is weaker.

## 10. Explicit non-goals

- **Not** forking or vendoring OpenCode (no capability requires it — §0.1).
- **Not** re-implementing repo I/O, shell, sessions, diffs, LSP, or provider
  transport — those are kernel primitives.
- **Not** building a second TUI/editor — OpenCode's TUI/web/ACP clients stand.
- **Not** a general cloud proxy — cloud lanes are opt-in, credential-, policy-, and
  budget-gated; local-first is the default posture, not a fallback.
- **Not** destructively managing the user's global OpenCode config — cto-code owns
  a runtime overlay + its own state dir, and reads (never rewrites) the user's base
  config.
- **Not** exposing an unauthenticated OpenCode server or unrestricted remote shell.

---

## Appendix — evidence index

| Claim | Evidence | Verdict |
|---|---|---|
| OpenCode 1.18.3, MIT, arm64 | `opencode --version`; installed pkg | PROVEN |
| Config keys / runtime overlay envs | `https://opencode.ai/config.json`; binary env-var table | PROVEN |
| `.claude/skills` auto-load | `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` flag in binary | PROVEN |
| `opencode run` flaky (1/3 silent, exit 0) | 3 live runs, 15–40s, one empty | PROVEN |
| serve HTTP API + SSE + Basic-auth 401 | live `serve --port 47600`, `/doc` (162 paths), `/session`, `/event`, `-u` gate | PROVEN |
| sqlite session persistence across restart | session survived server kill + restart | PROVEN |
| `@opencode-ai/sdk@1.18.3` surface | `npm view` + tarball `.d.ts` | PROVEN |
| Two unmet routing lanes + dormant conformance | grep: `select.mjs` ⊄ `capabilities.mjs`; conformance 0 callers | PROVEN |
| No OpenRouter/Moonshot/Together preset | `providers.mjs` PROVIDER_PRESETS | PROVEN |
| Gateway loopback + no inbound auth | `bridge.mjs` `requestAllowed`, `case "gateway"` | PROVEN |
| Loose-file dir spelling; hook field shapes; serve-MCP exec | not executed | UNPROVEN |

See `docs/decisions/0003`–`0009` for the decisions this report commits to.
