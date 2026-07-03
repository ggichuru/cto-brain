#!/usr/bin/env node
// Trigger-eval: does each skill's DESCRIPTION cause a model to select it for the
// queries it should fire on — and NOT for near-miss negatives? Measures the
// brain's #1 known failure mode (skill-firing precedence) instead of guessing.
//
// Uses the local Ollama (sovereign, offline) as the judge. Non-deterministic:
// each query runs REPS times, the modal pick is scored. NOT a CI test — it needs
// a live model. Adopted 2026-07-03 from anthropics/skills' description-optimization
// loop (peer-repo study round).
//
// Usage:
//   node scripts/trigger-eval.mjs [--model qwen2.5:7b-instruct] [--reps 3]
//   OLLAMA_URL overrides http://127.0.0.1:11434
// Exit 0 always (it's a measurement, not a gate); prints a scorecard + JSON.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(fs.readFileSync(path.join(here, "..", "eval", "trigger-fixtures.json"), "utf8"));

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const MODEL = arg("--model", "qwen2.5:7b-instruct");
const REPS = Number(arg("--reps", "3"));

const catalog = fixtures.candidates
  .map((c) => `- ${c}: ${fixtures.descriptions[c]}`)
  .join("\n");

function systemPrompt() {
  return `You are a skill router. Given a user request, choose EXACTLY ONE skill from the catalog whose description best matches, or "none" if no skill applies. Reply with ONLY the skill name, nothing else.\n\nCatalog:\n${catalog}`;
}

async function pick(query) {
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      options: { temperature: 0 },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: query },
      ],
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const j = await res.json();
  const raw = (j.message?.content || "").toLowerCase();
  // match the first candidate name that appears in the reply
  for (const c of fixtures.candidates) if (raw.includes(c)) return c;
  return "unparsed";
}

function modal(arr) {
  const counts = {};
  for (const a of arr) counts[a] = (counts[a] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

(async () => {
  // reachability check — honest failure, not a fake pass
  try {
    const t = await fetch(`${OLLAMA}/api/tags`);
    if (!t.ok) throw new Error(String(t.status));
  } catch (e) {
    console.error(`Ollama unreachable at ${OLLAMA} (${e.message}). Trigger-eval needs a live local model — UNPROVEN, not run.`);
    process.exit(0);
  }

  const results = [];
  let correct = 0;
  for (const { q, expect } of fixtures.queries) {
    const picks = [];
    for (let i = 0; i < REPS; i++) {
      try { picks.push(await pick(q)); } catch { picks.push("error"); }
    }
    const got = modal(picks);
    const pass = got === expect;
    if (pass) correct++;
    const stable = picks.every((p) => p === picks[0]);
    results.push({ q, expect, got, picks, pass, stable });
    console.log(`${pass ? "ok  " : "MISS"} [${expect} → ${got}${stable ? "" : " ~unstable"}] ${q}`);
  }
  const rate = +(correct / fixtures.queries.length).toFixed(3);
  const unstable = results.filter((r) => !r.stable).length;
  console.log(`\ntrigger accuracy: ${correct}/${fixtures.queries.length} (${(rate * 100).toFixed(0)}%) · model=${MODEL} reps=${REPS} · ${unstable} unstable`);
  console.log(JSON.stringify({ model: MODEL, reps: REPS, rate, correct, total: fixtures.queries.length, unstable, misses: results.filter((r) => !r.pass).map((r) => ({ q: r.q, expect: r.expect, got: r.got })) }, null, 2));
})();
