import { listProviders } from "../router/providers.mjs";
import { buildProbeIndex } from "../router/stack.mjs";
import { selectRoute, TASK_KINDS } from "../router/select.mjs";
import { initRouterConfig, loadRouterConfig } from "../router/config.mjs";
import { connectStack } from "../router/stack.mjs";

export async function routerList() {
  return listProviders();
}

export async function routerProbe(opts = {}) {
  return buildProbeIndex(opts);
}

export async function routerSelect(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const { config } = loadRouterConfig(cwd);
  const { probes } = await buildProbeIndex({ cwd, all: true, env: opts.env });
  return selectRoute({
    task: opts.task || "dispatch-builder",
    prefer: opts.prefer || config.routing?.defaultPrefer || "auto",
    config,
    probes,
    env: opts.env,
    allowUnprobedLocal: opts.allowUnprobedLocal,
  });
}

export function routerInit(opts = {}) {
  return initRouterConfig(opts);
}

export async function stackStatus(opts = {}) {
  return connectStack(opts);
}

export { TASK_KINDS };
