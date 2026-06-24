# Model router — policy-first local + cloud routing

CTO Brain ships an **auditable** model router. It picks provider + model from explicit rules and live probes — not learned cost optimization (Fugu / jro-fable / fable5-orchestrator may overlay cost hints; they do not replace policy).

## Why policy-first

| Concern | CTO Brain router | Black-box routers |
|---------|------------------|-------------------|
| Explainability | Every decision includes `reason` | Opaque |
| Offline / local | Probes Ollama, vLLM, llama.cpp | Often cloud-only |
| Honesty | Stubs (Cursor, Codex) marked unreachable | May imply availability |
| CTO alignment | Task kind → tier → fallback chain | Token cost only |

## Quick start

```bash
cto-brain router init              # writes .cto-brain/router.json
cto-brain router probe             # local + configured stacks
cto-brain router probe --all       # include cloud credential checks
cto-brain stack status             # configured stacks only
cto-brain router select --task dispatch-builder --prefer local
```

## Task kinds

| Kind | Default tier | Typical use |
|------|--------------|-------------|
| `dispatch-builder` | local | Token-heavy builders |
| `explore` | local | Read-only territory mapping |
| `inline-edit` | local | Parent ≤5 min edits |
| `reviewer-security` | cloud | Security reviewer trio |
| `reviewer-tech` | cloud | Tech-lead reviewer |
| `research` | auto | External field research |

## Provider presets

Registered in `src/router/providers.mjs`:

- **Local:** ollama, vllm, llamacpp, openai-compatible, desk-engine
- **Cloud:** anthropic, openai, fugu (Sakana)
- **Stubs:** cursor, codex (honest — not probeable from CLI)

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

Path: `.cto-brain/router.json`

```json
{
  "stacks": [
    { "id": "desk-engine", "url": "http://127.0.0.1:8787", "type": "desk" },
    { "id": "ollama", "url": "http://127.0.0.1:11434", "type": "ollama" }
  ],
  "routing": {
    "defaultPrefer": "local",
    "builder": { "tier": "local", "model": "qwen2.5-coder:14b", "provider": "ollama" },
    "reviewer": { "tier": "cloud", "model": "sonnet", "provider": "anthropic" },
    "explore": { "tier": "local", "provider": "ollama" },
    "research": { "tier": "cloud", "provider": "openai" }
  }
}
```

Fields merge with package defaults; missing keys inherit from `DEFAULT_ROUTER_CONFIG`.

## Routing output shape

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder:14b",
  "baseUrl": "http://127.0.0.1:11434",
  "tier": "local",
  "task": "dispatch-builder",
  "prefer": "local",
  "reason": "Builders run token-heavy; local coders OK when probe succeeds.; project override model=qwen2.5-coder:14b; probe OK (3 models); prefer=local",
  "honest": true,
  "fallbackUsed": false
}
```

When nothing is reachable, `provider` is `null` and `reason` tells you to run `router probe --all`.

## Pre-dispatch ritual

Before fan-out:

1. `cto-brain router probe`
2. `cto-brain router select --task dispatch-builder --prefer local` (per builder lane)
3. `cto-brain router select --task reviewer-security --prefer cloud` (reviewers)

If local is down, routing falls back per chain — never fabricates a running stack.

## See also

- `skills/cto-orchestration/references/model-router.md` — orchestration discipline
- The Desk `providers.js` — runtime provider presets in the app engine
