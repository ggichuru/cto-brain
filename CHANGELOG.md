# Changelog

All notable changes to **cto-brain**. Versions follow SemVer; pre-1.0 minors
may add features freely. Check the published version with `npm view cto-brain
version` rather than trusting a line in this file — the previous one claimed
0.11.0 was the local tip while the repo had moved to 0.12.0 and npm was still
serving 0.9.1, because CI (and therefore the release workflow) had been red
since 2026-07-17.

## 0.12.0
- **CI could not pass, so nothing could ship** (`.github/workflows/{ci,release}.yml`):
  both ran `npm run ci` with no install step while `package.json` declares a runtime
  dependency (`@modelcontextprotocol/sdk`, added 2026-06-24). Every run from
  2026-07-17 failed on `ERR_MODULE_NOT_FOUND`; `release.yml` shares the gate, so no
  tag could publish and npm stayed on 0.9.1 through three local minors. Both
  workflows now `npm ci` first, and `.github/workflows/README.md` no longer claims
  "zero npm dependencies".
- **The router no longer dispatches to a model nobody chose**
  (`src/router/select.mjs`): `pickModel()` ranked `probed.models[0]` above the
  declared defaults, so the head of a provider's model list shadowed policy.
  `router select --task reviewer-security` returned `airan-e2b:v1` — a 4.6B
  experimental fine-tune — for a security review, reporting `modelAvailable: true`
  (trivially, since the model came from the list it was checked against) and no
  warning. Order is now override > declared > probe, and every route carries
  `modelSource`: `override` | `declared` | `probe-singleton` | `arbitrary-probe-pick`
  | `none`. A single-model endpoint is honest; a menu with nothing declared sets
  `honest: false` and says so in `reason`.
- **`doctor` grades skill CURRENCY, not just presence** (`src/cli/doctor.mjs`): it
  stopped at "skill present", so four bundled skills sat 1-3 minor versions behind
  the system brain for 53 days behind nine green lines. It now compares version
  stamps on both sides and reports stale / ahead / diverged, naming versions and the
  fix command.
- **Bundled skills promoted**: agentic-learning-loop 0.1.0 -> 0.3.3,
  cto-orchestration 0.6.1 -> 0.6.2, meta-brain 0.2.0 -> 0.2.3,
  multi-agent-execution stamped 0.2.0 (it had no version header at all).
- **Four new skills**: documentation-discipline, arch-topology-diagrams,
  model-evaluation, grounded-sovereign-agentic-build.
- **Depersonalised for publication**: the package named its operator, their GPU
  host and that host's town, and hardcoded a private gateway hostname in `src/` as
  every installation's default upstream. The jarvis preset now has no default host
  and `startGateway()` throws unless `JARVIS_BASE_URL` is set, rather than guessing.
- **Two tests that asserted the defects were amended, not deleted**: the eval case
  "confirms a model that IS in the probe list" probed `["llama3.2:1b"]` and asserted
  `modelAvailable: true` while the router picked its model from that same list — a
  tautology that could not fail, and did not, for the life of the bug.
- **Docs**: README documents `adapter pick|status`; the jarvis integration doc no
  longer publishes a private hostname.

## 0.11.0
- **Router presets: llama-swap + LM Studio** (`src/router/{providers,discover,select,config}.mjs`):
  the two runtimes strangers most commonly run are now first-class — presets with
  env overrides (`LLAMA_SWAP_BASE_URL`, `LMSTUDIO_BASE_URL`), localhost discovery
  (llama-swap disambiguated from bare llama.cpp via one shared `GET /running`
  probe per URL), and placement in every local-first fallback chain before cloud.
- **Cost-per-outcome telemetry goes live** — `round-close` gains
  `--outcome/--tokens-in/--tokens-out` (MCP `round_close` passes the same through);
  the 0.10.0 recording leg finally has a caller, best-effort so telemetry can
  never break the ritual.
- **Tool-conformance ledger** (`src/router/conformance.mjs`): probe, don't guess —
  a pure classifier over OpenAI-wire and Ollama-native replies
  (structured | text-embedded | none | error), verdicts persisted to
  `~/.cto-brain/conformance.json`; `toolCapable()` consults recorded evidence
  before the substring heuristic (fail-open to heuristic, never a crash).
  Live leg proven env-gated: `ollama qwen2.5:7b-instruct → structured`.
- **Ultraplan roadmap** (`docs/ROADMAP.md`) + 7 spec contracts under
  `specs/changes/` (3 frozen Phase-1 above; searxng-research-seam,
  distributed-substrate, per-user-finetuning as gated proposals) + verified
  research report `docs/research/2026-07-11-local-coding-agent-stacks.md`.
- **Spec contracts, openspec-style, dependency-free** (`src/spec/contract.mjs`):
  `cto-brain spec init <change-id>` scaffolds `specs/changes/<id>/{proposal.md,tasks.md}`
  from `templates/spec/`; `cto-brain spec check` lints proposals for the four
  required sections (Intent / Behavior / Acceptance criteria / Non-goals) and
  treats empty sections as errors. Exit 1 on failure; JSON report.
  Spec: `docs/integrations/spec-contracts.md`. The 2026-07-03 peer-study round
  rejected the openspec CLI as a dependency — this adopts the mechanics natively.
- **New bundled skill `spec-driven`** (9th): the SDD half of the SDD×TDD
  doctrine as a model-invoked discipline — propose → freeze → implement (tdd)
  → verify → archive, drift-is-a-bug. Wired into `agentskills`.

## 0.10.0
- **Skill-structure lint in the gate** (`src/gate/skill-lint.mjs`): `gate check`,
  the `gate_check` MCP tool, and `prepublishOnly` now enforce Agent Skills spec
  conformance — missing SKILL.md / bad or mismatched `name` / missing
  `description` fail the gate; over-cap descriptions, unknown frontmatter keys,
  >500-line bodies and leftover TODO markers warn.
- **Cost-per-outcome telemetry**: `recordEvent` accepts `outcome` + token fields;
  `telemetry summary` reports tokens-per-outcome. The missing quantitative leg of
  the learning loop — a route/skill's value expressed as tokens per result.
- **Trigger-eval harness** (`npm run trigger-eval`, `eval/trigger-fixtures.json`):
  measures skill-firing precedence against local Ollama; 20 labelled queries incl.
  near-miss negatives. Baseline 20/20 at qwen2.5:7b. Not in CI (needs a live model).

## 0.9.x
- **`cto-brain code`** — sovereign local-model coding terminal (opencode/codex/
  aider backends), model chosen by the router; GB10 box-tanking guardrail.
- Auto-routing hardened; `cto-brain code` never auto-routes to slow large models
  in interactive use.

## 0.8.0
- IC discipline skills bundled and wired: `grill`, `tdd`, `diagnosing-bugs`,
  `domain-modeling` (credited to mattpocock/skills); meta-brain catalog +
  invocation classes; `CONTEXT.md` shared-vocabulary convention.

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
