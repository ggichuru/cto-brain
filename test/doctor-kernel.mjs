// Tests for kernelHealth — the kernel/platform-health probe of `cto-code doctor`.
//
// Every probe is dependency-injected, so these tests are fully hermetic:
// no real network, no real subprocess, no real home. kernelHealth must NEVER
// throw — a failed probe becomes a section with ok:false + a warn line.

import { test } from "node:test";
import assert from "node:assert/strict";
import { kernelHealth } from "../src/cli/doctor.mjs";

// A distinctive secret so the "no secret value leaks" assertion is meaningful.
const SECRET = "sk-secret-value-abc123";

// Build an exec stub that branches on the command it is handed.
function makeExec(map) {
  return (cmd) => {
    if (cmd === "opencode") return map.opencode ?? { status: 127, stdout: "", stderr: "not found" };
    if (cmd === "git") return map.git ?? { status: 0, stdout: "" };
    return { status: 127, stdout: "", stderr: "" };
  };
}

// Full opts with hermetic defaults; override only what a test cares about.
function baseOpts(over = {}) {
  return {
    exec: over.exec ?? makeExec({}),
    fetchFn: over.fetchFn ?? (async () => { throw new Error("no network in test"); }),
    env: over.env ?? {},
    readFileFn: over.readFileFn ?? (() => { throw new Error("no file in test"); }),
    existsFn: over.existsFn ?? (() => false),
    listSkillDirs: over.listSkillDirs ?? (() => []),
    listAgents: over.listAgents ?? (() => []),
    opencodeConfigPath: over.opencodeConfigPath ?? "/tmp/nowhere/opencode.jsonc",
    cwd: over.cwd ?? "/tmp/nowhere",
    homeSkillsDir: over.homeSkillsDir ?? "/tmp/nowhere/claude-skills",
    opencodeSkillsDir: over.opencodeSkillsDir ?? "/tmp/nowhere/opencode-skills",
    opencodeAgentDir: over.opencodeAgentDir ?? "/tmp/nowhere/opencode-agent",
  };
}

// --- opencode ---

test("opencode installed → version parsed from --version output", async () => {
  const r = await kernelHealth(baseOpts({ exec: makeExec({ opencode: { status: 0, stdout: "1.18.3\n" } }) }));
  assert.equal(r.opencode.installed, true);
  assert.equal(r.opencode.version, "1.18.3");
  assert.ok(r.ok.some((l) => /opencode/i.test(l)), "an ok line mentions opencode");
});

test("opencode missing (exit 127) → installed:false, version:null, warns, no throw", async () => {
  const r = await kernelHealth(baseOpts({ exec: makeExec({ opencode: { status: 127, stdout: "", stderr: "not found" } }) }));
  assert.equal(r.opencode.installed, false);
  assert.equal(r.opencode.version, null);
  assert.ok(r.warn.some((w) => /opencode/i.test(w)), "a warn line mentions opencode");
});

test("opencode probe that THROWS is swallowed → installed:false, no throw", async () => {
  const r = await kernelHealth(baseOpts({ exec: (cmd) => { if (cmd === "opencode") throw new Error("spawn EACCES"); return { status: 0, stdout: "" }; } }));
  assert.equal(r.opencode.installed, false);
  assert.equal(r.opencode.version, null);
});

// --- ollama ---

test("ollama up → reachable:true, models counted", async () => {
  const r = await kernelHealth(baseOpts({
    fetchFn: async () => ({ ok: true, json: async () => ({ models: [{ name: "a" }, { name: "b" }] }) }),
  }));
  assert.equal(r.ollama.reachable, true);
  assert.equal(r.ollama.models, 2);
  assert.equal(typeof r.ollama.host, "string");
});

test("ollama down (fetch rejects) → reachable:false, models:0, warns, no throw", async () => {
  const r = await kernelHealth(baseOpts({
    fetchFn: async () => { throw new Error("ECONNREFUSED"); },
  }));
  assert.equal(r.ollama.reachable, false);
  assert.equal(r.ollama.models, 0);
  assert.ok(r.warn.some((w) => /ollama/i.test(w)), "a warn line mentions ollama");
});

test("ollama host respects OLLAMA_HOST env", async () => {
  const r = await kernelHealth(baseOpts({
    env: { OLLAMA_HOST: "http://10.0.0.5:11434/" },
    fetchFn: async () => ({ ok: true, json: async () => ({ models: [] }) }),
  }));
  assert.equal(r.ollama.host, "http://10.0.0.5:11434");
});

// --- providers ---

test("providers: a key-required cloud preset with its key present → credentialPresent, and NO secret value leaks", async () => {
  const r = await kernelHealth(baseOpts({ env: { OPENAI_API_KEY: SECRET } }));
  const openai = r.providers.find((p) => p.id === "openai");
  assert.ok(openai, "openai preset present in report");
  assert.equal(openai.credentialPresent, true);
  assert.equal(openai.keyRequired, true);
  // Anthropic key not set → not present.
  const anthropic = r.providers.find((p) => p.id === "anthropic");
  assert.equal(anthropic.credentialPresent, false);
  // The secret VALUE must never appear anywhere in the serialized report.
  assert.ok(!JSON.stringify(r).includes(SECRET), "secret value must not leak into the report");
});

test("providers: no credentials → a warn line", async () => {
  const r = await kernelHealth(baseOpts({ env: {} }));
  assert.ok(r.providers.length >= 8);
  assert.ok(r.warn.some((w) => /credential|provider/i.test(w)), "warns about missing credentials");
});

// --- mcp ---

test("mcp: config exists and mentions cto-brain → ctoBrainWired:true", async () => {
  const r = await kernelHealth(baseOpts({
    existsFn: () => true,
    readFileFn: () => '{"mcp":{"cto-brain":{"type":"local"}}}',
  }));
  assert.equal(r.mcp.opencodeConfig, true);
  assert.equal(r.mcp.ctoBrainWired, true);
});

test("mcp: config exists but does NOT mention cto-brain → ctoBrainWired:false", async () => {
  const r = await kernelHealth(baseOpts({
    existsFn: () => true,
    readFileFn: () => "{}",
  }));
  assert.equal(r.mcp.opencodeConfig, true);
  assert.equal(r.mcp.ctoBrainWired, false);
});

test("mcp: config missing → both false, no throw", async () => {
  const r = await kernelHealth(baseOpts({ existsFn: () => false }));
  assert.equal(r.mcp.opencodeConfig, false);
  assert.equal(r.mcp.ctoBrainWired, false);
});

// --- git ---

test("git: clean tree → repo:true, clean:true, dirtyCount:0", async () => {
  const r = await kernelHealth(baseOpts({ exec: makeExec({ git: { status: 0, stdout: "" } }) }));
  assert.equal(r.git.repo, true);
  assert.equal(r.git.clean, true);
  assert.equal(r.git.dirtyCount, 0);
});

test("git: two dirty lines → clean:false, dirtyCount:2, warns", async () => {
  const r = await kernelHealth(baseOpts({ exec: makeExec({ git: { status: 0, stdout: " M src/a.mjs\n?? b.txt\n" } }) }));
  assert.equal(r.git.repo, true);
  assert.equal(r.git.clean, false);
  assert.equal(r.git.dirtyCount, 2);
  assert.ok(r.warn.some((w) => /dirty|tree|uncommitted/i.test(w)), "warns about dirty tree");
});

test("git: not a repo (exit 128) → repo:false, clean:null, dirtyCount:null, no throw", async () => {
  const r = await kernelHealth(baseOpts({ exec: makeExec({ git: { status: 128, stdout: "", stderr: "not a git repository" } }) }));
  assert.equal(r.git.repo, false);
  assert.equal(r.git.clean, null);
  assert.equal(r.git.dirtyCount, null);
});

// --- gateway / skills / agents / shape ---

test("gateway: JARVIS_API_KEY presence is a boolean, value never leaks", async () => {
  const r = await kernelHealth(baseOpts({ env: { JARVIS_API_KEY: SECRET } }));
  assert.equal(r.gateway.jarvisKeyPresent, true);
  assert.ok(!JSON.stringify(r).includes(SECRET), "jarvis key value must not leak");
  const r2 = await kernelHealth(baseOpts({ env: {} }));
  assert.equal(r2.gateway.jarvisKeyPresent, false);
});

test("skills + agents counts come from injected listers", async () => {
  const r = await kernelHealth(baseOpts({
    listSkillDirs: (dir) => (dir.includes("claude") ? ["a", "b", "c"] : ["x"]),
    listAgents: () => ["cto.md", "reviewer.md"],
  }));
  assert.equal(r.skills.claude, 3);
  assert.equal(r.skills.opencode, 1);
  assert.equal(r.agents.opencode, 2);
});

test("report shape: all sections present and ok/warn are arrays", async () => {
  const r = await kernelHealth(baseOpts());
  for (const k of ["opencode", "ollama", "providers", "mcp", "skills", "agents", "gateway", "git", "ok", "warn"]) {
    assert.ok(k in r, `report has ${k}`);
  }
  assert.ok(Array.isArray(r.ok));
  assert.ok(Array.isArray(r.warn));
  assert.ok(Array.isArray(r.providers));
});

test("kernelHealth never throws even with all-hostile injected deps", async () => {
  const r = await kernelHealth({
    exec: () => { throw new Error("exec boom"); },
    fetchFn: async () => { throw new Error("fetch boom"); },
    env: {},
    readFileFn: () => { throw new Error("read boom"); },
    existsFn: () => { throw new Error("exists boom"); },
    listSkillDirs: () => { throw new Error("skills boom"); },
    listAgents: () => { throw new Error("agents boom"); },
    opencodeConfigPath: "/tmp/nowhere/opencode.jsonc",
    cwd: "/tmp/nowhere",
  });
  assert.equal(r.opencode.installed, false);
  assert.equal(r.ollama.reachable, false);
  assert.equal(r.mcp.opencodeConfig, false);
  assert.ok(Array.isArray(r.warn));
});
