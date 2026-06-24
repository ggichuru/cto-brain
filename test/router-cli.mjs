import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TASK_KINDS } from "../src/router/select.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const bin = path.join(root, "bin", "cto-brain.mjs");

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

function run(args, opts = {}) {
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    cwd: opts.cwd,
    env: opts.env || process.env,
  });
}

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "cto-cli-home-"));
const tmpProj = fs.mkdtempSync(path.join(os.tmpdir(), "cto-cli-proj-"));
const env = { ...process.env, CTO_BRAIN_HOME: path.join(tmpHome, ".cto-brain") };

const homeInit = run(["init"], { env });
ok("init for doctor exits 0", homeInit.status === 0);

const list = run(["router", "list"], { env, cwd: tmpProj });
ok("router list exits 0", list.status === 0);
ok("router list has ollama", list.stdout.includes("ollama"));

const init = run(["router", "init"], { env, cwd: tmpProj });
ok("router init exits 0", init.status === 0);
ok("router.json created", fs.existsSync(path.join(tmpProj, ".cto-brain", "router.json")));

const sysRouterInit = run(["router", "init", "--system"], { env });
ok("router init --system exits 0", sysRouterInit.status === 0);
ok("system router.json created", fs.existsSync(path.join(env.CTO_BRAIN_HOME, "router.json")));

const plan = run(["router", "plan"], { env, cwd: tmpProj });
ok("router plan exits 0", plan.status === 0);
const planJson = JSON.parse(plan.stdout);
ok("router plan has all task kinds", TASK_KINDS.every((k) => planJson.tasks[k]));
ok("router plan prefer auto default", planJson.prefer === "auto");

const probe = run(["router", "probe"], { env, cwd: tmpProj });
ok("router probe exits 0", probe.status === 0);
ok("router probe valid json", (() => {
  try {
    JSON.parse(probe.stdout);
    return true;
  } catch {
    return false;
  }
})());

const selectLocal = run(
  ["router", "select", "--task", "dispatch-builder", "--prefer", "local"],
  { env: { ...env, ANTHROPIC_API_KEY: "" }, cwd: tmpProj }
);
ok("router select local exits 0", selectLocal.status === 0);
const routeLocal = JSON.parse(selectLocal.stdout);
ok("select local honest", routeLocal.honest === true);
ok("select local has task", routeLocal.task === "dispatch-builder");

const selectCloud = run(
  ["router", "select", "--task", "reviewer-security", "--prefer", "cloud"],
  {
    env: { ...env, ANTHROPIC_API_KEY: "test-key-for-cli" },
    cwd: tmpProj,
  }
);
ok("router select cloud exits 0", selectCloud.status === 0);
const routeCloud = JSON.parse(selectCloud.stdout);
ok("select cloud picks anthropic", routeCloud.provider === "anthropic");
ok("select cloud model not ollama sonnet bleed", routeCloud.model !== "sonnet" || routeCloud.provider === "anthropic");

const stack = run(["stack", "status"], { env, cwd: tmpProj });
ok("stack status exits 0", stack.status === 0);
const stackJson = JSON.parse(stack.stdout);
ok("stack status summary", stackJson.summary.total >= 1);

const doctor = run(["doctor", "--strict"], { env });
ok("doctor --strict exits 0", doctor.status === 0);

fs.rmSync(tmpHome, { recursive: true, force: true });
fs.rmSync(tmpProj, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-cli checks passed.");
