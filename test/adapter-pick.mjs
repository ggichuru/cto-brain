import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { adapterPick, adapterStatus, wireSkills } from "../src/cli/adapters.mjs";
import { adaptersSettingsPath, loadAdapterSettings } from "../src/adapters/settings.mjs";
import { adapters } from "../src/adapters/index.mjs";

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

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "cto-adapter-"));
const tmpProj = fs.mkdtempSync(path.join(os.tmpdir(), "cto-adapter-proj-"));
const brainHome = path.join(tmpHome, ".cto-brain");
const prevHome = process.env.HOME;
const prevBrainHome = process.env.CTO_BRAIN_HOME;
const prevClaudeHome = process.env.CLAUDE_HOME;
process.env.HOME = tmpHome;
process.env.CTO_BRAIN_HOME = brainHome;
process.env.CLAUDE_HOME = path.join(tmpHome, ".claude");
const env = {
  ...process.env,
  CTO_BRAIN_HOME: brainHome,
  HOME: tmpHome,
  CLAUDE_HOME: path.join(tmpHome, ".claude"),
  CI: "true",
};

const initSys = spawnSync(process.execPath, [bin, "init"], { env, encoding: "utf8" });
ok("init exits 0", initSys.status === 0);

const pickCli = spawnSync(
  process.execPath,
  [bin, "adapter", "pick", "--adapters", "claude-code,cursor"],
  { env, encoding: "utf8" }
);
ok("pick --adapters exits 0", pickCli.status === 0);

const settings = loadAdapterSettings(brainHome);
ok("pick saves enabled adapters", settings.enabled.join(",") === "claude-code,cursor");
ok("settings file exists", fs.existsSync(adaptersSettingsPath(brainHome)));

const pickModule = await adapterPick({
  adapters: "codex,generic",
  home: brainHome,
});
ok("pick module saves codex", loadAdapterSettings(brainHome).enabled.includes("codex"));

const claudeDir = path.join(tmpHome, ".claude", "skills");
const cursorDir = path.join(tmpProj, ".cursor", "skills");

const wireExplicit = wireSkills({
  brainHome,
  cwd: tmpProj,
  adapters: ["claude-code", "cursor"],
  scope: "both",
  withRules: false,
});
ok("wire explicit adapters", wireExplicit.enabled.join(",") === "claude-code,cursor");
ok("claude global wired", fs.existsSync(path.join(claudeDir, "cto-orchestration", "SKILL.md")));
ok("cursor project wired", fs.existsSync(path.join(cursorDir, "meta-brain", "SKILL.md")));

const wireSaved = wireSkills({
  brainHome,
  cwd: tmpProj,
  project: true,
  withRules: false,
});
ok("wire uses saved preference when no flags", wireSaved.enabled.includes("codex"));

const listCli = spawnSync(process.execPath, [bin, "adapter", "list"], { env, cwd: tmpProj, encoding: "utf8" });
ok("adapter list exits 0", listCli.status === 0);
ok("list includes all adapter ids", adapters.every((a) => listCli.stdout.includes(a.id)));

const status = adapterStatus({ home: brainHome, cwd: tmpProj });
ok("status returns enabled adapters", status.enabled.length >= 1);
ok("status has adapter entries", status.adapters.length >= 1);

fs.rmSync(tmpHome, { recursive: true, force: true });
fs.rmSync(tmpProj, { recursive: true, force: true });
process.env.HOME = prevHome;
if (prevBrainHome === undefined) delete process.env.CTO_BRAIN_HOME;
else process.env.CTO_BRAIN_HOME = prevBrainHome;
if (prevClaudeHome === undefined) delete process.env.CLAUDE_HOME;
else process.env.CLAUDE_HOME = prevClaudeHome;

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll adapter-pick checks passed.");
