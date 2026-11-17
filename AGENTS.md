# Rocket Agents repository instructions

## What this is

This public TypeScript control plane owns BRP policy, adapters, diagnostics, and
machine convergence. Conversation capture moved to `syntopica/scribe` on
2026-10-11. Changes can alter the agent environment on every linked client.

**Do not run `machine:apply`, `machine:rollback`, `rules:link`, `skills:link`,
`hooks:link`, or a release without explicit human authorization.** Read-only
inspection, builds, tests, doctors, diffs, and apply-path tests wholly contained
in a newly created OS temporary directory are safe.

## Branch model

`main` is the default branch and tracks `origin/main`. Make changes on the
current user-selected branch; never rewrite shared history.

## Build and run

- Runtime: Node 22.13 or newer; package manager: the version pinned in
  `package.json` (`packageManager`).
- Install: `pnpm install --frozen-lockfile`.
- Build generated rules, skills, agents, and plugins: `pnpm run build`.
- Full formatting, lint, type, test, portability, and hygiene gate:
  `pnpm run check`.
- Generated output under `dist/` is ignored. Edit canonical sources under `src/`
  and `scripts/`.

## Shipping a rule or skill change

Standing owner authorization: run this whole sequence, including the link step,
without asking again. It is the only pre-authorized use of a link command; every
other machine mutation listed above still needs its own approval.

```bash
git pull --ff-only origin main   # other sessions commit here concurrently
pnpm run rules:compile           # or pnpm run build for skills/plugins too
pnpm run check                   # must exit 0 - check the exit code, not the tail
git add <specific paths>         # never git add -A
git commit
git push origin main
pnpm run rules:link              # or skills:link / hooks:link to match the change
```

Pull first and re-run the gate after it: rules share one generated index with a
hard size budget, so a rule committed by another session can push the index over
the limit and break a build that passed minutes earlier. When that happens, buy
the space back from verbose descriptions rather than raising the budget, and
keep the keywords that route each rule.

Verify the link landed instead of trusting its summary. `claude` reports
`unchanged` on a rule addition because it resolves a symlink into `dist/`, which
`rules:compile` already refreshed; confirm with
`ls ~/.claude/rules/rocket-agents/global/`.

## Smoke test

Verified commands:

```bash
pnpm run type-check
```

It exits zero.

## Distribution

This repository is not a hosted service. `pnpm run build` creates local
distribution artifacts. Link commands copy or link those artifacts into
user-level agent configuration and therefore count as machine mutations.
Releases use the `brp-release` workflow.

## Cross-repo interactions

- `~/p/rocket-agents-library` owns curated skill sources consumed by the linker.
- `~/p/dotfiles` owns host bootstrap, private machine manifests, and scheduled
  invocations.
- `syntopica/scribe` owns conversation capture and the canonical archive;
  `syntopica/atrium` owns indexing and retrieval.
- `~/p/wiki` owns deliberate, human-authored knowledge.

## Security

- Never commit secrets or captured conversations. Tracked manifests contain
  environment references, never credential values.

## Conventions

- All code, comments, docs, identifiers, and commit messages are English.
- One file contains one exported unit and one responsibility. Dependencies are
  explicit imports.
- Existing migrations require explicit user confirmation before editing.
- Use `apply_patch` for source edits. Stage only intended paths; never use
  `git add -A`.

<!-- tadu:rule v4 -->

## Continuous TODO, Work Log, and History Coverage

Keep the active backlog and the searchable record of closed work with tadu. A
repository uses `TODO.md` and `TODO_LOG.md` (format 1), or one JSON file per
task under `todo/` (format 2, when `todo/tadu.json` exists). Use
`TODO_HISTORY_INDEX.jsonl`, when present, to avoid parsing unchanged
conversations more than once.

- Do not read the backlog files whole: query them. `tadu list` filters with
  `--category`, `--type`, `--text`, `--due-within N`, `--overdue`,
  `--min-priority`, `--open` (pending work only) and `--history`; `tadu ready`
  lists what can start now; `tadu show KEY` prints one item. When more items
  follow, a list says so on stderr: page with `--offset` or narrow the filter.
- Before recording work or reopening an old task, run `tadu similar "<title>"`
  and update the existing item instead of creating a duplicate.
- Record actionable bugs, risks, blockers, deferred work, missing tests,
  validation, documentation, and product improvements as they are discovered.
- Use `[ ]` pending, `[~]` partial or unverified, `[!]` blocked, `[x]` verified
  complete, `[-]` obsolete or superseded (in format 2: pending, in_progress,
  blocked, done, cancelled). Keep blockers open and name the smallest action
  required to unblock them.
- Format 1: when work becomes `[x]` or `[-]`, remove it from `TODO.md` and add a
  dated entry to `TODO_LOG.md` under `## YYYY` and `### YYYY-MM` headings, in
  the shape below. An `[x]` entry needs an `Evidence:` line and a `[-]` entry a
  `Resolution:` line, each with content.
- Format 1: give an item a `Kind:` field when it is clear what it is: `task` for
  work you can do, `decision` for a choice a person must make, `waiting` for
  something someone else owes, `later` for something not to do now. Leave it out
  when unclear. `Due:` is the deadline, `Check on:` the day to look at the item
  again and `Not before:` the day before which it cannot start.
- Take work with `tadu next`; `tadu inbox` lists what waits on a person and
  `tadu urgent` what is urgent. When only a person can answer a question while
  you work alone, record it (format 1: `tadu add --kind decision`; format 2: a
  task of type `decision`), block the task it holds up (format 1:
  `tadu mark --state blocked --note "<blocker>"`; format 2: add the decision to
  its `blocked_by` with `tadu set`), and go on with the next task.
- Format 2: never edit task files by hand. Use `tadu add` (with category, type
  and priority), `tadu set ID key=value`, `tadu claim ID --as agent:<name>`
  before working on a task, and `tadu close --id ID --evidence "<proof>"`
  (`--resolution`, or `--duplicate-of ID`). Close reports the tasks that no
  longer wait on it; decide for each whether it moves to pending. Every command
  is a dry run until `--write`.
- Before reviewing past conversations, consult the history index and skip
  unchanged records already marked `complete` or `irrelevant`. Update a record
  only after its findings are reconciled; interrupted work stays `partial`.
- Do not interrupt the active task for unrelated non-critical work, and do not
  implement unrelated TODO items unless requested. Immediately report critical
  security, destructive, or data-loss findings. Never put secrets in the
  backlog.

```md
- [x] YYYY-MM-DD — **Category:** What was done.
  - Result: What changed.
  - Evidence: The test, command result, commit or PR that proves it.

- [-] YYYY-MM-DD — **Category:** What was dropped.
  - Resolution: Why it no longer applies, or what replaced it.
```

In format 1, close an item with
`tadu close --match "<text>" --evidence "<proof>" --write` (`--resolution` for
`[-]`, `--result` for the Result line); it moves the item and writes the entry
in this shape. `add`, `mark` and `close` print a diff and write only with
`--write`; a connected `tadu mcp` server offers the same tools. Run
`tadu doctor .` after changing the backlog and before committing. If `tadu` is
not on PATH, install it as https://github.com/syntopica/tadu#install describes,
or report that it is missing. Formats: tadu spec v1,
https://github.com/syntopica/tadu/blob/main/spec/todo-format-v1.md, and v2,
https://github.com/syntopica/tadu/blob/main/spec/todo-format-v2.md. The
tadu-create and tadu-work skills automate these workflows and are optional.
<!-- /tadu:rule -->
