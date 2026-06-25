# Production readiness

A three-reviewer audit (security / tech-lead / devil's-advocate) + a
clean-checkout install smoke test of **v0.7.0** returned **GO for production**,
with the honest limitations below. This page is the deployment truth source.

## Verdict

| Lens | Verdict |
|------|---------|
| Security | **GO** — no findings. Loopback-default HTTP, Origin/DNS-rebinding 403 guard, ledger-field sanitization, gate-before-read synthesis, telemetry records metadata only, `files` allowlist keeps secrets/node_modules out of the tarball, `prepublishOnly` gate. |
| Tech-lead | **GO** — 20 test suites / ~270 assertions, defensive renderers, clean top-level error handling, correct release hygiene. |
| Devil's-advocate | **GO with caveats** — 3 operational gaps below; none architectural, all fixable. |
| Install smoke | **PASS** — packaged tarball installs with its one dependency and runs every surface (eval 11/11). |

## Known limitations (read before deploying)

The three gaps from the first audit are now fixed or mitigated (v0.9.0).

1. **Telemetry rotation — FIXED.** `runs.jsonl` now rotates to `runs.jsonl.1`
   once it passes a size cap (default 5 MB, override `CTO_BRAIN_TELEMETRY_MAX_BYTES`);
   `telemetry summary` spans both files. One backup is kept, so history older than
   the last rotation is dropped by design — wire a log drain if you need it all.
   Opt out entirely with `CTO_BRAIN_NO_TELEMETRY=1`.

2. **Model availability — FIXED (surfaced).** A route now carries
   `modelAvailable` (`true` / `false` / `null`) and appends a `WARNING:` to its
   `reason` when the chosen model isn't in the probed provider's model list, so
   you see it before dispatch instead of failing at the provider. It does not
   hard-refuse (a valid model the probe didn't list shouldn't be blocked); check
   `modelAvailable !== false` in dispatch code, or pull the tag / fix `router.json`.

3. **HTTP telemetry under heavy concurrency — MITIGATED.** Each event is a single
   atomic line append (writes interleave by whole lines, never torn) and
   `summarize` skips any unparseable line, so concurrent writers don't corrupt the
   summary. Counts can still be lossy under extreme load; routing itself is pure
   and unaffected. *Still future:* a centralized/locked sink for large fleets.

## Deploying the HTTP service safely

`cto-brain mcp --transport=http` binds **127.0.0.1** with **no auth** (loopback
is the trust boundary). For any remote exposure: front it with a TLS terminator
+ auth proxy, pass the public host via `--allow-origin`, and treat telemetry as
local-only. Do not expose it directly to the internet.

## Pre-publish checklist

```bash
npm run ci                 # gate + 20 suites + eval gate (must be green)
npm pack --dry-run         # only intended files; no test/ .cto-brain/ node_modules
node scripts/benchmark-self.mjs
# clean-room: install the tarball in a temp dir and run cto-brain doctor/eval
```
Publish path + 2FA: see [PUBLISH.md](./PUBLISH.md). npm versions are immutable —
bump, never republish; don't double-arm manual publish AND the tag workflow.
