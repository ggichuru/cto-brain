#!/usr/bin/env node
import { initProjectBrain, initSystemBrain, pullPackageToSystem, syncSystemProject } from "../src/sync/brain-sync.mjs";
import { runDoctor, installToAgents, writeHookInstall } from "../src/cli/doctor.mjs";
import { adapters, wireSkills } from "../src/adapters/index.mjs";
import { roundClose, deployCto } from "../src/cli/round-close.mjs";
import { writeWeeklyDigest } from "../src/cli/digest.mjs";
import { gateCheck, packBrain, unpackBrain } from "../src/gate/pack.mjs";
import { routerInit, routerList, routerProbe, routerSelect, stackStatus, TASK_KINDS } from "../src/cli/router.mjs";
import { systemBrainHome } from "../src/paths.mjs";

const USAGE = `cto-brain — portable CTO orchestration brain

Usage:
  cto-brain init [--project] [--name <project>]
  cto-brain sync [--pull|--promote|--project-only]
  cto-brain install [--adapters claude-code,cursor,codex]
  cto-brain doctor [--strict]
  cto-brain adapter list|wire [--adapters ...] [--no-rules]
  cto-brain round-close --tag <tag> --summary <text> [--lesson <text>] [--feedback <topic>]
  cto-brain deploy-cto [--name <project>]
  cto-brain digest [--week YYYY-Www] [--force]
  cto-brain gate check [--home <path>]
  cto-brain pack [--output <file>] [--encrypt] [--passphrase <p>]
  cto-brain unpack --input <file> [--dest <path>] [--decrypt] [--passphrase <p>]
  cto-brain hook install
  cto-brain preflight dispatch|commit
  cto-brain router list
  cto-brain router probe [--all]
  cto-brain router select --task <kind> [--prefer local|cloud|auto]
  cto-brain router init [--force]
  cto-brain stack status
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project") args.project = true;
    else if (a === "--pull") args.pull = true;
    else if (a === "--promote") args.promote = true;
    else if (a === "--project-only") args.projectOnly = true;
    else if (a === "--strict") args.strict = true;
    else if (a === "--encrypt") args.encrypt = true;
    else if (a === "--decrypt") args.decrypt = true;
    else if (a === "--no-rules") args.noRules = true;
    else if (a === "--force") args.force = true;
    else if (a === "--all") args.all = true;
    else if (a.startsWith("--")) {
      const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      args[key] = argv[++i];
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
  const cmd = args._[0];
  const sub = args._[1];

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
        break;
      }
      case "install": {
        const ids = args.adapters ? args.adapters.split(",") : undefined;
        const r = installToAgents({ adapters: ids, cwd: process.cwd() });
        console.log(`Wired ${r.skills.length} skills:`, r.skills.join(", "));
        console.log(JSON.stringify(r.wired, null, 2));
        break;
      }
      case "doctor": {
        const r = runDoctor({ strict: args.strict });
        for (const line of r.ok) console.log("OK:", line);
        for (const i of r.issues) console.log(i.level.toUpperCase() + ":", i.msg);
        if (!r.healthy) process.exit(1);
        break;
      }
      case "adapter": {
        if (sub === "list") {
          for (const a of adapters) {
            console.log(`${a.id}\t${a.label}\t${a.skillDirs().join(", ")}`);
          }
          break;
        }
        if (sub === "wire") {
          const ids = args.adapters ? args.adapters.split(",") : ["claude-code", "cursor", "codex"];
          const r = wireSkills({ adapters: ids, cwd: process.cwd(), withRules: !args.noRules, syncMemory: true });
          console.log("Wired skills:", r.skills.join(", "));
          break;
        }
        throw new Error("Usage: cto-brain adapter list|wire");
      }
      case "round-close": {
        const r = roundClose({
          cwd: process.cwd(),
          tag: args.tag || "round",
          summary: args.summary || "no-op",
          lesson: args.lesson,
          feedbackTopic: args.feedback,
          feedbackDescription: args.feedbackDescription,
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
      case "router": {
        if (sub === "list") {
          const rows = await routerList();
          for (const r of rows) {
            console.log(`${r.id}\t${r.tier}\t${r.label}${r.stub ? " (stub)" : ""}`);
          }
          break;
        }
        if (sub === "probe") {
          const r = await routerProbe({ cwd: process.cwd(), all: !!args.all });
          console.log(JSON.stringify(r.report, null, 2));
          break;
        }
        if (sub === "select") {
          if (!args.task && !args._[2]) throw new Error("--task required. Kinds: " + TASK_KINDS.join(", "));
          const r = await routerSelect({
            cwd: process.cwd(),
            task: args.task || args._[2],
            prefer: args.prefer,
          });
          console.log(JSON.stringify(r, null, 2));
          break;
        }
        if (sub === "init") {
          const r = routerInit({ cwd: process.cwd(), force: args.force });
          console.log(JSON.stringify(r, null, 2));
          break;
        }
        throw new Error("Usage: cto-brain router list|probe|select|init");
      }
      case "stack": {
        if (sub === "status") {
          const r = await stackStatus({ cwd: process.cwd() });
          console.log(JSON.stringify(r, null, 2));
          break;
        }
        throw new Error("Usage: cto-brain stack status");
      }
      default:
        console.log(USAGE);
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error("cto-brain:", err.message);
    if (err.problems) console.error(JSON.stringify(err.problems, null, 2));
    process.exit(1);
  }
}

main();
