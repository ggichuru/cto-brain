// Regression: the router must never silently dispatch to an ARBITRARY model.
//
// Before 2026-09-11, pickModel() ordered its candidates:
//   1. task override  2. probed.models[0]  3. declared default
// so the first model ollama happened to list SHADOWED the declared default, and the
// route came back with modelAvailable:true (trivially — it was drawn from the probe
// list) and no warning at all. Live reproduction: `router select --task reviewer-security`
// returned `airan-e2b:v1`, a 4.6B experimental fine-tune, for a SECURITY REVIEW.
//
// The honesty layer only guarded the lane it was written for (a *named* model that is
// absent). This file guards the other lane: a model nobody named.

import { selectRoute, TASK_KINDS, ROUTING_RULES } from "../src/router/select.mjs";
import { getProvider } from "../src/router/providers.mjs";

let failures = 0;
function ok(label, cond, detail) {
  if (!cond) {
    console.error("FAIL:", label, detail === undefined ? "" : `— ${detail}`);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

// An ollama probe whose FIRST entry is a model no sane policy would choose for review
// work. If the router prefers list order over the declared default, it lands here.
const trapProbe = {
  id: "ollama",
  reachable: true,
  models: ["airan-e2b:v1", "qwen2.5-coder:14b", "qwen2.5:7b-instruct"],
  baseUrl: "http://127.0.0.1:11434",
};

const noCloud = {}; // no ANTHROPIC_API_KEY / OPENAI_API_KEY -> cloud tiers are skipped

// --- 1. The declared default must win over probe list order -------------------------
for (const task of TASK_KINDS) {
  const rule = ROUTING_RULES[task];
  const declared = rule?.defaultModels?.ollama || getProvider("ollama")?.defaultModel || null;
  if (!declared) continue; // no declared default for this task: covered by section 3

  const r = selectRoute({ task, prefer: "local", probes: [trapProbe], env: noCloud });
  if (r.provider !== "ollama") continue;

  ok(
    `[${task}] declared default wins over probe order`,
    r.model === declared,
    `got '${r.model}', declared '${declared}'`
  );
  ok(
    `[${task}] model is not the trap head-of-list`,
    r.model !== "airan-e2b:v1",
    `router picked the first probed model`
  );
  ok(`[${task}] modelSource is reported`, r.modelSource === "declared" || r.modelSource === "override", `got '${r.modelSource}'`);
}

// --- 2. A declared default that is ABSENT must still be reported honestly ------------
// (regression guard on the behaviour that already worked — do not trade one lane for the other)
const absentProbe = { id: "ollama", reachable: true, models: ["something-else:1b"], baseUrl: "http://127.0.0.1:11434" };
{
  const r = selectRoute({ task: "reviewer-security", prefer: "local", probes: [absentProbe], env: noCloud });
  ok("absent declared model -> modelAvailable false", r.modelAvailable === false, `got ${r.modelAvailable}`);
  ok("absent declared model -> reason carries WARNING", /WARNING/.test(r.reason || ""), r.reason);
  ok("absent declared model -> not silently swapped", r.model !== "something-else:1b", `got '${r.model}'`);
}

// --- 3. When nothing is declared, an arbitrary pick must ANNOUNCE itself -------------
{
  // Force the no-declared-default path with a synthetic task rule.
  const task = "reviewer-security";
  const rule = ROUTING_RULES[task];
  const savedTaskDefaults = rule.defaultModels;
  const preset = getProvider("ollama");
  const savedPresetDefault = preset.defaultModel;
  rule.defaultModels = {};
  preset.defaultModel = "";
  try {
    const r = selectRoute({ task, prefer: "local", probes: [trapProbe], env: noCloud });
    ok("no declared default -> still returns a usable model", !!r.model, `got '${r.model}'`);
    ok(
      "no declared default -> modelSource says it was arbitrary",
      r.modelSource === "arbitrary-probe-pick",
      `got '${r.modelSource}'`
    );
    ok(
      "no declared default -> reason ANNOUNCES the arbitrary pick",
      /ARBITRARY/.test(r.reason || ""),
      r.reason
    );
    ok("no declared default -> honest flag is false", r.honest === false, `got ${r.honest}`);
  } finally {
    rule.defaultModels = savedTaskDefaults;
    preset.defaultModel = savedPresetDefault;
  }
}

// --- 4. modelSource is present on every route, so consumers can gate on it -----------
for (const task of TASK_KINDS) {
  const r = selectRoute({ task, prefer: "local", probes: [trapProbe], env: noCloud });
  if (!r.provider) continue;
  ok(
    `[${task}] modelSource field present`,
    typeof r.modelSource === "string" && r.modelSource.length > 0,
    `got ${JSON.stringify(r.modelSource)}`
  );
}

// --- 5. A single-model endpoint is NOT an arbitrary pick -----------------------------
// LM Studio / single-slot llama-swap serve exactly one model; "first in the list" is the
// only thing the endpoint can answer with, so it is honest. Guarding this keeps the fix
// from over-firing and flagging every local gateway as untrustworthy.
{
  const task = "reviewer-security";
  const rule = ROUTING_RULES[task];
  const savedTaskDefaults = rule.defaultModels;
  const preset = getProvider("ollama");
  const savedPresetDefault = preset.defaultModel;
  rule.defaultModels = {};
  preset.defaultModel = "";
  try {
    const singleton = { id: "ollama", reachable: true, models: ["only-model:7b"], baseUrl: "http://127.0.0.1:11434" };
    const r = selectRoute({ task, prefer: "local", probes: [singleton], env: noCloud });
    ok("single-model endpoint -> probe-singleton", r.modelSource === "probe-singleton", `got '${r.modelSource}'`);
    ok("single-model endpoint -> honest", r.honest === true, `got ${r.honest}`);
    ok("single-model endpoint -> no ARBITRARY warning", !/ARBITRARY/.test(r.reason || ""), r.reason);
  } finally {
    rule.defaultModels = savedTaskDefaults;
    preset.defaultModel = savedPresetDefault;
  }
}

if (failures) {
  console.error(`\nrouter-model-provenance: ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nrouter-model-provenance: all checks passed");
