---
name: brp-todo-create
description:
  Builds a project backlog from accessible Claude, Codex, Cursor and Antigravity
  history into TODO.md, TODO_LOG.md, and the history index. Trigger when a
  repository has no usable backlog and the work is to audit past conversations,
  recovering every unfinished task, blocker, decision and milestone they
  contain. Do not use for implementing the recovered work, for executing an
  existing backlog, or for summarizing a single conversation.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, TodoWrite, Task
argument-hint: [repository-or-scope]
---

# Owner overlay over tadu-create

Load and follow the public skill `tadu-create` (installed from
`syntopica/tadu`). If it is not available, stop and say "run pnpm
skills:bootstrap in ~/p/agents". The owner rules below apply on top of it and
win where they differ.

## Owner rules

- English in every artifact.
- Offload bulk history reading to agy, OpenRouter free models, local models, or
  cheaper Claude subagents (Haiku or Sonnet); use a read-only Codex pass only to
  verify the result.
- Commit and push authority is standing in `~/p` and in owned repositories, per
  each repository's own instructions. Client repositories (origin owner
  `client-example`, `client-example`, `client-example`, `client-example`, `client-example`,
  `owner-product`, `client-example`, `client-example`) are report-only: no commit, no push.
- Cross-project discoveries go to the owning repository under `~/p`, or to
  `~/p/TODO.md` when none owns them.
- Finish with `tadu doctor <repo>` exiting 0, or report each remaining finding.
