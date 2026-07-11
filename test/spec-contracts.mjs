import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldChange, checkSpecs } from "../src/spec/contract.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(repoRoot, "templates", "spec");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-spec-"));

// --- scaffoldChange ---

const made = scaffoldChange({ id: "add-widget", root: tmp, templatesDir });
const changeDir = path.join(tmp, "specs", "changes", "add-widget");
ok("scaffold returns the change dir", made.dir === changeDir);
ok("scaffold creates proposal.md", fs.existsSync(path.join(changeDir, "proposal.md")));
ok("scaffold creates tasks.md", fs.existsSync(path.join(changeDir, "tasks.md")));

const proposal = fs.readFileSync(path.join(changeDir, "proposal.md"), "utf8");
ok("proposal carries the required sections", ["## Intent", "## Behavior", "## Acceptance criteria", "## Non-goals"].every((s) => proposal.includes(s)));
ok("proposal is stamped with the change id", proposal.includes("add-widget"));

let clobbered = false;
try {
  scaffoldChange({ id: "add-widget", root: tmp, templatesDir });
  clobbered = true;
} catch {}
ok("re-init of an existing change id throws (no clobber)", !clobbered);

// --- checkSpecs ---

// The scaffolded proposal has required sections but empty bodies — it must
// NOT pass as-is (empty sections are errors), so fill it to make a good one.
const good = proposal
  .replace("## Intent\n", "## Intent\nShip the widget.\n")
  .replace("## Behavior\n", "## Behavior\nWidget widgets.\n")
  .replace("## Acceptance criteria\n", "## Acceptance criteria\n- test green\n")
  .replace("## Non-goals\n", "## Non-goals\n- no gadgets\n");
fs.writeFileSync(path.join(changeDir, "proposal.md"), good);

const pass = checkSpecs({ root: tmp });
ok("check ok on a complete proposal", pass.ok === true && pass.checked === 1 && pass.errors.length === 0);

// Missing section
const missingDir = path.join(tmp, "specs", "changes", "no-nongoals");
fs.mkdirSync(missingDir, { recursive: true });
fs.writeFileSync(
  path.join(missingDir, "proposal.md"),
  "# x\n\n## Intent\nyes\n\n## Behavior\nyes\n\n## Acceptance criteria\n- yes\n"
);
const miss = checkSpecs({ root: tmp });
ok("check flags a missing section", miss.ok === false && miss.errors.some((e) => e.file.includes("no-nongoals") && e.missing?.includes("## Non-goals")));

// Empty section
fs.writeFileSync(
  path.join(missingDir, "proposal.md"),
  "# x\n\n## Intent\n\n## Behavior\nyes\n\n## Acceptance criteria\n- yes\n\n## Non-goals\n- none\n"
);
const empty = checkSpecs({ root: tmp });
ok("check flags an empty section", empty.ok === false && empty.errors.some((e) => e.empty?.includes("## Intent")));

// No specs dir at all
const bare = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-spec-bare-"));
const none = checkSpecs({ root: bare });
ok("check ok:true checked:0 with no specs dir", none.ok === true && none.checked === 0);

if (failures > 0) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log("All spec-contracts checks passed.");
