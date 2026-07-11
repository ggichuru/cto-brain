# cto-brain roadmap — synthesized ultraplan (2026-07-11)

**Method:** judge-panel ultraplan — 3 independent planning lenses (competitive-gap, agentic-capability+gating, run-anywhere portability) over the repo + the adversarially-verified research report (`docs/research/2026-07-11-local-coding-agent-stacks.md`), synthesized by a judge with repo verification. Operator charges folded in: surpass frontier-model workflows **by composition, not muscle**; cheaper hardware; distributed compute substrate; fully offline/sovereign; internal SearXNG research engine; how-to-use clarity; the brain helps users the way it uses itself.

## Honest assessment (judge, verbatim)

cto-brain's policy and gating layer is real and well-tested (24 dependency-free suites, honest-verdict culture in code, provider-plural router core), but three verified gaps separate it from the operator's charge. First, the flagship surface contradicts run-anywhere: src/cli/code.mjs exits 1 without Ollama even when vLLM, LM Studio, llama-swap, or a cloud key is present, and the two runtimes strangers most commonly run have no presets. Second, routing's most critical signal — tool capability — is a one-box substring heuristic, directly against the research's strongest verdict that per-model conformance probing is the right seam. Third, the learning loop is scaffolding, not loop: cost-per-outcome telemetry has zero callers recording outcomes, trigger-eval cannot reject a regression, skill drafts have no enforced promotion gate, and the growth ledger is write-only. Phase 1 lands the three highest payoff-per-effort closures (presets, outcome recording, conformance ledger) with pure GPU-free tests this round; the bigger code-surface rewrite and the gate machinery follow in honestly-sequenced phases. Separately, npm still serves 0.9.1 — an operator-side blocker (registry auth) no code change fixes.

## Phase-1 top slice (frozen, building now)

Ordered: `llamaswap-lmstudio-presets` → `round-close-outcome-telemetry` → `tool-conformance-ledger`. Contracts frozen at `specs/changes/<id>/proposal.md` with exclusive file scopes.

## Phase 1 — three highest payoff-per-effort closures (implement now, this round)

Capped at the 3 best changes by payoff-per-effort, each <= ~1 day, TDD-able with pure ok()/failures tests, no GPU or network (live legs env-gated like JARVIS_API_KEY), and genuinely disjoint file scopes: presets own providers/discover/select/config, outcome telemetry owns round-close/mcp-tools/bin, conformance owns capabilities plus a new module. Together they hit all three lens axes at once: run-anywhere discovery (presets), the learning loop's dead quantitative leg (outcome recording), and the research-validated routing-evidence seam (conformance ledger). The larger code-surface rewrite (2 days, overlapping ambitions across two lenses) ranks 4th by ratio and leads Phase 2.

### `llamaswap-lmstudio-presets` — hours / payoff high

Merged from all portability lenses: first-class router presets and localhost discovery for llama-swap (research F1 verdict: best-fit single-box gateway, OpenAI+Anthropic endpoints) and LM Studio (the common Mac laptop case), so router probe/plan/select and stack status see the two runtimes strangers most commonly already run — today they are silently invisible.

Done-bar (TDD):
- test/router-providers.mjs extended: getProvider('llama-swap') and getProvider('lmstudio') return presets with correct baseUrl, envKey override, probePath, openAiCompatible, tier; resolveBaseUrl honors the env vars; listProviders includes both
- test/router-discover.mjs extended with injected fake fetch: LM Studio found on :1234; a server answering GET /running is reported id llama-swap while one 404ing /running stays llamacpp
- test/router-select.mjs extended: with a mocked reachable llama-swap probe carrying models and ollama down, selectRoute({task:'dispatch-builder', prefer:'local'}) returns provider llama-swap with its probed first model; same for lmstudio; fallbackChain ordering asserted ollama -> llamacpp -> llama-swap/lmstudio -> cloud
- npm test green offline with no network (all probes faked, matching existing suite patterns)

### `round-close-outcome-telemetry` — hours / payoff high

The cost-per-outcome leg shipped in 0.10.0 is dead code today — verified: recordEvent supports outcome/tokensIn/tokensOut but no caller in src/ passes them, so telemetry summary outcomes is always empty. Wire outcome recording at the natural boundary (round-close) so every closed round accrues a quantitative row and the learning loop's missing quantitative leg goes live.

Done-bar (TDD):
- new test/round-close-outcome.mjs: roundClose with a temp CTO_BRAIN home + outcome fields appends a runs.jsonl row with kind=round_close, outcome, tokensIn/tokensOut; summarize() over that home reports outcomes[tag].count=1 and correct tokensPerOutcome
- same test: roundClose with CTO_BRAIN_NO_TELEMETRY=1 still writes the growth ledger row and returns ok (telemetry never breaks the ritual)
- same test: omitting token flags records the outcome row without token fields — schema tolerant, no NaN
- test/mcp-server.mjs extended: round_close tool schema advertises the optional outcome/token fields; npm test green end-to-end with the new suite line in package.json

### `tool-conformance-ledger` — days / payoff high

Merged from all three lenses (proposed independently by each — the strongest consensus in the plan set): replace the one-box substring heuristic in toolCapable() with the research-validated seam (F2/F3/F9-3: tool-calling reliability is a per-model-family parser pairing that must be PROBED, not guessed). Verdicts persist to an evidence ledger that overrides the heuristic, so a routing belief can only change behavior by recorded evidence — the lens-2 gating doctrine applied to routing.

Done-bar (TDD):
- new test/router-conformance.mjs (pure, no network): classifyToolReply fixtures — OpenAI-shape structured tool_calls, Ollama-native message.tool_calls, JSON-call-printed-in-content prose, plain prose, error body — each maps to the documented verdict
- same test: verdict store round-trips in a temp HOME with timestamps; corrupt or absent file degrades to empty verdicts without throwing (fail-open to heuristic, never a crash)
- same test: toolCapable with a verdicts map overrides the heuristic both ways — a heuristic-false coder model recorded 'structured' becomes true, a heuristic-true instruct model recorded 'text-embedded' becomes false; with no store all existing test/router-capabilities.mjs assertions stay green (regression)
- live probe leg env-gated (OLLAMA_LIVE=1 or JARVIS_API_KEY) writing a real verdict row; npm test green offline

## Phase 2 — de-Ollama the flagship surface and win the stranger's first hour

The single largest portability violation — `cto-brain code` exit-1s without Ollama — needs ~2 focused days across code.mjs plus opencode-setup.mjs, which is why it ranked 4th by payoff-per-effort despite highest absolute payoff; it leads this phase and consumes the Phase-1 conformance ledger (picker shows probed vs heuristic). Around it: honest leave-behinds (router seed), environment-aware doctor, archetype quickstart docs with a CI template, and MCP parity for the SDD verbs. All remain pure-testable on this box; they are next-round bets only because of size and the shared bin/cto-brain.mjs + cli wiring they integrate.

### `code-any-provider` — days / payoff high

Merged (lens-1 code-any-provider + lens-3 code-roster-any-provider + generic-openai-backend-launch): make `cto-brain code` — the head-to-head surface vs aider/opencode — first-class on ANY box. Verified today: listLocalChatModels() hits OLLAMA_HOST/api/tags and the command dies with an Ollama-only hint otherwise; opencode/codex/aider wiring hardcodes the ollama provider.

Done-bar (TDD):
- new test/code-roster.mjs: buildRoster over fake probe fixtures (ollama-only, vllm-only, mixed, jarvis-only, empty) returns correctly namespaced entries; the ollama-only fixture reproduces today's picks byte-for-byte (regression)
- backend arg-builder pure functions produce documented argv/env/config for ollama vs generic-openai descriptors (string-array equality); no API key material ever appears in emitted config — test injects a fake key into env and asserts absence in output
- degrade-report builder pure-tested: empty roster + cloud key yields a message naming the key and path; empty roster + empty env yields per-target probed-and-failed lines; the message never mentions only Ollama
- parseCodeArgs behavior locked: --model, --task, --backend, -- passthrough unchanged; explicit --model vllm/foo resolves with a fake-fetch probe counter at 0; npm test green offline with no Ollama running

### `router-seed-from-probe` — hours / payoff medium

Fix the foreign-repo leave-behind: `router init` writes GB10-flavored model ids (qwen2.5-coder:14b, llama3.1) into any repo on any machine. Seed router.json from what the box actually has.

Done-bar (TDD):
- new test/router-seed.mjs: four fixtures — ollama box, vllm-only box, cloud-key-only env, bare runner — each produces a config where every local model id is set-included in the corresponding probed roster (no phantom models)
- output deterministic for identical inputs (deep-equal across two calls) and accepted by mergeRouterConfig without loss
- cloud-key-only fixture: cloud chain first, no local providers enabled; bare-runner fixture parses with an honest no-runtime note
- pure function touches no fs (takes and returns plain objects); existing router init behavior unchanged

### `doctor-environment-profile` — hours / payoff medium

Environment-aware diagnosis: doctor assumes the GB10 shape and implies breakage on boxes without models. A CI runner or keys-only laptop must get an honest capability report, not adapter warnings.

Done-bar (TDD):
- new test/doctor-profile.mjs: profileEnvironment pure-tested — (no probes, ANTHROPIC_API_KEY set) -> cloud-keys-only with router-usable verdict; (nothing) -> no-model-runtime with always-on surfaces listed and healthy:true non-strict
- archetype-specific next-step string asserted for all four archetypes
- existing test/cli-init.mjs and full-stack doctor behavior unchanged
- npm test green on a box with no models and no keys (which is what CI is)

### `getting-started-archetypes-doc` — hours / payoff high

Docs-as-product (merged with lens-3 ci-foreign-repo-recipe): the README quick start assumes the author's box. Ship one test-verified getting-started page with a complete path per environment archetype, plus a template CI workflow proving the modelless environment is first-class.

Done-bar (TDD):
- test/e2e-usage.mjs extended: every cto-brain command block grepped from GETTING-STARTED.md executes (or dry-run-parses for live-only ones) in a temp HOME and exits 0 — a doc/code drift test
- cloud-keys-only path proven: with a fake ANTHROPIC_API_KEY, router select --task reviewer-tech returns the anthropic provider
- CI path proven: gate check + spec check + eval all exit 0 in an empty temp project; template workflow lints as valid YAML in a unit test
- gate check --home . still clean (no secrets in the new doc)

### `mcp-spec-telemetry-tools` — hours / payoff medium

Close the MCP-lags-CLI gap: an MCP-connected agent cannot drive the 0.11.0 headline SDD loop (spec init/check) or read cost-per-outcome telemetry. Verified: src/mcp/tools.mjs serves 9 tools, none spec- or telemetry-shaped, while scaffoldChange/checkSpecs/summarize are importable pure functions.

Done-bar (TDD):
- test/mcp-server.mjs: tools/list includes spec_init, spec_check, telemetry_summary with schemas
- test/mcp-e2e.mjs: spec_init in a temp dir creates proposal.md+tasks.md; spec_check on a proposal missing a section returns ok:false naming the section; telemetry_summary returns the summary shape against a fixture runs.jsonl
- test/a2a.mjs: agent card skill count derived from registry size, not hardcoded
- npm test green offline

## Phase 3 — make the learning loop enforce, not just record (GPU-free, next rounds)

With outcome telemetry live (Phase 1) and MCP/docs parity landed, convert every remaining measurement into a gate: trigger-eval learns to reject regressions with honest UNPROVEN verdicts, fixture coverage becomes a CI invariant, skill promotion becomes an enforced eval-gated path, the growth ledger becomes readable, the spec lifecycle gets its missing freeze/archive verbs, and the finetuning proposal's GPU-free legs (dataset builder, adapter reject-gate) land so the eventual live run is a thin already-gated step. All pure-testable on this box; sequenced after Phase 2 because promote/trigger gates share fixtures and cli wiring with the Phase-2 landings.

### `trigger-eval-regression-gate` — days / payoff high

Trigger-eval always exits 0 — a measurement, not a gate. The brain's #1 known failure mode (skill-firing precedence) can silently regress. Add persisted per-model baselines and a pure comparison module so a live run can REJECT a regression, with honest UNPROVEN when no model is reachable.

Done-bar (TDD):
- test/trigger-gate.mjs (pure): lower rate -> regressed with newMisses listed; equal -> held; higher -> improved; empty/absent run -> unproven; malformed baseline JSON -> unproven, never a throw
- baseline round-trips byte-stable; baseline for model A never gates a run of model B (per-model, matching the per-model-family research verdict)
- --gate against a closed-port OLLAMA_URL exits 0 printing UNPROVEN (spawn-asserted)
- npm test green offline; live leg stays env-gated

### `trigger-fixture-full-coverage` — hours / payoff medium

Fixtures cover 3 of 9 bundled skills, so the trigger gate is blind to two-thirds of the catalog. Coverage becomes a CI-enforced invariant: a 10th skill without fixtures fails the suite.

Done-bar (TDD):
- test/trigger-fixtures.mjs: every skill in package.json agentskills appears with >=2 positive queries and >=1 near-miss; fails red for a missing skill (proven red-first before fixture expansion)
- every fixtures.descriptions[skill] equals the SKILL.md frontmatter description (drift-is-a-bug)
- >=3 'none' negatives retained so over-firing stays measured
- npm test green; one live trigger-eval run recorded in STATUS.md with the new count, honest UNPROVEN if the box model is down

### `skill-promote-gate` — days / payoff high

skill synth ends at a draft with a manual checklist (verified: bin/cto-brain.mjs line 461 says promote manually). Eval-gated promotion makes growth unable to regress the brain: the gate, not the human's memory, enforces the bar. Auto-promotion stays structurally impossible per the refuted uncurated-self-written-skills claim.

Done-bar (TDD):
- test/synth-promote.mjs: lint-clean human-edited draft with fixtures and --yes promotes and moves the directory
- five distinct red cases refused independently with named reasons: untouched placeholder, missing fixtures, lint error, embedded sk- secret, missing --yes
- promote never writes outside the target root and never deletes the draft on refusal
- e2e synth -> edit -> promote flow exercised in the test; npm test green

### `growth-ledger-report` — hours / payoff medium

The growth ledger is write-only — no code reads it back, so 'is this thing actually learning?' is unanswerable from the tool. Make the loop observable and join it with the Phase-1 outcome telemetry.

Done-bar (TDD):
- test/growth-report.mjs: synthetic 8-row ledger (5 real, 3 no-op) yields correct counts and no plateau; 6 consecutive no-ops -> plateau:true
- malformed/legacy rows skipped without throwing; empty ledger -> honest zeros with proven:false, never fabricated stats
- outcome rows in a temp telemetry home appear joined in the report
- --json output byte-stable for CI; npm test green

### `spec-freeze-archive-verbs` — hours / payoff medium

The spec-driven skill teaches propose -> freeze -> implement -> verify -> archive, but tooling stops at init/check (verified: src/spec/contract.mjs exports only scaffoldChange/checkSpecs). Add freeze and archive so the lifecycle is tool-enforced.

Done-bar (TDD):
- test/spec-lifecycle.mjs: freeze stamps a check-clean proposal; refuses on missing section and on empty Frozen-contracts; archive refuses with unchecked tasks, succeeds when all checked, refuses re-archive (no clobber)
- existing test/spec-contracts.mjs untouched and green
- dogfood: per-user-finetuning frozen via the new verb in the same round

### `finetune-dataset-and-adapter-gate` — days / payoff high

Merged GPU-free legs of the per-user-finetuning proposal (proposed by all three lenses): freeze the spec and build everything that runs WITHOUT a GPU — sovereignty-gated dataset builder and the reject-if-worse adapter gate — so the eventual GB10 training run is a thin, already-gated step. Own-repo efficacy stays honestly UNPROVEN (F7) until measured.

Done-bar (TDD):
- test/tune-dataset.mjs: builder over a synthetic brain tree emits byte-identical JSONL on re-run; a planted sk- secret causes line refusal with a recorded reason, not a silent drop; gate check clean over the output
- test/tune-adapter-gate.mjs: stub backend with a worse-than-base scorecard -> reject, manifest marked rejected, router probe excludes it; better-or-equal -> accept and probe lists the variant; corrupt manifest -> rejected
- spec check green on the frozen proposal; tasks.md red-first checklist mirrors the tests
- npm test green with no GPU and no network (training is the stub; live run is Phase 4)

## Phase 4 — live-gated big bets on the GB10 (honest experiments, not rollouts)

Everything here needs the live box (GB10, llama-swap, real models) or multi-day live runs, and each carries an explicit go/no-go gate anchored to the research's DO-NOT-ADOPT list: no agentic RL of coders (64-H100-class, F8), no dense-70B interactive serving (273 GB/s cap, F5 — MoE roster only), no uncurated self-written skill loops (refuted). Each bet consumes Phase 1-3 machinery: the conformance ledger grows into a matrix, the promote gate anchors the curation pilot, the adapter reject-gate is the LoRA experiment's safety net.

### `llamaswap-gb10-config-rollout` — days / payoff high

Merged (lens-1 config generator + lens-3 rollout): adopt llama-swap as the standing GB10 gateway per F1, with cto-brain as the policy brain on top — config generated from the router's probed roster and telemetry-derived TTLs, MoE-first roster, dense >=70B removed from interactive chains.

Done-bar (TDD):
- pure test: YAML generation from fixture roster+telemetry produces expected entries including per-family parser flags; generated config never invents models absent from the probed roster
- GATE: live leg requires llama-swap installed on the GB10; generated config accepted and /v1/models serves the roster
- router select for dispatch-builder on the GB10 resolves to a llama-swap MoE model with a structured conformance verdict; measured interactive decode >= 20 tok/s on the default coder, recorded and dated; dense-70B absent from interactive chains

### `live-conformance-matrix` — weeks / payoff high

Merged (lens-1 conformance-matrix-streaming + lens-3 live-conformance-matrix): grow the Phase-1 single-shot probe into the per-model×provider suite the research sized at 1-2 weeks — parallel calls, malformed parameters, and Ollama's interleaved thinking/content/tool_calls stream reassembly (F3's documented agent-killer) — feeding selection.

Done-bar (TDD):
- stream-reassembly classifier pure-tested against recorded ND-JSON fixtures of interleaved chunks (including the Qwen-Agent-style lost-thinking case)
- matrix assembly + select filtering fully covered offline with fixture verdict stores
- GATE: live matrix run on the GB10 across the current roster completes with one verdict vector per chat model, recorded with cost-per-outcome
- MCP router_probe response schema includes verdicts, tested offline with a seeded store

### `code-backend-bakeoff-harness` — weeks / payoff medium

Proposed by all three lenses — the research's #1 open question: which backend (opencode/codex/aider) actually completes agentic tasks best against local models. Answer it with generated evidence so `code`'s default backend is measured, not vibes.

Done-bar (TDD):
- battery runner + scoring pure-tested with fixture transcripts, including the false-verified-claim case
- GATE: live run env-gated (never CI) on the GB10 covering >=2 backends × >=2 models with a dated JSON+markdown scorecard committed
- picker reads measured pairings from the ledger (unit test with a synthetic ledger); `code` default-backend choice documented with a pointer to the measured result
- no public benchmark claim until 2+ runs reproduce

### `unsloth-lora-live-experiment` — weeks / payoff medium

The bounded own-repo QLoRA experiment the frozen spec demands: feasibility proven (F7), efficacy NOT — an experiment with a pre-registered kill criterion, never a rollout. Phase-3's adapter reject-gate is the safety net.

Done-bar (TDD):
- GATE: dataset builder + adapter gate landed with pure tests BEFORE any training; one adapter trains end-to-end on the GB10 with telemetry rows proving cost (env-gated, suite green without it)
- reject gate demonstrably fires on a deliberately-undertrained adapter (gate tested against reality, not just the stub)
- held-out own-repo slice scored adapter-vs-base with the verdict published honestly even if null — UNPROVEN stays UNPROVEN until measured
- kill criterion pre-registered in the spec: no measurable gain after 2 bounded runs -> leg parked, skill-file leg remains primary

### `skill-curation-verifier-pilot` — weeks / payoff high

Double down on the strongest-evidenced leg (F6, ~+5.7pp non-RL share): a verifier-scored skill-curation loop where candidate skill edits are scored by the trigger-eval regression gate before a human sees them — human curation retained, since fully-automated self-written skill loops were refuted.

Done-bar (TDD):
- harness logic pure-tested with mocked model output (ranking, gate integration, draft-only writes)
- GATE: trigger-eval score deltas reproducible across 2 runs before the pilot starts; live pilot shows >=1 candidate improving trigger accuracy on a deliberately-weakened fixture description vs the committed baseline
- invariant test: nothing reaches skills/ without the promote gate + --yes (auto-promotion structurally impossible); a deliberately-bad edit demonstrably rejected by the verifier score
- pilot verdict doc: measured delta vs the F6 expectation, honest if below

## Operator-charge changes (proposals, not yet frozen)

- `specs/changes/searxng-research-seam/` — the internal SearXNG engine as cto-brain's standing research surface (live-verified on this box).
- `specs/changes/distributed-substrate/` — many sovereign boxes, one capability-weighted roster; offline mode that degrades honestly; the surpass-by-composition claim gets a measured tokens-per-outcome benchmark, or it doesn't get made.
- `specs/changes/per-user-finetuning/` — per-user LoRA adapters, freeze-gated on the controlled experiment (see research F7).
