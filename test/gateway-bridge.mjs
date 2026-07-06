import {
  openAIModelsFromJarvis,
  ollamaToOpenAIChat,
  ollamaLineToSSE,
  ollamaToolCallsToOpenAI,
  startGateway,
} from "../src/gateway/bridge.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

// ── openAIModelsFromJarvis ───────────────────────────────────────────────────
{
  const data = [
    { id: "qwen2.5-coder:14b", name: "Qwen Coder", owned_by: "library" },
    { id: "llama3.1:70b-instruct-q4_K_M", name: "Llama 70B" },
    { name: "only-name" },
    null,
    {},
  ];
  const out = openAIModelsFromJarvis(data);
  ok("models: maps three valid entries", out.length === 3);
  ok("models: passes through id", out[0].id === "qwen2.5-coder:14b");
  ok("models: object is model", out[0].object === "model");
  ok("models: keeps owned_by", out[0].owned_by === "library");
  ok("models: defaults owned_by", out[1].owned_by === "jarvis");
  ok("models: falls back to name as id", out[2].id === "only-name");
  ok("models: non-array → []", openAIModelsFromJarvis(undefined).length === 0);
}

// ── ollamaToOpenAIChat (non-stream) ──────────────────────────────────────────
{
  const ollama = {
    model: "qwen2.5-coder:14b",
    message: { role: "assistant", content: "Hello world" },
    done: true,
    prompt_eval_count: 12,
    eval_count: 5,
  };
  const oai = ollamaToOpenAIChat(ollama, "qwen2.5-coder:14b");
  ok("chat: object type", oai.object === "chat.completion");
  ok("chat: has id", typeof oai.id === "string" && oai.id.startsWith("chatcmpl-"));
  ok("chat: one choice", oai.choices.length === 1);
  ok("chat: assistant role", oai.choices[0].message.role === "assistant");
  ok("chat: content passthrough", oai.choices[0].message.content === "Hello world");
  ok("chat: finish_reason stop", oai.choices[0].finish_reason === "stop");
  ok("chat: usage prompt", oai.usage.prompt_tokens === 12);
  ok("chat: usage completion", oai.usage.completion_tokens === 5);
  ok("chat: usage total", oai.usage.total_tokens === 17);
  ok("chat: model preserved", oai.model === "qwen2.5-coder:14b");
}

// chat with missing usage / content → safe defaults
{
  const oai = ollamaToOpenAIChat({ message: {} }, "m");
  ok("chat: empty content default", oai.choices[0].message.content === "");
  ok("chat: missing usage → 0", oai.usage.total_tokens === 0);
  ok("chat: role default assistant", oai.choices[0].message.role === "assistant");
}

// ── tool calls (best-effort / unverified stub) ───────────────────────────────
{
  const tcs = ollamaToolCallsToOpenAI([
    { function: { name: "get_weather", arguments: { city: "Nairobi" } } },
  ]);
  ok("tools: one call", tcs.length === 1);
  ok("tools: type function", tcs[0].type === "function");
  ok("tools: name kept", tcs[0].function.name === "get_weather");
  ok("tools: arguments stringified", tcs[0].function.arguments === '{"city":"Nairobi"}');
  ok("tools: has id", typeof tcs[0].id === "string" && tcs[0].id.length > 0);

  // already-string arguments are passed through untouched
  const tcs2 = ollamaToolCallsToOpenAI([{ function: { name: "x", arguments: '{"a":1}' } }]);
  ok("tools: string args passthrough", tcs2[0].function.arguments === '{"a":1}');

  const chat = ollamaToOpenAIChat(
    { message: { role: "assistant", content: "", tool_calls: [{ function: { name: "f", arguments: {} } }] } },
    "m"
  );
  ok("tools: finish_reason tool_calls", chat.choices[0].finish_reason === "tool_calls");
  ok("tools: surfaced on message", Array.isArray(chat.choices[0].message.tool_calls));
}

// ── ollamaLineToSSE (stream) ─────────────────────────────────────────────────
{
  const meta = { id: "chatcmpl-test", created: 1700000000, model: "qwen2.5-coder:14b" };
  const frame = ollamaLineToSSE({ message: { content: "Hel" }, done: false }, meta);
  ok("sse: starts with data:", frame.startsWith("data: "));
  ok("sse: ends with blank line", frame.endsWith("\n\n"));
  const parsed = JSON.parse(frame.slice("data: ".length).trim());
  ok("sse: chunk object", parsed.object === "chat.completion.chunk");
  ok("sse: id propagated", parsed.id === "chatcmpl-test");
  ok("sse: created propagated", parsed.created === 1700000000);
  ok("sse: delta content", parsed.choices[0].delta.content === "Hel");
  ok("sse: finish null mid-stream", parsed.choices[0].finish_reason === null);

  const finalFrame = ollamaLineToSSE({ message: { content: "" }, done: true }, meta);
  const finalParsed = JSON.parse(finalFrame.slice("data: ".length).trim());
  ok("sse: final finish stop", finalParsed.choices[0].finish_reason === "stop");
  ok("sse: final empty delta", !finalParsed.choices[0].delta.content);

  // role-only first chunk
  const roleFrame = ollamaLineToSSE({ message: { role: "assistant", content: "" }, done: false }, meta);
  const roleParsed = JSON.parse(roleFrame.slice("data: ".length).trim());
  ok("sse: role in delta", roleParsed.choices[0].delta.role === "assistant");
}

// ── live, opt-in (only when JARVIS_API_KEY is set) ───────────────────────────
async function liveSection() {
  if (!process.env.JARVIS_API_KEY) {
    console.log("skip: no JARVIS_API_KEY (live path is parent-verified)");
    return;
  }
  const gw = await startGateway({ port: 0 }); // ephemeral port
  try {
    const base = gw.url.replace(/\/v1$/, "");

    const health = await fetch(`${base}/healthz`).then((r) => r.json());
    ok("live: healthz ok", health.ok === true && health.hasKey === true);

    const models = await fetch(`${gw.url}/models`).then((r) => r.json());
    ok("live: models list shape", models.object === "list" && Array.isArray(models.data));
    ok("live: models non-empty", models.data.length > 0);

    const res = await fetch(`${gw.url}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:14b",
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
        stream: false,
        max_tokens: 8,
      }),
    });
    ok("live: chat 200", res.status === 200);
    const completion = await res.json();
    const content = completion?.choices?.[0]?.message?.content;
    ok("live: chat non-empty content", typeof content === "string" && content.trim().length > 0);
  } finally {
    await gw.close();
  }
}

await liveSection();

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll gateway-bridge checks passed.");
