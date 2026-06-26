# Integration: jarvis sovereign code terminal (Phase 0)

**Status:** In progress (2026-06-26). Frozen contract for the Phase-0 build.

## Goal

Make `cto-brain code` a Claude-Code-like coding terminal that runs against
the **jarvis.mkulyma.com** sovereign model gateway, with a model picker that
selects by capability/usage. Built on **codex** (already installed; has the
TUI; supports custom OpenAI providers). Ship as a cto-brain npm feature
(Phase 1 publishes).

## Jarvis surface — VERIFIED LIVE 2026-06-26 (load-bearing facts)

Base host `https://jarvis.mkulyma.com`. Open WebUI fronting local Ollama.
Auth = `Authorization: Bearer $JARVIS_API_KEY` on every request.

| Endpoint | Result with the key | Use |
|---|---|---|
| `GET /api/models` | **200** — OpenAI-style `{data:[{id,name,owned_by}]}` | **model catalog** ✅ |
| `POST /ollama/api/chat` | **200** — Ollama-native `{message:{content}}`, streaming = ND-JSON | **completions** ✅ |
| `POST /api/chat/completions` | **400 `'NoneType' object has no attribute 'startswith'`** | documented OpenAI endpoint but **BROKEN server-side** for API-key calls (jarvis bug; out of scope) ❌ |
| `/openai/v1/*` | **403** | not in this key's allowlist ❌ |
| `/ollama/v1/*` | (403 expected) | not in allowlist ❌ |

Key allowlist (from `dgx-ops/secrets/jarvis.env.example`):
`/api/chat/completions, /api/models, /ollama/api/tags, /ollama/api/chat`.

**Consequence:** the only working *completion* path for this key is the
**native Ollama API** (`POST /ollama/api/chat`). codex needs an **OpenAI-wire**
endpoint. → We run a **local bridge** (below). (Operator alternative, not this
build: fix the `/api/chat/completions` bug or add `/ollama/v1/*` to the key
allowlist, then codex points straight at jarvis — no bridge.)

## Model catalog + capability taxonomy (13 models, live)

Tag each model id from `/api/models`. Heuristic by id substring:

| id | capability | tier (size) | code-picker |
|---|---|---|---|
| `qwen2.5-coder:14b` | **coder** | mid | ✅ default coder |
| `llama3.1:70b-instruct-q4_K_M` | **reasoning** | large | ✅ heavy reviewer/integrate |
| `gemma4:12b`, `gemma3:12b` | general/reasoning | mid | ✅ |
| `qwen2.5:7b-instruct`, `qwen2.5:7b` | general | small | ✅ |
| `gemma4:e4b`, `gemma3:4b`, `gemma3:1b` | general | small/tiny | ✅ (fast) |
| `qwen2.5vl:32b`, `qwen2.5vl:7b` | **vision** | large/small | ✅ (vision) |
| `nomic-embed-text:latest` | **embed** | — | ❌ exclude (not chat) |
| `arena-model` | router/special | — | ❌ exclude (not a real model) |

Tagger rule: `coder` if id contains `coder`; `vision` if `vl`/`vision`;
`embed` if `embed`/`nomic`; exclude `arena-model`; else `general`. Size tier
from the `Nb`/`Ne` token (`70b`→large, `≥12b`→mid, else small).

Task→capability default (for auto-pick):
`dispatch-builder|autonomous-build|inline-edit → coder (qwen2.5-coder:14b)`;
`reviewer-*|integrate|research → reasoning (llama3.1:70b...)`;
`explore → general small`. **Never hard-code the roster — read it live;** the
table is the *intent*, discovery is the *source of truth*.

## Provider / env contract

- Provider id: **`jarvis`** (a `sovereign` openai-compatible gateway).
- Env var: **`JARVIS_API_KEY`** (operator exports it; NEVER written to a file
  or committed — referenced by env only, per `apiKeyEnv`).
- Bridge listens loopback only: `http://127.0.0.1:${CTO_GATEWAY_PORT:-11475}/v1`.

## The local bridge (cto-brain gateway)

`cto-brain gateway` runs an OpenAI-compatible server on loopback that forwards
to jarvis's working native-Ollama surface:

- `GET  /v1/models`            → `GET /api/models` (already OpenAI-shaped → pass through `data[]`)
- `POST /v1/chat/completions`  → `POST /ollama/api/chat` (translate OpenAI⇄Ollama)
  - non-stream: wrap ollama `{message}` into OpenAI `{choices:[{message}]}`
  - stream: translate ollama ND-JSON chunks → OpenAI SSE `data: {choices:[{delta}]}` + final `[DONE]`
  - inject `Authorization: Bearer $JARVIS_API_KEY`
  - **tools/function-calling: best-effort pass-through** (mark stub if the
    model/ollama path doesn't support it — honest, not faked)
- Loopback bind + Origin guard (model on `src/mcp/streamableHttp.mjs`).
- Health: `GET /healthz`.

## codex launch contract (`cto-brain code`)

`cto-brain code` resolves a model (flag / task-capability / interactive picker),
ensures the bridge is up, then `exec`s codex with a custom provider via `-c`:

```
codex \
  -c model_providers.jarvis.name="jarvis (sovereign)" \
  -c model_providers.jarvis.base_url="http://127.0.0.1:<port>/v1" \
  -c model_providers.jarvis.wire_api="chat" \
  -c model_provider="jarvis" \
  -m "<picked-model>" "$@"
```

TTY: launch with stdio inherited (exec / `stdio:'inherit'`) so the codex TUI
gets the terminal. (This is what the bash-wrapper era got wrong by testing in
no-TTY `zsh -lc`.)

CLI surface:
- `cto-brain code` — interactive picker over jarvis chat models (coder first)
- `cto-brain code --model <id>` — explicit
- `cto-brain code --task <kind>` — capability auto-pick
- `cto-brain code local` — keep existing on-box ollama path (back-compat)

## Module seams (from repo map) — file scopes

- **Router core** (builder R): `src/router/{providers,config,discover,probe,select}.mjs`
  - add `jarvis` preset to `PROVIDER_PRESETS` (providers.mjs): `tier:"local"`,
    `openAiCompatible:true`, `probePath:"/api/models"`, `keyRequired:true`,
    `envKey:"JARVIS_API_KEY"`, baseUrl from `JARVIS_BASE_URL` default
    `https://jarvis.mkulyma.com`.
  - remote model discovery for `/api/models` (`{data:[{id}]}`) in discover/probe.
  - capability tagger (NEW small module `src/router/capabilities.mjs`).
  - tests: extend `test/router-providers.mjs`, add `test/router-capabilities.mjs`
    (use the `ok()/failures` pattern; `node --test`-style).
- **Bridge** (builder G): NEW `src/gateway/bridge.mjs` + wire `cto-brain gateway`
  in `bin/cto-brain.mjs`. NEW `test/gateway-bridge.mjs` (translation unit tests +
  live opt-in test gated on `JARVIS_API_KEY`).
- **Code launcher** (CTO inline): NEW `src/cli/code.mjs` + picker in
  `src/cli/ui.mjs` (`selectFromMenu`) + register `code` in `bin/cto-brain.mjs`.

DO NOT TOUCH: `src/sync/*, src/gate/*, src/adapters/*, src/eval/*, src/a2a/*, skills/*`.

## Done = Phase 0
`cto-brain code` launches codex against a jarvis model in a real terminal,
picker works, `npm test` green. Proven with a PTY run + screenshot.
Phase 1 (separate): capability/usage auto-routing polish, version bump
0.9.1→0.10.0, `npm publish` (operator-run; npm not logged in here).
