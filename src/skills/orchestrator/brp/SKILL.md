---
name: brp
description:
  Routes BRP requests to the right workflow chain by detecting project context
  and selecting the minimal rule set before work starts. Trigger when the task
  needs BRP command routing, protocol enforcement, or workflow selection across
  planning, implementation, testing, and review. Do not use for stack-specific
  coding guidance, single-purpose workflows that already have a precise BRP
  skill, or direct code generation without orchestration.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

## Rules

- Stack detection is deterministic, based on file presence.
- Precedence conflicts are resolved by the higher-priority level winning.
- If multiple stacks are detected, prefer the most specific match.
- Deterministic prompt routing is done by the UserPromptSubmit hook
  (`src/hooks/utils/route_prompt.py`): regex lanes emit an explicit skill
  directive before the model reasons about the prompt, and stay silent when
  nothing matches.
- The per-skill rule sets are mapped at build time in
  `src/skills/skill-rules.map.json`.

## Intent-to-workflow chains

The plan/implement/test/debug/fix/refactor/review stages are workflow references
under `references/` in this skill, not standalone skills — process skills
(brainstorming, writing-plans, systematic-debugging, test-driven-development)
own those lanes. Load a reference when its discipline is needed:

- New feature or ambiguous scope: `references/brp-plan.md` ->
  `references/brp-implement.md` -> `references/brp-test.md` ->
  `references/brp-review.md`.
- Known bug with a narrow cause: `references/brp-fix.md`. Unclear cause:
  `references/brp-debug.md` first, then `references/brp-fix.md`.
- Structural change with no behavior change: `references/brp-refactor.md`.

Standalone BRP skills keep the lanes the process family lacks:

- Docs, specs, or ADRs: `brp-docs`. Shipping a version: `brp-release`.
- Repo-wide quality gates: `brp-code-quality` (TypeScript/Next.js) or
  `brp-rust-quality` (Rust).
- Backlog work: `brp-todo-create` builds it, `brp-todo-work` executes it.
- Captured traffic to HTTP client: `brp-traffic-client`. Multi-agent handoff:
  `handoff`.
