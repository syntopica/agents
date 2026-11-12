#!/usr/bin/env bash
set -euo pipefail

# BRP SessionStart reminder.
# Injects a terse protocol reminder into the model's additional context via hookSpecificOutput.
# Exits 0 always; hook failure must never block session start.

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "BRP active. Deliverables state the command that verifies them; do not claim done without running it."
  }
}
JSON
