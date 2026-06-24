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

export function listSkillNames(skillsRoot) {
  if (!exists(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && exists(path.join(skillsRoot, d.name, "SKILL.md")))
    .map((d) => d.name);
}
