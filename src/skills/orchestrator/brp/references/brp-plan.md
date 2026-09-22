# brp-plan (workflow reference)

Produces a decision-complete implementation plan with discovery, milestones,
risks, validation, and acceptance criteria before code changes start. Use when
the user asks for a plan, the scope is high-risk or ambiguous, or multiple
implementation paths involving project structure, design patterns, or
architecture need to be compared. Not for straightforward low-risk edits that
can be implemented immediately, active debugging, or final review after code is
already written.

## Rules

- Never skip discovery; read the current code before proposing abstractions.
- Plans must include validation commands.
- Prefer minimal diffs. Avoid changing files unrelated to the goal.
- Consult existing ADRs (`docs/adr/`) during discovery; a plan that contradicts
  one must say so inline and justify reopening the decision.
- Design it twice: when the plan turns on a new or changed interface, design it
  at least two radically different ways and compare on depth, locality, and seam
  placement (`refactor-candidates.md`, same directory, defines these terms)
  before committing to one.

## Workflow

1. Read the current implementation and summarize the real starting state.
2. Define the target behavior, explicit non-goals, and major constraints.
3. Break the work into ordered milestones with concrete implementation intent.
4. Call out risks, migrations, compatibility constraints, and failure modes.
5. End with validation commands and acceptance criteria that make the work
   executable.

## Output

- Return: discovery summary, implementation plan, interface changes, validation
  commands, assumptions.
- Load `decision-complete-plan-template.md` (same directory) to keep plan
  structure and acceptance criteria consistent.
