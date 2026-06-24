import { selectRoute, TASK_KINDS, ROUTING_RULES } from "../src/router/select.mjs";

let failures = 0;

function ok(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    failures++;
  } else {
    console.log("ok:", label);
  }
}

const mockLocalProbe = {
  id: "ollama",
  reachable: true,
  models: ["qwen2.5-coder:14b"],
  baseUrl: "http://127.0.0.1:11434",
};

const mockCloudEnv = { ANTHROPIC_API_KEY: "test-key" };

for (const task of TASK_KINDS) {
  const r = selectRoute({
    task,
    prefer: "auto",
    probes: [mockLocalProbe],
    env: mockCloudEnv,
  });
  ok(`${task} returns honest flag`, r.honest === true);
  ok(`${task} has reason string`, typeof r.reason === "string" && r.reason.length > 0);
  ok(`${task} has task field`, r.task === task);
  ok(`${task} rule exists`, !!ROUTING_RULES[task]);
}

const localOnly = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLocalProbe],
});
ok("local prefer picks ollama", localOnly.provider === "ollama");
ok("local prefer has model", localOnly.model === "qwen2.5-coder:14b");

const noProbe = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [],
});
ok("no local probe returns null provider", noProbe.provider === null);
ok("no local probe honest", noProbe.honest === true);

const cloudReview = selectRoute({
  task: "reviewer-security",
  prefer: "cloud",
  probes: [],
  env: mockCloudEnv,
});
ok("cloud reviewer picks anthropic", cloudReview.provider === "anthropic");

const cloudReviewNoKey = selectRoute({
  task: "reviewer-security",
  prefer: "cloud",
  probes: [mockLocalProbe],
  env: {},
});
ok("cloud prefer without keys falls back local", cloudReviewNoKey.provider === "ollama");
ok("override model not on wrong provider", cloudReviewNoKey.model !== "sonnet");

const autoReview = selectRoute({
  task: "reviewer-tech",
  prefer: "auto",
  probes: [],
  env: mockCloudEnv,
});
ok("auto reviewer-tier picks cloud", autoReview.provider === "anthropic");

const autoBuilder = selectRoute({
  task: "dispatch-builder",
  prefer: "auto",
  probes: [mockLocalProbe],
  env: mockCloudEnv,
});
ok("auto builder-tier picks local", autoBuilder.provider === "ollama");

const researchCloud = selectRoute({
  task: "research",
  prefer: "auto",
  probes: [],
  env: { OPENAI_API_KEY: "test" },
});
ok("research auto picks openai", researchCloud.provider === "openai");

const inlineLocal = selectRoute({
  task: "inline-edit",
  prefer: "local",
  probes: [mockLocalProbe],
});
ok("inline-edit local ollama", inlineLocal.provider === "ollama");

const withOverride = selectRoute({
  task: "dispatch-builder",
  prefer: "local",
  probes: [mockLocalProbe],
  config: {
    routing: {
      builder: { provider: "ollama", model: "custom-model:7b" },
    },
  },
});
ok("project override model", withOverride.model === "custom-model:7b");
ok("project override provider", withOverride.provider === "ollama");

const unknown = selectRoute({ task: "not-a-task" });
ok("unknown task null provider", unknown.provider === null);

if (failures) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll router-select checks passed.");
