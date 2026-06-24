import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  initRouterConfig,
  initSystemRouterConfig,
  loadRouterConfig,
  mergeRouterConfig,
  DEFAULT_ROUTER_CONFIG,
} from "../src/router/config.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-router-"));
const brainDir = path.join(tmp, ".cto-brain");
fs.mkdirSync(brainDir, { recursive: true });

const init = initRouterConfig({ cwd: tmp });
ok("init creates router.json", init.created === true);
ok("router.json exists", fs.existsSync(init.path));

const loaded = loadRouterConfig(tmp);
ok("load finds file", loaded.exists === true);
ok("load has stacks", Array.isArray(loaded.config.stacks) && loaded.config.stacks.length >= 2);
ok("load defaultPrefer auto", loaded.config.routing.defaultPrefer === "auto");

const merged = mergeRouterConfig(DEFAULT_ROUTER_CONFIG, {
  routing: { defaultPrefer: "cloud" },
});
ok("merge overrides prefer", merged.routing.defaultPrefer === "cloud");
ok("merge keeps stacks", merged.stacks.length === DEFAULT_ROUTER_CONFIG.stacks.length);

const second = initRouterConfig({ cwd: tmp });
ok("init without force skips", second.created === false);

const sysHome = path.join(tmp, "system-home");
const sysInit = initSystemRouterConfig({ home: sysHome });
ok("system init creates router.json", sysInit.created === true && sysInit.scope === "system");
ok("system router.json exists", fs.existsSync(path.join(sysHome, "router.json")));

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-config checks passed.");
