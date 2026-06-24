# Contributing to cto-brain

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).

## CI

Every push/PR to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```bash
npm run ci    # gate check + 11 test suites
```

Releases: push a semver tag `v*.*.*` → [`.github/workflows/release.yml`](.github/workflows/release.yml) publishes to npm (needs `NPM_TOKEN` secret). See [docs/PUBLISH.md](docs/PUBLISH.md).

## Setup

```bash
git clone https://github.com/ggichuru/cto-brain.git
cd cto-brain
npm test
npm link   # optional: global `cto-brain` CLI
```

Requires **Node.js ≥ 20**.

## Test gate (required)

All changes must pass:

```bash
npm test
cto-brain gate check --home .
```

Eleven suites cover skills frontmatter, sync idempotency, secret gate, CLI init, and router
behavior. Do not skip hooks for merges to `main`.

## Change guidelines

1. **Skills** — edit under `skills/`; match agentskills.io frontmatter (`name`, `description`).
2. **CLI** — update `bin/cto-brain.mjs` usage string + root README command table.
3. **Router** — update `docs/MODEL-ROUTER.md` and tests under `test/router-*.mjs`.
4. **Benchmark** — after measurable changes, run `npm run benchmark` and update
   `docs/benchmark/SCORECARD.md` if numbers shifted.

## Pull requests

- One theme per PR when possible.
- No secrets in diffs (`.env`, `credentials.json`, API keys).
- No AI/agent attribution in commit messages (project convention).

## Security

See [SECURITY.md](./SECURITY.md). Do not open public issues for undisclosed credential leaks;
email the maintainer privately first.
