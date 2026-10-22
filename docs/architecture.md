# Architecture

Rocket Agents is a TypeScript control plane for agent policy and client
configuration. BRP provides workflow routing and reusable procedures within that
control plane.

## Ownership

| Component                | Responsibility                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Public control plane     | Rules, reusable skills, client adapters, schemas, diagnostics, and configuration convergence |
| Private machine instance | Host manifests, account ownership, authorization exceptions, and operating procedures        |
| Private skill sources    | Instance-specific workflows and their rule mappings                                          |
| Scribe                   | Conversation capture, archive storage, import, export, and transport                         |
| Atrium                   | Context indexing and retrieval                                                               |

Authentication state, credentials, client databases, and derived indexes stay
local or in approved private storage. Registering an external tool does not make
its data part of this repository.

## Source and distribution

`src/rules/` contains canonical rule bodies. `src/skills/` contains skill
definitions and supporting resources; `src/skills/skill-rules.map.json` maps
skills to rule references. Agent definitions and hook sources live in
`src/agents/` and `src/hooks/`. CLI entry points live in `scripts/bin/`,
commands in `scripts/commands/`, and their dependencies in `scripts/lib/`.

The build compiles rules, skills, and plugins into `dist/`. Skill compilation
injects rule indexes and emits Claude and portable variants. The portable
variant strips client-specific frontmatter. Plugin compilation packages the
Claude bundle and generates Codex agent definitions.

An optional `AGENTS_INSTANCE_SKILLS_DIR` supplies private skills and a
`skill-rules.map.json` fragment. Duplicate names across engine and instance
roots fail compilation. The public `llms.txt` generator filters the compiled
catalog to engine-owned names.

## Client installation

Link commands install generated artifacts into user-level client locations. The
product-managed canonical skill directory is `~/.agents/skills`; adapters
distribute skills to other locations where a target requires them. These
destinations are product conventions unless confirmed in the client's
documentation.

Edit canonical source, rebuild, verify, then install the relevant artifact. The
[setup guide](ide-setup.md) describes the mutation boundaries.

## Machine configuration

Machine commands resolve the instance directory from `--instance`, then
`AGENTS_MACHINE_DIR`, then the checkout's `machine/` directory. Public examples
reference environment variables rather than credential values.

Diff reports desired changes without applying them. Apply snapshots managed
configuration before changes; rollback restores a snapshot. MCP configuration,
security, plugins, capabilities, and services have separate domain
implementations. Provider credentials remain account-local.

Settings writers update only their owned keys and preserve third-party hooks,
permissions, and other unrelated fields. The Claude security writer merges its
owned values into existing settings and rejects invalid JSON before writing. Any
future general configuration domain must preserve this merge contract; replacing
the entire settings document would discard other clients' changes.

## Guidance and diagnostics

Guidance reconciliation reads private canonical policy, provider overlays, live
guidance, and accepted-run state. It validates reconciler output before applying
changes and creates a recoverable snapshot.

Agent diagnostics report client lifecycle and managed capabilities. Connector
diagnostics report declared profile scope, ownership, and health. Required
failures affect exit status; unavailable optional clients and optional external
outages remain visible. Reports redact home paths and credential-shaped output.

## Public content boundary

Public skills use role-based authorization and generic examples. Account names,
customer classifications, browser session observations, and host inventories
belong to the private instance. The
[boundary decision](adr/0002-public-engine-and-private-instance.md) records this
separation.
