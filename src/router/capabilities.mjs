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
