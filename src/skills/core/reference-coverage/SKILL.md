---
name: reference-coverage
description:
  Audits every caller of a symbol before it changes, and picks between
  codegraph, a language server and text search. Trigger when a rename, a
  signature change, a deletion or any edit whose correctness depends on having
  found every reference is about to be made, when a repository has no index, or
  when compiler diagnostics are needed without running a build. Do not use for
  reading code you already located or for finding a string or a filename.
allowed-tools: Read, Grep, Glob, Bash
---

# Code navigation: codegraph, serena, grep

Always on: this governs ordinary working sessions in any language, so it cannot
be scoped to a file glob.

Replaces two hand-written rules, `~/.claude/rules/codegraph.md` and
`~/.claude/rules/serena.md`, which were deleted from the unversioned global
config and left no trace. Serena then went **0 calls across 4,782
conversations** while loaded in both profiles — not because it is useless, but
because nothing pointed at it. That is why this rule lives in a repository.

Measured head-to-head, 2026-09-01, on a pnpm monorepo and a Python repo. Full
evidence: the instance's wiki page comparing CodeGraph with a language server.

## Which tool

- **codegraph** (`codegraph_explore`) — default for structural questions in an
  indexed repo: how does X work, what calls it, what breaks if I change it. One
  call returns the verbatim source plus call paths and blast radius. Pass
  `projectPath` to query any repo, including a second one in the same session.
- **serena** — two jobs it wins outright:
  - `get_diagnostics_for_file` for real compiler errors **without running a
    build**. Nothing else here does this.
  - any repo with **no `.codegraph/` index**, where codegraph can answer nothing
    and serena works after `activate_project`.
- **grep / Glob** — strings, config, comments, file discovery. Still the fastest
  correct answer for anything that is not a symbol.

Do not reach for serena's symbol search in an indexed repo just because it is
available: it costs `initial_instructions` (~1.4k tokens) plus
`activate_project` before its first answer, which is why it loses on cost when
codegraph can answer.

## The one thing that will bite you

**Neither tool is complete on "who references this", and both fail silently.**

- **serena inherits every exclusion in the project's `tsconfig.json`.** A repo
  excluding `**/*.test.tsx` means serena's answer omits all tests, and a partial
  answer is indistinguishable from a complete one.
- **serena cannot see across packages in a monorepo.** The language-server
  program that owns `packages/core` does not contain `apps/web`, so consumers in
  a sibling package are invisible. Measured: it found **1 of 5** referencing
  files, reporting no warning.
- **codegraph merges same-named symbols.** With two functions sharing a name in
  different packages, it surfaced every consumer but attributed several to the
  wrong one.

## Verify before you refactor

Before a rename, a signature change, a deletion, or any edit whose correctness
depends on having found _every_ caller:

1. Get the reference list from codegraph (or serena in an unindexed repo).
2. **Confirm it with a second, independent source** — `grep -rn` on the symbol
   name across the whole repo, not just the package you are in.
3. When the two disagree, the union is the candidate set and you read the
   imports to settle it. Aliased imports (`import { x as y }`) and same-named
   symbols in different packages are exactly where they disagree.
4. Only then edit.

A false positive costs one look. A false negative ships a broken build. Treat
any single tool's reference list as a lower bound, never as the answer.

State which tool produced a claim when it matters — "codegraph reports 5
callers, grep confirms" is checkable; "there are 5 callers" is not.

## Index coverage

Both indexes are in the global gitignore, so neither can pollute a repo. A repo
missing one loses that tool entirely, so after cloning anything new run:

    <your index-all-repos script>        # idempotent; --dry-run to preview

It skips repos with no source files and leaves existing indexes alone.
`codegraph status <path>` reports whether an index is stale; re-sync with
`codegraph sync <path>` after large changes rather than trusting a stale graph.
