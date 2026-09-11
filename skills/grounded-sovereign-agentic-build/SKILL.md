---
name: grounded-sovereign-agentic-build
description: >-
  The composable method for building a GROUNDED (every claim binds to evidence or the system
  stays silent), SOVEREIGN (local models, on-box, no cloud lock-in), AGENTIC (verifier-gated
  workflows) AI system, in any domain. Fires on retrieval-grounded answering, citation
  enforcement, refusal design, local-model serving choices, evaluation harnesses that gate a
  release, and "make it cite its sources", "stop it hallucinating", "run this without the
  cloud", "build the verifier first". Supplies the rungs in order (corpus, retrieval,
  grounding contract, verifier, agent loop) and refuses to skip to the agent before the
  verifier exists.
---

# Grounded • Sovereign • Agentic — the build, as a composition

You are building a system that people must be able to *trust with consequences* — a
lawyer citing it in court, a clinician dosing from it, an analyst reporting to a board.
The enemy is the confident wrong answer. This skill is the method that defeats it, and
it is deliberately shaped so you can **compose it like a function, port it to any domain,
and run it entirely on your own models.**

Read it as a mathematician reads a proof (find the one invariant everything hangs on) and
build it as a curious kid does (make the smallest real thing work, then grow it). Both at
once.

---

## 0. The equation (memorise this; everything else is elaboration)

```
answer(q) = V( G( R(q, Corpus) ), E )   ⊕   ABSTAIN
                                        └── if V fails, you emit silence, not a guess

and the invariant that makes it trustworthy:

            V_serve  ≡  V_train
     (the SAME verifier gates the live answer AND rewards the model in training)
```

- **R** — *Retrieve*: pull candidate evidence `E` for query `q` from the corpus.
- **G** — *Generate*: a local model drafts an answer from `E`.
- **V** — *Verify*: a **deterministic, pure** function that either passes the answer or
  returns the itemised list of unsupported claims. `V` is not a model. `V` does not use
  embedding similarity (similarity tolerates swapping a party, a date, a dose — fatal).
- **⊕ ABSTAIN** — when `V` fails after one honest retry + regrounding, the system is
  **silent** and says *why*. Silence is a first-class output, never a fallback bug.

**The one invariant — the whole proof rests here:** the *same* `V` that gates serving is
the reward that shapes the weights (`V_serve ≡ V_train`). There is no second, softer
standard the model can learn to satisfy. This single identity is why the system cannot
drift into plausible-but-wrong. If you take one thing from this skill, take this: **build
`V` first, make it deterministic, and use it in both places.**

---

## 1. The six composable stages (each a frozen contract)

Treat each stage as a typed function with a contract you freeze. Composition is the
architecture. You can swap any stage's internals without touching its neighbours.

| Stage | Contract (in → out) | The rule that makes it honest |
|---|---|---|
| **Ingest** `I` | `doc → chunks + entities + graph` | Structure-aware chunking (prepend a per-doc summary to the *embedded* text; keep clean text for display/citation). Never shred hierarchy. |
| **Retrieve** `R` | `q → ranked evidence E` | **Deterministic-first, similarity-last.** Structural/temporal lookup + an **authority lane** that *guarantees* the exact controlling source is in context; similarity only accelerates candidate surfacing. Fail-loud if a backend is down. |
| **Generate** `G` | `(E, q, mode) → draft` | Local/sovereign model. Context labels every passage `[Source N]` so a correct answer can bind. |
| **Verify** `V` | `(draft, E, premise) → grounded \| abstain+gaps` | Deterministic, pure, **structural not similarity**. Bind claims to evidence by attribution; check numbers/dates/money/citations/provisions/relations as typed tuples; user-stipulated facts are givens for *numbers only*, never for citations. |
| **Reground** `Rg` | `abstain → retry → self-search → (allowlisted web) → abstain` | Bounded escalation. The verifier is **never bypassed** on any lane. |
| **Learn** `L` | `verdicts → verifier-gated dataset → GRPO(reward=V) → proposal` | Teach the **decision loop** (cite/abstain/qualify), never the facts. Adapters are proposals; benchmark before promoting; never auto-serve. |

Two composition laws worth stating explicitly:

1. **`V` dominates.** Every branch of `Rg` terminates at `V`. No path emits an answer `V`
   hasn't passed. (This is what makes the ⊕ ABSTAIN in the equation total, not partial.)
2. **Facts live in `R`, discipline lives in `L`.** A knowledge gap is a *retrieval* rung
   (grow the corpus), never a *training* rung. Baking facts into weights is how you get
   confident-wrong answers when the world changes. Keep them separate on purpose.

---

## 2. The autoencoder — compress any build to the recipe, decode into a new domain

This is how the skill *travels*. Think of it literally as encode → latent → decode.

**ENCODE (compress a domain to the recipe).** Given a domain, fill five slots — that is
the entire latent representation of the build:

| Slot | Question | Legal (LexCore) | Medicine | Finance | Support |
|---|---|---|---|---|---|
| **Corpus** | what is authoritative? | statutes, judgments | guidelines, labels | filings, contracts | KB, runbooks |
| **Evidence unit** | what is a citeable atom? | section / case pinpoint | recommendation + grade | line-item + period | article + version |
| **Claim tuples** | what must bind exactly? | citation{authority,court,year,pinpoint}, §, money, date | dose{value,unit,route}, contraindication | figure{value,sign,unit,period} | step, version, config |
| **Relations** | what flip is fatal? | granted↔denied, allowed↔dismissed | indicated↔contraindicated | asset↔liability, gain↔loss | enable↔disable |
| **Sovereign floor** | which local models? | Qwen2.5 alias + nomic-embed | same shape | same shape | same shape |

**DECODE (expand the latent into a running build).** With the five slots filled, the six
stages are *mechanical*: `V`'s tuple-checkers are the claim tuples + relations;
`R`'s authority lane keys on the evidence unit; `L`'s reward is that same `V`. **You have
not redesigned anything — you re-parameterised the recipe.** That is the point: the
architecture is a constant; the domain is the parameter.

> The "math equation" the operator asked for is exactly this: `build(domain) =
> decode(encode(domain))`, and `encode` is just filling those five slots. A new grounded
> assistant for *any* domain is a five-tuple away.

---

## 3. Sovereign by default, and adoptable anywhere (chat, voice, other agents)

- **Sovereign floor.** Serve models locally (e.g. Ollama behind an OpenAI-compatible
  proxy). Route `primary → local fallback → (only if explicitly opted-in) cloud`; with
  opt-in off, **raise rather than egress** — the default must keep data on the box. Name
  models honestly (an alias is a rename, not a fine-tune; never advertise a bigger model
  than you run). Stamp every answer with what served it.
- **Be a layer, not a monolith.** Expose the grounded capability as an **MCP server**
  (`search / verify / cite_check / draft / temporal_lookup`). Now *any* external
  agent, chat, or IDE can call your grounded intelligence — and it both *uses* MCP tools
  and *is* one. This is what "adopt into any agentic workflow" means concretely.
- **Voice / chat overlays are thin and opt-in.** Voice = STT (Faster-Whisper) → the same
  `answer(q)` pipeline → local TTS; barge-in via VAD; a pronunciation lexicon for domain
  terms. The overlay never sees a different answer path — it wraps the same `V`-gated
  core. Everything stays sovereign.

---

## 4. Reverse-engineer an existing system into this form

When handed someone else's RAG/agent stack, *don't rebuild — re-express it*:

1. **Find `V` (or its absence).** Ask: what stops a wrong answer shipping? If the honest
   answer is "nothing deterministic", that is the bug — everything else is secondary.
2. **Trace one query end-to-end** and label each hop as `I/R/G/V/Rg/L`. Gaps in the
   composition are your work-list.
3. **Locate the similarity-as-truth smell.** Anywhere a vector score *decides* correctness
   (not just ordering), mark it: that is where hallucinations enter.
4. **Check the facts/discipline split.** Are facts baked into a fine-tune? Move them to
   `R`. Is the model asked to "be careful" in a prompt instead of *checked*? Move that to
   `V`.
5. **Fill the five slots** for its domain; the missing stages fall out immediately.

---

## 5. Doing it efficiently — the mathematician's economy

- **Build `V` first, on paper cases.** It is the fixed point; everything composes around
  it. A pure deterministic `V` needs no GPU and no corpus to test — write its failing
  cases first (TDD), including the adversarial ones (swapped party, wrong year, flipped
  relation, off-by-a-unit number). If `V` can't catch those, nothing downstream matters.
- **Smallest real corpus that exercises one hard query.** One statute + one judgment beats
  a 100k-doc dump you can't reason about. Prove `answer(q)` grounds and abstains honestly
  on a handful before scaling `R`.
- **Reuse the invariant, don't re-derive.** `L`'s reward is *already* `V` — don't write a
  learned reward model. `Rg`'s termination is *already* `V` — don't add a second checker.
  Every time you're tempted to add a component, ask "is this just `V` again?" Usually yes.
- **Instrument the abstention rate.** It is your honesty dashboard. A system that never
  abstains is lying; one that always abstains is useless. Watch the ratio move as `R`'s
  corpus grows — that, not prompt-tuning, is the lever.

---

## 6. Honesty discipline (non-negotiable, truth-in-display)

- Label every capability **PROVEN / BETA / PLANNED** and never imply more than the code
  does. Publish the unflattering eval numbers (bar-exam %, court win-rate, grounded-rate);
  a grounded tool that hides its gaps is the exact thing you're building against.
- A model **alias is not a fine-tune**; a rename is not ownership. Say so.
- **Fine-tuned adapters are proposals** — benchmark against base with the *same* `V`
  before promoting; never auto-serve.
- Diagrams and docs mark optional/simulated/planned parts as such (see
  `arch-topology-diagrams`, `documentation-discipline`).

---

## Composition with the rest of the brain

| Skill | Relationship |
|---|---|
| `cto-brain` | The build doctrine (SDD×TDD, sovereign-by-default, truth-in-display) this method executes. Fine-tune here means GRPO with `V` as the verifiable reward. |
| `lexcore` | The full worked reference implementation — read it for the concrete Kenyan-legal instantiation of every stage here. This skill is `lexcore` with the domain factored out. |
| `agentic-learning-loop` | Stage `L` *is* the learning loop: harvest `V`'s verdicts → verifier-gated dataset → gated retune proposal. Self-improvement is built into the recipe. |
| `prompting-context-engineering` | Craft for `G`'s prompts and `V`'s regen instructions; model-agnostic core first, then only the layer for the sovereign model you serve. |
| `arch-topology-diagrams` / `documentation-discipline` | Keep the composition drawn and documented true-to-code, with honest maturity markers. |

**The standing rule:** if you can't point at a deterministic `V` that both gates the
answer and rewards the model, you have not built a grounded system yet — you have built a
confident one. Build `V` first.
