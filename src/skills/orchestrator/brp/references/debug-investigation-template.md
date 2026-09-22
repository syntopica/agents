# Debug Investigation Template

Use this template when a debugging task needs a clear narrative and evidence
trail.

## Symptoms

- Observed behavior:
- Expected behavior:
- Reproduction path:
- First failing signal:

## Feedback loop

- Loop command (red-capable, already run):
- Its (redacted) output:

## Minimisation

- Elements cut (inputs, callers, config, data, steps) and the re-run result
  after each:
- Remaining load-bearing elements:

## Hypotheses

1. Hypothesis:
   - Why it is plausible:
   - Prediction ("if X is the cause, changing Y makes the bug disappear"):
   - Cheapest validating check:
2. Hypothesis:
   - Why it is plausible:
   - Prediction:
   - Cheapest validating check:

## Isolation

- Checks run:
- What each check ruled in or out:
- Proven root cause:

## Fix

- Smallest code change that addresses the root cause:
- Why broader changes were not required:

## Verification

- Automated verification:
- Manual verification:
- Remaining uncertainty or follow-up:
