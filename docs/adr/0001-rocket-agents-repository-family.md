# ADR 0001: Name the Repository Family Rocket Agents

- Status: Accepted
- Date: 2026-08-19

## Context

The agent environment depended on several repositories whose names predated
their current roles. `agents-tools` was the control plane and the repository
checked out at `~/.agents` was named `claude-skills` even though it feeds many
agent clients. `ai-state` described an older memory and conversation transport
that overlaps with the safe conversation synchronizer and Memstore.

Giving every dependency the same prefix would hide real ownership boundaries.
`dotfiles` manages the whole host, `brain` is a human knowledge vault, and
`memstore` is an upstream project with a local fork. Those repositories are
dependencies of the agent platform, not components that should be renamed to
look internal.

## Decision

The umbrella product name is **Rocket Agents**.

BRP remains the workflow engine and protocol inside Rocket Agents. It is not the
umbrella name.

Repository names owned exclusively by the platform follow this rule:

```text
rocket-agents[-<single-capability>]
```

The root control plane needs no capability suffix. A separately deployable or
independently versioned component uses one concrete capability noun, such as
`library`. Names based on a vendor, implementation language, machine, or
temporary transport are not used.

## Repository map

| Repository                        | Canonical role                                                                      | Decision                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `syntopica/agents`                | Public control plane: policy, manifests, adapters, diagnostics, and synchronization | Canonical root of the Rocket Agents family                |
| `syntopica/agents-library`        | Private curated skill library consumed by multiple clients                          | Canonical library; checked out beside this repository     |
| `<owner>/dotfiles` (private)      | Private host bootstrap and machine-specific instance data                           | Keep                                                      |
| `syntopica/brain`                 | Human-authored personal knowledge and operational source material                   | Keep                                                      |
| `<owner>/memstore-fork` (private) | Search/index runtime derived from source material and conversations                 | Keep upstream identity                                    |
| `<owner>/ai-state` (private)      | Legacy snapshot transport                                                           | Preserve Git history, archive, and remove from automation |

## Ownership boundaries

- Rocket Agents owns executable agent policy, cross-client adapters, health
  checks, and safe conversation transport.
- `dotfiles` installs the host and supplies private machine instance data. It
  may call Rocket Agents, but it does not implement agent orchestration.
- The library owns curated skill source and provenance. Generated client links
  are not source.
- `brain` owns deliberate human knowledge. It is never treated as generated
  runtime state.
- Memstore indexes data. Its live database is derived, machine-local state and
  is never mirrored byte for byte.
- Authentication, Keychain records, tokens, and client databases remain local to
  each machine.

## Migration policy

The repositories and their two-machine checkouts move in one coordinated
migration. The stable compatibility path `~/.agents` remains as a symbolic link
to `~/p/rocket-agents-library` because agent clients discover skills there. Git
remotes, package metadata, plugin namespaces, documentation links, managed rule
links, and scheduled jobs use the canonical names directly.

## Verification

The following commands verify the current boundaries without changing machine
state:

```bash
git remote get-url origin
pnpm run machine:diff -- --json
~/p/dotfiles/bin/sync-conversations peer-a dry
```

Expected results are the `syntopica/agents` remote, zero managed machine
changes, and a conversation preview that excludes credentials, SQLite databases,
and Memstore storage.

## Consequences

- Users get one stable name for the complete system and one distinct name for
  its workflow engine.
- Future platform repositories have a predictable, capability-based name.
- Existing external-purpose repositories keep honest names and ownership.
- The stable `~/.agents` discovery path does not expose the library's historical
  repository name.
