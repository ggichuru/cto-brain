/**
 * Capability tagger for sovereign-gateway model rosters.
 *
 * Discovery is the source of truth — this module never hard-codes a roster.
 * It tags a model *id* (as returned by `/api/models`) into a coarse capability
 * + size class so the picker can choose by task. Heuristics follow the frozen
 * taxonomy in docs/integrations/jarvis-code-terminal.md.
 */

/**
 * Extract the parameter-count token from a model id (e.g. "70b", "12b", "e4b",
 * "1b"). Returns the matched token lowercased, or null when absent.
 */
function paramToken(idLower) {
  // matches an optional leading letter (e.g. the `e` in `e4b`) + digits + b/m
  const m = idLower.match(/(?:[a-z])?\d+(?:\.\d+)?\s*[bm]\b/);
  return m ? m[0].replace(/\s+/g, "") : null;
}

/** Numeric billions-of-params from a token, or null. `e4b`→4, `70b`→70. */
function paramBillions(token) {
  if (!token) return null;
  const m = token.match(/(\d+(?:\.\d+)?)\s*([bm])/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === "m" ? n / 1000 : n;
}

/** Size tier from a model id: tiny | small | mid | large. */
function sizeTier(idLower) {
  const token = paramToken(idLower);
  const b = paramBillions(token);
  if (b === null) return "small"; // no size hint → treat as small
  if (b >= 70) return "large";
  if (b >= 12) return "mid";
  if (b <= 1) return "tiny";
  return "small"; // 4b / e4b / 7b
}

/**
 * Tag a model id.
 * @returns {{ capability: "coder"|"vision"|"reasoning"|"embed"|"general", size: "tiny"|"small"|"mid"|"large", chat: boolean }}
 */
export function tagModel(id) {
  const raw = String(id || "");
  const lower = raw.toLowerCase();

  // Non-real / special router model — never selectable for chat.
  if (lower === "arena-model" || lower.includes("arena-model")) {
    return { capability: "general", size: sizeTier(lower), chat: false };
  }

  // Embedding models are not chat models.
  if (lower.includes("embed") || lower.includes("nomic")) {
    return { capability: "embed", size: sizeTier(lower), chat: false };
  }

  if (lower.includes("coder")) {
    return { capability: "coder", size: sizeTier(lower), chat: true };
  }

  if (lower.includes("vl") || lower.includes("vision")) {
    return { capability: "vision", size: sizeTier(lower), chat: true };
  }

  // Large general-instruct models read as "reasoning" for reviewer/integrate.
  const size = sizeTier(lower);
  const capability = size === "large" ? "reasoning" : "general";
  return { capability, size, chat: true };
}

const SIZE_RANK = { tiny: 0, small: 1, mid: 2, large: 3 };

function withTags(models) {
  return (models || [])
    .map((id) => ({ id, tag: tagModel(id) }))
    .filter((m) => m.id);
}

/** Largest-first by size rank (stable for ties — keeps discovery order). */
function bySizeDesc(a, b) {
  return SIZE_RANK[b.tag.size] - SIZE_RANK[a.tag.size];
}

/**
 * Pick the best model id for a task from a discovered roster.
 *
 * - builder / inline / autonomous  → best (largest) coder
 * - reviewer / integrate / research → best reasoning (largest non-vision chat)
 * - explore                         → small general (fast)
 * - fallback                        → first chat model
 *
 * @param {string[]} models  model ids from discovery
 * @param {string} task      task kind (or capability hint)
 * @returns {string|null}
 */
export function pickByTask(models, task) {
  const tagged = withTags(models);
  const chat = tagged.filter((m) => m.tag.chat);
  if (!chat.length) return null;

  const t = String(task || "").toLowerCase();

  const isBuilder =
    t.includes("builder") || t.includes("inline") || t.includes("autonomous") || t === "coder" || t === "build";
  const isReasoner =
    t.includes("review") || t.includes("integrate") || t.includes("research") || t === "reasoning";
  const isExplore = t.includes("explore") || t === "general";

  if (isBuilder) {
    const coders = chat.filter((m) => m.tag.capability === "coder").sort(bySizeDesc);
    if (coders.length) return coders[0].id;
  }

  if (isReasoner) {
    // best reasoning = largest non-vision chat model
    const candidates = chat
      .filter((m) => m.tag.capability !== "vision")
      .sort(bySizeDesc);
    if (candidates.length) return candidates[0].id;
  }

  if (isExplore) {
    const small = chat
      .filter((m) => m.tag.capability === "general")
      .sort((a, b) => SIZE_RANK[a.tag.size] - SIZE_RANK[b.tag.size]);
    if (small.length) return small[0].id;
  }

  // Fallback: first chat model in discovery order.
  return chat[0].id;
}

/**
 * Does this model emit STRUCTURED tool/function calls over ollama's
 * OpenAI-compatible endpoint? Agentic terminals (opencode) need this — a model
 * that prints the call as text instead of `tool_calls` can't drive the loop.
 *
 * Verified on this box (ollama 0.30.10): qwen2.5:7b-instruct → structured ✓;
 * qwen2.5-coder:14b → text ✗. Heuristic (conservative — unknown → false):
 * coder templates and the gemma + vision families don't emit structured calls;
 * qwen2.5 (non-coder), llama3.1/3.3, mistral, and generic -instruct do.
 */
export function toolCapable(id) {
  const l = String(id || "").toLowerCase();
  if (!tagModel(id).chat) return false;
  if (l.includes("coder")) return false;
  if (l.includes("vl") || l.includes("vision")) return false;
  if (l.includes("gemma")) return false; // gemma family lacks an ollama tools template
  if (l.includes("qwen2.5") || l.includes("qwen3")) return true;
  if (l.includes("llama3.1") || l.includes("llama-3.1") || l.includes("llama3.3")) return true;
  if (l.includes("mistral") || l.includes("hermes") || l.includes("-instruct")) return true;
  return false;
}

/**
 * Pick the best TOOL-CAPABLE model for a task (for agentic backends). Reasoner
 * tasks → largest capable; builder/explore/default → a fast capable instruct
 * (prefer qwen2.5 *-instruct, smallest-first). Returns null if none capable.
 */
export function pickToolModel(models, task, opts = {}) {
  let capable = withTags((models || []).filter(toolCapable));
  // For interactive use, cap the size — a model that doesn't fit the GPU runs
  // CPU-bound and is unusably slow (e.g. llama3.1:70b at 78% CPU on a GB10).
  // Only narrow if something responsive remains.
  if (opts.maxTier) {
    const cap = SIZE_RANK[opts.maxTier] ?? 3;
    const responsive = capable.filter((m) => SIZE_RANK[m.tag.size] <= cap);
    if (responsive.length) capable = responsive;
  }
  if (!capable.length) return null;
  const t = String(task || "").toLowerCase();
  const isReasoner =
    t.includes("review") || t.includes("integrate") || t.includes("research") || t === "reasoning";
  if (isReasoner) return [...capable].sort(bySizeDesc)[0].id;
  const qwen = capable.filter((m) => m.id.toLowerCase().includes("qwen2.5"));
  const pool = qwen.length ? qwen : capable;
  pool.sort((a, b) => {
    const ai = a.id.toLowerCase().includes("instruct") ? 0 : 1;
    const bi = b.id.toLowerCase().includes("instruct") ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return SIZE_RANK[a.tag.size] - SIZE_RANK[b.tag.size];
  });
  return pool[0].id;
}
