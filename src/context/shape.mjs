// Graduated compaction ladder — layers 1-2, the cheapest-first shapers.
//
// Per the agent-design-space lens ("The 5 pre-model context shapers" /
// surface-audit Surface-2 "Context mgmt"): before a generation call, bound the
// context so an unbounded payload can't crash a local-model call — the concrete
// failure this defends against is the "262k default ctx broke the 30s timeout".
//
// This module encodes ONLY the two cheapest, highest-value rungs of the ladder:
//   1. Budget reduction — cap each item to `perItemCap` bytes; oversized items
//      are truncated and get an elision marker noting the bytes elided.
//   2. Snip — trim the OLDEST items first until the whole payload fits
//      `totalBudget` bytes, preserving the NEWEST items (freshest before
//      generation) and NEVER dropping the system/first item.
//
// Pure and deterministic: no I/O, no clock, no randomness, no mutation of the
// caller's array. What was cut is recorded (`dropped`, `truncated`) so the
// decision is forensically auditable — the lens's append-only principle (#6).

const byteLen = (s) => Buffer.byteLength(s, "utf8");

// Longest prefix of `str` whose UTF-8 byte length is <= maxBytes. Never splits a
// multi-byte character (walks back off a partial trailing sequence).
function bytePrefix(str, maxBytes) {
  if (byteLen(str) <= maxBytes) return str;
  let end = Math.min(str.length, maxBytes); // upper bound: 1 char >= 1 byte
  while (end > 0 && byteLen(str.slice(0, end)) > maxBytes) end--;
  return str.slice(0, end);
}

/**
 * Shape a context payload to fit a local-model budget.
 *
 * @param {object}   opts
 * @param {Array<{role?:string, text:string}>} opts.items  Ordered oldest→newest.
 * @param {number}  [opts.perItemCap=Infinity]  Max UTF-8 bytes kept per item.
 * @param {number}  [opts.totalBudget=Infinity] Max total UTF-8 bytes for the payload.
 * @returns {{items:Array, dropped:Array, truncated:Array}}
 *   `items`     — surviving items in original order, truncations applied.
 *   `truncated` — [{index, role, keptBytes, elidedBytes}] (original indices).
 *   `dropped`   — [{index, role, bytes}] snipped whole (original indices).
 */
export function shapeContext({ items = [], perItemCap = Infinity, totalBudget = Infinity } = {}) {
  const truncated = [];
  const dropped = [];

  // --- Layer 1: per-item budget reduction (cap oversized items) ---
  // Keep the original index alongside so the ledgers stay honest after snips.
  const capped = items.map((it, index) => {
    const text = String(it.text ?? "");
    const original = byteLen(text);
    if (original <= perItemCap) return { index, item: { ...it, text } };
    const kept = bytePrefix(text, perItemCap);
    const elidedBytes = original - byteLen(kept);
    truncated.push({ index, role: it.role, keptBytes: byteLen(kept), elidedBytes });
    return { index, item: { ...it, text: `${kept} […+${elidedBytes}B elided]` } };
  });

  // --- Layer 2: snip oldest-first until the payload fits totalBudget ---
  // Index 0 (system/first) is never dropped; drop from the oldest non-protected
  // end so the newest items survive longest. Degrades to system-only, never past.
  const survives = capped.map(() => true);
  const totalBytes = () =>
    capped.reduce((n, c, i) => (survives[i] ? n + byteLen(c.item.text) : n), 0);

  for (let i = 1; i < capped.length && totalBytes() > totalBudget; i++) {
    survives[i] = false;
    dropped.push({ index: capped[i].index, role: capped[i].item.role, bytes: byteLen(capped[i].item.text) });
  }

  return {
    items: capped.filter((_, i) => survives[i]).map((c) => c.item),
    dropped,
    truncated,
  };
}
