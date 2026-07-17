# ADR 0006 — Canonical portable skill storage

**Status:** Accepted (2026-07-17). Corrects a charter assumption with evidence.

## Context

The charter asks to "install all local Claude skills into OpenCode" and proposes a
`packages/skills/` source of truth installed/symlinked into `.agents/skills/`,
`.claude/skills/`, and `.opencode/skills/`.

Empirical finding: **OpenCode 1.18.3 already discovers and loads `SKILL.md` skills
from `~/.claude/skills/` and `.claude/skills/` by default** — the binary carries
`OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` and `OPENCODE_DISABLE_EXTERNAL_SKILLS`
flags (skills load unless explicitly disabled), alongside `.opencode/skills/`,
`~/.config/opencode/skills/`, `.agents/skills/`, and a config `skills:{paths,urls}`
key. The user's **40 local skills** at `~/.claude/skills/` are therefore *already*
visible to cto-code's OpenCode. Required frontmatter is minimal: `name` +
`description`.

So the real gap is **not** "get skills into OpenCode" — it is **canonical
ownership, validation, and discoverability**: several of the user's skills are
duplicated/mis-named (`prompting-context-engineering`,
`prompting-context-engineering.skill`, `prompting-context-engineering-workspace`;
same for `ulap-network-stack`), and cto-code ships its own product skills that need
a versioned home.

## Decision

**Canonical source of truth for cto-code's own skills is a package directory in
the repo** (target `packages/skills/`, or `skills/` until the repo goes
monorepo), each skill as:

```
<skill>/  ├─ SKILL.md  ├─ references/  ├─ scripts/  ├─ templates/  └─ tests/
```

(directories supported, not all required). Every `SKILL.md` must have a valid
lowercase-hyphenated `name`, a precise trigger description, a "when NOT to use"
section, declared inputs, a required process, evidence requirements, and expected
output — usable without undocumented ambient context.

**Installation strategy is discovery-first, not copy-first.** cto-code **relies on
OpenCode's native `.claude/skills` / `~/.claude/skills` loader** for the user's
existing personal skills (no copying needed). It provides an **idempotent
installer** that links (symlink where supported, copy where not) cto-code's *own*
product skills into the discovery locations, and a validator/doctor that catches
malformed or duplicate skills. New commands: `cto-code skills {list, validate,
install, doctor}`.

## Consequences

**Good:** honors what the kernel already does — no redundant tri-directory copies
of 40 skills that OpenCode reads natively; a single versioned home for cto-code's
product skills; validation catches the existing duplicate/mis-named skills; the
`.skill`/`-workspace` cruft gets surfaced instead of silently loaded.

**Bad / accepted risk:** loose-file directory spelling (`skill` vs `skills`, and
whether `.opencode/skills/<name>/SKILL.md` vs a flat file) is **UNPROVEN** and must
be confirmed by an empirical load test before the installer commits a layout;
`.claude/skills` auto-load can be disabled by env, so doctor must report the flag
state.

**Rejected alternative:** *copy/translate all 40 skills into three directories per
the charter.* Rejected — it duplicates content OpenCode already loads from
`~/.claude/skills`, creating three drifting copies to maintain. Link cto-code's own
skills; let the kernel discover the user's.
