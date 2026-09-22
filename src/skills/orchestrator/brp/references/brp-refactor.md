# brp-refactor (workflow reference)

Refactors existing code into cleaner structure without changing behavior by
splitting files, extracting helpers, and preserving public interfaces with tight
validation. Use when the goal is structural improvement with no feature change.
Not for shipping new behavior, fixing unknown bugs, or final quality review of
already-finished work.

## Rules

- **Never mix refactoring with feature changes.** These are separate tasks.
- **Tests must pass at every step.** If they don't, the refactor is wrong.
- **Preserve public interfaces.** Callers should not need to change. A candidate
  that requires an interface change (deepening, seam moves) is `brp-plan` work,
  not this lane's.
- **Apply the deletion test** to every extraction: it must concentrate
  complexity somewhere better, not just move it around.
- The structural bar is the BusiRocket baseline: atomic files (one exported unit
  per file), explicit boundaries, and the loaded code-quality rules. Repo-wide
  gates and the agent-ready documentation standard are `brp-code-quality`'s job;
  do not bootstrap them mid-refactor.

## Workflow

1. Scope before you scan: take the user's named direction, or find git hot spots
   (`refactor-candidates.md`).
2. Scan with the friction heuristics and present a candidate report (cards with
   strength badges, top recommendation first), then stop for the user's
   selection before designing anything.
3. Run the test suite and record the passing baseline; a red baseline blocks the
   refactor.
4. Map the responsibilities in the selected target and decide the extraction
   order.
5. Apply one structural change at a time (split, extract, rename), fixing
   imports as you go.
6. Re-run the tests after each step and compare against the baseline; revert the
   step if results diverge.
7. Finish with the full project check.

## Output

- Return: the candidate report (or the user's pre-selected target), files
  created, moved, or changed, the before/after test results, and confirmation
  that public interfaces and behavior are unchanged. Offer an ADR when a
  candidate is rejected for a load-bearing reason.
- Load `refactor-candidates.md` (same directory) for the vocabulary, friction
  heuristics, deletion test, card contract, and ADR handling.
