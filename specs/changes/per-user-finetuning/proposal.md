# Change: per-user-finetuning

**Status:** Proposed (2026-07-11), NOT frozen. Research landed same day —
see `docs/research/2026-07-11-local-coding-agent-stacks.md`. Verdicts that
gate the freeze: LoRA/QLoRA on the GB10 is FEASIBLE (F7: official Unsloth
DGX Spark support, ~68GB for a 120B QLoRA; setup not turnkey on
aarch64/sm_121 — Docker + source-built Blackwell deps); own-repo LoRA
improving AGENTIC coding is UNPROVEN (vendor assertion, no benchmarks) — the
controlled experiment in this change's acceptance criteria is the honest
next step, not a rollout; agentic RL (DeepSWE-class) confirmed OUT of
single-box scope (~64 H100s), keeping it in Non-goals; and skill-file
in-context learning has stronger verified evidence today (F6: +9.7pp
CODESKILL headline, ~+5.7pp for a non-RL-curated system like ours) — so
weight-level learning COMPOSES with, never replaces, the skill-file leg.
Trainer seam first backend at freeze: unsloth. Operator charge: "enable
fine tuning of the models, per user and even growing with user."

## Intent
Add the weight-level leg to the learning loop. Today cto-brain grows only
in-context (skill files, growth ledgers, feedback files — policy iteration
over prompts). Per-user LoRA adapters let the sovereign local models
themselves grow with the operator: their conventions, their repos' idioms,
their routing corrections — compounding below the context window.

## Behavior
- `cto-brain tune dataset [--dir <root>]` assembles a training set from the
  operator's own exhaust: growth-ledger rows, feedback files, archived spec
  changes, and (opt-in) accepted diffs from code-tool sessions — privacy-gated
  by the same no-secrets gate as `skill synth`; output is plain JSONL the
  operator can read line-by-line before any training run.
- `cto-brain tune run --model <base> [--adapter <name>]` drives a LoRA
  fine-tune of a local base model on that dataset via a pluggable trainer
  seam (candidate backends per research: unsloth / LLaMA-Factory / axolotl;
  chosen at freeze time), producing a per-user adapter under
  `~/.cto-brain/adapters/<user>/<name>/`.
- Adapters register with the router: `router probe` reports models WITH
  available user adapters; `code`/`router select` prefer the user-adapted
  variant of a base model when present (Ollama modelfile or vLLM
  `--lora-modules` — mechanism fixed at freeze).
- Evaluation is mandatory, not optional: every `tune run` ends with the
  trigger-eval + a held-out slice; an adapter that scores below its base
  model is REJECTED and reported honestly (never silently loaded).

## Acceptance criteria
- Dataset builder: pure function, unit-tested, gate-clean (no secrets in
  JSONL); deterministic given the same memory tree.
- A LoRA adapter trains end-to-end on the DGX Spark (GB10, 128GB unified)
  against a qwen2.5-coder-class base; wall-clock and tokens recorded in
  telemetry (cost-per-outcome).
- Router surfaces the adapter; `cto-brain code` can launch on the adapted
  model; eval gate demonstrably rejects a worse-than-base adapter.
- All of it green in `npm test` without a GPU present (training itself is an
  opt-in live test, like the jarvis-gated bridge tests).

## Non-goals
- No cloud fine-tuning APIs (sovereignty by design — training data never
  leaves the box without explicit export).
- No full-parameter fine-tunes, no RLHF/GRPO loop in this change (research
  first; RL lands as its own change if the evidence supports it).
- No automatic training on a schedule until the eval gate has a track
  record — growing with the user must never mean silently drifting.

## Frozen contracts
(To be locked at freeze, after the research report lands:)
- Trainer seam: `src/tune/trainer.mjs` interface `{prepare, train, evaluate}`
  with one real backend + a stub, mirroring the provider-abstraction pattern.
- Dataset shape: JSONL `{messages: [...], source: <ledger|feedback|spec|diff>,
  ts}` — the same shape `skill synth` reads, so the two legs share exhaust.
- Adapter layout: `~/.cto-brain/adapters/<user>/<name>/{adapter.safetensors,
  MANIFEST.json}` with base-model id + eval scores pinned in the manifest.
