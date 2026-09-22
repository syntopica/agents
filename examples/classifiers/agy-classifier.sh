#!/bin/zsh
# Example classifier for `library:classify`.
#
# The contract: read the file named by $LIBRARY_BATCH, one request per line, print JSON of
# the shape { "requests": [ { "procedure": "..." } ] } on stdout, one object per
# input line, in order. Anything else printed on stdout will not parse.
#
# This example uses Gemini through the Antigravity CLI because bulk passes over a
# whole corpus are what its quota survives. Swap the command for whatever model
# you prefer; the engine only cares about the contract above.
set -u

batch="${LIBRARY_BATCH:-$1}"
schema="$(dirname "$0")/procedure-schema.json"

prompt="$(
  echo "# REFERENCE DATA - requests a developer sent to a coding agent"
  echo
  cat "$batch"
  echo
  echo "# TASK"
  echo "Based entirely on the requests above, using no outside knowledge, return one object per line, in order."
  echo "For each, name the underlying repeatable procedure in under ten words, phrased so that two requests asking for the same thing produce the same string."
  echo "Use an empty string when the request is a one-off or mid-session steering rather than a task."
  echo "Expect a substantial share of empty procedures: terse follow-ups are normal in this corpus, and giving every line a distinct procedure means you did not read the wording."
  if [ -n "${LIBRARY_ANCHORS:-}" ] && [ -s "$LIBRARY_ANCHORS" ]; then
    echo "Reuse these exact procedure names whenever they fit, instead of inventing a new wording:"
    cat "$LIBRARY_ANCHORS"
  fi
)"

agy -p "$prompt" \
  --sandbox --disable-slash-commands \
  --model gemini-3.1-pro-high \
  --json-schema "$schema" \
  --output-format json \
  --print-timeout 15m 2>/dev/null |
  node -e 'let raw="";process.stdin.on("data",c=>raw+=c).on("end",()=>{try{const outer=JSON.parse(raw);process.stdout.write(typeof outer.response==="string"?outer.response:raw)}catch{process.stdout.write(raw)}})'
