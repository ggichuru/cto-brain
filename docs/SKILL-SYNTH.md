# Skill synthesis (privacy-first)

`cto-brain skill synth` lets the brain discover skill-like patterns in an
**allowlisted** workspace directory and emit a **DRAFT** skill for human review.
It is governed by [ADR 0002](decisions/0002-skill-synthesis.md) — privacy is
enforced **by construction**, not by post-hoc redaction.

The capability is two pure modules plus a parent-wired command. The modules
return data; they never publish, never auto-wire, and never write outside a
caller-controlled path.

## The five invariants (ADR 0002)

1. **Gate-before-read.** Every candidate is checked against the credential
   patterns (`isCredentialPath`), a hard dotenv/secrets/key floor, and the
   workspace `.cto-brainignore` **before** its contents are read. A file that
   trips the gate is never opened. Non-skill files are never read for content at
   all — only their metadata (relative path + kind) is recorded.
2. **Pattern-only output.** The draft abstracts process/patterns. It never
   embeds verbatim proprietary code, file paths, identifiers, URLs, env, or
   keys. Even discovered SKILL.md frontmatter names are aggregated into counts,
   not pasted into the body.
3. **Draft + human review, never auto-publish.** Output lands under
   `.cto-brain/skills-draft/<name>/SKILL.md` — never `skills/`. A human reviews
   and promotes it explicitly. Nothing is auto-wired or auto-packed.
4. **Allowlist scope.** The operator names the scan dir. Default is the
   project's own `.cto-brain/`; extra dirs are passed explicitly via
   `extraPaths`. Synthesis never walks the whole filesystem.
5. **Provenance, not content.** A draft records *that* a kind of artifact was
   observed and *how many* times — not the source text.

## Modules

### `src/synth/discover.mjs`

```js
discoverSkills({ dir, extraPaths = [] })
//  -> [{ path, kind, name?, description? }]
```

Walks `dir` (default: project `.cto-brain/`) plus any `extraPaths`. Before
reading any file it skips it if `isCredentialPath(rel)`, the hard credential
floor, or a `.cto-brainignore` pattern matches. Returns descriptors:

- `path` — relative path (provenance).
- `kind` — coarse class inferred from the **name only** (`skill`, `doc`,
  `manifest`, `test`, `code-js`, `code-py`, `script`, `config`, `other`).
- `name` / `description` — present **only** for `SKILL.md`, parsed from
  frontmatter. Every other kind is metadata-only; its contents are never read.

### `src/synth/synthesize.mjs`

```js
synthesizeSkill({ candidates, topic })
//  -> { name, draftPath, content }
//  or { name, draftPath, content: "", refused: true, reason }
```

Aggregates the descriptors into provenance-only counts and produces a DRAFT
SKILL.md (`frontmatter + body`) describing the abstracted process for `topic`.
`draftPath` is always `.cto-brain/skills-draft/<name>/SKILL.md`.

Before returning, it **re-scans the generated `content`** with:

- the gate secret regexes (`/sk-[A-Za-z0-9]{20,}/`, `/AKIA[0-9A-Z]{16}/`),
- absolute filesystem paths (POSIX and Windows),
- URL and `ENV_VAR=value` leakage shapes.

Any hit returns `{ refused: true, reason, content: "" }`. The function is pure:
it does **not** write files.

## Parent integration (CLI wiring)

The modules are pure. The parent command does I/O:

```
cto-brain skill synth --topic <topic> [--dir <path>] [--path <extra> ...]
```

1. `const found = discoverSkills({ dir, extraPaths })`
2. `const draft = synthesizeSkill({ candidates: found, topic })`
3. If `draft.refused`, print `draft.reason` and exit non-zero — write nothing.
4. Else write `draft.content` to `draft.draftPath` (under the project).
5. Run `gate check` on the project root as a final hard floor before the human
   reviews. Drafts under `.cto-brain/skills-draft/` are gitignored by default.

Promotion out of `skills-draft/` into `skills/` is an explicit human step. The
synth command never performs it.
