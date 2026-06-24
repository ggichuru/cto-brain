# GitHub Actions

| Workflow | Trigger | What it runs |
|----------|---------|--------------|
| [ci.yml](./ci.yml) | push/PR → `main` | `npm run ci` + tarball scope check |
| [release.yml](./release.yml) | tag `v*.*.*` | `npm run ci` → `npm publish --provenance` |

**Setup (once):**

1. Create `github.com/mkulyma/cto-brain` and push `main`.
2. Add secret `NPM_TOKEN` for automated npm publish on tags.
3. First manual publish can use local token; tag-driven releases use Actions after that.

No deploy jobs, no matrix bloat — zero npm dependencies, so CI skips `npm install`.
