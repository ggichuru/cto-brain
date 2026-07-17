// Graduated compaction ladder, layers 1-2 — cap + oldest-first snip.
// Defends a local-model floor against unbounded context (the "262k default ctx
// broke the 30s timeout" failure). Pure, deterministic; isolated to no I/O.
import { shapeContext } from "../src/context/shape.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}
const bytes = (s) => Buffer.byteLength(s, "utf8");

// --- (a) budget reduction: an oversized item is truncated to the cap and
// replaced with an elision marker noting bytes elided ---
{
  const items = [
    { role: "system", text: "SYS" },
    { role: "user", text: "x".repeat(1000) },
  ];
  const out = shapeContext({ items, perItemCap: 100, totalBudget: 1e9 });
  ok("(a) both items survive (nothing snipped)", out.items.length === 2);
  ok("(a) system item untouched", out.items[0].text === "SYS");
  const t = out.items[1].text;
  ok("(a) kept content prefix is the first 100 bytes", t.startsWith("x".repeat(100)));
  ok("(a) marker reports the 900 elided bytes", /elided/i.test(t) && t.includes("900"));
  ok("(a) truncated ledger has one entry for index 1", out.truncated.length === 1 && out.truncated[0].index === 1);
  ok("(a) truncated ledger records elidedBytes=900", out.truncated[0].elidedBytes === 900);
  ok("(a) nothing dropped", out.dropped.length === 0);
}

// --- (b) snip: trim OLDEST items first until under total budget while the
// newest items and the system/first item survive ---
{
  const items = [
    { role: "system", text: "SYS" },      // idx0, 3 bytes — protected
    { role: "user", text: "a".repeat(10) }, // idx1 — oldest
    { role: "user", text: "b".repeat(10) }, // idx2
    { role: "user", text: "c".repeat(10) }, // idx3
    { role: "user", text: "d".repeat(10) }, // idx4
    { role: "user", text: "e".repeat(10) }, // idx5 — newest
  ];
  // Total is 53 bytes; a 30-byte budget forces dropping the three oldest
  // (idx1,2,3), leaving SYS + idx4 + idx5 = 23 bytes.
  const out = shapeContext({ items, perItemCap: 1000, totalBudget: 30 });
  const total = out.items.reduce((n, it) => n + bytes(it.text), 0);
  ok("(b) result fits the total budget", total <= 30);
  ok("(b) system/first item survives", out.items[0].text === "SYS");
  ok("(b) newest item survives", out.items[out.items.length - 1].text === "e".repeat(10));
  ok("(b) three oldest were dropped", out.dropped.map((d) => d.index).sort((a, b) => a - b).join(",") === "1,2,3");
  ok("(b) survivors kept in original order", out.items.map((it) => it.text[0]).join("") === "Sde");
  ok("(b) nothing truncated", out.truncated.length === 0);
}

// --- (b2) system/first item is NEVER dropped, even when it alone blows the
// budget — the guard degrades to system-only, it does not discard it ---
{
  const items = [
    { role: "system", text: "S".repeat(100) },
    { role: "user", text: "u".repeat(100) },
  ];
  const out = shapeContext({ items, perItemCap: 1000, totalBudget: 10 });
  ok("(b2) system item is retained", out.items.some((it) => it.text.startsWith("S")));
}

// --- (c) an already-small payload passes through unchanged ---
{
  const items = [
    { role: "system", text: "you are helpful" },
    { role: "user", text: "hi" },
    { role: "assistant", text: "hello" },
  ];
  const out = shapeContext({ items, perItemCap: 1000, totalBudget: 1000 });
  ok("(c) items pass through unchanged", JSON.stringify(out.items) === JSON.stringify(items));
  ok("(c) nothing dropped", out.dropped.length === 0);
  ok("(c) nothing truncated", out.truncated.length === 0);
}

// --- (d) determinism: same input -> byte-identical output ---
{
  const items = [
    { role: "system", text: "SYS" },
    { role: "user", text: "z".repeat(500) },
    { role: "user", text: "y".repeat(40) },
    { role: "user", text: "w".repeat(40) },
  ];
  const args = { items, perItemCap: 64, totalBudget: 120 };
  const a = shapeContext(args);
  const b = shapeContext(args);
  ok("(d) deterministic output", JSON.stringify(a) === JSON.stringify(b));
  ok("(d) input array not mutated", items[1].text === "z".repeat(500));
}

if (failures) { console.error("\n" + failures + " context-shape failure(s)"); process.exit(1); }
console.log("\nAll context-shape checks passed.");
