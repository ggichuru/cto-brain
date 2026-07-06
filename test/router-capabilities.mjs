import { tagModel, pickByTask } from "../src/router/capabilities.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

// The 13 live model ids from the frozen contract (docs/integrations/jarvis-code-terminal.md).
const ROSTER = [
  "qwen2.5-coder:14b",
  "llama3.1:70b-instruct-q4_K_M",
  "gemma4:12b",
  "gemma3:12b",
  "qwen2.5:7b-instruct",
  "qwen2.5:7b",
  "gemma4:e4b",
  "gemma3:4b",
  "gemma3:1b",
  "qwen2.5vl:32b",
  "qwen2.5vl:7b",
  "nomic-embed-text:latest",
  "arena-model",
];

// --- tagModel: capability ---
ok("coder by id substring", tagModel("qwen2.5-coder:14b").capability === "coder");
ok("vision via vl", tagModel("qwen2.5vl:32b").capability === "vision");
ok("vision via vl small", tagModel("qwen2.5vl:7b").capability === "vision");
ok("embed via nomic", tagModel("nomic-embed-text:latest").capability === "embed");
ok("70b is reasoning", tagModel("llama3.1:70b-instruct-q4_K_M").capability === "reasoning");
ok("12b is general", tagModel("gemma4:12b").capability === "general");
ok("7b is general", tagModel("qwen2.5:7b-instruct").capability === "general");
ok("tiny is general", tagModel("gemma3:1b").capability === "general");

// --- tagModel: chat flag ---
ok("coder is chat", tagModel("qwen2.5-coder:14b").chat === true);
ok("vision is chat", tagModel("qwen2.5vl:32b").chat === true);
ok("embed is not chat", tagModel("nomic-embed-text:latest").chat === false);
ok("arena-model is not chat", tagModel("arena-model").chat === false);
ok("general is chat", tagModel("gemma3:4b").chat === true);

// --- tagModel: size tiers ---
ok("70b -> large", tagModel("llama3.1:70b-instruct-q4_K_M").size === "large");
// Heuristic from the contract is "70b->large, >=12b->mid"; 32b therefore tags
// as mid. (The taxonomy table's "large" against the 32b vision model is
// descriptive shorthand for "the big vision one", not the size threshold.)
ok("32b vl -> mid (per 70b->large rule)", tagModel("qwen2.5vl:32b").size === "mid");
ok("14b -> mid", tagModel("qwen2.5-coder:14b").size === "mid");
ok("12b -> mid", tagModel("gemma4:12b").size === "mid");
ok("7b -> small", tagModel("qwen2.5:7b").size === "small");
ok("e4b -> small", tagModel("gemma4:e4b").size === "small");
ok("4b -> small", tagModel("gemma3:4b").size === "small");
ok("1b -> tiny", tagModel("gemma3:1b").size === "tiny");

// --- tagModel: defensive ---
ok("empty id no throw", tagModel("").capability === "general");
ok("null id no throw", tagModel(null).capability === "general");

// --- pickByTask against the full live roster ---
ok("builder picks the coder", pickByTask(ROSTER, "dispatch-builder") === "qwen2.5-coder:14b");
ok("autonomous picks the coder", pickByTask(ROSTER, "autonomous-build") === "qwen2.5-coder:14b");
ok("inline picks the coder", pickByTask(ROSTER, "inline-edit") === "qwen2.5-coder:14b");

ok("reviewer picks largest non-vision chat", pickByTask(ROSTER, "reviewer-tech") === "llama3.1:70b-instruct-q4_K_M");
ok("integrate picks reasoning", pickByTask(ROSTER, "integrate") === "llama3.1:70b-instruct-q4_K_M");
ok("research picks reasoning", pickByTask(ROSTER, "research") === "llama3.1:70b-instruct-q4_K_M");

// reviewer must NOT pick the bigger vision model even though qwen2.5vl:32b is also large
ok("reviewer excludes vision", tagModel(pickByTask(ROSTER, "reviewer-tech")).capability !== "vision");

const explorePick = pickByTask(ROSTER, "explore");
ok("explore picks a general model", tagModel(explorePick).capability === "general");
ok("explore picks small/tiny", ["tiny", "small"].includes(tagModel(explorePick).size));
ok("explore picks tiniest general (1b)", explorePick === "gemma3:1b");

// fallback: roster with no coder, unknown task → first chat model
const noCoder = ["gemma3:1b", "nomic-embed-text:latest", "arena-model"];
ok("fallback first chat model", pickByTask(noCoder, "weird-task") === "gemma3:1b");

// builder falls back to first chat when no coder present
ok("builder no-coder fallback", pickByTask(["gemma3:4b", "qwen2.5:7b"], "dispatch-builder") === "gemma3:4b");

// all-non-chat roster → null
ok("all non-chat -> null", pickByTask(["nomic-embed-text:latest", "arena-model"], "dispatch-builder") === null);
ok("empty roster -> null", pickByTask([], "dispatch-builder") === null);

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-capabilities checks passed.");
