# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.7.x   | yes       |

## Reporting a vulnerability

If you find a security issue in **cto-brain** (CLI, sync, pack/unpack, gate):

1. **Do not** open a public GitHub issue with exploit details.
2. Contact the maintainer privately (GitHub security advisory or direct message).
3. Include reproduction steps and affected version.

## Design intent

- **Secrets stay out of the package.** `gate check` scans for credential paths before
  `pack` / `npm publish`. `.cto-brainignore` excludes sensitive paths from sync.
- **Encrypted packs** use AES-256-CBC; passphrase is never stored by cto-brain.
- **Sync is non-destructive** (`rsync -au`, no `--delete`) to avoid clobbering local brain data.

## Gate check (`cto-brain gate check`)

Run before pack, publish, or sharing brain tarballs. CI runs this via `npm run ci`.

**Credential path patterns** (always blocked):

| Pattern | Example |
|---------|---------|
| `credentials.json` | API credential store |
| `.credentials.json` | Hidden credential store |
| `history.jsonl` | Shell history export |
| `.env.local` | Local env overrides |
| `id_rsa` | SSH private key |
| `*.pem` | TLS / key material |

**Skill body scan:** `SKILL.md` files under `skills/` are checked for inline secrets
(`sk-…` OpenAI-style keys, `AKIA…` AWS access keys).

**Exit:** JSON with `"ok": true` when clean; non-zero exit and `"problems"` array when not.

## `.cto-brainignore`

Project or system brain roots can list extra paths to exclude from sync and pack
(one pattern per line, `#` comments allowed). Defaults in repo root:

```
credentials.json
.credentials.json
history.jsonl
.env
.env.local
*.pem
id_rsa
secrets/
```

Sync also skips built-in excludes: `node_modules/`, `.git/`, `*-workspace/`, `*.skill`.

## Operator responsibilities

- Do not commit `.env`, `credentials.json`, or API keys into `.cto-brain/`.
- Run `cto-brain gate check` before sharing brain tarballs.
- Proprietary skills belong in **encrypted** tier; see [docs/ENCRYPTED-PACKS.md](./docs/ENCRYPTED-PACKS.md).

## npm publish

Maintainers must use npm **2FA (authorization and writes)** or an scoped automation token.
See [docs/PUBLISH.md](./docs/PUBLISH.md).
