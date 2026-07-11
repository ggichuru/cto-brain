// Gate 2 proven: /api/* is fail-closed. No token → 401; correct token → 200;
// wrong-length / wrong token → 401. Pages (GET /) load ungated so the token can
// be entered, but every API stays behind the token.

import { startChatServer } from "../src/chat/server.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const TOKEN = "test-token-abc";
const cfg = {
  configPath: null,
  scopes: [{ id: "p", label: "Proj", root: null, text: "hello", maxBytes: 80_000 }],
  provider: { id: "ollama", model: "llama3.1" },
  auth: { host: "127.0.0.1", port: 0, token: TOKEN, tokenMinted: false },
};

const srv = await startChatServer(cfg);
const base = srv.url;

try {
  // Public page loads without a token.
  const page = await fetch(`${base}/`);
  ok("GET / is public (200)", page.status === 200);
  ok("GET / serves html", (page.headers.get("content-type") || "").includes("text/html"));

  // API without token → 401.
  const noTok = await fetch(`${base}/api/models`);
  ok("GET /api/models no token → 401", noTok.status === 401);

  // API with wrong token → 401.
  const badTok = await fetch(`${base}/api/models`, { headers: { "X-CTO-Token": "wrong" } });
  ok("GET /api/models wrong token → 401", badTok.status === 401);

  // API with correct token (header) → 200.
  const good = await fetch(`${base}/api/models`, { headers: { "X-CTO-Token": TOKEN } });
  ok("GET /api/models correct token → 200", good.status === 200);
  const gj = await good.json();
  ok("models payload has models array", Array.isArray(gj.models));
  ok("models payload never leaks a key", !JSON.stringify(gj).toLowerCase().includes("apikey") && !JSON.stringify(gj).includes("sk-"));

  // Correct token via query string also works.
  const q = await fetch(`${base}/api/projects?token=${TOKEN}`);
  ok("GET /api/projects ?token → 200", q.status === 200);

  // POST /api/chat without token → 401 (never reaches inference).
  const chatNoTok = await fetch(`${base}/api/chat`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
  });
  ok("POST /api/chat no token → 401", chatNoTok.status === 401);
} finally {
  await srv.close();
}

if (failures) { console.error("\n" + failures + " failure(s)"); process.exit(1); }
console.log("\nAll chat-auth checks passed.");
