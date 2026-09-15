---
name: medallion-lakehouse-pipelines
description: Scaffold Bronze / Silver / Gold lakehouse layers — raw immutable ingest, schema-enforced cleaning, star-schema and SCD Type 2 gold marts. Fire when building batch or streaming pipelines in Delta Lake, Spark, Databricks or dbt; when raw data is being mutated in place; when a pipeline has no quality gate; or on "medallion", "bronze silver gold", "lakehouse", "SCD Type 2", "data quality layer", "small files problem". Not for SQLite or transactional queries.
metadata:
  version: 1.1.0-amini
  adopted: 2026-09-15
  origin: oreilly-software-architecture-bundle (NotebookLM distillation)
  corpus: ~/.cto-brain/corpora/software-architecture/
---

# Medallion Lakehouse Pipeline Architecture

## Provenance
Distilled via NotebookLM from the O'Reilly Software Architecture bundle (adopted 2026-09-15).
**Not verified line-by-line against the source text.** Treat the METHOD as sound and any
specific number, named rule, or attributed technique as UNCHECKED until read in the book.

- *Building Medallion Architectures* — `~/.cto-brain/corpora/software-architecture/buildingmedallionarchitectures.epub`

Before citing anything here as authoritative, open the epub and check it. A claim that
cannot be located in the corpus is folklore wearing a citation.


## Goal
Design and configure structured, modular data lakehouse pipelines following Delta Lake/Lakehouse best practices (Bronze, Silver, Gold).

## When to Use
- When building batch or streaming data pipelines in Delta Lake, Spark, or Databricks.
- Implementing robust data quality checks and SCD Type 2 dimension mapping.

## When NOT to Use
- Simple SQLite databases or transactional SQL queries where datalake scaling is unnecessary.

## Preconditions
- Verify read/write permissions on the target cloud storage buckets or Spark tables.

## Methodology
1. **Bronze Layer (Ingestion & History)**:
   - Store raw ingest data exactly as received (JSON, Parquet, CSV).
   - Implement date hierarchical partitioning (e.g., `adventureworks/YYYY/MM/DD/TableName.parquet`).
2. **Silver Layer (Cleaning & Enrichment)**:
   - Apply schema enforcement and evolution modes.
   - Perform technical validations: rename columns to standard format, handle NULLs, deduplicate records based on business keys.
3. **Gold Layer (Analytical & Dimension Models)**:
   - Assemble star schema (Fact and Dimension tables).
   - Generate Slowly Changing Dimensions (SCD Type 2) scripts, generating record hash keys to compare state transitions and maintain history.

## Output Format
Generate PySpark, dbt, or Delta Live Tables scripts:
- Schema parameters configuration.
- Delta merger logic for Silver-to-Gold promotion.

## Quality Check
- Verify that Bronze contains untouched, historic raw data.
- Ensure that Silver cleans data based on a metadata configuration catalog.
- Verify SCD Type 2 logic is tested against empty, updated, and deleted rows.

## Common Issues
- Small file performance bottleneck: trigger automatic optimization compact steps (`OPTIMIZE table ZORDER BY business_key`).

## Composes with
`shamba` (build the verifier first) · `model-foundry`
