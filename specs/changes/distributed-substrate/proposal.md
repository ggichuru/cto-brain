# Change: distributed-substrate

**Status:** Proposed (2026-07-11), NOT frozen — operator charge: "can run on a
distributed compute substrate and smartly orchestrate... fully offline or
sovereign stack; do what Fable/Opus/GLM-5.2-class models do but better with
cheaper resources — by smart composition, not muscle."

## Intent
Let one brain route across MANY boxes (GB10 + Mac + servers + edge) as a
single sovereign substrate: the router already speaks to remote providers
(jarvis preset proves the shape) — generalize so any number of peer stacks
(each running llama-swap/vLLM/Ollama, discovered over Tailscale/LAN) form
one capability-weighted roster with data-locality rules, and the whole thing
keeps working fully offline (no cloud fallback required, degrade-honestly).

## Behavior
Router config gains a `peers` list ({id, baseUrl, tier:"sovereign", locality
tags}); probe/plan aggregate across peers; select scores by capability +
conformance verdicts (see tool-conformance-ledger) + locality (covenant data
never leaves named boxes) + measured latency; `stack status` renders the
fleet. Dispatch composition: cto-orchestration briefs can pin a lane to a
peer ("reviewer on the 120B MoE box, builders on locals"). Offline mode:
`--prefer sovereign` refuses cloud tiers entirely and reports what quality
degrades, honestly, instead of failing.

## Acceptance criteria
- Pure tests: peer-aggregated plan/select with mocked probes; locality rule
  blocks a covenant-tagged task from non-allowed peers; offline mode never
  yields a cloud provider and says what it gave up.
- Live leg env-gated: two real endpoints (local Ollama + jarvis bridge)
  aggregated into one plan on this box.
- Honest-benchmark doc: a composed-pipeline task (spec->build->review across
  two peers) measured on tokens-per-outcome vs a single-model run — the
  "surpass by composition" claim gets a number, not a vibe.

## Non-goals
- No scheduler/queue daemon, no k8s; the router stays a policy library + CLI.
- No claim of frontier parity without the benchmark above (truth over
  impressiveness — the claim is made by the measurement or not at all).
- No new runtime dependencies.

## Frozen contracts
(At freeze:) peers config schema; locality tag names; offline-mode semantics.

## Review — 2026-09-11 (60 days open)

**Recommendation: FREEZE, but only Phase 1.** The premise has strengthened since it was
written: the operator now runs more than one capable box, so "one brain, many peers" is a
real situation rather than an anticipated one, and the jarvis preset already proves the
remote-provider shape. The risk is scope — peers + capability scoring + conformance
weighting + locality rules + dispatch pinning + offline mode is not one change.

Phase 1 worth freezing now: a `peers` list in router config, probe/plan aggregation across
peers, and locality tags enforced at selection. Defer capability-weighted scoring and
cto-orchestration lane pinning to a follow-on; they depend on measurements that do not
exist yet.

One thing this change must inherit from the 0.12.0 round: peer selection MUST carry
`modelSource`. Routing across a fleet multiplies the "nobody chose this model" failure —
the 0.12.0 defect picked an arbitrary model from one host's list; a fleet would pick an
arbitrary model from an arbitrary host.

**Verdict: UNSET — awaiting operator freeze/reject.**
