# Agent Platform Reliability Program - Design

Status: approved for planning, 2026-08-18.

## 1. Problem

The workstation has a broad agent toolchain, but a directory, symlink, or
configuration entry does not prove that a client can use it. The current system
has four distinct failure classes:

- A client is provisioned but its runtime is missing or cannot be queried.
- An MCP definition is syntactically present but cannot start, authenticate, or
  complete discovery.
- A skill exists but is invalid for a target, invisible to that target, or never
  selected by the prompt router.
- Mutable client state is corrupt or unbounded, while the current checks only
  validate the tracked repository.

The immediate evidence is concrete:

- `IDE_REGISTRY` contains 25 targets, while its detection logic only checks
  paths.
- The machine MCP domain supports `claude-personal`, `claude-secondary`,
  `codex`, and `gemini`.
- Codex has a corrupt `~/.codex/memories_1.sqlite`, 4,058 session rollouts using
  about 1.3 GB, and two malformed rollout headers.
- The external Agent Skills validator accepts 244 user-library skills and
  rejects 57 skills that contain platform extensions or fixture content.
- The measured router corpus contains 113 phrases: 27 select the correct lane, 5
  select the wrong lane, and 81 select no lane.
- Context7, Serena, and CodeGraph work in Codex and both Claude profiles.
  Cloudflare is authenticated in the secondary profile but not personal, Gateway
  Example requires authentication in personal, and one optional hosted connector
  returns HTTP 503 through the hosted connector path.

These are not one bug. They need a common model and five independently
reversible workstreams.

## 2. Goals

1. Report the real state of every registered platform without treating a
   generated directory as an installed runtime.
2. Make tracked manifests the source of truth for shared, non-secret
   configuration.
3. Keep Claude personal and secondary credentials and state separate while
   sharing intentionally identical rules, hooks, plugins, and settings policy.
4. Repair Codex state without deleting the only copy of any database or rollout.
5. Compile skills for each target instead of weakening Claude-native skills to
   satisfy the most restrictive validator.
6. Turn router coverage into a tested contract.
7. Distinguish a broken remote service from missing OAuth and from local
   configuration drift.
8. Make every mutating command dry-run first, snapshot before write, and verify
   after write.

## 3. Non-goals

- Installing all 25 registered clients. Unsupported or absent clients must be
  reported honestly.
- Copying credentials, OAuth tokens, account IDs, or raw headers into this
  repository.
- Merging Claude personal and secondary account state.
- Replacing vendor plugin managers.
- Deleting old Codex sessions. Archival moves files into a recoverable,
  checksummed location.
- Treating every HTTP response other than 200 as downtime.
  Authentication-required is a separate state.

## 4. Architecture

The program has four layers.

### 4.1 Canonical declarations

Tracked files under `machine/` describe shared intent:

- `machine/platforms.json`: platform probes and managed capabilities.
- `machine/mcp.json`: local and remote MCP definitions using environment
  references for secrets.
- `machine/security.json`: client security policy and explicit profile
  exceptions.
- `machine/connectors.json`: expected account-managed connectors and their
  profile scope.

The existing `~/.agents/curation.json` remains the authority for external skill
provenance and fan-out state. Tracked code validates and consumes it, but this
public repository never vendors the private library.

The instance resolution order is:

1. `--instance`
2. `AGENTS_MACHINE_DIR`
3. the repository's tracked `machine/` directory

This removes the current dependency on a missing `~/p/dotfiles/machine`
directory.

### 4.2 Platform adapters

Each capability has a narrow adapter. An adapter owns only the fields it writes
and preserves all foreign keys.

```text
platform manifest
  -> runtime probe
  -> capability adapters
       skills
       rules
       hooks
       plugins
       MCP
       security settings
  -> target-native configuration
```

Claude has two profile instances with shared non-identity policy. Codex, Gemini
CLI, and Cursor are separate instances. Other registered targets receive static
checks until a supported live probe is declared.

### 4.3 Health matrix

Every platform has one lifecycle state:

| State         | Meaning                                                       |
| ------------- | ------------------------------------------------------------- |
| `active`      | A declared runtime probe succeeds.                            |
| `provisioned` | Managed configuration exists, but no runtime probe succeeds.  |
| `unavailable` | Neither a runtime probe nor managed configuration is present. |

Every capability has one health state:

| State            | Meaning                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `healthy`        | Static validation passes and, for active clients, the live probe passes. |
| `degraded`       | The capability is usable but has drift, optional failures, or warnings.  |
| `auth-required`  | The endpoint is reachable but the current profile is not authenticated.  |
| `failed`         | Required syntax, startup, discovery, or integrity checks fail.           |
| `unsupported`    | No adapter is declared for this platform and capability.                 |
| `not-applicable` | The platform does not expose that capability.                            |

The human report is a compact matrix. `--json` emits the same facts with paths
shortened to well-known roots and secrets redacted. The report never includes
environment values, OAuth tokens, authorization headers, raw client state, or
full rollout content.

### 4.4 Stateful repair operations

Checks and writes are separate commands or flags. Mutations require `--apply`
and follow this sequence:

1. Refuse to run when a relevant client process or lock is active.
2. Resolve explicit targets and print the plan.
3. Snapshot files and sidecars.
4. Write a SHA-256 manifest for the snapshot.
5. Move corrupt or stale files to quarantine or archive.
6. Apply the minimal change.
7. Run the same verifier used by the doctor.
8. Print the rollback command.

No repair path uses `rm` for user state.

## 5. Profiles and identity boundaries

The Claude profiles are intentionally asymmetric only for identity-bearing
state.

| Data class                        | Personal and secondary |
| --------------------------------- | ---------------------- |
| OAuth tokens, cookies, account ID | Separate               |
| Conversation and project state    | Separate               |
| User settings policy              | Shared                 |
| Enabled plugin declarations       | Shared                 |
| Rules, hooks, and authored skills | Shared                 |
| Account-managed connector login   | Separate               |

Codex authentication is made deterministic by setting
`forced_login_method = "chatgpt"` in the managed configuration and verifying it
with `codex login status`. `OPENAI_API_KEY` may remain in the shell for
unrelated API tools; it is not allowed to silently change the Codex login
method.

## 6. Skill portability model

Canonical source is not synonymous with portable output.

- Claude output preserves Claude-native frontmatter such as `allowed-tools`,
  `argument-hint`, `paths`, hooks, and model hints.
- Portable output contains only Agent Skills fields accepted by the external
  validator.
- Target-specific aliases convert names such as
  `superpowers:systematic-debugging` into filesystem names where a target
  rejects colons, while the router keeps the canonical logical key.
- Fixture directories are classified as fixtures and excluded from production
  validation.
- A platform extension is a compatibility classification, not a broken skill.

The router must validate both directions: every routed skill must be
discoverable for its target, and every measured trigger must either select its
expected lane or be explicitly marked as an intentional non-route.

## 7. MCP and connector model

MCP servers controlled by local configuration live in `machine/mcp.json`.
Account-managed hosted connectors live in `machine/connectors.json`; the doctor
observes them but does not copy their credentials.

Probe results distinguish:

- executable missing;
- startup timeout;
- protocol initialize failure;
- tool discovery failure;
- HTTP authentication required;
- remote service unavailable;
- local manifest drift.

Context7, Serena, and CodeGraph are required baseline servers for Codex and both
Claude profiles. Gemini and Cursor receive them only through verified native
adapters. Cloudflare and Gateway Example remain profile-scoped authenticated
connectors. A hosted connector is repaired at its service boundary, not hidden
by increasing a client timeout when the upstream response is 503.

## 8. Security policy

- Secrets are environment references or account-managed tokens, never literals
  in tracked files.
- Reports redact values before formatting, not after writing logs.
- Claude stays in `auto` permission mode. The dangerous-mode warning is not
  skipped.
- Remote control is an explicit per-profile exception if it is required; it is
  never enabled by an unrelated sync operation.
- Project-scoped MCP remains subject to each client's trust model.
- A renderer may edit only fields declared in its ownership record.
- Snapshots and quarantine directories use user-only permissions.

## 9. Delivery sequence

The sequence is dependency-driven:

1. Health matrix and canonical declarations.
2. Shared security declaration, followed by Codex state recovery.
3. Skill portability and router reliability.
4. Remaining platform adapters and security parity.
5. External connector authentication and service diagnosis.

Each workstream has its own implementation plan, tests, commit, and push. A
later workstream may consume the health model from an earlier one, but it must
not combine unrelated mutations in the same commit.

The implementation plans are:

- `docs/superpowers/plans/2026-08-18-agent-health-matrix.md`
- `docs/superpowers/plans/2026-08-18-codex-state-recovery.md`
- `docs/superpowers/plans/2026-08-18-skill-router-reliability.md`
- `docs/superpowers/plans/2026-08-18-platform-parity-and-security.md`

## 10. Acceptance criteria

- `pnpm run agents:doctor -- --json` returns a redacted report for all 25
  registered platforms.
- Active clients pass live checks; provisioned clients pass static checks;
  unavailable clients do not fail the run merely for being absent.
- `pnpm run machine:diff` works without `--instance` from this repository.
- Codex database integrity passes after repair, malformed sessions are
  quarantined with hashes, and the archive can be restored.
- The user skill library produces valid Claude-native and portable views with no
  unexplained validator failures.
- Router audit has zero wrong-lane outcomes and every remaining silent phrase is
  explicitly classified or covered by a regression fixture.
- Claude personal and secondary pass the same non-identity policy checks while
  retaining separate account state.
- Context7, Serena, and CodeGraph pass startup and discovery checks on every
  declared active target.
- Cloudflare and Gateway Example report either healthy or auth-required per
  profile, never a generic startup failure.
- A hosted connector reports healthy after service repair or a precise external
  dependency failure with evidence.
- `pnpm run check:all` and `git diff --check` pass before every workstream is
  considered complete.

## 11. Current documentation constraints

The adapters must follow current vendor behavior:

- Codex user configuration is `~/.codex/config.toml`, and `forced_login_method`
  accepts `chatgpt` or `api`:
  <https://learn.chatgpt.com/docs/config-file/config-reference>.
- Claude user-scoped MCP is stored in `~/.claude.json`, and startup timeout uses
  `MCP_TIMEOUT`: <https://code.claude.com/docs/en/mcp>.
- Claude `bypassPermissions` provides no prompt-injection protection; `auto` is
  the intended lower-friction mode:
  <https://code.claude.com/docs/en/permission-modes>.
- Gemini MCP uses `mcpServers` in `settings.json`, with `httpUrl` for Streamable
  HTTP: <https://geminicli.com/docs/tools/mcp-server/>.
- Gemini discovers user skills in `~/.gemini/skills/` or `~/.agents/skills/`:
  <https://geminicli.com/docs/cli/using-agent-skills/>.
- Cursor's MCP and CLI behavior must be rechecked against its current
  documentation immediately before implementation because its documentation URLs
  now redirect to a consolidated site: <https://cursor.com/docs>.
