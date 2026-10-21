---
name: brp-todo-work
description:
  Executes a project's existing TODO backlog end to end until every safe item is
  verified complete, blocked with evidence, or superseded. Trigger when the task
  is to work through TODO.md, clear the backlog, or resume autonomous TODO
  execution in the current repository, recording closed work in TODO_LOG.md. Do
  not use for building a backlog from conversation history, for a single named
  bug fix or feature, or for review of already-finished work.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, TodoWrite, Task
argument-hint: [scope-or-category]
---

# Owner overlay over tadu-work

Load and follow the public skill `tadu-work` (installed from `syntopica/tadu`).
If it is not available, stop and say "run pnpm skills:bootstrap in ~/p/agents".
The owner rules below apply on top of it and win where they differ.

## Owner rules

- English in every artifact.
- Second model and offloading follow the owner's routing: bulk and
  implementation go to agy, OpenRouter free models, local models, or cheaper
  Claude subagents (Haiku or Sonnet). Codex is the verifier: every finished wave
  gets a read-only Codex review, and open forks are adjudicated with one
  read-only `codex exec` per wave as described in
  `references/codex-adjudication.md`.
- Resolve repository ownership and standing authority from private instance
  guidance and the repository's own instructions. Classified client repositories
  are report-only: no commit, no push. Owner products follow their own
  `AGENTS.md` authorization for commit, push, branch, and deployment actions. If
  the ownership classification is unavailable, do not infer write authority.
- Cross-project discoveries go to the owning repository under `~/p`, or to
  `~/p/TODO.md` when none owns them.
- Finish with `tadu doctor <repo>` exiting 0, or report each remaining finding.
