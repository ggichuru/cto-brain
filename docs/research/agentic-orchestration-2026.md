# Agentic coding & orchestration — verified research (June 2026)

> Output of an adversarial deep-research pass (6 angles, 27 sources, 126
> claims extracted → 25 three-vote-verified → 22 confirmed / 3 refuted).
> Every load-bearing claim below carries a primary source. Claims that did
> NOT survive verification are listed under "Refuted / unverified" — do not
> cite them. The core axis: **orchestrate-many-models vs one-big-agentic-model.**

## 1. Primary sources & the two camps

**Sakana Fugu (orchestrate-many-models).** Fugu is *itself a trained language
model* that decides delegation, agent-to-agent communication, and answer
combination, presenting as a single model over a swappable pool of frontier
LLMs behind one OpenAI-compatible API ([sakana.ai/fugu-release](https://sakana.ai/fugu-release/);
Fugu Technical Report [arXiv 2606.21228](https://arxiv.org/abs/2606.21228)).
Two variants: **Fugu** (balances performance/latency) and **Fugu-Ultra**
(hardest problems). *Base-tier naming is inconsistent across Sakana's own
sources — "Fugu" in the arXiv report vs "Fugu Mini" on the release page.*

Two **distinct** research artifacts back it — the original framing conflated
them:
- **Conductor** — ~7B (Qwen2.5-7B base; 3B variant too), **RL-trained (GRPO)**;
  learns to design agent-comms topologies *and* prompt-engineer per-worker
  instructions; swappability from training on randomized agent pools
  ([arXiv 2512.04388](https://arxiv.org/abs/2512.04388), ICLR 2026).
- **TRINITY** — ~0.6B compact LM + tiny routing head (<20K params), trained by
  **evolutionary strategy (separable CMA-ES), NOT RL**; assigns one of three
  roles — **Thinker / Worker / Verifier** — to a selected LLM
  ([arXiv 2512.04695](https://arxiv.org/abs/2512.04695), ICLR 2026;
  [sakana.ai/trinity](https://sakana.ai/trinity/)).

**Anthropic Fable 5 / Mythos 5 (one-big-agentic-model).** Single Mythos-class
*models* (not orchestrators): long-horizon autonomous work, sub-agent
delegation *inside a single-model harness*, in-model self-verification
([platform.claude.com docs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5);
[anthropic.com/news](https://www.anthropic.com/news/claude-fable-5-mythos-5)).
Mythos-class sits above the Opus class; Mythos 5 is "the same underlying model
as Fable 5, but with the safeguards lifted." **GA June 9 2026** (Fable 5 on
Claude API, AWS, Bedrock, Vertex AI, Microsoft Foundry; Mythos 5 limited via
**Project Glasswing**, US-gov collaboration).

**Export-control event.** On **June 12 2026** a US Dept of Commerce directive
led Anthropic to **suspend both Fable 5 and Mythos 5 worldwide**
([anthropic.com/news/fable-mythos-access](https://www.anthropic.com/news/fable-mythos-access);
CSIS, Nextgov). This demonstrated single-vendor/single-model risk is itself
the structural argument for swappable-pool orchestration and provider-agnostic
routing.

## 2. Academic / industry foundations (all primary, time-insensitive)

- **ReAct** — interleave reasoning traces + actions; traces induce/track/update
  plans and handle exceptions, actions interface with external sources
  ([arXiv 2210.03629](https://arxiv.org/abs/2210.03629), ICLR 2023).
- **Hierarchical RL lineage** for planner/worker/verifier: **FeUdal Networks**
  (Manager sets abstract goals at coarse time-scale; Worker emits primitive
  actions — [arXiv 1703.01161](https://arxiv.org/pdf/1703.01161)); **MAXQ**
  value-function decomposition, positioning Options (fixed sub-policy), HAM
  (partial policy / FSM), MAXQ (termination predicate + local reward)
  ([Dietterich, arXiv cs/9905014](https://arxiv.org/pdf/cs/9905014)).
- **Workflow taxonomy** — a 2024 survey decomposes LLM agentic workflows into
  policy-only / search / feedback-learning, with reusable components
  (policy/actor-planner, evaluator, dynamic/world model, verbalizer)
  ([arXiv 2406.05804](https://arxiv.org/html/2406.05804v1); single-author;
  the verbalizer is task-dependent).
- Practitioner guidance: start simple, add agents only when justified; use
  orchestrator-worker + evaluator-optimizer for complex/critique tasks
  ([Anthropic — building effective agents](https://www.anthropic.com/engineering/building-effective-agents),
  [multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)).

## 3 & 4. Architectures + head-to-head

| Axis | Fugu (orchestrate-many) | Fable/Mythos (one-big-model) |
|---|---|---|
| Mechanism | Conductor/TRINITY route a swappable LLM pool | single model plans + self-verifies in-harness |
| Vendor/export risk | low — swap providers for compliance | high — June 12 suspension took both offline |
| Verifiability | explicit role/topology decisions | in-model, less inspectable |
| Latency | reported ~30 min on hard problems (unverified number) | single-model latency |
| Swappability | core design property | none (one vendor) |
| Where it wins | compliance, cost control, no single-vendor lock | simplicity, coherence, fewest moving parts |

## 5. Best-practice template & cto-brain mapping

Planner/worker/verifier remains the durable decomposition both camps
operationalize. For a team building an orchestration layer: start single-agent;
add a router/orchestrator only when cost, compliance, or capability demands it;
keep provider choice swappable; make routing decisions inspectable; verify
independently of the executor. **cto-brain** is the *policy-first router +
governance layer* expression of this: deterministic task→provider routing,
honest reachability, a security gate, and round-close learning — sitting
*above* either a Fugu-style pool or a single Mythos-class model.

## Refuted / unverified — do NOT cite

- **Conductor/Fugu reaches SOTA on LiveCodeBench/GPQA** — refuted (1-2).
- **TRINITY is ~7B / RL-trained** — refuted (0-3); it is ~0.6B / CMA-ES.
- **Specific Fugu benchmark numbers** (e.g. SWE-Pro 54.2, GPQA 95.1) — no
  head-to-head SWE-bench Pro / Terminal-Bench / GAIA result survived
  verification; the quality/latency/cost tradeoff is empirically OPEN.

## Open questions

- Verified head-to-head benchmarks for Fugu vs a single Mythos-class model.
- Whether Anthropic restored Fable/Mythos access after the June 12 suspension,
  and under what scope.
- Concrete production integration of MCP / A2A / Temporal-Restate inside either
  architecture (none survived verification as primary-sourced claims here).
- Fugu's real per-request economics when fanning out across frontier providers.
