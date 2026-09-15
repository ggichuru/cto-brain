---
name: saas-multi-tenant-isolation
description: Audit tenant isolation and noisy-neighbour risk — verified tenant_id extraction at the edge, automatic query-layer filtering (never developer discipline), per-tier throttling, and scoped runtime credentials. Fire before shipping any shared-compute API, when reviewing a multi-tenant query path, when a tenant_id is passed in rather than derived from a verified claim, or on "multi-tenant", "tenant isolation", "cross-tenant leak", "noisy neighbour", "row-level security", "can one customer see another's data". Not for single-tenant on-prem deployments.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Multi-Tenant SaaS Isolation Gates

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Building Multi-Tenant SaaS Architectures* — `~/.cto-brain/corpora/software-architecture/buildingmulti-tenantsaasarchitectures.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Enforce strict boundaries to prevent cross-tenant data leaks and noisy neighbor issues in pooled or siloed compute/storage systems.

## When to Use
- During architectural reviews of multi-tenant microservices or database queries.
- Before launching new APIs in a shared-compute environment.

## When NOT to Use
- Single-tenant on-premise application deployments.

## Preconditions
- Confirm authorization to audit identity provider policies, DynamoDB leading keys, or IAM policies.

## Methodology
1. **Tenant Context Extraction**:
   - Intercept JWT or HTTP headers at the gateway/middleware layer to extract the verified `tenant_id` claim.
2. **Noisy Neighbor Shunting**:
   - Inject rate-limiting/throttling headers scoped per-tenant-tier (Basic vs Gold).
3. **Storage Partitioning**:
   - Pooled Storage: Enforce that all repository database queries contain a `tenant_id` filter.
   - Siloed Storage: Dynamically route database sessions based on the verified tenant context.
4. **Credential Scope Isolation**:
   - Implement runtime credential generation (e.g., AWS STS `AssumeRole` with scoped policy templates dynamically injecting the `tenant_id` as DynamoDB `LeadingKeys`).

## Output Format
Generate safe middleware templates or audited query classes:
- Return code examples showing tenant routing or JWT parsing.
- Produce `TENANT_ISOLATION_REPORT.md` listing potential risk spots where `tenant_id` isn't forced.

## Quality Check
- Ensure database queries never rely on developers "remembering" to append `tenant_id`; query layers must automatically inject it.
- Verify that tenant context cannot be altered or overwritten on downstream calls.

## Common Issues
- Latency in dynamic role-assuming: cache scoped temporary credentials locally with a secure TTL.

## Composes with
`amini-cloud` · `ulap-one-security`
