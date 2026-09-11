# GitHub Actions

| Workflow | Trigger | What it runs |
|----------|---------|--------------|
| [ci.yml](./ci.yml) | push/PR → `main` | `npm run ci` + tarball scope check |
| [release.yml](./release.yml) | tag `v*.*.*` | `npm run ci` → `npm publish --provenance` |

**Setup (once):**

1. Create `github.com/ggichuru/cto-brain` and push `main`.
2. Add secret `NPM_TOKEN` for automated npm publish on tags.
3. First manual publish can use local token; tag-driven releases use Actions after that.

No deploy jobs, no matrix bloat. CI runs `npm ci` before the gate: this package has a
runtime dependency (`@modelcontextprotocol/sdk`), added 2026-06-24. The install step was
missing until 2026-09-11 while this line still claimed otherwise, so every run from
2026-07-17 onward failed on `ERR_MODULE_NOT_FOUND` — and `release.yml` shares the gate,
so no tag could publish. If a dependency is ever removed, change the workflow first and
this line second.
