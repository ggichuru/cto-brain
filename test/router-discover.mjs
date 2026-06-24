import { discoverLocal, DISCOVERY_TARGETS } from "../src/router/discover.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

ok("discovery targets defined", DISCOVERY_TARGETS.length >= 4);

const found = await discoverLocal({
  host: "127.0.0.1",
  timeoutMs: 300,
  env: {
    OLLAMA_HOST: "http://127.0.0.1:59997",
    DESK_ENGINE_URL: "http://127.0.0.1:59996",
  },
});

ok("discover returns array", Array.isArray(found));
for (const item of found) {
  ok(`discovered ${item.id} reachable`, item.reachable === true);
  ok(`discovered ${item.id} has id`, typeof item.id === "string");
}

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-discover checks passed.");
