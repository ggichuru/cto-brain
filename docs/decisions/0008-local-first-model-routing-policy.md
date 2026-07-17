# ADR 0008 — Local-first, policy-aware model routing

**Status:** Accepted (2026-07-17).

## Context

The charter wants route selection with hard filters (availability, health,
credentials, tool support, context, modality, sovereignty, budget) and a soft
score (quality, latency, reliability, cost, host load, recent probe performance),
returning a structured, inspectable route explanation, with a local-first default
and credential/policy/classification/budget-gated cloud lanes.

Control-plane map findings:
- **Lane A** (`select.mjs::selectRoute`) is hard-filter + first-match only; model =
  `probed.models[0]` (naive); imports `providers.mjs` only; returns a single
  `reason` string.
- **Lane B** (`capabilities.mjs`) does name-heuristic capability tagging; consumed
  only by the terminal launcher; `select.mjs` never imports it.
- **Lane C** (`conformance.mjs`) is a full empirical tool-call probe + verdict
  ledger — unit-tested but **zero callers**. `toolCapable` already accepts a
  `verdicts` override that is never populated.
- `PROVIDER_PRESETS` has local + OpenAI/Anthropic/Fugu but **no OpenRouter,
  Moonshot, or Together**.
- Model capabilities are inferred from **names**, not measured.

So this is mostly a **convergence + wiring** task, not greenfield.

## Decision

**Unify the three lanes into one policy-aware router with local-first default and a
typed, inspectable route decision.**

- **Typed model catalog** (per charter): providerId, modelId, canonicalId,
  endpoint, locality(local|lan|cloud), contextCapacity, toolCall, structuredOutput,
  reasoning, vision, quant, expectedLatency, observedThroughput, sovereignty, cost,
  health, lastProbe, digest. **Capabilities come from empirical probes + a declared
  catalog — never name-inference alone.** Wire Lane C (`conformance.mjs`) as the
  tool-call/structured-output signal, cached by model digest + endpoint + runtime
  version.
- **Hard filters:** provider available, model healthy, credentials present, tool
  support when tools are required, context capacity, modality, **sovereignty
  policy**, budget. A `localOnly` policy **blocks private-repo content from
  reaching any cloud provider**.
- **Soft score:** task quality, latency, reliability, cost, current host load,
  recent probe performance.
- **Route decision** (returned + inspectable):

  ```json
  { "selected":"ollama/qwen...", "taskClass":"interactive-code",
    "reasons":[], "rejected":[], "policy":{"localOnly":true,"maxCostUsd":0} }
  ```

- **Default posture is local-first.** Cloud use requires **all** of: available
  credentials, policy permission, task suitability, data-classification approval,
  and cost budget. Add OpenRouter / Moonshot / Together presets (credential-gated)
  to close the "all-model" gap, keeping local as default, not fallback.
- Empirical probes to add and cache: basic chat, tool calling, tool-result
  continuation, JSON-schema output, context handling, edit quality, time-to-first-
  token, throughput, cancellation, failure recovery.

## Consequences

**Good:** one router the whole system shares (terminal + MCP + CI); model choice
becomes capability- and evidence-driven, not name-guessed; the user can see *why* a
model was chosen and what was rejected; sovereignty becomes an enforced hard filter
(private code never silently egresses); the dormant conformance ledger finally
earns its keep.

**Bad / accepted risk:** probing has cost/latency — mitigated by digest-keyed
caching; a soft-score router can surprise users — mitigated by the inspectable
`rejected[]`/`reasons[]`; adding cloud presets widens credential surface — mitigated
by deny-cloud-without-credential + classification gate.

**Rejected alternative:** *keep the two lanes separate and just add scoring to Lane
A.* Rejected — the terminal would still route by name-heuristics while the router
scores, so the same task could pick different models depending on entry point;
convergence is the point.
