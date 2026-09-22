---
name: handoff
description:
  Generates a handoff document that serializes the current working state so
  another session or agent can resume from it without re-deriving anything.
  Trigger when the task is to hand off, pause, or transfer in-progress work,
  when context is running out mid-task, or when the user asks for a handoff,
  checkpoint, or session summary to continue elsewhere. Do not use for final
  delivery reports of finished work or for routine progress updates inside one
  session.
allowed-tools: Read, Grep, Glob, Bash, Write
---

## Rules

- Report only what a command output or file in this session evidences. An
  unverified claim is marked as unverified, not omitted and not asserted.
- The document must stand alone: the reader has none of this session's context,
  so no shorthand, no "as discussed", no references to conversation turns.
- Name the exact commands to resume with (attach, re-run, verify), not
  descriptions of them.
- Write it to a file in the repo or scratchpad and say where; a handoff that
  lives only in chat scrollback is lost with the session.

## Checklist (every section, in order; write "none" rather than skipping)

1. **Scope** - the task as currently understood, including decisions taken and
   their reasons.
2. **Tree state** - repo, branch, `git status --short`, whose the dirty files
   are, what is staged.
3. **Branch/PR** - branch name, PR number and state if one exists, what remains
   before merge.
4. **Running processes** - anything left running (servers, watchers, tunnels,
   background jobs) with the exact command to attach to or kill each one.
5. **Checks run** - which validation commands ran, their results verbatim where
   they matter, and which have NOT run yet.
6. **Next steps** - ordered, smallest first, each with its verification command.
7. **Gotchas** - everything discovered the hard way this session that the next
   reader would otherwise rediscover: flaky commands, misleading errors, files
   that look wrong but are right.

## Output

- Return: the handoff file path and a one-paragraph summary of scope and the
  first next step.
