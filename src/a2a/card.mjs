// A2A (Agent2Agent) Agent Card generator.
//
// Produces an A2A v1.0 AgentCard describing cto-brain as a discoverable
// remote agent. Skills are derived from the LIVE MCP tool registry so the
// card can never drift from what the brain actually exposes. No secrets,
// URLs, or env are included — only public capability metadata.

import path from "node:path";
import { readText, packageRoot } from "../paths.mjs";
import { TOOLS } from "../mcp/tools.mjs";

function packageVersion() {
  try {
    return JSON.parse(readText(path.join(packageRoot(), "package.json"))).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// Each MCP tool becomes an A2A skill. round_close is the only mutating one.
function toolToSkill(t) {
  const write = /write/i.test(t.description);
  return {
    id: t.name,
    name: t.name.replace(/_/g, " "),
    description: t.description,
    tags: ["cto-brain", write ? "write" : "read"],
  };
}

// `url` is where the agent is reachable. Until the MCP Streamable-HTTP
// transport ships (roadmap brick 2), there is no hosted endpoint, so the
// caller supplies it (opts.url or CTO_BRAIN_PUBLIC_URL); otherwise it is a
// clearly-marked placeholder, never a fabricated address.
export function buildAgentCard(opts = {}) {
  const url = opts.url || process.env.CTO_BRAIN_PUBLIC_URL || "stdio:cto-brain mcp";
  return {
    protocolVersion: "1.0",
    name: "cto-brain control plane",
    description:
      "Portable CTO control plane: policy-first model routing, credential gating, adapter wiring, run telemetry, and round-close learning for multi-agent software builds.",
    version: packageVersion(),
    url,
    preferredTransport: opts.url || process.env.CTO_BRAIN_PUBLIC_URL ? "JSONRPC" : "stdio",
    provider: {
      organization: "cto-brain (open source)",
      url: "https://github.com/ggichuru/cto-brain",
    },
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    skills: TOOLS.map(toolToSkill),
  };
}

// The standardized discovery path (RFC 8615). Used by the future HTTP server.
export const AGENT_CARD_PATH = "/.well-known/agent-card.json";
