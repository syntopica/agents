#!/usr/bin/env bash
# Background jobs get launched without a stall guard, and the rule saying to arm
# one is easy to read past. This fires at the moment it matters: the Bash call
# that puts a job in the background.
#
# It never blocks. It adds one line of context asking for the guard and for the
# progress artifact to be named, because the failure being prevented is a job
# that stays alive, busy and stalled until somebody happens to look - twice in
# this estate for 19 h and for 1h47m.
#
# Silent when the command is not backgrounded, when it already carries a guard
# (`timeout`, `--kill-after`, a watcher script), or when it is a short-lived
# command that cannot stall for hours.
set -uo pipefail

input=$(cat 2>/dev/null || true)
[ -n "$input" ] || exit 0

printf '%s' "$input" | python3 -c '
import json, re, sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)

if payload.get("tool_name") != "Bash":
    sys.exit(0)

tool_input = payload.get("tool_input") or {}
command = tool_input.get("command") or ""
backgrounded = bool(tool_input.get("run_in_background"))

# A trailing & backgrounds; && does not. Same for a & that opens a pipeline
# segment mid-command, which is why the match is anchored to a line end.
if not backgrounded:
    backgrounded = bool(
        re.search(r"(?<!&)&\s*$", command, re.MULTILINE)
        or re.search(r"\b(nohup|setsid|disown)\b", command)
    )

if not backgrounded:
    sys.exit(0)

# Already guarded: a per-item timeout, or a watcher launched alongside.
if re.search(r"\b(timeout|gtimeout)\b|--kill-after|watch-progress|stall-guard|watchdog", command):
    sys.exit(0)

# Commands that cannot burn a night unobserved are not worth a reminder.
if re.match(r"^\s*(sleep|echo|printf|true|:)\b", command):
    sys.exit(0)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": (
            "This backgrounds a job with no stall guard. Before reporting it as running: "
            "arm a watchdog in the same turn on the artifact that must move (output file "
            "mtime, a counter, the log), bound each work item with "
            "`timeout --kill-after=30s <duration>`, and say in the report which artifact is "
            "watched and what threshold kills it. Liveness, %CPU and elapsed time are not "
            "progress. To stop a stuck run later, signal the process group "
            "(`kill -TERM -<pgid>`), not the script pid - bash defers its trap until the "
            "blocked pipeline returns."
        ),
    }
}))
' 2>/dev/null || exit 0
exit 0
