#!/usr/bin/env node
import { initProjectBrain, initSystemBrain, pullPackageToSystem, syncSystemProject } from "../src/sync/brain-sync.mjs";
import { runDoctor, installToAgents, writeHookInstall } from "../src/cli/doctor.mjs";
import { adapterList, adapterPick, adapterStatus, formatAdapterListTable, wireSkills } from "../src/cli/adapters.mjs";
import { roundClose, deployCto } from "../src/cli/round-close.mjs";
import { writeWeeklyDigest } from "../src/cli/digest.mjs";
import { gateCheck, packBrain, unpackBrain } from "../src/gate/pack.mjs";
import { routerInit, routerList, routerPlan, routerProbe, routerSelect, stackStatus, TASK_KINDS } from "../src/cli/router.mjs";
import { startStdioServer } from "../src/mcp/server.mjs";
import { startHttpServer } from "../src/mcp/streamableHttp.mjs";
import { startGateway } from "../src/gateway/bridge.mjs";
import { launchCode } from "../src/cli/code.mjs";
import { runChat, chatHelp } from "../src/cli/chat.mjs";
import { scaffoldChange, checkSpecs } from "../src/spec/contract.mjs";
import { summarize as telemetrySummarize } from "../src/telemetry/recorder.mjs";
import { runEval } from "../src/eval/runner.mjs";
import { buildAgentCard } from "../src/a2a/card.mjs";
import { discoverSkills } from "../src/synth/discover.mjs";
import { synthesizeSkill } from "../src/synth/synthesize.mjs";
import fs from "node:fs";
import path from "node:path";
import { setColorEnabled, useJson, heading, dim, bold, cyan } from "../src/cli/ui.mjs";
import * as render from "../src/cli/render.mjs";
import { systemBrainHome } from "../src/paths.mjs";

// Print `data` as human-readable (terminal) or raw JSON (piped / --json).
function emit(args, data, renderFn) {
  if (renderFn && !useJson(args)) console.log(renderFn(data));
  else console.log(JSON.stringify(data, null, 2));
}

function usage() {
  const groups = [
    ["Setup", [
      ["init [--project] [--name <project>]", "Bootstrap system + optional project brain"],
      ["sync [--pull|--promote|--project-only] [--wire]", "Non-destructive system ↔ project sync"],
      ["install [--adapters …] [--project|--global]", "Wire skills to agent platforms"],
      ["doctor [--strict]", "Health check: skills, credentials, adapters"],
    ]],
    ["Skills & adapters", [
      ["adapter list|pick|wire|status [--adapters …]", "Manage platform skill wiring"],
      ["spec init <change-id> [--dir <root>]", "Scaffold an openspec-style change contract"],
      ["spec check [--dir <root>]", "Lint spec proposals for required sections"],
      ["round-close --tag <t> --summary <s> [--lesson <l>] [--outcome <o>] [--tokens-in <n>] [--tokens-out <n>]", "Append growth-ledger row (+feedback) + outcome telemetry"],
      ["deploy-cto [--name <project>]", "Charter + portfolio register + first brief"],
      ["digest [--week YYYY-Www]", "Weekly lead-CTO portfolio digest"],
    ]],
    ["Router", [
      ["router list", "List providers"],
      ["router probe [--all]", "Probe reachable stacks/providers"],
      ["router select --task <kind> [--prefer …]", "Resolve one task's route"],
      ["router plan [--prefer local|cloud|auto]", "Full task→route matrix"],
      ["router init [--force] [--system]", "Write a router.json layer"],
      ["stack status", "Configured-stack reachability"],
    ]],
    ["Serve, measure & ship", [
      ["code [<model>|--task <kind>|--model <m>] [--backend opencode|codex|aider]", "Sovereign local-model coding terminal (opencode + cto-brain wired in)"],
      ["chat [--port N] [--host H] [--config <p>] [--provider <id>] [--model <m>]", "Secure-Brain chat — doc-grounded, gated, your models"],
      ["mcp [--transport=http] [--port N] [--allow-origin <o>]", "Run as an MCP server (stdio default, or HTTP)"],
      ["gateway [--port N] [--jarvis-base URL]", "Local OpenAI→Ollama bridge to jarvis (loopback)"],
      ["agent-card [--out <path>]", "Emit the A2A agent card (discovery)"],
      ["telemetry summary", "Local run-telemetry KPIs"],
      ["eval", "Score routing/honesty/gate decisions"],
      ["skill synth --topic <t> [--dir <p>]", "Synthesize a DRAFT skill (privacy-gated)"],
      ["gate check [--home <path>]", "Scan for credential leaks"],
      ["pack / unpack [--encrypt]", "Signed/encrypted skill packs"],
      ["preflight dispatch|commit", "Pre-flight checklists"],
      ["hook install", "Post-turn project-sync hook"],
    ]],
  ];
  const lines = [`${bold("cto-brain")} ${dim("— portable CTO orchestration brain")}`, ""];
  for (const [title, cmds] of groups) {
    lines.push(heading(title));
    const w = Math.max(...cmds.map(([c]) => c.length));
    for (const [c, desc] of cmds) lines.push(`  ${cyan("cto-brain")} ${c.padEnd(w)}  ${dim(desc)}`);
    lines.push("");
  }
  lines.push(heading("Examples"));
  for (const ex of [
    ["cto-brain init --project --name my-app", "set up the brain in a repo"],
    ["cto-brain router plan", "see the task→model table (add --json for CI)"],
    ["cto-brain router select --task reviewer-security --prefer cloud", "route one task"],
    ["cto-brain eval", "score the brain's own routing/honesty/gate decisions"],
    ["cto-brain gate check --home .", "scan for leaked secrets before you share"],
    ["cto-brain mcp --transport=http --port 3737", "run as a remote MCP service"],
    ["cto-brain skill synth --topic 'rate limiting' --dir ./svc", "draft a skill (privacy-gated)"],
  ]) {
    lines.push(`  ${cyan(ex[0])}`);
    lines.push(`    ${dim(ex[1])}`);
  }
  lines.push("");
  lines.push(dim("Global flags: --json (machine output), --no-color, --help/-h. Human output in a terminal; JSON when piped. Worked examples: docs/EXAMPLES.md."));
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project") args.project = true;
    else if (a === "--global") args.global = true;
    else if (a === "--pull") args.pull = true;
    else if (a === "--promote") args.promote = true;
    else if (a === "--project-only") args.projectOnly = true;
    else if (a === "--wire") args.wire = true;
    else if (a === "--strict") args.strict = true;
    else if (a === "--list") args.list = true;
    else if (a === "--encrypt") args.encrypt = true;
    else if (a === "--decrypt") args.decrypt = true;
    else if (a === "--no-rules") args.noRules = true;
    else if (a === "--force") args.force = true;
    else if (a === "--all") args.all = true;
    else if (a === "--system") args.system = true;
    else if (a === "--json") args.json = true;
    else if (a === "--no-color") args.noColor = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        const key = a.slice(2, eq).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        args[key] = a.slice(eq + 1); // --key=value
      } else {
        const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        args[key] = argv[++i]; // --key value
      }
    } else args._.push(a);
  }
  return args;
}

function preflight(kind) {
  if (kind === "dispatch") {
    console.log(`Pre-dispatch checklist:
- [ ] Punch list with file:line refs
- [ ] 2-6 themes, non-overlapping file scopes
- [ ] Six-section brief per agent
- [ ] Validation commands chosen
- [ ] Migration numbers assigned
- [ ] DO NOT TOUCH lists explicit
- [ ] Dispatch all in ONE message`);
    return;
  }
  console.log(`Pre-commit checklist:
- [ ] All agent structured summaries received
- [ ] git diff reviewed; file-scoped git add
- [ ] Validation matrix green
- [ ] Reviewer findings triaged
- [ ] Commit message names every theme
- [ ] No AI/agent attribution`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.noColor) setColorEnabled(false);
  const cmd = args._[0];
  const sub = args._[1];

  if (cmd === "help" || (args.help && !cmd)) {
    console.log(usage());
    return;
  }

  try {
    switch (cmd) {
      case "init": {
        const layout = initSystemBrain();
        console.log(`System brain: ${layout.home}`);
        const pull = pullPackageToSystem();
        console.log(`Bundled skills installed: ${pull.skills.join(", ")}`);
        if (args.project) {
          const proj = initProjectBrain({ projectName: args.name, cwd: process.cwd() });
          console.log(`Project brain: ${proj.home}`);
        }
        break;
      }
      case "sync": {
        if (args.pull) {
          pullPackageToSystem();
          console.log("Pulled npm package skills → system brain");
        }
        const r = syncSystemProject({
          cwd: process.cwd(),
          pull: args.pull,
          promote: args.promote,
          projectOnly: args.projectOnly,
        });
        console.log(`Sync (${r.direction}):`, JSON.stringify(r.results, null, 2));
        if (args.wire) {
          const w = wireSkills({
            cwd: process.cwd(),
            project: args.project,
            global: args.global,
            withRules: !args.noRules,
          });
          console.log(`Wired ${w.skills.length} skills to: ${w.enabled.join(", ")} (scope=${w.scope})`);
        }
        break;
      }
      case "install": {
        const ids = args.adapters ? args.adapters.split(",") : ["claude-code", "cursor", "codex"];
        const r = installToAgents({
          adapters: ids,
          cwd: process.cwd(),
          project: args.project,
          global: args.global,
          withRules: !args.noRules,
        });
        console.log(`Wired ${r.skills.length} skills:`, r.skills.join(", "));
        console.log(`Adapters: ${r.enabled.join(", ")} (scope=${r.scope})`);
        break;
      }
      case "doctor": {
        const r = runDoctor({ strict: args.strict, cwd: process.cwd() });
        for (const line of r.ok) console.log("OK:", line);
        for (const i of r.issues) console.log(i.level.toUpperCase() + ":", i.msg);
        if (!r.healthy) process.exit(1);
        break;
      }
      case "adapter": {
        if (sub === "list") {
          const rows = adapterList({
            cwd: process.cwd(),
            project: args.project,
            global: args.global,
          });
          console.log(formatAdapterListTable(rows));
          break;
        }
        if (sub === "pick") {
          const r = await adapterPick({
            adapters: args.adapters,
            scope: args.scope,
            list: args.list,
          });
          if (r.listed) {
            for (const a of r.adapters) {
              console.log(`${a.index}. ${a.id} — ${a.label}`);
            }
          } else {
            console.log(`Saved adapters: ${r.enabled.join(", ")} (scope=${r.scope})`);
            console.log(r.settingsPath);
          }
          break;
        }
        if (sub === "wire") {
          const ids = args.adapters ? args.adapters.split(",") : undefined;
          const r = wireSkills({
            adapters: ids,
            cwd: process.cwd(),
            project: args.project,
            global: args.global,
            withRules: !args.noRules,
            syncMemory: true,
          });
          console.log("Wired skills:", r.skills.join(", "));
          console.log(`Adapters: ${r.enabled.join(", ")} (scope=${r.scope})`);
          break;
        }
        if (sub === "status") {
          emit(args, adapterStatus({ cwd: process.cwd(), adapters: args.adapters }), render.renderAdapterStatus);
          break;
        }
        throw new Error("Usage: cto-brain adapter list|pick|wire|status");
      }
      case "round-close": {
        const r = roundClose({
          cwd: process.cwd(),
          tag: args.tag || "round",
          summary: args.summary || "no-op",
          lesson: args.lesson,
          feedbackTopic: args.feedback,
          feedbackDescription: args.feedbackDescription,
          outcome: args.outcome,
          tokensIn: args.tokensIn,
          tokensOut: args.tokensOut,
        });
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case "deploy-cto": {
        const r = deployCto({ cwd: process.cwd(), projectName: args.name });
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case "digest": {
        const r = writeWeeklyDigest({ week: args.week, force: args.force });
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case "gate": {
        if (sub !== "check") throw new Error("Usage: cto-brain gate check");
        const home = args.home || systemBrainHome();
        const r = gateCheck(home);
        console.log(JSON.stringify(r, null, 2));
        if (!r.ok) process.exit(1);
        break;
      }
      case "pack": {
        const r = packBrain({
          brainHome: args.home || systemBrainHome(),
          output: args.output,
          encrypt: args.encrypt,
          passphrase: args.passphrase,
          tier: args.tier || "signed",
        });
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case "unpack": {
        if (!args.input) throw new Error("--input required");
        const r = unpackBrain({
          input: args.input,
          dest: args.dest || systemBrainHome(),
          decrypt: args.decrypt,
          passphrase: args.passphrase,
        });
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case "hook": {
        if (sub !== "install") throw new Error("Usage: cto-brain hook install");
        const r = writeHookInstall();
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case "preflight": {
        preflight(sub);
        break;
      }
      case "spec": {
        const root = path.resolve(args.dir || process.cwd());
        if (sub === "init") {
          const id = args._[2];
          if (!id) throw new Error("spec init: change id required, e.g. `cto-brain spec init add-widget`");
          const r = scaffoldChange({ id, root });
          console.log(`Scaffolded ${r.dir}`);
          for (const f of r.files) console.log(`  ${path.relative(root, f)}`);
          break;
        }
        if (sub === "check") {
          const r = checkSpecs({ root });
          emit(args, r);
          if (!r.ok) process.exit(1);
          break;
        }
        throw new Error("Usage: cto-brain spec init <change-id>|check [--dir <root>]");
      }
      case "router": {
        if (sub === "list") {
          emit(args, await routerList(), render.renderRouterList);
          break;
        }
        if (sub === "probe") {
          const r = await routerProbe({ cwd: process.cwd(), all: !!args.all });
          emit(args, r.report, render.renderProbe);
          break;
        }
        if (sub === "select") {
          if (!args.task && !args._[2]) throw new Error("--task required. Kinds: " + TASK_KINDS.join(", "));
          const r = await routerSelect({
            cwd: process.cwd(),
            task: args.task || args._[2],
            prefer: args.prefer,
          });
          emit(args, r, render.renderRouterSelect);
          break;
        }
        if (sub === "init") {
          const r = routerInit({
            cwd: process.cwd(),
            force: args.force,
            system: !!args.system,
            home: args.system ? systemBrainHome() : undefined,
          });
          console.log(JSON.stringify(r, null, 2));
          break;
        }
        if (sub === "plan") {
          const r = await routerPlan({
            cwd: process.cwd(),
            prefer: args.prefer,
          });
          console.log(JSON.stringify(r, null, 2));
          break;
        }
        throw new Error("Usage: cto-brain router list|probe|select|plan|init");
      }
      case "stack": {
        if (sub === "status") {
          emit(args, await stackStatus({ cwd: process.cwd() }), render.renderStackStatus);
          break;
        }
        throw new Error("Usage: cto-brain stack status");
      }
      case "mcp": {
        if (args.transport === "http") {
          const allowedOrigins = args.allowOrigin ? args.allowOrigin.split(",").map((s) => s.trim()).filter(Boolean) : [];
          await startHttpServer({ port: args.port ? Number(args.port) : undefined, allowedOrigins });
        } else {
          await startStdioServer();
        }
        break;
      }
      case "agent-card": {
        const card = buildAgentCard({ url: args.url });
        if (args.out) {
          fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
          fs.writeFileSync(args.out, JSON.stringify(card, null, 2) + "\n");
          console.log(`Wrote ${args.out} (${card.skills.length} skills)`);
        } else {
          console.log(JSON.stringify(card, null, 2));
        }
        break;
      }
      case "code": {
        const exitCode = await launchCode(process.argv.slice(2));
        process.exit(exitCode);
      }
      case "chat": {
        if (args.help) {
          console.log(chatHelp());
          break;
        }
        await runChat(args);
        break;
      }
      case "gateway": {
        const gw = await startGateway({
          port: args.port ? Number(args.port) : undefined,
          jarvisBase: args.jarvisBase,
        });
        process.stderr.write(`gateway on ${gw.url}\n`);
        if (!process.env.JARVIS_API_KEY) {
          process.stderr.write("  (JARVIS_API_KEY not set — /v1/* will return 503 until it is)\n");
        }
        process.stderr.write(`  health: curl -s 127.0.0.1:${gw.port}/healthz\n`);
        // Stay running until interrupted; close the server cleanly on SIGINT/SIGTERM.
        await new Promise((resolve) => {
          const stop = async () => {
            await gw.close().catch(() => {});
            resolve();
          };
          process.on("SIGINT", stop);
          process.on("SIGTERM", stop);
        });
        break;
      }
      case "telemetry": {
        if (sub !== "summary") throw new Error("Usage: cto-brain telemetry summary");
        emit(args, telemetrySummarize(), render.renderTelemetry);
        break;
      }
      case "eval": {
        const r = { ...runEval(), generated: new Date().toISOString() };
        emit(args, r, render.renderEval);
        if (r.failed > 0) process.exit(1);
        break;
      }
      case "skill": {
        if (sub !== "synth") throw new Error("Usage: cto-brain skill synth --topic <topic> [--dir <path>] [--paths a,b]");
        if (!args.topic) throw new Error("--topic <topic> required");
        const extraPaths = args.paths ? args.paths.split(",").map((s) => s.trim()).filter(Boolean) : [];
        const candidates = discoverSkills({ dir: args.dir, extraPaths });
        const result = synthesizeSkill({ candidates, topic: args.topic });
        if (result.refused) {
          console.error(`Refused (nothing written): ${result.reason}`);
          process.exit(1);
        }
        const outPath = path.resolve(result.draftPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, result.content);
        const gate = gateCheck(process.cwd()); // final hard floor
        console.log(`Wrote DRAFT ${result.draftPath} from ${candidates.length} candidate(s). gate: ${gate.ok ? "ok" : "PROBLEMS"}`);
        console.log("Review it, then promote out of skills-draft/ manually — never auto-wired or auto-packed.");
        break;
      }
      default:
        console.log(usage());
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error("cto-brain:", err.message);
    if (err.problems) console.error(JSON.stringify(err.problems, null, 2));
    process.exit(1);
  }
}

main();
