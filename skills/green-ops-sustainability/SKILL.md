---
name: green-ops-sustainability
description: Audit code, Dockerfiles, and cloud templates for carbon and cost efficiency — LightSwitchOps (turn dev/test off overnight), zombie workload detection, burstable / Graviton / serverless sizing, scale-to-zero. Fire when reviewing deployment templates, CI config, or instance sizing; when a cloud bill jumps; when a GPU or VM sits idle; or on "GreenOps", "carbon", "sustainability", "cloud waste", "why is this so expensive", "always-on", "idle instances". FinOps and GreenOps are the same audit. Not for local scripts.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# GreenOps & Software Sustainability Audit

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Building Green Software* — `~/.cto-brain/corpora/software-architecture/buildinggreensoftware.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Equip the user with a GreenOps audit tool to check code, Dockerfiles, and cloud templates for carbon efficiency, LightSwitchOps, and high machine utilization.

## When to Use
- When reviewing deployment templates, CI/CD pipelines, or microservices configs for resource efficiency.
- When establishing sustainability guidelines aligned with AWS Sustainability Pillar or GSF Matrix.

## When NOT to Use
- For local command-line scripts or purely static non-cloud applications.

## Preconditions
- Validate permissions before recommending the auto-termination of test systems or resizing configurations.

## Methodology
1. **LightSwitchOps**:
   - Identify test, QA, and development environments. Inject scheduling mechanisms (like cron or AWS Instance Scheduler) to shut down these environments overnight and on weekends.
2. **Zombie Workload Detection**:
   - Scan configuration files for always-on worker nodes, redundant backups, and lack of autoscaling.
3. **Burstable Instances & Serverless**:
   - Recommend AWS T3/T4g, Graviton instances, or serverless functions over dedicated, always-on instance types.
4. **Autoscaling Down**:
   - Enforce that autoscaling policies scale down to zero (or min-1) when traffic decays.

## Output Format
Create a `GREEN_AUDIT.md` report containing:
- **Zombie Workloads**: List of idle resources found.
- **Optimization Strategy**: Actions mapped to level 2 and 3 of the Green Software Maturity Matrix.
- **LightSwitchOps Plan**: Code blocks for cron or terraform to shut down dev/test infrastructure.

## Quality Check
- Check that all recommendations reduce machine footprints and costs (FinOps = GreenOps).
- Ensure any autoscaling suggestion contains rules for scaling down, not just up.

## Common Issues
- Fear of turning systems off: mitigate by backing up with GitOps/infrastructure as code.

## Composes with
`dgx-spark-remote-ops` · `amini-cloud`
