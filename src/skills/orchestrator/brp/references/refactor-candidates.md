# Refactor candidates (brp-refactor / brp-plan reference)

How to find, filter, and present structural-improvement candidates before any
interface is designed. The candidate report is a proposal artifact; the hard
stop before design is the point.

## Vocabulary

Use these terms exactly - do not drift into component, service, API, or
boundary:

- **module**: a unit of code with an interface and an implementation.
- **interface**: every fact a caller must know to use the module correctly -
  invariants, ordering, error modes, performance expectations - not just the
  type signature.
- **depth**: a simple interface hiding a substantial implementation. Depth is an
  interface property, not a file-layout property; the atomic-file rule (one
  exported unit per file) governs layout and is not in tension with depth.
- **seam**: a place where behavior can be substituted without editing the
  surrounding code. One adapter means a hypothetical seam; two means a real one.
- **adapter**: a thin module translating between two interfaces.
- **leverage**: how much future change one improvement absorbs.
- **locality**: how much of a behavior can be understood by reading one place.

## Scope before you scan

If the user named a direction, take it. Otherwise walk `git log --oneline` back
a good stretch and let the hot spots - the files and areas that keep coming up -
pull attention first; widen the net only if changes are scattered. Deepening
pays off on code that keeps changing, not on code that never does.

## Friction heuristics

Scan for these signals:

- Understanding one concept requires bouncing between many small modules
  (locality failure).
- An interface nearly as complex as its implementation (no depth).
- Pure functions extracted purely for testability while the real bugs hide in
  how they are called.
- Tightly-coupled modules leaking state or assumptions across their seams.
- Areas untested or hard to test through the current interface.

## The deletion test

The candidate filter: would deleting this module concentrate complexity into a
better place, or just move it around? A "yes, concentrates" is the signal you
want. Extractions that merely relocate complexity do not earn their keep.

## Candidate report

Present candidates as cards, each with:

- files involved;
- the problem in one sentence;
- the solution in one sentence;
- benefits stated in terms of locality, leverage, and how tests would improve;
- a before/after sketch;
- a strength badge: **Strong** / **Worth exploring** / **Speculative**.

Lead with a "Top recommendation" section. Then stop: do NOT propose interfaces
yet; ask the user which candidate to explore. Report artifacts never land in the
repo - write timestamped files to the OS temp directory and tell the user the
absolute path.

## ADRs

- Consult existing ADRs (`docs/adr/`) before proposing. Surface a candidate that
  contradicts one only when the friction is real enough to warrant revisiting
  the decision, and mark it inline ("contradicts ADR-0007 - but worth reopening
  because..."). Do not list every theoretical refactor an ADR forbids.
- When the user rejects a candidate for a load-bearing reason, offer to record
  an ADR so future reviews do not re-suggest it. Skip ephemeral ("not worth it
  right now") and self-evident reasons.

## Lane routing

A candidate that changes a public interface (deepening, seam moves) is plan-lane
work: route it through `brp-plan` with design-it-twice, and treat callers as in
scope. The refactor lane stays behavior-preserving with interfaces intact; do
not fold interface redesign into it.
