// Brick 4 — privacy-first skill synthesis: discovery half.
//
// Implements ADR 0002 invariants (1) gate-before-read, (4) allowlist scope,
// (5) provenance not content. Walks an ALLOWLISTED directory and, BEFORE
// reading any file, skips it if it trips the credential gate or a
// .cto-brainignore pattern. For SKILL.md it returns the frontmatter
// name/description (already pattern-level metadata); for every other file it
// returns metadata ONLY — never the contents.

import fs from "node:fs";
import path from "node:path";
import { isCredentialPath, loadIgnorePatterns } from "../sync/non-destructive.mjs";
import { exists, readText, projectBrainDir } from "../paths.mjs";

// Directories we never descend into — large, machine-generated, or VCS.
const SKIP_DIRS = new Set(["node_modules", ".git", ".cto-brain-cache"]);

// Hard credential floor for discovery, independent of any workspace ignore
// file. isCredentialPath() covers .env.local but not a bare .env; we add the
// dotenv family here so gate-before-read never depends on the workspace
// shipping a .cto-brainignore. Belt-and-suspenders for ADR 0002 invariant 1.
const ALWAYS_SKIP_FILE = [
  /(^|\/)\.env(\..*)?$/i,
  /(^|\/)secrets?(\/|$)/i,
  /\.(key|pem|p12|pfx)$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/i,
];

function isAlwaysSkipped(relPath) {
  return ALWAYS_SKIP_FILE.some((re) => re.test(relPath));
}

/** True if relPath matches any .cto-brainignore-style pattern. */
function matchesIgnore(relPath, patterns) {
  const norm = relPath.replace(/\\/g, "/");
  const base = norm.split("/").pop();
  for (const raw of patterns) {
    const pat = raw.replace(/\/$/, "");
    if (pat.endsWith("/") && norm.startsWith(pat)) return true;
    if (norm === pat || norm.startsWith(`${pat}/`)) return true;
    if (base === pat) return true;
    if (pat.includes("*")) {
      const re = new RegExp(
        "^" + pat.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$"
      );
      if (re.test(norm) || re.test(base)) return true;
    }
  }
  return false;
}

/**
 * Parse SKILL.md YAML frontmatter for name + description ONLY.
 * Pattern-level metadata, not the skill body.
 */
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const block = m[1];
  const name = block.match(/^name:\s*(.+)$/m);
  const desc = block.match(/^description:\s*(.+)$/m);
  return {
    name: name ? name[1].trim() : undefined,
    description: desc ? desc[1].trim() : undefined,
  };
}

/** Classify a file into a coarse "kind" from its name alone (no reads). */
function classify(relPath) {
  const base = relPath.split("/").pop().toLowerCase();
  if (base === "skill.md") return "skill";
  if (base.endsWith(".md")) return "doc";
  if (base === "package.json" || base === "pyproject.toml" || base === "cargo.toml") return "manifest";
  if (base.endsWith(".test.mjs") || base.endsWith(".test.js") || base.startsWith("test")) return "test";
  if (base.endsWith(".mjs") || base.endsWith(".js") || base.endsWith(".ts")) return "code-js";
  if (base.endsWith(".py")) return "code-py";
  if (base.endsWith(".sh")) return "script";
  if (base.endsWith(".json") || base.endsWith(".yaml") || base.endsWith(".yml") || base.endsWith(".toml")) return "config";
  return "other";
}

function walkOne(root, patterns, out) {
  if (!exists(root)) return;
  let st;
  try {
    st = fs.statSync(root);
  } catch {
    return;
  }
  const walk = (dir, rel = "") => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const name = ent.name;
      const relPath = rel ? `${rel}/${name}` : name;

      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(name)) continue;
        // GATE-BEFORE-READ: a credential-pathed or ignored dir is never entered.
        if (isCredentialPath(relPath) || isAlwaysSkipped(relPath) || matchesIgnore(relPath, patterns)) continue;
        walk(path.join(dir, name), relPath);
        continue;
      }
      if (!ent.isFile()) continue;

      // GATE-BEFORE-READ: skip the file BEFORE opening it.
      if (isCredentialPath(relPath) || isAlwaysSkipped(relPath) || matchesIgnore(relPath, patterns)) continue;

      const kind = classify(relPath);
      const descriptor = { path: relPath, kind };

      if (kind === "skill") {
        // SKILL.md frontmatter is pattern-level metadata (name/description).
        // We read ONLY to extract those two fields, never the body content.
        try {
          const fm = parseFrontmatter(readText(path.join(dir, name)));
          if (fm.name) descriptor.name = fm.name;
          if (fm.description) descriptor.description = fm.description;
        } catch {
          // unreadable frontmatter: keep metadata-only descriptor.
        }
      }
      // For all other kinds: metadata ONLY. Contents are never read.
      out.push(descriptor);
    }
  };

  if (st.isDirectory()) walk(root);
}

/**
 * discoverSkills({ dir, extraPaths }) — ADR 0002 allowlist-scoped discovery.
 *
 * @param {object} opts
 * @param {string} [opts.dir]   default scan root; defaults to project .cto-brain/
 * @param {string[]} [opts.extraPaths]  explicit operator allowlist of extra dirs
 * @returns {{ path:string, kind:string, name?:string, description?:string }[]}
 *   Descriptors with provenance (relative path + kind). SKILL.md carries
 *   frontmatter name/description; every other file is metadata-only.
 */
export function discoverSkills({ dir, extraPaths = [] } = {}) {
  const scanRoot = dir || projectBrainDir();
  const out = [];

  // Ignore patterns are sourced from the scan root itself, plus the bundled
  // credential floor inside isCredentialPath().
  const roots = [scanRoot, ...extraPaths];
  for (const r of roots) {
    const patterns = loadIgnorePatterns(r);
    walkOne(r, patterns, out);
  }
  return out;
}
