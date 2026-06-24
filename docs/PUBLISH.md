# Publishing cto-brain to npm

## Preconditions

| Check | Command | Expected |
|-------|---------|----------|
| Secret gate | `cto-brain gate check --home .` | `"ok": true` |
| Test matrix | `npm test` | 11 suites, all green |
| Tarball scope | `npm pack --dry-run` | No `.cto-brain/`, `test/`, secrets |
| npm auth | `npm whoami` | Your npm username |
| **2FA writes** | [npm profile → Authentication](https://www.npmjs.com/settings/~account/tfa) | **Authorization and writes** enabled |

Without 2FA (or a granular publish token with bypass), publish fails:

```text
403 Forbidden - Two-factor authentication or granular access token
with bypass 2fa enabled is required to publish packages.
```

## Publish

```bash
cd /path/to/cto-brain
npm publish --access public
# Enter OTP when prompted (if using password login + 2FA, not a bypass token)
npm view cto-brain version
```

### Publish with an npm token (recommended for CI or token-only auth)

**Do not** run `npm publish access public --token ...` — npm 11 treats `access` as a
package name and rejects `--token` as an unknown flag.

**Option A — one-shot (safest; token not saved to disk):**

```bash
cd /path/to/cto-brain
npm publish --access public \
  --//registry.npmjs.org/:_authToken=npm_YOUR_TOKEN_HERE
```

**Option B — login via token (persists in `~/.npmrc`):**

```bash
npm config set //registry.npmjs.org/:_authToken npm_YOUR_TOKEN_HERE
npm whoami   # should print your username
cd /path/to/cto-brain
npm publish --access public
```

**Option C — environment variable:**

```bash
export NPM_TOKEN=npm_YOUR_TOKEN_HERE
npm publish --access public --//registry.npmjs.org/:_authToken=$NPM_TOKEN
```

Granular access token checklist on [npmjs.com → Access Tokens](https://www.npmjs.com/settings/~account/tokens):

- Type: **Granular Access Token** (or classic with publish scope)
- Permissions: **Read and write** for packages (or scope to `cto-brain`)
- For automation without OTP: enable **Bypass 2FA for publish** if your account shows it

Verify before publish:

```bash
npm whoami
npm view cto-brain name 2>&1   # 404 = name still free
```

`prepublishOnly` runs `gate check` + full `npm test` automatically.

### Provenance (CI only)

Do **not** set `"provenance": true` in `publishConfig` — local `npm publish` then fails with:

```text
EUSAGE Automatic provenance generation not supported for provider: null
```

Provenance (npm ↔ GitHub supply-chain attestation) is enabled only in
[`.github/workflows/release.yml`](../.github/workflows/release.yml) via `npm publish --provenance`
with OIDC (`id-token: write`). Publish locally without it; tag pushes use Actions for provenance.

## Post-publish

```bash
npm install -g cto-brain@0.1.0
cto-brain doctor --strict
```

Consumers can pin semver in `package.json`:

```json
"devDependencies": { "cto-brain": "^0.1.0" }
```

## What ships in the tarball

Controlled by `package.json` → `files`:

- `bin/`, `src/`, `skills/`, `templates/`, `pipeline/`, `schema/`, `docs/`, `LICENSE`, `README.md`

**Excluded:** `test/`, `scripts/`, `.cto-brain/`, local router overrides, `.git/`.

## Version bumps

Use semver. After `0.1.0`:

1. Update `version` in `package.json`
2. `npm run ci` + `npm run benchmark`
3. Commit, tag, push:

```bash
git tag v0.1.1
git push origin main --tags
```

GitHub Actions **release** workflow publishes on `v*.*.*` tags when `NPM_TOKEN` is set
(see below). Or publish manually from your machine.

### Push to GitHub (one-liner)

```bash
git remote add origin https://github.com/ggichuru/cto-brain.git 2>/dev/null || true
git push -u origin main && git push origin --tags
```

### GitHub secret for CI publish

Repo → **Settings → Secrets and variables → Actions** → New repository secret:

| Name | Value |
|------|--------|
| `NPM_TOKEN` | npm granular token (Read and write packages; **Bypass 2FA for publish** if offered) |

Manual publish without Actions: see token options above.

## Repository URL

Set `repository`, `homepage`, and `bugs` in `package.json` before first publish if the
GitHub remote differs from the default `github.com/ggichuru/cto-brain`.
