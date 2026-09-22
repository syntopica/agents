# brp-fix (workflow reference)

Reproduces and patches a known bug with a minimal diff, then verifies the broken
behavior stays fixed. Use when the task is to implement a concrete bug fix and
the likely cause is already narrow enough to change code safely while preserving
code quality and useful observability signals. Not for open-ended root-cause
investigations, behavior-preserving refactors, or broad code-quality audits.

## Rules

- Never fix without reproducing first. "I think this should fix it" is not
  enough.
- Minimal diff only. Bug fixes are not the time for refactoring.
- Always add a test for the case that was broken - at a correct seam, one that
  exercises the real bug pattern as it occurs at the call site. A too-shallow
  seam gives false confidence. If no correct seam exists, that itself is the
  finding: document it as an architecture problem and hand off instead of
  forcing a test.
- Escalate to the `brp-debug.md` workflow when the root cause is still unclear,
  or to the `brp-plan.md` workflow when the fix expands beyond a minimal patch.

## Workflow

1. Reproduce the failure or establish a trusted failing signal.
2. Confirm the smallest code path that explains the broken behavior.
3. Apply the narrowest fix that restores the expected behavior.
4. Add or update tests so the regression is guarded permanently.
5. Re-run verification and record any residual risk.

## Output

- Return: reproduction, fix summary, tests added or updated, verification
  commands, residual risk.
- Load `bug-reproduction-template.md` (same directory) when the bug report is
  incomplete or ambiguous.
