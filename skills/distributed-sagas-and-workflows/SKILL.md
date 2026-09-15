---
name: distributed-sagas-and-workflows
description: Keep data consistent across services without 2PC — orchestrated vs choreographed sagas, idempotent compensating actions, the transactional outbox, correlation IDs. Fire when a business process spans multiple services and can fail halfway (order → payment → stock), when a dual write to DB-and-queue appears, when "eventual consistency" is being hand-waved, or on "saga", "compensation", "outbox", "distributed transaction", "rollback across services", "we wrote to the DB and the queue". Not inside a single bounded context where a database transaction works.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Distributed Sagas & Event-Driven Workflows

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Building Event-Driven Microservices, 2nd ed* — `~/.cto-brain/corpora/software-architecture/buildingevent-drivenmicroservices2ndedition.epub`
- *Building Microservices, 2nd ed* — `~/.cto-brain/corpora/software-architecture/buildingmicroservices2ndedition.epub`
- *Software Architecture: The Hard Parts* — `~/.cto-brain/corpora/software-architecture/softwarearchitecture_thehardparts.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Implement atomic distributed transactions and compensation sequences across microservice boundaries without tight temporal coupling.

## When to Use
- When a business process spans multiple services (e.g., order booking, payment, stock assignment) and needs eventual consistency.
- When two-phase commits (2PC) degrade performance and scalability.

## When NOT to Use
- Within a single bounded context or monolith where database transactions can be utilized natively.

## Preconditions
- Ensure permission to edit inter-service schemas, messaging broker pipelines (Kafka, RabbitMQ), and service code.

## Methodology
1. **Saga Orchestration**:
   - Define a single master manager service (Orchestrator) that dispatches commands to worker services.
   - Maintain the saga state machine (Initialized, Pending, Succeeded, Compensating, Aborted).
2. **Saga Choreography**:
   - Have services react to events published on a messaging channel (pub/sub), passing execution onward without a central driver.
3. **Compensation Logic**:
   - For every forward action (e.g., `reserve_stock`), write a corresponding, idempotent compensation action (e.g., `release_stock`) that runs if a downstream step fails.
4. **Transactional Outbox Pattern**:
   - Avoid double-writing (writing to database and publishing to queue simultaneously). Save events to an `outbox` table within the same DB transaction, and have a separate relay process publish them.

## Output Format
Scaffold saga templates:
- State machine configs or code blocks.
- Compensating action endpoints and outbox database schemas.

## Quality Check
- Verify that all compensation handlers are completely **idempotent** (can be called multiple times safely).
- Ensure **Correlation IDs** are injected into all messages and events to track execution.

## Common Issues
- Circular event triggers in Choreography: solve by mapping event paths clearly and refactoring complex flows into Orchestrated Sagas.

## Composes with
`amini-cloud` · `tdd` · `cto-brain`
