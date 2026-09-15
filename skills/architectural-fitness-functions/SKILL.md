---
name: architectural-fitness-functions
description: Turn architecture rules into executable CI gates — ArchUnit / NetArchTest / import-linter boundary rules, dependency direction, license and supply-chain scans. Fire when bootstrapping a repo, when a layer violation appears (UI querying the DB directly), when an import crosses a boundary it should not, or when someone says "we should have a rule about that" — a rule nobody can run is not a rule. Also fires on "fitness function", "ArchUnit", "import-linter", "enforce the layering", "stop the architecture rotting", "add a CI gate". Not for micro-repos or codebases with no test harness.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Automated Architectural Fitness Functions

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Building Evolutionary Architectures, 2nd ed* — `~/.cto-brain/corpora/software-architecture/buildingevolutionaryarchitectures2ndedition.epub`
- *Software Architecture Metrics* — `~/.cto-brain/corpora/software-architecture/softwarearchitecturemetrics.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Configure automated, continuous tests that guard architecture rules, boundary interfaces, and package dependency rules against code rot and decay.

## When to Use
- Setting up a new repository, bootstrapping a framework, or auditing layer violations (e.g., UI directly querying Database).
- Restricting import violations in Onion, Hexagonal, or Layered styles.

## When NOT to Use
- Small, single-purpose micro-repos or legacy codebases with no test framework maturity.

## Preconditions
- Verify that you have permissions to write tests under the `tests/` directory and configure CI pipeline steps.

## Methodology
1. **Layer Boundary Verification**:
   - Implement **ArchUnit (Java)** or **NetArchTest (.NET)** or **import-linter (Python)** rules.
   - Define a rule asserting that code in the `domain` packages must not import or depend on packages in `adapters` or `entrypoints`.
2. **Annotation Rules**:
   - Assert that all classes extending a base model must be marked with specific metadata annotations (e.g., `@Entity`).
3. **Vulnerability & Supply Chain Gates**:
   - Configure a linter/scanner (like TruffleHog, Black Duck, or dependency-check) as a pre-commit or CI build step.
   - Assert license compliance: fail the build if a new dependency updates to an unapproved copyleft license.

## Output Format
- Executable test file (e.g., `tests/unit/test_architecture.py` or `tests/architecture_test.go`).
- CI/CD build stage config file (e.g., `.github/workflows/ci.yml`).

## Quality Check
- Test the fitness function by intentionally introducing an illegal import and verifying that the build fails.
- Document the exact "why" inside the test assertion message so developers know how to fix it.

## Common Issues
- Overly strict rules blocking hotfixes: establish an exclusion/bypass protocol with logged justification.

## Brain-specific hard rules (these outrank the generic method above)
- **A gate must grade the property it claims to grade.** `OK: skill present` is not `OK: skill current`. Name the property in the assertion message.
- **Prove the gate by breaking it.** Inject the illegal import, watch the build go red, remove it, watch it go green. An unproven gate is decoration.
- **A gate that fails early hides every assertion behind it.** If a setup step can fail, everything downstream is UNVERIFIED — never quote the suite's green.
- **Name the source of the expected value.** If the rule's expected value is read from the thing under test, the gate cannot fail.

## Composes with
`tdd` (a fitness function IS a test) · `cto-brain` (the VERIFY step) · `spec-driven` (the rule comes from the spec) · `ulap-testing`
