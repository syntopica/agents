#!/usr/bin/env bash
# Measured on 2026-11-11: 92% of a week's Claude Max quota went to interactive
# sessions, and the costliest ones carried 150k-220k tokens of cached context
# into every turn - including small, localized tasks that needed none of it.
# Each turn re-reads the whole context, so a one-line fix asked at turn 700 of a
# long session costs as much as the session's history.
#
# This fires on UserPromptSubmit. It reads the context size of the last main
# assistant turn from the transcript and, above a threshold, asks Claude to
# hand localized tasks to a fresh context (the repository TODO for the bot, a
# subagent, or /clear) instead of solving them here, and tells the user once.
#
# It never blocks. Threshold: CONTEXT_GUARD_TOKENS (default 150000). Silent
# below it, on a missing or unreadable transcript, and on malformed input.
set -uo pipefail

input=$(cat 2>/dev/null || true)
[ -n "$input" ] || exit 0

printf '%s' "$input" | python3 -I -c '
import json, os, sys

try:
    payload = json.load(sys.stdin)
    threshold = int(os.environ.get("CONTEXT_GUARD_TOKENS", "150000"))
except Exception:
    sys.exit(0)

path = payload.get("transcript_path") or ""
try:
    with open(path, "rb") as handle:
        handle.seek(0, os.SEEK_END)
        handle.seek(max(0, handle.tell() - 4_000_000))
        lines = handle.read().decode("utf-8", "replace").splitlines()
except Exception:
    sys.exit(0)

context = None
for line in reversed(lines):
    try:
        entry = json.loads(line)
    except Exception:
        continue
    if entry.get("type") != "assistant" or entry.get("isSidechain"):
        continue
    usage = (entry.get("message") or {}).get("usage") or {}
    if not usage:
        continue
    context = sum(int(usage.get(key) or 0) for key in (
        "input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"))
    break

if context is None or context < threshold:
    sys.exit(0)

size = f"{context // 1000}k"
print(json.dumps({
    "systemMessage": (
        f"Context is {size} tokens; every turn re-reads it. Localized or unrelated "
        "tasks are cheaper in a fresh session or queued in the repo TODO for the bot."
    ),
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": (
            f"This session already carries {size} tokens of context, and every turn "
            "re-reads all of it against the owner'"'"'s weekly quota. If this prompt is a "
            "localized task that does not depend on the conversation so far, still do "
            "it: never defer an authorized task to a TODO or a subagent for cost alone. "
            "Say once that a fresh session would be cheaper for such work. When the "
            "current task is done, suggest /clear before the next one."
        ),
    },
}))
'
exit 0
