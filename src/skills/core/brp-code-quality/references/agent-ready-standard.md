# Agent-Ready Repository Standard

How to document a repository so AI coding agents (and new humans) can work in it
without a guide. First applied to a client repository (PR #3); use that repo as
the reference implementation.

Sources: Anthropic's Claude Code best practices (code.claude.com/docs), the
AGENTS.md open spec (agents.md, 60+ tools), and hard-won incidents (the client
outage of 2026-08-03 traced back to undocumented deploy behavior).

## The three files

| File        | Audience         | Content                                              |
| ----------- | ---------------- | ---------------------------------------------------- |
| `README.md` | Humans           | What it is, architecture, local dev, deploy overview |
| `AGENTS.md` | Any coding agent | Operational facts an agent cannot infer from code    |
| `CLAUDE.md` | Claude Code      | One line: `@AGENTS.md` (import, no duplication)      |

One source of truth: agent content lives in AGENTS.md only. CLAUDE.md is an
import shim so Claude Code loads it automatically; other tools (Codex, Gemini
CLI, Cursor...) read AGENTS.md natively. Never let the two drift.

## What goes in AGENTS.md

Selection test (from Anthropic's guidance): "Would removing this cause an agent
to make mistakes?" If not, cut it. Keep the file under ~120 lines; it loads into
every session and bloated files get ignored.

Required sections, in order:

1. **What this is** - one paragraph: stack, purpose, and the blast radius ("this
   is the production comment system for a high-traffic site").
2. **Danger line** - what the agent must never do without explicit human
   authorization (deploy, touch prod, rotate credentials). State that read-only
   inspection is fine, so agents still gather context.
3. **Branch model** - only if non-obvious (diverged branches, deploy branch
   different from default branch). This is the #1 silent-mistake source.
4. **Build and run** - exact commands, expected duration, known stale files
   (`.nvmrc` lies, config X is dead). Commands the agent cannot guess.
5. **Verified smoke test** - copy-paste commands that prove a build works, with
   expected output. An agent with a check it can run closes its own loop;
   without one, every mistake waits for a human. Recipes must be verified once
   by a human or agent before being written down.
6. **Deployment** - image name and tag scheme, cluster/namespace/deployment
   names, the actual deploy mechanism, and explicit anti-patterns ("never helm
   upgrade this - the release is orphaned").
7. **Security** - secrets policy plus repo-specific history ("history leaked X;
   treat as compromised").
8. **Conventions** - only deviations from defaults (language, do-not-upgrade
   warnings, style constraints).

## What stays OUT

- Anything derivable by reading the code (file-by-file descriptions, API docs).
- Standard language conventions the model already knows.
- Fast-changing details (ticket numbers, current versions of everything) - they
  rot and rotten docs are worse than none.
- Secrets, even as examples. Placeholders only.

## Cross-repo interactions

If the repo depends on or is consumed by another repo, name it and link its
README/AGENTS.md (the Slack/Gauri pattern: cross-package interactions always
documented, READMEs link to each other). An agent working in repo A must be able
to discover that repo B's deploy consumes A's image.

## Maintenance rules

- Update AGENTS.md in the same PR as the change that invalidates it (new deploy
  pipeline => new Deployment section, same diff).
- Every incident postmortem asks: "what line in AGENTS.md would have prevented
  this?" Add it.
- Prune on every touch: if agents already behave correctly without a line,
  delete the line.

## Rollout to an existing repo

1. Gather facts from the running system, not from stale docs (check the real
   cluster, the real registry, the real branch the deploy builds from).
2. Verify the smoke test by running it.
3. Write AGENTS.md + CLAUDE.md shim + refreshed README. Start from
   [AGENTS.template.md](AGENTS.template.md).
4. Ship in a normal PR so the team reviews the claims.
