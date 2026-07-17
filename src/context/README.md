# context — graduated compaction ladder (layers 1–2)

`shape.mjs` bounds a context payload before a generation call so an unbounded
context cannot crash a local-model call. It defends against the concrete failure
the memory records: *the "262k default ctx broke the 30s timeout"*.

Grounded in the **agent-design-space** lens — "The 5 pre-model context shapers"
and the surface-audit Surface-2 item *"Context mgmt"*. This module encodes only
the two cheapest, highest-value rungs (the right ones for a local model floor):

1. **Budget reduction** — cap each item to `perItemCap` UTF-8 bytes; oversized
   items are truncated and get an elision marker noting the bytes elided.
2. **Snip** — trim the **oldest** items first until the payload fits
   `totalBudget` bytes, preserving the **newest** items and **never** dropping
   the system/first item.

## Usage

```js
import { shapeContext } from "./shape.mjs";

const { items, dropped, truncated } = shapeContext({
  items: [{ role: "system", text: "…" }, { role: "user", text: "…" }],
  perItemCap: 8000,     // bytes kept per item; default Infinity
  totalBudget: 24000,   // total bytes for the payload; default Infinity
});
```

`shapeContext` is a **pure, deterministic** function — no I/O, no clock, no
randomness, and it never mutates the caller's array. What was cut is returned in
`dropped` / `truncated` (original indices) so the decision stays forensically
auditable (the lens's append-only principle #6).

## Wiring status — DEFERRED (intentional)

Shipped standalone. The one real context-assembly seam in this repo is the
OpenAI→Ollama proxy in `src/gateway/bridge.mjs` (the upstream `messages` array,
~line 144). Wiring `shapeContext` there would change the runtime behavior of a
live proxy path that has its own test coverage (`test/gateway-bridge.mjs`), so it
is **not** forced in here — per the build brief's "ship standalone if there's no
clean, low-risk seam." When wired, the natural call site is just before the
upstream request is built, mapping `messages` → `items` (`{role, content}` →
`{role, text}`) and back, with `perItemCap` / `totalBudget` derived from the
target model's context window.
