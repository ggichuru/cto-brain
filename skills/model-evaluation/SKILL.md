---
name: model-evaluation
description: >
  The weigh-master — honest model evaluation on one scale. Fires on benchmarking,
  evals, "how good is this model", "how does my fine-tune compare", lm-eval /
  LightEval / MMLU / HumanEval / GSM8K / IFEval, domain golden sets, LLM-as-judge /
  arena / Elo, Langfuse online eval / drift, adapter-vs-base deltas, quantization
  comparability, and any bench chart that must be honest not decorative. Fires
  whenever uwezo bench / eval / arena is involved, or a capability (not just speed)
  number is claimed. Composes with model-foundry (the eval gate), shamba (verifiers),
  agent-gardener (drift → retune), and uwezo's bench pipeline.
metadata:
  type: reference
  version: 0.1.0
  last_updated: 2026-07-16
---

# model-evaluation — the weigh-master

**Version 0.1.0 — 2026-07-16.** Grounded in current practice: lm-eval-harness v0.4.x
(200+ tasks, YAML-config, HF/vLLM/API backends — the Open LLM Leaderboard's backend),
LightEval, the local-leaderboard pattern, 200–500-example domain golden sets per PR,
and Langfuse-class online eval as a separate problem from offline benchmarks.

## Posture
uwezo already measures speed truthfully (real tokens/sec + TTFT from Ollama's
eval_count/eval_duration, persisted to `foundry/data/benchmarks.jsonl`). Speed
without capability is half a scale. Weigh every model — tuned adapters, untouched
bases, market/frontier — on the SAME scale, and never present two numbers as
comparable when the conditions differ.

**Two laws.** (1) **A number without its conditions is not a benchmark; it's a
rumor** — every score carries harness+version, task+version, n-shot, prompt
template, quant, sampling params, seed(s), date. (2) **Verify the artifact, not
just the function** — the uwezo lesson: a write silently failed because `fs` wasn't
imported and a try/catch ate the throw; tests passed, file was empty. Every bench
run's final step ASSERTS the recorded row exists and parses. A benchmark that
didn't persist didn't happen.

## The three planes
- **P1 — Performance (uwezo today):** tokens/sec, TTFT, peak memory, per-quant.
  Extend: TTFT at 1k/8k/32k prompt (edge/RAN live or die on long-context TTFT).
- **P2 — Capability (the new plane), two layers never conflated:**
  - **(a) Class benchmarks** — MMLU-Pro, GSM8K/MATH, HumanEval/MBPP, IFEval, one
    long-context task. Run them yourself via **lm-eval** (reproduces published
    numbers, 200+ tasks, YAML runs). Serve every contestant through ONE OpenAI-
    compatible seam (Ollama `/v1`, vLLM, or a litellm proxy for frontier) so one
    harness/prompt/scorer covers local + market.
  - **(b) Domain golden sets** — the ones that pay rent: ~200–500 hand-graded
    examples from real production, versioned, run every PR (RAN log-triage, Hazina
    doctrine, KiMfuko SMS exact-match, Mawimbi tutor). `lm_eval --include_path`
    mounts them as custom tasks alongside class tasks.
- **P3 — Production (online eval, a different class):** self-hosted **Langfuse** on
  our hardware (sovereign rule 3 — sensitive-domain traces never leave). Tag model+
  adapter version on every trace; capture cost/latency/edits/thumbs as scores. The
  flywheel: interesting traces → Langfuse datasets → experiments re-running new
  versions → release-over-release scores. Drift alarm: weekly golden-set score on
  live samples; a drop without a deploy = input drift → agent-gardener L4 retune.

## Comparability rules (the heart)
- **Representability comes BEFORE any tuning — check the model can SEE the graded
  quantity.** For each preprocessing step, write down what transformation it makes the
  output invariant to; if the *label* depends on exactly that transformation, the ceiling
  is set by preprocessing and every training experiment beneath it is wasted. WG3
  2026-08-04: a per-record min–max normaliser is exactly scale-invariant (a 10^6x-scaled
  capture gives bit-identical output) while occupancy IS power relative to a floor — so
  fixB, fixC and a fresh retrain all tied at **40/80**. **Independent interventions landing
  on an identical score is the signature of a ceiling, not of bad luck** — go find the
  ceiling instead of averaging them. Cheap proof: push x and k·x through preprocessing and
  diff the tensors. ([[feedback_preprocessing_cannot_represent_the_target]])
- **A detection metric on a set with no negative class is UNREPORTABLE, not weak.** Print
  class balance beside every detection figure and refuse to emit an accuracy when a class
  is absent — an all-occupied set scores 80/80 for a detector that answers OCCUPIED
  unconditionally. Growing an all-positive set buys nothing; the missing asset is the
  negative captures. Until they exist it is a **release gate** (may not regress), never a
  score. And a caveat next to the headline does not neutralise it — **strike the number**
  ([[feedback_caveat_is_not_a_correction]], [[feedback_selection_inherits_the_leak]]).
- **Quant is part of the model's identity.** Local Q4_K_M ≠ the leaderboard's bf16
  "same" model. Every row is `model @ quant`; cross-quant bars never render as
  equals. If the market comparison matters, bench the bf16 once (cloud/Spark), show both.
- **The only fair fine-tune delta is adapter-vs-its-own-base**, same quant, template,
  harness run. Tuned-Q4-4B vs published-bf16-frontier is marketing, not measurement.
- **Published = T3, locally reproduced = T1.** `peers.mjs` entries carry
  `{source_url, date, quant, harness, verified_locally}` and render visually distinct
  (ghost/hatched bars, "published — not locally verified"). Pullable peer → reproduce
  → promote to T1.
- **Chat-template mismatch silently destroys scores** — use each model's own template.
- **Contamination humility** — suspiciously high class scores on a small model are a
  flag, not a win. Private golden sets are the contamination-proof layer and outrank
  class scores in promotion.
- **Statistics or silence** — report stderr; ≥3 seeds for generation; a delta inside
  the noise band is "no measurable difference." No exceptions for models we like.

## Fuzzy tasks — the local arena
Pairwise LLM-as-judge, **position-swapped** (A-vs-B and B-vs-A; a verdict that flips
with position is discarded), rubric-anchored, judge pinned + versioned. Aggregate
into a Bradley–Terry/Elo ladder (uwezo /bench ranked-bars applied to quality).
Calibrate the judge once vs ≥100 human pairs; log agreement in `evals/JUDGE_CARD.md`.
A judge below ~80% human-agreement gates nothing.

## uwezo integration (extend, don't build beside)
- **Schema** — one row per (model, quant, task, run) in `benchmarks.jsonl`:
  `{ts, model, quant, adapter, plane, harness, harness_ver, task, task_ver, n_shot,
  seeds, score, stderr, tps, ttft_ms, ctx_len, source, verified_locally}`. P1+P2
  share the file; `/bench` gains a plane toggle.
- `uwezo bench --compare` stays P1. Add `uwezo eval` (wrap `lm_eval` against the
  Ollama `/v1` seam, same jsonl, **assert the row persisted before exit 0**).
- `uwezo arena` — pairwise judge for fuzzy golden sets, Elo into the same file.
- **Dashboard** — per model: speed bars (P1), class placement with ghost peer bars
  (P2a), golden-set trend across adapter versions (P2b), Langfuse deep-link (P3).
  Branded ★ models show their base as a paired shadow bar (fine-tune delta at a glance).
- **CI hook** — golden sets every foundry PR; promotion (model-foundry gate) requires
  golden-set delta ≥ 0 within noise + forgetting check (class regression ≤ 2–3 pts) + ledger row.

## Which tool where (don't blur)
| Question | Tool |
|---|---|
| How fast on my hardware? | uwezo P1 (Ollama timings) |
| Where vs the market class? | lm-eval class tasks, self-run, peers as T3 ghosts |
| Did my fine-tune help? | adapter-vs-base golden set + class delta, same run |
| Good at our jobs? | domain golden sets (200–500, versioned, per-PR) |
| Holding up in production? | Langfuse traces, scores, drift line |
| Which of two is better at fuzzy work? | local arena (pairwise judge, Elo) |
| A 50M classifier on a toy task? | skip the harness — a 200-line accuracy script |

## What to refuse
Charting cross-quant/cross-harness numbers as directly comparable; a peers entry
without provenance; a delta smaller than its stderr; golden sets graded by vibes;
bench code whose final assertion isn't "the recorded artifact exists and parses";
sending sensitive-domain production traces to any non-self-hosted observability cloud.

## Close
Ledger row; one Kaizen to the scales themselves (a new golden-set row from this
week's episodes, a peer promoted T3→T1, one judge-calibration pair); give thanks.
Honest scales are a form of faithfulness — uneven weights are an old, named wrong.
