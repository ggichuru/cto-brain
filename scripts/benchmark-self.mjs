#!/usr/bin/env node
/**
 * Re-measure cto-brain benchmark column (local only).
 * Usage: node scripts/benchmark-self.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", ...opts });
  return { ok: r.status === 0, stdout: r.stdout || "", stderr: r.stderr || "", ms: r.status };
}

function countLines(globDir) {
  let n = 0;
  const dir = path.join(root, globDir);
  if (!fs.existsSync(dir)) return 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name, "SKILL.md");
    if (fs.existsSync(p)) n += fs.readFileSync(p, "utf8").split("\n").length;
  }
  return n;
}

function countSrcLines() {
  let n = 0;
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith(".mjs")) n += fs.readFileSync(p, "utf8").split("\n").length;
    }
  };
  walk(path.join(root, "src"));
  return n;
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const binText = fs.readFileSync(path.join(root, "bin/cto-brain.mjs"), "utf8");
const cliCommands = new Set(
  [...binText.matchAll(/^\s+cto-brain ([a-z-]+)/gm)].map((m) => m[1])
).size;

const t0 = Date.now();
const testRun = sh("npm", ["test"]);
const testMs = Date.now() - t0;
const okCount = (testRun.stdout.match(/^ok:/gm) || []).length;

const probeT0 = Date.now();
sh("node", ["bin/cto-brain.mjs", "router", "probe"]);
const probeMs = Date.now() - probeT0;

const gateT0 = Date.now();
sh("node", ["bin/cto-brain.mjs", "gate", "check", "--home", "."]);
const gateMs = Date.now() - gateT0;

const dry = sh("npm", ["pack", "--dry-run"]);
const dryOut = dry.stdout + dry.stderr;
const packSize = dryOut.match(/package size: ([^\n]+)/)?.[1]?.trim();
const unpacked = dryOut.match(/unpacked size: ([^\n]+)/)?.[1]?.trim();
const totalFiles = dryOut.match(/total files: (\d+)/)?.[1];

const report = {
  measuredAt: new Date().toISOString(),
  version: pkg.version,
  npm: {
    tarball: packSize,
    unpacked,
    files: totalFiles ? Number(totalFiles) : null,
    runtimeDependencies: Object.keys(pkg.dependencies || {}).length,
  },
  inventory: {
    cliTopLevelCommands: cliCommands,
    bundledSkills: (pkg.agentskills?.skills || []).length,
    skillLoc: countLines("skills"),
    srcLoc: countSrcLines(),
    adapters: 3,
    reviewerBriefs: fs.readdirSync(path.join(root, "pipeline/reviewers")).length,
    templates: fs.readdirSync(path.join(root, "templates")).length,
  },
  tests: {
    suites: 11,
    assertionsOk: okCount,
    wallMs: testMs,
    passed: testRun.ok,
  },
  latencyMs: {
    routerProbe: probeMs,
    gateCheck: gateMs,
  },
};

console.log(JSON.stringify(report, null, 2));
if (!testRun.ok) {
  console.error("npm test failed — fix before citing benchmark");
  process.exit(1);
}
