# Change: tool-conformance-ledger

**Status:** FROZEN 2026-07-11 for the ultracode Phase-1 build (source: judge-panel ultraplan over 3 lenses + verified research docs/research/2026-07-11-local-coding-agent-stacks.md).

## Intent
Merged from all three lenses (proposed independently by each — the strongest consensus in the plan set): replace the one-box substring heuristic in toolCapable() with the research-validated seam (F2/F3/F9-3: tool-calling reliability is a per-model-family parser pairing that must be PROBED, not guessed). Verdicts persist to an evidence ledger that overrides the heuristic, so a routing belief can only change behavior by recorded evidence — the lens-2 gating doctrine applied to routing.

## Behavior
New src/router/conformance.mjs: classifyToolReply(body, wire) is a pure classifier over OpenAI-wire and Ollama-native chat responses -> verdict 'structured'|'text-embedded'|'none'|'error' (detects real tool_calls arrays vs tool-call-shaped text in content); loadVerdicts/saveVerdicts round-trip ~/.cto-brain/conformance.json rows {provider, model, verdict, probedAt}; probeToolConformance(baseUrl, model, wire) sends one canonical single-tool request (provider-agnostic: any OpenAI-compatible /v1/chat/completions or Ollama /api/chat) — live call exercised only env-gated. src/router/capabilities.mjs toolCapable(id, {verdicts}) consults a recorded verdict first and falls back to the existing heuristic unchanged when unprobed.

## Acceptance criteria
- new test/router-conformance.mjs (pure, no network): classifyToolReply fixtures — OpenAI-shape structured tool_calls, Ollama-native message.tool_calls, JSON-call-printed-in-content prose, plain prose, error body — each maps to the documented verdict
- same test: verdict store round-trips in a temp HOME with timestamps; corrupt or absent file degrades to empty verdicts without throwing (fail-open to heuristic, never a crash)
- same test: toolCapable with a verdicts map overrides the heuristic both ways — a heuristic-false coder model recorded 'structured' becomes true, a heuristic-true instruct model recorded 'text-embedded' becomes false; with no store all existing test/router-capabilities.mjs assertions stay green (regression)
- live probe leg env-gated (OLLAMA_LIVE=1 or JARVIS_API_KEY) writing a real verdict row; npm test green offline

## Non-goals
- No vLLM --tool-call-parser flag management (serving config is the operator's; we probe the result)
- No multi-turn/parallel-call/streaming-reassembly matrix this round (single canonical call first; matrix is Phase 4)
- No CLI verb or code.mjs picker wiring this round — registration lands with the Phase-2 code-any-provider integrating commit to keep file scopes disjoint
- No automatic re-probe scheduling or TTL policy

## Frozen contracts
- File scope (exclusive this round): new src/router/conformance.mjs, src/router/capabilities.mjs; new test/router-conformance.mjs (CLI verb registration deferred to the Phase-2 integrating commit so bin/cto-brain.mjs stays owned by round-close-outcome-telemetry this round)
- Tests are dependency-free node scripts (ok()/failures pattern); suite green offline.
