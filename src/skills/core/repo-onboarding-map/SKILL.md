---
name: repo-onboarding-map
description:
  Maps an unfamiliar repository and writes the AGENTS.md a new contributor needs
  to start without re-deriving its infrastructure. Trigger when a repo has just
  been cloned, when a ticket lands in a codebase nobody here has touched, when
  onboarding notes are asked for, or when an existing AGENTS.md has gone stale
  against the code. Do not use for feature documentation, API references, or
  ADRs (that is brp-docs), and do not use to audit a ticket's completion.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
argument-hint: [repo-path]
---

## Rules

- Every claim comes from a command you ran in this session. Documenting a
  repository from memory of similar stacks is the failure this skill exists to
  prevent.
- The smoke test section carries commands that were executed, their observed
  output, and the date they were run. An unexecuted command is a guess.
- Run the setup scripts rather than reading them. Scripts drift from what they
  install; the gap between the documented setup and a working environment is the
  most valuable thing you will write down.
- Record what is **not obvious**: infrastructure that lives outside the account
  the repo name implies, a README name that no longer matches the real resource,
  a menu whose prompt text contradicts its options, a branch whose merge is a
  deploy. Facts a reader can get from `ls` do not earn a line.
- State the blast radius and what is read-only safe. An agent needs to know what
  it must never run before it needs to know how to build.
- Never write a secret value. Resource identifiers, account names, key IDs,
  project IDs, paths, and cluster names are the point; the material they unlock
  is not.
- Match the repository's existing conventions when it already has AGENTS.md or
  CLAUDE.md. Refresh what is stale rather than replacing what works.
- Client repositories: the map is a standalone change. Never mix it with ticket
  work in one branch or one commit.

## Workflow

1. Read `README.md` and any existing agent instructions first, so the map
   records the delta against them rather than restating them.
2. Scan the repository and its infrastructure with
   `references/infrastructure-scan.md`. Work top to bottom; a section with
   nothing to report is dropped from the output, not filled with filler.
3. Bring the environment up for real, following whatever local setup the repo
   documents. Note every step where the documented path failed and what fixed
   it.
4. Run a smoke test that proves the stack serves traffic end to end. Record the
   exact commands and their real output.
5. Write `AGENTS.md` per `references/agents-md-format.md`, then create
   `CLAUDE.md` containing the single line `@AGENTS.md`.
6. Re-read the draft against the scan output and delete every line you cannot
   point to a command for.

## Output

- Return: the path written, the smoke-test commands with their results, the
  non-obvious findings the map now records, and anything that stayed unverified
  and why.
- Load `references/infrastructure-scan.md` before scanning and
  `references/agents-md-format.md` before writing.
