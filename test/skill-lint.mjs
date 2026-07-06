import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lintSkills } from "../src/gate/skill-lint.mjs";
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-lint-"));
const skills = path.join(tmp, "skills");

function writeSkill(dir, content) {
  fs.mkdirSync(path.join(skills, dir), { recursive: true });
  if (content !== null) fs.writeFileSync(path.join(skills, dir, "SKILL.md"), content, "utf8");
}

// RED-first shapes: each fixture pins one rule.
writeSkill("good-skill", "---\nname: good-skill\ndescription: Use when testing the linter fires correctly.\n---\n\nbody\n");
writeSkill("no-md", null); // dir without SKILL.md — invisible to listSkillNames, lint must catch it
writeSkill("name-mismatch", "---\nname: other-name\ndescription: Use when checking name equals directory.\n---\n\nbody\n");
writeSkill("Bad_Case", "---\nname: Bad_Case\ndescription: Use when checking kebab-case enforcement.\n---\n\nbody\n");
writeSkill("no-desc", "---\nname: no-desc\n---\n\nbody\n");
writeSkill("long-desc", `---\nname: long-desc\ndescription: Use when ${"x".repeat(1100)}\n---\n\nbody\n`);
writeSkill("no-trigger", "---\nname: no-trigger\ndescription: A tool that does things with files.\n---\n\nbody\n");
writeSkill("unknown-key", "---\nname: unknown-key\ndescription: Use when checking unknown frontmatter keys warn.\nversion: 1.0\n---\n\nbody\n");
writeSkill("long-body", `---\nname: long-body\ndescription: Use when checking the body-length recommendation.\n---\n\n${"line\n".repeat(600)}`);
writeSkill("markers", "---\nname: markers\ndescription: Use when checking leftover-marker detection.\n---\n\nTODO finish this\n");

const r = lintSkills(skills);
const errFor = (skill) => r.errors.filter((e) => e.skill === skill);
const warnFor = (skill) => r.warnings.filter((w) => w.skill === skill);

ok("good skill has no errors", errFor("good-skill").length === 0);
ok("good skill has no warnings", warnFor("good-skill").length === 0);
ok("missing SKILL.md is an error", errFor("no-md").some((e) => /missing/.test(e.msg)));
ok("name != dir is an error", errFor("name-mismatch").some((e) => /!=/.test(e.msg)));
ok("non-kebab name is an error", errFor("Bad_Case").some((e) => /kebab/.test(e.msg)));
ok("missing description is an error", errFor("no-desc").some((e) => /description/.test(e.msg)));
ok("over-cap description is a warning not an error", warnFor("long-desc").some((w) => /1024/.test(w.msg)) && errFor("long-desc").length === 0);
ok("trigger-less description warns", warnFor("no-trigger").some((w) => /trigger/.test(w.msg)));
ok("spec-unknown key warns", warnFor("unknown-key").some((w) => /version/.test(w.msg)));
ok("body > 500 lines warns", warnFor("long-body").some((w) => /500/.test(w.msg)));
ok("leftover TODO warns", warnFor("markers").some((w) => /TODO/.test(w.msg)));

// gateCheck integration: structural errors block the gate; warnings do not.
const gate = gateCheck(tmp);
ok("gate fails on structural skill errors", gate.ok === false);
ok("gate problems carry skill-structure type", gate.problems.some((p) => p.type === "skill-structure"));
ok("gate exposes lintWarnings", Array.isArray(gate.lintWarnings) && gate.lintWarnings.length > 0);

// a clean home passes with warnings surfaced but ok=true
const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), "cto-brain-lint2-"));
fs.mkdirSync(path.join(tmp2, "skills", "clean"), { recursive: true });
fs.writeFileSync(
  path.join(tmp2, "skills", "clean", "SKILL.md"),
  "---\nname: clean\ndescription: A tool for doing things with files.\n---\n\nbody\n",
  "utf8"
);
const gate2 = gateCheck(tmp2);
ok("warnings alone do not fail the gate", gate2.ok === true && gate2.lintWarnings.length === 1);

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll skill-lint checks passed.");
