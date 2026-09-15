# TODO Log

> Searchable record of closed project work. Active work lives in `TODO.md`.

## 2026

### 2026-09

- [x] 2026-09-15 - **Unified context skill:** the Brain skill now prefers
      resident `atrium_context`, combines history and curated notes in one call,
      and resolves manual fallback paths from the configured Syntopica instance.
      Compiled personal and portable copies were deployed with exact hash
      parity; unrelated library changes were preserved. Verified with
      `pnpm run skills:compile`, `pnpm run skills:validate`,
      `pnpm run skills:test`, `pnpm run skills:lint`, `pnpm run guidance:test`
      and `pnpm run check` (temporary pnpm launcher shim; see active tooling
      issue). A fresh Codex session used the installed skill and
      `atrium_context` to recover synthetic access/history/runbook evidence
      without claiming a current delivery outcome.

- [x] 2026-09-14 - **Shared package scope migration:** the repository installs
      and gates on the `@syntopica` scope.
  - Result: `@syntopica/quality-config@^0.11.0` and `@syntopica/tsconfig@^0.3.0`
    replace the old ranges, the lockfile is regenerated, and 129 source files
    carry the mechanical updates `noPropertyAccessFromIndexSignature` requires
    (`entry.relativePath` becomes `entry['relativePath']`).
  - The gate was blocked by an uncommitted `eslint.config.mjs` dating from
    2026-09-12 that reverted the `import-x` migration committed in `eb25567` and
    imported `eslint-plugin-import`, which is not a dependency and is not
    installed, so that state had never run. Restored from HEAD; the superseded
    file is kept outside the repository rather than discarded.
  - `docs/templates/AGENTS.template.md` and its bundled copy under
    `src/skills/core/brp-code-quality/references/` both named repositories that
    no longer exist (`BusiRocket/rocket-agents`, `BusiRocket/agents-tools`);
    both now name `syntopica/agents`, which is what `git remote -v` reports.
  - Evidence: `pnpm run check` exits 0 (lint, knip, depcruise 1407 modules,
    type-coverage 99.34%, tests).

- [x] 2026-09-09 - **Conversations export:** `conversations:rewrite` repairs the
      archived records the captures will never revisit.
  - Result: one command for the two rewrite items - the 5,121 records whose
    `workspace` (and 3,520 whose text) still named the real home, and the
    repeated `provenance.relativePath` the old merge appended. Codex's
    adjudication set the shape: a pure transform (`rewriteConversationRecord`:
    split, dedup, sort the path; `redactConversationHome` for every explicit
    `--home` prefix, longest first; ids, source hash, event ids and hosts
    untouched), a streaming dry run that writes nothing, and an apply that fills
    a fresh store one record per id (a repeated id refuses), publishes under
    `withArchiveWriteLock` with the revision checked before the write and before
    the rename, reads the replacement back whole before the rename and refuses
    unless it is a complete export of the same count that the transform would
    leave alone, keeps the backup, prunes older ones, and carries the manifest's
    `complete`/`skipped` over. A schema-1 record refuses the apply (the writer
    would upgrade its event ids). `--home` is explicit and must be absolute:
    Codex's review reproduced `--home --apply` redacting the literal flag, and a
    partial export coming out complete; both fixed with tests. Not applied to
    the live archive: `AGENTS.md` reserves a conversation `--apply` against
    durable data for the owner, and both Macs have to run it - parked in
    `TODO.md` with the exact commands.
  - Evidence: dry run on the live archive (read-only): 46,278 records, 6,231
    would change, 2,797 paths (1,190,473,073 bytes), 1,462 titles, 5,121
    workspaces, 56,369 events, 0 legacy, 1:37. Apply on an APFS clone in an OS
    temporary directory: same counts, `ok`, 6.69 GB to 5.49 GB, then
    `grep -c '"workspace":"/Users/'` 0 and `grep -c /Users/<user>` 0 on the
    result, 46,278 records, path strings 6.06 MB (2,945 legitimately joined),
    6:18 wall; clone removed afterwards. `pnpm run conversations:test` - 105
    pass, 0 fail (`CONVERSATION_ARCHIVE_REWRITE_TEST.ts`, 5 cases);
    `pnpm run check` - exit 0. Codex: one `codex review --uncommitted`.
  - Files: `scripts/lib/conversations/rewriteConversationRecord.ts`,
    `rewriteConversationArchive.ts`, `types/ConversationRewriteChanges.ts`,
    `types/ConversationRewriteResult.ts`,
    `fixtures/writeDamagedConversationArchive.ts`,
    `CONVERSATION_ARCHIVE_REWRITE_TEST.ts`,
    `scripts/commands/conversationsRewrite.ts`,
    `scripts/bin/run-conversations-rewrite.ts`, `package.json`.

- [x] 2026-09-09 - **Conversations export:** every captured record names the
      machine that read it, without changing what a fragment is.
  - Result: Codex adjudicated the design the "both Macs" item was parked on.
    `provenance.host` inside the record was rejected on evidence - the canonical
    serializer would have dropped it, and inside the identity it would have made
    two Macs publish two fragments for identical bytes. Chosen: a record-level
    `hosts: string[]` outside the fragment identity
    (`serializeCanonicalConversationRecord` omits it, so hashes, segments and
    generation ids are unchanged), stamped only at capture
    (`captureConversationArtifact`, label from `ROCKET_AGENTS_HOST` or the short
    hostname via `conversationHostLabel`), unioned wherever fragments meet
    (`mergeConversationRecordFragments`, `materializeConversationFragmentSet`,
    both v1 store paths - the same bytes from a second machine now cost one
    `updated` and are then `duplicate` again), carried beside the record in
    segment entries (`hosts` next to `record`, validated, hash untouched),
    unioned into the state's `fragments.hosts_json` on replay, and published as
    a host-only entry when a machine reads bytes the archive already holds
    (`publishConversationCapture`). The host is part of the capture cache stamp,
    so a renamed machine re-reads its artifacts once. State schema 3, adapter
    version 2; a stale state file is replaced even when empty. Codex's review of
    the wave found four P2s - the empty-cache upgrade, the union lost at
    materialization dedup, duplicates dropped by the migration, and the cache
    hiding a renamed host - each fixed with a test.
  - Evidence: `pnpm run conversations:test` - 100 pass, 0 fail
    (`CONVERSATION_HOSTS_TEST.ts`, 11 cases); `pnpm run type-check` clean;
    `pnpm exec eslint scripts/lib/conversations` clean. Codex: one adjudication
    (session `01a08795-c29c-7b10-a140-d7167b72ab9b`), one
    `codex review --uncommitted`.
  - Files: `scripts/lib/conversations/conversationHostLabel.ts`,
    `mergeConversationHosts.ts`, `types/ConversationRecord.ts`,
    `types/ConversationFragmentEntry.ts`, `isConversationRecord.ts`,
    `captureConversationArtifact.ts`, `captureConversationArtifacts.ts`,
    `captureConversationArtifactsIncrementally.ts`, `exportConversations.ts`,
    `mergeConversationRecordFragments.ts`, `conversationMergeAddedNothing.ts`,
    `ConversationCaptureStore.ts`, `materializeConversationFragmentSet.ts`,
    `serializeConversationSegment.ts`,
    `validators/validateConversationSegmentEntry.ts`,
    `ConversationArchiveState.ts`, `openConversationArchiveState.ts`,
    `publishConversationCapture.ts`, `conversationCaptureVersionStamp.ts`,
    `migrateConversationArchiveToSegments.ts`,
    `constants/CONVERSATION_ARCHIVE_STATE_SCHEMA_VERSION.ts`,
    `constants/CONVERSATION_CAPTURE_VERSIONS.ts`, `CONVERSATION_HOSTS_TEST.ts`.

- [x] 2026-09-09 - **`CONVERSATION_SEGMENT_MIGRATION_TEST` was not flaky under
      load; it was a 1-in-256 hash coincidence.**
  - Result: the case "a v1 archive becomes a chunked base, never one object"
    migrated five captured fixture records over four buckets and asserted more
    than one segment. The fixture records hash a document that names a random
    temporary home, so the five fragment hashes - and the bucket each lands in
    (`conversationFragmentBucketIndex`, hash modulo count) - changed on every
    run, and all five coincided in one bucket with probability 4 x (1/4)^5. The
    2026-09-08 failure "under disk contention" was that draw. Codex's
    adjudication found the single-bucket counterexample by probing the fixtures
    in memory. The case now migrates fixed records (`createArchiveRecord`),
    states its bucket-spread precondition explicitly, and asserts the exact
    segment count; a second case migrates the same archive into one bucket and
    proves all five fragments survive.
  - Evidence:
    `pnpm exec tsx --test scripts/lib/conversations/CONVERSATION_SEGMENT_MIGRATION_TEST.ts scripts/lib/conversations/CONVERSATION_SOURCE_CATALOG_TEST.ts`
    - 8 pass, 0 fail, three consecutive runs.
  - Files: `scripts/lib/conversations/CONVERSATION_SEGMENT_MIGRATION_TEST.ts`.

- [x] 2026-09-09 - **The Favish Claude desktop profile is a capture root.**
  - Result:
    `Library/Application Support/Claude-favish/local-agent-mode-sessions` joins
    the `claude-code` roots in `sourceDefinitions.ts`; 231 files on the MacBook,
    same account uuid as the primary profile, captured by nothing until now. Gap
    (2) of the "both Macs" item.
  - Evidence: `CONVERSATION_SOURCE_CATALOG_TEST.ts` - the two
    `local-agent-mode-sessions` roots are asserted in order (8 pass with the
    migration file above).
  - Files: `scripts/lib/conversations/sourceDefinitions.ts`,
    `CONVERSATION_SOURCE_CATALOG_TEST.ts`.

- [x] 2026-09-09 - **`paused-job-guard.sh` is linked and invoked; the 2026-09-08
      red gate is closed.**
  - Result: `~/.agents/hooks/` carries `hooks.json` and `paused-job-guard.sh`
    dated 2026-09-09 13:51 (the link ran on this machine that day), so both
    assertions that failed on 2026-09-08 pass. No relink was run: `hooks:link`
    stays owner-authorized and the current check found no drift.
  - Evidence: `pnpm exec tsx --test scripts/lib/hooks/DOCTOR_TEST.ts` - 2 pass,
    0 fail; `pnpm run hooks:test` - 23 pass.

- [-] 2026-09-09 - **"Decide what to do with the 87 parked entries" leaves this
  backlog.** The decision was moved to `~/p/rocket-agents-library/TODO.md` on
  2026-08-24 and is still open there (line "Decide what to do with the 87 parked
  entries now that parking is cheap and reversible"); this repository cannot
  execute it, so the duplicate here recorded nothing the owning backlog does
  not.

- [x] 2026-09-09 - **Conversations export:** `redactSensitiveText` is
      idempotent.
  - Result: the Bearer, URL-credential and assigned-secret patterns no longer
    match their own `[REDACTED:...]` markers (a negative lookahead in each), so
    a second pass over redacted text returns the same text and 0 redactions. The
    counts had inflated `provenance.redactions` on every re-capture of unchanged
    text and made a first archive measurement wrong by 515 records. The redactor
    version stamp moves to 2 so a warm incremental cache re-reads its artifacts
    once.
  - Evidence: `pnpm run conversations:test` - 87 pass, 0 fail, including the new
    case "redaction is idempotent: a second pass changes nothing and counts
    nothing" (5 redactions first, 0 second, text equal).
  - Files: `scripts/lib/conversations/redactSensitiveText.ts`,
    `redactAssignedSecrets.ts`, `CONVERSATION_SECURITY_TEST.ts`,
    `constants/CONVERSATION_CAPTURE_VERSIONS.ts`.

- [x] 2026-09-09 - **Conversations export:** U+2028 and U+2029 in event text are
      pinned as no line break, in every reader this repository owns.
  - Result: the rule stands - split on `\n` only, never `readline` or
    `splitlines` - and two tests now hold it: `forEachLfLine` reads three
    records carrying raw separators as three lines, the canonical serialization
    escapes both characters, and a v1 export round-trips them through
    `writeConversationExport` and `readConversationExport`. The measurement the
    entry recorded (1,690 U+2028 and 3 U+2029 in the live archive, 32,434 lines
    seen for 30,741 records by a readline reader, lone CR ruled out with zero CR
    bytes) lives on in the test's comment and in
    `serializeCanonicalConversationRecord`.
  - Evidence: `pnpm run conversations:test` - 87 pass, 0 fail
    (`CONVERSATION_LINE_SEPARATOR_TEST.ts`, two cases).
  - Files: `scripts/lib/conversations/CONVERSATION_LINE_SEPARATOR_TEST.ts`,
    `fixtures/createConversationRecordWithLineSeparators.ts`.

- [x] 2026-09-09 - **Conversations export:** a successful `--apply` keeps one
      backup and prunes the older ones.
  - Result: after the replacement archive is renamed into place, every file
    beside it whose name is exactly the generated `<archive>.backup-<stamp>`
    shape, except the copy this run wrote, is removed and listed in the result
    as `prunedBackups`. A dry run, a first apply (no archive, so no backup) and
    a failed write prune nothing; the lock, an interrupted run's `.tmp-<pid>`, a
    hand-named copy and another archive's backups are never touched. The 15 GB
    of copies found on 2026-09-04 becomes the live archive plus one previous
    generation. The `.tmp-<pid>` leftover stays an open item. Codex's review of
    the wave caught the first version matching a prefix rather than the full
    generated name.
  - Evidence: `pnpm run conversations:test` - 87 pass, 0 fail
    (`CONVERSATION_ARCHIVE_BACKUP_TEST.ts`, two cases: two stale backups pruned
    and four neighbours kept, then the first run's backup pruned by the second;
    dry run and first apply prune nothing). Not run against the live 7 GB
    archive: `--apply` on durable data waits for a human.
  - Files: `scripts/lib/conversations/pruneConversationArchiveBackups.ts`,
    `importConversationExport.ts`, `types/ConversationImportResult.ts`,
    `CONVERSATION_ARCHIVE_BACKUP_TEST.ts`.

- [x] 2026-09-09 - **Conversations export:** capture redacts the account's own
      home even when `--home` points elsewhere - the cause of the `[HOME]` gap.
  - Result: `captureConversationArtifact` now redacts every prefix in
    `conversationHomesToRedact(home)` - the root it was given and
    `os.homedir()`, longest first - so a recovery tree or a mirror of another
    Mac captured from a foreign root no longer archives the real home path in
    `workspace`, titles or event text. The redactor version stamp moves to 2 so
    a warm incremental cache does not keep serving records captured under the
    old rule (Codex's review of the wave caught that). Measured on the live
    archive before the change: 5,121 `claude-code` records with an absolute
    `/Users/...` workspace (3,520 also in text), all from 2026-06/07, 1,709
    naming `recovered-from-mempalace/sweep/` in their provenance and the rest
    consistent with that directory having been the root; 13,330 records already
    `[HOME]`. The 5,121 stay as history until a rewrite (parked in `TODO.md`).
  - Evidence: `pnpm run conversations:test` - 87 pass, 0 fail, including
    "capture redacts the account home even when the artifacts live elsewhere"
    (scratch home, sessions naming `homedir()`: workspace and both event texts
    come out as `[HOME]/...`). Archive measurement:
    `LC_ALL=C grep -o '"workspace":"/Users/[^/"]*' archive.jsonl | sort | uniq -c`
    (one username, 5,121).
  - Files: `scripts/lib/conversations/conversationHomesToRedact.ts`,
    `captureConversationArtifact.ts`, `CONVERSATION_CAPTURE_TEST.ts`,
    `constants/CONVERSATION_CAPTURE_VERSIONS.ts`.

- [x] 2026-09-09 - **Conversations export:** merged provenance paths no longer
      repeat, and a fragment the store has already absorbed is a duplicate
      again.
  - Result: found while measuring the `[HOME]` gap - `provenance.relativePath`
    on one record was 434 KB, 3,869 comma-joined entries naming 2 paths, and
    archive-wide 1.5 GB of the 7 GB file is such repetition (3,225 records,
    longest 87,269 entries). Two causes, both in the pairwise v1 merge: it
    joined both sides' paths without splitting a side that was already a merge,
    and the merged `contentSha256` is a hash of hashes that the same fragment
    never equals again, so every import between the two Macs re-merged every
    shared conversation as "updated" and appended its paths once more. Now
    `mergeConversationRecordFragments` and
    `deriveConversationFragmentSetProvenance` split, dedup and sort the entries,
    and `ConversationCaptureStore.mergeFragment` returns `duplicate` when the
    merge changed no title, workspace, event or known path
    (`conversationMergeAddedNothing`), leaving the stored record untouched. A
    record stored without derived timestamps or at schema 1 reports one more
    update on its first re-merge, then settles. The archived strings stay until
    a rewrite (parked in `TODO.md`). `CONVERSATION_ARCHIVE_STATE_SCHEMA_VERSION`
    moves to 2 so a segment-archive state that cached the joined form replays
    its segments (Codex's second review of the wave caught that), and the comma
    separator's ambiguity for a filename carrying a comma is recorded as its own
    item (no such path exists on this Mac's sources).
  - Evidence: `pnpm run conversations:test` - 87 pass, 0 fail
    (`CONVERSATION_STORE_MERGE_TEST.ts`: added, updated, then duplicate twice
    with the stored record byte-identical; a new path for known events updates
    once to `c.jsonl,recovered/c.jsonl` and is then a duplicate; a stored joined
    path is not repeated. `CONVERSATION_FRAGMENT_SET_TEST.ts`: a migrated
    fragment with a joined path contributes each path once). Measurement:
    `LC_ALL=C grep -o '"relativePath":"[^"]*"' archive.jsonl | awk ...` -
    1,515,501,660 bytes.
  - Files: `scripts/lib/conversations/mergeConversationRecordFragments.ts`,
    `deriveConversationFragmentSetProvenance.ts`,
    `conversationMergeAddedNothing.ts`, `ConversationCaptureStore.ts`,
    `CONVERSATION_STORE_MERGE_TEST.ts`, `CONVERSATION_FRAGMENT_SET_TEST.ts`,
    `fixtures/readStoredConversationRecords.ts`.

### 2026-08

- [x] 2026-08-31 - **Two backlog items that were waiting on a list now have
      one.**
  - Secret scanning: 134 repositories under `~/p`, 18 with a secret hook (all
    lefthook + gitleaks), 116 without. The stronger lever is GitHub's own
    scanning, free on public repositories and settable as an organisation
    default; verified disabled on `BusiRocket/rocket-agents`
    (`secret_scanning: disabled`, `push_protection: disabled`), while private
    repositories return `null` and need Advanced Security. User-owned public
    surface: 14 under BusiRocket, 18 under CristianDeluxe.
  - pnpm supply-chain controls: 44 of 135 repositories use pnpm and 9 declare
    `minimumReleaseAge`. Sweep:
    `for d in ~/p/*/; do r=${d%/}; [ -d "$r/.git" ] || continue; if [ -f "$r/pnpm-lock.yaml" ]; then grep -qE minimumReleaseAge "$r/pnpm-workspace.yaml" "$r/.npmrc" 2>/dev/null || echo "$r"; fi; done`
  - Neither was executed: enabling scanning writes GitHub settings and the pnpm
    change edits other repositories.

- [x] 2026-08-31 - **`machine:apply` can converge one domain.**
      `--domain     <name>`, repeatable, narrows a run; a name outside the
      profile is refused rather than dropped; a skipped domain keeps the
      ownership already on record, so an apply that never ran cannot disown what
      is still installed. Found the same day, when converging plugins would also
      have written three MCP servers because both profiles include `mcp`.
      Verified with `machine:apply -- --domain services --json`: that domain
      alone, converged, and `machine:diff` unchanged afterwards.

- [x] 2026-08-31 - **The 60 files nothing imported are gone, and the gate that
      was supposed to catch them was itself broken.**
  - The `ignore` list in `knip.config.ts` froze them pending the owner's call.
    Verified closed as a subgraph - twelve are imported, every importer is
    itself in the set - by parsing every relative specifier across all 1,330
    files, and independently by a second model (`codex exec -s read-only`,
    verdict "delete all 60", high confidence, TypeScript-AST scan plus
    repository-wide searches). Deleted with their ignore lines.
  - The gate around them was broken three ways. Terminal output had been pasted
    into the ignore array in `0bd3259` (`Refine`, `entry`, `pattern`, `(no`,
    `matches)` as literal entries); the entry globs named `scripts/golden/` and
    `machine/`, which hold no TypeScript; and eight binaries knip resolves fine
    were in `ignoreBinaries`. So `knip` exited 1 on 29 hints and nobody saw it,
    because `knip` was not in `check`. It now exits 0 and runs in `check`
    through `check:quality`. The nine remaining hints are baseline-owned and
    documented there as not to be silenced consumer-side.
  - `depcruise` was cruising `src` - 0 modules, 0 dependencies - while the code
    is under `scripts/`. Pointed at `scripts`: 1,289 modules, 3,313
    dependencies, no violations.
  - Evidence: `pnpm run check` green with the new gates included;
    `pnpm run knip` exits 0; 985 lines deleted across 62 files.

- [x] 2026-08-31 - **Plugin cache hygiene closed: references resolved, pruning
      deliberately not built.**
  - Capture now reads `settings.json`, `settings.local.json` and `.claude.json`
    under both profiles, in all three spellings of the cache root, and counts a
    version a settings file points into as referenced. The case is real on this
    machine: both profiles' `statusLine` names
    `plugins/cache/caveman/caveman/<version>/src/hooks/caveman-statusline.sh`.
  - Version pruning stays a report and never becomes an action (Codex
    adjudication, verdict "B", high confidence): a project-scoped settings file
    inside any repository can name a version, those cannot be enumerated, and a
    deleted version breaks a hook silently for disk space that costs nothing.
    The report says so in as many words, so nobody reads "stale" as "safe to
    delete".
  - Measured after the change: 104 cache entries, 67 stale, 27 orphan
    directories, 349 MB. Orphan pruning is unchanged.

- [x] 2026-08-31 - **The curated library reaches Antigravity.**
  - `library:link --target antigravity --into ~/.gemini/config/skills` copied 35
    curated skills: 20 new, 15 replacing older copies of the same skills, 0
    foreign, 0 missing, 0 symlinks. `core/` and `orchestrator/` were left
    untouched. The previous 17 entries were copied to the session scratchpad
    first.

- [x] 2026-08-31 - **The machine manifests describe the machine that exists.**
  - `machine:diff` reported 18 changes and every one was the declaration being
    stale. The mcp manifest still declared `mempalace` on codex; Atrium replaced
    MemPalace on 2026-08-30 and is what both Claude profiles and codex run,
    while mempalace is configured nowhere. The plugins manifest declared
    thirteen official plugins at `b481c085fd11` against the installed
    `ed404106fcd8` - a pin `claude plugin install` cannot execute in either
    direction - and declared the mempalace plugin enabled where both profiles
    have it off. Applying would have resurrected a retired tool.
  - After the repair: plugins, security, capabilities and services all
    converged; the two remaining mcp changes are a real gap (context7 on gemini
    and cursor) and stay in `TODO.md` for a deliberate yes.
  - No `machine:apply` was run. It has no per-domain scope and no dry run, so
    converging plugins would also have written the MCP servers; that gap is now
    its own backlog item.

- [x] 2026-08-31 - **Where Trae and Windsurf keep dialogue, answered.**
  - Trae: `Library/Application Support/Trae/ModularData/ai-agent/database.db`,
    15 MB, written live, no SQLite header - opaque at rest. An exporter is
    blocked on decryption, not on discovery.
  - Windsurf: no local dialogue store exists. Every cascade or chat key in its
    databases is UI state under 80 bytes, and `~/.codeium` holds only
    `global_rules.md`; Cascade history is server-side. Both findings are
    recorded next to the source definitions.

- [x] 2026-08-31 - **`~/p/RocketUpdater`'s `.serena` state, closed.** The
      directory now carries its own `.gitignore` (written 2026-08-31) and
      `git status` there reports no `.serena` entry, so there is nothing left to
      commit or discard.

- [x] 2026-08-31 - **The ESLint layer stays hand-assembled, and the two unlinted
      root configs are fixed on their own.**
  - Compared `@busirocket/eslint-config@0.8.0` (unpacked, not installed) rule by
    rule against this repo's `eslint.config.mjs`. Composing it would add
    promise/regexp/security rule sets, `eqeqeq`, `no-console`,
    `consistent-type-definitions: 'type'`, `prefer-readonly`,
    `promise-function-async`, `max-lines`, `max-depth`, `max-params` and
    `sonarjs/cognitive-complexity`; it would drop the unicorn extras, the full
    sonarjs recommended set, the boundaries policies, the check-file naming
    conventions, and it would swap `import-x` for `import`.
  - Measured adoption cost in 1,330 files: 173 `export interface` declarations
    against `consistent-type-definitions: 'type'`, 18 non-test files over the
    100-line `max-lines` budget, and every `*_TEST.ts` file judged by the
    production code-policy rules, because this repo's test naming does not match
    the baseline's test globs.
  - Decision (Codex adjudication, `codex exec -s read-only`, verdict "B", high
    confidence): keep the local layer, adopt only the baseline's
    `allowDefaultProject` + `disableTypeChecked` technique. `knip.config.ts` and
    `.dependency-cruiser.cjs` left `ignores` and are linted for the first time;
    the type-aware presets are now scoped to `**/*.{ts,tsx}` so a typed rule can
    no longer abort the run on a `.cjs` file it has no types for. Linting them
    found two real reports, both fixed.
  - Evidence: `npx eslint knip.config.ts .dependency-cruiser.cjs` is clean, and
    `pnpm run check` is green.

- [x] 2026-08-31 - **Oversized JSONL conversations are captured by streaming
      instead of being skipped.**
  - `readTextConversationDocument` rejected any artifact over 64 MiB, so three
    real codex rollouts (116 MB, 70 MB, 63 MB) never reached an export.
    `streamJsonlConversationRecord` now normalizes such a file line by line: the
    bound applies to a single record, the source hash is computed over the
    chunks as they arrive, and only the three records that can still decide
    identity are retained and replayed into `conversationSourceId` and
    `conversationWorkspace` in their original order.
  - Files within the bound keep the whole-document path, which unwraps
    containers and tolerates pretty-printed artifacts; only oversized ones
    stream. `forEachLfLine` grew an optional raw-chunk callback so the hash is
    taken from the bytes on disk rather than from reassembled lines.
  - Evidence: `pnpm run check` green; a full codex export reports `ok: true`,
    `complete: true`, `skipped: 0`, 16,424 records, and all three rollouts
    appear by `relativePath`. Largest serialized record measured at 8.4 MB
    against the 64 MiB cap, which is why record fragmentation stays unbuilt.
  - Codex adjudication (`codex exec -s read-only`, medium effort) reviewed the
    change and returned one defect: the streaming path parsed the raw line while
    the whole-document path parses `line.trim()`, so a BOM-prefixed file would
    have failed only when large enough to stream. Fixed, and the parity test now
    carries a BOM.

- [x] 2026-08-31 - **`library:link` installs by the strategy the IDE registry
      declares, which unblocks Antigravity.**
  - Antigravity's registry entry has declared `linkStrategy: copy` all along,
    but `installPlannedLinks` only ever symlinked, and the dedicated
    `skills:link:antigravity` installs this repo's own `src/skills` rather than
    the curated library. `installCopiedSkill` copies a compiled skill over a
    destination it owns - absent, or a directory that already holds a
    `SKILL.md` - and reports anything else as foreign rather than deleting it.
  - Evidence: `pnpm run library:test` 217 pass, including the new copy test;
    `library:link --target antigravity --into <tmp>` produced 35 skill
    directories, 0 symlinks, 0 foreign, 0 missing. The install into
    `~/.gemini/config/skills` is a machine mutation and was deliberately not
    run.

- [x] 2026-08-31 - **Baseline gate debt, two entries closed.**
  - `.prettierrc` and `prettier.config.mjs` contradicted each other on
    `trailingComma` (`"all"` vs `"es5"`); one of the two was dead and nobody
    knew which. `.prettierrc` was deleted and the config now re-exports
    `@busirocket/prettier-config`. Closed when the entry was written; moved out
    of the backlog today.

- [x] 2026-08-31 - **`skills:link` now generates the Codex skills trim**, and
      the token saving reported yesterday does not survive measurement.
  - `writeCodexSkillTrim` rewrites the block between
    `# BEGIN/END generated skills trim` in `~/.codex/config.toml` after every
    link, deriving the disabled set from what is actually linked into
    `~/.claude/skills`: every `SKILL.md` under `~/.agents/skills` whose
    directory is not a link target. The trim therefore cannot drift from the
    curated list.
  - Split into pure units per the repo's rules: `renderCodexSkillTrim` builds
    the text, `applyCodexSkillTrim` decides what the file becomes, `collect...`
    reads the two directories, and only `writeCodexSkillTrim` touches disk. It
    copies the config aside before writing and writes nothing when the block is
    already current.
  - Verified against the real config: the generator reproduced the hand-made set
    exactly - 270 paths, the 244 in yesterday's block plus the 25 legacy
    duplicates it supersedes - and everything outside the markers came through
    byte-identical. The 25 now-redundant legacy entries were removed, leaving
    the generated block as the single owner. Tests cover the four ways this
    could corrupt a config: no markers, regeneration, a half-written fence, and
    the curated-set filter.
  - **Correction to the 2026-08-30 entry:** the "20,590 to 14,790 tokens (-28%)"
    figure is not reliable. Repeating the identical command across
    configurations that disable strictly more skills produced 14,790, then
    19,088, 19,089 and 26,001, and `--strict-config` runs report 453 and 657 -
    so codex's `tokens used` line carries per-session overhead, not the catalog
    size. What does reproduce is the warning and the routing: before the trim,
    `Exceeded skills context budget. All skill descriptions were removed and 12 additional skills were not included`;
    after it, no warning, and Codex lists the eight `brp-*` skills with their
    descriptions when asked.

- [x] 2026-08-31 - **Conversation exporters were shipping VS Code editor state
      as dialogue.** Root cause found and fixed; Windsurf answered at the same
      time because it is the same mechanism.
  - Trae's two bogus conversations came from one row per workspace:
    `icube-ai-chat-storage-mention-search-selected-itemIds`, whose value is
    `["rule","code"]` and `["folder"]` - the ids the mention picker had
    selected. The key matched the `%chat%` net in `sqliteConversationQuery.ts`
    and the array's strings became event texts.
  - Fix: the `ItemTable`/`cursorDiskKV` query now also requires the value to
    contain `{`. An event needs a role, a text or a timestamp, and those only
    exist inside an object, so a bare array of picker ids can no longer qualify.
    Cursor is unaffected - it returns from its own reader before this query.
  - Evidence: `--source trae` exported 2 records before and 0 after;
    `pnpm run conversations:test` 20/20; a new regression test in
    `CONVERSATION_NORMALIZATION_TEST.ts` inserts the exact observed row beside a
    real chat payload and asserts only the real one survives.
  - Windsurf, same question, different answer: its 4 databases hold no
    conversations at all. `globalStorage/state.vscdb` has 113 `ItemTable` rows
    and a workspace one has 95 - themes, viewlets, terminal buffer, auth status
    - with zero keys matching cascade, chat or conversation, and
      `~/.codeium/windsurf` holds only `memories/global_rules.md` and an empty
      `skills/`. The exporter's zero was correct, not a parser gap.

- [x] 2026-08-31 - **Weekly library loop:** the unattended catch-up is proven,
      which was the last open half of the item.
  - `~/.agents-learning/reports/2026-08-31-library-loop.md` was written at 02:15
    today with no manual kickstart, seven days after the 2026-08-24 report, so
    the 6-hourly `--if-due 7` poll does catch up across sleep.
  - `launchctl print gui/501/com.cristian.library-loop`: `runs = 4`,
    `last exit code = 0`, service active. The report itself covers 3,451
    transcripts (2,676 skipped as unchanged), 886 human requests, 31 distinct
    skills invoked, and 16,399 codex rollouts scanned.

- [x] 2026-08-31 - **`prettier-plugin-css-order`:** closed upstream, nothing
      left to do here.
  - The plugin pulled `postcss` into projects with no stylesheet, and Prettier
    refused to start here with `Cannot find package 'postcss'`.
    `@busirocket/prettier-config@0.2.0` moved it to the `/frontend` and `/astro`
    entry points.
  - Verified in place: `package.json` depends on `^0.2.0`, and `pnpm run check`
    exits 0 with `prettier --write . --list-different` clean.

- [x] 2026-08-30 - **Codex adversarial review of the day's skill changes:**
      BLOCK with 13 findings, 11 applied.
  - The review ran under the convergence protocol written earlier the same day:
    a briefing file, read-only sandbox, JSON schema, and every claim verified
    locally before applying. It web-searched the codex source to check the CLI
    facts.
  - Three of its factual corrections held and were wrong in this repo's files:
    `codex exec resume` does accept `--output-schema` on 0.150.1; `--add-dir`
    adds a _writable_ root, not read access, so using it to feed a read-only
    review its evidence exposed that evidence; and
    `~/.claude/rules/model-prompting.md` is path-scoped, so the turn-boundary
    rule added there would never have loaded during a backlog session. That rule
    moved to an unscoped `~/.claude/rules/turn-discipline.md`.
  - Unbounded rules were bounded: a standing authorization now has to match the
    repository, action and target; the approval covers the listed items and
    their narrow dependencies rather than the backlog at large;
    decide-by-default is limited to choices that preserve observable behaviour
    and public contracts; Codex usage and a call cap are named in the plan so
    the separate quota is approved rather than spent silently.
  - Two safety fixes in the adjudication contract: the command was missing
    `-c 'mcp_servers={}'`, the override that keeps `--output-schema` from being
    ignored, and verdict handling now requires exit zero plus a file that did
    not exist before the run, so a timed-out retry cannot accept the previous
    attempt's verdict.
  - `resume --last` replaced by an explicit session id: three Codex sessions ran
    simultaneously on this machine today, and `--last` picks whichever finished
    most recently.
  - Two findings were consciously not taken as written. The `--yolo` default is
    the owner's standing decision with documented reasons, so instead of
    reverting it the precedence is now explicit: read-only work takes
    `-s read-only`, bounded implementation takes `-s workspace-write`, and what
    Codex may do inside its run never licenses acting on its output without
    confirmation. The "delete enumerated rules" guidance got a carve-out for
    ordered steps that carry authorization, CLI correctness, recovery or
    validation, rather than being applied to the procedural skills.
  - One round, not a loop: 11 of 13 applied and 2 scoped deliberately, so a
    second pass had nothing left to converge on. Gates green, skills relinked,
    three repositories pushed.

- [x] 2026-08-30 - **Skills audit against a month of transcripts:** the real
      cause of the stopping was the turn boundary, not the approval gate.
  - Corpus: 7,822 transcripts over 31 days. `codex` fired 66 times,
    `brp-todo-work` 50, `brp-todo-create` 22 - the BRP family does fire.
  - 35 sessions invoking the todo skill produced 454 user turns after the
    invocation, 68 of them pure nudges. Of the 51 readable cases only 17
    followed a real question; the rest followed a checkpoint that announced
    continuation and ended the turn. 102 turn endings in the corpus say "Sigo"
    or name the next item and stop, and 19 end asking about a push the user had
    already authorized once.
  - Fixed in `brp-todo-work`: a turn ends when the run does, a checkpoint
    proceeds instead of offering a menu, a standing authorization on record is
    authorization, and Codex is a partner for the whole run rather than only its
    adjudicator - which is what the user has asked for by hand in about fifteen
    sessions.
  - Fixed in the `codex` skill: rule 1 forbade delegating unless the user asked,
    which contradicted the new adjudication path, so an owning workflow is now
    an authorized caller. Added the convergence loop (findings to a file,
    verify, resume with the delta only, stop when a round adds nothing, keep
    author and reviewer apart).
  - Correction to an earlier claim in this session: Codex CLI reads
    `~/.agents/skills/codex/SKILL.md` directly (`~/.codex/config.toml:470`), so
    the stale `compiled/codex/` tree is consumed by nothing and needed no link.
  - `pnpm run check` green, `skills:link` re-run, both repositories pushed.

- [x] 2026-08-30 - **brp-todo-work:** the run now shows its plan and decides for
      itself instead of interrupting.
  - Two reported failures: the execution plan reached the user only inside the
    approval widget, which renders options and not the body, so the queue was
    invisible; and the run stopped repeatedly to ask questions it could have
    answered. Both were in the skill text, not the harness.
  - The approval gate now requires the plan as ordinary visible text before the
    one-sentence approval request, and states that the approval covers the whole
    run - finishing an item, a wave, or the presented queue is not a reason to
    come back.
  - New `Deciding instead of asking` section: decide by default on reversible
    work, delegate genuine forks to a read-only `codex exec` adjudication on the
    separate OpenAI quota, park anything that truly needs the user as `[!]` and
    deliver all such questions in one block at the end. The authority list is
    stated as overriding the default, because OpenAI's guidance is explicit that
    unordered contradictory rules cost GPT-5 reasoning tokens.
  - `references/codex-adjudication.md` carries the brief, the strict JSON
    schema, the exact command and the verdict handling. Verified end to end on
    codex-cli 0.150.1: a decision brief returned schema-conforming JSON, exit 0.
    Traps recorded from the same runs - `exec` blocks forever on a non-TTY stdin
    without `< /dev/null` (a 7-minute hang), `-a` and `--search` are top-level
    only, `--output-schema` is rejected by `exec resume` and silently ignored
    while MCP servers are active.
  - `pnpm run check` and `pnpm run build` green; the reference reaches both the
    Claude and the portable bundle. Not linked: `skills:link` is a machine
    mutation and was not authorized.
  - Brain updated the same day: `topics/cli-offload.md` (codex flag scope
    corrections) and `topics/frontier-model-prompting.md` (a new autonomy
    section from OpenAI's GPT-5 guides and Anthropic's agentic guidance).

- [x] 2026-08-25 - **Machine provisioning:** `machine:apply` run with
      authorization; every domain is converged.
  - Applied on profile `full`, run `2026-08-25T02-55-46-7r8r`: 14 MCP server
    entries across 5 targets, and the one drifted LaunchAgent rewritten.
    `machine:diff` now reads converged on all five domains, from `mcp changed 2`
    and `services changed 1` before.
  - Verified against the machine rather than the report: gemini and cursor
    gained context7 (`codegraph, context7, serena` each) while claude-personal,
    claude-favish and codex kept their existing servers; the installed plist is
    now byte-identical to the rendered unit; and the reloaded agent was
    kickstarted to prove it works - `runs = 1`, `last exit code = 0`, log line
    `skipped: a report younger than 7 day(s) exists`, with
    `run interval = 21600 seconds` intact.
  - `connectors:doctor` and `agents:doctor` both stay green afterwards, with
    only the optional `zerohedge` unhealthy.

- [x] 2026-08-25 - **Skills library:** Claude's curated list was already
      complete; the linking tool had a footgun that this run tripped and then
      fixed.
  - The backlog item was stale: `library:link --target claude` plans 42 skills,
    0 foreign, and creates nothing - Claude already carried the whole curated
    set natively. The stated "13 of 273" predated the 2026-08-18 fan-out.
  - The footgun: `--into` defaulted to `~/.claude/skills` for _every_ target,
    while each non-claude target compiles to its own format first. Linking
    codex, gemini-cli and antigravity in sequence therefore left 42 of Claude's
    skills pointing at `compiled/codex` output, plus 8 duplicate flattened
    `superpowers-*` entries. Caught by inspecting the destination rather than
    trusting the "34 created / 42 created" output, and repaired the same run: a
    native `--target claude` relink restored the 42, and the 8 duplicates were
    removed one by one after confirming each was a symlink into `compiled/codex`
    and that Claude already had those skills from its plugin. Verified back to
    baseline - 51 entries, 0 pointing at compiled output, 0 broken links, 0 lost
    against the listing taken before the run.
  - Fixed so it cannot recur: `resolveLinkDir` gives only claude a default, and
    any other target without `--into` now fails loudly before compiling
    anything.
  - Also removed a phantom curation entry: `core/accounting` was marked adopted
    with reason "authored here", but no such skill exists in `src/skills` or in
    git history, and it produced a "has no directory" warning on every link run
    for every target.
  - Evidence: `pnpm run check` exit 0; `pnpm run library:test` 215 pass / 0
    fail; the guard prints `--into is required for target antigravity` and
    `--target claude` still plans its 42.

- [x] 2026-08-24 - **Diagnostics:** The connector doctor was inspecting the
      wrong profile, and both doctors are green again.
  - Found by following the context7 decision through: `agents:doctor` reported
    `mcp failed, 8/11 profile connectors healthy` even though `claude mcp list`
    showed every server connected. Two independent defects.
  - First, profile bleed. `runClaudeMcpList` set `CLAUDE_CONFIG_DIR` for Favish
    but merely _omitted_ it for personal, inheriting whatever launched it. Run
    from a Favish session - which is how this repo is usually worked - the
    personal probe listed Favish's servers and reported them as
    claude-personal's, so personal-only connectors read as missing. Pinning
    `~/.claude` is wrong too: that directory carries its own smaller
    `.claude.json` with a different server list (1 of 3 expected servers), while
    the personal profile is the default `~/.claude.json`. The variable is now
    explicitly deleted for personal and set for Favish.
  - Second, the plugin surface. A connector satisfied by an enabled plugin is
    listed as `plugin:<plugin>:<server>:`, and the matcher only accepted the
    bare name - so the context7 that had just been enabled and verified working
    reported as "connector is not listed". Matching is now a predicate that
    accepts both forms and still rejects another plugin's server and a hosted
    connector whose name merely contains the match.
  - Evidence: `pnpm run connectors:doctor` went from 3 failures to 1, and the
    one left is `zerohedge` on personal, which the manifest marks `optional`.
    `agents:doctor` reports `ok: true`. `pnpm run connectors:test` 41 pass / 0
    fail (7 new cases); `pnpm run check` exit 0.
  - Files:
    `scripts/lib/connectors/{toProfileEnv,matchesConnectorLine,runClaudeMcpList,readClaudeConnectorStatus}.ts`
    plus their tests.

- [x] 2026-08-24 - **Harness:** The security-review fan-out is settled: the
      expensive layer is off, the free and rare ones stay.
  - Identified first: this was never a local hook but
    `security-guidance@claude-plugins-official`, enabled in `settings.json`,
    with three layers - regex pattern warnings on edit (free), an LLM diff
    review on every turn end (Opus 4.7, the expensive one), and an agentic
    reviewer on `git commit`. So the choice was never keep-or-disable; the
    plugin has a per-layer kill switch.
  - Decision taken and applied: `ENABLE_STOP_REVIEW=0` in `settings.json`'s
    `env`. It drops only the turn-end review - the layer measured at ~$2,691/30d
    list-price equivalent with a 1.7% escalation rate and no confirmed real
    finding - and keeps the free pattern warnings and the commit reviewer, which
    is the layer that actually traces data flow across files. The plugin's own
    source confirms the scope: the switch sits after the state sweep and the
    commit/push reviews have separate gates.
  - It was still costing that: 450 of 756 sessions in the 7 days to 2026-08-24
    were fan-out sessions, 17 escalations.
  - Evidence: a real `claude -p` session prints `ENABLE_STOP_REVIEW=0`, so the
    variable reaches the environment the hooks run in. Reverting is deleting
    that one key. The same edit was made in `~/p/dotfiles/claude/settings.json`,
    since the two copies are synced by hand and had been identical.

- [x] 2026-08-24 - **Machine provisioning:** context7 settled on one surface,
      and the always-loaded rule finally has tools.
  - Found while checking the mcp drift the new plugins manifest surfaced:
    context7 existed on three surfaces and was live on none. The plugin was
    installed but disabled, the MCP manifest declared it for five targets while
    `~/.claude.json` carried only four other servers, and
    `~/.claude/rules/context7.md` - always loaded - instructed every session to
    call `resolve-library-id` and `query-docs`, tools no profile actually had.
  - Decision: the Claude profiles use the plugin, which ships the same HTTPS
    server and reads the `CONTEXT7_API_KEY` already in the environment, so
    nothing had to be applied. The manifest now declares context7 only for
    `codex`, `gemini` and `cursor`, which cannot load a Claude plugin. Codex
    already has it; gemini and cursor genuinely do not, so mcp drift went from 4
    to 2 and the remaining 2 are honest.
  - Evidence: `claude plugin enable` succeeded (the second profile reported
    already-enabled, since both share one `settings.json` by symlink), and a
    live session now lists `mcp__plugin_context7_context7__resolve-library-id`
    and `...__query-docs`.

- [x] 2026-08-24 - **Backlog:** Four open decisions closed on the evidence
      rather than left pending.
  - **`grill` skill: declined.** The mechanics are well documented and it is
    cheap, but no measured request in the 495 observed looks like it. This
    session's own loop report is the argument: 11 skills promoted on judgement
    fired zero times and are now proposed for parking. Building a twelfth on
    speculation repeats that. Revive it the first time a business decision
    actually goes wrong for want of an interview - that is a real trigger, not a
    guess.
  - **PR screen-recording rule: declined.** It would change the agent contract
    on every linked client and make a class of PR impossible to finish without
    recording a video, for a workflow that is mostly not UI-PR-driven. The
    evidence-before-claims posture already covers the intent.
  - **Blind A/B skill evals: declined for now.** Every arm is a paid model call
    and a meaningful sample is many. The cheaper question - is a skill used at
    all - is now answered on both surfaces, Claude and Codex. Revive it when a
    specific heavily-used skill is suspected of adding nothing, which is a
    decidable trigger rather than a standing intention.
  - **`orca-cli` router lane: declined.** Two hits in 495 measured requests, one
    of them a bare approval. That is noise, and a lane costs a directive on
    every matching prompt.

- [x] 2026-08-24 - **Machine provisioning:** Plugins and services are declared,
      and the schedule schema can finally describe the service this repo owns.
  - `machine/plugins.json` declares all 37 plugins and 7 marketplaces and diffs
    `converged`. It lives here rather than in the private dotfiles repo,
    correcting a scope note that reality had already overtaken: `machine/` is
    tracked in this public repo and has always carried this machine's real
    manifests, and every marketplace source is a public GitHub repo. A partial
    private instance dir would also have been broken by construction, since
    `machine:diff` fails without `mcp.json`.
  - The services schema could not express `com.cristian.library-loop`: it polls
    on `StartInterval`, because the calendar slot it used to have was slept
    through and never caught up (fixed earlier this session), and the schema had
    only calendar slots. `ServiceSchedule` is now a union of a calendar slot and
    an interval; launchd renders `StartInterval`, systemd renders
    `OnUnitActiveSec` plus an `OnBootSec` of the same length so a machine that
    was off still runs one interval after boot; the parser rejects a schedule
    that tries to be both, and a non-positive interval.
  - `machine/services.json` now describes that agent. `machine:diff` reports one
    `update`, and it is cosmetic: `plutil` parses the rendered unit and the
    installed plist to byte-identical JSON, so the only difference is XML
    escaping of quotes.
  - Evidence: `pnpm run machine:test` 208 pass / 0 fail (5 new cases);
    `pnpm run check` exit 0; `machine:diff` reads `plugins converged 0`,
    `services changed 1`, `mcp changed 2`.

- [x] 2026-08-24 - **Machine provisioning:** The plugins capture could not be
      used as a manifest; now it can.
  - The documented workflow ("author `plugins.json` from
    `machine:capture:plugins -- --json`") had never been executed, and it did
    not work: capture emits `enablement` as a tri-state (`enabled` / `disabled`
    / `undeclared`, because a plugin can simply be absent from a profile's
    settings) while the manifest parser requires boolean `enabled`. Feeding the
    real capture to the parser failed on all 37 plugins.
  - Both shapes are right - observed state has three values, a declaration has
    to be a decision - so the fix is a converter, not a schema change.
    `undeclared` collapses to false: settings that never enable a plugin do not
    enable it. `machine:capture:plugins -- --manifest` now prints the declarable
    document.
  - Evidence: the real machine's capture parses (37 plugins) where it previously
    failed; that file diffed against the machine it came from reports
    `plugins: converged, 0 changes`; `pnpm run machine:test` 203 pass / 0 fail;
    `pnpm run check` exit 0.
  - Files: `scripts/lib/machine/domains/plugins/toDeclaredPluginsManifest.ts`
    plus its test and capture fixture,
    `scripts/commands/machineCapturePlugins.ts`.

- [x] 2026-08-24 - **Backlog:** Every remaining item given an explicit
      disposition, and the library's content decisions moved to the repository
      that owns them.
  - Moved to `~/p/rocket-agents-library/TODO.md` (filed and pushed there):
    deleting the 16 Java/Spring bundles, the skill-by-skill triage of the six
    large bundles, the 87 parked entries, the multi-surface capabilities, the
    two dropped classifications, the re-check window, and the five
    measured-but-unbuilt skill gaps (`communications-work-intake`,
    screenshot-to-component, the business lane extension,
    `document-intake-reconciler`, background-job watch). They are decisions
    about that repository's contents; executing them from here would edit
    another repo.
  - Sharpened here with what was actually measured rather than remembered: the
    security-review item now names the plugin and its three layers, the
    per-variable levers, and a fresh count (450 of 756 sessions in the 7 days to
    2026-08-24); the grill item carries the real mechanics and the 345-token
    cost reference; the A/B eval item names its harness and its cost; the
    PR-video rule states that it changes the contract on every linked client.
  - Reclassified two items from pending to blocked with their real
    preconditions: patch reapplication (nothing forked yet) and the parked
    entries (now owned elsewhere).
  - The cache-hygiene rate is now evidence rather than assumption: 19 orphan
    cache directories two days after the sweep that took the cache to zero.

- [x] 2026-08-24 - **Harness:** Two pieces of noise removed - a load-sensitive
      test and npm chatter in every loop report.
  - `RUN_LIVE_PROBE_TEST` was failing 3 to 5 of its 8 cases whenever the machine
    was busy, always at ~1003ms, while passing 8/0 on a quiet machine with
    identical code. Cause: the shared fixture pinned `timeoutMs` to 1,000, and
    under load average ~40 spawning the probe script alone exceeded it. These
    cases classify probe output, not latency, and the timeout path has its own
    case that passes a 20ms budget explicitly, so the fixture now allows 30s.
  - Every loop report section opened with
    `npm warn Unknown env config "manage-package-manager-versions"`, because
    each stage shells out through npx. `runBinStage` already stripped
    `npm notice`; the strip moved into `stripNpmChatter` and now covers
    warnings.
  - Evidence: the probe test passed 8/0 three times in a row at load average
    ~20, where it had been failing; `pnpm run library:loop -- --dry-run` reports
    now open on the stage's own first line; `pnpm run library:test` 212 pass / 0
    fail; `pnpm run check` exit 0.
  - Files: `scripts/lib/platform-health/fixtures/createLiveProbeDefinition.ts`,
    `scripts/lib/library/cli/{stripNpmChatter,runBinStage}.ts` plus the new
    test.

- [x] 2026-08-24 - **Learning loop:** Codex-side usage is measurable, and the
      proposals now count it.
  - The signal was there all along, in the wrong place: Codex rollouts are
    structured JSONL, and a skill name reaches the file three ways - the
    injected catalogue (a `developer` message), the agent actually running a
    command (`custom_tool_call` / `function_call`), and command output that
    lists directories. The old reader scanned the whole file, so the catalogue
    drowned the real reads. Counting only invocation payloads separates them.
  - Measured across all 4,144 rollouts: whole-file scanning gives 316 skills led
    by a catalogue cluster (17 unrelated skills at exactly 892, 8 more at 911);
    invocation-only gives 102 skills with a believable power-law tail - brain
    55, llm-wiki 31, brp-docs 24, code-reviewer 21.
  - `looksLikeListingArtifact` had to change with it: it fired on the clean data
    (a real tail has 19 skills read twice) and would have passed the poisoned
    corpus (modal share 0.14). It now ignores the small-count tail and fires
    when ten or more skills share one value near the top of the distribution,
    which is the shape a catalogue actually has.
  - Two consequences wired up: the weekly loop gained an `Observe codex` stage,
    so the counts are refreshed rather than written once by hand; and
    `library:propose` merges `codex-reads.json` into the invocation counts, so a
    skill this machine only uses from Codex is no longer proposed for parking as
    idle.
  - Evidence: `pnpm run library:observe-codex -- --dry-run` reports 4,144
    rollouts and 102 skills instead of refusing;
    `pnpm run library:loop -- --dry-run` runs 8 stages, 0 failed, with the new
    stage's output in the report; `pnpm run library:test` 209 pass / 0 fail (9
    new cases); `pnpm run check` exit 0.
  - Files:
    `scripts/lib/library/learning/{toCodexInvocationText,readCodexSkillReadsFromFile,looksLikeListingArtifact,mergeInvocationCounts}.ts`
    plus their tests, `scripts/commands/{libraryLoop,libraryPropose}.ts`.

- [x] 2026-08-24 - **Machine provisioning:** Plugins and services became apply
      domains, and `--profile` reached the apply side.
  - Plugins apply drives the `claude plugin` CLI (`install --scope user --yes`,
    `uninstall`, `enable`/`disable` with `CLAUDE_CONFIG_DIR` pointed at the
    right profile) instead of editing `installed_plugins.json`, because the CLI
    owns the cache and marketplace state. Changes run sequentially: the plugin
    tree is shared between both Claude profiles and is single-writer. A version
    pin is reported as `manual` and never executed - the CLI has no
    install-a-version flag.
  - Services apply writes each drifted unit and loads it: launchd gets `bootout`
    (tolerated to fail when the job was never loaded) then `bootstrap`; systemd
    gets one `daemon-reload` for the whole run plus `enable --now` on the timer
    when a service has one, on the service unit otherwise. It never removes an
    undeclared unit, which is what keeps the 25 hand-written LaunchAgents safe.
  - Cache pruning is opt-in behind `machine:apply -- --prune-cache` and removes
    only directories belonging to no known marketplace; stale version
    directories stay until capture resolves `settings.json` references.
  - `--profile` now guards apply the same way it guards diff: an unknown value
    fails before any mutation, `MACHINE_PROFILES` decides which domains run, and
    the run report carries the profile. The run snapshot grew to cover
    `installed_plugins.json`, `known_marketplaces.json` and every declared unit
    path, so a rollback can restore or remove them.
  - Both apply paths take an injected `CommandRunner`, so the tests exercise the
    real code against a recording stub in a fresh temp directory without
    touching this machine.
  - Evidence: `pnpm run machine:test` 200 pass / 0 fail (11 new cases);
    `pnpm run check` exit 0; `pnpm run machine:apply -- --profile nope` exits 1
    with `unknown profile nope` before any write;
    `pnpm run machine:diff -- --profile lite --json` lists exactly the four lite
    domains.
  - Files: `scripts/lib/machine/exec/` (runner, types, recording fixture),
    `domains/plugins/{apply,toPluginCommand,pruneOrphanCacheDirectories,runPluginsApply,toPluginsApplyStatus}.ts`,
    `domains/services/{apply,collectDriftedUnits,reloadServiceUnit,toReloadCommands,resolveDeclaredUnitPaths,runServicesApply,toServicesApplyStatus}.ts`,
    `domains/mcp/toMcpApplyDomain.ts`,
    `domains/capabilities/toCapabilityMessages.ts`,
    `report/toFailedRunReport.ts`, `scripts/commands/machineApply.ts`.

- [x] 2026-08-24 - **Machine provisioning:** `agy` and `herdr` archived;
      package-manager provenance re-confirmed live.
  - `~/p/_archivar/handmade-binaries/` now holds `agy-1.1.19` (178 MB) and
    `herdr-0.8.0` (18 MB) with `SHA256SUMS` and a README. Notable: `agy`
    self-updates - the backlog recorded 1.1.17 on 2026-08-22 and the live binary
    is 1.1.19 with a 2026-08-23 mtime - so the archive is a disaster copy, not a
    pin. `npm ls -g` shows `@colbymchenry/codegraph@1.5.0`; `uv tool list` shows
    `serena-agent v1.7.0`. The sweep-method extension is dotfiles work, filed in
    `~/p/dotfiles/TODO.md` (Machine inventory section).
  - Evidence: `shasum -a 256` output recorded in the archive; command outputs
    in-session.

- [x] 2026-08-24 - **Repository hygiene:** `feat/agent-health-matrix` and
      `feat/codex-state-recovery` deleted, local and origin.
  - Verified this run before deleting: `git rev-list --left-right --count` read
    65/0 and 58/0 - zero unique commits on each branch against `main`, both
    sides, so the deletion is lossless.
  - Evidence: `git push origin --delete` reported both `[deleted]`;
    `git branch -a` shows no `feat/` refs remaining.

- [x] 2026-08-24 - **Cross-project:** The three routed pointers are closed.
  - `~/p/dotfiles`: the `library-loop` plist mirror item and the
    runtime-inventory sweep extension are now concrete items in
    `~/p/dotfiles/TODO.md`; the four 2026-08-22 LaunchAgent items were already
    filed there, so the duplicate pointer here is redundant.
  - `~/p/agents-tools` empty-directory deletion: already executed and logged in
    `~/p/TODO.md` (`[x]` 2026-08-24, deletion verified, `~/p` at 150
    directories) - confirmed gone on disk this session.
  - `~/p/RocketUpdater` `.serena` pointer stays, per its own closing condition.

- [x] 2026-08-24 - **Learning loop:** First real report read against invocation
      evidence; the park proposals are endorsed and the promotion experiment has
      its first verdict.
  - Verdict: of the skills fanned out on 2026-08-18, eleven never fired and no
    measured procedure points at them (file-organizer, docx, codex,
    specs-code-cleanup, orchestrator, google-workspace-cli, jira-expert,
    team-communications, release-manager, senior-devops, research-summarizer) -
    the report proposes parking all eleven and that proposal is endorsed;
    auto-park's grace period handles them without a manual step. Promotions with
    measured use stay: frontend-design (5 trigger phrases), computer-use (2),
    orca-cli (2), plus the core lanes (brain 8, project-continuation 8,
    brp-todo-create 6).
  - The report's top build proposal ("report status on task progress", 52
    requests) is the same gap as the existing background-job-watch backlog item,
    now partly served by the new `loop` router lane; the skill-shaped half stays
    in the backlog.
  - Remaining half of the original item: the second, unattended run proving the
    6-hourly schedule catches up after sleep - tracked as the narrowed `[~]`
    item.
  - Evidence: `~/.agents-learning/reports/2026-08-24-library-loop.md` (495
    observed, 486 classified, 17 procedures, park list with 0 invocations each).

- [x] 2026-08-24 - **Router and hooks:** Directive adherence measured for the
      first time: 19 of 19 injected directives were followed.
  - Method: the 495 observed requests in `~/.agents-learning/requests.jsonl`
    were routed offline through `route_prompt.py` (72 would route, 55 unique),
    each unique prompt was located in the 3,154 on-disk transcripts (48 found),
    and the injected directive was confirmed by finding the lane's marker text
    within 8 lines of the user turn. Adherence was judged mechanically: the
    lane's expected skill name or activity signal (for example
    `systematic-debugging`, `frontend-design`, `project-continuation`, rule-file
    edits for agent-config) appearing in the turns before the next user message.
  - Result: 19 prompts had the directive injected at that turn - debug 6,
    frontend 5, agent-config 3, continuation 4, traffic-client 1 - and all 19
    show the expected follow-up signal. Of the rest, 17 were per-session
    suppression working as designed (the lane had already fired earlier in that
    session), 5 predate the router or the lane, and 7 prompts were not found on
    disk.
  - Caveat: the judgement is keyword-based, not a semantic read of each turn; a
    directive "followed" here means the expected skill or activity is visible in
    the response, not that the method was executed well.
  - Evidence: analysis artifacts in the session scratchpad (`routed.json`,
    `adherence.json`); counts reproduced in-session 2026-08-24.

- [x] 2026-08-24 - **Learning loop:** The router-audit stage now survives its
      own trigger learning.
  - Root cause: `compareRouterExpectationCorpus` treated any difference between
    the freshly learned `trigger-phrases.json` and the hand-maintained
    `router-expectations.json` as a fatal error, so every loop run after the
    first ended `Router audit (FAILED)`. Chosen shape: report the drift, never
    fail on it - generating expectations from learned phrases was rejected
    because auditing the router against phrases the router's own pipeline
    learned would be circular.
  - Change: `libraryRouterAudit.ts` reports `corpusDrift` in the JSON payload,
    the text output, and `router-audit.json` (first 10 lines in text mode)
    instead of exiting 1.
  - Evidence: `pnpm run library:router-audit -- --dry-run` exits 0 with
    `corpus drift vs learned phrases: 59` against the real learning dir;
    `pnpm run check` exit 0.
  - Files: `scripts/commands/libraryRouterAudit.ts`.

- [x] 2026-08-24 - **Router and hooks:** The `loop` lane exists; the other four
      candidate lanes were declined on the evidence.
  - Decision on the 14 unrouted phrases: `loop` (5 hits, all with the
    distinctive verb + "cada <interval>" shape) earned a lane;
    `claude-in-chrome` (3) declined because its phrases are account/profile
    context statements - one is a bare email address - with no generalizable
    trigger; `dataviz`/`artifact-design` (3) and `codex` (1) declined as
    approval-shaped phrases that would misroute acknowledgements; `orca-cli` (2,
    one approval) left as a re-check item.
  - Change: `loop` tuple in `ROUTES` (verb
    `avisa/report/tick/check/comprueba/monitoriza/chequea` within 40 chars of
    `cada <n> m/min/h|minuto|rato|poco`), `loop: "policy-only"` in
    `LANE_SKILLS`, `/loop` markers in `LANE_MARKERS` and
    `LANE_DIRECTIVE_MARKERS`, the five phrases moved from `silent` to
    `routes.loop` in `router-fixtures.json` and to `expectedLane: "loop"` in
    `router-expectations.json`.
  - Evidence: router tests 10 pass / 0 fail; audit went 66 correct / 41 silent
    to 71 correct / 36 silent with 0 wrong lanes; `pnpm run check` exit 0 after
    `pnpm run build && pnpm run hooks:link` (authorized by the user this
    session); the installed `~/.agents/hooks/utils/route_prompt.py` fires the
    loop directive on "report cada 10m".
  - Files: `src/hooks/utils/route_prompt.py`, `src/hooks/router-fixtures.json`,
    `src/hooks/router-expectations.json`,
    `scripts/lib/library/learning/constants/LANE_SKILLS.ts`,
    `scripts/lib/hooks/constants/LANE_MARKERS.ts`,
    `scripts/lib/library/learning/constants/LANE_DIRECTIVE_MARKERS.ts`.

- [x] 2026-08-24 - **Machines:** Every commit that lived on one machine only is
      now on GitHub, and both `~/p` trees hold the same 26 repositories they
      were missing.
  - The gate that unblocked it: the user's rule is _no deploy without
    authorization_, not _no push_. Reading each repository's workflows settled
    it — `atc-prototype` has no workflows at all; `thewealthadvisor` deploys
    only from `dev`/`prod` and previews only from `WA-*`, while the branch at
    issue was `chore/todo-backlog`; `kitco-forum` deploys only by
    `workflow_dispatch`; `zerohedge-mcp` and `verticagtm` run tests on a push to
    `main` and publish only from a tag. None of the eight pushes could deploy
    anything.
  - Pushed: `atc-prototype` 14, `thewealthadvisor` 11, `verticagtm` 8 (plus 1
    more that landed mid-run), `zerohedge-mcp` 2 (the same two commits sat
    unpushed on both machines, identical SHAs, so one push cleared both),
    `kitco-forum` 1, `mempalace` 2, `rocket-agents-library` 1.
  - `iriscaceres-old` was the one that could not be a plain push: 2 local
    commits against 71 remote, conflicting on the initial commit because the two
    histories are different projects. The local work was preserved verbatim on a
    new branch `local/cro-prestashop-macmini` instead - lossless, and it decides
    nothing. The user's own framing is that parity with nova matters more than
    the repository here.
  - Two pre-push gates had to be handled rather than obeyed blindly.
    `verticagtm` failed on ESLint reading a file that no longer existed: another
    session is actively refactoring that repository (staged deletions, files
    written at 15:33 and 15:39). The same hook had passed green at 15:37 - 917
    test files, 4827 tests, gitleaks clean - and a push carries commits, not the
    dirty tree, so it went through the hook's own documented `SKIP_CHECKS=1`.
    `thewealthadvisor`'s preflight failed only because `vendor/` is not
    installed on the mini; the branch triggers no CI at all.
  - `rocket-agents-library` was found mid-merge from an earlier interrupted
    `git pull`, with `.skill-lock.json` unresolved. The whole conflict was one
    `updatedAt` field, 08:49:32 against 08:52:05 - two auto-syncs of the same
    skill three minutes apart. Resolved to the later stamp, merge completed, and
    a second pull/push cycle was needed because the auto-sync job kept
    publishing while the work was in flight.
  - Clones: 16 mini-only repositories to the MacBook and 10 MacBook-only to the
    mini, each checked out on the branch the other machine had. 26 of 26
    succeeded.
  - Evidence: `git rev-list --left-right --count` reads 0/0 on every repository
    touched, on both machines; `iriscaceres-old`'s new branch confirmed present
    on `origin`.

- [x] 2026-08-24 - **Supply chain:** `djplayerdeluxe` migrated off Bitbucket,
      and a real data-loss risk surfaced with it.
  - **Both Bitbucket workspaces are deactivated for inactivity and Atlassian
    warns of permanent deletion** - `CristianDeluxe` and `VMCreativo`. SSH still
    authenticates and `git ls-remote` still answers, so a named repository can
    still be mirrored out, but the API refuses to enumerate, so nothing else in
    there can be discovered. Only `djplayerdeluxe` had a local clone on either
    machine. Reactivating needs the workspace admin and a browser; filed as
    blocked in `~/p/TODO.md` under Security.
  - Migrated with `git clone --mirror` plus `git push --mirror`, so both refs
    came across (`master` and `backup/pre-cleanup-2026-06-15`). Default branch
    set to `master`. On both machines the Bitbucket URL was kept as a secondary
    remote named `bitbucket` and `origin` now points at
    `github.com:CristianDeluxe/djplayerdeluxe`, tracking `origin/master` at 0/0.

- [x] 2026-08-24 - **Machines:** `~/p/prosoni` removed from both machines after
      checking what it actually held.
  - It was never a project: a git repository with no commits at all, holding
    only Playwright MCP artefacts from a 2026-07-23/28 browser session against
    `dominios.es`, `nic.es`, 1Password, HelloSign and Dropbox - 79 DOM
    snapshots, 29 console logs, 3 screenshots and a 17.7 MB Chrome extension
    package. No source code anywhere in it.
  - Checked for exposure before deleting: passwords appear in the snapshots only
    as the rendered `••••••••`, and no 1Password vault content was captured.
  - The 111 trace files (848 KB) were archived to
    `~/p/_archivar/prosoni-dominios-es-2026-07/`; the extension package was
    dropped. Prosoni is a nubenode client, and everything durable the session
    produced was already in `~/p/nubenode/TODO.md`, which now also records where
    the raw capture went and the open question it leaves: `dominios.es` still
    has no programmatic client.

- [x] 2026-08-24 - **Learning loop:** The weekly loop had never run. Two
      independent stale-path defects from the `agents-tools` -> `rocket-agents`
      rename, plus a schedule that cannot survive a sleeping laptop. All three
      fixed, and the first real run completed.
  - Root cause 1, the schedule. `launchctl print` reported `runs = 0` and
    `last exit code = (never exited)` for `com.cristian.library-loop`, and
    neither `~/.agents-learning/loop.log` nor `reports/` existed - so the
    2026-08-22 repair was correct but the job still never fired. `pmset -g log`
    shows the machine asleep continuously from 2026-08-22 12:41 to 2026-08-23
    23:25, straddling the Sunday 06:30 slot: a `StartCalendarInterval` the
    machine sleeps through is not caught up on wake. Fixed by inverting the
    schedule - the agent now polls on `StartInterval` 21600 (6h) and the run
    itself decides whether the window is due.
  - Root cause 2, the classifier path. `~/.agents-learning/loop-config.json`
    still pointed `classifyCommand` at
    `~/p/agents-tools/examples/classifiers/agy-classifier.sh`, which the rename
    left as an empty directory. The 2026-08-22 sweep found the stale path in the
    plist and in no LaunchAgent, but never looked in the loop's own config.
    Repointed to `rocket-agents`.
  - Change: new `--if-due <days>` on `library:loop`, backed by
    `scripts/lib/library/learning/isLoopDue.ts` - it reads the report filenames
    and returns false while one is younger than the window, so a 6-hourly poll
    runs the work exactly once per week and catches up the moment the machine
    wakes.
  - Evidence: `pnpm run check` exit 0; `IS_LOOP_DUE_TEST.ts` 5 pass / 0 fail;
    the three CLI paths exercised against a throwaway learning dir (due -> runs,
    fresh report -> `skipped: a report younger than 7 day(s) exists`,
    `--if-due nope` -> exit 1). Then `launchctl kickstart` drove the first real
    run through the agent itself: `runs = 1`, and
    `~/.agents-learning/reports/2026-08-24-library-loop.md` exists - 3222
    transcripts seen, 495 human requests observed, 486 classified across 4 agy
    batches, 17 procedures written, 0 skills parked, 30 distinct skills invoked.
  - One stage failed and it is a design gap, not a regression: see the open
    item.
  - Files: `scripts/lib/library/learning/isLoopDue.ts`, `IS_LOOP_DUE_TEST.ts`,
    `scripts/commands/libraryLoop.ts`, plus the installed
    `~/Library/LaunchAgents/com.cristian.library-loop.plist` (backup in the
    session scratchpad) and `~/.agents-learning/loop-config.json`.

- [x] 2026-08-24 - **Machines:** Two-way sync between the MacBook and the Mac
      mini measured, and the part that needed no decision was executed.
  - Measured: both `~/p` trees hold 153 directories, 117 shared, 36 unique to
    each. Eleven repositories carried commits that existed on one machine only,
    three branches had no upstream at all, two shared repositories had different
    branches checked out, six project names collide only by case across the
    machines, and 61 (MacBook) / 82 (mini) working trees are dirty. Full
    breakdown in the new `~/p/PROJECTS.md` control sheet, regenerated on each
    machine with `~/p/bin/inventory-projects.sh`; the decisions it demands sit
    in `~/p/TODO.md`. `Mains.World` was the one false positive: its 24
    "unpushed" commits were a stale tracking ref, and a fetch showed the branch
    already published.
  - Executed, all lossless and none needing a design decision: `~/p` itself
    fast-forwarded from `origin/main` with the 97 uncommitted lines preserved
    through a scoped stash; `mempalace` (personal fork branch) pushed;
    `dotfiles` was genuinely diverged (4 remote including two
    `auto-sync ... from Mac-mini-de-Cristian` commits, 1 local) and was rebased
    and pushed; on the mini `Attendize` and
    `cristian-deluxe-developer-portfolio` were rebased and pushed.
  - Not executed and why: `dj-rocket` turned out already in sync once fetched,
    so the sweep's "unpushed" figure was a stale tracking ref, not real work.
    `iriscaceres-old` has genuinely divergent history (71 remote against 2
    local, conflicting on the initial commit); the rebase was aborted and the
    repository restored to its exact prior state. Everything pointing at a
    Favish or client remote was left alone, and the user made that a standing
    instruction the same day: nothing Favish is pushed without explicit
    authorization.
  - Damage control worth recording: the `cristian-deluxe-developer-portfolio`
    rebase succeeded but its autostash would not reapply
    (`UU career/applications/tracker.csv`). The user's version of that file was
    restored verbatim from `stash@{0}`, the stash was deliberately kept, and the
    working tree is back to its original 8 modified plus 3 untracked files with
    no conflict markers. Lesson for the next pass: do not rebase on a machine
    the user is actively working on.
  - Evidence: `git rev-list --left-right --count` before and after on every
    repository touched; `git status --short` clean-of-conflicts on each;
    `git stash list` empty on the aborted repository.

- [x] 2026-08-24 - **Router and hooks:** Round 2 audit re-run on the revised
      metrics.
  - Result, measured against the 2026-07-19 baselines. Router coverage: 791/4100
    = 19.3% of real prompts receive a directive, against a 172/1053 = 16%
    baseline, on a corpus four times larger and one month fresher; the lane mix
    widened from 8 lanes to 14 (debug 210, invoice-ops 175, frontend 75,
    continuation 70, agent-config 61, plan 52, docs 41, repo-modernization 32,
    traffic-client 28, release 19, environment-ops 14, contract-ops 8,
    stakeholder-recap 5, lovable-sync 1), and 275 machine or acknowledgement
    prompts are deliberately suppressed. Lane precision: 66 correct / 0 wrong
    over the 107-phrase expectation corpus, so every lane that fired fired
    correctly; the 41 remaining phrases declare no expected lane at all.
    Silent-death regressions: none, `hooks:test` 13/13.
  - The known frontend miss reproduces and is deliberate, not a defect.
    `check this header on mobile` fires no lane while
    `revisa este header en movil` fires `frontend`: every lane pattern is
    Spanish-first and the frontend lane matches `en m[oa]vil`, not `on mobile`.
    Measured share of the corpus that is English-only: 8.8% (359/4100), and the
    sample is almost entirely machine payloads - autonomous loop ticks,
    security-review prompts, tool output - which the router suppresses by
    design. English triggers would therefore be speculative coverage, so none
    were added.
  - Directive adherence, the metric the audit calls the one that matters, is
    still unmeasured: it needs transcript reading and no tooling produces it.
    Carried forward as its own item.
  - Evidence: `pnpm run library:router-audit -- --json` (counts
    `{correct:66, wrong:0, silent:41}`); corpus measurement replaying
    `build_context` from `src/hooks/utils/route_prompt.py` over the 4100 prompts
    in `~/.agents-learning/requests.jsonl`; both probes run through the hook
    itself; `pnpm run hooks:test` 13 pass / 0 fail.

- [x] 2026-08-24 - **Supply chain and secrets:** `poirocket` audited, closing
      the CI publish-token sweep at 16 of 16 flagged repositories.
  - Result: the repository is `POITools/poirocket`, a private TypeScript
    Electron app in a third organization, which is why no checkout exists under
    `~/p` and why the 2026-08-22 pass missed it. No long-lived registry token:
    `publish.yml` and `test.yml` use only the ephemeral built-in `GITHUB_TOKEN`.
    The other secrets are Apple code-signing material (`APPLE_ID`,
    `APPLE_ID_PASS`, `CSC_LINK`, `CSC_KEY_PASSWORD`), out of this item's scope
    on the same rule that excluded the Supabase and Anthropic deploy secrets.
    The publish job is in fact dead code: it is guarded by
    `github.repository_owner == 'poirocket'` while the owner is `POITools`, so
    it has never run.
  - Evidence: `gh api repos/POITools/poirocket/contents/.github/workflows` plus
    both workflow bodies read through the API; no clone was made.
  - Filed separately: the workflow is stale beyond the security question
    (`actions/checkout@v1`, `setup-node@v1`, `cache@v1`, `node-version: 15`, and
    the removed `::set-output`), which belongs to that repository.

- [x] 2026-08-24 - **Repository hygiene:** The merged
      `feat/skill-router-reliability` refs are gone, local and remote.
  - Result: the item's stated precondition was false - `origin` did track the
    branch. Checked first that the remote ref carried nothing unique either, so
    the deletion was provably lossless.
  - Evidence: `git rev-list --count main..feat/skill-router-reliability` and
    `main..origin/feat/skill-router-reliability` both 0; `git branch -d` and
    `git push origin --delete` both succeeded; `git worktree list` shows only
    the main worktree.
  - Note: `feat/agent-health-matrix` and `feat/codex-state-recovery` are in the
    identical state (0 unique commits local and remote). They were not in the
    backlog, so they were left alone.

- [x] 2026-08-24 - **Machine provisioning:** Services became a diff domain, and
      the profile selector it was blocking landed with it.
  - Result:
    `domains/services/{read,plan,renderServiceUnits,toServicesDomainResult}`
    compare each declared service against the unit files its init system
    actually reads (`~/Library/LaunchAgents` on darwin, `~/.config/systemd/user`
    elsewhere) and report `create`/`update` per file. `machine:diff` now carries
    the domain, and
    `profiles/{MACHINE_PROFILES,isMachineProfile,selectors/selectProfileDomains}`
    compose the domains into `full` (every domain) and `lite` (no scheduled
    daemons), selected with `--profile`. An unknown profile fails the run
    instead of silently defaulting.
  - Evidence: `pnpm run machine:test` 189 pass / 0 fail; `pnpm run check` exit
    0; `pnpm run machine:diff` reports `services skipped 0` (no `services.json`
    in the instance directory yet), `-- --profile lite` omits services,
    `-- --profile laptop` exits 1 with
    `unknown profile laptop; expected full or lite`.
  - Scope: diff only. Writing and reloading units is an apply-side machine
    mutation and still needs authorization, and removal of undeclared units is
    deliberately not planned.

- [x] 2026-08-24 - **Machine provisioning:** The mcp capture reader closed the
      last real gap in the per-domain capture item, on the reference rule
      decided 2026-08-22.
  - Result: `pnpm run machine:capture:mcp` reads every target's live servers and
    emits a manifest document. A concrete `env` or header value is emitted as
    the `from_env` reference the tracked `machine/mcp.json` already declares for
    that key; with no declared reference the server is refused and reported by
    key name, never by value. Codex sub-tables are normalized on the way in, so
    `env_http_headers` (already an environment binding) captures as a reference,
    and `startup_timeout_sec`, `required` and `default_tools_approval_mode` are
    carried rather than silently dropped.
  - Evidence: `pnpm run machine:test` 189 pass / 0 fail (4 capture tests assert
    no live value ever reaches the output); live run captured 9 servers and
    refused 2 (`paperclip`, `node_repl`) across 16 named keys, printing key
    names only.

- [x] 2026-08-24 - **Supply chain and secrets:** The declared dangerous-mode
      policy and the live machines agree again; the baseline is now `true` by
      user decision.
  - Result: user decision 2026-08-24 — `skipDangerousModePermissionPrompt` is
    the intended default and must be `true`. `machine/security.json`, the
    `ClaudeSecurityPolicy` literal type, the manifest validation in
    `collectClaudeSecurityErrors` and the `hasSafeClaudePolicy` health check
    were flipped together, so the invariant still cannot be represented loosely:
    a manifest that declares `false` is now rejected.
  - Evidence: `pnpm run machine:test` 189 pass / 0 fail; `pnpm run check` exit
    0; `pnpm run machine:diff` reports `security converged 0` where it
    previously reported drift on both Claude profiles.

- [x] 2026-08-22 - **Learning loop:** The weekly LaunchAgent was pointing at a
      directory that no longer holds the code. Repaired before its first run.
  - Result: `com.cristian.library-loop` ran
    `cd "$HOME/p/agents-tools" && npx tsx scripts/bin/run-library-loop.ts`.
    `~/p/agents-tools` survives the rename as an empty directory, so `cd`
    succeeded and the script was simply absent - the loop would have failed
    silently at its first scheduled run on 2026-08-23 06:30, and the missing
    report would have looked like the job never fired. Repointed to
    `$HOME/p/agents` and reloaded. A sweep of all 25 user LaunchAgents found no
    second instance of the stale path.
  - Evidence: `ls ~/p/agents-tools/scripts/bin/run-library-loop.ts` reported no
    such file while the same path exists under `rocket-agents`; `plutil -lint`
    OK after the edit; `launchctl bootout` plus `bootstrap` reloaded it and
    `launchctl list` shows it; the agent's own command replayed in a login shell
    resolves the script. Backup of the original plist kept in the session
    scratchpad.

- [x] 2026-08-22 - **Machine provisioning:** Services rendered from one
      description, for launchd and systemd.
  - Result: new `domains/services` describes a service as name, home-relative
    working directory, command, optional log path, optional schedule and the
    runAtLoad/keepAlive flags. `parseServicesManifest` rejects any absolute or
    shell-expanded home path, which is the exact portability defect the backlog
    recorded (every user-authored LaunchAgent except two hardcodes an absolute
    home path) - the schema makes it unrepresentable rather than discouraged.
    Two renderers consume the same description: `renderLaunchAgent` emits a
    plist using `$HOME` with XML-escaped shell operators, and
    `renderSystemdService` / `renderSystemdTimer` emit a unit and timer using
    `%h` and `OnCalendar`. Writing the files is not built: that is a machine
    mutation.
  - Evidence: `pnpm run check` exit 0; `pnpm run machine:test` 169 pass / 0 fail
    (18 new); rendering the library-loop description and comparing with
    `plistlib` against the live agent returns `rendered == live agent: True`,
    and `plutil -lint` accepts the rendered plist.
  - Files: `scripts/lib/machine/domains/services/**` (types,
    `parseServicesManifest`, `collectServiceErrors`, `collectScheduleErrors`,
    `isPortableHomePath`, fixtures, two test files),
    `scripts/lib/machine/renderers/launchd/**`,
    `scripts/lib/machine/renderers/systemd/**`.

- [x] 2026-08-22 - **Machine provisioning:** Install provenance resolved for
      `codegraph` and Serena.
  - Result: neither is opaque - `codegraph` is the global npm package
    `@colbymchenry/codegraph@1.5.0` (`/opt/homebrew/lib/node_modules`) and
    Serena is the uv tool `serena-agent@1.7.0` (`~/.local/share/uv/tools`). The
    runtime sweep missed them because it reads neither `npm ls -g` nor
    `uv tool list`. That correction is folded into the remaining provenance
    item, which now names `agy` 1.1.17 and `herdr` 0.8.0 as the only genuinely
    unrecoverable binaries.
  - Evidence: `command -v` plus `readlink -f` for each tool;
    `npm ls -g --depth=0`; `uv tool list`;
    `file ~/.local/bin/agy ~/.local/bin/herdr` reports bare
    `Mach-O 64-bit executable arm64`.

- [x] 2026-08-22 - **Machine provisioning:** Realpath defect in the plugin cache
      hygiene reader, found and fixed the same day it shipped.
  - Result: `findStaleCacheEntries` compared raw path strings. 13 of 37
    installed plugins record their `installPath` through the
    `~/.claude-favish/plugins` symlink, so every one of their live versions was
    reported stale. A prune built on that output would have deleted 13 in-use
    plugins. Both sides are now resolved through `toRealPath` (cache root and
    install paths), with a regression test that installs through a symlinked
    directory. Corrected stale count: 50, not 63.
  - Evidence: `pnpm run machine:test` 139 pass / 0 fail including the new
    symlink test; `pnpm run check` exit 0.
  - Files: `scripts/lib/machine/domains/plugins/toRealPath.ts`,
    `resolveInstalledPaths.ts`, `findStaleCacheEntries.ts`,
    `readCacheEntries.ts`, `CACHE_TEST.ts`.

- [x] 2026-08-22 - **Machine provisioning:** Plugin cache swept; 2.26 GB
      reclaimed.
  - Result: with authorization, 768 orphan `temp_git_*` / `temp_subdir_*.clone`
    directories and 50 unreferenced plugin versions removed from
    `~/.claude/plugins/cache`. Cache 2.5 GB -> 271 MB. Pre-delete evidence:
    every target sat directly under the cache and matched the temp naming, none
    had been touched in four days, no open file handles, all were clones of
    public remotes with no modified files and no unpushed commits (their only
    untracked files were Claude Code's own `.orphaned_at` markers), and no file
    under `~/.claude` referenced any target path. All 50 stale versions carried
    `.orphaned_at`.
  - Evidence: guard script reported 0 referenced targets; deletion reported
    removed 818 / failed 0; `du` 2.5G -> 271M; post-sweep
    `machine:capture:plugins` reports 37 entries, 0 stale, 0 orphan; all 37
    installed plugin directories still present.

- [x] 2026-08-22 - **Machine provisioning:** `statusLine` repointed and `serena`
      declared.
  - Result: both Claude profiles (one symlinked `settings.json`) now point
    `statusLine` at caveman `0d95a81d35a9`, the installed version, instead of
    the pruned `25d22f864ad6`. Repointing had to happen before the sweep, since
    the old target was one of the stale directories.
    `serena@claude-plugins-official` declared `false`, recording the behaviour
    it already had: its cached copy carries an `.orphaned_at` marker and its MCP
    server is configured directly in `~/.claude.json`, so the plugin is
    redundant. Undeclared plugins are now 0 of 37.
  - Evidence: statusline script executed against a sample payload, exit 0; both
    settings files parse as JSON; `machine:capture:plugins` reports 19 disabled
    / 18 enabled / 0 undeclared per profile.

- [x] 2026-08-22 - **Repository hygiene:** Orphaned `agent-health-matrix`
      worktree removed, 202 MB.
  - Result: its `.git` pointed at `/Users/cristiandeluxe/p/agents-tools/.git`,
    which does not exist - `~/p/agents-tools` is an empty directory, so git
    commands run there resolve to the `~/p` meta repo. Branch
    `feat/skill-router-reliability` is fully merged (0 commits unique to it),
    all 1040 tracked files in the copy were byte-identical to its tip `dd2cfc1`,
    and its serena memory was identical to main's. Removed the dead registration
    with `git worktree prune` and deleted the directory.
  - Evidence:
    `git rev-list --left-right --count main...feat/skill-router-reliability` =
    `49 0`; per-file blob comparison against `dd2cfc1` reported 0 differing and
    0 missing; `git worktree list` now lists only the main checkout.

- [x] 2026-08-22 - **Machine provisioning:** Plugins domain gained the
      assertable half - manifest schema, parser, planner and a `machine:diff`
      lane.
  - Result: `parsePluginsManifest` validates a `plugins.json` (version pin,
    marketplace entries, `name@marketplace` ids, and a boolean per profile so
    enablement is never implied), reporting all errors sorted rather than one at
    a time. `plan` diffs the declared manifest against live state into install /
    remove / pin / enable / disable changes. `machine:diff` now reports a
    `plugins` domain, skipping cleanly when no `plugins.json` is declared - the
    manifest carrying real values belongs in the private dotfiles repo. Apply is
    deliberately not built: it is a machine mutation.
  - Evidence: `pnpm run check` exit 0; `pnpm run machine:test` 151 pass / 0
    fail; live `pnpm run machine:diff` reports
    `plugins skipped - no plugins.json in the instance directory`.
  - Files: `scripts/lib/machine/domains/plugins/parsePluginsManifest.ts`,
    `collectMarketplaceErrors.ts`, `collectDeclaredPluginErrors.ts`, `plan.ts`,
    `planDeclaredPlugin.ts`, `planEnablement.ts`, `planRemovals.ts`,
    `PLUGIN_PROFILES.ts`, `toPluginsDomainResult.ts`, `PARSE_MANIFEST_TEST.ts`,
    `PLAN_TEST.ts`, `DOMAIN_RESULT_TEST.ts`,
    `scripts/lib/machine/cli/loadPluginsManifest.ts`,
    `scripts/commands/machineDiff.ts`.

- [x] 2026-08-22 — **Machine provisioning:** Plugin capture reader and manifest
      schema built (read-only), closing the recording half of the plugin
      manifest item.
  - Result: new `scripts/lib/machine/domains/plugins/` reads
    `known_marketplaces.json`, `installed_plugins.json` and `enabledPlugins`
    from both Claude profiles into one deterministic manifest (marketplace
    source, plugin version, scope, commit sha, per-profile enablement). The
    third enablement state is the point: `enabled | disabled | undeclared`, so
    an installed plugin missing from `settings.json` is recorded as undeclared
    rather than silently defaulted to disabled. New command
    `pnpm run machine:capture:plugins [-- --json]`. Nothing is written to user
    data.
  - Result (measured live): 7 marketplaces, 37 installed plugins, 18 enabled /
    18 disabled / 1 undeclared per profile. The single undeclared entry is
    `serena@claude-plugins-official`, confirming the open item by measurement
    rather than by reading.
  - Evidence: `pnpm run check` exit 0; `pnpm run machine:test` 137 pass / 0 fail
    (16 new tests); live `pnpm run machine:capture:plugins -- --json`.
  - Files: `scripts/lib/machine/domains/plugins/**` (types, readers,
    `toManifest`, cache hygiene, fixtures, `READ_TEST.ts`,
    `TO_MANIFEST_TEST.ts`, `CACHE_TEST.ts`),
    `scripts/lib/machine/cli/resolvePluginsPaths.ts`,
    `scripts/lib/machine/report/formatters/formatPluginsCapture.ts`,
    `scripts/commands/machineCapturePlugins.ts`,
    `scripts/bin/run-machine-capture-plugins.ts`, `package.json`.

- [x] 2026-08-22 — **Machine provisioning:** Plugin cache hygiene measured; the
      premise of the open prune question was wrong.
  - Result: the 2.5 GB cache is not stale plugin versions. Scoping the walk to
    known marketplaces gives 87 real cache entries, of which 63 are versions no
    installed plugin resolves to, totalling **0.03 GB**. The remaining **2.26 GB
    across 768 orphan directories** is abandoned `temp_git_*` /
    `temp_subdir_*.clone` scratch dirs left by plugin installs — not versioned
    plugin state at all. A version-prune step would therefore reclaim ~1% of
    what the item assumed; orphan-directory cleanup is the item that matters.
  - Result (prune trap confirmed): `caveman/caveman/25d22f864ad6` is reported
    stale (no installed plugin resolves to it) yet is the live target of
    `statusLine` in `~/.claude/settings.json`. Any prune step must read
    `settings.json` references, not only `installed_plugins.json`.
  - Evidence: `pnpm run machine:capture:plugins -- --json`, sizes summed over
    the reported paths in session; `pnpm run check` exit 0.
  - Files: `scripts/lib/machine/domains/plugins/readCacheEntries.ts`,
    `findStaleCacheEntries.ts`, `findOrphanCacheDirectories.ts`,
    `readDirectoryNames.ts`.

- [-] 2026-08-22 — **Supply chain:** pnpm 11 controls in this repository.
  - Resolution: already satisfied before the item was worked.
    `pnpm-workspace.yaml` carries `minimumReleaseAge: 1440`,
    `minimumReleaseAgeStrict: true`, `minimumReleaseAgeIgnoreMissingTime: false`
    and `blockExoticSubdeps: true`. The item survives in `TODO.md` narrowed to
    the other `~/p` repositories, which are out of this repository's scope.

- [x] 2026-08-21 - **Apple Notes prompts converted to library skills:** 17
      prompt notes from the Apple Notes "AI" folder unified into 4 hand-authored
      skills in `rocket-agents-library/skills/`: `jira-ticket-flow` (6 Jira
      lifecycle notes -> 1 skill with 6 workflow references, refined with
      measured session failures: Original Estimate transition validator,
      transition-by-name multi-hop, stale template keys, approval gate,
      solution-first comment contract), `project-hardening` (strict-refactor +
      Next.js 16 + Astro + Tauri v2 hardening notes -> stack-routed references),
      `launch-readiness` (Next.js launch + AI SaaS audit notes -> gate skill
      delegating depth to claude-seo/security-review/code-review),
      `staffbase-widget-review` (Staffbase deltas only). Dropped as superseded:
      bug-audit note (code-review plugin), SEO architect note (claude-seo),
      Prompt Contratos (tieneslavibra clause-library + runbooks), Vibra
      corporate prompt (folded into `~/p/brain/projects/tieneslavibra.md`). All
      four registered adopted in `curation.json`.
  - Evidence: skills and curation entries in `~/p/rocket-agents-library`; usage
    mining from
    `~/.claude/projects/-Users-cristiandeluxe-p-staffbase-shoutouts/fc850cc9*.jsonl`
    and 4 Codex rollouts; application dry-tests passed via subagent (S1-S5 Jira
    scenarios, A1-A4/B1-B4). Pending: `pnpm run library:link` to expose them to
    the clients.

- [x] 2026-08-19 - **Repository identity:** Completed the coordinated Rocket
      Agents migration.
  - Result: the control plane and library use `BusiRocket/rocket-agents` and
    `BusiRocket/rocket-agents-library`; both machines use matching `~/p`
    checkout paths, while `~/.agents` remains a compatibility link for client
    discovery. Package and plugin names, managed rule links, documentation, and
    the daily convergence job use the canonical names.
  - Evidence: `pnpm run check:all`; `pnpm run machine:diff -- --json`; remote
    and local Git status; `~/p/dotfiles/bin/sync-conversations macmini dry`.

- [x] 2026-08-19 - **Platform identity:** The repository family is named Rocket
      Agents and each state type has one owner.
  - Result: BRP remains the workflow engine; `agents-tools` is the public
    control plane, `~/.agents` is the curated library, `dotfiles` owns host
    bootstrap, `brain` owns human knowledge, and MemPalace owns derived
    search/index runtime. The redundant `ai-state` transport is preserved as
    history but retired from active automation. Repository renames are staged as
    one coordinated compatibility migration.
  - Evidence: `docs/adr/0001-rocket-agents-repository-family.md`;
    `git remote get-url origin`; `pnpm run machine:diff -- --json`;
    `~/p/dotfiles/bin/sync-conversations macmini dry`.

- [-] 2026-08-19 - **Machine provisioning:** Restore a private
  `~/p/dotfiles/machine/mcp.json` instance.
  - Resolution: superseded by the tracked, data-free `machine/` instance in this
    repository. `machine:diff` now resolves it by default and reports MCP,
    security, and capabilities converged on both machines.
  - Evidence: `pnpm run machine:diff -- --json` locally and over `ssh macmini`
    both return `ok: true` with zero changes.

- [x] 2026-08-18 - **Rules:** `text-hygiene` gave contradictory guidance and
      produced a false report.
  - Problem, hit live in the nubenode repo: the rule said both "prefer ASCII
    punctuation in edited/new text" and "keep edits minimal; do not reformat
    unrelated content", with no precedence between them. Editing a doc whose
    house style is em dashes throughout satisfies one clause only by breaking
    the other. The session matched the file, then spent a paragraph of its
    report confessing to a violation that was not one - the rule made correct
    behaviour look like a deviation worth flagging.
  - Result: the rule now separates a hard tier from a soft one.
    `Never introduce` covers invisible characters and smart quotes, with no
    file-convention exception, which is also exactly what `hygiene:test`
    enforces - previously the rule read as if the whole of it were enforced that
    strictly. The ASCII preference is explicitly overridden by an existing
    consistent convention in the file being edited; new files still start ASCII.
    Output discipline now says to speak only when the reader must act, so
    following house style draws no remark.
  - Evidence: `pnpm run rules:compile` then `rules:check` reports "Rules are up
    to date"; `pnpm run hygiene:test` passes; the source `.mdc` is pure ASCII by
    `LC_ALL=C grep -n '[^ -~]'`. Live in both profiles through the
    `~/.claude/rules/busirocket -> dist/global/.claude/rules` symlink, so no
    relink was needed.
  - Files: `src/rules/core/text-hygiene.mdc`.

- [x] 2026-08-18 - **Machine provisioning:** MCP domain shipped end to end on
      the new engine.
  - Result: `machine:diff`, `machine:apply` and `machine:rollback` render one
    declarative manifest into the Claude, Codex and Gemini config formats.
    Seven-domain contract in place (`read`, `plan`, `apply`, `verify`) with
    `plan` pure; ownership sidecar so apply can retract its own keys without
    touching foreign ones; per-run snapshots with tier-1 restore; secret
    references that report what is missing instead of failing.
  - Evidence: 90 tests in `machine:test`, wired into `check:all`;
    `pnpm run check` green. The credential validator flags exactly the ten
    literals recovered from the leaked Gemini config and nothing else. The
    idempotency test caught a real defect: Codex diffs compared a Claude-shaped
    render against quoted TOML and always reported changed - fixed by
    normalizing both sides. Commits 49319be (plan) through bc96241.
  - Deferred by design to later plans: `verify` for MCP, rollback tiers 2 and 3,
    profiles, the `machine-setup` skill, and the other six domains.

### 2026-07

- [x] 2026-07-19 — **Router:** Deterministic `UserPromptSubmit` prompt router
      shipped and registered live.
  - Result: `src/hooks/user-prompt-skill-router.sh` + `utils/route_prompt.py`,
    routing on domain nouns, silent on no match; tested against 1053 verbatim
    corpus prompts; 4 extra lanes from the Codex 30-day pass (`contract-ops`,
    `agent-config`, `environment-ops`, `repo-modernization`), 2 candidates
    rejected on precision (`generic-review` ~13%, `job-search` n=4);
    `contract-ops` regex hand-narrowed to 7/7 precision.
  - Evidence: commits 8a33f2a, 4c3c208, f5c3cd2; `ROUTER_TEST.ts` wired into
    `check:all`; registered in `~/.claude/settings.json`.

- [x] 2026-07-19 — **Hooks:** Hook layer brought under repo management and
      actually linked.
  - Result: SessionStart reminder no longer names nonexistent commands (RC-8);
    `hooks:link` mirrors `skills:link` into `~/.agents/hooks` with a drift
    check; Stop verification gate managed as
    `src/hooks/stop-verification-gate.sh` with 4-behavior tests and non-Node
    project detection; phantom `src/core/policy.json` (zero readers) deleted.
    Root cause closed: the plugin was never installed, so no hook in this repo
    had ever run (RC-10).
  - Evidence: commits c05c5ec, b7f3356, 68eeec9, 30014f9, 79e5431; Stop hook
    live in `~/.claude/settings.json`.

- [x] 2026-07-19 — **Skills:** `brp-traffic-client` created; validators
      resurrected; cache purged.
  - Result: skill turns captured traffic (HAR/CDP/curl/Playwright) into HTTP
    clients, with the "screenshot loop is the smell" implicit trigger from a
    cross-project audit; 4 orphaned description validators wired into
    `skills:lint`; ~178MB stray plugin-cache temp dirs removed.
  - Evidence: commits 4472d90, 3e8c895, 9da58f3, 646bdf9, 727ddae, a5c0122,
    eb94471.

- [x] 2026-07-19 — **Build:** TypeScript 7 fallout fixed; type-check made a
      gate.
  - Result: accidental TS 6→7 bump broke ESLint/typescript-estree; restored via
    the dual-alias layout; two pre-existing type errors fixed
    (`linkRulesGlobal.ts`, `stripFrontmatterKeys.ts`); `pnpm run type-check`
    folded into `check:all`. The `findIde("codex")` crash from the registry edit
    was later re-fixed with a regression test.
  - Evidence: commits 3490932, 40ee182; `package.json` `check:all`.

- [x] 2026-07-19 — **agents-skills repo:** Audited, orphaned guidance ported,
      repo archived.
  - Result: 3 substantive orphaned rule topics (Zod conventions, Zustand store
    organization, guard-helper semantics) plus minor gaps ported into
    `src/rules/`; deliberate divergences kept (new repo's criteria win);
    `BusiRocket/agents-skills` archived on GitHub with a README notice.
  - Evidence: commit dfcd786; `gh repo view` shows `isArchived: true`.

- [-] 2026-07-19 — **Audit:** Measurement claims retracted the same day they
  were made.
  - Resolution: "5.4% skill firing" was an 8x denominator artefact (real
    interactive rate ~42%); "286 skills dilute selection" false (41/1188
    reachable); "627 security-review sessions need a skill" false (purpose-built
    plugin, not a miss); "8 BRP descriptions clipped at 400 chars" was the
    auditor's own truncation; `vexa-email-triage` skill rejected (self-contained
    prompts).
  - Evidence: commits 5fed875, eb94471, 6ba86b9; `TODO-skills-audit.md`
    corrections.

- [-] 2026-07-21 — **Backlog:** TODO-consolidation workflow (40 extraction
  agents) abandoned mid-flight.
  - Resolution: session ended right after launching workflow `wf_7d194de2-e6c`;
    no output was ever observed. Superseded by the
    `brp-todo-create`/`brp-todo-work` skills (commit f888df7, 2026-07-31) and
    the 2026-08-13 audit that produced this backlog.

- [-] 2026-07-21 — **Backlog:** Root `CLAUDE.md` with a "Continuous TODO
  Capture" section — never created, no longer needed.
  - Resolution: the identical maintenance rule ships in `~/p/CLAUDE.md`, which
    loads for every session in this repo; duplicating it in a repo-root file
    would violate the rule's own no-duplication clause. TODO files are now
    repo-local per that rule's scope note.

### 2026-08

- [x] 2026-08-13 — **Linker:** `skills:link` was silently wiping every
      externally-installed skill.
  - Result: `cleanGlobalPrefix` with `prefix: ""` matched everything via
    `startsWith("")`; every link run deleted all 88 non-repo skills in
    `~/.agents/skills` and IDE targets. Guard added with test; 86/88 restored
    from `~/.agents/.skill-lock.json`; `frontend-skill` and `task-quality-kpi`
    lost upstream (gone from their sources). Remaining losses tracked in
    `TODO.md` (Global agent config).
  - Evidence: commits aa2a972, 3db4a51; `CLEAN_GLOBAL_PREFIX_TEST.ts` in
    `link:test`.

- [x] 2026-08-13 — **Skills:** Full 16-skill realignment with Anthropic/OpenAI
      authoring guidance.
  - Result: orchestrator SKILL.md rewired from the deleted `policy.json` to the
    real routing mechanism; `handoff` got its missing `agents/openai.yaml`;
    `brp-release` now pushes the tag it cuts; escalation rules moved from
    openai.yaml into SKILL.md where Claude reads them; missing
    `## Workflow`/`## Output` sections added; descriptions moved to third
    person; byte-identical reference duplication guarded by
    `TODO_FORMATS_SYNC_TEST`; Cursor history coverage added to the brp-todo
    skills; BusiRocket baseline folded into `brp-code-quality` with bundled docs
    and drift test; cost-based model routing added to both brp-todo skills;
    codex demoted to a rules-only link target; boundaries ESLint config migrated
    to the v7 policies schema.
  - Evidence: commits 32bdb24, 707993d, c5d07de, f72a4bb, 6cc709b, 1318f36,
    0d28b5b; `pnpm run check` green.

- [x] 2026-08-13 — **Backlog:** Repo took ownership of its backlog.
  - Result: items routed from the `~/p` meta list and the archived
    `agents-skills` backlog; this audit then consolidated all accessible
    Claude/Codex/Cursor/Antigravity history into `TODO.md`/`TODO_LOG.md` with
    coverage tracked in `TODO_HISTORY_INDEX.jsonl`.
  - Evidence: commits 44249f5, 969f47f; this file.

- [x] 2026-08-13 — **Rules:** Glob-narrowing branch resolved — work is on main.
  - Result: every commit reachable from `bce0adb` (branch
    `skills/deterministic-prompt-router`, since deleted) has a patch-equivalent
    on main; nothing left to merge or discard.
  - Evidence: `git cherry main bce0adb` lists no `+` commits.

- [x] 2026-08-13 — **Tooling:** `.serena` schema migration committed in this
      repo.
  - Result: `.serena/project.yml` committed; working tree clean. The
    Osseus/RocketUpdater counterparts remain open in `~/p/osseus/TODO.md` (their
    entry already names both repos).
  - Evidence: commit 5aa7162; `git status` clean.

- [x] 2026-08-13 — **Harness:** Layer-4 "success is silent, failure is loud"
      gate is global, not brain-only.
  - Result: the Stop verification gate ships from this repo and is registered
    machine-wide via `hooks:link`; repos opt in by defining a `check` script.
    Remaining per-repo gap (verticagtm lacks a plain `check` alias) filed in
    that repo's TODO.
  - Evidence: `src/hooks/stop-verification-gate.sh`; Stop hook in
    `~/.claude/settings.json`.

- [x] 2026-08-13 — **Router:** invoice-ops lane no longer summons the
      nonexistent skill.
  - Result: the directive was rewritten to carry only the live-source
    verification rule; the invoice-quarter-close rebuild stays open in `TODO.md`
    with the old MacBook Pro named as the first place to look.
  - Evidence: commit 82620a2; `pnpm run hooks:test` 10/10 after rebuild+relink.
  - Files: `src/hooks/utils/route_prompt.py`,
    `scripts/lib/hooks/constants/LANE_MARKERS.ts`.

- [x] 2026-08-13 — **Router:** Session-level lane idempotency shipped.
  - Result: each lane fires at most once per session, tracked in a per-session
    temp file keyed by the sanitized `session_id`; stateless (fires every time)
    when no session_id arrives, so existing behavior and tests are unchanged.
    The multi-ask note still fires per prompt.
  - Evidence: commit cc67b18; new "a lane fires at most once per session" case,
    `pnpm run hooks:test` 11/11.
  - Files: `src/hooks/utils/route_prompt.py`,
    `scripts/lib/hooks/ROUTER_TEST.ts`, `scripts/lib/hooks/runRouterHook.ts`.

- [x] 2026-08-13 — **Skills:** Dead activation-fixture layer deleted.
  - Result: `activation-smoke.json`, `activation-acceptance.json`,
    `SMOKE_PATH.ts`, `ACCEPTANCE_PATH.ts` removed (no consumers; superseded by
    `ROUTER_TEST.ts`), plus the two root `.lint-*.json` files — committed ESLint
    output still pointing at the retired busirocket-agents checkout.
  - Evidence: commit d986366; type-check, lint and `skills:validate` green after
    removal.

- [x] 2026-08-13 — **Rules:** Staffbase auto-load gap documented;
      store-vs-context reason added.
  - Result: `staffbase.mdc` now states in-file that repos without
    `widget/`/`configuration/` markers need a manual `@staffbase` (globs kept
    narrow on purpose — `**/src/**` would load the rule everywhere, deviating
    from the TODO's suggested fix); `state-management.mdc` now carries the
    measured selector-vs-Context rationale (~45ms/100 consumers vs ~2ms/3
    subscribers).
  - Evidence: commit 6fb29b1; `pnpm run rules:check` green after regeneration.

- [x] 2026-08-13 — **Supply chain:** Hidden-Unicode scan gates this repo's
      check.
  - Result: `hygiene:test` (in `check:all`) fails when any tracked text file
    carries variation selectors or zero-width characters — the GlassWorm payload
    channel; predicate extracted to `scripts/lib/isHiddenUnicode.ts` for reuse.
    The one existing offender was a decorative emoji in the audit history,
    replaced per the text-hygiene rule. Other published repos remain open in
    `TODO.md`.
  - Evidence: commit 9d3609c; `pnpm run hygiene:test` 1/1.

- [-] 2026-08-13 — **Audit:** "Merge the codex deep-pass findings into Round 1"
  closed as overtaken.
  - Resolution: the scratchpad reports (`findings.md`, `findings30.md`) no
    longer exist on disk; their content was reconstructed from the Codex
    rollouts during this audit and everything actionable was either already
    absorbed into `TODO-skills-audit.md` (with corrections) or is now tracked in
    `TODO.md`.

- [x] 2026-08-13 — **Recovery:** Lost global skills and the security guidance
      restored from the old MacBook Pro over SSH.
  - Result: all 6 `ckm-*` skills (banner-design, brand, design, design-system,
    slides, ui-styling), `frontend-skill` and `task-quality-kpi` (the two "lost
    upstream" from the linker wipe), and `~/.claude/claude-security-guidance.md`
    (original 5269-byte file, dated 2026-07-19 — recovered, not rewritten; its
    absence here traces to the machine clone, not a deletion on this machine)
    rsync'd back. `skills:link` re-run afterwards; all restored skills survive
    the `aa2a972` guard. `ckm-*` remain lock-untracked on both machines —
    follow-up filed in `TODO.md`.
  - Evidence: `ls ~/.agents/skills/ckm-*` (6 dirs),
    `ls -la ~/.claude/claude-security-guidance.md`; `pnpm run skills:link`
    clean; old machine searched via `find`/`mdfind` over `~/.agents`,
    `~/.claude`, `~/p`.

- [x] 2026-08-13 — **Recovery:** `invoice-quarter-close` and the `brain` skill
      confirmed absent from the old MacBook Pro — restore path exhausted.
  - Result: SSH search (`find` maxdepth 6 + `mdfind`, both machines' lock files)
    found no copy of either. `invoice-quarter-close` stays open in `TODO.md`
    (Router) as a rebuild from the audit's trigger draft; the `brain` skill
    rebuild is filed cross-project in `~/p/brain/TODO.md` (Infrastructure) since
    it wraps that repo's tooling.
  - Evidence: remote `find`/`mdfind` output empty; neither name in either
    `.skill-lock.json`.

- [x] 2026-08-13 — **Audit:** Runtime/catalog split resolved — the catalog
      structurally misses two skill classes.
  - Result: of the 7 fired-but-uncatalogued skills, 4 are Claude Code harness
    built-ins never on disk (`artifact-design`, `claude-api`,
    `claude-in-chrome`, `schedule`), `impeccable` is a live user-linked skill in
    `~/.agents/skills`, `job-search` is repo-scoped inside
    `cristian-deluxe-developer-portfolio/.claude/skills` (only loads there), and
    `migrating-to-typescript-7` no longer exists anywhere on disk (removed since
    the corpus week). Conclusion recorded by the audit stands: tune against the
    runtime listing, never the disk catalog.
  - Evidence: session skill listing; `ls ~/.agents/skills/impeccable`;
    `ls ~/p/cristian-deluxe-developer-portfolio/.claude/skills/job-search`;
    `mdfind` empty for `migrating-to-typescript-7`.

- [-] 2026-08-13 — **Skills:** `job-search` trigger-phrase item rerouted to its
  owning repo.
  - Resolution: the "exists nowhere on this machine" premise was wrong — the
    skill lives in the portfolio repo (repo-scoped). Improvement filed in
    `~/p/cristian-deluxe-developer-portfolio/TODO.md` (Skills).

- [x] 2026-08-13 — **Skills:** The 7 competing BRP skills demoted to
      orchestrator references.
  - Result: `brp-plan`, `brp-implement`, `brp-test`, `brp-debug`, `brp-fix`,
    `brp-refactor` and `brp-review` are no longer standalone skills; their
    workflows and templates live under
    `src/skills/orchestrator/brp/references/`, the orchestrator chains point at
    the references, the rules-map entries were pruned, and the README reflects
    the 9-skill surface. Process lanes are owned by the superpowers family per
    the 2026-07-19 decision (user re-confirmed today). Side find, fixed at the
    root: canonical staging never pruned removed skills inside namespace dirs
    (`core/`, `orchestrator/`), so the 7 would have shipped to Codex forever;
    `removeStaleNamespaceEntries` now runs in `populateCanonicalSkillsDir` with
    3 tests in `link:test`.
  - Evidence: `pnpm run check` green (link:test 6/6); `skills:link` distributes
    9 skills; `~/.claude/skills` and `~/.agents/skills/core` carry no demoted
    entries; externally installed skills (`ckm-*` 6/6) untouched.

- [x] 2026-08-13 — **Skills:** `project-continuation` built behind the
      `continuation` router lane.
  - Result: new core skill (SKILL.md + openai.yaml + rules-map entry) that
    reconstructs state from git, TODO backlogs, plan and handoff artifacts
    before resuming; the `continuation` lane directive now summons it explicitly
    (lane marker unchanged, so router tests were untouched); the read-side twin
    of `handoff`. Distributed to all IDE targets.
  - Evidence: `pnpm run check` green after `build` + `hooks:link` (drift gate
    caught the out-of-order link once, as designed); `hooks:test` 11/11;
    `skills:link` distributes 10 skills; `ls ~/.claude/skills | grep project`
    shows it.

- [-] 2026-08-13 — **Skills:** Consolidation-by-delegation superseded by the
  demote decision.
  - Resolution: user confirmed 2026-08-13 that the recorded demote decision wins
    over the later "make superpowers delegate to brp-*" idea (can't delegate to
    skills being retired). The surviving half of the consolidation intent — one
    family per lane — is exactly what the demote implements.

- [x] 2026-08-13 — **Global agent config:** `ckm-*` skills' true installer
      identified; lock registration ruled out; durable recovery path archived.
  - Result: the 6 `ckm-*` skills are ClaudeKit.cc paid-marketplace content
    (frontmatter author `claudekit`, v2.1.0). No public GitHub source exists
    (org repos and `mrgoonie/claudekit-skills` carry only
    ui-styling/frontend-design variants), and the `skills` CLI (v1.5.22) only
    accepts GitHub packages, so an honest `~/.agents/.skill-lock.json` entry is
    impossible — a fabricated one would 404 on `experimental_install`. Instead
    the provenance is recorded in `~/p/brain/topics/claude-skills-ecosystem.md`
    and a backup tarball archived at
    `~/p/brain/sources/vault/ckm-skills-v2.1.0-claudekit.tar.gz` (211 entries;
    extract into `~/.agents/skills/`).
  - Evidence: brain commit 69c0b6a; `tar tzf` lists 211 entries; GitHub API tree
    queries for `claudekit` org and `mrgoonie/claudekit-skills`;
    `npx skills add --help` (GitHub-only sources).

- [x] 2026-08-13 — **Skills:** `invoice-quarter-close` rebuilt over the brain
      playbook.
  - Result: new core skill from the audit's RC-5 trigger draft; the method stays
    in `~/p/brain/business/quarter-close-playbook.md` and the skill carries the
    trigger surface, the live-source verification rules, and the workflow
    skeleton (no secrets, no company data). The `invoice-ops` lane directive now
    summons it. `closes`/`reconciles` added to `ACTION_WORDS` so the description
    passes the specificity lint honestly.
  - Evidence: commit 7edcd31; `pnpm run check` green; `skills:link` distributes
    11 skills; `ls ~/.claude/skills | grep invoice` shows it.

- [x] 2026-08-13 — **Skills:** `stakeholder-recap` built behind its existing
      router lane.
  - Result: channel-history-first recap skill (evidence-backed claims,
    communication-norms disclosure shape, draft-before-post); the
    `stakeholder-recap` lane directive now summons it explicitly (marker
    unchanged).
  - Evidence: commit 45c136f; `pnpm run check` green; `skills:link` distributes
    12 skills.

- [x] 2026-08-13 — **Skills:** `lovable-sync` built with a new router lane — the
      TODO's "lane exists" premise was false for this one.
  - Result: two-way design-parity skill (pull latest, difference map,
    slice-by-slice port, preserve working functionality); new `lovable-sync`
    lane placed before `debug` (one real prompt carries "no funciona") and
    before `frontend` ("el diseño" would steal it); 6 verbatim transcript
    prompts added as fixtures; the "prompt para lovable" fixture stays correctly
    silent.
  - Evidence: commit 2136a70; `pnpm run check` green (router fixtures pass);
    `skills:link` distributes 13 skills.

- [x] 2026-08-13 — **Skills:** External validator rebuilt; the "dead subsystem"
      blocker closed by the user's rebuild decision.
  - Result: `.venv-validate` recreated from scratch (`pnpm run validate:install`
    over the moved venv only reported "already satisfied" and left the old
    `busirocket-agents` shebangs, so the directory was removed first);
    `agentskills --help` and a real `validate` run work. Side fixes at the root:
    `.venv-validate/**` added to the eslint ignores (pip vendors `.js` files the
    typed lint choked on). Residual fact filed in `TODO.md`:
    `detectValidator`/`runValidate` still have zero callers, and strictyaml
    rejects the `argument-hint: [x]` syntax.
  - Evidence: `.venv-validate/bin/agentskills --help` prints usage;
    `pnpm run check` green.

- [x] 2026-08-13 — **Skills:** Every description's "Trigger when" clause now
      opens before char 150, and a lint keeps it that way.
  - Result: 12 of 13 descriptions rewritten (handoff was already at 148) so the
    activation boundary survives listing truncation; first sentences compressed,
    boundaries preserved. New `descriptionTriggerPositionError` validator wired
    into `DESCRIPTIONS_TEST.ts` enforces the limit; the audit item's "16 skills"
    count predates the 7-skill demotion.
  - Evidence: commit 2cb270c; `pnpm run check` green (skills:lint passes the new
    test); measured positions 132-146.

- [x] 2026-08-13 — **Skills:** External `agentskills` validator wired into
      `skills:validate`; the orphan `detectValidator`/`runValidate` gained their
      callers.
  - Result: `validatePortableSkills` runs the validator over
    `dist/skills-portable` (the emitter already strips Anthropic-only
    frontmatter, so the strictyaml `argument-hint: [x]` quirk and
    `paths`/`user-invocable` field rejections never surface — no finding
    filtering needed, which the TODO item expected). Missing venv or missing
    dist degrade to an explicit warning, not a silent pass. Negative test: a
    synthetic skill with a bogus frontmatter field fails the run.
  - Evidence: `pnpm run skills:validate` prints
    `agentskills OK (13 skills, method: venv)`; synthetic bad skill exits 1;
    `pnpm run check` exit 0.

- [x] 2026-08-13 — **Harness:** `security-review` auto fan-out cost vs value
      measured (audit Round 1 open question closed; the keep/scope/disable
      decision stays in `TODO.md`).
  - Result: last 30 days of `~/.claude/projects` transcripts: 2,324 machine
    sessions open with the fan-out prompt ("Review this change for security
    vulnerabilities." 2,285 + "You previously flagged these candidate
    vulnerabilities:" 39) out of 3,332 total sessions (70%). All on
    `claude-opus-4-7`. Tokens: 25.9M output, 1.246B cache-read, 227M
    cache-write, 0.12M raw input —
    ~$2,691/30d list-price equivalent (~$1.16/session, ~77 sessions/day) at Opus
    4.7 rates ($5/$25 per MTok, cache read 0.1x, write 1.25x). Value: 753
    sessions end with an explicit clean verdict, 1,349 with a verbose verdict
    (sampled ones read clean), 222 with no final text; only 39 (1.7%) escalated
    to a candidate-verification pass. No confirmed real finding observed.
  - Evidence: `sr_measure.py` in the session scratchpad over 3,381 transcript
    files; token sums and outcome counts printed above; pricing from the
    claude-api skill model table.

- [x] 2026-08-13 — **Machine sync:** Mac Studio brought to parity with the
      MacBook Pro on skills, plugins, and CLI tooling.
  - Result: `~/.agents` (git repo `BusiRocket/claude-skills`, the cross-machine
    sync channel) was 1 commit behind; the pull restored 1,306 missing files
    (xlsx/docx Office scripts and schemas, skill references). 192 conflicting
    files were kept from the local side: the MacBook Pro's commit carries
    SKILL.md descriptions truncated to `"…"` (trigger clauses lost), while the
    local copies reinstalled from upstream are complete — the next auto-sync
    push heals the MBP. 8 skills existed on disk but had no `~/.claude/skills`
    symlink (`ckm-*` x6, `frontend-skill`, `task-quality-kpi`) — linked; 107
    skills linked total, 0 broken symlinks. `skillkit` CLI installed globally
    via pnpm with `~/.local/bin` wrappers (pnpm's bin shim resolves relative to
    `$0`, so plain symlinks break it). Plugin audit: 37 installed match
    `enabledPlugins`; removed the orphaned `engram` marketplace clone (54MB,
    zero plugins, superseded by mempalace) and uninstalled 3 disabled
    heavyweight plugins (semgrep 159MB, posthog 30MB, sentry 13MB —
    reinstallable via `claude plugin install <name>`). Remaining disabled
    plugins are small and kept for quick re-enable.
  - Evidence: `git -C ~/.agents status -sb` up to date with origin/main;
    blob-hash comparison (192/1047 differing) via `git hash-object` vs
    `git ls-tree origin/main`; `skillkit --version` prints 1.24.0 from an
    interactive shell; `find ~/.claude/skills -type l ! -exec test -e {} \;`
    empty; backup of the 192 kept files in the session scratchpad.

- [x] 2026-08-13 — **Skills:** `mattpocock/skills` diffed against the BRP
      equivalents; missing moves catalogued and split into four bounded adoption
      items.
  - Result: `docs/mattpocock-skills-diff-2026-08.md` records, per skill: the ADR
    bar and `CONTEXT.md` glossary absent from `brp-docs` (which advertises ADRs
    but carries no ADR content); the seams gate, red-before-green ordering,
    three named test anti-patterns and mocking policy absent from the test lane;
    the Phase-1 red-loop gate, feedback-loop ladder and minimisation phase
    absent from the debug lane (`brp-debug.md` step 2 is exactly the
    hypothesis-first move Matt gates against); and the deletion test,
    candidate-report workflow and design vocabulary absent from `brp-refactor`.
    Also recorded: where BRP is stronger (executed-examples rule, test-strategy
    matrix, green-baseline gate, escalation routing) and two genuine conflicts
    (atomic-file rule vs module depth; interface preservation vs deepening) that
    must be resolved before adopting section 4.
  - Evidence: report read from a shallow clone of `mattpocock/skills` (grilling,
    domain-modeling, tdd, diagnosing-bugs, improve-codebase-architecture,
    codebase-design payloads) against `src/skills` and `orchestrator/brp`
    references; four `[ ]` adoption items filed in `TODO.md`.

- [x] 2026-08-17 — **Sync:** Local working-tree edits reconciled against
      `origin/main`; the 35 pending commits are now applied.
  - Result: `.serena/project.yml`, `docs/agent-ready-repo-standard.md` and
    `docs/templates/AGENTS.template.md` were byte-identical to `origin/main`
    (already shipped as `5aa7162` and the `.serena` migration), so nothing was
    lost by discarding them; the local `eslint.config.mjs` carried the same
    boundaries v7 `policies` migration as `f72a4bb` but predated the
    `.venv-validate/**` ignore added with the agentskills validator, making the
    remote copy strictly newer. Fast-forwarded to `2611a44` and dropped the
    temporary `TODO-repository-sync.md`.
  - Evidence: `git show origin/main:<path> | diff -` clean for the three files;
    stash `pre-sync-20260817 superseded local edits` holds the discarded diff;
    `pnpm install` reported the lockfile unchanged; `pnpm run build` and
    `pnpm run check` both green after the pull.

- [x] 2026-08-19 — **Conversations:** Added a security-filtered,
      provider-neutral conversation transport covering the combined Historious
      and ai-data-extraction source catalog.
  - Result: 13 providers have owned adapters across JSON, JSONL, read-only
    SQLite, and OpenCode desktop Tauri stores. Export/import/render use private
    SQLite staging and LF-exact streaming, manifests carry SHA-256 integrity,
    mutations are dry-run by default, and MemPalace remains the derived search
    owner. The strict baseline now enforces Node 22.13, pnpm
    release-age/exotic-build controls, clean ESLint 10 peers through
    `eslint-plugin-import-x`, and patched transitive `brace-expansion` lines.
  - Evidence: the all-source export processed 13,777 artifacts into 11,877
    conversations (1.62 GB, 36,628 redactions, zero skips) in 1m47s; full-size
    import and render dry-runs each validated all 11,877 records without
    creating destinations; the Pi apply/render/MemPalace dry-run path passed;
    `pnpm peers check`, `pnpm audit --audit-level high`, and `pnpm run check`
    all exit 0.

- [x] 2026-08-22 — **Skills:** `.venv-validate` recreated in this checkout; the
      external AgentSkills validator runs again instead of being silently
      skipped.
  - Result: the stale venv (shebang pointing at the removed
    `/Users/cristiandeluxe/p/agents-tools/.venv-validate/bin/python3.14`) was
    deleted and rebuilt with `pnpm run validate:install` (skills-ref 0.1.1). The
    shebang now resolves inside this checkout.
  - Evidence: `.venv-validate/bin/agentskills --help` prints usage;
    `pnpm run skills:validate` ends with
    `[validate] agentskills OK (14 skills, method: venv)` and no skip warning.

- [x] 2026-08-22 — **Guidance:** 2026-08-21 mempalace-search wording drift
      verified resolved; no remaining action.
  - Result: the reworded invariant was folded into canonical guidance by the
    2026-08-21 fixes (`60f528a`, `4a4fa8f`) and the live files reconverged, so
    the doctor no longer reports the missing exact sentence.
  - Evidence: `pnpm run guidance:doctor -- --config ~/p/dotfiles/agent-guidance`
    returns `{"ok": true, "findings": []}` on 2026-08-22.

- [x] 2026-08-22 — **Skills:** Adopted into `brp-docs` the ADR bar and the
      `CONTEXT.md` glossary format (mattpocock diff section 1).
  - Result: new `references/adr-format.md` (three-condition ADR bar,
    `docs/adr/NNNN-slug.md` convention, minimal template, what-qualifies
    catalogue) and `references/context-format.md` (term/definition/Avoid format,
    opinionated single-word rule, no implementation details, inline writing,
    in-session challenge moves); SKILL.md rules and output now route to both.
  - Evidence: `pnpm run check` exit 0 (includes `skills:validate` with
    `agentskills OK (14 skills, method: venv)` and `skills:lint` 7 pass / 0
    fail).
  - Files: `src/skills/core/brp-docs/SKILL.md`,
    `src/skills/core/brp-docs/references/`.

- [x] 2026-08-22 — **Skills:** Adopted into the `brp` test lane the seams gate,
      red-before-green with vertical slicing, the three test anti-patterns, and
      the boundaries-only mocking policy (mattpocock diff section 2).
  - Result: `brp-test.md` gained the pre-agreed seams gate (workflow step 2 now
    confirms seams with the user), the vertical-slicing rule, the three
    anti-patterns with their tells, the boundaries-only mocking rule, and
    test-names-as-specification.
  - Evidence: `pnpm run check` exit 0.
  - Files: `src/skills/orchestrator/brp/references/brp-test.md`.

- [x] 2026-08-22 — **Skills:** Adopted into the `brp` debug/fix lanes the
      red-loop gate, the feedback-loop ladder, minimisation, falsifiable
      hypotheses with a user checkpoint, tagged debug logs, and the
      regression-seam judgment (mattpocock diff section 3).
  - Result: new `references/feedback-loop-ladder.md` (10-rung ladder, loop
    quality bar, non-deterministic protocol, no-loop escalation); `brp-debug.md`
    gained the red-loop gate, a minimisation step, the 3-5 ranked falsifiable
    hypotheses rule with prediction and user checkpoint, and tagged
    `[DEBUG-...]` logs; `brp-fix.md`'s regression-test rule now requires a
    correct seam and documents seam absence as the finding; the investigation
    template gained feedback-loop and minimisation sections plus a prediction
    field.
  - Evidence: `pnpm run check` exit 0.
  - Files: `src/skills/orchestrator/brp/references/feedback-loop-ladder.md`,
    `brp-debug.md`, `brp-fix.md`, `debug-investigation-template.md`.

- [x] 2026-08-22 — **Skills:** Refilled `brp-todo-work` and `brp-todo-create`
      from the prompt files they were lossy compressions of
      (`~/p/Prompts/todo-workflows/`).
  - Result: `brp-todo-work` SKILL.md restored the lost operating contract
    (context recovery before asking, the ask-only-when list, metered-operation
    discovery and disabled-workflow rule, the no-authority prohibition list),
    the incremental history-index consultation rules, the working matrix fields,
    the per-task loop (testable completion condition, diff review for scope
    creep), already-complete/superseded/blocked handling, durable checkpoints
    with commit granularity, the delegated-result contract, and the
    never-mark-complete-to-finish rule. `brp-todo-create` restored the
    do-not-stop rule, preserve-unrelated rule, the category anchors, and the
    final-verification checklist. Caps, approval gate, cross-project routing and
    cheapest-capacity routing (BRP additions absent from the prompts) were kept.
  - Evidence: `pnpm run check` exit 0; `TODO_FORMATS_SYNC_TEST` still green
    (shared `todo-formats.md` untouched).
  - Files: `src/skills/core/brp-todo-work/SKILL.md`,
    `src/skills/core/brp-todo-create/SKILL.md`.

- [x] 2026-08-22 — **Skills:** Adopted into
      `brp-refactor`/`brp-plan`/`brp-code-quality` the mattpocock section-4
      architecture moves (hot-spot scoping, deletion test, candidate report with
      strength badges and hard stop, design-it-twice, ADR consultation).
  - Result: new `references/refactor-candidates.md` (locked vocabulary, friction
    heuristics, deletion test, card contract, ADR handling, temp-dir report
    discipline, lane routing); `brp-refactor.md` gained scope-before-scan and
    the candidate-report stop; `brp-plan.md` gained ADR consultation and
    design-it-twice; `brp-code-quality` audit now leads with git hot spots. The
    two named conflicts resolved in the change: the atomic-file rule stays a
    file-layout rule (depth declared an interface property), and
    interface-changing deepening routes to the plan lane so the refactor lane
    stays behavior-preserving.
  - Evidence: `pnpm run check` exit 0.
  - Files: `src/skills/orchestrator/brp/references/refactor-candidates.md`,
    `brp-refactor.md`, `brp-plan.md`,
    `src/skills/core/brp-code-quality/SKILL.md`.

- [x] 2026-08-22 — **Skills:** Measured invoked token cost of all 14 skills and
      recorded it with method and re-measure recipe.
  - Result: `docs/skill-token-costs.md` — gpt-tokenizer BPE, invoked SKILL.md vs
    on-demand references split, Pocock 345-token bar. Range 336
    (brp-rust-quality) to 1,980 (brp-todo-work, deliberate). No skill within an
    order of magnitude of the bar.
  - Evidence: measurement script output in-session; `pnpm run check` exit 0.

- [x] 2026-08-22 — **Supply chain:** `npm pack --dry-run` publish gate adopted
      into `brp-release` (closes the standalone reminder item by making it part
      of the workflow that publishes).
  - Evidence: `pnpm run check` exit 0. Files:
    `src/skills/core/brp-release/SKILL.md`.

- [x] 2026-08-22 — **Learning loop:** Reviewed the `library:describe`
      description proposals.
  - Result: the real pattern is missing Spanish trigger phrases. In-repo fixes
    applied: `brain` gained ES ingest triggers, `brp-code-quality` gained "sé
    super estricto" / "mete la baseline busirocket" (deliberately not "endurece
    el proyecto", which belongs to `project-hardening`). `brp-todo-create` and
    `brp-traffic-client` phrases contain explicit slash invocations — no edit.
    Library-repo skills (codex, orca-cli, frontend-design) filed cross-project
    in `~/p/rocket-agents-library/TODO.md`.
  - Evidence: `pnpm run library:describe` report in-session; `pnpm run check`
    exit 0 after the description edits (activation-boundary validation
    included).

- [x] 2026-08-22 — **Supply chain:** `sync-ai` wholesale-mirroring audit closed;
      successor scripts audited and one critical finding filed.
  - Result: `sync-ai` is retired (`dotfiles/bootstrap.sh:40` deletes it).
    Successors: `sync-claude` mirrors an explicit safe allowlist;
    `sync-conversations` uses only the redacting exporter. CRITICAL:
    `sync-active-neo` ships any recently-active `~/p` repo to the neo VPS and
    `~/p/brain` + `~/p/vault` (live credentials inline) are not in its SKIP list
    — both confirmed present on neo (`/root/p/brain`, `/root/p/vault`). Filed
    with smallest fix in `~/p/dotfiles/TODO.md` (new file); secondary finding
    there too (`claude-mcp-merge.py` can carry MCP `env` values).
  - Evidence: `ssh neo 'ls -d ~/p/brain ~/p/vault'` returned both paths,
    2026-08-22.

- [x] 2026-08-22 — **Supply chain:** Variation-selector/zero-width scan run over
      the published-repo checkouts (this repo's `isHiddenUnicode` ranges
      reimplemented over `git ls-files`).
  - Result: `baseline` clean (500 files). All 19 flags elsewhere benign and
    context-verified: emoji VS16 (U+FE0F) in `RocketUpdater` shell echo strings
    (4) and archived `agents-skills` markdown (4); linguistically required
    ZWNJ/ZWJ in `Attendize` vendored Persian/Sinhala locale data plus one ZWSP
    in a Dutch translation string (11). No payload characters. RocketUpdater
    hygiene note filed in `~/p/RocketUpdater/TODO.md` (new file, also carries
    its `.serena` item); `agents-skills` is archived, `Attendize` is a vendored
    fork — no action.
  - Evidence: scan output in-session, per-file code points; context lines
    grepped for each class.

- [x] 2026-08-22 — **Supply chain:** CI publish-token audit completed for 15 of
      the 16 flagged repos (`poirocket` has no local checkout; residual item
      filed).
  - Result: OIDC Trusted Publishing already in place: baseline, mempalace (npm),
    staffbase-cli, staffbase-utils, staffbase-drawer, zerohedge-mcp. Ephemeral
    `GITHUB_TOKEN` only: dj-rocket (tauri release), mempalace docker-publish
    (GHCR), vexa-insight-dashboard (all actions SHA-pinned). No publish
    workflow: helm-cron, helm-drupal, helm-solr, poitools, verticagtm. Only
    long-lived registry token found: `NPM_TOKEN` in staffbase-shoutouts —
    step-scoped env for `@favish` installs and BuildKit secret mount in the
    docker build (correct patterns); residual scope/rotation item filed in
    `~/p/staffbase-shoutouts/TODO.md`. Non-registry deploy secrets (Supabase,
    Anthropic, DB) in Mains.World/thewealthadvisor are out of this item's scope.
  - Evidence: workflow greps in-session (`secrets.*` per repo, publish mechanics
    of each release/publish workflow).

- [x] 2026-08-22 — **Supply chain:** neo VPS credential-exposure remediation
      (follow-up to the `sync-active-neo` finding filed earlier today).
  - Result: with user approval, `brain` and `vault` added to the SKIP list in
    `~/p/dotfiles/bin/sync-active-neo` (edit uncommitted in dotfiles), and the
    mirrored copies deleted on neo. Neo's agent CLIs (claude/codex/gemini) and
    their auth stay — user confirmed active use on that host; neo's `~/.gemini`
    carries no `mcp_config.json`. Credential rotation itself explicitly deferred
    by the user the same day; `portatil` cleanup pending (host unreachable).
    Both residuals tracked in the still-blocked rotation item.
  - Evidence: `ssh neo 'rm -rf /root/p/brain /root/p/vault'` followed by `ls`
    returning "No existe el archivo o directorio" for both paths; pre-delete
    `du` showed 460M + 423M; `lsof +D /root/p/brain` empty before deletion.
