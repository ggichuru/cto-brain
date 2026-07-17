import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function packageRoot() {
  return path.resolve(__dirname, "..");
}

export function bundledSkillsDir() {
  return path.join(packageRoot(), "skills");
}

export function templatesDir() {
  return path.join(packageRoot(), "templates");
}

export function schemaDir() {
  return path.join(packageRoot(), "schema");
}

export function systemBrainHome() {
  return process.env.CTO_BRAIN_HOME || path.join(os.homedir(), ".cto-brain");
}

export function projectBrainDir(cwd = process.cwd()) {
  return path.join(cwd, ".cto-brain");
}

export function encodedHome() {
  return os.homedir().replace(/\//g, "-");
}

export function claudeMemoryTarget(claudeHome = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude")) {
  return path.join(claudeHome, "projects", encodedHome(), "memory");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

export function readText(p) {
  return fs.readFileSync(p, "utf8");
}

export function writeText(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

// --- ADR-0005: cto-code isolated runtime-state dir + atomic write + process lock ---

// XDG-compatible state root for cto-code. Pure path — does NOT create the dir.
// Honors XDG_STATE_HOME override (which is what makes it testable).
export function stateDir(sub) {
  const root = process.env.XDG_STATE_HOME
    ? path.join(process.env.XDG_STATE_HOME, "cto-code")
    : path.join(os.homedir(), ".local", "state", "cto-code");
  return sub ? path.join(root, sub) : root;
}

// Atomic same-filesystem write: write to a temp sibling, then rename over the
// target. Leaves no .tmp-* file behind on success. `data` is a string or Buffer.
export function writeAtomic(filePath, data) {
  ensureDir(path.dirname(filePath));
  const temp = filePath + ".tmp-" + process.pid;
  fs.writeFileSync(temp, data);
  fs.renameSync(temp, filePath);
}

// Exclusive process lock. Creates <stateDir/locks>/<name>.lock with O_EXCL
// (fail-if-exists), runs the sync fn, and always releases the lock (even on
// throw). If the lock already exists, throws "cto-code: '<name>' is locked".
export function withLock(name, fn) {
  const dir = stateDir("locks");
  ensureDir(dir);
  const lockPath = path.join(dir, name + ".lock");
  let fd;
  try {
    fd = fs.openSync(lockPath, "wx");
  } catch (err) {
    if (err.code === "EEXIST") {
      throw new Error("cto-code: '" + name + "' is locked");
    }
    throw err;
  }
  try {
    fs.writeSync(fd, String(process.pid));
    return fn();
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lockPath);
  }
}

export function listSkillNames(skillsRoot) {
  if (!exists(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && exists(path.join(skillsRoot, d.name, "SKILL.md")))
    .map((d) => d.name);
}
