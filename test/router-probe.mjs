import { probeProvider, tcpReachable } from "../src/router/probe.mjs";
import { getProvider } from "../src/router/providers.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

let threw = false;
try {
  const r = await probeProvider(getProvider("ollama"), {
    url: "http://127.0.0.1:59999",
    timeoutMs: 300,
  });
  ok("probe unreachable host no throw", true);
  ok("unreachable returns reachable false", r.reachable === false);
  ok("unreachable has reason", typeof r.reason === "string" && r.reason.length > 0);
  ok("unreachable honest", r.honest === true);
} catch (err) {
  threw = true;
  console.error("FAIL: probe threw", err.message);
  failures++;
}

ok("probe did not throw", !threw);

const stub = await probeProvider(getProvider("cursor"));
ok("cursor stub status", stub.status === "stub");
ok("cursor stub not reachable", stub.reachable === false);

const noKey = await probeProvider(getProvider("anthropic"), { env: {} });
ok("anthropic no key down", noKey.status === "down");
ok("anthropic no key reason mentions key", noKey.reason.includes("API key"));

const openai = getProvider("openai");
const openaiProbe = await probeProvider(openai, {
  env: { OPENAI_API_KEY: "test" },
  timeoutMs: 500,
});
ok("openai with key attempts reach", openaiProbe.honest === true);

const tcp = await tcpReachable("127.0.0.1", 59998, 300);
ok("tcp unreachable returns false", tcp === false);

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-probe checks passed.");
