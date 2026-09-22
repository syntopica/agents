# ADR format (brp-docs reference)

## The ADR bar

Write an ADR only when all three are true; otherwise skip it:

- Hard to reverse.
- Surprising without context.
- The result of a real trade-off.

If a decision is easy to reverse, skip it - you'll just reverse it.

## File convention

`docs/adr/NNNN-slug.md`. The number is the highest existing number plus one.
Create the directory lazily, on the first ADR.

## Template

Radically minimal: a title plus 1-3 sentences covering context, decision, and
why. A single paragraph is a valid ADR; the value is recording that a decision
was made and why, not filling out sections. Status, Considered Options, and
Consequences are optional - add one only when it adds value.

## What qualifies

- Architectural shape.
- Integration patterns between contexts.
- Tech choices carrying lock-in - not every library, just the ones that would
  take a quarter to swap out.
- Boundary and scope decisions, including explicit no's.
- Deliberate deviations from the obvious path.
- Constraints not visible in the code.
- Non-obvious rejected alternatives.
