# {{projectName}} — CTO orchestration addendum

Project-specific layer on top of `cto-orchestration` skill (via `cto-brain`).
**Charter:** `CHARTER.md` · **Status:** `STATUS.md` · **Growth:** `GROWTH.md`

---

## File-scope map (dispatch boundaries)

Parent owns integrating commit and manifest wiring. Builders get disjoint scopes.

| Domain | Primary paths | Notes |
|--------|---------------|-------|
| (fill) | | |

**Collision rules:** two agents must not touch the same file.

---

## Validation matrix

```bash
# Run before every integrating commit
npm test   # or project-specific gate
```

---

## Integration round checklist

- [ ] Dispatch from clean HEAD
- [ ] Read every builder diff
- [ ] Run validation matrix
- [ ] Reviewer trio on security-sensitive surfaces
- [ ] Append STATUS.md + GROWTH.md
- [ ] `cto-brain round-close` for Role 9 ritual

---

## Skills sync discipline

- Project-local skills live in `.cto-brain/skills/`
- System brain: `~/.cto-brain/skills/` via `cto-brain sync`
- Wire to agents: `cto-brain adapter wire`
- Never sync credentials or history files
