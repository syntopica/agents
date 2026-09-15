# The Vexa store and CLI, as they actually behave

Measured on 2026-09-07 while filing 306 messages across two accounts. Re-check
anything here that a command contradicts; several of these were bugs that have
since been fixed, and the fix changed the answer.

## Reading

`vexa folders list <account>` prints placement count, role, display name and
path. The path is the wire path and the last column on purpose: it is what
`move` demands back, byte for byte, modified UTF-7 included
(`INBOX.Clientes.Iris C&AOE-ceres`). `move` refuses a destination the store has
never recorded, so nothing is created by a typo - and a folder with no messages
is still listed, because an empty folder is exactly the destination a routing
pass is looking for.

`vexa messages --account <a> --folder-role inbox` is the inbox. Two traps that
cost real time:

- **`--folder-role` was silently ignored on `messages` until 2026-09-07.** It
  was accepted and did nothing, so `inbox`, `archive` and no flag alike returned
  every message in the account - 9856 rows for an inbox holding 17. If a count
  looks like the whole account, check the binary before trusting it.
- **`vexa messages` is not a placement query in older builds.** Cross-check a
  surprising count against `vexa folders list`, which counts placements.

`vexa sender-profiles` is the cheap prior: `is_noreply`, `list_count`,
`replied_count`, `prior_type` and `prior_topic` per sender. `replied_count > 0`
is the single most useful bit in a triage pass - it separates correspondents
from broadcasters without reading anything.

Enrichment (`type`, `priority`, `requires_reply`, `extracted_items`) is worth
reading and worth distrusting: on 2026-09-07, 81% of mail since 1 August had no
enrichment row at all, and the newest row of any kind was three weeks old,
because nothing enriches new mail automatically. Empty fields mean "never
classified", not "nothing to do".

## Mutating

    vexa move <account> <folder> <dest> --from a@x --from b@y
    vexa trash <account> <folder> --from a@x
    # --dry-run prints {"dry_run":true,...,"would_move":N} and touches no network

`--from` is repeatable and selects across the whole folder, uncapped by
`--limit`. **In zsh, build the arguments as an array** - `$ARGS` unquoted is not
word-split, so ten `--from` flags arrive as one argument and `would_move` comes
back as 1:

    typeset -a A; A=()
    while read -r s; do A+=(--from "$s"); done < senders.txt
    vexa move "$acct" INBOX "$dest" "${A[@]}" --dry-run --json

A real run prints one JSON line: `moved`, `failed` (ids the provider refused),
`store_failed` (moved on the server, not yet reconciled locally - the next sync
heals these) and `already_at_dest`.

Cost, measured: about **10 s per invocation** plus about **1 s per message**. 73
invocations moving 269 messages took 311 s; 23 invocations moving 28 took 328 s.
Batch by destination or pay for it. Anything over a few dozen rules runs in the
background, watched by an artifact that must move - the log's line count, or the
mailbox count on the server - never by the process being alive.

## Failure table

| What you see                                                                | What it means                                                                                                                                                                          | Do this                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine socket read failed: Resource temporarily unavailable (os error 35)` | Transient. Nothing moved.                                                                                                                                                              | Retry the same command once. It worked on the retry every time.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `engine socket closed before a done frame arrived`                          | The engine restarted mid-run. **The moves may have happened anyway** - the lost frame is the report, not the work.                                                                     | Re-run it; already-moved ids come back under `already_at_dest`, so it is safe and idempotent.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `engine protocol/schema mismatch: close the app or update the CLI`          | The background engine is older than the CLI.                                                                                                                                           | `launchctl kickstart -k gui/$(id -u)/com.vexamail.engine`, then retry.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Schema skew: database is at version N ... binary writes N-k`               | Something newer migrated the store past the installed binaries. Reads still work, so the mailbox looks fine and is stale; the installed engine is in a 60 s retry loop (`engine.log`). | Back the store up (`sqlite3 ... .backup`), build HEAD (`cargo build --bins` + `pnpm tauri build --debug --bundles app`, ~25 min), `scripts/install-vexa.sh`, `launchctl kickstart -k gui/$(id -u)/com.vexamail.engine`, and only then `vexa --allow-migration <write verb> --dry-run` to migrate: `--allow-migration` refuses while the live engine reports the old version. Measured 2026-09-15, 63 to 68 on a 10 GB store. Never migrate to suit a debug CLI while the installed app is behind. |
| `failed` holds ids                                                          | The provider refused those specific messages.                                                                                                                                          | Retry once, then report them individually. Do not silently drop them.                                                                                                                                                                                                                                                                                                                                                                                                                             |

The whole class is one hazard: `~/.local/bin/vexa` is a symlink into a debug
build, so any rebuild or app relaunch changes what `vexa` means mid-pass, in
either direction. When several commands start failing at once, check the binary
and the engine before doubting the mailbox.

## Attachments

`vexa attachment <message> --all` **skips inline attachments** and can answer
"this message has no attachments to write" for a message that plainly has ten.
Fetching them one id at a time works. Get the ids from
`vexa message <id> --json`.
