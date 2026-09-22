# Codex State Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Codex state integrity, quarantine malformed sessions, bound
session storage, and make the intended ChatGPT authentication method
deterministic without deleting recoverable data.

**Architecture:** A dedicated `codex-state` slice performs read-only inspection
by default. Apply mode refuses to run while Codex is active, creates a
checksummed snapshot, moves corrupt artifacts to quarantine, and verifies the
result. Session archival uses a manifest and reversible moves.

**Tech Stack:** TypeScript on Node (ESM), `node:test`, the installed `sqlite3`
CLI, SHA-256 from `node:crypto`, native file operations, Codex CLI read-only
diagnostics.

**Spec:**
`docs/superpowers/specs/2026-08-18-agent-platform-reliability-design.md`

## Global Constraints

- The default command is inspection only; mutation requires `--apply`.
- Never delete a database, sidecar, rollout, or archive.
- Never inspect or serialize `~/.codex/auth.json`.
- Refuse mutation while a Codex lock or process is active.
- Snapshot paths are explicit and permissions are user-only.
- Every changed artifact must have a pre-change SHA-256 entry.
- Every task ends with a commit and `git push origin HEAD`.

---

### Task 1: Model and inspect Codex state

**Files:**

- Create: `scripts/lib/codex-state/constants/CODEX_DATABASES.ts`
- Create: `scripts/lib/codex-state/types/DatabaseIntegrity.ts`
- Create: `scripts/lib/codex-state/types/SessionFinding.ts`
- Create: `scripts/lib/codex-state/types/CodexStateReport.ts`
- Create: `scripts/lib/codex-state/runSqliteIntegrityCheck.ts`
- Create: `scripts/lib/codex-state/readRolloutHeader.ts`
- Create: `scripts/lib/codex-state/inspectCodexState.ts`
- Test: `scripts/lib/codex-state/RUN_SQLITE_INTEGRITY_CHECK_TEST.ts`
- Test: `scripts/lib/codex-state/READ_ROLLOUT_HEADER_TEST.ts`

`CODEX_DATABASES` contains `memories_1.sqlite`, `state_5.sqlite`,
`logs_2.sqlite`, and `goals_1.sqlite`. Missing optional databases are reported,
not created.

```ts
export interface DatabaseIntegrity {
  path: string
  status: 'ok' | 'corrupt' | 'missing' | 'unreadable'
  summary: string
}
```

- [ ] Write a SQLite test that creates a valid database and a plain-text corrupt
      file in a temp directory.
- [ ] Write rollout-header fixtures for a valid `session_meta` header, malformed
      JSON, and a JSONL file whose first usable record is not `session_meta`.
- [ ] Run both tests and confirm they fail before implementation.
- [ ] Implement `sqlite3 <path> "PRAGMA integrity_check;"` with `spawn` and no
      shell.
- [ ] Implement a bounded header reader that stops after 64 KiB and never
      returns rollout content.
- [ ] Compose database, session count, byte size, and malformed-header findings.
- [ ] Run
      `npx tsx --test scripts/lib/codex-state/RUN_SQLITE_INTEGRITY_CHECK_TEST.ts scripts/lib/codex-state/READ_ROLLOUT_HEADER_TEST.ts`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/codex-state
git commit -m "feat: inspect Codex database and session integrity"
git push origin HEAD
```

---

### Task 2: Create immutable recovery snapshots

**Files:**

- Create: `scripts/lib/codex-state/types/SnapshotManifestEntry.ts`
- Create: `scripts/lib/codex-state/types/SnapshotManifest.ts`
- Create: `scripts/lib/codex-state/hashFile.ts`
- Create: `scripts/lib/codex-state/listDatabaseFamily.ts`
- Create: `scripts/lib/codex-state/createCodexSnapshot.ts`
- Create: `scripts/lib/codex-state/verifyCodexSnapshot.ts`
- Test: `scripts/lib/codex-state/CODEX_SNAPSHOT_TEST.ts`

The snapshot includes each selected database plus existing `-wal` and `-shm`
sidecars. The manifest records relative path, byte count, SHA-256, and original
mode. Snapshot creation fails closed if any selected file changes size while it
is copied.

- [ ] Write a temp-directory test that snapshots a database family and verifies
      every hash.
- [ ] Add a negative test that mutates a source between stat and verification.
- [ ] Run the test and confirm it fails before implementation.
- [ ] Implement snapshot creation under
      `~/.codex/backups/state-recovery/<run-id>/` with mode `0700`.
- [ ] Implement independent manifest verification.
- [ ] Run `npx tsx --test scripts/lib/codex-state/CODEX_SNAPSHOT_TEST.ts`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/codex-state
git commit -m "feat: snapshot Codex state before repair"
git push origin HEAD
```

---

### Task 3: Quarantine corrupt database and malformed sessions

**Files:**

- Create: `scripts/lib/codex-state/types/QuarantineEntry.ts`
- Create: `scripts/lib/codex-state/isCodexActive.ts`
- Create: `scripts/lib/codex-state/quarantineFile.ts`
- Create: `scripts/lib/codex-state/rebuildDerivedDatabase.ts`
- Create: `scripts/lib/codex-state/quarantineMalformedSessions.ts`
- Test: `scripts/lib/codex-state/QUARANTINE_FILE_TEST.ts`
- Test: `scripts/lib/codex-state/REBUILD_DERIVED_DATABASE_TEST.ts`

`memories_1.sqlite` is treated as derived state only after the snapshot
verifies. Repair moves the database family to `<snapshot>/quarantine/` and lets
the next Codex start create a fresh database. Malformed rollouts are selected by
parsed findings, never hard-coded paths, so no rollout identifier belongs in
this plan.

- [ ] Write tests proving a foreign healthy database is untouched and corrupt
      sidecars move with the selected database.
- [ ] Write tests proving malformed sessions move and valid sessions remain in
      place.
- [ ] Implement active-process and lock checks. Return a blocked result instead
      of killing a process.
- [ ] Implement same-filesystem rename with copy-and-verify fallback for
      cross-device moves.
- [ ] Write a quarantine manifest containing original and destination relative
      paths and hashes.
- [ ] Run both tests.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/codex-state
git commit -m "feat: quarantine corrupt Codex state safely"
git push origin HEAD
```

---

### Task 4: Add reversible session archival

**Files:**

- Create: `scripts/lib/codex-state/types/ArchivePolicy.ts`
- Create: `scripts/lib/codex-state/types/ArchivePlan.ts`
- Create: `scripts/lib/codex-state/planSessionArchive.ts`
- Create: `scripts/lib/codex-state/applySessionArchive.ts`
- Create: `scripts/lib/codex-state/restoreSessionArchive.ts`
- Test: `scripts/lib/codex-state/SESSION_ARCHIVE_TEST.ts`
- Modify: `scripts/commands/libraryObserveCodex.ts`

Policy defaults to sessions older than 90 days and never archives the current
calendar month. The archive lives outside `~/.codex/sessions` at
`~/.codex/session-archive/<run-id>/`, preserving the `YYYY/MM/DD` layout. Empty
source directories may remain.

- [ ] Write boundary tests for exactly 90 days, current month, malformed
      timestamps, and a restore collision.
- [ ] Implement a dry-run plan with count and bytes, then checksummed reversible
      moves.
- [ ] Add repeatable restore that refuses to overwrite an existing session.
- [ ] Extend `libraryObserveCodex` with repeatable `--sessions` flags so
      archived history can be observed explicitly without returning it to the
      active Codex directory.
- [ ] Run
      `npx tsx --test scripts/lib/codex-state/SESSION_ARCHIVE_TEST.ts scripts/lib/library/learning/READ_CODEX_SKILL_READS_TEST.ts`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/codex-state scripts/commands/libraryObserveCodex.ts
git commit -m "feat: archive Codex sessions with reversible manifests"
git push origin HEAD
```

---

### Task 5: Enforce ChatGPT authentication deterministically

**Files:**

- Create: `scripts/lib/codex-state/readCodexLoginStatus.ts`
- Create: `scripts/lib/codex-state/ensureForcedLoginMethod.ts`
- Test: `scripts/lib/codex-state/ENSURE_FORCED_LOGIN_METHOD_TEST.ts`
- Modify: `machine/security.json`
- Modify: `scripts/lib/platform-health/constants/LIVE_PROBES.ts`

**Prerequisite:** Complete Task 1 of
`docs/superpowers/plans/2026-08-18-platform-parity-and-security.md` before this
task. That task creates and validates `machine/security.json`.

The managed setting is:

```toml
forced_login_method = "chatgpt"
```

This setting controls Codex authentication while allowing `OPENAI_API_KEY` to
remain available to unrelated tools. Never print, parse, or modify `auth.json`.

- [ ] Write TOML-preservation tests for insertion, replacement, duplicate
      rejection, comments, and unrelated tables.
- [ ] Implement a top-level scalar edit using the existing conservative Codex
      TOML strategy.
- [ ] Parse `codex login status` into `chatgpt`, `api`, or `signed-out` without
      retaining output.
- [ ] Run
      `npx tsx --test scripts/lib/codex-state/ENSURE_FORCED_LOGIN_METHOD_TEST.ts`.
- [ ] Verify the key against the current official Codex configuration reference
      before applying.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add machine/security.json scripts/lib/codex-state scripts/lib/platform-health
git commit -m "feat: pin Codex to ChatGPT authentication"
git push origin HEAD
```

---

### Task 6: Add repair, archive, and restore commands

**Files:**

- Create: `scripts/commands/codexStateDoctor.ts`
- Create: `scripts/commands/codexStateRepair.ts`
- Create: `scripts/commands/codexSessionArchive.ts`
- Create: `scripts/commands/codexSessionRestore.ts`
- Create: `scripts/bin/run-codex-state-doctor.ts`
- Create: `scripts/bin/run-codex-state-repair.ts`
- Create: `scripts/bin/run-codex-session-archive.ts`
- Create: `scripts/bin/run-codex-session-restore.ts`
- Modify: `package.json`
- Modify: `docs/ide-setup.md`

Add scripts:

```json
{
  "codex:doctor": "tsx scripts/bin/run-codex-state-doctor.ts",
  "codex:repair": "tsx scripts/bin/run-codex-state-repair.ts",
  "codex:archive": "tsx scripts/bin/run-codex-session-archive.ts",
  "codex:restore": "tsx scripts/bin/run-codex-session-restore.ts",
  "codex:test": "tsx --test \"scripts/lib/codex-state/**/*_TEST.ts\""
}
```

- [ ] Implement commands with JSON output, `--apply`, `--retention-days`, and
      explicit restore `--run` flags.
- [ ] Print the snapshot path and exact restore command after every applied
      mutation.
- [ ] Run `pnpm run codex:doctor -- --json` and preserve the pre-repair report
      outside git.
- [ ] Stop all Codex clients before the apply step. If a process remains active,
      let the command refuse the mutation; do not kill it.
- [ ] Run `pnpm run codex:repair -- --apply`.
- [ ] Start Codex once to recreate derived state, stop it, then run
      `pnpm run codex:doctor -- --json`.
- [ ] Run `pnpm run codex:archive` and review count and bytes before running
      `pnpm run codex:archive -- --apply`.
- [ ] Verify the archive manifest and run the restore command with `--dry-run`
      against the new run.
- [ ] Run `codex login status` and confirm ChatGPT is active.
- [ ] Document actual before/after counts and snapshot paths without secrets.
- [ ] Run `pnpm run check:all && git diff --check`.
- [ ] Commit and push:

```bash
git add package.json docs/ide-setup.md scripts/bin scripts/commands scripts/lib/codex-state
git commit -m "feat: add safe Codex state recovery commands"
git push origin HEAD
```

## Completion Gate

Run:

```bash
pnpm run check:all
pnpm run codex:doctor -- --json
codex login status
pnpm run agents:doctor -- --json
git status --short --branch
```

Expected: all SQLite databases report `ok`; no malformed session remains under
active sessions; archive and quarantine manifests verify; login reports ChatGPT;
the repository is clean and synced.
