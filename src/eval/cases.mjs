// Declarative eval cases for cto-brain's own decisions. Deterministic: route
// cases use mock probes + a fixed env (no network); gate cases use a temp dir.
// Each case: { name, dimension, kind: "route"|"gate", input, expect }.

const reachable = (id, models = ["m"]) => ({ id, reachable: true, models, status: "reachable" });

export const EVAL_CASES = [
  // ---- dimension: routing (honest task→provider selection) ----
  {
    name: "builder prefers local ollama when reachable",
    dimension: "routing",
    kind: "route",
    input: { task: "dispatch-builder", prefer: "local", probes: [reachable("ollama")], env: {} },
    expect: { provider: "ollama", tier: "local", honest: true },
  },
  {
    name: "reviewer-security routes cloud anthropic when key present",
    dimension: "routing",
    kind: "route",
    input: {
      task: "reviewer-security",
      prefer: "cloud",
      probes: [reachable("ollama")],
      env: { ANTHROPIC_API_KEY: "sk-test-eval" },
    },
    expect: { provider: "anthropic", tier: "cloud", honest: true },
  },
  {
    name: "cloud prefer without keys lands local, honestly",
    dimension: "routing",
    kind: "route",
    input: { task: "reviewer-security", prefer: "cloud", probes: [reachable("ollama")], env: {} },
    expect: { provider: "ollama", tier: "local", honest: true },
  },
  {
    name: "research routes openai when key present",
    dimension: "routing",
    kind: "route",
    input: { task: "research", prefer: "auto", probes: [reachable("ollama")], env: { OPENAI_API_KEY: "sk-test-eval" } },
    expect: { provider: "openai", honest: true },
  },
  {
    name: "inline-edit prefers local ollama",
    dimension: "routing",
    kind: "route",
    input: { task: "inline-edit", prefer: "local", probes: [reachable("ollama")], env: {} },
    expect: { provider: "ollama", tier: "local", honest: true },
  },
  {
    name: "flags an override model the provider hasn't pulled",
    dimension: "routing",
    kind: "route",
    input: {
      task: "dispatch-builder",
      prefer: "local",
      probes: [reachable("ollama", ["llama3.2:1b"])],
      config: { routing: { builder: { provider: "ollama", model: "qwen2.5-coder:14b" } } },
      env: {},
    },
    expect: { provider: "ollama", modelAvailable: false },
  },
  {
    // Amended 2026-09-11. This case used to probe ["llama3.2:1b"] and assert
    // modelAvailable:true — but the router then picked its model FROM that same probe
    // list, so the assertion was a tautology that could not fail. It stayed green
    // through the entire arbitrary-model defect. The probe list now contains the model
    // the routing rules actually declare for `explore`, so the check is real: if the
    // router returns anything else, or stops cross-checking the list, this goes red.
    name: "confirms a model that IS in the probe list",
    dimension: "routing",
    kind: "route",
    input: {
      task: "explore",
      prefer: "local",
      probes: [reachable("ollama", ["llama3.1", "llama3.2:1b"])],
      env: {},
    },
    expect: { provider: "ollama", modelAvailable: true, modelSource: "declared" },
  },
  {
    // Control arm for the same defect: a provider offering a MENU with nothing declared
    // must announce that the router chose by list order, not by policy.
    name: "arbitrary probe pick is announced, not laundered as honest",
    dimension: "honesty",
    kind: "route",
    input: {
      task: "dispatch-builder",
      prefer: "local",
      probes: [reachable("llama-swap", ["glm-4.5-air", "qwen3-coder-30b"])],
      env: {},
    },
    expect: { provider: "llama-swap", modelSource: "arbitrary-probe-pick", honest: false },
  },
  // ---- dimension: honesty (no fabricated routes) ----
  {
    name: "nothing reachable + no keys → null provider, still honest",
    dimension: "honesty",
    kind: "route",
    input: { task: "dispatch-builder", prefer: "local", probes: [], env: {} },
    expect: { provider: null, honest: true },
  },
  {
    name: "unknown task → null provider, honest",
    dimension: "honesty",
    kind: "route",
    input: { task: "frobnicate-the-widget", prefer: "auto", probes: [reachable("ollama")], env: {} },
    expect: { provider: null, honest: true },
  },
  // ---- dimension: gate (credential safety) ----
  {
    name: "clean dir passes the gate",
    dimension: "gate",
    kind: "gate",
    input: { files: { "skills/x/SKILL.md": "---\nname: x\ndescription: Use when testing the gate.\n---\nclean body\n" } },
    expect: { ok: true },
  },
  {
    name: "structurally broken skill fails the gate (name != dir)",
    dimension: "gate",
    kind: "gate",
    input: { files: { "skills/x/SKILL.md": "---\nname: y\ndescription: Use when testing the lint gate.\n---\nbody\n" } },
    expect: { ok: false },
  },
  {
    name: "credentials.json fails the gate",
    dimension: "gate",
    kind: "gate",
    input: { files: { "credentials.json": "{\"token\":\"x\"}" } },
    expect: { ok: false },
  },
  {
    name: "id_rsa fails the gate",
    dimension: "gate",
    kind: "gate",
    input: { files: { "id_rsa": "-----BEGIN OPENSSH PRIVATE KEY-----" } },
    expect: { ok: false },
  },
  {
    name: "secret embedded in a SKILL.md fails the gate",
    dimension: "gate",
    kind: "gate",
    input: { files: { "skills/y/SKILL.md": "---\nname: y\n---\nkey sk-abcdefghijklmnopqrstuvwxyz0123\n" } },
    expect: { ok: false },
  },
];
