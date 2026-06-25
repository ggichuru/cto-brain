# cto-brain as an MCP server

cto-brain exposes its router, gate, adapter, and round-close functions as
[Model Context Protocol](https://modelcontextprotocol.io) tools over stdio, so
any MCP client (Claude Code, Cursor, Codex, …) can call the brain directly
instead of shelling out to the CLI.

## Run

```bash
cto-brain mcp        # stdio JSON-RPC server; stdout is the protocol channel
# or, from a checkout:
node bin/cto-brain.mjs mcp
```

Logs go to stderr; stdout stays clean for the protocol. The server reports its
version from `package.json`.

### As an HTTP service (Streamable-HTTP)

To run cto-brain as a shared remote service instead of a per-client stdio
process, use the Streamable-HTTP transport (same 9 tools, one `/mcp` endpoint):

```bash
cto-brain mcp --transport=http --port 3737
# permit a browser origin (otherwise loopback-only):
cto-brain mcp --transport=http --port 3737 --allow-origin https://app.example.com
```

**Security posture (defaults):** binds to **127.0.0.1** only; rejects
disallowed cross-origin requests with **HTTP 403** (DNS-rebinding guard) —
native MCP clients send no `Origin` and are allowed; logs never include
headers, bodies, or secrets. For real remote exposure, front it with a TLS
terminator / auth proxy and pass the public host via `--allow-origin`. Connect
with any MCP client's Streamable-HTTP transport pointed at `http://<host>:<port>/mcp`.

## Tools

| Tool | Wraps | Mutates? |
|------|-------|----------|
| `router_select` | `routerSelect({task, prefer})` — route one task kind | no |
| `router_plan` | `routerPlan({prefer})` — full task→provider/model matrix | no |
| `router_probe` | `routerProbe({all})` — probe reachable stacks | no |
| `stack_status` | `stackStatus()` — configured stacks summary | no |
| `gate_check` | `gateCheck(home)` — credential/secret scan | no |
| `adapter_status` | `adapterStatus()` — where skills are wired | no |
| `round_close` | `roundClose({tag, summary, lesson, feedback})` | **yes** (writes growth ledger / feedback) |

All tools return JSON as a text content block. `router_select` requires `task`
(one of the router task kinds); `prefer` is `auto` | `local` | `cloud`.

### Caveats

- **Environment matters for routing.** `router_select` / `router_plan` decide
  cloud reachability from the server process's environment (e.g.
  `ANTHROPIC_API_KEY`). An MCP server launched without those keys will honestly
  fall back to local providers even if your interactive shell has them. Launch
  the server with the same env you expect routing to see.
- **`round_close` writes.** It is the one mutating tool — it appends to the
  growth ledger and can scaffold a feedback file. `tag` / `summary` / `lesson`
  are sanitized (newlines and `|` stripped) so a caller can't inject ledger
  rows, but autonomous agents calling it on every loop will add noise to the
  ledger. Prefer calling it deliberately at round boundaries.
- **`gate_check` scans a path you give it** and returns the *names* of
  credential-like files it finds (never their contents) — same surface as the
  `gate check --home <path>` CLI.

## Register in a client

### Claude Code

```bash
claude mcp add cto-brain -- cto-brain mcp
```

or add to `.mcp.json` / settings:

```json
{
  "mcpServers": {
    "cto-brain": { "command": "cto-brain", "args": ["mcp"] }
  }
}
```

### Cursor

`~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "cto-brain": { "command": "cto-brain", "args": ["mcp"] }
  }
}
```

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.cto-brain]
command = "cto-brain"
args = ["mcp"]
```

If cto-brain isn't installed globally, use `npx`:
`command: "npx", args: ["cto-brain", "mcp"]`.

## Verify

```bash
# end-to-end: connect a client, list tools, call one
node -e '
import("@modelcontextprotocol/sdk/client/index.js").then(async ({Client})=>{
  const {StdioClientTransport}=await import("@modelcontextprotocol/sdk/client/stdio.js");
  const c=new Client({name:"probe",version:"0"},{capabilities:{}});
  await c.connect(new StdioClientTransport({command:"cto-brain",args:["mcp"]}));
  console.log((await c.listTools()).tools.map(t=>t.name).join(", "));
  await c.close();
});'
```

Tool logic lives in `src/mcp/tools.mjs` (a transport-agnostic registry +
dispatcher) and the stdio wiring in `src/mcp/server.mjs`.
