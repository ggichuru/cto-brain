// cto-brain chat — CLI entry. Loads config, starts the Secure-Brain server,
// prints the access URL + token, and stays up until interrupted.

import { loadChatConfig } from "../chat/config.mjs";
import { startChatServer } from "../chat/server.mjs";
import { resolveChatProvider } from "../chat/provider.mjs";

export function chatHelp() {
  return `cto-brain chat — talk to your brain, grounded in your project, with your models.

Usage:
  cto-brain chat [--port N] [--host H] [--config PATH] [--provider ID] [--model NAME]

Options:
  --config PATH    cto-brain.config.json|.mjs to load (default: ./cto-brain.config.*)
  --provider ID    override the provider (ollama, openai-compatible, openai, anthropic, jarvis, …)
  --model NAME     override the model id
  --host H         bind address (default 127.0.0.1; use a tailnet IP to share on a private net)
  --port N         port (default 8790)

Auth:
  CTO_CHAT_TOKEN   pin the API token (else one is minted per boot and printed)
  The provider's API key is read from its env var (e.g. OPENAI_API_KEY) —
  server-side only, never written to disk, never sent to the browser.

Config (cto-brain.config.json) — schema:
  {
    "scopes":  [{ "id","label","root","include":["README.md","docs"],"maxBytes":80000 }],
    "provider":{ "id":"openai-compatible","baseUrl":"http://host:8000","model":"…","apiKeyEnv":"OPENAI_API_KEY" },
    "auth":    { "host":"127.0.0.1","port":8790 }
  }
  With no config, a default scope grounds on ./README + ./docs (docs-only) via local ollama.

Examples:
  cto-brain chat                                  # local ollama, default project scope
  cto-brain chat --provider openai --model gpt-4o-mini
  OPENAI_BASE_URL=http://gpu:8000 OPENAI_API_KEY=… cto-brain chat --provider openai-compatible --model my-model`;
}

export async function runChat(argv = {}) {
  const cfg = await loadChatConfig({
    cwd: process.cwd(),
    configPath: argv.config,
    flags: { provider: argv.provider, model: argv.model, host: argv.host, port: argv.port, token: argv.token },
  });

  const srv = await startChatServer(cfg);

  // Provider summary (never prints the key — only whether it is present).
  let psum = cfg.provider.id;
  try {
    const r = resolveChatProvider(cfg.provider, process.env);
    psum = `${r.id} (${r.tier}) → ${r.baseUrl || "n/a"} model=${r.model || "?"}${r.keyRequired ? ` key=${r.hasKey ? "present" : "MISSING (set " + r.apiKeyEnv + ")"}` : ""}`;
  } catch (err) {
    psum = `${cfg.provider.id} — UNRESOLVED: ${err.message}`;
  }

  const tokenUrl = `${srv.url}/?token=${srv.token}`;
  process.stdout.write(`cto-brain chat — Secure Brain\n`);
  process.stdout.write(`  URL:      ${srv.url}\n`);
  process.stdout.write(`  Open:     ${tokenUrl}\n`);
  process.stdout.write(`  TOKEN:    ${srv.token}${cfg.auth.tokenMinted ? " (minted this boot — set CTO_CHAT_TOKEN to pin it)" : " (from env/config)"}\n`);
  process.stdout.write(`  provider: ${psum}\n`);
  process.stdout.write(`  scopes:   ${cfg.scopes.map((s) => s.id).join(", ")}\n`);
  process.stdout.write(`  config:   ${cfg.configPath || "defaults (no cto-brain.config.* found)"}\n`);
  if (srv.host === "127.0.0.1") process.stdout.write(`  bound to loopback — pass --host <tailnet-ip> to share on a private network.\n`);

  await new Promise((resolve) => {
    const stop = async () => {
      await srv.close().catch(() => {});
      resolve();
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  });
}
