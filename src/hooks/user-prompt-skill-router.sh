#!/usr/bin/env bash
set -uo pipefail

# UserPromptSubmit skill router.
# Routes the prompt to a skill directive deterministically, instead of relying on
# the model matching a skill description. Silent when nothing matches.
# Exits 0 always; a hook failure must never block the prompt.

route_prompt="$(dirname "$0")/utils/route_prompt.py"
[ -f "$route_prompt" ] || exit 0

python3 "$route_prompt" 2>/dev/null || true
exit 0
