import { listProviders } from "../router/providers.mjs";
import { buildProbeIndex } from "../router/stack.mjs";
import { selectRoute, TASK_KINDS } from "../router/select.mjs";
import { initRouterConfig, initSystemRouterConfig, loadRouterConfig } from "../router/config.mjs";
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

/** Full task matrix — for scripts, CI, and autonomous dispatch pipelines. */
export async function routerPlan(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const loaded = loadRouterConfig(cwd);
  const prefer = opts.prefer || loaded.config.routing?.defaultPrefer || "auto";
  const { probes } = await buildProbeIndex({ cwd, all: true, env: opts.env });
  const tasks = {};
  for (const task of TASK_KINDS) {
    tasks[task] = selectRoute({
      task,
      prefer,
      config: loaded.config,
      probes,
      env: opts.env,
    });
  }
  return {
    generated: new Date().toISOString(),
    prefer,
    layers: loaded.layers,
    configPaths: {
      system: loaded.systemPath,
      project: loaded.path,
    },
    agentic: loaded.config.agentic || {},
    enabledProviders: loaded.config.enabledProviders || [],
    tasks,
  };
}

export function routerInit(opts = {}) {
  if (opts.system) return initSystemRouterConfig(opts);
  return initRouterConfig(opts);
}

export async function stackStatus(opts = {}) {
  return connectStack(opts);
}

export { TASK_KINDS };
