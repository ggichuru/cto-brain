import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { connectStack, buildProbeIndex } from "../src/router/stack.mjs";
import { probeStack } from "../src/router/probe.mjs";
import { initRouterConfig } from "../src/router/config.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const deskDown = await probeStack(
  { id: "desk-test", url: "http://127.0.0.1:59995", type: "desk" },
  { timeoutMs: 300 }
);
ok("desk unreachable not reachable", deskDown.reachable === false);
ok("desk unreachable has status", typeof deskDown.status === "string");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-stack-"));
initRouterConfig({ cwd: tmp });

const status = await connectStack({ cwd: tmp, timeoutMs: 300 });
ok("connectStack has stacks", Array.isArray(status.stacks));
ok("connectStack has summary", status.summary.total === status.stacks.length);
ok("connectStack summary fields", typeof status.summary.reachable === "number");

const index = await buildProbeIndex({ cwd: tmp, timeoutMs: 300 });
ok("buildProbeIndex report", !!index.report);
ok("buildProbeIndex probes array", Array.isArray(index.probes));
ok("buildProbeIndex configPath", typeof index.report.configPath === "string");

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-stack checks passed.");
