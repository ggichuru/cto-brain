import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureDir, exists } from "../paths.mjs";

const DEFAULT_EXCLUDES = [
  "*-workspace/",
  "*.skill",
  ".git/",
  "node_modules/",
  "credentials.json",
  ".credentials.json",
  "history.jsonl",
];

const CREDENTIAL_PATTERNS = [
  /credentials\.json$/i,
  /\.credentials\.json$/i,
  /history\.jsonl$/i,
  /\.env\.local$/i,
  /id_rsa$/i,
  /\.pem$/i,
];

export function isCredentialPath(relPath) {
  return CREDENTIAL_PATTERNS.some((re) => re.test(relPath));
}

export function loadIgnorePatterns(brainRoot) {
  const ignoreFile = path.join(brainRoot, ".cto-brainignore");
  if (!exists(ignoreFile)) return [];
  return readTextLines(ignoreFile)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function readTextLines(p) {
  return fs.readFileSync(p, "utf8").split(/\r?\n/);
}

function hasRsync() {
  const r = spawnSync("rsync", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

/** Non-destructive directory sync: rsync -au when available, else mtime-wins copy. Never --delete. */
export function syncDir(src, dest, opts = {}) {
  if (!exists(src)) {
    return { copied: 0, skipped: 0, method: "none" };
  }
  ensureDir(dest);
  const excludes = [...DEFAULT_EXCLUDES, ...(opts.excludes || [])];
  if (hasRsync() && !opts.forceCopy) {
    const args = ["-au", ...excludes.flatMap((e) => ["--exclude", e]), `${src.replace(/\/$/, "")}/`, `${dest.replace(/\/$/, "")}/`];
    const r = spawnSync("rsync", args, { encoding: "utf8" });
    if (r.status === 0) {
      return { copied: -1, skipped: 0, method: "rsync" };
    }
  }
  return copyDirMtimeWins(src, dest, excludes);
}

function copyDirMtimeWins(src, dest, excludes) {
  let copied = 0;
  let skipped = 0;
  const walk = (s, d, rel = "") => {
    ensureDir(d);
    for (const name of fs.readdirSync(s)) {
      const relPath = rel ? `${rel}/${name}` : name;
      if (shouldExclude(relPath, excludes)) continue;
      if (isCredentialPath(relPath)) continue;
      const sp = path.join(s, name);
      const dp = path.join(d, name);
      const st = fs.statSync(sp);
      if (st.isDirectory()) {
        walk(sp, dp, relPath);
        continue;
      }
      if (exists(dp)) {
        const dt = fs.statSync(dp).mtimeMs;
        if (dt >= st.mtimeMs) {
          skipped++;
          continue;
        }
      }
      fs.copyFileSync(sp, dp);
      fs.utimesSync(dp, st.atime, st.mtime);
      copied++;
    }
  };
  walk(src, dest);
  return { copied, skipped, method: "copy" };
}

function shouldExclude(relPath, patterns) {
  const norm = relPath.replace(/\\/g, "/");
  for (const pat of patterns) {
    const p = pat.replace(/\/$/, "");
    if (p.endsWith("/") && norm.startsWith(p)) return true;
    if (norm === p || norm.startsWith(`${p}/`)) return true;
    if (pat.includes("*") && globMatch(norm, pat)) return true;
  }
  return false;
}

function globMatch(str, pat) {
  const re = new RegExp(`^${pat.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")}$`);
  return re.test(str);
}

export function copyFileIfNewer(src, dest) {
  if (!exists(src)) return false;
  if (exists(dest)) {
    const ss = fs.statSync(src);
    const ds = fs.statSync(dest);
    if (ds.mtimeMs >= ss.mtimeMs) return false;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

export function scanForCredentials(root) {
  const hits = [];
  if (!exists(root)) return hits;
  const walk = (dir, rel = "") => {
    for (const name of fs.readdirSync(dir)) {
      const relPath = rel ? `${rel}/${name}` : name;
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (name === "node_modules" || name === ".git") continue;
        walk(full, relPath);
        continue;
      }
      if (isCredentialPath(relPath)) hits.push(relPath);
    }
  };
  walk(root);
  return hits;
}
