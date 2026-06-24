# cto-brain documentation

| Doc | Audience | Purpose |
|-----|----------|---------|
| **[USAGE.md](./USAGE.md)** | **Operator** | **End-to-end guide: init, sync, two-level router, agentic builds** |
| [MODEL-ROUTER.md](./MODEL-ROUTER.md) | Operator + dispatch | Router schema, task kinds, probe/select/plan workflow |
| [ENCRYPTED-PACKS.md](./ENCRYPTED-PACKS.md) | Operator + lead-CTO | Hybrid public / signed / encrypted skill tiers |
| [PUBLISH.md](./PUBLISH.md) | Maintainer | npm publish, 2FA, prepublish gate, GitHub Actions release |
| [router.json.example](./router.json.example) | Operator | Sample `.cto-brain/router.json` (project layer) |
| [router.system.json.example](./router.system.json.example) | Operator | Sample `~/.cto-brain/router.json` (system layer) |
| [benchmark/README.md](./benchmark/README.md) | Operator + evaluators | Why and how we benchmark vs 14 peers |
| [benchmark/SCORECARD.md](./benchmark/SCORECARD.md) | Evaluators | Measured numbers table |
| [benchmark/COMPETITORS.md](./benchmark/COMPETITORS.md) | Evaluators | Who each peer is and how it works |

## Bundled policy (agentskills.io)

Skills ship inside the npm package under `skills/`:

- `cto-orchestration` — nine CTO roles, reviewer trio, file-scope discipline
- `meta-brain` — intent router
- `agentic-learning-loop` — Role 9 learning ritual
- `multi-agent-execution` — parallel dispatch substrate

After install: `cto-brain sync --pull` → `cto-brain adapter wire`.

## Operator quick path

```bash
npm install -g cto-brain
cto-brain init --project --name my-app
cto-brain adapter wire
cto-brain doctor --strict
cto-brain router probe
```

Project integration: see root [README.md](../README.md).
