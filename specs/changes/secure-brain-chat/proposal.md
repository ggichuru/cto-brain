# Change: secure-brain-chat

**Status:** Proposed (2026-07-11), NOT frozen — ships the `cto-brain chat`
command and the `src/chat/` platform. Generalizes an operator-hardcoded
reference chat into a public, config-driven feature: any user runs
`npm install -g cto-brain`, points it at THEIR project, and gets a gated,
doc-grounded "Secure Brain" chat over THEIR models. No operator paths, no baked
handbook, no private brain scope ship in the package.

## Intent
Give every cto-brain user a self-hosted, honest, doc-grounded chat they fully
own: grounded in their own docs, driven by their own models (local or any
OpenAI-compatible endpoint), gated fail-closed so nothing that needs protecting
leaks. It is the "talk to your brain" surface — spec-first, model-agnostic,
privacy-preserving — that composes with the router (model layer) and the gate
(secret discipline) already in the package.

## Problem
A chat that grounds an LLM in a real project's files is only safe if three
things hold at once: (1) it never reads a secret into the prompt, (2) it never
serves inference or file reads to an unauthenticated caller, and (3) it never
ships the author's private config to strangers. A hardcoded operator build
solves none of these for a third party. This change makes the safe version the
only version.

## The scopes model
A **scope** is a bounded, named slice of documentation the chat grounds on:
`{ id, label, root, include:[globs/paths], maxBytes }`. Three tiers:
- **project** (default, shipped) — walks the cwd's README + docs/, docs-only.
- **system** (config) — multiple project scopes in one config (multi-repo).
- **whole-node** (ROADMAP) — live host/service snapshot; the reference had it,
  it is intentionally NOT shipped (needs a node-safe, generic probe design).
A scope with `root:null` grounds on inline `text` (paste a brief, no files).

## The three-gate security model (fail-closed)
1. **Transport** — binds `127.0.0.1` by default; a tailnet/LAN bind is explicit
   (`--host`). Origin/Host checked against loopback to block DNS-rebinding.
2. **API token** — every `/api/*` call needs the token (`X-CTO-Token` or
   `?token=`), constant-time compared. No/!=token → 401. Pages load ungated so
   the token can be entered; inference + file reads stay behind it. Token comes
   from `CTO_CHAT_TOKEN`/config or is minted per boot and printed — NEVER absent.
3. **Scope ACL + secret denylist** — the chat grounds ONLY on configured
   scopes, reading ONLY doc extensions, under a traversal guard, bounded to
   `maxBytes`, with a secret denylist on PATH **and** CONTENT. A file that looks
   secret (by name or by a live-key-shaped body) is skipped WHOLE. Ambiguity
   denies.

## Provider-agnostic model layer
Resolved THROUGH `src/router/providers.mjs` (`getProvider`, `resolveBaseUrl`,
preset registry) — never reimplemented. `provider:{ id, baseUrl?, model,
apiKeyEnv?, models? }` supports local (ollama native + any OpenAI-compatible:
vLLM/LM Studio/llama.cpp/llama-swap), cloud OpenAI-compatible (base-URL+key),
anthropic (messages wire), and the jarvis sovereign gateway. The key is read
from the env var the preset (or `apiKeyEnv`) names — server-side only, forwarded
upstream as a header, NEVER written to disk or sent to the browser. `models`
enables Fast/Deep selection.

## Config schema
`cto-brain.config.json` (or `.mjs` default-export) in cwd; flags/env override:
```
{ "scopes":[{ "id","label","root","include":[…],"maxBytes" }],
  "provider":{ "id","baseUrl?","model","apiKeyEnv?","models?" },
  "auth":{ "host","port","token?" } }
```
No config → default project scope + local ollama. Example ships at
`templates/chat/cto-brain.config.example.json`.

## Endpoints
- `GET /` — self-contained chat UI (public; token entered in-page).
- `GET /api/models` — allowed models + default + provider summary (no key).
- `GET /api/projects` — configured scopes.
- `POST /api/chat` — SSE, OpenAI-shaped `{choices:[{delta:{content}}]}` deltas;
  ollama-native and anthropic wires are bridged to the same shape.

## Threat model
Fail-closed at every gate; a minted token means the API is never open by
default; loopback bind keeps it off the public internet unless the operator
opts in; the secret denylist assumes docs may contain accidents and skips whole
files on any match; upstream error bodies are key-redacted before display; the
private-config boundary keeps operator handbooks/paths/brain out of the package.

## Behavior
`cto-brain chat [--port] [--host] [--config] [--provider] [--model]` loads
config, starts the server, prints the URL + token + provider summary (key shown
only as present/MISSING), and stays up until interrupted. `--help` documents it.

## Acceptance criteria
- `test/chat-grounding.mjs` — walk is docs-only, maxBytes-bounded, and SKIPS a
  planted `.env` PATH and a `.md` whose CONTENT is `sk-…`. Fail-closed proven.
- `test/chat-auth.mjs` — `/api/*` 401 without token, 200 with; `/` public.
- `test/chat-provider.mjs` — resolution routes to the configured baseUrl/model
  via providers.mjs for local/openai-compatible/anthropic; no live call.
- `npm test` green; zero new runtime dependencies.

## Non-goals
- No multi-user auth / per-scope RBAC (ROADMAP) — one shared token today.
- No whole-node/live-system scope in the package (ROADMAP; privacy + generality).
- No remote/hosted deploy, no persistence of chat history server-side.
- No operator handbook, `~/.cto-brain` brain scope, or any /home path (privacy).

## Roadmap (maturity-tagged)
- PROVEN: project scope, three gates, ollama/OpenAI-compatible/anthropic wires.
- ENABLED: multi-scope config, Fast/Deep model select, inline-text scope.
- ROADMAP: multi-user auth, per-scope RBAC, whole-node scope, remote deploy,
  streamed tool-use, conversation persistence.

## Frozen contracts
(At freeze:) `src/chat/{config,grounding,provider,persona,server}.mjs` exports;
`SECRET_PATH`/`SECRET_CONTENT`/`DOC_EXT` denylists; config schema above;
env `CTO_CHAT_TOKEN`/`CTO_CHAT_HOST`/`CTO_CHAT_PORT`; endpoint shapes.
