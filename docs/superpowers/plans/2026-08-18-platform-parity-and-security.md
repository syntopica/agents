# Platform Parity and Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply shared rules, skills, MCP, hooks, plugins, and safe settings to
every supported active platform while preserving account identity and reporting
unsupported capabilities honestly.

**Architecture:** Extend the machine engine with capability-specific adapters
selected by the platform manifest. Adapters use ownership records and snapshots.
Claude personal and secondary share non-identity policy through explicit profile
targets, while credentials and state remain separate.

**Tech Stack:** TypeScript, JSON and TOML renderers already in the machine
engine, `node:test`, native client CLIs for post-apply verification.

**Spec:**
`docs/superpowers/specs/2026-08-18-agent-platform-reliability-design.md`

## Global Constraints

- Recheck current official documentation for each active client immediately
  before implementing its adapter.
- Never infer support from a directory created by this repository.
- Preserve all foreign keys and files.
- Profiles may share policy, never credentials, cookies, projects, logs, or
  conversations.
- Unsupported capabilities remain visible as `unsupported`; do not emulate them
  silently.
- Mutations snapshot first and expose rollback.
- Every task ends with a commit and `git push origin HEAD`.

---

### Task 1: Declare shared security policy and profile boundaries

This task runs after the health-matrix plan and before Task 5 of the Codex
state-recovery plan. The remaining tasks in this plan run after Codex recovery
and skill-router reliability.

**Files:**

- Create: `machine/security.json`
- Create: `scripts/lib/machine/domains/security/types/SecurityManifest.ts`
- Create: `scripts/lib/machine/domains/security/types/ClaudeSecurityPolicy.ts`
- Create: `scripts/lib/machine/domains/security/types/CodexSecurityPolicy.ts`
- Create: `scripts/lib/machine/domains/security/parseSecurityManifest.ts`
- Test: `scripts/lib/machine/domains/security/PARSE_SECURITY_MANIFEST_TEST.ts`

Initial policy:

```json
{
  "version": 1,
  "claude": {
    "profiles": ["claude-personal", "claude-secondary"],
    "defaultMode": "auto",
    "skipDangerousModePermissionPrompt": false,
    "remoteControlAtStartup": true,
    "remoteControlExceptionReason": "Explicitly retained for the established remote terminal workflow"
  },
  "codex": {
    "forcedLoginMethod": "chatgpt"
  }
}
```

- [ ] Write tests that require an exception reason when remote control is
      enabled and reject all credential-shaped fields.
- [ ] Implement strict parsing and credential-literal scanning.
- [ ] Document that Claude `auto` remains the low-friction mode and that the
      dangerous-mode warning is restored without changing normal auto-mode
      prompts.
- [ ] Run
      `npx tsx --test scripts/lib/machine/domains/security/PARSE_SECURITY_MANIFEST_TEST.ts`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add machine/security.json scripts/lib/machine/domains/security
git commit -m "feat: declare shared agent security policy"
git push origin HEAD
```

---

### Task 2: Add conservative Claude settings rendering

**Files:**

- Create: `scripts/lib/machine/domains/security/types/ClaudeSettingsPaths.ts`
- Create: `scripts/lib/machine/domains/security/readClaudeSettings.ts`
- Create: `scripts/lib/machine/domains/security/planClaudeSettings.ts`
- Create: `scripts/lib/machine/domains/security/writeClaudeSettings.ts`
- Test:
  `scripts/lib/machine/domains/security/CLAUDE_SETTINGS_IDEMPOTENCY_TEST.ts`
- Modify: `scripts/lib/machine/ownership/OwnedRecord.ts`

Only these keys are owned: `permissions.defaultMode`,
`skipDangerousModePermissionPrompt`, and `remoteControlAtStartup`. The adapter
must not own `enabledPlugins`, OAuth state, or any account identifier.

- [ ] Write fixtures with unrelated settings, plugin declarations, comments
      represented by absent JSON keys, and divergent profile credentials outside
      `settings.json`.
- [ ] Assert both profiles converge on owned keys and foreign settings survive
      byte-equivalent JSON normalization.
- [ ] Implement plan and apply using the existing machine snapshot mechanism.
- [ ] Verify idempotency with a second apply that reports zero changes.
- [ ] Run the focused test and `pnpm run machine:test`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/machine/domains/security scripts/lib/machine/ownership/OwnedRecord.ts
git commit -m "feat: synchronize safe Claude settings policy"
git push origin HEAD
```

---

### Task 3: Correct Gemini MCP and skill adapters

**Files:**

- Create: `scripts/lib/machine/renderers/gemini/renderGeminiServers.ts`
- Create: `scripts/lib/machine/renderers/gemini/RENDER_GEMINI_SERVERS_TEST.ts`
- Create: `scripts/lib/machine/domains/mcp/writeGeminiSettings.ts`
- Create: `scripts/lib/machine/domains/mcp/WRITE_GEMINI_SETTINGS_TEST.ts`
- Modify: `scripts/lib/machine/cli/resolveTargetPaths.ts`
- Modify: `scripts/lib/machine/domains/mcp/read.ts`
- Modify: `scripts/lib/machine/domains/mcp/apply.ts`
- Modify: `scripts/lib/link/constants/IDE_REGISTRY.ts`

Gemini's native config is `~/.gemini/settings.json`; Streamable HTTP uses
`httpUrl`, not Claude's `url` field. Gemini can read user skills from
`~/.agents/skills`, so avoid duplicate skill copies unless target-specific
compilation is required.

- [ ] Write render tests for stdio, Streamable HTTP, environment references,
      headers, timeout, and foreign settings preservation.
- [ ] Change the Gemini target path from `~/.gemini/config/mcp_config.json` to
      `~/.gemini/settings.json`.
- [ ] Mark Gemini as reading canonical user skills or its compiled portable
      view, not both.
- [ ] Apply against temp configs and prove idempotency.
- [ ] Run `pnpm run machine:test && pnpm run link:test`.
- [ ] Run the real `gemini mcp list` and `gemini skills list` after apply.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/machine scripts/lib/link/constants/IDE_REGISTRY.ts
git commit -m "fix: use native Gemini MCP and skill configuration"
git push origin HEAD
```

---

### Task 4: Add Cursor MCP and rule verification

**Files:**

- Modify: `scripts/lib/machine/domains/mcp/constants/MCP_TARGETS.ts`
- Modify: `scripts/lib/machine/cli/resolveTargetPaths.ts`
- Create: `scripts/lib/machine/renderers/cursor/renderCursorServers.ts`
- Create: `scripts/lib/machine/renderers/cursor/RENDER_CURSOR_SERVERS_TEST.ts`
- Create: `scripts/lib/machine/domains/mcp/writeCursorConfig.ts`
- Create: `scripts/lib/machine/domains/mcp/WRITE_CURSOR_CONFIG_TEST.ts`
- Modify: `machine/mcp.json`
- Modify: `scripts/lib/link/constants/IDE_RULE_TARGETS.ts`

Cursor uses global `~/.cursor/mcp.json` and project `.cursor/mcp.json`. This
adapter manages only the global machine-owned servers. Recheck current Cursor
docs because the previously stable deep links now redirect to a consolidated
documentation site.

- [ ] Add `cursor` to `MCP_TARGETS` only after confirming current transport
      field names.
- [ ] Write renderer and ownership-preservation tests.
- [ ] Add Context7, Serena, and CodeGraph target declarations where their
      transport is supported.
- [ ] Verify rules remain under `~/.cursor/rules/busirocket` and skills resolve
      through the compiled portable target.
- [ ] Run `pnpm run machine:test && pnpm run link:test`.
- [ ] Run `cursor-agent mcp list` and `cursor-agent mcp list-tools <server>` for
      each required server.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add machine/mcp.json scripts/lib/machine scripts/lib/link/constants/IDE_RULE_TARGETS.ts
git commit -m "feat: manage Cursor MCP and rules"
git push origin HEAD
```

---

### Task 5: Model rules, hooks, and plugins as capabilities

**Files:**

- Create: `scripts/lib/machine/domains/capabilities/types/CapabilityTarget.ts`
- Create: `scripts/lib/machine/domains/capabilities/planCapabilityLinks.ts`
- Create: `scripts/lib/machine/domains/capabilities/applyCapabilityLinks.ts`
- Create: `scripts/lib/machine/domains/capabilities/verifyCapabilityLinks.ts`
- Test: `scripts/lib/machine/domains/capabilities/CAPABILITY_LINKS_TEST.ts`
- Modify: `scripts/commands/linkHooksGlobal.ts`
- Modify: `scripts/commands/linkRulesGlobal.ts`
- Modify: `scripts/commands/linkSkillsGlobal.ts`

- [ ] Convert existing global link targets into declarative capability targets
      without changing output paths.
- [ ] Keep Claude plugin declarations separate from plugin cache contents and
      account login state.
- [ ] Treat hooks as unsupported for a client unless its current docs expose a
      compatible hook mechanism.
- [ ] Add stale-link and broken-link findings to verification.
- [ ] Run all existing link and hook tests before and after the refactor and
      compare output.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/commands scripts/lib/machine/domains/capabilities
git commit -m "refactor: model agent links as managed capabilities"
git push origin HEAD
```

---

### Task 6: Apply, verify, and document platform parity

**Files:**

- Modify: `scripts/commands/machineApply.ts`
- Modify: `scripts/commands/machineDiff.ts`
- Modify: `scripts/commands/machineRollback.ts`
- Modify: `scripts/commands/agentDoctor.ts`
- Modify: `README.md`
- Modify: `docs/ide-setup.md`

- [ ] Add `security` and `capabilities` domains to diff, apply, rollback,
      ownership, and report formatting.
- [ ] Run `pnpm run machine:diff -- --json` and inspect every planned path
      before apply.
- [ ] Run `pnpm run machine:apply -- --json`.
- [ ] Run a second diff and require zero changes.
- [ ] Run live inventories in both Claude profiles, Codex, Gemini, and Cursor.
- [ ] Confirm Claude profiles have identical non-identity settings and plugin
      declarations while their credential/state roots remain different.
- [ ] Document active, provisioned, unavailable, and unsupported semantics.
- [ ] Run `pnpm run check:all && git diff --check`.
- [ ] Commit and push:

```bash
git add README.md docs/ide-setup.md scripts/commands
git commit -m "feat: enforce cross-platform agent parity"
git push origin HEAD
```

## Completion Gate

Run:

```bash
pnpm run check:all
pnpm run machine:diff -- --json
pnpm run agents:doctor -- --json
claude mcp list
CLAUDE_CONFIG_DIR="$HOME/$CLAUDE_SECONDARY_CONFIG_DIR" claude mcp list
codex mcp list
gemini mcp list
cursor-agent mcp list
git status --short --branch
```

Expected: machine diff is empty; active-client capabilities pass; Claude
identities remain separate; unsupported capabilities are explicit; the
repository is clean and synced.
