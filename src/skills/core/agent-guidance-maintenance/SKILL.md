---
name: agent-guidance-maintenance
description:
  Updates the owner's agent instruction stack. Trigger when shared guidance, a
  Claude or Codex overlay, a rule, the rules inventory, a skill, a hook, plugin
  settings or a profile link is about to be written, rendered, linked or
  reconciled, or when guidance does not seem to load. Covers where each source
  lives, how each client loads instructions, and what a change must preserve. Do
  not use for ordinary work that only follows the guidance.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# Agent guidance maintenance

The always-loaded guidance keeps only what ordinary sessions act on. The
mechanics below matter only while the stack itself is being changed, so they
live here.

## Sources and render

- Canonical sources:
  `~/p/dotfiles/agent-guidance/{shared.md,claude-overlay.md,codex-overlay.md,policy.json}`.
- `~/.claude/CLAUDE.md` is `shared.md` + blank line + `claude-overlay.md`;
  `~/.codex/AGENTS.md` is `shared.md` + blank line + `codex-overlay.md`. Both
  renders must equal their sources byte for byte.
- Every `policy.json` `requiredInvariants` entry must appear verbatim in
  `shared.md`. Check with `bash scripts/test-agent-guidance` in `~/p/dotfiles`.
- Global rules are authored in `~/p/agents/src/rules/global/*.mdc`; the `.md`
  files under `~/.claude/rules/` are generated. Skills are authored in
  `~/p/agents/src/skills/core/<name>/SKILL.md` and registered in
  `src/skills/skill-rules.map.json`.
- Before rewriting, shortening or deleting an instruction with a behavioural
  claim, consider `instruction-ab-test`.

## Shared guidance rules

Apply only stack-specific and path-specific rules relevant to files in scope.
Treat `generated/rules-inventory` as a router to full rules: open the inventory
and relevant full sources before applying them; never infer requirements from
titles alone. Preserve that inventory unchanged, including every source-file
mapping, description, and section covering entrypoints, API, backend, shell,
core, deployment, global workflows, Go, integrations, JavaScript, monorepos,
n8n, Next.js, PHP, Python, React, refactoring, Rust, styling, TypeScript, and
Vite. Resolve references as file-location pointers relative to the inventory or
configured source root; use synchronized full counterparts when appropriate.
Report unavailable full sources. Keep unrelated stack rules out of global
context and provider loading syntax in overlays.

The inventory's legacy recall example is superseded by the required
`atrium_context` workflow above. Its instruction to retain the existing Git
email is qualified by the standing project email correction rule above; preserve
user.name and correct a conflicting repository-local email. Its file references
identify sources; provider-specific loading behavior is defined only in the
relevant overlay. Retain its full atomic-file rule, extraction examples,
banned-patterns table, and self-check checklist in their owning full rule
sources rather than inventing missing content from the index.

Keep global guidance lean, concrete, non-duplicative, and conflict-free. Move
stack-specific or path-specific behavior to scoped rules and repeatable
procedures to on-demand skills. Preserve hard constraints, approval boundaries,
outcomes, success criteria, domain context, stopping rules, required formats,
and examples encoding product requirements or measured corrections. Remove
obsolete, repeated, generic, or unrelated steering. Select effort deliberately
for the active model.

## Claude Code loading

Render shared guidance followed by this overlay into the user-level `CLAUDE.md`
under the canonical Claude configuration directory. Target fewer than 200 lines
per always-loaded instruction file; move repeatable procedures to skills and
stack-specific material to path-scoped rules.

Claude Code loads managed, user, project, and local guidance. Ancestor files
concatenate root-first, with `CLAUDE.local.md` after `CLAUDE.md` at each level.
Child-directory guidance loads when files there are accessed. Concatenation is
behavioral context, not guaranteed conflict resolution. Use `/memory` to inspect
guidance, `/context` to confirm loading, and `claudeMdExcludes` for supported
exclusions.

Supported `@path` imports resolve relative to the containing file and accept
relative or absolute paths. Imported content consumes context; backticked
references are literal pointers. Legacy inventory references do not implement a
separate lazy-loading runtime. Open the relevant full rule sources explicitly
when they have not actually loaded.

Claude Code v2.1.277+ can read project `AGENTS.md` when built-in support is
enabled. By default, ancestor project `CLAUDE.md`, `.claude/CLAUDE.md`, or
`CLAUDE.local.md` suppresses automatic loading; user and managed guidance do
not. `/config` can select both formats. An import or suitable symlink remains a
compatibility fallback. Verify installed-version support and actual loading;
never retain the obsolete blanket assertion that Claude cannot read `AGENTS.md`.
See [memory and instruction loading](https://code.claude.com/docs/en/memory).

Keep stack-specific Markdown rules in `.claude/rules/` with documented `paths`
frontmatter. Unscoped rules load at launch; scoped rules load when matching
files are accessed. Put repeatable or task-specific procedures in skills. Use an
installed command, skill, or plugin when it implements a workflow intent;
otherwise use native capabilities. For authorized delegation, use supported
subagents or workflows and apply shared authorization, verification, and
reporting requirements.

Use settings, permissions, sandboxing, and hooks for enforceable boundaries.
Managed instructions may also be supplied through supported managed settings.
See [settings scopes and precedence](https://code.claude.com/docs/en/settings).

Keep the primary configuration directory canonical. As a local maintenance
convention, a secondary profile may symlink account-independent guidance, rules,
skills, agents, commands, plugins, and settings. Credentials, sessions,
histories, caches, authentication, auto-memory, account configuration, and
connector authorization remain profile-specific. Align MCP server lists without
printing environment values, use absolute hook paths, update shared plugins from
one session at a time, and verify loading in secondary profiles. This convention
is not a provider guarantee.

Respect documented external-import approvals. Desktop Cowork sessions skip
external user-scope imports and certain guidance symlinks or hard links.
External project rule symlinks require approval; approved external linked rules
load only when unscoped. Verify session compatibility before sharing
configuration through links.

## Codex loading

Render shared guidance followed by this overlay into the global `AGENTS.md` in
the configured Codex home directory.

At global scope, Codex uses the first non-empty instruction file, preferring
`AGENTS.override.md` over `AGENTS.md`. At project scope, it walks from the
project root to the current directory, choosing at most one file per directory
in override, standard, then configured-fallback order. Without a project root,
it checks only the current directory. Selected files concatenate root-first;
nearer guidance takes precedence. Discovery happens once per run, usually once
per launched TUI session.

Respect `project_doc_max_bytes`, default 32 KiB, and
`project_doc_fallback_filenames`. Raise the limit or distribute guidance across
appropriate scopes when necessary; nesting does not bypass the combined
discovered-chain limit. Restart the session after changing instruction files.
See
[Codex instruction discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Configured fallback filenames can support repositories without `AGENTS.md`. Keep
guidance self-contained for Codex loading. Resolve references relative to the
referring file or configured source root and explicitly open their targets. Read
`generated/rules-inventory` as an unchanged source map, then open the relevant
full sources or synchronized counterparts and inspect their path or glob scope.
Render any selected external guidance as ordinary instructions or use
appropriate scoped `AGENTS.md` files; another client's syntax does not activate
a Codex rule loader. Do not carry another client's import directives into Codex
instruction documents or load unrelated stack rules globally.
