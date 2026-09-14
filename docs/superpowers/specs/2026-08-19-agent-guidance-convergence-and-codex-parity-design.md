# Agent Guidance Convergence and Codex Parity

## Status

Approved for implementation on 2026-08-19.

## Problem

Claude Code and Codex are intended to receive the same durable operating policy,
memory access, code-navigation guidance, and machine-managed connectors. The
current installation does not meet that requirement.

The global Claude guidance at `~/.claude/CLAUDE.md` and the global Codex
guidance at `~/.codex/AGENTS.md` are independent hand-maintained files.
`pnpm rules:link` deliberately leaves both files untouched. A change made in one
client therefore does not reach the other.

The same gap exists in adjacent global Claude rules. For example,
`~/.claude/rules/code-navigation.md` contains CodeGraph and Serena guidance that
Codex never loads. That file also names CodeGraph tools that are not present in
the installed CodeGraph 1.5.0 MCP surface. Copying it verbatim would spread
stale guidance.

The connector state is also asymmetric:

- CodeGraph is machine-managed for Claude and Codex and responds successfully in
  Codex.
- MemPalace is not declared in `machine/mcp.json`, is absent from
  `codex mcp list`, and cannot rely on Codex plugin discovery because the
  installed Codex runtime reports plugins as unsupported.
- `connectors:doctor` accepts `codex` in its manifest schema but only executes
  Claude profile probes, so it omits Codex connector results.
- The current MemPalace palace contains intact SQLite rows but search fails
  while Chroma applies pending logs to the HNSW segment writer. The capacity
  probe is within tolerance and the `max_seq_id` dry-run finds no poisoned rows.
  Recovery therefore requires the documented from-SQLite index rebuild, not a
  source re-mine or a `max_seq_id` edit.

Configuration presence is not sufficient. The completed system must prove that a
fresh session of each client loads and follows the intended guidance and can use
the required connectors.

## Goals

1. Reconcile durable global guidance bidirectionally between Claude Code and
   Codex.
2. Let an agent resolve semantic conflicts autonomously, including conflicts
   where both clients changed the same policy.
3. Require the agent to consult current official Claude Code and Codex
   documentation on every run.
4. Preserve client-specific guidance without weakening shared invariants.
5. Run reconciliation automatically during every scheduled machine convergence.
6. Converge multiple machines through the private `dotfiles` repository without
   publishing personal guidance in this public repository.
7. Give Codex reliable MemPalace retrieval and current CodeGraph guidance.
8. Make doctors report per-client connector health instead of inferring health
   from readable configuration.
9. Preserve recoverable snapshots and provide an explicit rollback path.

## Non-goals

- Store credentials, conversation captures, or MemPalace databases in Git.
- Copy Claude or Codex authentication state between profiles or machines.
- Treat Codex exec-policy Starlark as a Markdown instruction surface.
- Make provider-specific capabilities identical when the official clients expose
  different mechanisms.
- Let an LLM write directly to live configuration files.
- Re-mine source code into MemPalace. CodeGraph remains the source-code index.

## Ownership

Rocket Agents owns the public reconciliation engine, schemas, client renderers,
doctors, tests, and rollback mechanics.

The private `dotfiles` repository owns the personal canonical content and the
scheduled invocation. It will contain:

- `agent-guidance/shared.md`: provider-neutral policy that both clients receive.
- `agent-guidance/claude-overlay.md`: guidance that only Claude Code can
  execute.
- `agent-guidance/codex-overlay.md`: guidance that only Codex can execute.
- `agent-guidance/policy.json`: required invariants, official documentation
  allowlists, size limits, and the configured reconciliation command.

Machine-local snapshots and locks live under
`~/.local/state/rocket-agents/guidance/<machine-id>/`. They are not synchronized
or committed.

## Source Model

Each reconciliation run reads:

1. The versioned shared guidance and both overlays.
2. The previous accepted canonical and rendered hashes from local state.
3. The live `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` files.
4. Hand-maintained global Markdown files directly under `~/.claude/rules/`.
5. The generated Rocket Agents rule inventory, without ingesting generated rule
   bodies into the always-loaded global guidance.

Managed symlink trees such as `~/.claude/rules/rocket-agents` are inputs by
reference and are not copied into the canonical document. Credentials, settings
files, histories, caches, and MCP environment values are outside the source
model.

The previous accepted hashes distinguish a user edit from generated output.
Changes from either live client are eligible for promotion into the shared
canonical or the matching overlay. A change made in Claude can therefore reach
Codex, and a change made in Codex can reach Claude.

## Agent Contract

The default reconciler is a non-interactive Codex invocation with web search
enabled and a strict JSON output schema. The command is configurable so the
control plane does not depend on one model vendor.

Every invocation must retrieve at least one current official Claude Code source
and one current official Codex source. Accepted documentation origins are
declared in `policy.json`; the initial allowlist is Anthropic's Claude Code
documentation and OpenAI's Codex documentation or official Codex repository.
Search results, blogs, and community examples can help discovery but cannot
satisfy this evidence requirement.

The structured result contains:

- the next shared Markdown document;
- the next Claude and Codex overlays;
- the fully rendered Claude and Codex documents;
- source URLs and retrieval timestamps;
- decisions that promoted, preserved, translated, or removed guidance;
- warnings and unresolved environmental limitations;
- hashes of every input considered.

The agent may resolve semantic conflicts and rewrite both targets without human
approval. It must translate behavior rather than syntax. Claude imports and
path-scoped rules may become inlined or conditional Codex prose because Codex
does not implement Claude's Markdown import mechanism.

The agent cannot weaken policy invariants declared by the wrapper, emit
credentials, expand the configured file scope, or perform filesystem writes.
Failure to retrieve both official documentation families makes the run fail
closed without changing canonical or live files.

## Deterministic Apply Boundary

Rocket Agents validates the agent result before any write:

- the JSON schema and all input hashes match the current run;
- required official documentation evidence is present;
- shared invariants remain present in both rendered documents;
- client-specific syntax is valid for the target;
- Codex output contains no unresolved Claude imports;
- output is non-empty and within configured byte limits;
- recognized secret patterns and captured conversation material are absent;
- the agent did not modify paths outside the declared guidance surface.

After validation, the engine creates a timestamped snapshot, writes temporary
files with mode `0600`, fsyncs them, and atomically renames them into place.
Canonical files are updated in the private repository only after both live
renderings validate. A partial write restores the snapshot before the command
exits non-zero.

`guidance:rollback` restores one complete accepted run. It never merges
individual files from different runs.

## Automatic and Multi-machine Convergence

The private scheduled workflow invokes reconciliation during every convergence,
including runs where no local content drift is detected. This preserves the
requirement to check current official documentation on every run.

The workflow acquires a host-local lock, updates the private repository, runs
the agent, validates and applies the result, commits canonical changes with the
existing human Git identity, and pushes. If another machine wins the push race,
the workflow pulls the new canonical state and reruns the agent against both
histories. It retries a bounded number of times and leaves the last accepted
live configuration intact if convergence cannot be reached.

Remote machines use the same engine and policy. Git transports canonical
guidance; it does not transport live client state or local snapshots.

## Client Rendering

Claude rendering may retain supported `@` imports and path-scoped files under
`~/.claude/rules/`. The main `CLAUDE.md` remains lean and always loaded.

Codex rendering produces plain Markdown at `~/.codex/AGENTS.md`. It inlines or
restates necessary shared behavior because Codex discovers `AGENTS.md` files
through directory traversal and configured fallback filenames rather than Claude
imports. `~/.codex/rules/default.rules` remains exec-policy Starlark and is not
used for guidance.

Both renderings carry the same shared invariants. Provider overlays may differ
only when their behavior depends on a documented provider capability.

## MemPalace Recovery and Codex Integration

Rocket Agents adds a required `mempalace` stdio server for Codex using the
installed `mempalace-mcp` entry point. The initial Codex surface is read-only so
it can coexist with the long-lived writable MemPalace daemon. Background and
deliberate writes continue through the daemon routing policy; the Codex MCP
surface provides search, taxonomy, status, and other read operations.

The current index recovery is an offline maintenance operation:

1. Stop the writable daemon and confirm no writable MemPalace process owns the
   palace.
2. Rebuild from SQLite with archive preservation.
3. Run MemPalace repair status and a semantic search.
4. Restart the daemon and confirm reachability.
5. Start the read-only MCP server and verify its tool inventory and search
   behavior.

The archived palace is retained. Recovery never re-mines source files and never
edits `chroma.sqlite3` directly.

## CodeGraph Parity

The installed CodeGraph MCP is healthy, but its index reports that an earlier
engine version built it. The rollout performs one full rebuild with the
installed engine and verifies current status.

The shared guidance is updated through the agent reconciliation process. It must
describe the installed MCP surface, prefer `codegraph_explore` for indexed code
exploration, use raw search and file reads for configuration or unindexed
content, and avoid naming removed tools.

CodeGraph remains machine-managed and required for both Claude profiles and
Codex. No source code is copied into MemPalace.

## Connector Diagnostics

`connectors:doctor` gains a Codex profile adapter. Default execution covers
Claude personal, Claude Favish, and Codex. A profile flag can select any one
explicitly.

The Codex adapter reads `codex mcp list` for registration and performs a bounded
MCP initialization and tools-list probe for required stdio connectors.
Registration without successful startup is degraded rather than healthy.
MemPalace and CodeGraph become required Codex connector definitions.

Doctor output remains redacted and machine-readable. It reports the connector,
profile, boundary, registration state, startup state, tools-list result, and a
concise failure reason without exposing environment values.

## Failure Handling

- Documentation unavailable: keep the last accepted configuration and exit
  non-zero.
- Agent timeout or invalid JSON: keep the last accepted configuration and retain
  diagnostics.
- Validation failure: reject the whole result; never partially apply one client.
- Concurrent run: the second run exits without changing state.
- Git race: update, rerun reconciliation, and retry within the configured bound.
- MCP registration present but startup fails: doctor reports degraded or failed
  according to criticality.
- MemPalace corruption: stop clients and use the offline from-SQLite recovery
  path.
- CodeGraph project not indexed: fall back to native file tools and report that
  indexing requires an explicit project initialization decision.

## Verification Strategy

Unit tests cover source classification, three-way change detection, JSON
validation, invariant checks, atomic apply, rollback, profile selection, Codex
MCP-list parsing, and redaction.

Integration tests use newly created temporary home directories. They run the
complete apply and rollback paths without touching durable user data. A
deterministic fake agent supplies documented merge decisions and malformed
variants for failure tests.

Live verification after the authorized rollout includes:

- current rule compilation and the full Rocket Agents quality gate;
- the full `dotfiles` quality gate;
- a converged machine diff;
- successful MemPalace daemon status, repair status, CLI search, MCP tools-list,
  and MCP search;
- current CodeGraph status and a real `codegraph_explore` call;
- a fresh Claude session that answers a guidance-specific probe and uses the
  expected connector;
- a fresh Codex session that answers the same shared-policy probe, chooses
  CodeGraph for an indexed code question, and searches MemPalace for an
  established project decision;
- clean worktrees, human-authored commits, successful pushes, and direct
  equality between local and remote commit SHAs in both modified repositories.

The implementation is complete only when fresh-session behavior demonstrates
parity. Matching files, symlinks, or hashes alone do not satisfy the
requirement.

## Evidence Collected Before Design

The following read-only commands were executed successfully while diagnosing the
current state:

```bash
pnpm run rules:check
pnpm run machine:diff -- --json
pnpm run connectors:doctor -- --json
codex mcp list
codegraph status /Users/cristiandeluxe/p/agents
mempalace daemon status
mempalace repair --mode max-seq-id --dry-run --backup
```

`mempalace search "Codex mempalace codegraph" --wing rocket-agents` was also
executed and reproduced the HNSW segment-writer failure. The failed command is
diagnostic evidence, not a healthy example.

## Rollout Order

1. Implement and test the deterministic guidance engine in Rocket Agents.
2. Add Codex connector doctor support and the MemPalace machine declarations.
3. Add the private canonical guidance and scheduled invocation in `dotfiles`.
4. Run both repository quality gates.
5. Repair MemPalace offline and rebuild CodeGraph's derived index.
6. Apply the authorized machine convergence.
7. Run fresh-session behavioral verification for Claude and Codex.
8. Commit and push both repositories and verify the remote SHAs.
