// Skill-structure lint against the Agent Skills spec (agentskills.io/specification).
// Errors block the gate (structural breakage); warnings inform (spec drift the
// harness tolerates). Conformance checklist derived from the official spec +
// anthropics/skills' own validator behavior — implementation is original.
import fs from "node:fs";
import path from "node:path";
import { exists } from "../paths.mjs";

const KNOWN_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TRIGGER_RE = /(use when|fires? (on|before|when)|when(ever)?\b|triggers?\b|use this|use it|invoke (this|when)|before (building|any))/i;
const MARKER_RE = /\b(TODO|FIXME|INVENT|XXX)\b/g;

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = text.slice(4, end);
  const keys = [];
  let name = "", description = "", cur = null, curVal = [];
  const flush = () => {
    if (cur === "description") description = curVal.join(" ").trim();
    if (cur === "name") name = curVal.join(" ").trim();
  };
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(.*)$/);
    if (m) {
      flush();
      cur = m[1]; curVal = [];
      keys.push(m[1]);
      const v = m[2].trim();
      if (v && v !== ">-" && v !== "|" && v !== ">") curVal.push(v);
    } else if (cur && /^\s+\S/.test(line)) {
      curVal.push(line.trim());
    }
  }
  flush();
  return { keys, name, description, bodyStart: end + 4 };
}

/**
 * Lint every skill directory under skillsRoot.
 * Returns { errors: [{skill, msg}], warnings: [{skill, msg}] }.
 * Errors: missing SKILL.md, unparseable frontmatter, bad/missing name,
 *   name != directory, missing description.
 * Warnings: description > 1024 chars, angle brackets in description, no
 *   trigger clause, spec-unknown top-level keys, body > 500 lines,
 *   leftover authoring markers.
 */
export function lintSkills(skillsRoot) {
  const errors = [], warnings = [];
  const err = (skill, msg) => errors.push({ skill, msg });
  const warn = (skill, msg) => warnings.push({ skill, msg });
  if (!exists(skillsRoot)) return { errors, warnings };

  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skill = entry.name;
    const skillMd = path.join(skillsRoot, skill, "SKILL.md");
    if (!exists(skillMd)) { err(skill, "SKILL.md missing"); continue; }
    const text = fs.readFileSync(skillMd, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) { err(skill, "no YAML frontmatter at top of SKILL.md"); continue; }

    if (!fm.name) err(skill, "frontmatter missing name");
    else {
      if (!NAME_RE.test(fm.name)) err(skill, `name '${fm.name}' not kebab-case per spec`);
      if (fm.name.length > 64) err(skill, `name >64 chars (${fm.name.length})`);
      if (fm.name !== skill) err(skill, `name '${fm.name}' != directory '${skill}'`);
    }

    if (!fm.description) err(skill, "frontmatter missing/empty description");
    else {
      const d = fm.description.replace(/^["']|["']$/g, "");
      if (d.length > 1024) warn(skill, `description ${d.length} chars > spec cap 1024`);
      if (/[<>]/.test(d)) warn(skill, "description contains angle brackets (official validator rejects)");
      if (!TRIGGER_RE.test(d)) warn(skill, "description has no explicit when/trigger clause");
    }

    for (const k of fm.keys) {
      if (!KNOWN_KEYS.has(k)) warn(skill, `spec-unknown frontmatter key '${k}'`);
    }

    const bodyLines = text.slice(fm.bodyStart).split("\n").length;
    if (bodyLines > 500) warn(skill, `body ${bodyLines} lines > 500 (move overflow to references/)`);

    const markers = text.match(MARKER_RE);
    if (markers) warn(skill, `leftover authoring markers: ${[...new Set(markers)].join(",")}`);
  }
  return { errors, warnings };
}
