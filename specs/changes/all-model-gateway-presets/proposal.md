# Change: all-model-gateway-presets

**Status:** DRAFT 2026-07-17 for the Uwezo edge-AI-enabler Rung 1 (source: `edge-ai-enabler` skill "the all-model gateway", memory [[project_uwezo_edge_enabler]] seam 3).

## Intent
Rung 1 of the all-model enabler: give the auditable router first-class presets for the three cloud lanes named in the enabler doctrine — **OpenRouter** (breadth: one key → 400+ models), **Moonshot/Kimi** (direct depth: first-party SLA + native `/anthropic` path), and **Together** (the fine-tune + Code-Interpreter escape hatch). Today the router can only reach Anthropic/OpenAI/Fugu directly; the breadth and direct-depth lanes are invisible. This is seam 3 (`PROVIDER_PRESETS` + `fallbackChain`); it unblocks the Uwezo-side resolver (seam 2) which routes through cto-brain.

## Behavior
`src/router/providers.mjs` PROVIDER_PRESETS gains three `tier: cloud`, `keyRequired`, `openAiCompatible` presets, each using the jarvis credential pattern (`envKey` = base-URL override, `apiKeyEnv` = the key — so a stray base-URL env is never mistaken for a credential):
- `openrouter` — baseUrl `https://openrouter.ai/api/v1`, envKey `OPENROUTER_BASE_URL`, apiKeyEnv `OPENROUTER_API_KEY`, defaultModel `openrouter/auto`.
- `moonshot` — baseUrl `https://api.moonshot.ai/v1`, envKey `MOONSHOT_BASE_URL`, apiKeyEnv `MOONSHOT_API_KEY`, defaultModel `kimi-k2`.
- `together` — baseUrl `https://api.together.xyz/v1`, envKey `TOGETHER_BASE_URL`, apiKeyEnv `TOGETHER_API_KEY`, defaultModel `meta-llama/Llama-3.3-70B-Instruct-Turbo`.

`src/router/select.mjs` inserts the three into every `fallbackChain` **after the existing named cloud providers (anthropic/openai/fugu) and before the sovereign floor (jarvis/ollama) or the IDE stubs (cursor/codex)** — sovereign-by-default is preserved (locals stay first; a gateway is reached only when its key is set and stronger/earlier lanes are unavailable). `src/router/config.mjs` DEFAULT_ROUTER_CONFIG.enabledProviders (a whitelist that `buildChain` filters against) gains the three ids, else they are silently filtered out of every configured route.

## Acceptance criteria
- test/router-providers.mjs extended: getProvider('openrouter'|'moonshot'|'together') return presets with correct baseUrl, envKey base-URL override, apiKeyEnv, openAiCompatible, tier cloud, keyRequired; resolveBaseUrl honors the base-URL env; apiKeyEnvName/hasApiKey/hasCloudCredential key off the apiKeyEnv (a bare base-URL env is NOT a credential); listProviders includes all three.
- test/router-select.mjs extended: with the relevant gateway key in env and no earlier cloud creds/probes, selectRoute returns the gateway provider with its defaultModel; deny-cloud-without-credential still holds (no key ⇒ skipped ⇒ falls through to sovereign floor); every existing "picks X first" assertion stays green; chain-membership asserted for openrouter/moonshot/together.
- Full suite (`node --test test/*.test.mjs`) green offline with no network (all probes/creds injected).

## Non-goals
- No live `/models` roster probing of OpenRouter/Together (probePath stays null this slice; principle-7 roster audit of the gateway is a follow-up).
- No Uwezo-side seams (config generator, resolveModel cloud branch, `driveTrain` together backend, Code-Interpreter lane) — separate changes.
- No key provisioning/storage — keys live in env/auth-store only, never committed.

## Frozen contracts
- File scope (exclusive this round): src/router/providers.mjs, src/router/select.mjs, src/router/config.mjs; tests: test/router-providers.mjs, test/router-select.mjs (extended).
- The jarvis credential pattern (envKey=base-URL, apiKeyEnv=key) is the frozen shape for every keyed OpenAI-compatible preset.
- Tests are dependency-free node scripts (ok()/failures pattern); suite green offline.
