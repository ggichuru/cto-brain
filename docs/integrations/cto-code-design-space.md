# cto-code × the agent design space

`cto-brain code` is a sovereign, local-model coding terminal (opencode by
default; codex/aider optional). It exists on a bet the "Dive into Claude Code"
paper (arXiv:2604.14228) states as a measurement: a real agentic system is
**~1.6% model reasoning, ~98.4% deterministic harness**. The differentiator is
the harness, not the model — which is exactly why a local 14B on your own box,
wrapped in a strong harness, is a real tool and not a toy.

This is the DNA baked into the `cto` system prompt that `cto-brain code` wires
into opencode (`src/cli/opencode-setup.mjs`). It is the `agent-design-space`
skill applied to one surface.

## What the harness gives the local model

| Design-space principle | How cto-code applies it |
|---|---|
| **Deny-first** (deny > ask > allow) | opencode's permission prompts + the cto agent's posture; the harness decides *whether* an action runs. |
| **Minimal scaffolding, maximal harness** | No planner/state-graph constraining the model; the model reasons freely, the MCP tools + gates enforce. |
| **Context is scarce, compact cheapest-first** | Keep tasks small (local zones are narrow); prefer a subagent that returns a summary over stuffing the window; the router's `fitsLocalGpu` keeps context-hungry giants off the box. |
| **Verify with an independent oracle** | Never trust the model's "done" — a test/build/e2e is the verdict. UNPROVEN until an external check passes. |
| **Skill vs subagent cost model** | Inline guidance vs spawn isolation is a token choice, made deliberately. |
| **Model swappable** | `--model` / `--task` / picker route by capability; the harness is constant, the model floats — including down to the sovereign local floor. |

## Model selection stays honest

`resolveModel()` picks a tool-capable model (a coder that prints tool calls as
text can't drive the agent loop) and caps interactive picks at "mid" tier —
large models run CPU-bound and unusably slow on local hardware. This is the
paper's reversibility/cost realism: match the model to what the host can
actually run, and say so when a weaker-but-sovereign model is the honest choice.

## Where this heads (the four future axes)

cto-code today is single-host, single-user, user-initiated, single-project. The
platform roadmap (see the jarvis sovereign-compute-fabric ULTRAPLAN) pushes it
along WHERE (any host, assessed and matched), WHEN (service + scheduled jobs),
WHAT (multi-project), and WITH-WHOM (multi-user, governed) — with the invariant
that the execution boundary is the safety boundary: the deny-first gate extends
with every axis, never after it.

See the `agent-design-space` skill for the full lens.
