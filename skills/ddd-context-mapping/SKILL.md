---
name: ddd-context-mapping
description: Draw bounded contexts, a context map, and anticorruption layers. Fire when integrating a new service with a legacy system or third-party API, when two teams mean different things by the same word ("Customer" in Sales vs Support), when a model is bleeding across a boundary, or on "bounded context", "context map", "anticorruption layer", "ACL", "ubiquitous language", "which service owns this concept". Names the six relationship types (Partnership, Shared Kernel, Customer-Supplier, Conformist, ACL, Open-Host Service) and scaffolds the Adapter+Translator pair. Not for one cohesive context.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# DDD Context Mapping & Anticorruption Layers

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Learning Domain-Driven Design* — `~/.cto-brain/corpora/software-architecture/learningdomain-drivendesign.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Establish clean language boundaries between disparate subdomains and prevent models from leaking into each other using tactical patterns like Anticorruption Layers (ACL).

## When to Use
- When integrating a new microservice with a legacy monolith or a third-party API.
- When distinct teams have differing definitions for the same business term (e.g., "Customer" in Sales vs. "Customer" in Support).

## When NOT to Use
- Highly cohesive internal components sharing a single, unified Bounded Context.

## Preconditions
- Confirm authorization to review system-wide architecture integration maps.

## Methodology
1. **Elicit Ubiquitous Language**: Document distinct terminology for each Bounded Context.
2. **Establish Relationships**: Define the team and model integration relation type on your **Context Map**:
   - **Partnership**: Co-developed, shared release cycles.
   - **Shared Kernel**: Shared database schema or common library code.
   - **Customer-Supplier**: Upstream controls the downstream delivery.
   - **Conformist**: Downstream conforms directly to upstream schemas.
   - **Anticorruption Layer (ACL)**: Downstream translates upstream data into its own clean domain.
   - **Open-Host Service (OHS)**: Upstream provides a stable, public API.
3. **Scaffold an Anticorruption Layer (ACL)**:
   - Create a service or class structure consisting of an Adapter (to call the external API) and a Translator (to convert raw external schemas into clean internal domain objects).

## Output Format
- A context map diagram specification (e.g., Mermaid.js code showing system dependencies).
- Python/Java class structures implementing the ACL patterns.

## Quality Check
- Ensure that external API client classes never leak directly into internal domain use cases.
- Verify that translating schemas doesn't trigger circular dependencies.

## Common Issues
- Model bleed: solve by maintaining strict boundary tests blocking internal code from instantiating external packages.

## Composes with
`domain-modeling` (owns CONTEXT.md vocabulary — this owns the boundaries BETWEEN vocabularies) · `arch-topology-diagrams` · `spec-driven`
