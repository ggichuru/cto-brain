// Auto-wire opencode as the sovereign cto-brain terminal.
//
// Generates (if missing) the opencode config that plugs cto-brain in by default:
//   ~/.config/opencode/opencode.jsonc  — ollama (local) provider with the live
//                                         model roster + the cto-brain MCP server
//   ~/.config/opencode/cto-brain.md     — the CTO-orchestration system prompt
//   ~/.config/opencode/agent/cto.md     — a primary `cto` agent using that prompt
//
// Schema + invocations verified live against opencode 1.17.11 (provider/model
// id format, `@ai-sdk/openai-compatible` auto-install, MCP `type:local` +
// absolute command path, config precedence). The model map is built from live
// `/api/tags` discovery so new local models are picked up automatically.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { tagModel, pickByTask, pickToolModel, fitsLocalGpu } from "../router/capabilities.mjs";

export function opencodeConfigDir() {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "opencode");
}

// Absolute path to a cto-brain binary opencode can spawn (it spawns a process,
// not a shell — so the shell function/alias won't do). Prefer ~/bin/cto-brain
// (the verified wrapper), else the running binary, else bare name on PATH.
export function ctoBrainBin() {
  const home = os.homedir();
  const candidates = [
    path.join(home, "bin", "cto-brain"),
    process.argv[1] && fs.existsSync(process.argv[1]) ? process.argv[1] : null,
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return c; } catch { /* ignore */ }
  }
  return "cto-brain";
}

const CTO_PROMPT = `# CTO-orchestration operating discipline

You operate as the CTO / engineering lead under the cto-brain policy. You run
on **local, sovereign models** (Ollama on this box) — no cloud, no data leaves
the machine. The \`cto-brain\` MCP server is wired in; prefer its tools over
improvising the mechanics.

## Posture
- You are the orchestrator, not just a coder. Assess scope before acting:
  trivial → do it; multi-slice / multi-file / multi-theme → decompose and
  dispatch in parallel with non-overlapping file scopes.
- Freeze contracts (interfaces, schemas, file boundaries) before fan-out.
  Integrate with a single reviewing commit. Sub-agents never commit.
- Reviewer-trio gate before declaring done: correctness, simplicity, security.
- Done = merged + tested + tracked. Never end with dispatched work pending.

## Use the cto-brain MCP tools at round moments
- Pick model/runtime per task (auditable, local-first): \`router_probe\`,
  \`router_select\`, \`router_plan\`. Believe \`modelAvailable:false\`.
- Reachable stacks: \`stack_status\`. Where skills are wired: \`adapter_status\`.
- Before pack/share — credential gate: \`gate_check\`.
- Round close (the learning ritual; mutating — call deliberately at round
  boundaries, never per-loop): \`round_close\`. Measure: \`eval_run\`.

## Discipline
- Verify, don't guess. Reproduce bugs before fixing; read the FIRST error in a
  chain, not the last. Lock fixes with a regression test.
- No AI/agent attribution in commits, PRs, or changelogs — ever.
- Keep changes scoped to what was asked. Don't gold-plate, don't half-finish.
- All telemetry is local only.
`;

function ctoAgent(defaultModelId) {
  return `---
description: CTO/engineering-lead orchestrator running on local sovereign models under cto-brain discipline. Use for scope assessment, decomposition, parallel dispatch, integration, and round-close.
mode: primary
model: ${defaultModelId}
temperature: 0.2
---

You operate as the CTO / engineering lead under the cto-brain policy, on local
Ollama models only (no cloud). The cto-brain MCP server is wired in — prefer its
tools (router_select, router_probe, router_plan, stack_status, adapter_status,
gate_check, round_close, eval_run, agent_card) over improvising the mechanics.

Posture: orchestrate, don't just code. Assess scope first; decompose multi-slice
work into parallel non-overlapping file scopes; freeze contracts before fan-out;
integrate with a single reviewing commit. Reviewer-trio gate (correctness,
simplicity, security) before declaring done. Done = merged + tested + tracked.
Verify, don't guess. No AI/agent attribution anywhere. Telemetry is local only.
`;
}

// Build the opencode config object from the live local-model roster.
export function buildOpencodeConfig(models, { baseUrl = "http://127.0.0.1:11434/v1", mcpBin } = {}) {
  // Only list GPU-safe models — exclude box-tanking giants (30b+ on GB10 spill to
  // CPU) so opencode's own model picker can't load one and slow the machine.
  const chat = models.filter((id) => tagModel(id).chat && fitsLocalGpu(id));
  const modelsMap = {};
  for (const id of chat) {
    const t = tagModel(id);
    const suffix = t.capability === "vision" ? ", vision" : "";
    modelsMap[id] = { name: `${id} (local${suffix})` };
  }
  // Default to a TOOL-CAPABLE model — opencode is agentic (every action is a
  // tool call), so a coder that prints tool calls as text can't drive it.
  const best = pickToolModel(chat, "dispatch-builder") || pickByTask(chat, "dispatch-builder") || chat[0];
  return {
    $schema: "https://opencode.ai/config.json",
    instructions: ["~/.config/opencode/cto-brain.md"],
    model: best ? `ollama/${best}` : undefined,
    provider: {
      ollama: {
        npm: "@ai-sdk/openai-compatible",
        name: "Ollama (local)",
        options: { baseURL: baseUrl },
        models: modelsMap,
      },
    },
    mcp: {
      "cto-brain": { type: "local", command: [mcpBin, "mcp"], enabled: true },
    },
  };
}

// cto-brain coding discipline for aider (which has no MCP — gets the prompt as a
// read-only convention file). Accurate for an edit-format coder: no MCP claims.
const AIDER_CONVENTIONS = `# cto-brain coding conventions

You code under the cto-brain discipline on local, sovereign models (no cloud,
nothing leaves the machine).

- Verify, don't guess. Reproduce a bug before fixing it; read the FIRST error in
  a chain, not the last. Lock fixes with a test.
- Keep changes scoped to exactly what was asked. Don't gold-plate; don't
  half-finish. Prefer the smallest correct, reviewable diff.
- Match the existing code's style, naming, and structure.
- No AI/agent attribution in code, comments, commits, or messages — ever.
`;

// Wire cto-brain into aider (no MCP support → a --read convention file). Returns
// the conventions path for the launcher to pass via `aider --read <path>`.
export function ensureAiderConventions({ force = false } = {}) {
  const p = path.join(os.homedir(), ".config", "cto-brain", "CONVENTIONS.md");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (force || !fs.existsSync(p)) fs.writeFileSync(p, AIDER_CONVENTIONS);
  return p;
}

// Wire the cto-brain MCP server into codex (~/.codex/config.toml). Idempotent —
// appends [mcp_servers.cto-brain] if absent. Codex loads it on launch.
export function ensureCodexMcp() {
  const cfg = path.join(os.homedir(), ".codex", "config.toml");
  let toml = "";
  try { toml = fs.readFileSync(cfg, "utf8"); } catch { /* no config yet */ }
  if (/\[mcp_servers\.cto-brain\]/.test(toml)) return { wired: true, added: false };
  const bin = ctoBrainBin();
  const block = `\n[mcp_servers.cto-brain]\ncommand = ${JSON.stringify(bin)}\nargs = ["mcp"]\n`;
  fs.mkdirSync(path.dirname(cfg), { recursive: true });
  fs.appendFileSync(cfg, (toml && !toml.endsWith("\n") ? "\n" : "") + block);
  return { wired: true, added: true };
}

// Returns true if an existing config already wires the ollama provider + cto-brain MCP.
function isWired(cfgPath) {
  try {
    const raw = fs.readFileSync(cfgPath, "utf8");
    return /"ollama"/.test(raw) && /"cto-brain"/.test(raw);
  } catch { return false; }
}

// Ensure opencode is wired for cto-brain. Writes missing files; never clobbers an
// existing config unless force=true (then backs it up). Returns a status object.
export function ensureOpencodeWiring(models, { force = false } = {}) {
  const dir = opencodeConfigDir();
  const cfgPath = path.join(dir, "opencode.jsonc");
  const promptPath = path.join(dir, "cto-brain.md");
  const agentPath = path.join(dir, "agent", "cto.md");
  const written = [];

  fs.mkdirSync(path.join(dir, "agent"), { recursive: true });

  if (force || !fs.existsSync(promptPath)) { fs.writeFileSync(promptPath, CTO_PROMPT); written.push(promptPath); }

  const cfg = buildOpencodeConfig(models, { mcpBin: ctoBrainBin() });
  const defaultModelId = cfg.model || "ollama/qwen2.5-coder:14b";
  if (force || !fs.existsSync(agentPath)) { fs.writeFileSync(agentPath, ctoAgent(defaultModelId)); written.push(agentPath); }

  let configState = "kept";
  if (force || !fs.existsSync(cfgPath)) {
    if (force && fs.existsSync(cfgPath)) fs.copyFileSync(cfgPath, cfgPath + ".bak");
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
    written.push(cfgPath);
    configState = force ? "rewritten" : "created";
  } else if (!isWired(cfgPath)) {
    configState = "exists-unwired"; // present but missing our provider/mcp — leave it, hint --reconfigure
  } else {
    configState = "wired";
  }

  return { dir, cfgPath, written, configState, defaultModelId };
}
