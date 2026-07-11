# Research: fully open-source local coding-agent stacks (2025–2026)
**Date:** 2026-07-11 · **Method:** deep-research harness — 5 search angles, 23 sources fetched, 114 claims extracted, 25 adversarially verified (3-vote), 20 confirmed / 5 killed, synthesized to 9 findings. 105 agents, 0 errors.
**Purpose:** ground the cto-brain roadmap — router/gateway, code-tool backends, model roster for the DGX Spark GB10, and the freeze decision for `specs/changes/per-user-finetuning/`.

## Question

State of the art (2025–2026) for FULLY OPEN-SOURCE, locally-run coding-agent stacks, to guide the cto-brain roadmap (a portable orchestration brain that routes tasks to local models — Ollama/vLLM on an NVIDIA DGX Spark GB10, 128GB unified — behind provider-agnostic seams). Cover, with citations: (1) model routers/gateways (LiteLLM, OpenRouter-style self-hosted, llama-swap, custom OpenAI-compatible bridges) and capability-based model selection; (2) open-source coding agents/TUIs (opencode, aider, codex CLI with custom providers, Cline/continue.dev, OpenHands) — which work BEST against local models and why, tool-calling reliability per backend; (3) which open coding models (Qwen2.5-coder, DeepSeek-V3/R1 distills, Llama, Gemma, GLM, Qwen3-coder) actually deliver agentic coding on 128GB-unified-memory hardware; (4) agent memory/history systems (MemGPT/Letta, mem0, file-based memory like Claude Code) that work with local models; (5) LoRA fine-tuning of coding models on own-repo data — tooling (unsloth, axolotl, LLaMA-Factory), evidence it helps agentic coding, feasibility on GB10 hardware; (6) RL for agents (GRPO, agentic RL like SWE-RL, RLVR, verifier-driven loops) — what's actually reproducible open-source today vs research-only; (7) how in-context policy learning (skill files, growth ledgers — what cto-brain does) compares and composes with weight-level learning. End with: the 5 highest-leverage integrations for cto-brain specifically, each with honest effort/payoff and what to NOT adopt.

## Summary

The 2025–2026 fully-open local coding-agent stack has converged on a clear architecture that maps directly onto cto-brain's design: a lightweight hot-swapping gateway (llama-swap, exposing both OpenAI and Anthropic endpoints) in front of llama.cpp/vLLM, serving MoE-class open models (Qwen3/Qwen3-Coder, GPT-OSS 120B) that are the only practical choice on the DGX Spark GB10, whose 273 GB/s unified-memory bandwidth — not its 128 GB capacity — makes dense 70B models decode at an unusable ~2.7 tok/s. Tool-calling reliability is the central integration risk and is per-model-family, not per-backend: vLLM requires explicit --enable-auto-tool-choice plus a correctly matched parser (hermes for Qwen3, qwen3_xml for Qwen3-Coder, deepseek_v3 for DeepSeek), and Ollama requires agents to reassemble interleaved thinking/content/tool_calls stream chunks — so capability-probing per model, which cto-brain's router already does, is validated as the right seam. In-context policy learning (skill files, exactly cto-brain's mechanism) now has quantitative evidence: CODESKILL lifts a frozen open MoE model +9.7pp average (SWE-Bench Verified 57.3→66.0), and SkillsBench shows curated skills add +16.2pp across domains — gains achieved without touching weights. Weight-level learning is feasible on the GB10 for LoRA/QLoRA (Unsloth officially supports DGX Spark, ~68 GB for a 120B QLoRA) but own-repo efficacy remains a vendor claim, while outcome-reward agentic RL (DeepSWE) is open-source-reproducible in code but requires ~64 H100s — firmly out of scope for single-box hardware. Highest-leverage moves: adopt llama-swap, standardize on MoE models with correct vLLM parsers, formalize per-model tool-calling conformance probes, keep investing in curated skill files as the primary learning mechanism, and run LoRA only as a bounded experiment; do not attempt agentic RL training or interactive dense-70B serving.

## Verified findings

### F1 — confidence: high (vote 3-0 (3 merged claims, each 3-0))
llama-swap is the best-fit open-source router layer for a single-box local stack: it hot-swaps multiple models on demand with TTL-based load/unload, fronts llama.cpp, vLLM, tabbyAPI, stable-diffusion.cpp, and whisper.cpp on the same machine, and exposes both OpenAI-compatible (/v1/chat/completions, /v1/embeddings, /v1/models) and Anthropic-compatible (/v1/messages, /v1/messages/count_tokens) endpoints — so Claude Code-style Anthropic-API agents can be pointed at local models through it.

*Evidence:* Merged claims 0, 1, 2 (all 3-0). Primary source verified live 2026-07-11: README tagline 'Run multiple generative AI models on your machine and hot-swap between them on demand'; documented ttl config; endpoint list includes Anthropic /v1/messages. Actively maintained (release v238 dated 2026-07-11). Precision notes: Ollama itself is NOT a listed backend (llama.cpp is, which Ollama wraps); vLLM support is real but second-class (containerized recommendation, slower cold-start swaps); the upstream server must itself speak the Anthropic format for /v1/messages passthrough (llama.cpp does natively).

*Sources:*
- https://github.com/mostlygeek/llama-swap

### F2 — confidence: high (vote 3-0 (3 merged claims, each 3-0))
On vLLM, autonomous tool calling is opt-in (--enable-auto-tool-choice plus a model-family-specific --tool-call-parser), dedicated parsers exist for all the coding-relevant open families (deepseek_v3, glm45/glm47, qwen3_xml for Qwen3-Coder, llama3_json/llama4_pythonic), and reliability varies sharply by family: Mistral 7B struggles with parallel tool calls, Llama 3 lacks parallel-call support via llama3_json and can emit malformed parameters, and smaller Llama models frequently fail the pythonic format. Tool-calling reliability is therefore a per-model-parser-pairing property, not a backend property.

*Evidence:* Merged claims 3, 4, 5 (all 3-0), verified verbatim against current vLLM docs (July 2026). Docs mark --enable-auto-tool-choice as 'mandatory' for auto tool choice and list per-family parsers with known-issue caveats. Qualifications: 'first-class' support still has real-world gaps (open issues: qwen3_xml streaming emits invalid JSON for multi-function blocks #43713; tool calls lost inside reasoning regions #39056); deepseek_v3 requires a specific chat template; named/required tool_choice works without the flags.

*Sources:*
- https://docs.vllm.ai/en/latest/features/tool_calling/
- https://github.com/vllm-project/vllm/issues/11592

### F3 — confidence: high (vote 3-0 (2 merged claims, each 3-0))
Ollama natively supports tool calling for tool-trained models, but streaming responses interleave thinking, content, and tool_calls chunks that the agent framework must fully reassemble before the follow-up request — a concrete integration constraint that has caused real agent-framework failures (e.g., Qwen-Agent silently losing thinking content).

*Evidence:* Merged claims 6, 7 (both 3-0), quotes verified verbatim on Ollama's docs 2026-07-11. Caveat from verifiers: this is a platform-level capability only — small models (llama3.1:8b, mistral:7b) often emit tool calls as prose or hallucinate tool names, so per-model reliability testing is still required on an Ollama backend.

*Sources:*
- https://docs.ollama.com/capabilities/tool-calling
- https://github.com/QwenLM/Qwen-Agent/issues/789

### F4 — confidence: medium (vote mixed (one 3-0, one 2-1))
The officially documented recipe for Qwen3 tool calling on local vLLM (>= v0.8.5) is Hermes-style templates with --enable-auto-tool-choice --tool-call-parser hermes --reasoning-parser deepseek_r1; Qwen's docs recommend Hermes-style tool use to maximize function-calling performance — but Qwen3-Coder variants emit XML-format calls and need qwen3_xml/qwen3_coder parsers instead, and reasoning-parser + tool-parser combinations have documented streaming bugs.

*Evidence:* Merged claims 8 (3-0) and 9 (2-1). Both quotes verified verbatim on the official Qwen docs. Rated medium rather than high because claim 9 had a split vote and verifiers flagged: (a) Qwen's own page warns generation is 'not guaranteed to always follow the protocol'; (b) vLLM issues #19513/#19056/#31871 document hermes-parser streaming breakage; (c) 'documented recipe' is accurate, 'reliable' would overstate it. For cto-brain: treat the recipe as the starting point and verify with conformance probes.

*Sources:*
- https://qwen.readthedocs.io/en/latest/framework/function_call.html
- https://docs.vllm.ai/en/latest/features/tool_calling/
- https://github.com/vllm-project/vllm/issues/26561

### F5 — confidence: high (vote 3-0 (3 merged claims, each 3-0))
On the DGX Spark GB10, the 273 GB/s LPDDR5x unified-memory bandwidth — not the 128 GB capacity — is the binding constraint: 70B–120B-class models (Llama 3.1 70B FP8, GPT-OSS 120B MXFP4, Gemma 3 27B) all load and run entirely in memory, but single-stream decode collapses with dense size (GPT-OSS 20B MoE ~49.7 tok/s vs dense Llama 3.1 70B ~2.7 tok/s). Dense 70B is physically capped near ~4 tok/s FP8 / ~7 tok/s Q4 by bandwidth math, so interactive agentic coding on this box requires MoE models (few active params) or smaller dense models.

*Evidence:* Merged claims 10, 11, 12 (all 3-0). LMSYS hands-on benchmarks verified by direct fetch; independent corroboration from NVIDIA specs and llama.cpp discussions; verifiers confirmed the bandwidth ceiling is physics (70 GB weights / 273 GB/s ≈ 3.9 tok/s) so no software update rescues dense 70B single-stream. Caveats: 120B-class fitting depends on quantization (GPT-OSS 120B at MXFP4 ~60 GB; dense 120B at FP8 would not fit); the 20B-vs-70B comparison spans MoE-vs-dense and different runtimes, but that mismatch is exactly the claim's point (MoE wins here).

*Sources:*
- https://www.lmsys.org/blog/2025-10-13-nvidia-dgx-spark/
- https://github.com/ggml-org/llama.cpp/discussions/16578
- https://www.nvidia.com/en-us/products/workstations/dgx-spark/

### F6 — confidence: high (vote 3-0 (4 merged claims, each 3-0))
In-context skill learning — cto-brain's core mechanism — now has direct quantitative validation with open, locally-runnable models: CODESKILL raises a frozen Qwen3.5-35B-A3B agent from 29.57% to 39.26% average pass rate purely via injected skills (SWE-Bench Verified 57.33→66.00, EnvBench-Python 6.98→18.60, Terminal-Bench 2 25.88→34.12), and SkillsBench shows expert-curated skills add +16.2pp average across 86 tasks / 7,308 trajectories. Notably, CODESKILL's skill-curation policy is itself a small Qwen3.5-4B trained with GRPO under a hybrid rubric+verifier reward — an RLVR-style loop applied to skill curation rather than to the coding model's weights, which is a far more GB10-feasible use of RL than training the coder.

*Evidence:* Merged claims 13, 14, 15, 16 (all 3-0), verified against full paper texts including Table 1 numbers. Important qualifications preserved from verification: (a) CODESKILL's skill-extraction policy IS weight-trained — only ~5.68 of the +9.69pp is attributable to skill injection without RL, so purely heuristic skill files should not claim the full gain; (b) CODESKILL's SWE-Bench figure is on a 150-instance eval subset; (c) both are preprints without independent replication; (d) three SkillsBench sub-claims were REFUTED in verification (including 'SWE is where skills help least at +4.5pp' and 'self-written skills give no benefit') — the +4.5pp SWE figure is version-specific to the v1 preprint and the benchmark was restructured in the June 2026 revision, so per-domain rankings should not be relied upon; the headline cross-domain gain (+16.2pp v1, +16.6pp revised) is stable.

*Sources:*
- https://arxiv.org/pdf/2605.25430
- https://arxiv.org/pdf/2602.12670

### F7 — confidence: medium (vote 3-0 (2 merged claims); efficacy unproven)
LoRA/QLoRA fine-tuning of coding models is feasible on the GB10 itself: Unsloth publishes an official DGX Spark guide (up to ~200B params; gpt-oss-120b QLoRA at ~68 GB of the 128 GB unified memory; a demonstrated 4-hour RL run on gpt-oss-20b) and NVIDIA hosts an Unsloth-on-Spark playbook. However, the evidence that own-repo LoRA improves AGENTIC coding is currently a vendor assertion ('you can train a specialized coding model with fine-tuning and RL') stated without benchmarks, and Spark setup is not turnkey (aarch64/sm_121 requires Docker and source-built Blackwell dependencies).

*Evidence:* Merged claims 17, 18 (both 3-0). Feasibility leg is high-confidence (official Unsloth DGX Spark guide + NVIDIA playbook + third-party practitioner coverage); efficacy leg is explicitly unbenchmarked vendor language, and a related mechanism claim (QLoRA 75% memory reduction) was refuted 1-2 in verification. Rated medium overall because the roadmap-relevant half (does own-repo LoRA help agentic coding?) is unproven.

*Sources:*
- https://unsloth.ai/docs/get-started/fine-tuning-llms-guide
- https://build.nvidia.com/spark/unsloth
- https://github.com/unslothai/unsloth/issues/4867

### F8 — confidence: high (vote 3-0; adjacent SWE-RL claim refuted 0-3)
Outcome-reward agentic RL for software engineering is open-source in code but not reproducible on single-box hardware: DeepSWE trains Qwen3-32B with verified task completion as the sole reward (42.2% Pass@1 SWE-Bench-Verified, 59% with test-time scaling; Apache-2.0 code in rllm), but the original run used ~64 H100s for ~6 days. Meanwhile the parallel claim that SWE-RL (Meta) code is available was REFUTED 0-3 — so verifier-driven RL from real repo commit data remains closer to research-only than the survey literature implies.

*Evidence:* Claim 19 (3-0) verified against Together AI's primary blog and the released rllm training code. The compute requirement (64 H100 × 6 days) makes full-agent RL training a non-starter on a GB10; the refutation of SWE-RL code availability removes the one path that promised RL-from-own-repo-history. The GB10-feasible RL surface is the small-policy RLVR loop from the CODESKILL finding (4B skill curator, verifier reward), not RL on the coding model itself.

*Sources:*
- https://arxiv.org/pdf/2509.02547
- https://www.together.ai/blog/deepswe
- https://github.com/rllm-org/rllm

### F9 — confidence: medium (vote synthesis (not independently verified))
Roadmap synthesis — five highest-leverage integrations for cto-brain, in priority order: (1) Adopt llama-swap as the local gateway behind the router seam (effort: days; payoff: high — TTL model swapping, OpenAI+Anthropic endpoints, fronts llama.cpp and vLLM on the one GB10). (2) Standardize the local model roster on MoE-class coders (Qwen3-Coder 30B-A3B, GPT-OSS 20B/120B, Qwen3.5-35B-A3B-class) served via vLLM with the correct per-family parser; drop dense ≥70B from interactive routing (effort: days of config/eval; payoff: high — this is the only interactive-speed regime the 273 GB/s bandwidth allows). (3) Formalize tool-calling conformance probes as first-class router capability signals — a small suite per model×backend×parser that gates routing decisions, since reliability is a per-pairing property (effort: ~1–2 weeks; payoff: high — directly extends existing router_probe). (4) Keep curated skill files / growth ledger as the PRIMARY learning mechanism, with human-in-the-loop curation, optionally piloting a small verifier-scored skill-curation loop a la CODESKILL (effort: ongoing/low; payoff: high and now literature-validated at +9–16pp). (5) Run own-repo QLoRA via Unsloth-on-Spark as a bounded, eval-gated experiment only (effort: ~2–4 weeks incl. aarch64 setup; payoff: uncertain — feasibility proven, efficacy unproven). DO NOT adopt: agentic RL training of coding models (64-H100-class compute), SWE-RL reproduction (code availability refuted), dense-70B interactive serving (bandwidth-capped ~3–7 tok/s), or fully-automated self-written skill loops without curation (unsupported; the enabling claim was refuted in verification).

*Evidence:* Synthesis across all confirmed findings; medium confidence because effort/payoff estimates are judgment, not sourced measurements, and two of the seven research sub-questions (agent TUI comparison, memory systems) produced no surviving claims to ground recommendations.

*Sources:*
- https://github.com/mostlygeek/llama-swap
- https://docs.vllm.ai/en/latest/features/tool_calling/
- https://www.lmsys.org/blog/2025-10-13-nvidia-dgx-spark/
- https://arxiv.org/pdf/2605.25430
- https://build.nvidia.com/spark/unsloth

## Refuted claims (do NOT cite these)

- **REFUTED (0-3)**: Software engineering is the domain where skill files help LEAST (+4.5pp), versus +51.9pp in Healthcare — so in-context skill learning yields the smallest marginal gains precisely on coding-agent tasks, and 16 of 84 tasks actually got worse with Skills attached.
  - source examined: https://arxiv.org/pdf/2602.12670

- **REFUTED (0-3)**: Skills the model authors for itself provide no measurable benefit on average — models cannot reliably write the procedural knowledge they benefit from consuming — which directly challenges fully-automated self-written growth-ledger/skill-file loops without human curation.
  - source examined: https://arxiv.org/pdf/2602.12670

- **REFUTED (1-2)**: Smaller models equipped with curated Skills can match larger models running without Skills, supporting a strategy of pairing local/smaller models with strong skill files instead of scaling model size.
  - source examined: https://arxiv.org/pdf/2602.12670

- **REFUTED (1-2)**: QLoRA's 4-bit quantization reduces training memory use by roughly 75% (4x) relative to 16-bit fine-tuning, which is the mechanism making large coding models trainable on single-node hardware.
  - source examined: https://unsloth.ai/docs/get-started/fine-tuning-llms-guide

- **REFUTED (0-3)**: SWE-RL (Meta) derives rule-based, outcome-oriented reward signals directly from GitHub commit histories to train Llama-3.3-70B-Instruct, and the survey lists its code as available on GitHub — meaning verifier-driven agentic coding RL from real repo data is not research-only.
  - source examined: https://arxiv.org/pdf/2509.02547

## Caveats (verbatim from the verify pass)

Two of the seven research sub-questions have NO surviving verified claims: (2) which open coding agents/TUIs (opencode, aider, OpenHands, Cline/continue.dev) work best against local models, and (4) agent memory systems (MemGPT/Letta, mem0) with local models — the report is silent on these, not negative. The skill-learning evidence (CODESKILL, SkillsBench) is entirely preprint-based, self-reported, and unreplicated; SkillsBench's per-domain numbers are unstable across revisions (v1's +4.5pp-for-SWE ranking was refuted, and the benchmark was restructured in June 2026), so only the headline cross-domain effect should be cited. CODESKILL's full +9.69pp gain includes an RL-trained skill-curation policy — a purely heuristic skill-file system like cto-brain's should expect the smaller ~+5.7pp non-RL share. LoRA efficacy for agentic coding rests on unbenchmarked vendor language. Tool-calling parser landscape (vLLM parsers, Ollama streaming semantics) is fast-moving — claims verified current as of 2026-07-11 but should be re-checked quarterly. Vote 2-1 on the Qwen3 vLLM recipe claim; all others unanimous. DGX Spark throughput figures are batch-1 single-stream from Oct 2025; 2026 software (TensorRT-LLM, speculative decoding) improves aggregate throughput but cannot lift dense-70B single-stream past the bandwidth ceiling.

## Open questions (next research/eval rounds)

- Which open coding agent/TUI (opencode, aider, OpenHands, codex CLI with custom providers, Cline) has the best measured tool-calling success rate against local Ollama/vLLM backends? No claim on this survived verification — needs a hands-on bake-off on the GB10, ideally reusing the trigger-eval harness pattern.

- Do agent memory systems (Letta/MemGPT, mem0) degrade gracefully with local-model context windows and local embeddings, and how do they compare to cto-brain's file-based memory in retrieval quality per token? Entirely unanswered.

- Does own-repo LoRA/QLoRA measurably improve agentic coding (not just style/completion) on held-out repo tasks — and does it compose with or cannibalize skill-file gains? The only honest answer today is 'unproven'; a controlled GB10 experiment with a fixed eval set would be novel.

- Can a CODESKILL-style verifier-rewarded skill-curation loop (small 4B policy, GRPO, execution-verified rewards) be reproduced on a single GB10 within Unsloth's demonstrated RL envelope, giving cto-brain a weight-level learning leg without frontier compute?

## All sources
- {'url': 'https://github.com/mostlygeek/llama-swap', 'quality': 'primary', 'angle': 'routers-and-gateways', 'claimCount': 5}
- {'url': 'https://openrouter.ai/blog/insights/openrouter-vs-litellm/', 'quality': 'blog', 'angle': 'routers-and-gateways', 'claimCount': 5}
- {'url': 'https://dev.to/avatsaev/pro-developers-guide-to-local-llms-with-llamacpp-qwen-coder-qwencode-on-linux-15h', 'quality': 'blog', 'angle': 'routers-and-gateways', 'claimCount': 5}
- {'url': 'https://wetheflywheel.com/en/guides/open-source-ai-coding-agents-2026/', 'quality': 'blog', 'angle': 'agents-vs-local-backends', 'claimCount': 5}
- {'url': 'https://thenewstack.io/open-source-coding-agents-like-opencode-cline-and-aider-are-solving-a-huge-headache-for-developers/', 'quality': 'secondary', 'angle': 'agents-vs-local-backends', 'claimCount': 5}
- {'url': 'https://docs.vllm.ai/en/latest/features/tool_calling/', 'quality': 'primary', 'angle': 'agents-vs-local-backends', 'claimCount': 5}
- {'url': 'https://docs.ollama.com/capabilities/tool-calling', 'quality': 'primary', 'angle': 'agents-vs-local-backends', 'claimCount': 5}
- {'url': 'https://qwen.readthedocs.io/en/latest/framework/function_call.html', 'quality': 'primary', 'angle': 'agents-vs-local-backends', 'claimCount': 5}
- {'url': 'https://pinggy.io/blog/best_open_source_cli_coding_agents/', 'quality': 'blog', 'angle': 'agents-vs-local-backends', 'claimCount': 5}
- {'url': 'https://www.lmsys.org/blog/2025-10-13-nvidia-dgx-spark/', 'quality': 'primary', 'angle': 'models-on-128gb-hardware', 'claimCount': 5}
- {'url': 'https://atomic.chat/blog/guides/best-local-llms-for-coding', 'quality': 'blog', 'angle': 'models-on-128gb-hardware', 'claimCount': 5}
- {'url': 'https://willitrunai.com/can-run/qwen-3-coder-next-on-dgx-spark-128gb', 'quality': 'unreliable', 'angle': 'models-on-128gb-hardware', 'claimCount': 5}
- {'url': 'https://forums.developer.nvidia.com/t/how-to-run-qwen3-coder-next-on-spark/359571', 'quality': 'forum', 'angle': 'models-on-128gb-hardware', 'claimCount': 5}
- {'url': 'https://vectorize.io/articles/mem0-vs-letta', 'quality': 'blog', 'angle': 'memory-and-skill-learning', 'claimCount': 5}
- {'url': 'https://alexop.dev/posts/four-types-memory-coding-agents-claude-code/', 'quality': 'blog', 'angle': 'memory-and-skill-learning', 'claimCount': 5}
- {'url': 'https://www.developersdigest.tech/blog/continual-learning-claude-code', 'quality': 'blog', 'angle': 'memory-and-skill-learning', 'claimCount': 4}
- {'url': 'https://arxiv.org/pdf/2605.25430', 'quality': 'primary', 'angle': 'memory-and-skill-learning', 'claimCount': 5}
- {'url': 'https://atlan.com/know/best-ai-agent-memory-frameworks-2026/', 'quality': 'blog', 'angle': 'memory-and-skill-learning', 'claimCount': 5}
- {'url': 'https://arxiv.org/pdf/2602.12670', 'quality': 'primary', 'angle': 'memory-and-skill-learning', 'claimCount': 5}
- {'url': 'https://unsloth.ai/docs/get-started/fine-tuning-llms-guide', 'quality': 'primary', 'angle': 'weight-level-learning-feasibility', 'claimCount': 5}
- {'url': 'https://www.spheron.network/blog/axolotl-vs-unsloth-vs-torchtune/', 'quality': 'blog', 'angle': 'weight-level-learning-feasibility', 'claimCount': 5}
- {'url': 'https://arxiv.org/pdf/2509.02547', 'quality': 'primary', 'angle': 'weight-level-learning-feasibility', 'claimCount': 5}
- {'url': 'https://www.emergentmind.com/topics/swe-rl', 'quality': 'secondary', 'angle': 'weight-level-learning-feasibility', 'claimCount': 5}

## Stats

```json
{
 "angles": 5,
 "sourcesFetched": 23,
 "claimsExtracted": 114,
 "claimsVerified": 25,
 "confirmed": 20,
 "killed": 5,
 "unverified": 0,
 "afterSynthesis": 9,
 "urlDupes": 0,
 "budgetDropped": 7,
 "agentCalls": 105
}
```
