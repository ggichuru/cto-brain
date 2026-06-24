import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gateCheck } from "../src/gate/pack.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-gate-"));
fs.mkdirSync(path.join(tmp, "skills", "clean"), { recursive: true });
fs.writeFileSync(
  path.join(tmp, "skills", "clean", "SKILL.md"),
  "---\nname: clean\ndescription: test\n---\n\nok\n",
  "utf8"
);

const clean = gateCheck(tmp);
ok("clean brain passes gate", clean.ok === true);

fs.writeFileSync(path.join(tmp, "credentials.json"), "{}", "utf8");
const dirty = gateCheck(tmp);
ok("credential file fails gate", dirty.ok === false);

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll gate-no-secrets checks passed.");
