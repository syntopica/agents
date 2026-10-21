# Client setup and diagnostics

Start with the build and verification commands in the [README](../README.md).
Review generated artifacts under `dist/` before installing them. Each linker
below changes user-level configuration; run only the installations you intend to
use.

## Global installation

| Command                | Effect                                                                        |
| ---------------------- | ----------------------------------------------------------------------------- |
| `pnpm run rules:link`  | Installs generated rule outputs into supported clients                        |
| `pnpm run skills:link` | Stages canonical skills and distributes client adapters and agent definitions |
| `pnpm run hooks:link`  | Installs managed hook scripts and integrations                                |

These command names document deliberate installation; they are outside the
repository-only verification sequence. Contributors must follow `AGENTS.md`
authorization rules before running them.

The canonical skill directory is `~/.agents/skills`. Claude uses the Claude
bundle; portable output supports other clients. Codex consumes canonical skills
and generated custom agents. The registry in
`scripts/lib/link/constants/IDE_REGISTRY.ts` defines target paths and
strategies. Support varies by capability; a rules adapter does not imply a
plugin adapter.

Codex skill trimming follows the curated Claude skill links. Explicit skill
exclusions outside the generated configuration block survive regeneration. An
unreadable selection or library aborts trimming before any configuration write;
an absent selection is not treated as an empty one.

When Codex has a configuration file, `hooks:link` also checks its native BRP
hook registrations. Copying hook scripts does not register or trust them. A
missing, disabled, or untrusted registration fails the check without changing
native registrations or unrelated handlers.

## Claude Code plugin

The plugin root is `dist/plugins/claude/`; its manifest is
`.claude-plugin/plugin.json` beneath that root. Skills, agents, and hooks are
packaged together. Follow the
[Claude Code plugin documentation](https://code.claude.com/docs/en/plugins) to
load a local plugin or install through a marketplace.

The BRP router keeps plan, implementation, test, debug, fix, refactor, and
review procedures in workflow references. Those procedure names are not separate
installed skills.

## Private instance

The sanitized manifests under `examples/machine/` describe MCP servers,
connector health expectations, and security configuration. Copy examples into a
private instance and adapt them before inspecting a plan. Example servers are
illustrative; install executables and configure their paths before declaring
them required.

Machine commands accept `--instance <directory>`. Without that option they use
`AGENTS_MACHINE_DIR`, then `machine/` in the checkout. That local directory is
ignored. Keep credentials in approved storage and reference environment
variables from manifests.

Inspect an instance with `pnpm run machine:diff` and the relevant flags. Apply
and rollback are separate mutations. Review the plan, snapshot behavior, and
authorization before invoking either. A public example is not an approved
configuration for an existing machine.

## Diagnostics

| Command                      | Reports                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `pnpm run agents:doctor`     | Clients and managed capabilities                         |
| `pnpm run connectors:doctor` | Connector registration, ownership, and authentication    |
| `pnpm run hooks:doctor`      | Native Codex BRP hook registrations and trust            |
| `pnpm run guidance:doctor`   | Canonical guidance, live targets, and accepted-run state |
| `pnpm run machine:diff`      | Proposed machine changes                                 |

Flags select an instance, profile, or JSON output as each command supports.
Reports can fail when required configuration or executables are absent.

Client lifecycle distinguishes `active`, `provisioned`, and `unavailable`. An
`unsupported` capability has no compatible adapter. The private manifest
determines required capabilities and connectors.

Use the [authentication runbook](runbooks/claude-connector-authentication.md)
for account-local authentication.

## Canonical guidance

Private guidance contains `shared.md`, `claude-overlay.md`, and
`codex-overlay.md`. Reconciliation renders provider targets from those sources.
Keep identity rules, client lists, standing authority, and operating history
there.

The generated rule inventory is a routing layer. Open relevant full rule
sources; another client's import syntax does not activate a rule loader.

### Review a reconciliation proposal

`guidance:sync --proposal-output <file>` saves a validated proposal and reports
its SHA-256 without installing guidance or creating an accepted-run snapshot.
The destination must be a new file in an existing owner-private directory. The
proposal contains private guidance and target paths; keep it outside this public
repository.

Apply reviewed bytes with `--apply-proposal <file> --proposal-sha256 <hash>`.
Application checks the exact file hash, target paths, policy, and original
source hashes before using the snapshot-backed writer. Changed inputs, tampered
files, proposals older than 24 hours, and conflicting modes are rejected.
Applying a proposal does not run the reconciliation agent again.

The existing `--dry-run` mode validates without saving a proposal. Published
guidance adoption still refuses to replace locally edited instruction files.

## Verification without installing client configuration

Repository tests exercise apply and linker behavior against temporary fixtures.
Use `pnpm run check` for that verification. Select focused test scripts from
`package.json` when investigating one area. Live installation and account
authentication are separate actions.
