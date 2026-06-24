import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSkillNames, bundledSkillsDir } from "../src/paths.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const skills = listSkillNames(bundledSkillsDir());
ok("bundled skills exist", skills.length >= 4);

for (const name of skills) {
  const md = fs.readFileSync(path.join(bundledSkillsDir(), name, "SKILL.md"), "utf8");
  ok(`${name} has frontmatter`, md.startsWith("---"));
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  ok(`${name} frontmatter parse`, !!m);
  if (m) {
    ok(`${name} has name:`, /name:\s*\S+/.test(m[1]));
    ok(`${name} has description`, /description:\s*.+/.test(m[1]));
    ok(`${name} description length`, m[1].length < 4096);
  }
}

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll skills-valid checks passed.");
