---
name: semantic-domain-deconstruction
description: Untangle rigid hierarchies, bloated enums, and names that lie. Fire when a class has grown a dozen boolean flags, when an enum is doing the job of a type, when deep inheritance forces subclasses to carry behaviour they do not use, or on "this model is a mess", "god class", "too many flags", "composition over inheritance", "the name doesn't match what it does". PROBATIONARY — weakest skill in this set and it overlaps domain-modeling; prefer domain-modeling for naming, use this only for structural deconstruction of an existing tangle.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Semantic Domain Deconstruction

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Semantic Software Design* — `~/.cto-brain/corpora/software-architecture/semanticsoftwaredesign.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Audit and refactor complex, rigid codebases by deconstructing privileged binary pairs, removing deep inheritance hierarchies, and enforcing semantic truth in naming.

## When to Use
- When dealing with bloated classes, massive enum flags, or rigid database structures.
- When an API suffers from lack of "truth in advertising" (vague names, leaky abstractions).

## When NOT to Use
- Simple, flat utility libraries or pure infrastructure wrappers.

## Preconditions
- Verify permission to refactor core domain models and public-facing APIs.

## Methodology
1. **Nouns & Verbs Audit**:
   - Critically evaluate word definitions. Reject vague terms like "ShortDescription" vs "LongDescription" or conflating "Customer", "User", and "Guest". Define boundaries explicitly.
2. **Composition over Inheritance**:
   - Locate deep inheritance trees. Refactor them using Python Protocols (PEP 544), ABCs, or composition with tag-based association.
3. **Deconstruct Binary Oppositions**:
   - Identify privileged oppositions (e.g., UI vs Database, Business vs Tech). Resolve the tension by creating clean, decoupled interfaces.
4. **Stateless curl Verification**:
   - Test semantic APIs using flat, deterministic, stateless endpoints that verify the model behaves as a pure mathematical concept.

## Output Format
- Markdown report mapping before-and-after domain taxonomy.
- Python code showing composition/Protocol replacements for deep inheritance.

## Quality Check
- Ensure no subclasses inherit behavior they don't use (Liskov violations).
- Verify all public API names represent real-world concepts in the ubiquitous language.

## Common Issues
- Rigid data schemas: replace deep table hierarchies with flat models using flexible metadata tags.

## Probation notice
Adopted 2026-09-15 on probation. Its "Stateless curl Verification" step is incoherent as
written and its scope overlaps `domain-modeling`. Review at the next plateau: either ground
its claims against `semanticsoftwaredesign.epub` and sharpen the method, or fold the
composition-over-inheritance material into `domain-modeling` and retire this skill.

## Composes with
`domain-modeling` (PREFER IT for naming and vocabulary) · `cognitive-complexity`
