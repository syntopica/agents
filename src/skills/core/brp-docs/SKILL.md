---
name: brp-docs
description:
  Generates or updates technical documentation, specs, and ADRs that explain the
  codebase, interfaces, or design decisions for future readers. Trigger when the
  task is to write README content, API docs, architecture overviews, or
  technical specs from code context with strong text hygiene and consistent
  engineering terminology. Do not use for implementing features, debugging
  runtime issues, or performing findings-first code review.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
argument-hint: [target-or-topic]
---

## Rules

- Avoid time-sensitive references ("recently", "in the next release").
- Include runnable examples wherever possible, and run each example command
  before publishing it; an example that was never executed is a guess, not
  documentation.
- Write ADRs only for decisions that pass the ADR bar in
  `references/adr-format.md`; keep them minimal and file them as
  `docs/adr/NNNN-slug.md`.
- Keep domain vocabulary in a `CONTEXT.md` glossary per
  `references/context-format.md`, and write ADR and glossary entries inline as
  decisions and terms crystallize, never as a batch afterwards.

## Workflow

1. Read the code the documentation describes; never document from memory of
   similar projects.
2. Draft the document for a reader with zero prior context on this codebase.
3. Verify every command, path, identifier, and example against the actual
   source; run the runnable ones.
4. Fix mismatches and re-verify until the draft and the code agree.

## Output

- Return: files written or updated, the examples that were executed with their
  results, and any claim that could not be verified against the code.
- Load `references/adr-format.md` when recording a design decision, and
  `references/context-format.md` when defining or challenging domain vocabulary.
