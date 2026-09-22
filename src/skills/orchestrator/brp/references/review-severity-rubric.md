# Review Severity Rubric

Use this rubric to keep review findings consistent and findings-first.

## P0

- Causes data loss, security exposure, outage, or hard blocker to release.
- Must be fixed before merge or delivery.

## P1

- High-confidence functional bug, regression, or broken contract with serious
  impact.
- Should block delivery until fixed or explicitly accepted.

## P2

- Real maintainability, correctness, performance, or testing gap with moderate
  impact.
- Usually should be fixed soon; may not block a draft.

## P3

- Low-severity improvement, clarity gap, or minor risk.
- Useful feedback, but not a delivery blocker by default.

## Findings Format

- State the issue, not just the rule.
- Point to the concrete file and behavior.
- Explain impact in one paragraph.
- Prefer evidence over speculation.
