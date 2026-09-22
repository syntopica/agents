# Codex adjudication

How to resolve an open decision during a backlog run without stopping for the
user. Codex runs on a separate OpenAI quota, so an adjudication costs the main
session almost nothing beyond the brief and the verdict.

## When

Any decision that is not on the authority list in `SKILL.md`: an ambiguous
requirement, a missing technical detail, two defensible designs, an unclear
priority, a task whose real state is arguable. Batch every open decision of one
queue wave into a single brief; do not spend one run per question.

Skip the adjudication and decide directly when the answer is already in the
repository, the instruction files, or the backlog itself. Codex is for genuine
forks, not for lookups.

## Brief

Write `decision.md` in a scratch directory. Long context first, the question
last:

```markdown
# Decision brief

Repository: <path> - <one line on what it is>.

## Evidence

<file paths with the relevant lines, command output, backlog wording, prior
decisions from TODO_LOG.md. Paste it; do not make Codex hunt for it.>

## Question

<the fork, stated as a choice between named options>

## Constraints

<project rules that bind the answer: scope, authority limits, style, budget>

Choose one option and commit to it. Do not ask follow-up questions. Return only
JSON matching the provided schema.
```

## Schema

Write it next to the brief as `decision.schema.json`. Every property listed in
`required`, `additionalProperties` false - the strict-output rules reject a
schema built any other way.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "decision",
    "rationale",
    "assumptions",
    "risks",
    "reversible",
    "confidence",
    "needs_human"
  ],
  "properties": {
    "decision": { "type": "string" },
    "rationale": { "type": "string" },
    "assumptions": { "type": "array", "items": { "type": "string" } },
    "risks": { "type": "array", "items": { "type": "string" } },
    "reversible": { "type": "boolean" },
    "confidence": { "type": "string", "enum": ["low", "medium", "high"] },
    "needs_human": { "type": "boolean" }
  }
}
```

## Command

Run it exactly as written; add `--add-dir` only when the evidence lives outside
the working root.

```bash
codex exec -C "$PWD" -s read-only \
  -c 'mcp_servers={}' \
  --output-schema "$DIR/decision.schema.json" \
  -o "$DIR/decision.json" \
  -c model_reasoning_effort=low \
  "Read $DIR/decision.md fully, then return the verdict as JSON matching the schema." \
  < /dev/null
```

Keep the `< /dev/null`. `codex exec` appends piped stdin to the prompt, and from
an agent shell with a non-interactive stdin it will sit on "Reading additional
input from stdin..." until the caller's timeout instead of answering.

Read-only is the right sandbox: an adjudicator reads and rules, it does not
edit. Leave `-m` out; the account default is configured in
`~/.codex/config.toml` and a model id copied from a document may not be one the
account can use.

Dropping the MCP servers is what makes the schema dependable: they are what
silently disables `--output-schema`, and an adjudicator has no use for them.

Flags verified against codex-cli 0.150.1: `--full-auto` and `-a` do not exist on
`exec`, and `--search` is a top-level flag. Start each adjudication as a fresh
`exec` rather than a resume - `exec resume` does accept `--output-schema`, but
one brief is one question and a fresh run keeps the verdict traceable to it.

## Verdict handling

Write each adjudication to a path that did not exist before the run, and accept
the verdict only when the run exited zero and that file now exists and carries
every required key. A timed-out or failed run that leaves the previous attempt's
file in place is the one way this contract fails quietly: an older,
valid-looking verdict then decides a question it never saw. `--output-schema` is
also silently ignored when MCP servers are active, which is why the command
above drops them; parse and check rather than assuming conformance.

- Valid verdict: act on it. Record the decision, its rationale in one line, and
  the command in the `TODO_LOG.md` entry for the item.
- `needs_human` true, or `confidence` low on an irreversible choice: park the
  item `[!]` with the exact question and keep working elsewhere.
- Missing or malformed payload: retry once. If it fails again, take the most
  reversible option, write the assumption into `TODO.md` next to the item, and
  continue.

A verdict is guidance from a model that cannot see this session. Treat a claim
about the code as a hypothesis and verify it before it changes a file.
