// Gate 3 proven fail-closed: the grounding walk is docs-only, bounded by
// maxBytes, and SKIPS planted secrets — both a .env-named PATH and a .md whose
// CONTENT looks like a live key. A secret-looking doc is skipped WHOLE.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildGrounding, walkScope, isDocPath } from "../src/chat/grounding.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const root = mkdtempSync(join(tmpdir(), "cto-chat-ground-"));
mkdirSync(join(root, "docs"), { recursive: true });

// Legit docs.
writeFileSync(join(root, "README.md"), "# Readme\nThe project overview lives here.");
writeFileSync(join(root, "docs", "guide.md"), "## Guide\nHow to use the thing.");

// Planted secrets / non-docs — every one must be skipped.
writeFileSync(join(root, ".env"), "OPENAI_API_KEY=sk-abcdefghijklmnop1234567890"); // secret PATH + non-doc
writeFileSync(join(root, "docs", "leaked.md"), "# Notes\nkey: sk-abcdefghijklmnop1234567890 do not read"); // secret CONTENT
writeFileSync(join(root, "credentials.md"), "# creds\nnothing here"); // secret-named PATH
writeFileSync(join(root, "config.js"), "export const x = 1;"); // non-doc extension

const scope = { id: "p", label: "Proj", root, include: ["README.md", "docs", ".env", "credentials.md", "config.js"], maxBytes: 80_000 };

// --- isDocPath unit guards ---
ok("isDocPath allows md", isDocPath("docs/guide.md") === true);
ok("isDocPath denies .env", isDocPath(".env") === false);
ok("isDocPath denies non-doc ext", isDocPath("config.js") === false);
ok("isDocPath denies traversal", isDocPath("../etc/passwd") === false);
ok("isDocPath denies secret-named", isDocPath("credentials.md") === false);

// --- walk (path screening) ---
const walked = await walkScope(scope);
const rels = walked.map((f) => f.rel).sort();
ok("walk includes README", rels.includes("README.md"));
ok("walk includes docs/guide.md", rels.includes("docs/guide.md"));
ok("walk excludes .env (path)", !rels.some((r) => r.includes(".env")));
ok("walk excludes credentials.md (secret-named path)", !rels.includes("credentials.md"));
ok("walk excludes config.js (non-doc)", !rels.includes("config.js"));

// --- buildGrounding (content screening + bound) ---
const g = await buildGrounding(scope);
ok("grounding has README body", g.includes("The project overview lives here."));
ok("grounding has guide body", g.includes("How to use the thing."));
ok("grounding SKIPS secret-content .md whole", !g.includes("do not read") && !g.includes("sk-abcdefghijklmnop"));
ok("grounding never contains .env content", !g.includes("OPENAI_API_KEY"));

// --- maxBytes bound ---
const tiny = await buildGrounding({ ...scope, maxBytes: 200 });
ok("grounding respects maxBytes", tiny.length <= 200 + 60 /* truncation note slack */);
ok("grounding truncation noted", tiny.includes("truncated") || tiny.length <= 200);

// --- inline-text scope (root:null) ---
const inline = await buildGrounding({ id: "n", label: "N", root: null, text: "just this brief" });
ok("inline scope returns its text", inline === "just this brief");

rmSync(root, { recursive: true, force: true });

if (failures) { console.error("\n" + failures + " failure(s)"); process.exit(1); }
console.log("\nAll chat-grounding checks passed.");
