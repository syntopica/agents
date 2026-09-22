# brp-implement (workflow reference)

Executes an approved implementation plan through small, verifiable code changes
that preserve scope and project conventions. Use when the approach is already
decided and the task is to write the code incrementally with validation along
the way. Not for ambiguous discovery work, root-cause debugging, or final review
after implementation is complete.

## Rules

- Stop implementing if you discover the plan is wrong. Go back to the
  `brp-plan.md` workflow.
- Never introduce TODO or placeholder code in delivered output.
- If a change grows beyond the plan's scope, split into a separate task.

## Workflow

1. Read the plan and confirm the target files, interfaces, and validation
   commands still match the code as it exists now.
2. Implement one milestone at a time as the smallest coherent diff.
3. Run the plan's validation commands after each milestone; fix failures before
   moving on.
4. Repeat until every milestone is done or a plan mismatch forces a return to
   the `brp-plan.md` workflow.
5. Run the full project check before delivering.

## Output

- Return: milestones completed, files changed, validation commands run with
  their results, and any deviation from the plan with its reason.
