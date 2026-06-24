// cto-brain MCP server (stdio transport).
//
// Thin wiring only: all tool logic lives in ./tools.mjs. Exposes the brain's
// router/gate/adapter/round-close functions as MCP tools so any MCP client
// (Claude Code, Cursor, Codex, ...) can call the brain directly.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readText, packageRoot } from "../paths.mjs";
import path from "node:path";
import { listTools, callTool } from "./tools.mjs";

function packageVersion() {
  try {
    return JSON.parse(readText(path.join(packageRoot(), "package.json"))).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function createServer() {
  const server = new Server(
    { name: "cto-brain", version: packageVersion() },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listTools() }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      const data = await callTool(name, args || {});
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `cto-brain tool error (${name}): ${err.message || err}` }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startStdioServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Stderr only — stdout is the JSON-RPC channel and must stay clean.
  process.stderr.write("cto-brain MCP server running on stdio\n");
}
