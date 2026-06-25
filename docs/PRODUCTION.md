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

These are honest gaps, each tracked as a next brick. Workarounds given.

1. **Telemetry has no rotation.** `~/.cto-brain/telemetry/runs.jsonl` is
   append-only and `telemetry summary` reads the whole file. Fine for months of
   normal use; at very high volume it grows unbounded.
   *Workaround:* rotate/truncate `runs.jsonl` on a cron, or set
   `CTO_BRAIN_NO_TELEMETRY=1`. *Next brick:* size-based rotation.

2. **The router can select a model that isn't installed.** When a stack is
   probed but the configured default model tag isn't present, the route is
   returned honestly (`honest: true`) but a dispatch to that exact model will
   fail at the provider. The probe's `models[]` is included so callers can check.
   *Workaround:* validate the chosen `model` against `router probe` output before
   dispatching, or set `router.json` models to tags you've pulled. *Next brick:*
   post-probe model-availability validation.

3. **HTTP telemetry is best-effort under heavy concurrency.** The Streamable-HTTP
   transport is fine for normal use, but many concurrent clients contend on the
   single local JSONL telemetry file, so summaries can be lossy/out-of-order.
   The routing itself is pure and unaffected. *Workaround:* keep concurrent
   clients modest, or disable telemetry on a shared HTTP service. *Next brick:*
   centralized/locked telemetry sink.

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
