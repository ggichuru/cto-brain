// `cto-brain code` — a Claude-Code-style coding terminal on local models.
//
// Phase 0: pick a model from the on-box Ollama (capability-aware, coder-first),
// then launch codex against it via codex's built-in, proven `--oss
// --local-provider ollama` path. No bridge, no auth, no remote dependency —
// the models jarvis fronts are this box's own Ollama (verified identical
// rosters), so on-box we talk to them directly.
//
// (Phase 1 — remote: a `--jarvis` mode that routes codex to jarvis.mkulyma.com
// for off-box use, via the gateway bridge once codex's Responses-API wire is
// solved. Deliberately NOT wired here; we don't claim what isn't proven.)

import { spawn } from "node:child_process";
import { tagModel, pickByTask } from "../router/capabilities.mjs";
import { selectFromMenu, dim, green, sym } from "./ui.mjs";

const OLLAMA_HOST = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");

// Discover chat-capable models from the local Ollama (excludes embed/arena via tagModel).
async function listLocalChatModels() {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`ollama /api/tags HTTP ${res.status}`);
  const data = await res.json();
  const ids = (data.models || []).map((m) => m.name || m.model).filter(Boolean);
  return ids.filter((id) => tagModel(id).chat);
}

// Parse the `code` subcommand's own argv slice. Handles `--model`/`-m`,
// `--task`, a bare positional (model name, or `local` = default mode), and
// `--` passthrough to codex. Done here (not via the global parser) so `--`
// and arbitrary codex flags survive untouched.
export function parseCodeArgs(argv) {
  const rest = argv.slice(1); // drop the leading "code"
  const out = { model: null, task: null, positional: null, passthrough: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--") { out.passthrough.push(...rest.slice(i + 1)); break; }
    else if (a === "--model" || a === "-m") out.model = rest[++i];
    else if (a.startsWith("--model=")) out.model = a.slice("--model=".length);
    else if (a === "--task") out.task = rest[++i];
    else if (a.startsWith("--task=")) out.task = a.slice("--task=".length);
    else if (!a.startsWith("-") && out.positional === null) out.positional = a;
    else out.passthrough.push(a);
  }
  return out;
}

// Coder → reasoning → general → vision, so the most useful coding model is first.
function orderForPicker(models) {
  const rank = { coder: 0, reasoning: 1, general: 2, vision: 3 };
  return [...models].sort(
    (a, b) => (rank[tagModel(a).capability] ?? 9) - (rank[tagModel(b).capability] ?? 9),
  );
}

// Resolve the model to use: explicit flag → positional model name → task
// capability → interactive picker (coder default).
async function resolveModel(opts, models) {
  if (opts.model) return opts.model;
  if (opts.positional && opts.positional !== "local" && models.includes(opts.positional)) {
    return opts.positional;
  }
  if (opts.task) {
    const m = pickByTask(models, opts.task);
    if (m) {
      process.stderr.write(`${sym.arrow()} ${dim("task")} ${opts.task} ${dim("→")} ${green(m)}\n`);
      return m;
    }
  }
  // `code local` is the quick-launch alias: best local coder, no prompt (back-compat).
  if (opts.positional === "local") {
    const m = pickByTask(models, "dispatch-builder");
    if (m) {
      process.stderr.write(`${sym.arrow()} ${dim("local →")} ${green(m)}\n`);
      return m;
    }
  }
  const items = orderForPicker(models).map((id) => {
    const t = tagModel(id);
    return { label: id, value: id, hint: `${t.capability} · ${t.size}` };
  });
  const defaultIndex = Math.max(0, items.findIndex((it) => tagModel(it.value).capability === "coder"));
  return selectFromMenu("Pick a local model for codex", items, { defaultIndex });
}

// Entry point. Returns codex's exit code.
export async function launchCode(argv) {
  const opts = parseCodeArgs(argv);

  let models;
  try {
    models = await listLocalChatModels();
  } catch (e) {
    process.stderr.write(`${sym.bad()} cannot reach local Ollama at ${OLLAMA_HOST}: ${e.message}\n`);
    process.stderr.write(`  start Ollama (or set OLLAMA_HOST) and retry.\n`);
    return 1;
  }
  if (models.length === 0) {
    process.stderr.write(`${sym.bad()} no chat-capable models on ${OLLAMA_HOST} (pull one with \`ollama pull qwen2.5-coder:14b\`)\n`);
    return 1;
  }

  const model = await resolveModel(opts, models);
  if (!model) {
    process.stderr.write(`${sym.bad()} no model selected.\n`);
    return 1;
  }

  const codexArgs = ["--oss", "--local-provider", "ollama", "-m", model, ...opts.passthrough];
  process.stderr.write(`${sym.arrow()} launching codex on ${green(model)} ${dim("(local Ollama via --oss)")}\n`);

  return await new Promise((resolve) => {
    const child = spawn("codex", codexArgs, { stdio: "inherit" });
    child.on("exit", (code) => resolve(code ?? 0));
    child.on("error", (e) => {
      process.stderr.write(`${sym.bad()} failed to launch codex: ${e.message}\n`);
      process.stderr.write(`  is codex installed and on PATH? (\`command -v codex\`)\n`);
      resolve(127);
    });
  });
}
