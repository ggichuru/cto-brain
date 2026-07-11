import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  classifyToolReply,
  conformancePath,
  loadVerdicts,
  saveVerdicts,
  toVerdictMap,
  probeToolConformance,
} from "../src/router/conformance.mjs";
import { toolCapable } from "../src/router/capabilities.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

// ── classifyToolReply: pure fixtures, no network ─────────────────────────────

// OpenAI wire, real structured tool_calls array
const openaiStructured = {
  choices: [
    {
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"Nairobi"}' },
          },
        ],
      },
      finish_reason: "tool_calls",
    },
  ],
};
ok("openai tool_calls -> structured", classifyToolReply(openaiStructured, "openai") === "structured");

// Ollama-native wire, message.tool_calls
const ollamaStructured = {
  model: "qwen2.5:7b-instruct",
  message: {
    role: "assistant",
    content: "",
    tool_calls: [{ function: { name: "get_weather", arguments: { city: "Nairobi" } } }],
  },
  done: true,
};
ok("ollama message.tool_calls -> structured", classifyToolReply(ollamaStructured, "ollama") === "structured");

// Tool-call-shaped text printed in content (the qwen2.5-coder failure mode)
const textEmbeddedTagged = {
  choices: [
    {
      message: {
        role: "assistant",
        content: '<tool_call>\n{"name": "get_weather", "arguments": {"city": "Nairobi"}}\n</tool_call>',
      },
      finish_reason: "stop",
    },
  ],
};
ok("tool_call tags in content -> text-embedded", classifyToolReply(textEmbeddedTagged, "openai") === "text-embedded");

const textEmbeddedJson = {
  choices: [
    {
      message: {
        role: "assistant",
        content: '{"name": "get_weather", "arguments": {"city": "Nairobi"}}',
      },
      finish_reason: "stop",
    },
  ],
};
ok("bare JSON call in content -> text-embedded", classifyToolReply(textEmbeddedJson, "openai") === "text-embedded");

// Ollama wire can also print the call as text
const ollamaTextEmbedded = {
  message: { role: "assistant", content: '{"name": "get_weather", "arguments": {"city": "Nairobi"}}' },
  done: true,
};
ok("ollama JSON-in-content -> text-embedded", classifyToolReply(ollamaTextEmbedded, "ollama") === "text-embedded");

// Plain prose — model answered but never attempted the tool
const plainProse = {
  choices: [{ message: { role: "assistant", content: "The weather in Nairobi is sunny today." }, finish_reason: "stop" }],
};
ok("plain prose -> none", classifyToolReply(plainProse, "openai") === "none");
ok(
  "ollama prose -> none",
  classifyToolReply({ message: { role: "assistant", content: "Sunny." }, done: true }, "ollama") === "none"
);

// Error bodies and garbage never classify as capable
ok("error body -> error", classifyToolReply({ error: { message: "model not found" } }, "openai") === "error");
ok("null body -> error", classifyToolReply(null, "openai") === "error");
ok("empty object -> error", classifyToolReply({}, "openai") === "error");
ok("string garbage -> error", classifyToolReply("<html>502</html>", "openai") === "error");

// Wire auto-detect when omitted
ok("auto-detect openai shape", classifyToolReply(openaiStructured) === "structured");
ok("auto-detect ollama shape", classifyToolReply(ollamaStructured) === "structured");

// ── verdict store: round-trip in a temp HOME ─────────────────────────────────

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "cto-conformance-"));

ok("absent file -> empty verdicts", loadVerdicts(tmpHome).length === 0);

const rows = [
  { provider: "ollama", model: "qwen2.5-coder:14b", verdict: "structured", probedAt: new Date().toISOString() },
  { provider: "ollama", model: "qwen2.5:7b-instruct", verdict: "text-embedded", probedAt: new Date().toISOString() },
];
saveVerdicts(rows, tmpHome);
ok("save writes conformance.json", fs.existsSync(conformancePath(tmpHome)));

const loaded = loadVerdicts(tmpHome);
ok("round-trip row count", loaded.length === 2);
ok("round-trip verdict", loaded[0].verdict === "structured" && loaded[1].verdict === "text-embedded");
ok("round-trip provider+model", loaded[0].provider === "ollama" && loaded[0].model === "qwen2.5-coder:14b");
ok(
  "round-trip timestamps parse",
  loaded.every((r) => Number.isFinite(Date.parse(r.probedAt)))
);

// Corrupt file degrades to empty — fail-open to the heuristic, never a crash
fs.writeFileSync(conformancePath(tmpHome), "not json {", "utf8");
ok("corrupt file -> empty verdicts, no throw", loadVerdicts(tmpHome).length === 0);

// Non-array JSON is also not a ledger
fs.writeFileSync(conformancePath(tmpHome), '{"oops": true}', "utf8");
ok("non-array JSON -> empty verdicts", loadVerdicts(tmpHome).length === 0);

// ── toolCapable: recorded evidence overrides the heuristic both ways ─────────

const verdicts = toVerdictMap(rows);
ok("toVerdictMap keys by model", verdicts["qwen2.5-coder:14b"] === "structured");

// heuristic-false coder recorded 'structured' -> true
ok("coder heuristic stays false unprobed", toolCapable("qwen2.5-coder:14b") === false);
ok("coder with structured verdict -> true", toolCapable("qwen2.5-coder:14b", { verdicts }) === true);

// heuristic-true instruct recorded 'text-embedded' -> false
ok("instruct heuristic stays true unprobed", toolCapable("qwen2.5:7b-instruct") === true);
ok("instruct with text-embedded verdict -> false", toolCapable("qwen2.5:7b-instruct", { verdicts }) === false);

// unprobed models fall back to the heuristic even when a store is present
ok("unprobed llama falls back to heuristic true", toolCapable("llama3.1:70b-instruct-q4_K_M", { verdicts }) === true);
ok("unprobed gemma falls back to heuristic false", toolCapable("gemma3:12b", { verdicts }) === false);

// error / none verdicts read as not capable
const badVerdicts = { "mistral:7b": "error", "hermes:7b": "none" };
ok("error verdict -> false", toolCapable("mistral:7b", { verdicts: badVerdicts }) === false);
ok("none verdict -> false", toolCapable("hermes:7b", { verdicts: badVerdicts }) === false);

// no-store call shape unchanged (backward compat, incl. Array.prototype.filter usage)
ok("bare call unchanged", toolCapable("qwen2.5:7b-instruct") === true);
ok(
  "filter(toolCapable) unchanged",
  ["qwen2.5-coder:14b", "qwen2.5:7b-instruct"].filter(toolCapable).join(",") === "qwen2.5:7b-instruct"
);

// ── live probe leg: env-gated, offline-green ─────────────────────────────────

if (process.env.OLLAMA_LIVE === "1" || process.env.JARVIS_API_KEY) {
  const wire = process.env.OLLAMA_LIVE === "1" ? "ollama" : "openai";
  const baseUrl =
    process.env.OLLAMA_LIVE === "1"
      ? process.env.OLLAMA_URL || "http://127.0.0.1:11434"
      : process.env.JARVIS_URL || "https://jarvis.gichuru.dev";
  const model = process.env.CONFORMANCE_MODEL || "qwen2.5:7b-instruct";
  const row = await probeToolConformance(baseUrl, model, wire, {
    apiKey: process.env.JARVIS_API_KEY,
    provider: process.env.OLLAMA_LIVE === "1" ? "ollama" : "jarvis",
  });
  ok("live probe returns a verdict", ["structured", "text-embedded", "none", "error"].includes(row.verdict));
  ok("live probe stamps probedAt", Number.isFinite(Date.parse(row.probedAt)));
  saveVerdicts([...loadVerdicts(tmpHome), row], tmpHome);
  const after = loadVerdicts(tmpHome);
  ok("live verdict row persisted", after.some((r) => r.model === model && r.verdict === row.verdict));
  console.log("live:", row.provider, row.model, "->", row.verdict);
} else {
  console.log("skip: live probe (set OLLAMA_LIVE=1 or JARVIS_API_KEY)");
}

fs.rmSync(tmpHome, { recursive: true, force: true });

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-conformance checks passed.");
