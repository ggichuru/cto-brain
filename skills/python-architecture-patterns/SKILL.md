---
name: python-architecture-patterns
description: Refactor Python out of framework coupling into Onion / Hexagonal — pure domain models, Repository ports, Service Layer handlers, Unit of Work. Fire when SQLAlchemy or Django imports appear in domain code, when business logic cannot be tested without a database, when tests are slow because everything needs fixtures, or on "repository pattern", "unit of work", "service layer", "cosmic python", "hexagonal", "decouple from the ORM", "my tests need a DB". Not for CRUD scripts or small prototypes where the layers cost more than they save.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Python Architecture Patterns (Cosmic Python)

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Architecture Patterns with Python* — `~/.cto-brain/corpora/software-architecture/architecturepatternswithpython.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Guide the user in refactoring Python codebases away from tight coupling to database frameworks (Django ORM, SQLAlchemy) or "distributed balls of mud" into Onion/Hexagonal clean architecture.

## When to Use
- When database models leak into the domain layer or presentation controllers.
- When business logic is tightly coupled to SQLAlchemy or Django dependencies.
- When writing unit tests is slow and complex due to database setup.

## When NOT to Use
- Simple CRUD scripts, small FastAPI prototypes, or single-file scripts where extra layers add unnecessary complexity.

## Preconditions
- Confirm that the target codebase is Python and that refactoring is requested on specific business models or adapters.

## Methodology
1. **Domain Isolation**:
   - Extract domain business models into a pure `domain/model.py` containing pure dataclasses or POPOs (Plain Old Python Objects) with zero external imports (no SQLAlchemy, no Django).
   - Use Value Objects (dataclasses where equality is based on attributes) and Entities (where identity is persistent).
2. **Repository Pattern**:
   - Create an abstract port `AbstractRepository` (or Protocol) with `add(entity)` and `get(id)` methods.
   - Implement concrete adapter repositories (e.g., `SqlAlchemyRepository` or `DjangoRepository`) in `adapters/repository.py`.
3. **Service Layer**:
   - Write use-case handlers in `service_layer/services.py` that only accept primitive inputs (strings, ints) to keep dependencies clean.
4. **Unit of Work (UoW)**:
   - Implement an `AbstractUnitOfWork` context manager in `service_layer/unit_of_work.py` to handle atomic commits and rollbacks.

## Output Format
Generate Python file structures in a clean folder tree:
- `src/domain/model.py`
- `src/adapters/repository.py`
- `src/service_layer/unit_of_work.py`
- `src/service_layer/services.py`

## Quality Check
- Ensure `domain/model.py` has no external library imports (like SQLAlchemy, Flask, Django).
- Verify database sessions are managed exclusively inside the UoW's context manager.
- Verify tests are categorized under `unit/`, `integration/`, and `e2e/`.

## Common Issues
- Python Circular Imports: Solve by moving model registrations or mapping steps to adapters/orm.py and importing them during boot bootstrapping.

## Composes with
`tdd` · `spec-driven` · `cognitive-complexity`
