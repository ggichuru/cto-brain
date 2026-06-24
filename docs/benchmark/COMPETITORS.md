# The 14 peers — who they are and how they work

This document explains **each comparison target** from the CTO Brain plan: what problem
it solves, how you install and operate it, and how that differs from **cto-brain**.

---

## 1. Sakana Fugu

**What it is:** Cloud multi-agent orchestrator exposed as a **single OpenAI-compatible
API**. Sakana’s router picks worker models and synthesizes one response. You do not see
the internal agent graph.

**How you use it:**

```bash
# One-line Codex install (macOS/Linux)
curl -fsSL https://sakana.ai/fugu/install.sh | bash
export SAKANA_API_KEY=...
codex -p fugu
# API: model=fugu or fugu-ultra, reasoning.effort high|xhigh
```

**Strength:** Frontier-quality answers without you managing agents. **Gap vs cto-brain:**
no local policy files, no file-scope discipline, no growth ledger, no secret gate before
share, vendor lock-in, closed weights.

**Pricing (public):** Standard **$20/mo**, Pro **$100/mo**, Max **$200/mo**; Fugu Ultra
pay-as-you-go **$5/$30** per 1M input/output tokens — [pricing](https://console.sakana.ai/pricing).

---

## 2. Orchestray

**What it is:** **npm plugin for Claude Code** that detects “complex” tasks, decomposes
them, spawns specialized agents, and returns audited results with cost analytics.

**How you use it:**

```bash
npx orchestray --global    # installs into ~/.claude/
# In Claude Code:
/orchestray:run "add rate limiting to the API"
/orchestray:config       # ~80 settings; complexity_threshold default 4
/orchestray:analytics    # cost breakdown
```

**Strength:** End-to-end execution inside Claude Code (rollback, resume, YAML workflows,
MCP plugin broker). **Gap vs cto-brain:** Claude-only; no Cursor/Codex adapters; no
encrypted skill tier; routing is complexity/cost heuristics, not auditable policy table;
partial overlap on KB/patterns but not Role 9 `round-close` ritual.

**Size:** **11.6 MB** unpacked (npm 2.3.12). **~202** weekly downloads (Jun 2026 snapshot).

---

## 3. fable5-orchestrator

**What it is:** **Claude Code plugin** focused on **Fable/Opus token discipline** — guard
hooks, ledger gates, frugal defaults when using Anthropic’s Fable profile.

**How you use it:** Install via Claude plugin marketplace; hooks run around agent turns.

**Strength:** Keeps Fable sessions from runaway spend. **Gap vs cto-brain:** routing and
guards only; no cross-project portfolio, no sync engine, no multi-IDE wire, Claude-only.

---

## 4. fable-harness (`@aao-sh/fable-harness`)

**What it is:** **npm harness** for Codex/Claude projects — decision loop, rollback,
project-local orchestration shell.

**How you use it:**

```bash
npx @aao-sh/fable-harness
```

**Strength:** Rollback + structured decision loop at project level. **Gap vs cto-brain:**
no CTO decomposition/reviewer trio bundle; **7.06 MB** unpacked; no system/project brain
sync or secret gate.

---

## 5. jro-fable

**What it is:** **Claude skill** — cost routing presets (Fable → Haiku/Sonnet) marketed
around large Fable bill reduction.

**How you use it:** Load skill in Claude Code; invoke when choosing model tier.

**Strength:** Simple cost routing for Fable users. **Gap vs cto-brain:** routing only, not
build orchestration; no CLI, no probe, no adapters.

---

## 6. Omegacode

**What it is:** **Global npm CLI** (`omegacode`) with JS workflow DSL for fan-out across
Claude, Codex, OpenCode, pi.

**How you use it:**

```bash
npm i -g omegacode
omegacode
```

**Strength:** Cross-agent worker fan-out. **Gap vs cto-brain:** no memory/learning loop,
no CHARTER/GROWTH templates, no encrypted packs (**2.36 MB** unpacked).

---

## 7. skills-npm

**What it is:** **npm distribution** for [agentskills.io](https://agentskills.io) — symlink
version-locked skills (often with bundled scripts) into agent skill dirs.

**How you use it:**

```bash
npx skills-npm setup
```

**Strength:** Smallest npm peer (**76.9 kB** unpacked); agent-agnostic install. **Gap vs
cto-brain:** distribution only — no orchestration process, router, round-close, or gate.

**Pairing:** cto-brain lists skills-npm as compatible; use skills-npm for skill delivery,
cto-brain for orchestration policy and sync.

---

## 8. agentskills.io (spec)

**What it is:** **Open format** for `SKILL.md` (frontmatter, progressive disclosure), not a
product.

**How you use it:** Author skills; adopters load via Claude Code, Cursor, Codex, or
skills-npm.

**Strength:** Interoperable skill documents. **Gap vs cto-brain:** no sync, gating, CLI, or
CTO roles — cto-brain **implements** the spec via `package.json` → `agentskills.skills`.

---

## 9. LangGraph.js (`@langchain/langgraph`)

**What it is:** **Graph state-machine framework** for durable multi-step agent workflows
(nodes, edges, checkpointing).

**How you use it:**

```bash
npm install @langchain/langgraph
# Define graph in application code
```

**Strength:** Production-grade agent graphs in your app. **Gap vs cto-brain:** you write
orchestration in code; no opinionated CTO posture, reviewer trio, or growth ledger
(**4.33 MB** unpacked).

---

## 10. CrewAI

**What it is:** **Python framework** for role-based agent crews and flows (independent of
LangChain).

**How you use it:**

```bash
pip install crewai
```

**Strength:** Fast multi-agent demos and crews. **Gap vs cto-brain:** no file-scope /
integrating-commit discipline in the box; **~7.67 MB** sdist; Python stack, not CLI brain
sync.

---

## 11. Continue.dev

**What it is:** **IDE extension** (VS Code, JetBrains) — rules, context providers, many
model backends in-editor.

**How you use it:** Install extension; configure `config.json` / rules.

**Strength:** Tight edit-compile loop in the IDE. **Gap vs cto-brain:** no round-close,
portfolio tier, or cross-repo brain sync; session/project rules only.

---

## 12. Cursor rules (`.cursor/rules`)

**What it is:** **Project-local rule files** (`.mdc`) injected into Cursor agent context.

**How you use it:** Add rules under `.cursor/rules/`; Cursor loads per session.

**Strength:** Deep Cursor integration. **Gap vs cto-brain:** Cursor-only; no system brain,
no encrypted packs — cto-brain `adapter wire` can create `cto-brain.mdc` if missing.

---

## 13. Claude Code skills (`~/.claude/skills`)

**What it is:** **Native skill directories** for Claude Code — same SKILL.md format as
agentskills.io.

**How you use it:** Drop skills in `~/.claude/skills/` or project `.claude/skills/`.

**Strength:** First-class in Claude Code. **Gap vs cto-brain:** no npm update path, no
project↔system sync, no gate — cto-brain `install` / `adapter wire` targets this dir.

---

## 14. Codex skills (`~/.agents/skills`)

**What it is:** **OpenAI Codex / agents** skill dir — same SKILL.md convention, different
path.

**How you use it:** Skills under `~/.agents/skills/`; Codex CLI loads automatically.

**Strength:** Cross-session memory for Codex. **Gap vs cto-brain:** no bundled orchestration
policy; cto-brain third adapter writes here on `adapter wire`.

---

## cto-brain — how it fits

```text
                    ┌─────────────────────────────────────┐
                    │  npm package cto-brain (~246 kB)     │
                    │  4 skills · 15 CLI cmds · 0 deps     │
                    └──────────────┬──────────────────────┘
                                   │
           sync --pull / install   │
                                   ▼
              ┌────────────────────────────────────────┐
              │  ~/.cto-brain/          .cto-brain/      │
              │  (system brain)         (project brain)  │
              └──────────────┬─────────────────────────┘
                             │ adapter wire
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ~/.claude/skills    .cursor/skills      ~/.agents/skills
   (Claude Code)        (+ rules)           (Codex)
```

**You still dispatch agents** in Claude Code, Cursor, or Codex. cto-brain answers:

- What policy do agents load? (skills + addendum)
- What file scopes and rituals apply? (`cto-orchestration` skill)
- Which model tier for this task kind? (`router select` + `reason` JSON)
- Are stacks up? (`router probe`, `stack status`)
- Is it safe to pack/share? (`gate check`)
- What did we learn this round? (`round-close` → GROWTH.md)

---

## When to combine tools

| Your need | Use |
|-----------|-----|
| Ship software with one human + many agents, auditable process | **cto-brain** |
| Auto-run complex Claude Code jobs with cost report | **Orchestray** (+ cto-brain policy in skills) |
| Best answer on hard reasoning, budget for API | **Sakana Fugu** (router can select `fugu` when keys present) |
| Version-lock skills with scripts on npm | **skills-npm** + **cto-brain** |
| Durable agent graph inside your product | **LangGraph** / **CrewAI** |
| In-editor coding UX | **Continue** / **Cursor** (wire cto-brain rules via adapter) |

---

## Further reading

- [README](./README.md) — methodology and re-run
- [SCORECARD.md](./SCORECARD.md) — numbers
- [MODEL-ROUTER.md](../MODEL-ROUTER.md) — cto-brain router details
