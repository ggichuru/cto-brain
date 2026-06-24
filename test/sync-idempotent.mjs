import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncDir } from "../src/sync/non-destructive.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-sync-"));
const a = path.join(tmp, "a");
const b = path.join(tmp, "b");

fs.mkdirSync(a, { recursive: true });
fs.writeFileSync(path.join(a, "one.txt"), "v1", "utf8");
syncDir(a, b);
ok("first copy lands", fs.existsSync(path.join(b, "one.txt")));

// newer on dest — should not overwrite (mtime-wins / rsync -u)
fs.writeFileSync(path.join(b, "one.txt"), "newer-dest", "utf8");
const t = Date.now() + 5000;
fs.utimesSync(path.join(b, "one.txt"), t / 1000, t / 1000);
fs.writeFileSync(path.join(a, "one.txt"), "older-src", "utf8");
syncDir(a, b);
ok("dest newer preserved", fs.readFileSync(path.join(b, "one.txt"), "utf8") === "newer-dest");

// new file on src always copies
fs.writeFileSync(path.join(a, "two.txt"), "two", "utf8");
syncDir(a, b);
ok("new src file copied", fs.readFileSync(path.join(b, "two.txt"), "utf8") === "two");

// never deletes extra on dest
fs.writeFileSync(path.join(b, "orphan.txt"), "stay", "utf8");
syncDir(a, b);
ok("non-destructive: orphan kept", fs.existsSync(path.join(b, "orphan.txt")));

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll sync-idempotent checks passed.");
