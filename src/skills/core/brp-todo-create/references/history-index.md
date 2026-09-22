# `TODO_HISTORY_INDEX.jsonl`

A machine-readable coverage index, not a conversation archive. One current JSON
record per stable `source` + `conversation_id`, sorted by those fields, at the
repository root:

```json
{
  "source": "codex",
  "conversation_id": "019abc...",
  "source_ref": "optional-safe-locator",
  "source_updated_at": "2026-07-23T10:15:00Z",
  "source_fingerprint": "sha256:...",
  "reviewed_through": "final-event-id-or-timestamp",
  "review_status": "complete",
  "reviewed_at": "2026-07-23T11:00:00Z",
  "review_version": 1
}
```

Records are written as one JSON object per line; the block above is expanded
only for readability.

## Statuses

- `complete` — everything through `reviewed_through` was reviewed and reconciled
- `partial` — only a known range was reviewed
- `inaccessible` — discovered but unreadable
- `irrelevant` — verified not to belong to this project

## Rules

Before parsing conversation content, stream the existing index instead of
loading it into context, inventory conversations by provider-native stable ID,
and compute a cheap fingerprint plus a last-event cursor. Hashing a transcript
to detect change is fine; semantically reparsing it to decide whether it changed
is not.

- Skip `complete` and `irrelevant` records whose fingerprint and
  `review_version` are unchanged.
- For a changed conversation, read only content after `reviewed_through` when
  the format allows reliable incremental reading; otherwise reparse it and
  replace the record.
- Retry `partial` and `inaccessible` records only when their source or access
  condition changed.
- Use a content hash as identity only when the provider exposes no stable
  conversation ID.
- Never store message text, prompts, secrets, absolute private paths or
  extracted findings. `source_ref` must be a safe opaque ID or portable locator.
- Update a record only after its findings are deduplicated and written to
  `TODO.md` or `TODO_LOG.md`. An interrupted batch stays `partial`. Write
  atomically, one record per key.
- `review_version` is the extraction policy, not the run date. Increment it only
  after a material change to what counts as a recoverable task, and never
  backfill `complete` records from aggregate claims such as "404 sessions were
  reviewed" without provable IDs and ranges.

## Second pass

Before finishing, use the index to find skipped ranges, duplicate records,
changed fingerprints and untracked sources; confirm every `complete` record was
written only after reconciliation, and that partial or inaccessible coverage is
still reported honestly.
