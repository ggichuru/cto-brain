// `cto-brain code` — a sovereign, local-model coding terminal.
//
// Default backend: opencode (open-source TUI), auto-wired with cto-brain by
// default — the cto-brain MCP server, a CTO-orchestration system prompt, a
// primary `cto` agent, and the local Ollama provider (no cloud, no account).
// Pick a model by capability (coder-first picker, --task auto-pick, --model
// explicit), and the terminal launches against it.
//
// The edge isn't the model — a local 14B won't out-reason a frontier model.
// The edge is orchestration: cto-brain routes per task, the skills/MCP tools
// ride along, and it all runs on your box for free, offline, private.
//
// Backends: opencode (default) · codex (--backend codex, OpenAI's CLI) ·
// aider (--backend aider, if installed). cto-brain stays backend-agnostic.

import { spawn } from "node:child_process";
import { tagModel, pickByTask, toolCapable, pickToolModel } from "../router/capabilities.mjs";
import { selectFromMenu, dim, green, sym } from "./ui.mjs";
import { ensureOpencodeWiring, ensureAiderConventions, ensureCodexMcp } from "./opencode-setup.mjs";

const OLLAMA_HOST = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");

async function listLocalChatModels() {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`ollama /api/tags HTTP ${res.status}`);
  const data = await res.json();
  const ids = (data.models || []).map((m) => m.name || m.model).filter(Boolean);
  return ids.filter((id) => tagModel(id).chat);
}

// Parse the `code` subcommand's own argv slice (so `--` passthrough survives).
export function parseCodeArgs(argv) {
  const rest = argv.slice(1); // drop the leading "code"
  const out = { model: null, task: null, backend: null, agent: null, noAgent: false,
                reconfigure: false, positional: null, passthrough: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--") { out.passthrough.push(...rest.slice(i + 1)); break; }
    else if (a === "--model" || a === "-m") out.model = rest[++i];
    else if (a.startsWith("--model=")) out.model = a.slice("--model=".length);
    else if (a === "--task") out.task = rest[++i];
    else if (a.startsWith("--task=")) out.task = a.slice("--task=".length);
    else if (a === "--backend") out.backend = rest[++i];
    else if (a.startsWith("--backend=")) out.backend = a.slice("--backend=".length);
    else if (a === "--agent") out.agent = rest[++i];
    else if (a.startsWith("--agent=")) out.agent = a.slice("--agent=".length);
    else if (a === "--no-agent") out.noAgent = true;
    else if (a === "--reconfigure") out.reconfigure = true;
    else if (!a.startsWith("-") && out.positional === null) out.positional = a;
    else out.passthrough.push(a);
  }
  return out;
}

function orderForPicker(models) {
  const rank = { coder: 0, reasoning: 1, general: 2, vision: 3 };
  return [...models].sort(
    (a, b) => (rank[tagModel(a).capability] ?? 9) - (rank[tagModel(b).capability] ?? 9),
  );
}

function warnIfNoTools(model, toolsRequired) {
  if (!toolsRequired) return;
  if (!toolCapable(model)) {
    process.stderr.write(`${sym.warn()} ${dim(model + " emits tool calls as text (no structured tool_calls) — agent actions may not execute. Prefer a *-instruct model.")}\n`);
  }
  if (tagModel(model).size === "large") {
    process.stderr.write(`${sym.warn()} ${dim(model + " is large — on local hardware it can run CPU-bound and respond very slowly (no response). Prefer a 7b/instruct model for interactive use.")}\n`);
  }
}

// Resolve a bare ollama model id: flag → positional name → task capability →
// interactive picker. When toolsRequired (agentic backends like opencode), pick
// among TOOL-CAPABLE models — a coder model that prints tool calls as text
// can't drive the agent loop. `local` = quick capable builder model.
async function resolveModel(opts, models, toolsRequired = false) {
  // Interactive (toolsRequired) caps at "mid" tier — large models run CPU-bound
  // and unusably slow on local hardware. 70b only via explicit --model.
  const pick = (task) =>
    toolsRequired
      ? (pickToolModel(models, task, { maxTier: "mid" }) || pickToolModel(models, task) || pickByTask(models, task))
      : pickByTask(models, task);
  if (opts.model) { const m = opts.model.replace(/^ollama\//, ""); warnIfNoTools(m, toolsRequired); return m; }
  if (opts.positional && opts.positional !== "local" && models.includes(opts.positional)) {
    warnIfNoTools(opts.positional, toolsRequired); return opts.positional;
  }
  if (opts.task) {
    const m = pick(opts.task);
    if (m) { process.stderr.write(`${sym.arrow()} ${dim("task")} ${opts.task} ${dim("→")} ${green(m)}\n`); return m; }
  }
  if (opts.positional === "local") {
    const m = pick("dispatch-builder");
    if (m) { process.stderr.write(`${sym.arrow()} ${dim("local →")} ${green(m)}\n`); return m; }
  }
  const items = orderForPicker(models).map((id) => {
    const t = tagModel(id);
    const noTools = toolsRequired && !toolCapable(id) ? " · no tools" : "";
    const slow = toolsRequired && t.size === "large" ? " · slow/CPU" : "";
    return { label: id, value: id, hint: `${t.capability} · ${t.size}${noTools}${slow}` };
  });
  // Default to a responsive tool-capable model (not large/CPU-bound) for opencode.
  let defaultIndex = toolsRequired
    ? items.findIndex((it) => toolCapable(it.value) && tagModel(it.value).size !== "large")
    : items.findIndex((it) => tagModel(it.value).capability === "coder");
  if (defaultIndex < 0) defaultIndex = toolsRequired ? items.findIndex((it) => toolCapable(it.value)) : 0;
  if (defaultIndex < 0) defaultIndex = 0;
  const title = toolsRequired ? "Pick a local model (tool-capable recommended)" : "Pick a local model";
  return selectFromMenu(title, items, { defaultIndex });
}

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) => resolve(code ?? 0));
    child.on("error", (e) => {
      process.stderr.write(`${sym.bad()} failed to launch ${cmd}: ${e.message}\n`);
      resolve(127);
    });
  });
}

async function launchOpencode(model, opts) {
  // Auto-wire cto-brain into opencode (idempotent; --reconfigure forces a rewrite).
  let models = [];
  try { models = await listLocalChatModels(); } catch { /* handled by caller */ }
  const w = ensureOpencodeWiring(models, { force: opts.reconfigure });
  if (w.written.length) process.stderr.write(`${sym.arrow()} ${dim("wired cto-brain into opencode")} ${dim("(" + w.configState + ")")}\n`);
  if (w.configState === "exists-unwired") {
    process.stderr.write(`${sym.warn()} ${dim("existing opencode config isn't cto-brain-wired; run")} cto-brain code --reconfigure ${dim("to regenerate")}\n`);
  }
  const agent = opts.noAgent ? null : (opts.agent || "cto");
  const args = [];
  if (agent) args.push("--agent", agent);
  args.push("-m", `ollama/${model}`, ...opts.passthrough);
  process.stderr.write(`${sym.arrow()} opencode on ${green("ollama/" + model)}${agent ? dim(" · agent " + agent) : ""} ${dim("(sovereign, local)")}\n`);
  const code = await run("opencode", args);
  if (code === 127) process.stderr.write(`  install it: ${dim("npm i -g opencode-ai")}\n`);
  return code;
}

async function launchCodex(model, opts) {
  const w = ensureCodexMcp(); // cto-brain MCP inbuilt by default
  process.stderr.write(`${sym.arrow()} codex on ${green(model)} ${dim("(local Ollama via --oss · cto-brain MCP " + (w.added ? "wired" : "ready") + ")")}\n`);
  const code = await run("codex", ["--oss", "--local-provider", "ollama", "-m", model, ...opts.passthrough]);
  if (code === 127) process.stderr.write(`  install codex, or use the default ${dim("opencode")} backend\n`);
  return code;
}

async function launchAider(model, opts) {
  const conv = ensureAiderConventions(); // cto-brain coding discipline (aider has no MCP)
  process.stderr.write(`${sym.arrow()} aider on ${green(model)} ${dim("(local Ollama · cto-brain conventions)")}\n`);
  const env = { ...process.env, OLLAMA_API_BASE: OLLAMA_HOST };
  const child = spawn("aider", ["--model", `ollama_chat/${model}`, "--read", conv, ...opts.passthrough], { stdio: "inherit", env });
  return new Promise((resolve) => {
    child.on("exit", (c) => resolve(c ?? 0));
    child.on("error", () => { process.stderr.write(`${sym.bad()} aider not found. install: ${dim("uv tool install aider-chat")}\n`); resolve(127); });
  });
}

export async function launchCode(argv) {
  const opts = parseCodeArgs(argv);
  const backend = (opts.backend || "opencode").toLowerCase();

  let models;
  try {
    models = await listLocalChatModels();
  } catch (e) {
    process.stderr.write(`${sym.bad()} cannot reach local Ollama at ${OLLAMA_HOST}: ${e.message}\n`);
    process.stderr.write(`  start Ollama (or set OLLAMA_HOST) and retry.\n`);
    return 1;
  }
  if (models.length === 0) {
    process.stderr.write(`${sym.bad()} no chat-capable models on ${OLLAMA_HOST} (try \`ollama pull qwen2.5-coder:14b\`)\n`);
    return 1;
  }

  const model = await resolveModel(opts, models, backend === "opencode");
  if (!model) { process.stderr.write(`${sym.bad()} no model selected.\n`); return 1; }

  if (backend === "codex") return launchCodex(model, opts);
  if (backend === "aider") return launchAider(model, opts);
  if (backend !== "opencode") {
    process.stderr.write(`${sym.bad()} unknown backend '${backend}'. use opencode | codex | aider.\n`);
    return 1;
  }
  return launchOpencode(model, opts);
}
