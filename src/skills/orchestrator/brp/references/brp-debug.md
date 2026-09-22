# brp-debug (workflow reference)

Diagnoses unexpected runtime errors, flaky behavior, failing checks with unclear
cause, and performance regressions by collecting symptoms, testing hypotheses,
isolating the fault, and only then changing code. Use when the task is to
investigate or explain a problem before applying a fix. Not for straightforward
bug fixes with an already-known cause, planned refactors, or final code review.

## Rules

- Always start with symptoms, not assumptions.
- Red-loop gate: no hypothesis before a red-capable command exists that you have
  already run, with its (redacted) output in hand. If you catch yourself reading
  code to build a theory before that command exists, stop - jumping straight to
  a hypothesis is the exact failure this gate prevents.
- Generate 3-5 ranked, falsifiable hypotheses before testing any; each must
  state its prediction ("if X is the cause, changing Y makes the bug
  disappear" - no prediction, no hypothesis). Show the ranked list to the user
  before testing, but do not block if they are away.
- Test hypotheses in order of likelihood (cheapest test first), changing one
  variable at a time.
- Tag every debug log with a unique prefix (for example `[DEBUG-a4f2]`) so
  cleanup is a single grep; untagged logs survive delivery.
- Clean up all debug artifacts before delivering.
- Escalate to the `brp-plan.md` workflow when the issue turns into a larger
  redesign instead of a diagnosis.

## Workflow

1. Capture the reported symptoms, error surface, and reproduction path.
2. Build the tightest red-capable loop the situation allows (see
   `feedback-loop-ladder.md`).
3. Minimise: cut inputs, callers, config, data, and steps one at a time,
   re-running after each cut, until every remaining element is load-bearing. The
   minimised loop shrinks the hypothesis space and becomes the regression test.
4. Generate the ranked falsifiable hypothesis list and run the minimum checks
   needed to isolate the true fault domain.
5. Apply the smallest corrective change only after the root cause is proven.
6. Verify the original symptom is gone and note remaining uncertainty.

## Output

- Return: symptoms, hypotheses tested, root cause, fix, verification.
- Load `feedback-loop-ladder.md` (same directory) when choosing or tightening
  the reproduction loop.
- Load `debug-investigation-template.md` (same directory) when the task needs a
  structured investigation.
