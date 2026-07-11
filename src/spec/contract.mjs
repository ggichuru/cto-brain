// Openspec-style spec contracts, dependency-free. The SDD half of the
// SDD×TDD doctrine as tooling: `spec init` scaffolds a change contract,
// `spec check` lints proposals for the required sections. See
// docs/integrations/spec-contracts.md for the frozen contract.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_SECTIONS = ["## Intent", "## Behavior", "## Acceptance criteria", "## Non-goals"];

const DEFAULT_TEMPLATES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "spec");

function renderTemplate(file, id) {
  return fs
    .readFileSync(file, "utf8")
    .replaceAll("{{CHANGE_ID}}", id)
    .replaceAll("{{DATE}}", new Date().toISOString().slice(0, 10));
}

/**
 * Scaffold specs/changes/<id>/{proposal.md,tasks.md} under root.
 * Throws if the change dir already exists (no clobber).
 */
export function scaffoldChange({ id, root, templatesDir = DEFAULT_TEMPLATES }) {
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`spec init: change id must be kebab-case, got "${id}"`);
  }
  const dir = path.join(root, "specs", "changes", id);
  if (fs.existsSync(dir)) {
    throw new Error(`spec init: ${dir} already exists — pick a new change id`);
  }
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const name of ["proposal.md", "tasks.md"]) {
    const out = path.join(dir, name);
    fs.writeFileSync(out, renderTemplate(path.join(templatesDir, name), id));
    files.push(out);
  }
  return { dir, files };
}

// Section body = lines between this heading and the next "## " (or EOF).
function sectionIsEmpty(text, heading) {
  const start = text.indexOf(heading);
  if (start === -1) return true;
  const rest = text.slice(start + heading.length);
  const next = rest.search(/^## /m);
  const body = next === -1 ? rest : rest.slice(0, next);
  return body.split("\n").every((line) => line.trim() === "");
}

/**
 * Lint every specs/changes/<asterisk>/proposal.md under root.
 * Returns { ok, checked, errors: [{ file, missing?, empty? }] }.
 */
export function checkSpecs({ root }) {
  const changesDir = path.join(root, "specs", "changes");
  if (!fs.existsSync(changesDir)) return { ok: true, checked: 0, errors: [] };
  const errors = [];
  let checked = 0;
  for (const entry of fs.readdirSync(changesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(changesDir, entry.name, "proposal.md");
    if (!fs.existsSync(file)) {
      errors.push({ file, missing: ["proposal.md"] });
      continue;
    }
    checked++;
    const text = fs.readFileSync(file, "utf8");
    const missing = REQUIRED_SECTIONS.filter((s) => !text.includes(s));
    const empty = REQUIRED_SECTIONS.filter((s) => !missing.includes(s) && sectionIsEmpty(text, s));
    if (missing.length || empty.length) {
      const err = { file };
      if (missing.length) err.missing = missing;
      if (empty.length) err.empty = empty;
      errors.push(err);
    }
  }
  return { ok: errors.length === 0, checked, errors };
}
