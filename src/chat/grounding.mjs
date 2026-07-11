// cto-brain chat — the grounding loader (Gate 3, fail-closed).
//
// A scope grounds the chat in a bounded, secret-screened slice of the user's
// own documentation. Everything here is read-only, docs-only, and denies on
// ambiguity: a file that looks like a secret — by PATH or by CONTENT — is
// skipped WHOLE, never partially read. Nothing outside a scope's root is ever
// reachable (traversal guard). Built-ins only.

import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";

// Deny by PATH: vcs/build/vendor dirs, key/cert/env files, anything named for a
// secret. Applied to every path segment as the walk descends.
export const SECRET_PATH =
  /(^|\/)(\.env|\.git|node_modules|build|dist|\.worktrees|\.svelte-kit|target|vendor|coverage)(\/|$)|\.(key|pem|p12|pfx|crt)$|id_rsa|\.pgpass|(^|\/|[._-])(secret|credential|password|token|apikey|keystore|mnemonic|seed|privkey)/i;

// Deny by CONTENT: if a doc contains anything shaped like a LIVE secret, the
// whole file is skipped. Fail-closed — one match denies the file.
export const SECRET_CONTENT =
  /(sk-[A-Za-z0-9]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|aws_secret_access_key|xox[baprs]-[0-9A-Za-z-]{10,}|ghp_[0-9A-Za-z]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.)/;

// Docs-only: no source, no binaries, no configs. Extensions the chat may read.
export const DOC_EXT = new Set([".md", ".mdx", ".markdown", ".txt", ".rst"]);

const DEFAULT_MAX_BYTES = 80_000;

// True when a relative path is safe to read as documentation: inside the root,
// not on the secret-path denylist, and a doc extension.
export function isDocPath(rel) {
  if (!rel || rel.startsWith("..")) return false; // traversal guard
  if (SECRET_PATH.test("/" + rel)) return false; // denied path
  return DOC_EXT.has(extname(rel).toLowerCase());
}

// Walk `p` (a file or directory) under `root`, collecting doc files only and
// denying secret/build paths as we descend. Mutates `acc`.
export async function collect(p, root, acc) {
  const rel = relative(root, p);
  if (rel.startsWith("..")) return; // never leave the root
  if (rel && SECRET_PATH.test("/" + rel)) return; // deny-listed path segment
  let s;
  try {
    s = await stat(p);
  } catch {
    return;
  }
  if (s.isDirectory()) {
    let ents;
    try {
      ents = await readdir(p);
    } catch {
      return;
    }
    for (const e of ents) await collect(resolve(p, e), root, acc);
  } else if (s.isFile() && DOC_EXT.has(extname(p).toLowerCase())) {
    acc.push({ abs: p, rel });
  }
}

// Enumerate the doc files a scope would ground on — path-screened, deduped,
// shallow-first then alphabetical (README/AGENTS before deep docs).
export async function walkScope(scope) {
  if (!scope || !scope.root) return [];
  const rootAbs = resolve(scope.root);
  const include = Array.isArray(scope.include) && scope.include.length ? scope.include : ["."];
  const files = [];
  for (const inc of include) {
    const p = resolve(rootAbs, inc);
    if (!p.startsWith(rootAbs)) continue; // traversal guard on the include list
    await collect(p, rootAbs, files);
  }
  const seen = new Set();
  const deduped = files.filter((f) => (seen.has(f.abs) ? false : (seen.add(f.abs), true)));
  deduped.sort(
    (a, b) => a.rel.split("/").length - b.rel.split("/").length || a.rel.localeCompare(b.rel)
  );
  return deduped;
}

// Build a bounded, secret-screened grounding digest for one scope. A scope with
// no `root` grounds on its inline `text`. Content-denylist skips a whole file.
export async function buildGrounding(scope) {
  if (!scope) return "";
  if (!scope.root) return typeof scope.text === "string" ? scope.text : "";

  const maxBytes = Number(scope.maxBytes) > 0 ? Number(scope.maxBytes) : DEFAULT_MAX_BYTES;
  const files = await walkScope(scope);

  let out =
    `# ${scope.label || scope.id} — grounding context (read-only project documentation)\n` +
    `These are the project's own docs. Ground every claim here; if a file doesn't cover it, say so.\n`;
  let used = out.length;

  for (const f of files) {
    if (SECRET_PATH.test("/" + f.rel)) continue; // belt-and-braces re-check
    let text;
    try {
      text = await readFile(f.abs, "utf8");
    } catch {
      continue;
    }
    if (SECRET_CONTENT.test(text)) continue; // fail-closed: looks secret → skip whole file
    const block = `\n\n## FILE: ${f.rel}\n${text.trim()}`;
    if (used + block.length > maxBytes) {
      const room = maxBytes - used;
      if (room > 800) out += block.slice(0, room) + "\n…[grounding truncated to fit the context budget]";
      break;
    }
    out += block;
    used += block.length;
  }
  return out;
}
