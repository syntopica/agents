---
name: daily-tasks
description:
  Updates both Macs, syncs their repositories, upgrades dependencies and audits
  Atrium in one round. Trigger when the ask is the daily tasks, the daily round, updating the system and dependencies,
  syncing repos between the two Macs, or checking that Atrium is healthy and
  synced. Triggers (ES) are tareas diarias, rutina diaria, actualiza todo,
  sincroniza con el mini, revisa atrium. Do not use for one named repository's
  dependency upgrade, for a single git push, or for debugging Atrium's index
  (that is its own repository).
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [--dry-run] [--steps system,repos,ncu,atrium]
---

# Daily tasks — the maintenance round

One script does the work; this skill exists for what happens after it: reading
the report and deciding, line by line, what is fixed, what is recorded and what
is left alone. Run it, then read `~/p/.daily/last.md`.

```bash
bash ~/p/bin/daily/daily-tasks.sh              # everything, both Macs
bash ~/p/bin/daily/daily-tasks.sh --steps ncu  # one step again
bash ~/p/bin/daily/daily-tasks.sh --dry-run    # inventory, no writes
```

A full run takes an hour or more: the ncu step installs and verifies every owned
JavaScript repository sequentially, and the archive sync moves 46k records.
**REQUIRED SUB-SKILL:** use long-job-safety before launching it, and background
it with a guard on `~/p/.daily/logs/<date>/` moving. The steps are idempotent,
so a run cut short is finished by running it again.

## What the steps do and refuse

| step   | does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | refuses (PROBLEM)                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| system | RocketUpdater `--scheduled` here and on the mini                                                                                                                                                                                                                                                                                                                                                                                                                                               | `SYSTEM_FAIL`; a degraded preflight defers work and reports `INFO SYSTEM_DEGRADED`                      |
| repos  | commits dirty repos owned by an org in `bin/daily/owned-orgs.txt`, rebases, pushes, on both Macs; then `repo-sync.sh` fast-forwards everything                                                                                                                                                                                                                                                                                                                                                 | `HUGE_DIRTY` (>200 files), `IN_PROGRESS`, `UNMERGED`, `SECRET_FILE`, `MARKERS`, `DIVERGED`, `PUSH_FAIL` |
| ncu    | `ncu -u` to latest in every owned repo with a package.json (minus `bin/daily/ncu-denylist.txt`, plus `ncu-allowlist.txt`), 3-day cooldown, `packageManager` pin untouched; install, typecheck or build, rewrite `TS4111` property accesses whenever tsc reports them (other errors still ship as `BROKEN`), commit `chore(deps)`, push. Never reverts: a failing install or type-check ships anyway as `BROKEN`, with the breakage filed in that repository's `TODO.md` inside the same commit | `NCU_FAIL` (ncu itself errored), `COMMIT_FAIL` (hook rejected; the upgrade stays staged), `PUSH_FAIL`   |
| atrium | `atrium status` and `atrium doctor` on both Macs, then `sync-conversations`                                                                                                                                                                                                                                                                                                                                                                                                                    | `ATRIUM_STALE` (>24 h), `ATRIUM_DOCTOR`, `ARCHIVE_SYNC_FAIL`                                            |

## Acting on the report

Work the `## Problems` list top to bottom. Each line names its repository and
its host (`@local`, `@macmini`).

- **Fix in the run:** `PUSH_FAIL` (retry once, then treat as DIVERGED),
  `PULL_FAIL (p-root)` on the mini (fast-forward `~/p` there by hand and rerun
  `--steps repos`), `ARCHIVE_SYNC_FAIL` on a lock (rerun `--steps atrium` after
  the hourly refresh finishes), `SYSTEM_FAIL` when the log shows a transient
  network error.
- **Record, never resolve:** `HUGE_DIRTY`, `DIVERGED` (only when a file other
  than `TODO.md`/`TODO_LOG.md` conflicts: a TODO-only conflict is merged by
  union inside the round, owner's rule of 2026-09-12), `SECRET_FILE`,
  `UNMERGED`, `IN_PROGRESS`, `MARKERS`. These are decisions about someone's
  work. The script has already filed each one under `## Daily round` in that
  repository's `TODO.md` (`bin/daily/record-repo-finding.sh`, one bullet per
  code, updated in place while it repeats); your job is to open that bullet and
  add the smallest next step it lacks.
- **Read before enriching:** every `BROKEN`. The repository is already on the
  new versions and its type-check or install is red; the filed bullet quotes the
  decisive log line. Open `.daily/logs/<date>/ncu-<repo>.log` when that line
  does not name the package, and write the package and the forward fix into the
  bullet. Never propose a downgrade or a pin as the fix.
- **Where a finding lives:** in the repository it is about, never only in the
  day's report. `~/p/TODO.md` takes only cross-repo decisions (a denylist entry,
  a policy change, a machine gap).
- **Ignore:** `SKIP ACTIVE` (a live session), `SKIP NOT_OWNED`, `INFO OUTDATED`
  on repositories that are not ours.

Finish by committing and pushing `~/p` (its standing authorization covers this),
so the mini and the next session read the same `TODO.md`.

## Decisions already taken (do not re-ask, do not quietly reverse)

- pnpm repos install with `--dangerously-allow-all-builds`: pnpm 12 refuses to
  install when any dependency's build script is not allowlisted in the repo, and
  no `strict-dep-builds` spelling turns that off. It runs every postinstall
  script unattended; the cooldown is the only mitigation.
  `DAILY_PNPM_ALLOW_BUILDS=0` makes those repos ship `BROKEN` instead. Owner
  accepted the trade on 2026-09-12. A repo that allowlists its builds
  (`onlyBuiltDependencies`) installs without the flag, because pnpm 10.33
  refuses the pair; installs run under `CI=true` so a module purge does not wait
  for a TTY.
- TypeScript goes to latest. TypeScript 7 (and `@syntopica/tsconfig` 0.3.0)
  turn on `noPropertyAccessFromIndexSignature`;
  `bin/daily/ts4111-bracket-access.mjs` rewrites the flagged `.prop` to
  `['prop']` from the tsc output, up to five passes, whether or not other errors
  sit beside them (since 2026-09-12 evening; contratos had shipped 188
  unrewritten next to 8 real errors). Repos that also depend on
  typescript-eslint get the side-by-side pair from
  `brain/topics/dev-environment.md` applied by `bin/daily/ts7-side-by-side.mjs`
  (`typescript` on the `@typescript/typescript6` shim, TS 7 under
  `@typescript/native`), because typescript-eslint refuses TS 7 in the
  pre-commit lint.
- A filed finding is committed on its own (`chore: record daily round findings`,
  `bin/daily/commit-repo-findings.sh`) before the next attempt, so it does not
  block the repo as dirty.
- Never revert, always forward (owner, 2026-09-12: "no reviertas nada, siempre
  hacia nuevo y adelante"). A breaking major is committed and pushed with its
  breakage recorded; the fix happens on the new versions, in that repository.
  This applies to the round and to the session acting on its report.
- A partial run (`--steps`) writes `<date>-<steps>.md`, never the day's full
  report.

## Common mistakes

- Reading `OK` on the system step as "patched": check for `SYSTEM_DEGRADED`
  first. The mini runs hot and defers heavy work most days.
- Treating a `BROKEN` as a failure of the round. The round did its job: the
  repository is on the new versions and the breakage is named in its `TODO.md`.
- Widening `owned-orgs.txt` to make a `SKIP NOT_OWNED` go away. Client and
  partner repositories are excluded on purpose; ask the owner.
- Running two rounds at once, or one during the hourly `atrium-refresh` on the
  same archive. The lock wait is bounded at ten minutes and then reports.
