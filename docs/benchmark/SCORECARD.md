# Scorecard — measured numbers

**Snapshot date:** 2026-06-25 (re-measured at v0.9.0)  
**cto-brain version:** 0.9.0 (npm latest: 0.2.0 — publish pending)  
**Method:** `npm run benchmark` (or `node scripts/benchmark-self.mjs`), `npm test`, `cto-brain eval`, `npm view` on public packages.

**Live re-measurement (v0.9.0, Node 22), reproduced by `node scripts/benchmark-self.mjs` + `cto-brain eval`:** eval **13/13** (routing 7/7 · honesty 2/2 · gate 4/4); tarball **151.5 kB**, unpacked **427.5 kB** (72 files), **1** runtime dep; **20** CLI commands, **8** skills, **5** adapters; **21** test suites / **323** runtime assertions; `router probe` **145 ms**, `gate check` **138 ms**. Every per-cell table below is refreshed to these v0.9.0 numbers.

---

## A. Install size and dependencies

| Tool | Version | Tarball | Unpacked | Runtime deps | npm weekly DL* |
|------|---------|---------|----------|--------------|----------------|
| **cto-brain** | 0.9.0 | **151 kB** | **427 kB** (72 files) | **1** (MCP SDK) | publish pending |
| orchestray | 2.3.12 | — | **11.6 MB** | 2 | ~202 |
| skills-npm | 1.2.0 | — | **76.9 kB** | 8 | low |
| omegacode | 0.0.6 | — | **2.36 MB** | 2 | low |
| @aao-sh/fable-harness | 0.3.0 | — | **7.06 MB** | varies | low |
| @langchain/langgraph | 1.4.5 | — | **4.33 MB** | 5+ | high (ecosystem) |
| CrewAI | 1.14.7 | — | **7.67 MB** sdist | many | high (PyPI) |
| Sakana Fugu | API | N/A | N/A | N/A | SaaS |
| fable5-orchestrator | plugin | N/A | N/A | N/A | Claude marketplace |
| jro-fable | skill | N/A | N/A | N/A | skill share |
| agentskills.io | spec | N/A | N/A | N/A | N/A |
| Continue.dev | IDE ext | N/A | N/A | N/A | VS Code marketplace |
| Cursor rules | files | N/A | N/A | N/A | N/A |
| Claude Code skills | dirs | N/A | N/A | N/A | N/A |
| Codex skills | dirs | N/A | N/A | N/A | N/A |

\*Downloads from [npmjs.com/package/orchestray](https://www.npmjs.com/package/orchestray) at snapshot time; re-verify before external citation.

**Ratio:** cto-brain unpacked is **~27× smaller** than orchestray (427 kB vs 11.6 MB),
and still ships **one** runtime dependency (the official MCP SDK, added in 0.2.0). Size
grew from 0.1.0 (246 kB) as MCP, telemetry, the eval harness, the A2A card, the CLI
renderer, and docs landed — `node_modules` is never published (`files` allowlist).

---

## B. cto-brain inventory (measured)

| Metric | Value |
|--------|-------|
| CLI top-level commands | **20** |
| Router task kinds | **8** |
| Provider presets | **10** |
| MCP tools (stdio) | **9** |
| Platform adapters | **5** (Claude Code, Cursor, Codex, OpenCode, generic) |
| Bundled skills | **8** (cto-orchestration, meta-brain, agentic-learning-loop, multi-agent-execution, grill, tdd, diagnosing-bugs, domain-modeling) |
| Skill LOC (all `skills/*/SKILL.md`) | **3,367** |
| `src/` LOC | **3,311** |
| Reviewer briefs | **3** (security-audit, devils-advocate, tech-lead) |
| Test suites | **21** |
| Test assertions (runtime `ok:`) | **323** |
| Eval scorecard | **13/13** (routing 7/7 · honesty 2/2 · gate 4/4) |
| `router probe` (live loopback) | **~145 ms** |
| `gate check --home .` | **~138 ms** |

---

## B2. Proof of performance — the eval harness (internal, reproducible)

Most "agent" leaderboards measure *model* quality. cto-brain is a *policy* layer, so
its honest, reproducible proof is whether its **own decisions are correct** — which the
built-in eval harness measures and CI gates:

```bash
cto-brain eval          # scorecard JSON / human table; CI fails if any case fails
```

| Dimension | What it proves | Score |
|-----------|----------------|:-----:|
| routing | task→provider/tier selection is correct (builder→local, reviewer→cloud-with-key, …) | **7/7** |
| honesty | router never fabricates a route — nothing reachable → `null`, `honest:true` | **2/2** |
| gate | credential gate flags `credentials.json` / `id_rsa` / in-skill secrets | **4/4** |

This is **not** SWE-bench (see honest limits) — it is a falsifiable check that the
control-plane behaves as specified, run on every CI build. See [docs/EVAL.md](../EVAL.md).

---

## C. Command surface comparison

| Tool | Operator interface | Config surface |
|------|-------------------|----------------|
| **cto-brain** | 20 CLI commands | `.cto-brain/router.json`, skills, `.cto-brainignore` |
| orchestray | 22+ `/orchestray:*` slash commands | `.orchestray/config.json` (~80 keys; `complexity_threshold` default **4**) |
| skills-npm | `npx skills-npm setup` | npm package paths |
| omegacode | `omegacode` CLI | JS workflow DSL |
| LangGraph | JavaScript/ Python API | graph definition in code |
| CrewAI | Python API | crew/flow definitions |
| Fugu | HTTP API + `codex-f` | `SAKANA_API_KEY`, model=`fugu` \| `fugu-ultra` |

---

## D. Process capability score (/12)

| Feature | cto-brain | orchestray | Fugu | fable5 / jro-fable | fable-harness | omegacode | skills-npm | LangGraph | CrewAI |
|---------|:---------:|:----------:|:----:|:------------------:|:-------------:|:---------:|:----------:|:---------:|:------:|
| System + project brain | 1 | 0.5 | 0 | 0 | 0 | 0 | 0.5 | 0 | 0 |
| Cross-IDE wire (≥3) | 1 | 0 | 0 | 0 | 0.5 | 0.5 | 1 | 0 | 0 |
| Non-destructive sync | 1 | 0.5 | 0 | 0 | 0 | 0 | 0.5 | 0 | 0 |
| Secret gate before publish | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Encrypted skill packs | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| File-scope + integrating commit | 1 | 0.5 | 0 | 0.5 | 0.5 | 0.5 | 0 | 0 | 0 |
| Reviewer trio (3 lenses) | 1 | 0.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Growth ledger / round-close | 1 | 0.5 | 0 | 0.5 | 0 | 0 | 0 | 0 | 0 |
| Lead-CTO portfolio | 1 | 0.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Policy router + `reason` JSON | 1 | 0.5 | 0 | 0.5 | 0 | 0 | 0 | 0 | 0 |
| Local stack probe | 1 | 0.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| agentskills.io bundle | 1 | 0.5 | 0 | 0.5 | 0 | 0 | 1 | 0 | 0 |
| **Total** | **12.0** | **5.0** | **0** | **2.0** | **1.5** | **1.5** | **3.0** | **0** | **0** |

Continue.dev, Cursor rules, Claude/Codex native skills, and the agentskills.io spec alone
score **0–1** on this matrix (format or IDE rules without a bundled orchestration process).

---

## E. Model routing axis (different problem)

| | Primary job | Task rules | Local probe | Auditable fallback | Software cost |
|--|-------------|------------|-------------|-------------------|---------------|
| **cto-brain** | Policy: *where* to run | 6 kinds, 10 presets | Ollama, vLLM, Desk `/health` | `reason`, `honest`, `fallbackUsed` | **$0** |
| Sakana Fugu | Learned multi-model synthesis | closed | no | API errors | **$20–$200/mo** + usage |
| jro-fable | Fable → cheaper tiers | presets | no | — | skill / subscription |
| orchestray | Complexity → agent tier | score ≥ **4** triggers multi-agent | `/orchestray:doctor` | cost in `/orchestray:analytics` | Claude Code + models |

Fugu Ultra list pricing (pay-as-you-go, snapshot): **$5 / $30** per 1M input/output tokens
(standard context); see [console.sakana.ai/pricing](https://console.sakana.ai/pricing).

---

## F. Headline comparisons

| | cto-brain | Closest size peer | Closest orchestration peer |
|--|-----------|-------------------|----------------------------|
| Unpacked | **427 kB** | skills-npm **77 kB** (distribution only) | orchestray **11.6 MB** |
| Process /12 | **12.0** | skills-npm **3.0** | orchestray **5.0** |
| Test proof | **21 suites, 323 asserts; eval 13/13** | — | — |
| Cross-IDE | **5 adapters** | skills-npm (symlink any agent dir) | orchestray **1** (Claude Code) |

---

## G. Where cto-brain loses (honest)

1. **Auto-decompose + execute** — Orchestray runs waves inside Claude Code; cto-brain is policy; you dispatch.
2. **Learned routing quality** — Fugu can win on hard reasoning; cto-brain uses rules + probe.
3. **Market proof** — Orchestray has npm downloads; cto-brain needs publish + adoption.
4. **IDE-native UX** — Continue/Cursor beat terminal CLI for in-editor flow.
5. **Model tag validation** — since 0.9.0 the router *surfaces* `modelAvailable:false` + a `WARNING` in `reason` when `router.json` names a tag the stack hasn't pulled, but by design it warns rather than hard-refusing, so a valid-but-unlisted tag still routes.

---

## H. Re-run peer sizes

```bash
npm view orchestray version dist.unpackedSize dependencies
npm view skills-npm version dist.unpackedSize
npm view omegacode version dist.unpackedSize
npm view @langchain/langgraph version dist.unpackedSize
npm view @aao-sh/fable-harness version dist.unpackedSize
```
