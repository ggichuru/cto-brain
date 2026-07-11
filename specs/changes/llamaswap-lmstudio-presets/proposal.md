# Change: llamaswap-lmstudio-presets

**Status:** FROZEN 2026-07-11 for the ultracode Phase-1 build (source: judge-panel ultraplan over 3 lenses + verified research docs/research/2026-07-11-local-coding-agent-stacks.md).

## Intent
Merged from all portability lenses: first-class router presets and localhost discovery for llama-swap (research F1 verdict: best-fit single-box gateway, OpenAI+Anthropic endpoints) and LM Studio (the common Mac laptop case), so router probe/plan/select and stack status see the two runtimes strangers most commonly already run — today they are silently invisible.

## Behavior
src/router/providers.mjs PROVIDER_PRESETS gains `llama-swap` (default http://127.0.0.1:8080, env LLAMA_SWAP_BASE_URL, probePath /v1/models, openAiCompatible, tier local, note documenting its Anthropic /v1/messages endpoint) and `lmstudio` (default http://127.0.0.1:1234, env LMSTUDIO_BASE_URL, probePath /v1/models, openAiCompatible, tier local). discover.mjs adds both to DISCOVERY_TARGETS and disambiguates llama-swap from bare llama.cpp on the same port by probing GET /running. select.mjs inserts both into every local-first fallbackChain after llamacpp and before cloud. config.mjs DEFAULT_ROUTER_CONFIG enabledProviders include them. probe/discover already handle /v1/models {data:[{id}]}, so probe --all and stack status pick them up with zero further wiring.

## Acceptance criteria
- test/router-providers.mjs extended: getProvider('llama-swap') and getProvider('lmstudio') return presets with correct baseUrl, envKey override, probePath, openAiCompatible, tier; resolveBaseUrl honors the env vars; listProviders includes both
- test/router-discover.mjs extended with injected fake fetch: LM Studio found on :1234; a server answering GET /running is reported id llama-swap while one 404ing /running stays llamacpp
- test/router-select.mjs extended: with a mocked reachable llama-swap probe carrying models and ollama down, selectRoute({task:'dispatch-builder', prefer:'local'}) returns provider llama-swap with its probed first model; same for lmstudio; fallbackChain ordering asserted ollama -> llamacpp -> llama-swap/lmstudio -> cloud
- npm test green offline with no network (all probes faked, matching existing suite patterns)

## Non-goals
- No llama-swap config generation or TTL management (Phase 4)
- No Anthropic-wire client in cto-brain — llama-swap provides that endpoint, we only document it
- No MoE roster policy changes (Phase 4, needs the GB10)

## Frozen contracts
- File scope (exclusive this round): src/router/providers.mjs, src/router/discover.mjs, src/router/select.mjs, src/router/config.mjs; tests: test/router-providers.mjs, test/router-discover.mjs, test/router-select.mjs (extended)
- Tests are dependency-free node scripts (ok()/failures pattern); suite green offline.
