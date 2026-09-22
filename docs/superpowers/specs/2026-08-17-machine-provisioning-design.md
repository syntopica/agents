# Machine provisioning - design

Status: approved for planning, 2026-08-17.

## 1. Problem

Agent tooling on a developer machine is spread across surfaces that nothing
reconciles: skills in two directories, plugins in a cache, MCP servers in four
different config formats, CLIs from four package managers, and background
services as launchd plists. Today the only mechanism that carries this to a
second machine is rsync mirroring, which requires a live reference host over SSH
and copies state rather than declaring it.

A sweep of a reference machine measures the result, and the shape repeats on any
machine that has been used for a while.

- **MCP diverges past the point of memory.** Dozens of distinct servers across
  five config scopes, only a handful appearing in more than one agent. One
  agent's config file can sit at zero bytes for weeks while documentation still
  describes the servers it used to hold, and servers that hardcode an absolute
  path under the user's home cannot survive a move.
- **Nothing records intent, only state.** The plugin cache holds gigabytes of
  plugins, many disabled and many keeping stale older versions. Reinstalling the
  list without the enabled/disabled state does not reproduce the machine; it
  produces a noisier one.
- **Skills are offered to the wrong agents.** One agent's skills directory holds
  a few symlinks into the working repository while the bulk of the library,
  hundreds of `SKILL.md` files, is reachable only from another agent. Over a
  month of transcripts, a small fraction of those bundles is ever invoked.
- **Credentials leak because nothing forbids them.** Credentials sit as literals
  inside `args` and `env` in config files that sync tools mirror wholesale to
  other hosts. No schema exists that could reject them, which is why this design
  adds one.
- **Several core tools have no install provenance.** Agent CLIs exist as opaque
  binaries or app-managed symlinks with no recorded way to reinstall them.

## 2. Scope

Build a declarative provisioning engine that captures a machine's agent
configuration into manifests, diffs manifests against a live machine, and
applies them to converge, with rollback.

**In scope:** seven domains (`sources`, `runtime`, `config`, `mcp`, `plugins`,
`skills`, `services`), profile composition, secret references, snapshot and
rollback, macOS and Linux.

**Out of scope, deliberately:**

- Session credentials (`.credentials.json`, `auth.json`, keychain entries).
  These are re-authenticated by hand on a new machine.
- claude.ai connectors. They are authorised server-side per account; no file
  moves them.
- Conversation history (`~/.claude/projects`, `history.jsonl`). That is data,
  not configuration, and `sync-ai` already mirrors it.
- Codegraph indexes. `codegraph init` regenerates them faster than copying them.
- The shell, brew and dotfile layers that `~/p/dotfiles/bootstrap.sh` already
  owns. This engine is called by that bootstrap, it does not replace it.

## 3. Architecture: engine and instance

The engine lives in this repo, which is public and contains no personal data. It
holds schemas, capture readers, per-target renderers, the CLI, and example
manifests used by the tests.

The manifests holding real values live outside it, in the private
`the private dotfiles repository` repo. They name hosts, absolute paths, which
servers are wanted and which profile a machine runs.

```
agents-tools (public)                    dotfiles (private)
  src/machine/<domain>/                    machine/profiles.json
    read.ts plan.ts apply.ts verify.ts     machine/mcp.json
  src/machine/schemas/                     machine/plugins.json
  scripts/bin/run-machine-*.ts             machine/skills.json
  examples/machine/          <- tests      machine/runtime.json
                                           machine/services.json
```

The instance directory is resolved from `--instance <path>`, else
`AGENTS_MACHINE_DIR`, else `~/p/dotfiles/machine`. Tests always pass
`--instance examples/machine`, so the suite never reads the developer's home.

This split is what keeps the engine reusable by anyone: the repo can be cloned
and pointed at a different instance directory with no edits.

## 4. Domain contract

Every domain exports the same four functions, one per file, per the atomic file
rule:

```ts
read(env: Env): Promise<State>                  // observe, never write
plan(manifest: Manifest, state: State): Change[] // pure, no IO
apply(changes: Change[], env: Env): Promise<Result[]>  // the only writer
verify(env: Env): Promise<Health>               // confirm the effect
```

`plan` being pure is what makes the engine testable: a test hands it a manifest
and a fabricated state and asserts on the changes, with no machine involved. The
existing `link:test` already works this way.

`verify` is separate from `apply` because writing a file is not the same as
having installed something. The memstore LaunchAgent was down from 29 July and
nothing noticed, because the plist was still on disk. `verify` for the services
domain asks the process, not the filesystem.

`Change` is a discriminated union per domain, always carrying enough to be
reversed: the target, the operation, the desired value and the observed prior
value.

## 5. Domains

| Domain     | Owns                                  | Targets                                               |
| ---------- | ------------------------------------- | ----------------------------------------------------- |
| `sources`  | git checkouts the rest depends on     | `agents-tools`, `~/.agents`, `brain`, `memstore` fork |
| `runtime`  | CLIs and packages                     | brew/apt, uv tools, pnpm globals                      |
| `config`   | agent settings files                  | `settings.json`, `AGENTS.md`, `GEMINI.md`, rules      |
| `mcp`      | MCP server definitions                | four config formats                                   |
| `plugins`  | marketplaces, plugins, enabled state  | Claude plugin cache                                   |
| `skills`   | the curated skill set and its fan-out | every IDE the linker knows                            |
| `services` | background daemons                    | launchd or systemd                                    |

`sources` runs first because `runtime` installs from local checkouts: memstore
must be `uv tool install --editable ~/p/memstore` from the fork on
`local/3.7.0-prefetch`, and installing it from PyPI silently reverts every local
fix while looking correct.

`services` runs last because it is the only domain that starts processes.

Dependencies are declared per domain rather than hardcoded in a list, so a
profile that omits a domain does not break the ordering of the rest.

## 6. MCP schema

One record per server, absence modelled by the `targets` list rather than by
partial files:

```yaml
servers:
  serena:
    targets: [claude-personal, claude-secondary, codex]
    transport: stdio
    command: uvx
    args:
      [
        '--from',
        'git+https://github.com/oraios/serena',
        'serena',
        'start-mcp-server',
      ]
    target_overrides:
      codex: { args_append: ['--context', 'ide-assistant'] }
      claude-personal: { args_append: ['--context', 'claude-code'] }
  context7:
    targets: [claude-personal, claude-secondary, codex]
    transport: http
    url: https://mcp.context7.com/mcp
    headers:
      CONTEXT7_API_KEY: { from_env: CONTEXT7_API_KEY }
```

Validator invariants:

1. **No credential literals.** Every value in `env`, `headers`, and every
   element of `args` must be either a `{ from_env: NAME }` reference or match an
   allow-list of plainly harmless values (transport words, flags such as
   `--readOnly`, URLs with no userinfo component). The
   `mongodb+srv://user:pass@host` argument that leaked on 2026-08-17 fails this
   check. This invariant is the entire reason the schema exists.
2. `transport` decides the shape: exactly one of (`command` plus `args`) or
   `url`.
3. `target_overrides` carries semantic deltas only, such as Serena's context or
   chrome-devtools' `--autoConnect`. Serialization differences between JSON and
   TOML belong to the renderer, never to the manifest.

Renderers are one file per target format. The Codex renderer emits native TOML
tables rather than the current shell-wrapped `mcp-remote` bridge for HTTP
servers.

## 7. Secrets

The manifest declares names; the resolver finds values at apply time, in order:
process environment, then the brain (`~/p/brain`), then unresolved.

An unresolved reference is not an error. The domain applies everything it can
and the run reports each missing name and the server that wanted it. A machine
without the brain checked out still gets a complete, working configuration minus
the servers that need credentials.

`capture` never records a secret. When it reads a literal where a reference
belongs it writes the reference and reports a finding, leaving the value out of
the manifest entirely. Capturing the reference machine today would have produced
a clean manifest and ten findings.

## 8. Ownership tracking

Third-party tools write into the same files this engine manages. `settings.json`
currently carries hooks injected by orca, atuin and warp that the user did not
add by hand. A writer that replaces the file destroys them; a writer that only
adds can never remove what it added in an earlier run.

The engine keeps a sidecar at `~/.agents-machine/owned.json` recording which
keys it wrote, per file. On the next apply it removes only its own keys that the
manifest no longer declares, and does not look at anything else.

Without this, `apply` can only grow. With it, deleting a server from `mcp.json`
removes it from all four configs and leaves foreign keys untouched.

## 9. Snapshots and rollback

Every `apply` opens a run directory at `~/.agents-machine/runs/<run-id>/`
containing, before any write: the verbatim prior bytes of every file the plan
will touch, the prior `owned.json`, the plan itself, and the observed prior
state per domain. Writes begin only once the snapshot is complete.

Rollback is tiered, because not every change is a file:

**Tier 1 - exact restore.** `config`, `mcp`, `skills`. These are files and
symlinks. Rollback writes the snapshotted bytes back and restores `owned.json`.
Complete and safe.

**Tier 2 - restore and reload.** `services`. Rollback restores the prior plist
or unit and reloads it through launchd or systemd, then runs `verify` to confirm
the service came back. A restored file whose service does not start is reported
as a failed rollback, not a successful one.

**Tier 3 - compensating actions.** `runtime`, `plugins`, `sources`. There is no
byte-level undo for an install. Rollback uninstalls what this run installed, and
reinstalls the previously pinned version where the prior state recorded one. It
**never removes anything the run did not install**, which is the rule that keeps
rollback from being more destructive than the mistake it undoes.

```
machine rollback              # revert the most recent run
machine rollback --to <id>    # revert a specific run
machine rollback --domain mcp # revert one domain of it
machine runs                  # list runs with timestamp, profile, status
```

Rollback is itself a run: it snapshots before it writes, so a rollback can be
rolled back.

Retention keeps the last ten runs and prunes older ones. Snapshots hold config
files, not caches, so the directory stays small; the plugin cache is never
snapshotted and tier 3 handles it by reinstalling versions.

Two honest limits, stated rather than hidden. A tier 3 rollback depends on the
prior version still being resolvable from its marketplace or registry; when it
is not, the rollback reports that domain as unrecoverable and leaves the rest
reverted. And a rollback cannot undo side effects of a service that ran while it
was up, such as writes a daemon made to its own store.

## 10. Platform

Two axes vary between macOS and Linux, and only two: the service manager and the
system package manager. Everything else (uv, pnpm, git, file layout under
`$HOME`) is identical.

`services` therefore has one description and two renderers. The launchd renderer
emits a plist; the systemd renderer emits a unit, plus a timer when the
description carries a schedule. Absolute home paths in the description are
written as a `~` token that each renderer expands (`/Users/name` or `%h`).

`runtime` has a backend per package manager, chosen by platform, with the
manifest naming packages by manager rather than by platform.

Anything genuinely platform-bound is marked in the manifest and skipped with a
report line on the other platform, rather than failing the run: `caffeinate` has
no clean Linux equivalent, and GUI casks should never be installed unattended.

## 11. Profiles

A profile names the domains to apply and the overrides for them. It composes; it
does not copy.

```yaml
profiles:
  full:
    domains: [sources, runtime, config, mcp, plugins, skills, services]
    required: [sources, runtime, config, mcp, skills]
  lite:
    extends: full
    omit: [services]
    overrides:
      runtime: { skip: [memstore-editable] }
```

`required` drives the exit code: a failure in a required domain fails the run, a
failure elsewhere is reported and the run continues.

## 12. Failure policy

A failing domain does not stop the others. Each domain reports its own status,
and the run summarises per domain at the end. The exit code is non-zero if any
required domain failed.

This is deliberately the opposite of the current `bootstrap.sh`, which runs
`brew bundle ... || true` and continues as if nothing happened, which is how a
second machine ended up half-configured without anyone noticing.

## 13. Agent-driven operation

The primary operator is an agent, not a person at a terminal. A human runs this
occasionally; an agent runs it on every new machine and after every drift check.
That changes three things.

**Machine-readable output.** Every command takes `--json` and emits one object:
the plan or the results, per domain, with a stable `status` enum (`converged`,
`changed`, `skipped`, `failed`, `needs-secret`) and a `run_id`. An agent should
never have to parse prose to know what happened. Human output is a rendering of
the same object, not a separate code path.

**Idempotency has to be provable, not asserted.** `apply` immediately followed
by `apply` must report every domain `converged` and produce zero changes. This
is a test, not a hope: an agent that cannot trust a re-run will either skip
steps it should take or repeat ones it should not.

**A skill, not a README.** `machine-setup` ships in this repo and encodes the
order an agent must follow: capture or clone the instance manifests, run
`diff --json`, present what will change, apply, verify, and on failure decide
between retry and rollback from the reported status rather than by guessing. It
also names the two things an agent must never do unattended: install GUI casks,
and continue past a `needs-secret` status by inventing a value.

The engine assumes it may be interrupted. A run directory is created before the
first write and closed on completion, so an interrupted run is recognisable by a
missing completion record and is a valid rollback target.

## 14. Testing

- `plan` is pure, so every domain gets table-driven tests over fabricated
  states: empty machine, machine already converged, machine with foreign keys
  present, machine with a stale entry this engine owns.
- Renderers get golden-file tests, one per target format, from
  `examples/machine/`.
- The validator gets an adversarial fixture set built from the ten credentials
  recovered on 2026-08-17, asserting each shape is rejected: literal in `env`,
  literal in `headers`, credential inside a connection-string argument, and a
  bare token as a positional argument.
- Rollback gets a round-trip test per tier: apply, assert changed, roll back,
  assert byte-identical to the snapshot.
- No test reads `$HOME`.

## 15. Repository layout

Engine code goes under `scripts/`, not `src/`. `tsconfig.json` includes only
`scripts/**/*`, and `src/` holds skill and rule content rather than TypeScript.

```
scripts/lib/machine/
  domains/<domain>/read.ts plan.ts apply.ts verify.ts
  renderers/<target>/render.ts
  schemas/<domain>.schema.json
  secrets/resolveReference.ts
  ownership/readOwned.ts writeOwned.ts
  runs/createSnapshot.ts restoreSnapshot.ts listRuns.ts
  types/
scripts/commands/machine<Verb>.ts
scripts/bin/
  run-machine-capture.ts run-machine-diff.ts run-machine-apply.ts
  run-machine-rollback.ts
examples/machine/
```

One exported unit per file, matching the existing `scripts/lib/link/operations/`
convention: a `bin/` runner that only calls `main()` from a `commands/` module,
which composes operations from `lib/`. Tests sit beside their subject as
`NAME_TEST.ts` and run under `tsx --test`.

`tsconfig.json` has `strict`, `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes` enabled; optional fields must be omitted rather
than set to `undefined`.

## 16. Migration

The engine does not replace `~/p/dotfiles/bootstrap.sh`; it is called from it,
after the brew and shell steps. `sync-ai` and `sync-env` stay as they are: they
mirror live data between the user's own machines, which is a different job from
provisioning and should not be folded in.

Sequence: capture the reference machine into `dotfiles/machine/`, review the
generated manifests and the capture findings by hand once, then apply to a
second machine and compare. The first real test of the design is whether the
laptop, provisioned from manifests alone with no SSH to the reference host, ends
up usable.

## 17. Open questions

- **Install provenance for five tools.** `agy`, `herdr`, `claude`, `codex` and
  `cursor-agent` have no recorded installer. Until each is pinned to a source,
  `runtime` cannot claim to reproduce a working machine, and `agy` in particular
  is unrecoverable if the disk is lost. This blocks completeness, not the
  design.
- **Codegraph and Serena packaging.** Both run daily as MCP servers, neither
  appears as a package in the runtime sweep. Serena is invoked through
  `uvx --from git+...`, which is self-installing; the `codegraph` binary's
  origin is unknown.
- **Plugin cache pruning.** Whether `apply` should delete cached plugin versions
  that no plugin resolves to. It would reclaim most of the 2.7 GB, and it would
  also break `statusLine`, which currently points at a stale caveman version
  that a prune would remove.
