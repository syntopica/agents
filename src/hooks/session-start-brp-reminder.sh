#!/usr/bin/env bash
set -euo pipefail

# BRP SessionStart reminder.
# Injects a terse protocol reminder into the model's additional context via hookSpecificOutput.
# It also carries the skill-check rule the Superpowers plugin injected at session start
# before that plugin was disabled on 2026-10-19: without it, process skills such as
# brainstorming and writing-plans stopped triggering on their own.
# Exits 0 always; hook failure must never block session start.

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "BRP active. Deliverables state the command that verifies them; do not claim done without running it. Prefer the skill for a task over improvising: brp-traffic-client (captured traffic to HTTP client), brp-release (versioned release), brp-docs (docs and ADRs).\n\nSkill check (skip if you were dispatched as a subagent for a specific task): before any response or action on a task, including clarifying questions and exploring files, check the listed skills, and if there is even a small chance one applies, invoke it with the Skill tool and follow it. Process skills come first and set the approach; implementation skills follow. Building, adding or changing behavior: brainstorming, then writing-plans, then executing-plans or subagent-driven-development. A bug, failing test or unexpected behavior: systematic-debugging before proposing a fix. About to claim done: verification-before-completion. Review feedback: receiving-code-review. Before entering plan mode, brainstorm first. Thoughts like 'this is simple', 'let me look at the code first' or 'the skill is overkill' are the cue to check, not to skip. The owner's instructions (CLAUDE.md, direct requests) override skills."
  }
}
JSON
