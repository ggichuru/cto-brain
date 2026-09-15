---
name: contract-first-api-evolution
description: Design the API contract before the controller — OpenAPI / AsyncAPI first, breaking-change audits (oasdiff, buf), consumer-driven contract tests (Pact), and a versioning scheme that does not strand clients. Fire when adding or changing any REST / gRPC / GraphQL endpoint, when frontend and backend need to ship independently, when a change might break a consumer, or on "OpenAPI", "contract first", "don't break the API", "Pact", "schema evolution", "DTO", "versioning the API". Not for private helpers or in-process calls.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Contract-First API Evolution & Design

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Mastering API Architecture* — `~/.cto-brain/corpora/software-architecture/masteringapiarchitecture.epub`
- *Learning API Styles* — `~/.cto-brain/corpora/software-architecture/learningapistyles.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Automate contract-first API development, ensuring that services remain decoupled, backward compatible, and verified using Consumer-Driven Contracts (CDC).

## When to Use
- When designing new endpoints or evolving existing REST/gRPC/GraphQL interfaces.
- Decoupling frontend and backend delivery streams.

## When NOT to Use
- Internal methods, private helper classes, or strictly monolithic local calls.

## Preconditions
- Check that the target OpenAPI/AsyncAPI contract is owner-approved before publishing.

## Methodology
1. **Contract First**:
   - Draft OpenAPI or AsyncAPI specifications in YAML *before* writing controller code.
   - Use mock tools (e.g., Prism) to let consumers test the schema instantly.
2. **Breaking Change Audit**:
   - Run comparison checks during PR reviews (e.g., using `oasdiff` or `buf` for protobuf).
   - Flag breaking changes: removing fields, renaming attributes, or modifying content types.
3. **Consumer-Driven Contract Testing (CDC)**:
   - Configure **Pact** or equivalent CDC frameworks.
   - Let client teams write expected contract mocks, creating shared integration test suites.
4. **Deconstructed Versioning**:
   - Implement semantic versioning (Major version in URI, e.g., `/v1/`, Minor version passed dynamically via date-query parameter, e.g., `?version=2026-09-04`).

## Output Format
- Valid OpenAPI/AsyncAPI specification YAML file.
- CDC Pact test template.
- Compatibility audit log.

## Quality Check
- Verify the contract has zero syntax errors.
- Ensure that domain DB tables are NEVER exposed directly in API outputs; always translate through DTO (Data Transfer Objects) mapping layers.

## Common Issues
- Changing data types breaking clients: implement backward-compatible mapper adapters that transform incoming legacy formats.

## Composes with
`spec-driven` (the API contract IS a frozen contract) · `documentation-discipline` · `cto-brain`
