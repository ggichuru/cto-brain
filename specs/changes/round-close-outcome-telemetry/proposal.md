# Change: round-close-outcome-telemetry

**Status:** FROZEN 2026-07-11 for the ultracode Phase-1 build (source: judge-panel ultraplan over 3 lenses + verified research docs/research/2026-07-11-local-coding-agent-stacks.md).

## Intent
The cost-per-outcome leg shipped in 0.10.0 is dead code today — verified: recordEvent supports outcome/tokensIn/tokensOut but no caller in src/ passes them, so telemetry summary outcomes is always empty. Wire outcome recording at the natural boundary (round-close) so every closed round accrues a quantitative row and the learning loop's missing quantitative leg goes live.

## Behavior
`cto-brain round-close` gains --outcome <tag> (default 'round-closed'), --tokens-in <n>, --tokens-out <n>; roundClose() calls recordEvent({kind:'round_close', outcome, tokensIn, tokensOut, ok:true}) best-effort so telemetry failure never breaks the ritual. The round_close MCP tool in src/mcp/tools.mjs passes the same optional fields through its schema. `telemetry summary` then shows non-empty tokensPerOutcome after any round.

## Acceptance criteria
- new test/round-close-outcome.mjs: roundClose with a temp CTO_BRAIN home + outcome fields appends a runs.jsonl row with kind=round_close, outcome, tokensIn/tokensOut; summarize() over that home reports outcomes[tag].count=1 and correct tokensPerOutcome
- same test: roundClose with CTO_BRAIN_NO_TELEMETRY=1 still writes the growth ledger row and returns ok (telemetry never breaks the ritual)
- same test: omitting token flags records the outcome row without token fields — schema tolerant, no NaN
- test/mcp-server.mjs extended: round_close tool schema advertises the optional outcome/token fields; npm test green end-to-end with the new suite line in package.json

## Non-goals
- No automatic token counting from model responses (callers pass what they know)
- No pricing/currency conversion — tokens only
- No changes to summarize() (verified: it already handles outcomes)

## Frozen contracts
- File scope (exclusive this round): src/cli/round-close.mjs, src/mcp/tools.mjs (round_close passthrough only), bin/cto-brain.mjs (flag parsing); new test/round-close-outcome.mjs
- Tests are dependency-free node scripts (ok()/failures pattern); suite green offline.
