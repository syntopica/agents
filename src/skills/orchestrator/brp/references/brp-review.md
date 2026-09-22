# brp-review (workflow reference)

Performs a findings-first self-review of code changes for bugs, regressions,
missing tests, security risks, and maintainability issues before delivery. Use
when implementation is done and the next step is to assess change quality like a
strict reviewer. Not for planning, root-cause debugging, or writing the
implementation itself. For an isolated second opinion, delegate to the
`brp-reviewer` subagent instead of reviewing in the main thread.

## Rules

- Never skip the self-check, even for small changes.
- If critical issues are found, go back to the `brp-implement.md` workflow
  before delivering.

## Workflow

1. Review the change as if it were an incoming PR, not your own work.
2. Prioritize correctness, regressions, and security before style commentary.
3. Report concrete findings first with severity and evidence.
4. Call out missing validation, risky assumptions, and uncovered edges.
5. Summarize only after findings and open questions are clear.

## Output

- Return findings first, ordered by severity, with evidence and missing-test
  callouts.
- Load `review-severity-rubric.md` (same directory) to keep severity assignment
  and tone consistent.
