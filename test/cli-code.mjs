import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseCodeArgs, resolveExecutable } from "../src/cli/code.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-code-test-"));
const nodeBin = path.join(tmp, "node-bin");
const pathBin = path.join(tmp, "path-bin");
fs.mkdirSync(nodeBin);
fs.mkdirSync(pathBin);

const opencode = path.join(nodeBin, "opencode");
fs.writeFileSync(opencode, "#!/bin/sh\nexit 0\n");
fs.chmodSync(opencode, 0o755);

ok("parse passthrough survives --", parseCodeArgs(["code", "--model", "qwen2.5:7b", "--", "run", "hi"]).passthrough.join(" ") === "run hi");
ok("resolves executable next to node when PATH misses it", resolveExecutable("opencode", { env: { PATH: pathBin }, execPath: path.join(nodeBin, "node") }) === opencode);
ok("missing executable returns null", resolveExecutable("definitely-missing", { env: { PATH: pathBin }, execPath: path.join(nodeBin, "node") }) === null);

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll cli-code checks passed.");
