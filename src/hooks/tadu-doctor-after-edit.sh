#!/usr/bin/env bash
# Sessions edit TODO.md and TODO_LOG.md and commit without running `tadu
# doctor`: 112 of 183 sessions did between 2026-10-12 and 2026-10-19, and the
# daily round then found closed items left active and missing rule blocks. This
# runs doctor right after the edit, while the session can still fix it.
#
# It never blocks. Silent when the edit touches no backlog file, when the
# repository has no TODO.md, and when doctor reports no error; warnings are
# left to the daily round. Otherwise it adds the error lines as context, or one
# line saying tadu is missing or did not run. TADU_BIN overrides the binary,
# for tests.
set -uo pipefail

input=$(cat 2>/dev/null || true)
[ -n "$input" ] || exit 0

printf '%s' "$input" | python3 -c '
import json, os, re, shutil, subprocess, sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)

BACKLOG = ("TODO.md", "TODO_LOG.md", "TODO_HISTORY_INDEX.jsonl")
tool = payload.get("tool_name")
tool_input = payload.get("tool_input") or {}
cwd = payload.get("cwd") or os.getcwd()
root = None

if tool in ("Edit", "Write", "MultiEdit"):
    path = tool_input.get("file_path") or ""
    if os.path.basename(path) in BACKLOG:
        root = os.path.dirname(os.path.abspath(path))
elif tool == "Bash":
    command = tool_input.get("command") or ""
    closes = re.search(r"\btadu\s+close\b", command) and "--write" in command
    writes = re.search(r"TODO(_LOG)?\.md|TODO_HISTORY_INDEX", command) and re.search(
        r"open\(|write_text|sed\s+-i|>>?|\btee\b|\bmv\b|\bcp\b|\bpatch\b|\bperl\s+-[a-z]*i", command
    )
    if closes or writes:
        # A leading `cd <dir> &&` names the repository; the text is read, never run.
        lead = re.match(r"\s*cd\s+([^\s;&|]+)\s*(&&|;)", command)
        start = os.path.expanduser(lead.group(1).strip("\"\x27")) if lead else cwd
        start = start if os.path.isabs(start) else os.path.join(cwd, start)
        try:
            root = subprocess.run(
                ["git", "-C", start, "rev-parse", "--show-toplevel"],
                capture_output=True, text=True, timeout=5,
            ).stdout.strip() or start
        except Exception:
            root = start

if not root or not os.path.isfile(os.path.join(root, "TODO.md")):
    sys.exit(0)

def say(text):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PostToolUse", "additionalContext": text}}))
    sys.exit(0)

tadu = os.environ.get("TADU_BIN") or shutil.which("tadu") or os.path.expanduser("~/.local/bin/tadu")
if not os.path.isfile(tadu):
    say("This edit touched the tadu backlog in " + root + ", but tadu is not installed, so it "
        "could not be checked. Install it with `uv tool install git+https://github.com/syntopica/tadu` "
        "(or `uv tool install --editable ~/p/tadu` on the owner machines) and run `tadu doctor .`.")
try:
    run = subprocess.run([tadu, "doctor", root], capture_output=True, text=True, timeout=10)
except subprocess.TimeoutExpired:
    say("`tadu doctor " + root + "` timed out after 10s; run it by hand before committing.")
except OSError as error:
    say("`tadu doctor " + root + "` could not start (" + str(error) + "); run it by hand.")
if run.returncode == 0:
    sys.exit(0)
errors = [line for line in run.stdout.splitlines() if re.search(r": error [A-Z]\d+ ", line)]
if run.returncode != 1 or not errors:
    tail = (run.stderr or run.stdout).strip().splitlines()[-1:] or [""]
    say("`tadu doctor " + root + "` did not run (exit " + str(run.returncode) + "): " + tail[0][:200])
shown = "\n".join(errors[:20]) + ("\n..." if len(errors) > 20 else "")
say("`tadu doctor " + root + "` reports " + str(len(errors)) + " error(s) after this edit. If the "
    "paired TODO.md / TODO_LOG.md edit is still to come, recheck after it; otherwise fix them "
    "before committing (`tadu close` moves an item and writes its log entry):\n" + shown)
' 2>/dev/null || exit 0
exit 0
