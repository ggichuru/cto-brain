# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | yes       |

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

## Operator responsibilities

- Do not commit `.env`, `credentials.json`, or API keys into `.cto-brain/`.
- Run `cto-brain gate check` before sharing brain tarballs.
- Proprietary skills belong in **encrypted** tier; see [docs/ENCRYPTED-PACKS.md](./docs/ENCRYPTED-PACKS.md).

## npm publish

Maintainers must use npm **2FA (authorization and writes)** or an scoped automation token.
See [docs/PUBLISH.md](./docs/PUBLISH.md).
