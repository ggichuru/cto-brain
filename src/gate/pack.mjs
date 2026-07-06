import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ensureDir, exists, listSkillNames, packageRoot } from "../paths.mjs";
import { loadIgnorePatterns, scanForCredentials } from "../sync/non-destructive.mjs";
import { lintSkills } from "./skill-lint.mjs";
import { systemLayout } from "../sync/brain-sync.mjs";

export function gateCheck(root) {
  const hits = scanForCredentials(root);
  const ignore = loadIgnorePatterns(root);
  const problems = hits.map((h) => ({ type: "credential", path: h }));

  // scan skill bodies for obvious secrets
  const skillsDir = path.join(root, "skills");
  if (exists(skillsDir)) {
    for (const name of listSkillNames(skillsDir)) {
      const skillMd = path.join(skillsDir, name, "SKILL.md");
      const body = fs.readFileSync(skillMd, "utf8");
      if (/sk-[a-zA-Z0-9]{20,}/.test(body) || /AKIA[0-9A-Z]{16}/.test(body)) {
        problems.push({ type: "secret-in-skill", path: skillMd });
      }
    }
  }

  // skill-structure lint (Agent Skills spec conformance) — errors block, warnings inform
  const lint = exists(skillsDir) ? lintSkills(skillsDir) : { errors: [], warnings: [] };
  for (const e of lint.errors) {
    problems.push({ type: "skill-structure", path: path.join(skillsDir, e.skill, "SKILL.md"), detail: e.msg });
  }

  return { ok: problems.length === 0, problems, ignorePatterns: ignore, lintWarnings: lint.warnings };
}

export function buildManifest(opts = {}) {
  const root = opts.root || path.join(packageRoot(), "skills");
  const tier = opts.tier || "public";
  const skills = listSkillNames(root).map((name) => {
    const dir = path.join(root, name);
    const skillMd = path.join(dir, "SKILL.md");
    const hash = sha256File(skillMd);
    return { name, path: `skills/${name}`, sha256: hash, tier, export: tier === "public" ? "allowed" : "never" };
  });
  return {
    version: "1",
    package: "cto-brain",
    tier,
    created: new Date().toISOString(),
    skills,
  };
}

function sha256File(p) {
  const h = createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
}

export function packBrain(opts = {}) {
  const home = opts.brainHome;
  const gate = gateCheck(home);
  if (!gate.ok) {
    const err = new Error("gate check failed");
    err.problems = gate.problems;
    throw err;
  }

  const out = opts.output || path.join(process.cwd(), `cto-brain-pack-${Date.now()}.tar.gz`);
  const manifest = buildManifest({ root: path.join(home, "skills"), tier: opts.tier || "signed" });
  const manifestPath = path.join(home, "brain-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  if (opts.encrypt) {
    const plainTar = out.replace(/\.enc$/, "") + ".tar.gz";
    tarDir(home, plainTar, opts);
    encryptFile(plainTar, out, opts.passphrase);
    fs.unlinkSync(plainTar);
    fs.unlinkSync(manifestPath);
    return { output: out, encrypted: true, manifest };
  }

  tarDir(home, out, opts);
  return { output: out, encrypted: false, manifest };
}

function tarDir(home, out, opts) {
  const r = spawnSync("tar", ["-czf", out, "-C", home, "skills", "memory", "brain-manifest.json"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`tar failed: ${r.stderr || r.stdout}`);
}

export function unpackBrain(opts = {}) {
  const input = opts.input;
  let tarPath = input;

  if (opts.decrypt || input.endsWith(".enc")) {
    tarPath = input + ".dec.tar.gz";
    decryptFile(input, tarPath, opts.passphrase);
  }

  const dest = opts.dest || opts.brainHome;
  ensureDir(dest);
  const r = spawnSync("tar", ["-xzf", tarPath, "-C", dest], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`tar extract failed: ${r.stderr || r.stdout}`);

  if (tarPath !== input && exists(tarPath)) fs.unlinkSync(tarPath);
  return { dest, extracted: true };
}

function encryptFile(plain, cipher, passphrase) {
  if (!passphrase) throw new Error("passphrase required for encrypted pack");
  const r = spawnSync(
    "openssl",
    ["enc", "-aes-256-cbc", "-pbkdf2", "-iter", "600000", "-salt", "-pass", "pass:" + passphrase, "-in", plain, "-out", cipher],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`encrypt failed: ${r.stderr}`);
}

function decryptFile(cipher, plain, passphrase) {
  if (!passphrase) throw new Error("passphrase required for encrypted pack");
  const r = spawnSync(
    "openssl",
    ["enc", "-d", "-aes-256-cbc", "-pbkdf2", "-iter", "600000", "-salt", "-pass", "pass:" + passphrase, "-in", cipher, "-out", plain],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`decrypt failed: ${r.stderr}`);
}
