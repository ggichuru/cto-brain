# Model router — policy-first local + cloud routing

CTO Brain ships an **auditable** model router. It picks provider + model from explicit rules and live probes — not learned cost optimization (Fugu / jro-fable / fable5-orchestrator may overlay cost hints; they do not replace policy).

## Why policy-first

| Concern | CTO Brain router | Black-box routers |
|---------|------------------|-------------------|
| Explainability | Every decision includes `reason` | Opaque |
| Offline / local | Probes Ollama, vLLM, llama.cpp | Often cloud-only |
| Honesty | Stubs (Cursor, Codex) marked unreachable | May imply availability |
| CTO alignment | Task kind → tier → fallback chain | Token cost only |

## Two-level config merge

Router config merges in order (later layers override earlier):

1. **Package defaults** — `DEFAULT_ROUTER_CONFIG` in `src/router/config.mjs`
2. **System** — `~/.cto-brain/router.json` (machine-wide defaults)
3. **Project** — `.cto-brain/router.json` (repo-specific overrides)

Initialize each layer:

```bash
cto-brain router init --system    # ~/.cto-brain/router.json
cto-brain router init             # .cto-brain/router.json (seeds from merged system+defaults)
```

`cto-brain init` (system bootstrap) also creates `~/.cto-brain/router.json` when missing. Project init via `init --project` creates `.cto-brain/router.json`.

Merge rules (`mergeRouterConfig`):

- `stacks`, `enabledProviders` — replaced wholesale when present in override
- `routing` — shallow merge (override keys win)
- `agentic` — shallow merge

Examples: [router.system.json.example](./router.system.json.example) · [router.json.example](./router.json.example)

## Quick start

```bash
cto-brain router init --system     # optional machine defaults
cto-brain router init              # project .cto-brain/router.json
cto-brain router probe             # local + configured stacks
cto-brain router probe --all       # include cloud credential checks
cto-brain stack status             # configured stacks only
cto-brain router select --task dispatch-builder --prefer local
cto-brain router plan              # full task matrix for CI / dispatch scripts
```

Full workflow: [USAGE.md](./USAGE.md)

## Task kinds

| Kind | Default tier | Typical use |
|------|--------------|-------------|
| `dispatch-builder` | local | Token-heavy builders |
| `autonomous-build` | local | Sustained agentic coding loops |
| `explore` | local | Read-only territory mapping |
| `inline-edit` | local | Parent ≤5 min edits |
| `reviewer-security` | cloud | Security reviewer trio |
| `reviewer-tech` | cloud | Tech-lead reviewer |
| `integrate` | cloud | Merge / integration decisions |
| `research` | auto | External field research |

When `defaultPrefer` is `auto`, each task uses its rule's `preferTier` (`local`, `cloud`, or `auto`).

## Provider presets

Registered in `src/router/providers.mjs`:

- **Local:** ollama, vllm, llamacpp, openai-compatible, desk-engine
- **Cloud:** anthropic, openai, fugu (Sakana)
- **Stubs:** cursor, codex (honest — not probeable from CLI)

Filter with `enabledProviders` in either config layer.

## Stack connection

Probes already-running services:

| Stack | Default URL | Probe |
|-------|-------------|-------|
| Desk engine | `http://127.0.0.1:8787` | `GET /health` |
| Ollama | `http://127.0.0.1:11434` | `GET /api/tags` |
| vLLM | `http://127.0.0.1:8000` | `GET /v1/models` |
| llama.cpp | `http://127.0.0.1:8080` | `GET /v1/models` |

`discover.mjs` also scans common localhost ports and env vars (`OLLAMA_HOST`, `VLLM_BASE_URL`, `DESK_ENGINE_URL`).

## router.json schema

**System path:** `~/.cto-brain/router.json`  
**Project path:** `.cto-brain/router.json`

See [router.json.example](./router.json.example) for the full project schema including all task kinds and `agentic` settings.

Minimal project override (inherits stacks/providers from system + defaults):

```json
{
  "routing": {
    "defaultPrefer": "local",
    "builder": { "tier": "local", "model": "qwen2.5-coder:14b", "provider": "ollama" }
  }
}
```

## Routing output shape

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder:14b",
  "baseUrl": "http://127.0.0.1:11434",
  "tier": "local",
  "task": "dispatch-builder",
  "prefer": "auto",
  "reason": "Builders run token-heavy; local coders OK when probe succeeds.; project override model=qwen2.5-coder:14b; probe OK (3 models); prefer=auto",
  "honest": true,
  "fallbackUsed": false
}
```

`router plan` returns one such route per task kind plus `layers`, `configPaths`, and `agentic` settings.

When nothing is reachable, `provider` is `null` and `reason` tells you to run `router probe --all`.

## Pre-dispatch ritual

Before fan-out:

1. `cto-brain router probe --all`
2. `cto-brain router plan` (or `router select` per lane)
3. Dispatch builders on `dispatch-builder` / `autonomous-build` routes
4. Run reviewers on `reviewer-security` / `reviewer-tech` with `--prefer cloud`

If local is down, routing falls back per chain — never fabricates a running stack.

## See also

- [USAGE.md](./USAGE.md) — end-to-end build workflow
- `skills/cto-orchestration/references/model-router.md` — orchestration discipline
- The Desk `providers.js` — runtime provider presets in the app engine
