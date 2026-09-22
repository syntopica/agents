#!/usr/bin/env bash
# Pausing a job to relieve system load looks reversible and is not. A progress
# guard watches an artifact, so a paused job and a hung one are the same
# observation: alive, nothing moving. On 2026-09-08 an `igir` run was paused
# with `kill -STOP` and its stall guard killed the group 32 minutes later, while
# the session that paused it had already reported the job as safely suspended.
#
# This fires at the moment it matters: the Bash call carrying the stop signal.
#
# It never blocks. It adds one line asking for the target's guard to be found
# first, and names `renice` as the move that actually relieves load without
# starting someone else's kill timer.
#
# Silent on every other command, including `kill -CONT`, ordinary termination
# signals, and the words "stop" or "suspend" in unrelated positions.
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

command = (payload.get("tool_input") or {}).get("command") or ""

# `kill -STOP`, `kill -19`, `kill -s STOP`, `killall -STOP`, `pkill -STOP`, and
# the same for TSTP. The signal has to sit in a flag position: a bare "STOP" in
# a path or a message is not a signal, and -19 is only a signal after a dash.
stop_signal = re.search(
    r"\b(kill|killall|pkill)\b[^|;&\n]*?"
    r"(-(?:s\s+)?(?:SIG)?(?:STOP|TSTP)\b|-19\b|-(?:SIG)?TSTP\b)",
    command,
)
if not stop_signal:
    sys.exit(0)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": (
            "This suspends a process rather than slowing it. A stall guard cannot "
            "distinguish a paused job from a hung one - both are alive with a frozen "
            "artifact - so SIGSTOP on a guarded job is a delayed SIGKILL on a timer you "
            "did not set. Before sending it: confirm this session started the target, and "
            "look for a guard around it (a `timeout` wrapper, a `*-stall-guard.sh`, a "
            "`guard-*.out` in the repo cache) plus the TODO of the repo that owns it. To "
            "relieve CPU without that risk use `renice +10 -p <pid>`, which lets the "
            "artifacts keep moving; to relieve disk contention there is no safe unilateral "
            "move - report it and let the session that owns the job decide."
        ),
    }
}))
' 2>/dev/null || exit 0
exit 0
