#!/usr/bin/env bash
# Stop verification gate. When source files were edited this session and the
# project defines a `check` target, run it before letting the turn end. Blocks
# "done" until it passes.
#
# Opt-in is the design, not a limitation: a repo opts in by defining `check` in
# package.json, composer.json, a justfile or a Makefile. The gate never invents a
# command, so it cannot run an arbitrary build on Stop. `cargo check` and bare
# `pytest` were considered and rejected for that reason.
#
# Silent when: nothing was edited, no `check` target exists, the check passes, or
# it times out. It only ever speaks to block a false "done".
set -uo pipefail

input=$(cat 2>/dev/null || true)
get() { printf '%s' "$input" | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('$1', ''))
except Exception:
    print('')
" 2>/dev/null; }

# Prevent loops: when we already blocked once, Claude Code sets this flag.
[ "$(get stop_hook_active)" = "True" ] && exit 0

cwd=$(get cwd); [ -z "$cwd" ] && cwd="$PWD"
transcript=$(get transcript_path)

# Only verify if code was actually edited this session.
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  grep -Eq '"(name|tool_name)"[[:space:]]*:[[:space:]]*"(Edit|Write|MultiEdit|apply_patch)"' "$transcript" || exit 0
else
  exit 0
fi

cd "$cwd" 2>/dev/null || exit 0

# Opt-in stays the rule: a repo opts in by defining a `check` target in whatever
# build system it uses. Node-only detection left PHP, Make and just repos silent,
# which is where "you said it was done" corrections clustered.
cmd=""
if [ -f package.json ] && python3 -c "
import json, sys
try:
    s = json.load(open('package.json')).get('scripts', {})
except Exception:
    sys.exit(1)
sys.exit(0 if 'check' in s else 1)
" 2>/dev/null; then
  if [ -f pnpm-lock.yaml ]; then pm="pnpm"
  elif [ -f bun.lockb ] || [ -f bun.lock ]; then pm="bun"
  elif [ -f yarn.lock ]; then pm="yarn"
  else pm="npm"; fi
  cmd="$pm run check"
elif [ -f composer.json ] && python3 -c "
import json, sys
try:
    s = json.load(open('composer.json')).get('scripts', {})
except Exception:
    sys.exit(1)
sys.exit(0 if 'check' in s else 1)
" 2>/dev/null; then
  cmd="composer run check"
elif [ -f justfile ] || [ -f Justfile ]; then
  just --list 2>/dev/null | grep -qE '^\s+check(\s|$)' && cmd="just check"
elif [ -f Makefile ] || [ -f makefile ]; then
  grep -qE '^check:' Makefile makefile 2>/dev/null && cmd="make check"
fi

[ -n "$cmd" ] || exit 0

out=$(timeout 180 $cmd 2>&1); code=$?
[ "$code" -eq 124 ] && exit 0   # timed out — do not block
[ "$code" -eq 0 ] && exit 0     # passed

printf '%s' "$out" | tail -30 | python3 -c "
import json, sys
tail = sys.stdin.read()
print(json.dumps({
    'decision': 'block',
    'reason': 'Verification gate FAILED: \`' + '''$cmd''' + '\` returned non-zero. Fix these before finishing (do not claim done):\n\n' + tail
}))
" 2>/dev/null || exit 0
exit 0
