# Model router — CTO orchestration discipline

Portable reference for **which model / runtime** agents should use. Implemented in the `cto-brain` npm package (`router` CLI).

## When local vs cloud

| Work | Prefer | Rationale |
|------|--------|-----------|
| File-scoped builders, explore, inline parent edits | **local** | High token volume; coders on-box are fine |
| Security / tech-lead reviewers | **cloud** (if creds) | Stronger reasoning for contract + threat review |
| Architecture / cross-cutting design | **cloud** | Fewer tokens, higher stakes |
| External research | **auto** | Cloud when keys exist; honest local fallback |

## Pre-flight (every dispatch round)

```bash
cto-brain router probe
cto-brain router select --task dispatch-builder --prefer local
cto-brain router select --task reviewer-security --prefer cloud
```

Embed the selected `provider`, `model`, and `reason` in builder briefs when dispatching to runtimes that honor it (Desk engine, Ollama, API agents).

## Honest degradation

- If Ollama/vLLM probe fails → do **not** claim a local model is running.
- Cursor / Codex are **stubs** in cto-brain — routing records intent only.
- Cloud without API key → skip provider in chain; reason names missing `ANTHROPIC_API_KEY` etc.
- Desk engine at `:8787` is a **stack**, not an LLM — probe `/health` for orchestration context.

## Project overrides

`.cto-brain/router.json` per repo:

- `stacks[]` — already-running services to probe
- `routing.builder` / `routing.reviewer` — model + provider overrides

Run `cto-brain router init` once per project.

## vs Fugu / Fable cost routers

jro-fable and fable5-orchestrator optimize **cost/latency** with learned or heuristic routing. That is optional overlay — **not** a replacement for CTO Brain's auditable rules table. Lead-CTO rounds may cite cost hints in briefs, but dispatch gates on policy + probe truth.

## Task kind → policy (summary)

| Task kind | Tier | Fallback order (abbrev) |
|-----------|------|-------------------------|
| `dispatch-builder` | local | ollama → vllm → llamacpp → cloud |
| `explore` | local | ollama → vllm → anthropic |
| `inline-edit` | local | ollama → vllm → anthropic |
| `reviewer-security` | cloud | anthropic → openai → fugu → ollama |
| `reviewer-tech` | cloud | anthropic → openai → fugu → ollama |
| `research` | auto | openai → fugu → anthropic → ollama |

Full rules: `cto-brain` package `src/router/select.mjs`.
