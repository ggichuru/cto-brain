// Regression: `doctor` must report skill CURRENCY, not just presence.
//
// Until 2026-09-11 the bundled-skill loop stopped at "skill present: <name>". Four
// bundled skills sat 1-3 minor versions behind the system brain for 53 days — including
// agentic-learning-loop at package 0.1.0 vs system 0.3.3 — while doctor printed nine
// green lines and a release would have shipped the old doctrine.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readSkillVersion, compareSkillVersion } from "../src/cli/doctor.mjs";

let failures = 0;
function ok(label, cond, detail) {
  if (!cond) {
    console.error("FAIL:", label, detail === undefined ? "" : `— ${detail}`);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-currency-"));
const write = (name, body) => {
  const f = path.join(tmp, name);
  fs.writeFileSync(f, body);
  return f;
};

const skill = (v) =>
  `---\nname: x\n---\n\n# x\n\n> **Version ${v}** — 2026-09-11. Body text.\n\nRest of the skill.\n`;

// --- version parsing -----------------------------------------------------------------
ok("reads a version header", readSkillVersion(write("a.md", skill("0.6.2"))) === "0.6.2");
ok("returns null with no header", readSkillVersion(write("b.md", "# plain\n\nno version\n")) === null);
ok("returns null for a missing file", readSkillVersion(path.join(tmp, "nope.md")) === null);

// --- the defect this guards ----------------------------------------------------------
{
  const bundled = write("pkg-stale.md", skill("0.1.0"));
  const system = write("sys-new.md", skill("0.3.3"));
  const d = compareSkillVersion(bundled, system);
  ok("package behind system -> stale", d.stale === true, JSON.stringify(d));
  ok("stale names both versions", d.bundled === "0.1.0" && d.system === "0.3.3", JSON.stringify(d));
  ok("stale is not also ahead", d.ahead === false);
}

// --- minor-version drift must count (0.6.1 vs 0.6.2 is the real case) ----------------
{
  const d = compareSkillVersion(write("p61.md", skill("0.6.1")), write("s62.md", skill("0.6.2")));
  ok("single minor bump is detected", d.stale === true, JSON.stringify(d));
}

// --- equal versions are clean --------------------------------------------------------
{
  const d = compareSkillVersion(write("p-eq.md", skill("0.2.3")), write("s-eq.md", skill("0.2.3")));
  ok("equal versions -> not stale", d.stale === false && d.ahead === false, JSON.stringify(d));
  ok("equal versions -> no unversioned-divergence noise", d.divergedUnversioned === false);
}

// --- the other direction: system needs a pull ---------------------------------------
{
  const d = compareSkillVersion(write("p-new.md", skill("1.0.0")), write("s-old.md", skill("0.9.9")));
  ok("package ahead of system -> ahead", d.ahead === true && d.stale === false, JSON.stringify(d));
}

// --- uneven version lengths must not mis-rank ---------------------------------------
{
  const d = compareSkillVersion(write("p-short.md", skill("0.2")), write("s-long.md", skill("0.2.1")));
  ok("0.2 is behind 0.2.1", d.stale === true, JSON.stringify(d));
  const d2 = compareSkillVersion(write("p-10.md", skill("0.10.0")), write("s-9.md", skill("0.9.0")));
  ok("0.10.0 outranks 0.9.0 (numeric, not lexical)", d2.ahead === true, JSON.stringify(d2));
}

// --- unversioned files still surface drift ------------------------------------------
{
  const d = compareSkillVersion(write("u1.md", "# x\n\nalpha\n"), write("u2.md", "# x\n\nbeta\n"));
  ok("no version header + different content -> divergedUnversioned", d.divergedUnversioned === true, JSON.stringify(d));
  const same = compareSkillVersion(write("u3.md", "# x\n\nsame\n"), write("u4.md", "# x\n\nsame\n"));
  ok("no version header + identical content -> clean", same.divergedUnversioned === false);
}

fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error(`\ndoctor-skill-currency: ${failures} failure(s)`);
  process.exit(1);
}
console.log("\ndoctor-skill-currency: all checks passed");
