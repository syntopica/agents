# IDE Setup Guide

## Prerequisites

- Node.js 22.13+
- pnpm (`npm install -g pnpm`)
- The BRP repo cloned and installed:
  ```bash
  git clone https://github.com/syntopica/agents.git
  cd agents
  pnpm install
  pnpm build
  ```

## Machine MCP Configuration

The default machine instance is a `machine/` directory beside this file, which
the repository does not ship: copy `examples/machine/` to `machine/` and edit it
for the host, or pass `--instance`. Check its desired MCP state against Claude
personal, Claude secondary, Codex, Gemini, and Cursor, together with shared
security policy and managed capability links, without writing files:

```bash
pnpm run machine:diff -- --json
```

For an alternate instance, pass `--instance /absolute/path` or set
`AGENTS_MACHINE_DIR`. Secret values stay in the environment; tracked manifests
use `from_env` references.

After inspecting every planned path, apply all managed domains and require a
converged second diff:

```bash
pnpm run machine:apply -- --json
pnpm run machine:diff -- --json
```

Every apply snapshots files, directories, and symbolic links first. Restore the
newest snapshot with `pnpm run machine:rollback -- --json`, or select one with
`--to <run-id>`.

## Guidance Reconciliation

Private `dotfiles/agent-guidance` is the source of global client guidance:
`shared.md` holds the provider-neutral policy, while `claude-overlay.md` and
`codex-overlay.md` isolate documented client differences. Do not copy that
content, credentials, or machine-local state into this repository. Claude loads
`CLAUDE.md` and supports modular, path-scoped `.claude/rules/`; see the
[Claude Code memory and rules documentation](https://code.claude.com/docs/en/memory).

Inspect or validate a private configuration directory with the public commands:

```bash
pnpm run guidance:sync -- --config /absolute/path/to/agent-guidance --dry-run --json
pnpm run guidance:doctor -- --config /absolute/path/to/agent-guidance
```

The sync engine collects canonical sources, live `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md`, top-level user-authored Claude rules, generated rule
inventory, and accepted hashes. Its reconciler runs in an OS sandbox with an
empty home and may write only to a temporary scratch directory. Before applying,
Rocket Agents requires a strict JSON result with matching input hashes, current
official Claude and Codex documentation evidence, required invariants, target
syntax, size limits, and secret/captured-conversation checks. This is a
validation boundary, not permission for the agent to edit live files directly;
the strict-result model is consistent with
[OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

`--dry-run` validates without creating snapshots or writing guidance. An
authorized non-dry run creates an atomic pre-apply snapshot with hashes and
restores it if the apply cannot complete. Check state with `guidance:doctor`; to
restore a complete accepted run, use the mutating command below only after
inspection and authorization:

```bash
pnpm run guidance:rollback -- --run <run-id>
```

If `--run` is omitted, rollback uses the latest complete run. It never assembles
individual files from different snapshots.

The private scheduled `sync-rocket-agents` convergence order is: pull
control-plane and library, install dependencies, build, reconcile guidance,
apply the machine manifest, then link rules, skills, and hooks. Guidance
reconciliation therefore runs before machine convergence on every scheduled
pass.

## Cross-Platform Health Check

Run the read-only doctor after setup or when an agent reports missing MCP
servers, skills, rules, hooks, or plugins:

```bash
pnpm run agents:doctor
pnpm --silent run agents:doctor -- --json > /tmp/agents-doctor.json
node -e 'JSON.parse(require("node:fs").readFileSync("/tmp/agents-doctor.json", "utf8"))'
```

Lifecycle meanings:

- `active`: a client command or desktop application is installed.
- `provisioned`: managed configuration exists, but no runtime is detected.
- `unavailable`: neither a runtime nor managed configuration is present.

Capability status `unsupported` means the client is present but exposes no
compatible integration for that capability. It is intentionally distinct from a
missing client and is never emulated with an undocumented path.

An unavailable optional client is informational. A required capability failure
on an active or provisioned client exits with status 1, while a malformed
`machine/platforms.json` exits with status 2. Reports replace the home directory
and credential-shaped values before serialization.

## External Connector Health

`machine/connectors.json` declares profile scope, ownership, probe kind, and
criticality without credentials. Inspect it through the profile-aware doctor:

```bash
pnpm run connectors:doctor -- --json
pnpm run connectors:doctor -- --profile codex --json
```

Context7, Serena, and CodeGraph are required machine-managed MCP servers. The
Codex profile also requires the Codex-only `memstore-mcp --read-only` stdio
server. Cloudflare is required in both Claude profiles and Gateway Example is
required only in the personal profile. Consequently:

- a missing required connector, required OAuth flow, or required disabled
  connector exits with 1;
- an optional HTTP 503 remains visible as degraded and includes its responding
  boundary;
- reports never serialize response bodies, request headers, tokens, cookies, or
  account IDs.

For Codex, the doctor first checks registration with `codex mcp list`, then
starts each required stdio connector and requires a successful MCP `initialize`
negotiation followed by `notifications/initialized` and `tools/list`. A
configuration entry alone is therefore degraded or failed until startup and tool
enumeration succeed, as required by the
[MCP lifecycle specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle).

Use CodeGraph's current `codegraph_explore` surface for indexed source
exploration; use native file and text search for configuration, generated files,
or content outside the index. Memstore is required only for Codex and is
read-only, so it supplies project-memory retrieval rather than indexing or
durable writes. See the
[Codex MCP guide](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) and
[Claude Code MCP guide](https://code.claude.com/docs/en/mcp) for their
respective MCP clients.

Use `docs/runbooks/claude-connector-authentication.md` for profile-safe OAuth.
`agents:doctor` reuses the same profile inspection instead of launching a
duplicate Claude MCP inventory.

---

## Claude Code

The tracked security policy keeps the personal and secondary profiles as
separate identity roots while sharing only non-identity settings. Claude's
`auto` permission mode remains the low-friction normal mode. The dangerous-mode
warning is enabled; restoring that warning does not add prompts to ordinary
`auto`-mode operations. Remote control at startup remains an explicit,
documented exception for the established remote terminal workflow.

### As a Plugin (Recommended)

Build the plugin, then load it with `--plugin-dir`:

```bash
pnpm build
claude --plugin-dir /path/to/agents/dist/plugins/claude
```

Skills are available as `/rocket-agents:<skill-name>`:

```
/rocket-agents:brp-plan
/rocket-agents:brp-fix
/rocket-agents:brp-review
```

### As Global Rules

Link the generated Claude rules to your Claude Code config:

```bash
pnpm rules:link
```

This symlinks `.claude/rules/` to your home directory. The lean global
`~/.claude/CLAUDE.md` remains the rendered live target of private guidance
reconciliation; `shared.md` and the Claude overlay are its canonical sources. Do
not use the generated rule tree as a substitute for that global guidance.

---

## Cursor

### Project-Level (Recommended)

After running `pnpm rules:compile`, rules are placed in `.cursor/rules/` which
Cursor reads automatically when the project is open.

### Global-Level

Run `pnpm rules:link`; the managed rules are linked at
`~/.cursor/rules/rocket-agents`. Cursor reads skills directly from
`~/.agents/skills`, so no `~/.cursor/skills` duplicate is created. Machine MCP
configuration is stored in `~/.cursor/mcp.json` and verified with:

```bash
cursor-agent mcp list
cursor-agent mcp list-tools codegraph
cursor-agent mcp list-tools context7
cursor-agent mcp list-tools serena
```

---

## Codex (OpenAI)

### Global Guidance

```bash
pnpm rules:link
```

This copies Codex `default.rules` into your Codex config. The global
`~/.codex/AGENTS.md` remains the rendered live target of private guidance
reconciliation; `shared.md` and the Codex overlay are its canonical sources.
`default.rules` is Codex exec-policy Starlark and must not contain Markdown
prose. In this project, `AGENTS.md` is not the primary delivery mechanism for
reusable BRP workflows; global skills are.

### Existing Claude Code Projects

To make Codex load repositories that have `CLAUDE.md` but no `AGENTS.md`, add
this at the top level of `~/.codex/config.toml` and restart Codex:

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
project_doc_max_bytes = 65536
```

Instruction discovery checks `AGENTS.override.md`, then `AGENTS.md`, then the
configured fallback names in each directory. When both `AGENTS.md` and
`CLAUDE.md` exist together, `AGENTS.md` wins; prefer a one-line `CLAUDE.md` shim
pointing to `AGENTS.md` for new cross-agent repositories.

### Global Hooks

```bash
pnpm hooks:link
```

This refreshes the stable hook scripts under `~/.agents/hooks`. Register the
desired commands in `~/.codex/hooks.json`, then review and trust them with
`/hooks` in Codex. The BRP SessionStart reminder, UserPromptSubmit router, and
Stop verification gate use hook payloads supported by both Claude Code and
Codex.

### Global Skills (Primary for BRP)

```bash
pnpm skills:link
```

`pnpm skills:link` uses a dual-layer product model:

- compiled skills are staged into the product-managed canonical directory
  `~/.agents/skills`
- the linker then distributes those compiled skills to each detected IDE target
- Codex reads `~/.agents/skills` directly and must not receive a duplicate copy
  in `~/.codex/skills`

Important:

- `~/.agents/skills` is this product's canonical internal directory for global
  skills
- IDE-specific destinations are linker-managed distribution targets
- unless separately verified, do not treat any IDE target path as an
  OpenAI-documented native path

For Codex specifically, this means the project treats the canonical user skills
directory as the primary BRP surface and keeps `~/.codex/AGENTS.md` as minimal
policy/routing guidance.

The same command compiles the canonical Markdown definitions under `src/agents/`
into Codex custom agent TOML and links them into `~/.codex/agents`. Use `/agent`
to inspect spawned threads; the `brp-reviewer` role is available for isolated
findings-first review.

### What To Validate In Codex

After linking, verify three separate behaviors:

1. discovery: the skill is visible or available to Codex
2. activation: the skill is selected for representative prompts
3. execution quality: the skill produces better behavior than the no-skill
   baseline

Restart Codex after linking if changes are not picked up immediately.

### State Recovery and Session Retention

Inspect Codex state without modifying it:

```bash
pnpm run codex:doctor -- --json
pnpm run codex:repair
pnpm run codex:archive -- --retention-days 90
```

The 2026-08-18 baseline found one corrupt derived database
(`memories_1.sqlite`), two malformed rollouts, and 4,059 active session files
totaling 1,379,019,627 bytes. The 90-day archive plan selected 236 sessions
totaling 486,568,388 bytes. Apply commands refuse to run while a Codex process
or thread-writer lock is active.

After closing every Codex client, apply the reversible operations:

```bash
pnpm run codex:repair -- --apply
pnpm run codex:archive -- --retention-days 90 --apply
```

Each applied command prints its checksummed run directory and exact
`pnpm run codex:restore` command. Restore is a dry-run unless `--apply` is
present and refuses destination collisions. Active sessions remain under
`~/.codex/sessions`; archived sessions live outside that tree under
`~/.codex/session-archive/<run-id>/`. Add repeatable `--sessions <path>` flags
to `library:observe-codex` when archived history should be included explicitly.

---

## Antigravity (Gemini)

Link the `GEMINI.md` and Antigravity rules globally:

```bash
pnpm rules:link
```

This copies `GEMINI.md` to `~/.gemini/GEMINI.md` and syncs Antigravity
rule/workflow files into `~/.gemini/.agent/rules` and
`~/.gemini/.agent/workflows`.

To install BRP skills for Antigravity as well:

```bash
pnpm skills:link
```

This copies the portable BRP bundle into Antigravity's configured skills
directory `~/.gemini/config/skills`.

Antigravity workspace skills live under `<workspace-root>/.agents/skills`.
Gemini CLI discovers the canonical global directory `~/.agents/skills` directly,
so no duplicate Gemini CLI skill root is populated. Both use native MCP
configuration in `~/.gemini/settings.json`.

`pnpm skills:link` also distributes compiled skills into detected clients that
require private locations. Cursor, Codex, Gemini CLI, Windsurf, and TRAE instead
discover the canonical directory.

---

## Windsurf

Install the concise global Windsurf policy:

```bash
pnpm rules:link
```

This copies the policy to Windsurf's documented global rule file at
`~/.codeium/windsurf/memories/global_rules.md`. It stays below the vendor's
6,000-character global limit. Windsurf discovers skills directly from
`~/.agents/skills`, so no duplicate global skill tree is created.

---

## TRAE

TRAE discovers Agent Skills directly from `~/.agents/skills`. Run
`pnpm skills:link` to refresh the canonical library; the linker intentionally
does not create `~/.trae/skills`.

---

## Skills Validation (Optional)

### Raw, Claude-native, and portable views

`~/.agents/skills` is the provenance-preserving source library. Claude consumes
its native skill format, including Claude-only frontmatter. Strict clients are
checked against compiled views under `~/.agents/compiled/<target>/skills`, where
client-only fields are removed and logical names such as
`superpowers:systematic-debugging` receive safe aliases such as
`superpowers-systematic-debugging`.

Do not link both the canonical and compiled view into a client that already
discovers `~/.agents/skills`; duplicate discovery creates precedence warnings.
Run these non-mutating checks before changing runtime links:

```bash
pnpm run skills:portability -- --library ~/.agents --json
pnpm run library:link -- --target codex --dry-run --json
pnpm run library:router-audit -- --dry-run --json
```

The 2026-08-18 inventory found 38 readable skills in each shared Claude profile
and 102 readable canonical skills for Codex, Cursor, Gemini CLI, Windsurf, and
TRAE, with zero broken links on the managed surfaces. A missing optional
executable warning from a client is reported separately and is not counted as a
skill import failure.

To validate skills using the AgentSkills specification:

```bash
# Install the validator (one-time)
python3 -m venv .venv-validate
.venv-validate/bin/pip install skills-ref

# Validate all skills
pnpm skills:validate
```

---

## Troubleshooting

### Rules not showing up

1. Ensure you ran `pnpm rules:compile` after any rule changes
2. Check the hand-maintained guidance and linked exec policy:
   `ls -la ~/.codex/AGENTS.md ~/.codex/rules/default.rules`
3. Restart the IDE after linking

### Skills not recognized

1. Ensure the skill has a valid `SKILL.md` with proper YAML frontmatter
2. Run `pnpm skills:validate` to check for formatting issues
3. Run `pnpm skills:test` to verify discovery and activation checks
4. For Claude Code plugins, ensure the plugin is loaded with `--plugin-dir`

### Compilation errors

1. Ensure all `.mdc` files in `src/rules/` have valid frontmatter
2. Run `pnpm rules:check` to see what is out of date
3. Check `scripts/lib/rules/parsers/parseMdc.ts` for supported frontmatter
   fields
