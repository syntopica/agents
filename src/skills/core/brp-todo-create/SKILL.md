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

## Rules

- Discovery and consolidation only. Do not implement the work found during the
  audit.
- Complete the audit; do not stop after presenting a coverage plan.
- Preserve unrelated user changes and useful existing instructions.
- Review conversations semantically. Keyword search is an index, not proof of
  coverage.
- Prefer current repository evidence over stale conversational claims, and read
  later messages before deciding an earlier task's status.
- Never copy credentials, tokens, secret values or personal data into `TODO.md`,
  `TODO_LOG.md`, the index, instructions or chat. Report the exposure with a
  safe vault reference instead.
- No commit, push, deploy, production write or destructive operation unless
  separately authorized.
- Report critical security or data-loss findings immediately, then continue the
  rest of the audit.
- Never claim complete coverage from the histories that happened to be easy to
  read. Name what was unavailable, corrupted, truncated or only partially
  searchable.
- Offload heavy batch work (bulk history parsing, large transcript
  summarization) to the cheapest capable capacity whenever possible: Codex CLI
  on its own OpenAI quota, Antigravity (Gemini quota, plus separate Claude and
  ChatGPT quotas), or cheaper Claude models (Haiku or Sonnet subagents). Reserve
  the main session's model for coordination, deduplication, and judgment calls.
- Work discovered that belongs to a different project is filed in that project's
  own `TODO.md`, following that repository's conventions and the same format
  contract, with a pointer to the evidence. It never lands in the current
  backlog as if it were local work. When the target repository is not
  accessible, record the item in the current `TODO.md` under a `Cross-project`
  category, marked with the target repository and the smallest transfer action.

## Workflow

1. Resolve the repository root, read every applicable instruction file, and
   identify the canonical source of shared instructions. When `CLAUDE.md` is
   generated or imports another file, edit the owning source, not the generated
   output. Locate the project-owned `TODO.md`, `TODO_LOG.md` and
   `TODO_HISTORY_INDEX.jsonl`, ignoring vendor and generated ones.
2. Inventory accessible history: Claude Code conversations and summaries, Codex
   tasks, sessions, rollouts and memories, Cursor composer chats (load
   `references/cursor-history.md` for the exact database location, schema, and
   read-only queries), Antigravity sessions, tool calls and output, command
   output and errors, plans, reports and handoffs, plus Git history that can
   confirm whether discussed work landed. Process large histories in bounded
   batches with deterministic source coverage. Parallel agents get
   non-overlapping source ranges; the coordinator deduplicates and verifies.
3. Reuse `TODO_HISTORY_INDEX.jsonl` so unchanged conversations are never
   reparsed. Load `references/history-index.md` for the record shape and the
   skip, resume and retry rules.
4. Recover work semantically: requests never completed, work promised but not
   executed, partial implementations, failed checks and abandoned commands,
   incidental bugs and risks, deferred refactors, tests, docs and migrations,
   unconfirmed decisions, missing access or dependencies, superseded approaches,
   and completed milestones worth keeping as context. Corroborate material
   claims against the tree, tests or Git history. Do not invent work the
   evidence does not support.
5. Write `TODO.md` as a scannable backlog grouped only into categories that
   contain tasks (useful categories include Security, Bugs, UX / UI, Frontend,
   Backend, Database, Infrastructure, Performance, Integrations, Testing,
   Documentation, Refactors, Pending Decisions, Blocked Tasks, and Future
   Ideas), ordered within each category by critical risk, security, data loss,
   production impact, user-facing bugs, delivery blockers, then optional value.
   Move verified `[x]` and `[-]` work to `TODO_LOG.md` with its evidence. Load
   `references/todo-formats.md` for the state legend, the `TODO.md` header and
   the log entry shape. Reconcile a documented existing convention deliberately
   and say what was normalized rather than mixing conventions.
6. Add the compact maintenance rule from `references/maintenance-rule.md` to the
   canonical instruction source, once, in the existing style. Do not duplicate a
   rule already present or paste the audit workflow into an always-loaded file.

Every entry is concise, actionable, understandable without reopening the
conversation, specific enough to know when it is done, deduplicated, and free of
raw transcripts, large logs and secrets. Keep useful paths, commands, endpoints
and issue or PR references. No per-task tables, synthetic identifiers or session
diary.

## Final verification

Before finishing:

1. Review the accessible history a second time through
   `TODO_HISTORY_INDEX.jsonl`, looking for skipped ranges, duplicate records,
   changed fingerprints, or untracked sources.
2. Check whether later conversations completed earlier pending work, and
   reconcile material status claims against the current repository when
   practical.
3. Merge duplicates, confirm every task sits in the right category, and confirm
   uncertain, partial, and blocked work is still open.
4. Confirm every completed task has real evidence and every blocker names the
   missing condition.
5. Confirm no raw output, secret, or excessive historical narration entered
   `TODO.md` or `TODO_LOG.md`, and that every historical `[x]` or `[-]` item is
   in `TODO_LOG.md` while active work remains in `TODO.md`.
6. Confirm the instruction change is concise, non-duplicative, and made in the
   owning source.
7. Confirm every `complete` index record was written only after its findings
   were reconciled, and that partial or inaccessible coverage remains honest.
8. Review the focused diff and ensure no unrelated file changed.

## Output

- Return: pending, partial, blocked, completed and obsolete counts; categories
  created or changed; history coverage and inaccessible sources; conversations
  reused unchanged, newly parsed, incrementally extended, reparsed, partial,
  inaccessible and irrelevant; files modified; validation performed;
  cross-project items filed with their target repositories; and any finding
  needing immediate human action.
- Show a focused diff summary for `TODO.md`, `TODO_LOG.md`,
  `TODO_HISTORY_INDEX.jsonl` and the instruction source. Do not dump the backlog
  or the index into chat.
