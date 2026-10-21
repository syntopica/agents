# Contributing

Use `AGENTS.md` for operational constraints and the [README](../README.md) for
the build sequence. Canonical source lives in `src/` and `scripts/`; `dist/` is
generated and ignored.

## Checks

```bash
pnpm run type-check
pnpm run format:check
pnpm run lint
pnpm run check
pnpm run secrets:check
```

The full check formats files, fixes lint, validates rule and skill output, runs
tests, and checks unused code, dependency boundaries, and type coverage. Inspect
the working tree afterward. Secret scanning is separate; `pnpm run audit:check`
can fail for unresolved upstream dependency advisories.

Type checking uses the native compiler through `@typescript/native`. The
`typescript` dependency is an API-compatible alias for analysis tools. Preserve
that separation until their supported compiler APIs agree.

## Rules and skills

Edit rules under `src/rules/`. Keep skill definitions and resources under
`src/skills/`, and update `src/skills/skill-rules.map.json` when references
change. Build before checking generated output. The tracked `llms.txt` catalog
is generated with `pnpm run skills:llms` and includes only engine-owned skills.

Preserve workflow requirements, safety boundaries, stopping conditions, and
measured corrective examples when editing instructions. Privacy edits anonymize
identifying details while retaining the operational lesson. Behavioral
improvements require evidence from the relevant checker.

## Public content

Use synthetic, role-based examples. Keep customer names, account mappings,
current login observations, private URLs, operator-specific authority, captured
conversations, and machine inventories outside this repository. Retain copyright
and third-party attribution.

Preserve operational material in private storage and verify the copy before
removal. Cleanup of the current tree leaves earlier commits intact. Rewriting
published history needs separate authorization.

## Client installation

Linkers modify user-level client configuration. Follow the authorization
boundary and verify installed artifacts after an authorized link. Repository
tests use temporary directories for verification.
