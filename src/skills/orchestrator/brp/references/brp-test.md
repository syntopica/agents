# brp-test (workflow reference)

Designs, adds, or updates validation for a change using deterministic tests and
explicit manual checks when automation is not possible. Use when code exists and
the next job is to prove correctness with unit, integration, end-to-end, or
manual verification coverage. Not for planning the feature itself, debugging
unclear failures, or final findings-first review.

## Rules

- Every implementation MUST have validation commands, even if no test framework
  exists.
- If no test framework is available, provide manual verification steps.
- Tests must be independent and deterministic.
- Seams gate: before writing any test, write down the seams under test and
  confirm them with the user. No test is written at an unconfirmed seam - agreed
  seams put effort on critical paths instead of every edge case.
- When writing tests before or alongside new code, work red-before-green in
  vertical slices: one failing test, only enough code to pass it, repeat. Never
  write all tests then all implementation - that verifies imagined behavior and
  locks in test structure before the implementation is understood.
- Reject the three test anti-patterns:
  - Implementation-coupled - the tell is a test that breaks on refactor while
    behavior is unchanged.
  - Tautological - the assertion recomputes the expected value the way the code
    does (`expect(add(a, b)).toBe(a + b)`); expected values come from an
    independent source of truth (known-good literal, worked example, spec).
  - Side-channel verification - querying the DB to confirm `createUser` instead
    of calling `getUser`.
- Mock at system boundaries only (external APIs, time, randomness, filesystem,
  sometimes the DB); never mock your own modules or internal collaborators.
- Name tests as specification (what, not how) and keep one logical assertion per
  test.

## Workflow

1. Identify the highest-risk behavior changes introduced by the implementation.
2. Propose the seams under test and the smallest reliable test layer that proves
   each behavior; confirm the seams with the user.
3. Add deterministic automated tests first; fall back to explicit manual checks
   when needed.
4. Provide runnable commands and note any setup gaps or constraints.
5. Report what is covered, what is not, and why.

## Output

- Return: test strategy, files added or changed, commands, remaining gaps,
  manual verification.
- Load `test-strategy-matrix.md` (same directory) when deciding test depth or
  fallback coverage.
