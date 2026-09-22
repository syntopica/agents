# BRP Workflow Protocol (Non-Negotiable)

Every coding task — regardless of stack, IDE, or complexity — follows this
deterministic 6-step protocol. Steps may be lightweight for trivial tasks but
**must never be skipped**.

## Protocol Steps

### 1. DISCOVERY

Read existing code before creating abstractions.

- Identify affected files and boundaries
- Understand current patterns and conventions
- Note dependencies and potential side effects

### 2. PLAN

Produce 5–10 bullets with milestones, risks, and edge cases.

- State the goal clearly
- List files to create/modify/delete
- Identify risks and mitigations
- Define acceptance criteria
- Estimate scope (minimal diff strategy)

### 3. IMPLEMENT

Make changes incrementally with minimal diffs.

- Follow the plan; deviate only with documented reason
- One logical change per commit
- Respect existing conventions (naming, structure, boundaries)
- No new dependencies unless justified

### 4. TEST

Update or generate tests; define validation commands.

- Provide exact commands to run (`pnpm test`, `cargo test`, etc.)
- Cover happy path + edge cases identified in PLAN
- If no test framework exists, provide manual verification steps

### 5. SELF-CHECK

Run a final checklist before delivering.

- [ ] All acceptance criteria met
- [ ] No unused imports or dead code
- [ ] No type errors or lint warnings
- [ ] File sizes within limits (10–100 lines target)
- [ ] One exported symbol per file
- [ ] Limitations and known issues documented

### 6. REVIEW

Mini PR review: security, performance, maintainability.

- Security: no secrets, no XSS vectors, least privilege
- Performance: no N+1 queries, no unnecessary re-renders
- Maintainability: clear names, single responsibility, testable
- Next steps: what would you improve next?

## Golden Rule

> If plan or validation commands are missing, the output is **incomplete**.
