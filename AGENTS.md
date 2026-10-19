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

<!-- tadu:rule v3 -->

## Continuous TODO, Work Log, and History Coverage

Maintain `TODO.md` as the active backlog and `TODO_LOG.md` as the searchable
record of closed work. Use `TODO_HISTORY_INDEX.jsonl`, when present, to avoid
parsing unchanged conversations more than once.

- Read `TODO.md` at the beginning and end of related work. Search `TODO_LOG.md`
  before reopening an old task or repeating a previous solution.
- Record actionable bugs, risks, blockers, deferred work, missing tests,
  validation, documentation, and product improvements as they are discovered.
- Update an existing entry instead of creating a duplicate. Keep entries concise
  and under the most relevant category.
- Use `[ ]` pending, `[~]` partial or unverified, `[!]` blocked, `[x]` verified
  complete, `[-]` obsolete or superseded. Keep blockers in `TODO.md` and name
  the smallest action required to unblock them.
- When work becomes `[x]` or `[-]`, remove it from `TODO.md` and add a dated
  entry to `TODO_LOG.md` under `## YYYY` and `### YYYY-MM` headings, in the
  shape below. An `[x]` entry needs an `Evidence:` line and a `[-]` entry a
  `Resolution:` line, each with content.
- Before reviewing past conversations, consult the history index and skip
  unchanged records already marked `complete` or `irrelevant`. Update a record
  only after its findings are reconciled; interrupted work stays `partial`.
- Do not interrupt the active task for unrelated non-critical work, and do not
  implement unrelated TODO items unless requested. Immediately report critical
  security, destructive, or data-loss findings.

```md
- [x] YYYY-MM-DD — **Category:** What was done.
  - Result: What changed.
  - Evidence: The test, command result, commit or PR that proves it.

- [-] YYYY-MM-DD — **Category:** What was dropped.
  - Resolution: Why it no longer applies, or what replaced it.
```

Close an item with `tadu close --match "<text>" --evidence "<proof>" --write`
(`--resolution` for `[-]`, `--result` for the Result line); it moves the item
and writes the entry in this shape. Run `tadu doctor .` after changing these
files and before committing. If `tadu` is not on PATH, install it as
https://github.com/syntopica/tadu#install describes, or report that it is
missing. Format: tadu spec v1,
https://github.com/syntopica/tadu/blob/main/spec/todo-format-v1.md. The
tadu-create and tadu-work skills automate these workflows and are optional.
<!-- /tadu:rule -->
