# Rocket Agents control plane (BRP)

Agent workflow engine + rules/skills orchestrator that enforces planning,
testing, and review to consistently produce high-quality code across IDEs, with
global skills as the primary reusable BRP surface.

Rocket Agents is the umbrella for the cross-machine agent environment. BRP is
its workflow engine. The repository-family names and ownership boundaries are
defined in
[`docs/adr/0001-rocket-agents-repository-family.md`](docs/adr/0001-rocket-agents-repository-family.md).

## What It Is

BRP consolidates rules, skills, and an orchestration protocol into a single
project that works as:

- A **Claude Code plugin** (`dist/plugins/claude/.claude-plugin/plugin.json`)
  with a marketplace manifest, bundled subagents, and opt-in hooks
- A **multi-IDE rules exporter** for lightweight guidance layers
- An **AgentSkills-compatible** skill collection (14 validated skills) with a
  Claude variant (`dist/skills/`) and a portable variant
  (`dist/skills-portable/`, Anthropic-only frontmatter stripped) for non-Claude
  IDEs
- A generated Codex custom-agent adapter for the BRP reviewer
  (`dist/agents/codex/`)
- A **multi-IDE skill linker** for popular agents/editors including Cursor,
  Claude Code, Codex, Continue, Cline, Windsurf, Antigravity, Gemini CLI, Goose,
  OpenHands, Augment, Roo, Kiro, Copilot, OpenCode, OpenClaw, Crush, Zencoder,
  AdaL, Trae, Qoder, and Qwen Code

## Quick Start

```bash
# Clone and run full setup (install, build, check, link rules + skills to IDEs)
git clone https://github.com/syntopica/agents.git
cd agents
pnpm run sync
```

`sync` is the canonical bootstrap command (install, build, check, rules:link,
skills:link). To update dependencies and refresh everything: `pnpm run update`.

The machine instance is a directory of manifests the repository does not ship:
it describes one machine's MCP servers, connectors and plugins, so it stays
private. Create `machine/` from the sanitized manifests in `examples/machine/`,
or point any command at another directory with `--instance /absolute/path`. With
an instance in place, inspect MCP, shared security policy and managed capability
drift without changing client configuration:

```bash
pnpm run machine:diff -- --json
```

Apply the inspected plan, or restore the most recent pre-apply snapshot:

```bash
pnpm run machine:apply -- --json
pnpm run machine:rollback -- --json
```

Use `--instance <path>` or `AGENTS_MACHINE_DIR` only when intentionally testing
another instance. Tracked manifests contain environment references, never secret
values.

Audit every supported agent runtime and its managed capabilities without
changing client configuration:

```bash
pnpm run agents:doctor
pnpm --silent run agents:doctor -- --json > /tmp/agents-doctor.json
```

The doctor reports each platform as `active` when its command or desktop
application is installed, `provisioned` when managed configuration exists
without a detected runtime, or `unavailable` when neither exists. Missing
optional clients do not fail the command. A failed required capability on an
active or provisioned client exits with status 1; an invalid platform manifest
exits with status 2. Both human and JSON output are redacted before printing.
`unsupported` is a capability status, not a lifecycle: the client is present but
has no compatible adapter for that feature.

### Guidance reconciliation

Global Claude and Codex guidance is reconciled from a private canonical
directory: `shared.md` contains provider-neutral policy, while
`claude-overlay.md` and `codex-overlay.md` contain only documented
provider-specific behavior. The content, credentials, and local snapshots are
never stored in this public repository. Claude's instructions and path-scoped
rules are documented in the
[Claude Code memory guide](https://code.claude.com/docs/en/memory).

Run the public contracts against the private configuration directory:

```bash
pnpm run guidance:sync -- --config /absolute/path/to/agent-guidance --dry-run --json
pnpm run guidance:doctor -- --config /absolute/path/to/agent-guidance
pnpm run guidance:rollback -- --run <run-id>
```

`guidance:sync` gathers the canonical documents, the two live guidance files,
user-authored Claude rules, the generated rule inventory, and accepted-run
hashes. It invokes the configured reconciler in an OS sandbox with an empty home
and a scratch-only write area; the engine validates a strict JSON result,
current official Claude and Codex documentation evidence, input hashes,
invariants, target syntax, size limits, and secret/captured-conversation
exclusions before any write. The schema boundary follows the same closed-object
principle as
[OpenAI strict structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

`--dry-run` performs that validation but writes neither guidance nor snapshots.
A successful apply creates a complete, checksummed pre-apply snapshot; a partial
apply restores it. `guidance:rollback` is a live mutation that restores one
complete accepted run (the latest when `--run` is omitted), so inspect the run
and obtain authorization before invoking it.

### Conversation transport

Inventory local conversation sources without changing provider state:

```bash
pnpm run conversations:doctor -- --json
```

Export a SHA-256-verified, secret-redacted canonical JSONL archive and verify an
import as a dry-run:

```bash
pnpm run conversations:export -- --source pi --output /tmp/rocket-agents-pi.jsonl
pnpm run conversations:import -- --input /tmp/rocket-agents-pi.jsonl --archive /tmp/rocket-agents-archive.jsonl
pnpm run conversations:render -- --input /tmp/rocket-agents-archive.jsonl --output-dir /tmp/rocket-agents-corpus
```

Imports require `--apply` to write. Supported sources and the division between
transport and Memstore search are documented in
[`docs/research/conversation-capability-map.md`](docs/research/conversation-capability-map.md);
the operational safety contract is in
[`docs/runbooks/conversation-transport.md`](docs/runbooks/conversation-transport.md),
and the cross-repository no-duplication contract is in
[`docs/architecture/conversation-ownership.md`](docs/architecture/conversation-ownership.md).

Audit expected external connectors separately by Claude profile:

```bash
pnpm run connectors:doctor -- --json
pnpm run connectors:doctor -- --profile personal --json
pnpm run connectors:doctor -- --profile secondary --json
pnpm run connectors:doctor -- --profile codex --json
```

The connector report contains names and safe status categories only. Required
authentication or a required connector failure exits with status 1. Optional
external outages stay visible as degraded without failing otherwise healthy
local MCP infrastructure. See
`docs/runbooks/claude-connector-authentication.md`.

The Codex profile requires CodeGraph and a Codex-only Memstore server,
registered as `memstore-mcp --read-only`. Registration is checked with
`codex mcp list`; required stdio servers must also complete MCP `initialize`,
`notifications/initialized`, and `tools/list`, so a registered server that
cannot start is not healthy. This follows the
[MCP lifecycle specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle).
Use Memstore for read-only project-memory retrieval and `codegraph_explore` for
indexed code exploration; use native file/search tools for configuration or
content outside the index. See the
[Codex MCP guide](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) and
[Claude Code MCP guide](https://code.claude.com/docs/en/mcp) for client
configuration semantics.

For Codex and other skill-capable IDEs, the main BRP workflow surface is the
global skills pipeline. `AGENTS.md` remains useful as lightweight global
guidance and routing, but it is not the primary delivery mechanism for reusable
BRP workflows in this project. For Codex, `rules:link` copies generated config
into `~/.codex` instead of symlinking to `dist`, so Codex remains usable after
`dist` is cleaned or regenerated.

### As a Claude Code Plugin

After `pnpm run build` the plugin lives at `dist/plugins/claude/` with manifests
under `.claude-plugin/`, the 10 skills flattened in `skills/`, the
`brp-reviewer` subagent in `agents/`, and an opt-in SessionStart hook under
`hooks/`. Install it by pointing Claude Code at the plugin root or by publishing
the included `marketplace.json`. Then use `/brp-docs`, `/brp-release`,
`/brp-todo-work`, etc. The `brp` orchestrator skill is hidden from the `/` menu
(`user-invocable: false`) so it can only be invoked by the model when routing is
needed. The plan/implement/test/debug/fix/refactor/review stages live as
workflow references inside the orchestrator
(`src/skills/orchestrator/brp/references/`), not as standalone skills.

### As a multi-IDE distribution

`pnpm run skills:link` stages the canonical skill library used natively by
Cursor, Codex, Gemini CLI, Windsurf, and TRAE, then fans portable copies out to
Copilot, Antigravity, Continue, Cline, Goose, OpenCode, Augment, Roo, Kiro,
Junie, Kilo, OpenHands, Zencoder, AdaL, Qoder, Qwen Code, and OpenClaw. Claude
Code receives the full `dist/skills/` variant with Anthropic-only fields
(`allowed-tools`, `paths`, `agent`, etc.). Clients requiring a distributed copy
receive the stripped `dist/skills-portable/` variant.

## Workflow Commands

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `/brp-docs`           | README, API docs, ADRs, specs                          |
| `/brp-traffic-client` | Capture → Endpoint map → Direct HTTP client            |
| `/brp-release`        | Commits since tag → Semver bump → Changelog → Tag      |
| `/brp-rust-quality`   | Rust/Tauri quality, async and concurrency review       |
| `/brp-code-quality`   | Audit and harden TS/Next quality gates                 |
| `/brp-todo-create`    | History audit → TODO.md + TODO_LOG.md + coverage index |
| `/brp-todo-work`      | Plan approval → Execute backlog → Evidence → Log       |

## Workflow Protocol (Non-Negotiable)

Every task follows 6 steps:

1. **DISCOVERY** — Read existing code before creating abstractions
2. **PLAN** — 5–10 bullets with milestones + risks
3. **IMPLEMENT** — Minimal diffs, incremental changes
4. **TEST** — Tests + validation commands
5. **SELF-CHECK** — Final checklist
6. **REVIEW** — Security, performance, maintainability

> If plan or validation commands are missing, the output is **incomplete**.

## Project Structure

```
agents-tools/
├── src/                         # Source (canonical content)
│   ├── rules/                   # Canonical rule definitions (.mdc) — core, react, nextjs, rust,
│   │                            # typescript, php, python, go, bash, styling, deploy,
│   │                            # integrations (supabase/stripe/n8n), monorepo, …
│   ├── skills/
│   │   ├── core/                # 9 skills — docs, traffic-client, release, rust-quality,
│   │   │                        # code-quality, todo-create, todo-work, handoff,
│   │   │                        # project-continuation
│   │   ├── orchestrator/brp/    # Model-only router (user-invocable: false) + workflow
│   │   │                        # references (plan/implement/test/debug/fix/refactor/review)
│   │   └── skill-rules.map.json # Skill -> @rules manifest (source of truth)
│   ├── agents/                  # Claude Code subagents (.md)
│   │   └── brp-reviewer.md      # Isolated findings-first PR reviewer
│   ├── hooks/                   # Plugin-scoped hooks shipped inside the Claude plugin
│   │   ├── hooks.json           # Declarative hook manifest (SessionStart by default)
│   │   └── session-start-brp-reminder.sh
│   └── core/
│       └── protocol.md          # 6-step workflow contract
│
├── dist/                        # Compiled output (generated, gitignored)
│   ├── global/                  # Per-IDE compiled rules
│   │   ├── .cursor/rules/
│   │   ├── .claude/rules/
│   │   ├── .agent/rules/        # Antigravity (Gemini)
│   │   ├── .windsurf/rules/
│   │   └── codex/rules/
│   ├── markdown/                # Guidance / index layers
│   │   ├── ALL_RULES.md
│   │   ├── CLAUDE.md
│   │   ├── AGENTS.md
│   │   ├── GEMINI.md
│   │   └── WINDSURF.md
│   ├── skills/                  # Claude variant (full Anthropic frontmatter)
│   ├── skills-portable/         # Portable variant (Anthropic-only fields stripped)
│   ├── agents/codex/            # Codex TOML agents generated from src/agents
│   └── plugins/
│       └── claude/
│           ├── .claude-plugin/
│           │   ├── plugin.json
│           │   └── marketplace.json
│           ├── skills/          # Flattened from dist/skills
│           ├── agents/          # Copied from src/agents
│           └── hooks/           # Copied from src/hooks
│
├── scripts/                     # TypeScript build/link pipeline (tsx runtime)
│   ├── bin/                     # CLI entry points (run-compile-rules.ts, run-compile-skills.ts,
│   │                            # run-compile-plugins.ts, run-link-rules-global.ts,
│   │                            # run-link-skills-global.ts, …)
│   ├── commands/                # Orchestrator commands that bins import
│   ├── lib/                     # Reusable libs (fs, link, rules, skills, plugins)
│   └── constants/               # Path / limit constants shared across commands
└── package.json
```

## Skills (14 validated)

### Core Workflow Skills (10)

| Skill                   | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `brp-docs`              | Documentation generation (README, API, ADR)          |
| `brp-traffic-client`    | Traffic capture to maintainable HTTP client          |
| `brp-todo-create`       | Build a backlog and work log from agent history      |
| `brp-todo-work`         | Execute an existing TODO backlog under a gated plan  |
| `brain`                 | Search and maintain project-scoped memstore memory   |
| `handoff`               | Multi-agent handoff briefs                           |
| `invoice-quarter-close` | Reconcile quarterly invoices and tax evidence        |
| `lovable-sync`          | Synchronize Lovable designs with working apps        |
| `project-continuation`  | Resume interrupted work from git/TODO/plan artifacts |
| `stakeholder-recap`     | Produce evidence-backed stakeholder updates          |

### Specialized (3)

| Skill              | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `brp-release`      | Cut a versioned release from trunk (semver, changelog, tag)      |
| `brp-rust-quality` | Rust and Tauri quality, async and concurrency review             |
| `brp-code-quality` | Audit and harden TS/Next quality gates (path-scoped to TS repos) |

### Orchestrator (1)

| Skill | Purpose                                                                                      |
| ----- | -------------------------------------------------------------------------------------------- |
| `brp` | Model-only router with the plan/implement/test/debug/fix/refactor/review workflow references |

### Subagents (1)

| Subagent       | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `brp-reviewer` | Isolated, findings-first PR reviewer for Claude Code and Codex |

## Rule Categories

| Category       | Topics                                                       |
| -------------- | ------------------------------------------------------------ |
| `core`         | Code quality, boundaries, naming, anti-patterns, security    |
| `react`        | Component patterns, hooks, state, performance, accessibility |
| `nextjs`       | App Router, route handlers, caching, server actions          |
| `typescript`   | Standards, types, refactoring, debug                         |
| `styling`      | Tailwind v4, Bootstrap                                       |
| `rust`         | Language style, modules, async, Tauri                        |
| `php`          | Laravel, WordPress, WooCommerce, Drupal                      |
| `python`       | Django, REST API                                             |
| `go`           | Microservices                                                |
| `bash`         | Shell scripting standards                                    |
| `javascript`   | Chrome extensions, SvelteKit, Vue, HTMX, Shopify             |
| `deploy`       | GitHub security, Sonnet                                      |
| `integrations` | Supabase, Stripe, Payload CMS, n8n                           |
| `monorepo`     | Turborepo                                                    |

## Skills-First Delivery Model

BRP uses a dual-layer model for global distribution:

- `~/.agents/skills` is the canonical user directory managed by this product and
  discovered directly by Codex, Cursor, Gemini CLI, Windsurf, and TRAE
- `pnpm skills:link` fans those compiled skills out only to IDEs that require
  another location
- `AGENTS.md` remains a lightweight guidance layer and should not be treated as
  the primary BRP workflow surface for Codex

Important:

- the canonical directory above is a product convention
- IDE target paths are linker-managed distribution destinations
- do not describe those destinations as vendor-native documented paths unless
  verified separately

## Rules Tiers

Rules are structured in three tiers so that the always-loaded context stays
small:

- **Tier 0 (always loaded guidance):** Generated markdown such as `CLAUDE.md`,
  `AGENTS.md`, `GEMINI.md`, and `WINDSURF.md`. These are index-only guidance
  layers and routing aids, not the main reusable workflow surface for
  skill-capable IDEs.
- **Tier 1 (umbrella / reference):** Rule files such as `core.mdc`, `api.mdc`,
  `nextjs.mdc` that act as indices or pointers to other rules. They list
  references rather than duplicating content.
- **Tier 2 (full content):** All other `.mdc` files under `src/rules/`. Full
  content lives here and is synced to `dist/global/.claude/rules/`; the agent
  loads them when a rule is referenced.

Do not edit `CLAUDE.md` by hand; it is generated by `pnpm rules:compile`. Edit
files in `src/rules/` and recompile.

**Markdown outputs:** Generated under `dist/markdown/` by `pnpm rules:compile`.
`ALL_RULES.md` aggregates all canonical rules into a single reference.
`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `WINDSURF.md` are generated as
index-only guidance files: they list rule references and short descriptions
only; no rule bodies are inlined. `CLAUDE.md`, `AGENTS.md`, and `WINDSURF.md`
use `@rules/...`, while `GEMINI.md` uses `@.agent/rules/...` and
`@.agent/workflows/...`. This keeps the always-loaded context small. Full rule
content lives in `src/rules/` and is synced to each IDE’s rules directory. To
verify outputs against the Definition of Done (no inline mdc blocks, refs count,
size budget), run `pnpm rules:verify`.

**Codex exec-policy output:** `dist/global/codex/rules/default.rules` is
generated as Starlark, not Markdown. Human-readable guidance belongs in
`AGENTS.md`; `default.rules` is reserved for Codex exec-policy entries such as
command prefix rules.

## Rule Precedence

```
Task > Project > Stack > Global
```

- **Global**: Personal invariants (few lines)
- **Stack**: Next.js, React, Rust, PHP, Bash, etc.
- **Project**: Repo-specific overrides
- **Task**: plan, fix, refactor, review, debug

## Scripts

| Script                          | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `pnpm run sync`                 | Full project bootstrap (install, build, check, rules:link, skills:link)  |
| `pnpm run update`               | Update deps then run sync                                                |
| `pnpm run build`                | Compile rules, skills (Claude + portable), and the Claude plugin         |
| `pnpm run plugins:compile`      | Generate `dist/plugins/claude/` (plugin manifest + marketplace + bundle) |
| `pnpm run check`                | Run all validations                                                      |
| `pnpm run check:all`            | type-check, format, lint, rules:check, skills:validate/test, link:test   |
| `pnpm run check:ci`             | CI alias of check:all                                                    |
| `pnpm run machine:diff`         | Inspect MCP, security, and capability drift without writing              |
| `pnpm run machine:apply`        | Snapshot and converge managed machine configuration                      |
| `pnpm run machine:rollback`     | Restore a machine snapshot                                               |
| `pnpm run guidance:sync`        | Reconcile private canonical and live guidance; `--dry-run` never writes  |
| `pnpm run guidance:doctor`      | Check canonical policy, live guidance, and accepted-run state            |
| `pnpm run guidance:rollback`    | Restore one complete accepted guidance snapshot                          |
| `pnpm run agents:doctor`        | Inspect client lifecycle and managed capabilities                        |
| `pnpm run connectors:doctor`    | Inspect expected external connectors by profile                          |
| `pnpm run connectors:test`      | Test secret-free connector parsing and boundary probes                   |
| `pnpm run rules:compile`        | Compile `src/rules/` to `dist/global/` + `dist/markdown/`                |
| `pnpm run rules:link`           | Install compiled rule outputs into supported IDEs                        |
| `pnpm run skills:compile`       | Compile skills from `src/skills/` to `dist/skills/`                      |
| `pnpm run skills:inventory`     | Generate compatibility report for source skills                          |
| `pnpm run skills:link`          | Stage compiled skills canonically, then distribute to supported IDEs     |
| `pnpm run skills:package`       | Package compiled skills as zip artifacts                                 |
| `pnpm run rules:verify`         | Verify index-only outputs (DoD + CLAUDE golden master)                   |
| `pnpm run rules:check`          | Verify compiled output is current                                        |
| `pnpm run skills:validate`      | Validate all 14 skills against AgentSkills spec                          |
| `pnpm run skills:test`          | Run schema/idempotence/source-purity/snapshot/smoke tests                |
| `pnpm run skills:llms`          | Generate `llms.txt` for skill discovery                                  |
| `pnpm run skills:prompt`        | Generate XML prompt with all skills                                      |
| `pnpm run skills:prompt:file`   | Write prompt to `available_skills.xml`                                   |
| `pnpm run skills:version:check` | Check skill version consistency                                          |
| `pnpm run validate:install`     | Install Python venv for skills validation                                |
| `pnpm run format`               | Format all files with Prettier                                           |
| `pnpm run format:check`         | Check formatting without writing                                         |
| `pnpm run lint`                 | ESLint check                                                             |
| `pnpm run lint:fix`             | ESLint auto-fix                                                          |
| `pnpm run link:test`            | Unit tests for the IDE link registry                                     |
| `pnpm run type-check`           | Type-check with the native TypeScript 7 compiler (see below)             |

### TypeScript setup (dual alias)

TypeScript 7 is the native compiler, but it ships no programmatic API until 7.1,
so anything that does `import ts from "typescript"` — typescript-eslint included
— crashes against it. The project therefore uses the supported side-by-side
layout:

```jsonc
"typescript": "npm:@typescript/typescript6@^6.0.2",   // API consumers (ESLint)
"@typescript/native": "npm:typescript@^7.0.2"         // native compiler, type-check only
```

Do not collapse this to a plain `typescript@7` dependency — ESLint will fail
with `TypeError: Cannot read properties of undefined (reading 'Cjs')`. The
aliases can be merged once TypeScript 7.1 is stable and `typescript-eslint`
accepts `typescript@7` as a peer. Because both packages ship a `tsc` binary,
`type-check` calls the native one by explicit path rather than through `.bin`.

`sync` is the primary command used to bootstrap the project locally.

## Skills Compilation Contract

- `src/rules` is the only source of truth for rule content.
- `src/skills` must stay pure source: template `SKILL.md`, `agents/openai.yaml`,
  optional `references/`, `scripts/`, and `assets/`, no compiled Rules Index and
  no inline rule bundles.
- `dist/skills` is the installable artifact and receives generated `Rules Index`
  sections from `src/skills/skill-rules.map.json`.
- `pnpm skills:link` stages `dist/skills` into the product-managed canonical
  directory `~/.agents/skills` and then distributes those artifacts to
  IDE-specific targets.
- `pnpm skills:link` also links generated Codex custom agents into
  `~/.codex/agents` and the canonical Claude definitions into
  `~/.claude/agents`.
- Each source skill must define `name` and `description` in frontmatter. It may
  also carry Claude-only execution hints (`allowed-tools`, `agent`, `context`,
  `model`, `effort`, `argument-hint`, `user-invocable`, etc.); these are listed
  in `ANTHROPIC_ONLY_FRONTMATTER_FIELDS` and stripped from the
  `dist/skills-portable` variant for non-Claude IDEs.
- Richer interface/policy metadata (display name, default prompt, skill class,
  failure mode) belongs in `agents/openai.yaml`, not in `SKILL.md` frontmatter.

### Skill Quality Contract

- Write descriptions for strong implicit invocation:
  - what the skill does
  - when it should trigger
  - when it should not trigger
- `agents/openai.yaml` is required and should define:
  - `interface.display_name`
  - `interface.short_description`
  - `interface.default_prompt` for workflow skills
  - `policy.allow_implicit_invocation`
  - `busirocket.skill_class`
  - `busirocket.failure_mode` for workflow skills
- Use `references/` for high-value progressive disclosure when a workflow needs
  structure or rubrics. Do not add references or scripts unless they improve
  fidelity or determinism.
- Declare `dependencies.tools` when a skill meaningfully depends on MCP or other
  tools.

### Skill Classes

- `workflow` — routes and executes multi-step work with explicit outputs,
  boundaries, and escalation.
- `domain` — injects narrower implementation constraints for a stack or
  subsystem.
- `execution-assist` — adds deterministic helper behavior through references,
  scripts, or tools.

### Skill-Rules Governance

- Use `src/skills/skill-rules.map.json` to map skills to `@rules/...`
  references.
- Recommended size: 3-8 rules per skill.
- Warning threshold: 10+ rules. Manual review threshold: 12+ rules.
- Prefer mapping order: core -> stack -> specialty -> optional.
- If a skill keeps growing, split scope into a new skill instead of adding more
  rules.
- Keep workflow sequencing, deliverable format, escalation rules, and tool
  discipline inside the skill. Keep reusable coding laws and architectural
  heuristics inside rules.

### Skills Pipeline

```bash
pnpm run rules:compile
pnpm run skills:compile
pnpm run skills:validate
pnpm run skills:test
pnpm run skills:package
pnpm run skills:link
```

The skill library has three deliberate views:

- Raw source lives under `~/.agents/skills` with upstream files and provenance
  intact.
- Claude-native output preserves Claude frontmatter such as `allowed-tools` and
  `argument-hint`.
- Portable output under `~/.agents/compiled/<target>/skills` strips client-only
  fields and assigns filesystem-safe aliases while retaining the logical key in
  curation metadata.

Use `pnpm run skills:portability -- --library ~/.agents --json` to classify the
raw library and `pnpm run library:link -- --target <id> --dry-run --json` to
compile and inspect a target view. `check:all` validates the portable repository
output and any managed Codex/Gemini catalog present on the machine without
changing either source or runtime links.

A sweep reports one row per runtime, counting readable skills and broken links
without reading account identity or credentials:

| Runtime          | Readable skills | Broken links |
| ---------------- | --------------: | -----------: |
| Claude personal  |               n |            0 |
| Claude secondary |               n |            0 |
| Codex canonical  |               m |            0 |
| Gemini CLI       |               m |            0 |

Both Claude profiles share the same non-identity skills directory. Codex,
Cursor, Gemini CLI, Windsurf, and TRAE discover the canonical library directly,
so target-compiled catalogs are validated artifacts rather than a second linked
runtime copy. Optional executable warnings remain visible without being
misreported as broken skill imports.

`pnpm run skills:validate` also writes
`dist/reports/skills-quality-report.{json,md}` so low-fidelity skills and
activation collisions can be ranked instead of only pass/fail checked.

## Plugins

### Cursor Plugin

Location: `dist/plugins/cursor/.cursor-plugin/plugin.json`

Bundles all rules and skills as a single Cursor plugin named **BusiRocket
Agents**.

### Claude Code Plugin

Location: `dist/plugins/claude/.claude-plugin/plugin.json`

Use with: `claude --plugin-dir /path/to/agents/dist/plugins/claude`, after
`pnpm build`

## Roadmap

- **Phase 1 (MVP)** ✅ — Orchestrator, 8 core skills, canonical rules, IDE
  exports, plugins
- **Phase 2** — Registry: index 8000+ skills, allowlists per stack, scoring
- **Phase 3** — Auto-evolution: success/failure tracking, allowlist reordering

## License

MIT
