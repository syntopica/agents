# AGENTS.md

Instructions for AI coding agents working in this repository. Humans: start with
[README.md](README.md).

<!--
Template from syntopica/agents docs/agent-ready-repo-standard.md.
Fill every section with VERIFIED facts (run the commands, check the real
cluster/registry). Delete sections that genuinely do not apply. Keep the
whole file under ~120 lines. Selection test for every line: "Would removing
this cause an agent to make mistakes?" If not, cut it.
Pair with a CLAUDE.md containing exactly one line: @AGENTS.md
-->

## What this is

<!-- One paragraph: stack, purpose, blast radius. Example:
"Fork of X serving the production Y for high-traffic site Z. Node/Express/
Mongo, custom plugins under plugins/." -->

**This is production infrastructure. Do not deploy, restart, or modify anything
in <environment> without explicit human authorization.** Read-only inspection is
fine.

## Branch model

<!-- Only if non-obvious. Name the branch production actually runs, the
default branch, and whether they diverge. #1 silent-mistake source. -->

## Build and run

<!-- Exact commands an agent cannot guess, expected durations, and known
stale files ("`.nvmrc` is stale; the Dockerfile is the source of truth"). -->

## Smoke test (verified recipe)

<!-- Copy-paste commands that prove a build works, with expected output.
Must have been run successfully at least once before being written here.
Include hard runtime requirements ("container exits if VAR is unset"). -->

## Deployment

<!-- Image name + tag scheme, registry, cluster/namespace/deployment names,
actual deploy mechanism, and explicit anti-patterns ("never helm upgrade
this deployment - the release is orphaned"). Note cross-project/account
permission traps. -->

## Cross-repo interactions

<!-- Repos this one depends on or is consumed by, with links to their
README/AGENTS.md. Delete if truly standalone. -->

## Security

- Never commit secrets. Secrets reach the app only as runtime env vars
  (CI/Kubernetes secrets), never as Docker build args or committed files.

<!-- Add repo-specific history: "history leaked X; treat as compromised". -->

## Conventions

- All code, comments, and commit messages in English.

<!-- Only deviations from defaults: do-not-upgrade warnings, style
constraints, "match the existing 20XX-era style, do not modernize". -->
