// Hermetic test for Brick 4 — privacy-first skill synthesis (ADR 0002).
// Builds a temp workspace with a clean SKILL.md, a credentials.json, and a
// .env carrying a fake secret. Asserts gate-before-read SKIPS the credential
// and .env files, that synthesis output is secret-free and path-free, that the
// draft lands under skills-draft/, and that a sabotage secret is REFUSED.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { discoverSkills } from "../src/synth/discover.mjs";
import { synthesizeSkill } from "../src/synth/synthesize.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const FAKE_SECRET = "sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

// --- build hermetic temp workspace ---
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "synth-test-"));
const ws = path.join(tmp, "workspace");
fs.mkdirSync(path.join(ws, "skills", "demo"), { recursive: true });

fs.writeFileSync(
  path.join(ws, "skills", "demo", "SKILL.md"),
  `---
name: demo
description: A clean demonstration skill with no secrets in it at all.
---

# Demo

A repeatable process for demonstrating things. No keys, no paths.
`
);
fs.writeFileSync(
  path.join(ws, "credentials.json"),
  JSON.stringify({ token: FAKE_SECRET, awsKey: "AKIAABCDEFGHIJKLMNOP" })
);
fs.writeFileSync(path.join(ws, ".env"), `OPENAI_API_KEY=${FAKE_SECRET}\n`);
fs.writeFileSync(path.join(ws, "README.md"), "# project readme, harmless prose\n");
// .cto-brainignore deliberately does NOT list .env — proving the hard
// credential floor in discover.mjs skips it independently of the ignore file.
fs.writeFileSync(path.join(ws, ".cto-brainignore"), "credentials.json\n");

// --- discovery: gate-before-read ---
const found = discoverSkills({ dir: ws });
const paths = found.map((d) => d.path);

ok("discover returns descriptors", Array.isArray(found) && found.length > 0);
ok("credentials.json is SKIPPED (never in results)", !paths.includes("credentials.json"));
ok(".env is SKIPPED by hard floor (not in ignore file)", !paths.includes(".env"));
ok("clean SKILL.md is discovered", paths.includes("skills/demo/SKILL.md"));
ok("README.md is discovered", paths.includes("README.md"));

const skillDesc = found.find((d) => d.path === "skills/demo/SKILL.md");
ok("SKILL.md descriptor carries frontmatter name", skillDesc && skillDesc.name === "demo");
ok("SKILL.md descriptor carries description", skillDesc && typeof skillDesc.description === "string");

// No descriptor anywhere should carry raw file CONTENTS (only metadata fields).
const allowedKeys = new Set(["path", "kind", "name", "description"]);
ok(
  "descriptors are metadata-only (no content fields)",
  found.every((d) => Object.keys(d).every((k) => allowedKeys.has(k)))
);

// The fake secret must NEVER appear in any discovered descriptor.
const serialized = JSON.stringify(found);
ok("no secret leaks into discovery output", !serialized.includes(FAKE_SECRET));
ok("no AKIA secret leaks into discovery output", !/AKIA[0-9A-Z]{16}/.test(serialized));

// --- synthesis: pattern-only, draft, gate re-scan ---
const result = synthesizeSkill({ candidates: found, topic: "Demo Synthesis Pattern" });

ok("synthesis not refused for clean candidates", !result.refused);
ok("draftPath is under skills-draft/", result.draftPath.includes("/skills-draft/"));
ok("draftPath is NOT under skills/<name>/ publish dir", !/\/skills\/[^/]+\/SKILL\.md$/.test(result.draftPath));
ok("draftPath ends in SKILL.md", result.draftPath.endsWith("/SKILL.md"));
ok("content has frontmatter", result.content.startsWith("---"));
ok("content has no secret-shaped strings", !/sk-[A-Za-z0-9]{20,}/.test(result.content) && !/AKIA[0-9A-Z]{16}/.test(result.content));
ok("content has no absolute temp path", !result.content.includes(tmp) && !result.content.includes(ws));
ok("content has no POSIX absolute path", !/(^|\s)\/[A-Za-z0-9._\-/]+/m.test(result.content));

// Write the draft inside the temp dir to prove the parent's write step works
// and re-confirm the on-disk artifact is secret-free.
const draftAbs = path.join(tmp, result.draftPath);
fs.mkdirSync(path.dirname(draftAbs), { recursive: true });
fs.writeFileSync(draftAbs, result.content);
const onDisk = fs.readFileSync(draftAbs, "utf8");
ok("on-disk draft is secret-free", !onDisk.includes(FAKE_SECRET));

// --- sabotage: a candidate carrying a secret must be REFUSED ---
// Force a leak path: a topic that would embed a secret-shaped string.
const sabotage = synthesizeSkill({
  candidates: found,
  topic: `leak ${FAKE_SECRET}`,
});
ok("sabotage secret in output is REFUSED", sabotage.refused === true);
ok("refused result carries a reason", typeof sabotage.reason === "string" && sabotage.reason.length > 0);
ok("refused result has empty content", sabotage.content === "");

// Sabotage via an absolute path in the topic must also be refused.
const sabotagePath = synthesizeSkill({ candidates: found, topic: "leak /etc/passwd here" });
ok("sabotage absolute path is REFUSED", sabotagePath.refused === true);

// --- cleanup ---
fs.rmSync(tmp, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " synth test failure(s)");
  process.exit(1);
}
console.log("\nAll synth checks passed.");
