---
name: sociotechnical-iceberg-analysis
description: Debug chronic incidents and organisational friction with the Iceberg Model — Events → Patterns → Structures → Mental Models. Fire on a recurring production incident, a post-incident review, a Conway's Law symptom, a handoff that keeps failing, or on "this keeps happening", "third time this month", "why do we keep", "retro", "the same bug came back", "the team keeps missing this". Forces analysis past the event to the structure sustaining it, and demands leverage points more actionable than "improve culture". Not for linear one-cause bugs.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Sociotechnical Iceberg Analysis & Systems Thinking

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Learning Systems Thinking* — `~/.cto-brain/corpora/software-architecture/learningsystemsthinking_V2.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Diagnose chronic system failures, bugs, or organizational friction by mapping issues across the four levels of the Systems Thinking Iceberg Model.

## When to Use
- When debugging recurring production incidents, Conway's Law issues, or team communication silos.
- During post-incident reviews or retrospectives.

## When NOT to Use
- Linear, simple bugs (e.g., simple syntax errors, typo fixes).

## Preconditions
- Ensure access to historical incident logs, retrospectives, and team topology directories.

## Methodology
Decompose the issue using the **Iceberg Model**:
1. **Events (What just happened?)**: Document the symptoms, incident alerts, error logs, and immediate impact.
2. **Patterns (What has been happening over time?)**: Look for history. Have we seen this spike before? How often do these incidents occur?
3. **Structures (What is sustaining this behavior?)**: Analyze structural drivers. How are teams organized (Team Topologies)? How is code coupled? What are the communication loops (Conway's Law)? Is there a feedback loop delay?
4. **Mental Models (What values/beliefs support the structure?)**: Diagnose culture. What beliefs ("we must deploy fast at all costs", "testing is QA's job") are driving these structures?

## Output Format
Create a `SYSTEMS_THINKING_ICEBERG.md` analysis containing:
- **Iceberg Map**: Four levels structured with clear, documented interrelationships.
- **Feedback Loops**: Causal Loop Diagrams (Mermaid.js) showing reinforcing or balancing loops.
- **Leverage Points**: Specific, actionable suggestions where a small change in structure or mental model yields massive systemic improvement.

## Quality Check
- Verify that structural analysis includes both technical coupling AND organizational structures.
- Ensure leverage points are actionable and do not merely say "improve culture."

## Common Issues
- Blaming individuals: shift perspective from "who did it" to "what structural incentives allowed this to happen."

## Composes with
`diagnosing-bugs` (use IT for linear one-cause bugs) · `cto-orchestration`
