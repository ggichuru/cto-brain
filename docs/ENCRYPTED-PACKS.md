# Encrypted skill packs (hybrid sharing)

Proprietary domain skills (client-specific, brand voice, unreleased IP) must **not** ship in the public npm tarball. Use encrypted packs instead.

## Pack (encrypted)

```bash
cto-brain gate check
cto-brain pack --encrypt --passphrase "$CTO_BRAIN_PACK_KEY" --output ./my-domain-skills.enc
```

Passphrase is **never** stored by cto-brain. Share out-of-band (1Password, Signal, in-person).

## Unpack

```bash
cto-brain unpack --input ./my-domain-skills.enc --decrypt --passphrase "$CTO_BRAIN_PACK_KEY"
cto-brain install
```

## Signed (team, non-encrypted)

```bash
cto-brain pack --output ./team-skills.tar.gz
shasum -a 256 ./team-skills.tar.gz > SHA256SUMS
# optional: cosign sign-blob ...
```

## Visibility tiers in manifest

Each skill in `brain-manifest.json` declares:

- `tier`: `public` | `signed` | `encrypted`
- `export`: `allowed` | `never`

Public npm core includes only orchestration process skills. Domain knowledge stays local or in encrypted packs.

## .cto-brainignore

Copy the template from the package root. Never pack/sync:

- `credentials.json`, `.env`, `*.pem`, `secrets/`

## Promotion to system brain

After a project round, promote general lessons:

```bash
cto-brain sync --promote
```

Project-specific feedback stays in `.cto-brain/memory/` until lead-CTO synthesis promotes it.
