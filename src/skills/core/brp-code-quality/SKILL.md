---
name: brp-code-quality
description:
  Audits and hardens a TypeScript or Next.js repo up to the BusiRocket baseline
  (strict typing, lint, architectural boundaries, agent-ready docs). Trigger
  when the task is to bootstrap or improve repo-wide quality gates or bring a
  repo up to the baseline, and a `tsconfig.json` or `next.config.*` is present.
  Triggers (ES) are sé super estricto, mete la baseline busirocket. Do not use
  for Python, Go, Rust, PHP, or any non-TypeScript project, isolated bug fixes,
  feature delivery, or behavior-preserving refactors inside a single module.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
paths: tsconfig.json, next.config.*
---

## Rules

- Always audit before making changes. Report findings first.
- Prefer incremental hardening over a big-bang rewrite.
- If the project uses npm or yarn instead of pnpm, adapt commands accordingly.
- If the project is not Next.js, skip Next.js-specific steps (runtime
  boundaries, app router conventions).
- Write the ESLint flat config from the loaded quality rules (code-quality
  guidelines, import hygiene, boundaries), adapting `react.version`, path
  aliases, and boundary patterns to the actual project rather than pasting a
  fixed config.
- The baseline includes agent-ready documentation, not just tooling. Load
  `references/agent-ready-standard.md` for the full standard and
  `references/AGENTS.template.md` as the starting file; facts go in AGENTS.md
  only, CLAUDE.md is a one-line `@AGENTS.md` shim, and every smoke-test recipe
  is verified by running it before it is written down.

## Workflow

1. Detect the stack: package manager, TypeScript config, framework, existing
   lint and CI gates.
2. Audit strictness flags, lint coverage, boundary enforcement, and runtime
   safety, letting git hot spots (the files that keep coming up in `git log`)
   pull attention first; audit the agent-ready docs against
   `references/agent-ready-standard.md` (AGENTS.md presence and accuracy,
   CLAUDE.md shim, smoke test, deploy facts). Report findings first.
3. Apply the smallest hardening steps, gated by the project's check script after
   each one.
4. Write or update AGENTS.md, the CLAUDE.md shim, and the README per the
   standard, gathering facts from the running system rather than stale docs, and
   running the smoke test before recording it.
5. Re-run the checks and report what changed, what is left, and any residual
   risk.

## Output

- Return: findings from the audit, hardening steps applied, check results,
  agent-ready docs written or updated, and the remaining gaps with their risk.
