# cto-brain console — read-only control plane

A single self-contained web page over the brain's live operational state:
routing matrix, stack/provider reachability, adapter wiring, telemetry (incl.
cost-per-outcome), the eval scorecard, the portfolio map, and the growth ledger.

```bash
cto-brain console                 # http://127.0.0.1:7799 (loopback-only)
cto-brain console --port 8080
cto-brain console --prefer local  # recompute the routing matrix for a tier
```

Open the URL it prints. The page server-renders (works with JS off) and, with
JS on, refreshes every 15s from `/api/cards`.

## Read-only by design

The console is a **window, not a second set of hands.** It never mutates the
brain — no config writes, no memory edits, no adapter wiring, no telemetry
records. Every change still flows through the `cto-brain` CLI and the gated
channels, where side effects are authorized and audited. This mirrors the
Ubongo charter's rule ("actions live in channels, never on the face") and is
why the server accepts **GET only** — a `POST`/`PUT`/anything-else returns 405.

## Security posture

- **Loopback by default** (`127.0.0.1`). Binding a non-loopback `--host` with no
  `--allow-origin` prints a loud warning — prefer a `tailscale serve` front.
- **Origin allowlist** blocks DNS-rebinding: a no-Origin request (curl / native)
  is allowed; a disallowed cross-origin browser request gets **403**.
- **Fully self-contained**: no CDN, web fonts, or remote assets — nothing leaves
  the machine, and the page renders air-gapped.

## Routes (all GET, all read-only)

| Route | Returns |
|-------|---------|
| `/` | the HTML page (server-rendered cards + inline styles) |
| `/api/state` | the full state JSON (the frozen contract below) |
| `/api/cards` | the pre-rendered cards HTML fragment (what the refresh swaps in) |
| `/healthz` | `{ "ok": true }` |

Add `?prefer=local|cloud|auto` to `/`, `/api/state`, `/api/cards` to recompute
the routing matrix for that tier.

## Frozen contract — `/api/state`

```
{ generated, version, prefer, router, stacks, adapters,
  telemetry, eval, portfolio, ledger }
```

Every section is either its data or an honest `{ error: "<reason>" }` island —
one unreadable source degrades that card, never the page.
