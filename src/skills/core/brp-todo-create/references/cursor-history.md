# Reading Cursor Conversation History

Cursor stores composer chats in a SQLite database, not in files. Read it with
exact queries; do not guess at the schema.

## Location

- macOS: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- Linux: `~/.config/Cursor/User/globalStorage/state.vscdb`
- Windows: `%APPDATA%/Cursor/User/globalStorage/state.vscdb`

Older Cursor versions also keep per-workspace chat state in
`User/workspaceStorage/<hash>/state.vscdb` under the `ItemTable` table; check
those only when the global database has no `composerData` keys.

## Schema and queries

Two tables: `ItemTable` and `cursorDiskKV` (both `key TEXT, value BLOB`).
Conversations live in `cursorDiskKV`:

- `composerData:<composerId>` — one JSON blob per conversation (metadata, title,
  context).
- `bubbleId:<composerId>:<bubbleId>` — one JSON blob per message in that
  conversation.

Always open read-only so a live Cursor process is never disturbed:

```bash
sqlite3 "file:$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb?mode=ro" \
  "SELECT key FROM cursorDiskKV WHERE key LIKE 'composerData:%';"

sqlite3 "file:...state.vscdb?mode=ro" \
  "SELECT value FROM cursorDiskKV WHERE key = 'composerData:<composerId>';"

sqlite3 "file:...state.vscdb?mode=ro" \
  "SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:<composerId>:%';"
```

## Index identity

- `conversation_id` for `TODO_HISTORY_INDEX.jsonl` is the `composerId` (stable,
  provider-native).
- The change fingerprint is a hash over the conversation's bubble keys plus the
  `composerData` blob; bubble count alone misses edits.
- Filter conversations to the current repository by matching workspace paths
  inside the `composerData` JSON before parsing bubbles; unmatched conversations
  are `irrelevant`.
