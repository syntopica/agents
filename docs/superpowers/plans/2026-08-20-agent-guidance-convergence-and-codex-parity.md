# Agent Guidance Convergence and Codex Parity Implementation Plan

## Discovery Summary

- Current behavior:
  - `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` are independent,
    hand-maintained files.
  - `rules:link` manages Claude's generated rule tree and Codex exec policy, but
    not either global Markdown guidance file.
  - CodeGraph is registered for Codex and works, while its Claude-only
    navigation rule names removed tools and is not visible to Codex.
  - Memstore is missing from the machine MCP and connector manifests, so Codex
    does not discover it. Its current Chroma index also reproduces an HNSW
    segment-writer failure.
  - `connectors:doctor` only executes Claude profiles even though connector
    types accept Codex.
- Relevant systems:
  - Public engine: `scripts/commands`, `scripts/lib/guidance`,
    `scripts/lib/connectors`, `machine`, `package.json`, and `docs/ide-setup.md`
    in Rocket Agents.
  - Private content and scheduler: `agent-guidance` and `bin/sync-rocket-agents`
    in `dotfiles`.
  - Live targets: `~/.claude/CLAUDE.md`, `~/.claude/rules/*.md`, and
    `~/.codex/AGENTS.md`.
  - Derived runtime state: `~/.local/state/rocket-agents/guidance`.
- Constraints:
  - One exported unit and one responsibility per file.
  - The agent may resolve content conflicts but cannot write live files
    directly.
  - Every reconciliation run must consult official Claude Code and Codex
    documentation.
  - Tests that exercise apply paths use newly created temporary homes only.
  - Live machine apply and index repair are deferred until code and repository
    gates pass.
  - Existing user changes in any repository must be preserved.

## Target Outcome

- Desired behavior:
  - Changes made in either global client guidance flow through a private
    canonical representation and reach the other client automatically.
  - Provider-specific overlays preserve documented differences.
  - A schema-constrained agent performs semantic reconciliation with fresh
    official documentation.
  - Codex discovers healthy Memstore and CodeGraph connectors and receives
    current usage guidance.
  - Fresh Claude and Codex sessions demonstrate equivalent shared behavior.
- Non-goals:
  - Synchronize credentials, histories, captured conversations, or Memstore
    storage.
  - Put Markdown in Codex `default.rules`.
  - Make path-scoped Claude loading syntax native to Codex.
- User-visible impact:
  - Global guidance edits converge automatically across Claude and Codex.
  - Connector doctors expose Codex failures that were previously omitted.
  - Codex can search Memstore and reliably selects the installed CodeGraph tool
    surface.

## Implementation Changes

### Task 1: Guidance contracts and pure validation

- Milestone 1 intent:
- Add one-purpose guidance types for policy, source snapshots, reconciliation
  results, decisions, documentation evidence, and run reports.
- Parse and validate the private policy without allowing literal secrets or
  arbitrary target paths.
- Validate official documentation origins, input hashes, output byte limits,
  required invariants, and unresolved Claude imports in Codex output.
- Add deterministic unit tests for valid and rejected results.
- Verify with the focused guidance test command added to `package.json`.

### Task 2: Agent execution and transactional apply

- Milestone 2 intent:
- Collect canonical, overlay, live target, and hand-maintained Claude rule
  sources.
- Build a reconciliation prompt that describes target capabilities and requires
  current official documentation evidence.
- Run a configurable non-interactive agent command with a strict output schema
  and bounded output.
- Create local snapshots, atomically apply canonical and live files, and restore
  the complete run on partial failure.
- Add `guidance:sync`, `guidance:doctor`, and `guidance:rollback` commands and
  temporary-home integration tests with a fake agent.

### Task 3: Codex connector parity

- Milestone 3 intent:
- Add `memstore-mcp --read-only` as a required Codex MCP server.
- Add Memstore as a required Codex connector definition.
- Generalize connector profile selection and inspection so default and explicit
  Codex probes run.
- Parse redacted `codex mcp list` output and distinguish missing, disabled, and
  enabled servers.
- Add deterministic tests for Codex profile selection, parsing, and doctor
  output.

### Task 4: Private canonical state and scheduled execution

- Milestone 4 intent:
- Add `agent-guidance/shared.md`, both overlays, and `policy.json` to
  `dotfiles`.
- Seed the canonical documents by reconciling the live Claude and Codex
  guidance, not by choosing one file as authoritative.
- Update `bin/sync-rocket-agents` to run guidance reconciliation on every
  convergence after the current control-plane build and before machine apply.
- Keep the scheduled command non-interactive, locked, bounded, and
  failure-visible.
- Update `dotfiles` checks for required guidance files and safe command wiring.

### Task 5: Documentation and full repository verification

- Milestone 5 intent:
- Update `docs/ide-setup.md`, README command inventory, and relevant machine
  documentation.
- Run focused tests, `pnpm run check`, and `dotfiles/scripts/check`.
- Run `machine:diff` before any live mutation and inspect the exact planned
  changes.

### Task 6: Authorized live convergence and derived-index recovery

- Milestone 6 intent:
- Run the new guidance sync and machine apply paths on the current host.
- Stop Memstore's writer, rebuild from SQLite with archive preservation, verify
  repair status and semantic search, and restart the daemon.
- Rebuild the Rocket Agents CodeGraph index with the installed engine and verify
  status.
- Run the connector doctor for Codex and direct MCP tool discovery checks.

### Task 7: Fresh-session behavioral verification and publication

- Milestone 7 intent:
- Start new non-interactive Claude and Codex sessions with probes that can only
  pass if the new global guidance loaded.
- Verify Codex calls CodeGraph for indexed code and Memstore for prior-project
  recall.
- Review all changes findings-first, fix blocking findings, rerun affected
  gates, commit intended paths, push both repositories, and compare local and
  remote SHAs.

## Interfaces and Contracts

- Public CLI additions:
  - `pnpm run guidance:sync -- --config <dotfiles-agent-guidance-dir> [--dry-run] [--json]`
  - `pnpm run guidance:doctor -- --config <dotfiles-agent-guidance-dir> [--json]`
  - `pnpm run guidance:rollback -- --run <run-id> [--json]`
- Private policy:
  - Schema version, official source allowlist, required invariant strings,
    output byte limits, model command, canonical paths, and live target paths.
- Agent output:
  - Schema-versioned JSON containing canonical documents, rendered targets,
    documentation evidence, decisions, warnings, and input hashes.
- Connector manifest:
  - `memstore` targets Codex over stdio in read-only mode.
- Compatibility:
  - Existing rules, skills, hooks, MCP ownership, foreign Codex MCP blocks, and
    both Claude profiles remain intact.
- Migration:
  - The first successful guidance run imports both live files and establishes
    the first accepted local base snapshot. No existing live file is replaced
    before validation and snapshot creation.

## Risks

- Primary risk: an agent produces plausible but incomplete or destructive
  guidance.
  - Mitigation: read-only agent sandbox, strict schema, source allowlist,
    required invariants, secret scanning, input hashes, atomic apply, complete
    snapshots, and fresh-session probes.
- Primary risk: two machines update canonical guidance concurrently.
  - Mitigation: pull before reconciliation, bounded push retry, rerun against
    new canonical state, and leave the last accepted live files intact on
    failure.
- Primary risk: Memstore maintenance loses data or collides with a writer.
  - Mitigation: confirm exclusive maintenance, archive the existing palace,
    rebuild from SQLite, retain the archive, and verify before restarting
    writers.
- Primary risk: connector registration passes while startup or tools discovery
  fails.
  - Mitigation: doctor checks registration and a bounded MCP
    initialization/tools-list boundary.
- Rollback:
  - `guidance:rollback` restores an accepted run; machine rollback restores
    managed configuration; the archived Memstore palace remains recoverable;
    CodeGraph is a rebuildable derived index.

## Validation

- Automated commands:
  - Focused guidance and connector tests added by the implementation.
  - `pnpm run type-check`.
  - `pnpm run machine:test`.
  - `pnpm run connectors:test`.
  - `pnpm run check`.
  - `$HOME/p/dotfiles/scripts/check`.
- Live verification:
  - `pnpm run machine:diff -- --json` before apply and after convergence.
  - `pnpm run guidance:doctor -- --config $HOME/p/dotfiles/agent-guidance -- --json`.
  - `pnpm run connectors:doctor -- --profile codex --json`.
  - `codex mcp list`.
  - `memstore daemon status`, `memstore repair-status`, and a scoped semantic
    search.
  - `codegraph status $HOME/p/agents` and a real MCP exploration.
  - Fresh Claude and Codex non-interactive behavioral probes.
- Acceptance criteria:
  - Both rendered files contain every required shared invariant.
  - A live edit on either client is promoted and rendered into the other client
    on the next run.
  - Every run records current official documentation evidence from both vendors.
  - Invalid agent output changes no canonical or live file.
  - Codex lists and starts Memstore and CodeGraph.
  - Memstore search and CodeGraph exploration succeed from fresh Codex context.
  - Both repository gates pass, worktrees are clean, and remote SHAs equal local
    SHAs.

## Assumptions

- The current host is authorized for live guidance convergence, machine apply,
  Memstore offline repair, and CodeGraph derived-index rebuild by the user's
  explicit instruction to proceed with all approved work.
- The default reconciler is Codex with web search and structured output; the
  private policy keeps the command configurable.
- Memstore's Codex MCP surface starts read-only while the daemon owns the
  writable lease.
- Personal canonical guidance belongs in `dotfiles`; reusable behavior and
  tooling belong in Rocket Agents.
