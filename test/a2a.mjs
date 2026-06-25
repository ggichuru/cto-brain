// A2A agent card: required fields, skills derived from the live tool
// registry, version pinned to package.json, and no secret leakage.
import path from "node:path";
import { buildAgentCard, AGENT_CARD_PATH } from "../src/a2a/card.mjs";
import { TOOLS } from "../src/mcp/tools.mjs";
import { readText, packageRoot } from "../src/paths.mjs";

let failures = 0;
function ok(label, cond) {
  if (!cond) { console.error("FAIL:", label); failures++; }
  else console.log("ok:", label);
}

const card = buildAgentCard();
const pkgVersion = JSON.parse(readText(path.join(packageRoot(), "package.json"))).version;

ok("protocolVersion is 1.0", card.protocolVersion === "1.0");
ok("has name + description", !!card.name && !!card.description);
ok("version matches package.json", card.version === pkgVersion);
ok("capabilities block present", card.capabilities && typeof card.capabilities.streaming === "boolean");
ok("input/output modes are json", card.defaultInputModes.includes("application/json") && card.defaultOutputModes.includes("application/json"));

ok("skills count matches tool registry", Array.isArray(card.skills) && card.skills.length === TOOLS.length);
ok("every skill has id/name/description/tags", card.skills.every((s) => s.id && s.name && s.description && Array.isArray(s.tags)));
ok("round_close skill tagged write", card.skills.find((s) => s.id === "round_close").tags.includes("write"));
ok("a read tool tagged read", card.skills.find((s) => s.id === "router_plan").tags.includes("read"));

ok("discovery path is well-known", AGENT_CARD_PATH === "/.well-known/agent-card.json");

// url: placeholder by default, overridable, never fabricated
ok("default url is the stdio placeholder", card.url === "stdio:cto-brain mcp");
ok("url override honored", buildAgentCard({ url: "https://example.test/mcp" }).url === "https://example.test/mcp");

// no secrets / env / keys in the serialized card
const json = JSON.stringify(card);
ok("no secret-shaped strings in card", !/sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|API_KEY|BEGIN [A-Z]+ PRIVATE KEY/.test(json));

if (failures) { console.error("\n" + failures + " A2A failure(s)"); process.exit(1); }
console.log("\nAll A2A checks passed.");
