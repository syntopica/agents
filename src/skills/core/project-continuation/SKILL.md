---
name: project-continuation
description:
  Resumes interrupted project work by reconstructing the real state from git,
  TODO backlogs, plan and handoff files before touching code. Trigger when a
  prompt continues earlier work ("sigue", "continúa", "donde lo dejamos",
  "termina lo que falta"), when a session starts mid-task, or when the
  continuation router lane fires. Do not use for brand-new tasks with fresh
  scope, a single named bug fix, or review of already-finished work.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [optional-topic]
---

## Rules

- Recover state from evidence, never from memory of what "was probably
  happening". Uncommitted changes, failing checks, and half-applied edits
  outrank any narrative.
- Do not ask the user to repeat context they already gave; ask only for what no
  artifact records.
- Do not start new scope while recovered work is unfinished; finish or
  explicitly park it first.
- If the recovered state contradicts the user's framing, surface the difference
  before acting.

## Workflow

1. Read the working tree first: `git status`, `git log` since the last session,
   and any stash or untracked files that look mid-task.
2. Read the project's continuation artifacts in order: a handoff document if one
   exists (the `handoff` skill writes them), the active plan file, `TODO.md`
   (items marked `[~]` or `[!]` first), and `TODO_LOG.md` for what already
   closed.
3. State back the recovered picture in one short summary: what was done, what is
   verified, what remains, and the exact next command or edit.
4. Resume at the smallest unfinished step and validate it the way the original
   task defined (its stated check or test) before moving forward.
5. When the resumed work closes, update the same artifacts the recovery read
   from, so the next continuation starts from truth.

## Output

- Return: the recovered state summary (done / verified / remaining), the
  artifacts it was reconstructed from, the work advanced this session with its
  validation results, and the updated backlog or plan entries.
