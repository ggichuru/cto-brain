# cto-brain eval harness

The eval harness scores cto-brain's **own decisions** against a declarative
case suite and emits a scorecard (pass rate per dimension) — not just
pass/fail. It complements the unit tests: the unit tests prove functions work;
the eval proves the *policy* behaves as specified, measurably, over time.

It is deterministic and hermetic — routing cases use mock probes + a fixed env
(no network); gate cases use a throwaway temp dir.

## Run

```bash
cto-brain eval        # prints the scorecard JSON; exits 1 if any case fails
```

Also runs in CI: `npm run ci` = gate check + test suites + `cto-brain eval`, so
a routing or gate-policy regression fails the release.

## Dimensions

| Dimension | What it checks |
|-----------|----------------|
| `routing` | task→provider/tier selection is correct (builder→local ollama, reviewer-security→cloud anthropic with a key, research→openai, inline-edit→local, cloud-prefer-without-keys falls back to local) |
| `honesty` | the router never fabricates a route — nothing reachable + no keys → `provider: null` with `honest: true`; unknown task → `null`, honest |
| `gate` | the credential gate flags `credentials.json`, `id_rsa`, and secrets embedded in a `SKILL.md`; a clean dir passes |

## Scorecard shape

```json
{
  "generated": "<ISO timestamp>",
  "total": 11, "passed": 11, "failed": 0, "passRate": 1,
  "byDimension": { "routing": { "passed": 5, "total": 5, "passRate": 1 }, ... },
  "cases": [ { "name": "...", "dimension": "routing", "kind": "route", "pass": true, "expect": {...}, "actual": {...}, "detail": "ok" } ]
}
```

## Extend

Add a case to `src/eval/cases.mjs`:

```js
{ name: "...", dimension: "routing", kind: "route",
  input: { task, prefer, probes: [{id, reachable:true, models:["m"]}], env: {} },
  expect: { provider: "...", tier: "...", honest: true } }
```

`kind: "route"` cases call `selectRoute(input)` and compare only the keys
present in `expect`. `kind: "gate"` cases take `input.files` (relative path →
content), write them to a temp dir, and check `gateCheck(dir).ok`.

The same scorecard is available to agents via the `eval_run` MCP tool. Runner
lives in `src/eval/runner.mjs`; cases in `src/eval/cases.mjs`.
