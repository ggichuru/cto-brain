// Brick 4 — privacy-first skill synthesis: synthesis half.
//
// Implements ADR 0002 invariants (2) pattern-only output, (3) draft +
// human-review (never auto-publish), (5) provenance not content. Takes the
// metadata-only descriptors from discover.mjs and emits a DRAFT SKILL.md that
// abstracts patterns/process only. The output is re-scanned with the gate
// secret regexes AND for absolute filesystem paths; any hit => refused.
//
// Pure function: returns data. It does NOT write files. The parent command
// writes the draft and re-runs `gate check`.

// Gate secret regexes — mirrored from src/gate/pack.mjs (import-only contract;
// we re-declare the same patterns rather than reaching into a non-exported one).
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/, // OpenAI-style key
  /AKIA[0-9A-Z]{16}/, // AWS access key id
];

// Absolute filesystem paths we must never embed in a pattern-only draft.
const ABS_PATH_PATTERNS = [
  /(^|\s)\/[A-Za-z0-9._\-/]+/m, // POSIX absolute path
  /[A-Za-z]:\\[\\A-Za-z0-9._\- ]+/, // Windows absolute path
];

// URL / env-shaped leakage guards (pattern-only output forbids these too).
const LEAK_PATTERNS = [
  /https?:\/\/[^\s)]+/i, // URLs
  /\b[A-Z][A-Z0-9_]{3,}=[^\s]+/, // ENV_VAR=value assignments
];

/** Slugify a topic into a safe skill directory name. */
function slugify(topic) {
  const slug = String(topic || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "synthesized-skill";
}

/** Scan synthesized output. Returns the first reason it must be refused, or null. */
function scanOutput(content) {
  for (const re of SECRET_PATTERNS) {
    if (re.test(content)) return "output contains a secret-shaped string";
  }
  for (const re of ABS_PATH_PATTERNS) {
    if (re.test(content)) return "output contains an absolute filesystem path";
  }
  for (const re of LEAK_PATTERNS) {
    if (re.test(content)) return "output contains a URL or env assignment";
  }
  return null;
}

/**
 * Aggregate candidate descriptors into provenance-only counts by kind.
 * Records THAT a pattern was observed and HOW MANY times — not source text.
 */
function summarizeProvenance(candidates) {
  const byKind = new Map();
  const skillNames = [];
  for (const c of candidates || []) {
    byKind.set(c.kind, (byKind.get(c.kind) || 0) + 1);
    if (c.kind === "skill" && c.name) skillNames.push(c.name);
  }
  const lines = [...byKind.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kind, n]) => `- \`${kind}\`: observed in ${n} file${n === 1 ? "" : "s"}`);
  return { lines, skillNames, total: (candidates || []).length };
}

/** Build the DRAFT SKILL.md body — patterns/process only, no source content. */
function buildDraft(name, topic, prov) {
  const today = new Date().toISOString().slice(0, 10);
  const desc =
    `DRAFT synthesized skill for "${topic}". Abstracted from observed workspace ` +
    `patterns (provenance only, no source content). Requires human review before promotion.`;

  const provBlock = prov.lines.length
    ? prov.lines.join("\n")
    : "- (no candidate files in allowlisted scope)";

  return `---
name: ${name}
description: ${desc}
---

# ${topic} (DRAFT — human review required)

> **DRAFT — ${today}.** Synthesized by cto-brain skill synth under ADR 0002.
> Pattern-only: this draft records *that* patterns were observed and in how
> many places, never the source text, paths, identifiers, URLs, env, or keys.
> Not a real skill until a human reviews and promotes it. Never auto-wired,
> never auto-packed.

## Observed pattern provenance

The following kinds of artifact were observed in the allowlisted scope
(${prov.total} candidate file${prov.total === 1 ? "" : "s"} after the credential gate):

${provBlock}

## Abstracted process

This section is a placeholder for the reviewer to fill in with the *abstracted*
process for "${topic}" — the repeatable steps and decisions, expressed in
general terms. Do not paste proprietary code, file paths, identifiers, URLs,
environment values, or credentials. If a step can only be described by quoting
source, it does not belong in a shareable skill.

1. State the trigger: when should this skill fire?
2. State the inputs in general terms (kinds, not contents).
3. State the repeatable steps as process, not as copied code.
4. State the output and how a human verifies it.

## Review checklist (before promotion)

- [ ] No proprietary code, paths, identifiers, URLs, env, or keys.
- [ ] Description triggers on the right intent and only that intent.
- [ ] \`cto-brain gate check\` passes on this draft.
- [ ] A human has read and approved promotion out of \`skills-draft/\`.
`;
}

/**
 * synthesizeSkill({ candidates, topic }) — ADR 0002 pattern-only synthesis.
 *
 * @param {object} opts
 * @param {Array} opts.candidates  descriptors from discoverSkills (metadata only)
 * @param {string} opts.topic      operator-named topic for the draft
 * @returns {{ name:string, draftPath:string, content:string,
 *             refused?:boolean, reason?:string }}
 *   On a clean draft: { name, draftPath, content }. If the re-scan trips on a
 *   secret or absolute path, returns { refused:true, reason, content:"" }.
 */
export function synthesizeSkill({ candidates = [], topic } = {}) {
  const name = slugify(topic);
  // DRAFT path only — never under skills/.
  const draftPath = `.cto-brain/skills-draft/${name}/SKILL.md`;

  const prov = summarizeProvenance(candidates);
  const content = buildDraft(name, topic || name, prov);

  // Re-scan the synthesized OUTPUT (ADR 0002 "gate runs again on the draft").
  const reason = scanOutput(content);
  if (reason) {
    return { name, draftPath, content: "", refused: true, reason };
  }

  return { name, draftPath, content };
}
