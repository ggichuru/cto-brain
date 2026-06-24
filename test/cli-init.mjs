import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-home-"));
const tmpProj = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-proj-"));

const env = {
  ...process.env,
  CTO_BRAIN_HOME: path.join(tmpHome, ".cto-brain"),
};

const initSys = spawnSync(process.execPath, [bin, "init"], { env, encoding: "utf8" });
ok("init exits 0", initSys.status === 0);

const initProj = spawnSync(process.execPath, [bin, "init", "--project", "--name", "demo-proj"], {
  env,
  cwd: tmpProj,
  encoding: "utf8",
});
ok("init --project exits 0", initProj.status === 0);
ok("project .cto-brain exists", fs.existsSync(path.join(tmpProj, ".cto-brain")));
ok("CHARTER.md created", fs.existsSync(path.join(tmpProj, "CHARTER.md")));
ok("router.json created on init --project", fs.existsSync(path.join(tmpProj, ".cto-brain", "router.json")));
ok("system skills dir", fs.existsSync(path.join(env.CTO_BRAIN_HOME, "skills", "cto-orchestration")));

const doctor = spawnSync(process.execPath, [bin, "doctor"], { env, encoding: "utf8" });
ok("doctor exits 0", doctor.status === 0);

fs.rmSync(tmpHome, { recursive: true, force: true });
fs.rmSync(tmpProj, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll cli-init checks passed.");
