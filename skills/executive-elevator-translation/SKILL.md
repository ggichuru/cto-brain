---
name: executive-elevator-translation
description: Translate a technical decision UPWARD and OUTWARD — to a board, an investor, a customer exec, a funder. Fire when writing an executive summary, a business case for a refactor, an investor update, or a customer-facing justification; and on "make the case for this", "how do I explain this to the board", "business value of this refactor", "ROI", "what do I tell the customer". Maps the decision across four floors (Engine Room → Delivery → Product → Penthouse) and forces numbers over adjectives. SCOPE: outward-facing only. Not for routine fixes or internal standups.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Software Architect Elevator: Penthouse-to-Engine Room

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *The Software Architect Elevator* — `~/.cto-brain/corpora/software-architecture/softwarearchitectelevator.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Translate low-level technical decisions, architectural technical debt, or refactorings (Engine Room) into strategic business value, OKRs, and financial metrics (Penthouse).

## When to Use
- When writing executive summaries, business cases for major refactoring, or presenting technical plans to stakeholders.
- When justifying a structural change after the fact, at round-close or in a retrospective.

## When NOT to Use
- Routine code-level fixes, standard feature implementations, or internal team meetings.

## Preconditions
- Confirm authorization to review strategic corporate goals, team OKRs, or cloud budget delta forecasts.

## Methodology
1. **Ride the Elevator**: Focus on the multi-tiered translation of a technical decision:
   - **Floor 1 (Engine Room - Code)**: Refactoring SQLAlchemy imports, implementing UoW, adding Sagas.
   - **Floor 5 (Engineering Lead - Delivery)**: Reducing build times, eliminating cyclic dependency, decoupling releases.
   - **Floor 10 (Divisional Director - Product)**: Accelerating Time-To-Market (TTM), reducing bugs, boosting feature agility.
   - **Floor 20 (Penthouse - Executive Board)**: Reducing hosting costs (FinOps), mitigating system-down risks, aligning with regulatory ESG goals.
2. **Draft Technical Memos**: Limit to five pages. Omit technical jargon (like POSIX history, abstract parser engines) unless directly tied to the selection criteria.
3. **Formulate ROI Metrics**: Map refactoring tasks directly to business objectives using simple math (e.g., "Moving from always-on instances to Serverless reduces monthly cloud waste by 40%").

## Output Format
Create a `TECHNICAL_MEMO_EXECUTIVE.md` containing:
- **Executive Summary**: 2-3 sentence strategic pitch.
- **The Elevator Map**: Clear translation from Engine Room to Penthouse.
- **Business Impact**: Cost-benefit analysis, TTM impact, and risk reduction matrix.

## Quality Check
- Ensure zero technical jargon leaks into the Penthouse summary.
- Every assertion must be testable: avoid words like "use caution" or "highly performant" without numbers or criteria.

## Common Issues
- Over-explaining technical implementation: remember, C-level sponsors care about risk, cost, and speed, not package names.

## Composes with
`operator-pulse` (owns updates TO Mkulyma — this owns updates FROM him) · `humanizer-voice` · `amini-brand`
