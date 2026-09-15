---
name: facilitative-adr-and-governance
description: Run the Architecture Advice Process and record ADRs — anyone may decide, but only after consulting affected parties and experts, and the advice is recorded beside the decision. Fire when introducing a significant tool, library, or structural change; when a decision is stuck waiting on a review board; when a past decision cannot be explained; or on "ADR", "architecture decision record", "who decides this", "advice process", "why did we choose X", "record this decision". Advice is NOT a vote — the decider holds authority. Not for refactors that touch no boundary or interface.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Facilitative Architecture Advice Process & ADRs

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Facilitating Software Architecture* — `~/.cto-brain/corpora/software-architecture/facilitatingsoftwarearchitecture.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Establish a collaborative and decentralized architectural decision registry using Dennis Bakke's Advice Process and lightweight Architectural Decision Records (ADRs).

## When to Use
- When introducing a significant technical change, tool, or library to a team.
- When teams are blocked by a centralized architecture review board.

## When NOT to Use
- Simple code implementation refactorings that don't impact system boundaries, interfaces, or cross-functional characteristics.

## Preconditions
- Check that the proposed decision has consulted "affected parties" and "experts in the field" as per the advice process.

## Methodology
1. **Identify the Decision Initiator**: Anyone can initiate. The person who feels the need to decide is the Initiator and Decider.
2. **Seek Advice**: Consult the two required groups:
   - Affected Parties: People who will run, build, or live with the decision.
   - Experts: Individuals with experience or deep domain knowledge in the target technology.
3. **Draft the ADR**:
   - **ID and Title**: Format `ADR-NNN - short-name`.
   - **Status**: Mark as Draft or Proposed during advice seeking.
   - **Context**: Document the forces and constraints triggering this decision.
   - **Options Considered**: List alternatives with direct pros and cons (avoid complete rejections without reasons).
   - **Decision**: Bold/italicize the chosen route.
   - **Consequences**: Document the trade-offs and implications.
   - **Recorded Advice**: Append the specific advice offered by both groups.

## Output Format
A Markdown file at `docs/DECISIONS/ADR-NNN-<short-name>.md` (this operation's convention) conforming to standard Nygard or Harmel-Law layouts.

## Quality Check
- Verify that "Recorded Advice" has been explicitly populated.
- Ensure the author is named as the accountable decider.
- Check that the decision doesn't hide negative consequences or trade-offs.

## Common Issues
- Group deadlock or trying to achieve consensus: remind everyone that advice is NOT a vote. The decider holds the final authority to decide and commit.

## Composes with
`cto-orchestration` · `cto-brain` (authority-bearing text cites its decision record) · `amini-ticket-discipline`
