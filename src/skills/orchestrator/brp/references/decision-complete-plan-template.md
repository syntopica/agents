# Decision-Complete Plan Template

Use this structure when the task needs to be handed to an implementer without
open design questions.

## Discovery Summary

- Current behavior:
- Relevant files / systems:
- Constraints:

## Target Outcome

- Desired behavior:
- Non-goals:
- User-visible impact:

## Implementation Changes

1. Milestone:
   - Intent:
   - Key code or interface changes:
2. Milestone:
   - Intent:
   - Key code or interface changes:

## Interfaces and Contracts

- Public API / schema / CLI / config changes:
- Compatibility requirements:
- Migration notes:

## Risks

- Primary risk:
- Mitigation:
- Rollback or fallback:

## Validation

- Automated commands:
- Manual verification:
- Acceptance criteria:

## Assumptions

- Assumption:
- Default chosen:

## Filled example (excerpt)

The level of concreteness each field needs:

- Current behavior: `POST /api/orders` accepts unvalidated JSON; a malformed
  `quantity` reaches the DB layer and 500s
  (`services/orders/createOrder.ts:41`).
- Milestone 1 — Intent: reject bad input at the boundary. Key changes: add
  `OrderInputSchema` in `types/orders/OrderInputSchema.ts`, `safeParse` in the
  route handler, return `{ error: { code: "invalid_input" } }` with 400.
- Automated commands: `pnpm run check && pnpm vitest run services/orders`.
- Acceptance criteria: malformed `quantity` returns 400 with the error shape;
  existing valid orders still create; no schema drift in the OpenAPI file.
