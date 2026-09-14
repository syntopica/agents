# Rocket Agents repository instructions

## What this is

This public TypeScript control plane owns BRP policy, adapters, diagnostics,
machine convergence, and safe conversation transport. Changes can alter the
agent environment on every linked client.

**Do not run `machine:apply`, `machine:rollback`, `rules:link`, `skills:link`,
`hooks:link`, a conversation `--apply` against durable user data, or a release
without explicit human authorization.** Read-only inspection, builds, tests,
doctors, diffs, conversation dry-runs, and apply-path tests wholly contained in
a newly created OS temporary directory are safe.

## Branch model

`main` is the default branch and tracks `origin/main`. Make changes on the
current user-selected branch; never rewrite shared history.

## Build and run

- Runtime: Node 22.13 or newer; package manager: pnpm 11.15.0.
- Install: `pnpm install --frozen-lockfile`.
- Build generated rules, skills, agents, and plugins: `pnpm run build`.
- Full formatting, lint, type, test, portability, and hygiene gate:
  `pnpm run check`.
- Generated output under `dist/` is ignored. Edit canonical sources under `src/`
  and `scripts/`.

## Shipping a rule or skill change

Standing owner authorization: run this whole sequence, including the link step,
without asking again. It is the only pre-authorized use of a link command; every
other machine mutation listed above still needs its own approval.

```bash
git pull --ff-only origin main   # other sessions commit here concurrently
pnpm run rules:compile           # or pnpm run build for skills/plugins too
pnpm run check                   # must exit 0 - check the exit code, not the tail
git add <specific paths>         # never git add -A
git commit
git push origin main
pnpm run rules:link              # or skills:link / hooks:link to match the change
```

Pull first and re-run the gate after it: rules share one generated index with a
hard size budget, so a rule committed by another session can push the index over
the limit and break a build that passed minutes earlier. When that happens, buy
the space back from verbose descriptions rather than raising the budget, and
keep the keywords that route each rule.

Verify the link landed instead of trusting its summary. `claude` reports
`unchanged` on a rule addition because it resolves a symlink into `dist/`, which
`rules:compile` already refreshed; confirm with
`ls ~/.claude/rules/rocket-agents/global/`.

## Smoke test

Verified commands:

```bash
pnpm run type-check
pnpm run conversations:test
pnpm run conversations:doctor -- --source pi --json
```

The first two exit zero. The doctor returns JSON with `ok: true`; an unavailable
optional source is reported rather than treated as a failure.

## Distribution

This repository is not a hosted service. `pnpm run build` creates local
distribution artifacts. Link commands copy or link those artifacts into
user-level agent configuration and therefore count as machine mutations.
Releases use the `brp-release` workflow.

## Cross-repo interactions

- `~/p/rocket-agents-library` owns curated skill sources consumed by the linker.
- `~/p/dotfiles` owns host bootstrap, private machine manifests, and scheduled
  invocations.
- `~/p/atrium` owns derived conversation indexing and semantic retrieval.
- `~/p/brain` owns deliberate, human-authored knowledge.

## Security

- Never commit secrets or captured conversations. Tracked manifests contain
  environment references, never credential values.
- Conversation capture is read-only. Exports redact recognized secrets, omit
  credential stores, reject unsafe paths, use SHA-256 manifests, and write mode
  `0600`.
- SQLite sources are queried read-only through allowlisted conversation tables;
  databases, cookies, auth state, and sidecars are never transported.

## Conventions

- All code, comments, docs, identifiers, and commit messages are English.
- One file contains one exported unit and one responsibility. Dependencies are
  explicit imports.
- Existing migrations require explicit user confirmation before editing.
- Use `apply_patch` for source edits. Stage only intended paths; never use
  `git add -A`.
