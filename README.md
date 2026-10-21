# Rocket Agents

Rocket Agents builds and distributes agent rules, skills, hooks, and a Claude
Code plugin. It also provides diagnostics and manifest-driven configuration for
supported agent clients. BRP is the workflow protocol and router included in
this control plane.

## Build and verify

Use Node.js 22.13 or newer and the pnpm version pinned in `package.json`. See
the [pnpm installation guide](https://pnpm.io/installation) if pnpm is
unavailable.

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run check
```

Run these commands from a checkout of this repository. Build output stays under
the ignored `dist/` directory. Installation runs the package's Git-hook setup;
build and check do not install agent configuration into your home directory. The
check command formats files and applies lint fixes.

## What is included

- Canonical rules under `src/rules/` and reusable skills under `src/skills/`.
- A BRP reviewer agent, hook scripts, and per-client rule adapters.
- A Claude Code plugin at `dist/plugins/claude/`.
- Claude skills at `dist/skills/`, portable skills at `dist/skills-portable/`,
  and Codex agent definitions at `dist/agents/codex/`.
- Machine configuration diffs, snapshot-backed apply and rollback, and agent,
  connector, and guidance diagnostics.

The public skill catalog is in [llms.txt](llms.txt). Private instance skills can
extend a local build, so its installed catalog can differ. Cursor receives
generated rules through the linker; the build produces no Cursor plugin.

## Install into agent clients

Global installation is a separate operation that changes user-level client
configuration. Inspect the destinations and choose the rules, skills, or hooks
you want using the [client setup guide](docs/ide-setup.md).

The `sync` command combines dependency installation, build, checks, and global
rules, skills, and hook installation. The `update` command updates dependencies
and then runs `sync`. Both change your agent environment.

## Public engine and private instance

This repository contains executable policy, adapters, schemas, tests, and
sanitized examples. Keep account identities, customer lists, authentication
state, machine manifests, private guidance, conversations, and operating history
in a private instance.

The [example manifests](examples/machine/) show the configuration format.
Machine commands resolve an instance from `--instance`, then
`AGENTS_MACHINE_DIR`, then `machine/` in the checkout. Local `machine/` contents
are ignored. Optional private skill sources use `AGENTS_INSTANCE_SKILLS_DIR`.

Conversation capture and archive transport belong to
[Scribe](https://github.com/syntopica/scribe); context indexing and retrieval
belong to [Atrium](https://github.com/syntopica/atrium). Rocket Agents
integrates with those tools through instance configuration.

## Documentation

- [Architecture and ownership](docs/architecture.md)
- [Client installation and diagnostics](docs/ide-setup.md)
- [Connector authentication](docs/runbooks/claude-connector-authentication.md)
- [Contributor guide](docs/contributing.md)
- [Repository naming decision](docs/adr/0001-rocket-agents-repository-family.md)
- [Public content boundary](docs/adr/0002-public-engine-and-private-instance.md)
- [Agent-ready repository standard](docs/agent-ready-repo-standard.md)

## License

[MIT](LICENSE)
