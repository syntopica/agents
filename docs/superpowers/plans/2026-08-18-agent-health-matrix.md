# Agent Health Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace path-only client detection with a redacted doctor that
distinguishes active, provisioned, and unavailable platforms and verifies each
managed capability at the strongest level the runtime supports.

**Architecture:** Keep `IDE_REGISTRY` as the provisioning registry. Add a
separate platform-health slice containing runtime probes, lifecycle
classification, capability checks, redaction, and report formatting. Promote the
tracked machine instance to `machine/` so every health and MCP command has a
working default without reading untracked dotfiles.

**Tech Stack:** TypeScript on Node (ESM), `node:test`, `tsx`, existing
zero-runtime-dependency tooling, native child processes for read-only client
probes.

**Spec:**
`docs/superpowers/specs/2026-08-18-agent-platform-reliability-design.md`

## Global Constraints

- One exported unit per file and one responsibility per module.
- No runtime dependencies, shell interpolation, or secret values in reports.
- Tests pass explicit temporary roots and `PATH`; they never inspect the
  developer's home.
- A missing optional client is `unavailable`, not a failed build.
- An active client with a failed required capability makes the doctor exit 1.
- JSON output is redacted before serialization.
- Every task ends with a human-authored commit and `git push origin HEAD`.

---

### Task 1: Make the tracked machine instance the default

**Files:**

- Create: `machine/mcp.json`
- Modify: `scripts/lib/machine/instance/types/ResolveInstanceDirOptions.ts`
- Modify: `scripts/lib/machine/instance/resolveInstanceDir.ts`
- Modify: `scripts/lib/machine/instance/RESOLVE_INSTANCE_DIR_TEST.ts`
- Modify: `scripts/lib/machine/domains/mcp/fixtures/loadExampleManifest.ts`
- Modify: `README.md`
- Modify: `docs/ide-setup.md`

**Contract:** `--instance` wins, then `AGENTS_MACHINE_DIR`, then
`<repo>/machine`. The tracked manifest contains environment references only and
remains usable as a test fixture.

- [ ] Copy the content of `examples/machine/mcp.json` into `machine/mcp.json`;
      leave the example in place until every test points at the canonical file.
- [ ] Add `root: string` to `ResolveInstanceDirOptions` and remove the unused
      `home` field.
- [ ] Change the fallback in `resolveInstanceDir` to `join(root, "machine")`.
- [ ] Update the tests to inject `/repo` and assert `/repo/machine`.
- [ ] Change `loadExampleManifest` to load `machine/mcp.json`, then rename it to
      `loadCanonicalManifest.ts` and update imports.
- [ ] Run
      `npx tsx --test scripts/lib/machine/instance/RESOLVE_INSTANCE_DIR_TEST.ts scripts/lib/machine/domains/mcp/PARSE_MCP_MANIFEST_TEST.ts`.
- [ ] Run `pnpm run machine:diff -- --json`; confirm it resolves
      `machine/mcp.json` without a flag and emits no credential literals.
- [ ] Update the README and IDE setup examples with the verified command.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add machine scripts/lib/machine README.md docs/ide-setup.md
git commit -m "feat: make the tracked machine instance the default"
git push origin HEAD
```

---

### Task 2: Declare platform runtime probes and capabilities

**Files:**

- Create: `machine/platforms.json`
- Create: `scripts/lib/platform-health/constants/PLATFORM_LIFECYCLES.ts`
- Create: `scripts/lib/platform-health/constants/PLATFORM_CAPABILITIES.ts`
- Create: `scripts/lib/platform-health/types/PlatformLifecycle.ts`
- Create: `scripts/lib/platform-health/types/PlatformCapability.ts`
- Create: `scripts/lib/platform-health/types/PlatformProbe.ts`
- Create: `scripts/lib/platform-health/types/PlatformDefinition.ts`
- Create: `scripts/lib/platform-health/types/PlatformManifest.ts`
- Create: `scripts/lib/platform-health/types/PlatformManifestParseResult.ts`
- Create: `scripts/lib/platform-health/parsePlatformManifest.ts`
- Test: `scripts/lib/platform-health/PARSE_PLATFORM_MANIFEST_TEST.ts`

**Interfaces:**

```ts
export interface PlatformProbe {
  commands?: string[]
  appPaths?: string[]
  configPaths: string[]
}

export interface PlatformDefinition {
  registryId: string
  capabilities: PlatformCapability[]
  probe: PlatformProbe
}
```

`machine/platforms.json` must contain exactly the 25 IDs in `IDE_REGISTRY`.
Declare live commands for the currently verified CLI clients (`claude`, `codex`,
`gemini`, and `cursor-agent`) and filesystem probes for GUI-only clients. Do not
claim a capability unless an adapter or static validator exists.

- [ ] Write parser tests for an unknown registry ID, duplicate ID, empty probe,
      unknown capability, and a manifest whose IDs differ from `IDE_REGISTRY`.
- [ ] Run the test and confirm it fails because the parser does not exist.
- [ ] Add the constants, types, and parser with deterministic sorted errors.
- [ ] Add all 25 platform definitions to `machine/platforms.json`.
- [ ] Run
      `npx tsx --test scripts/lib/platform-health/PARSE_PLATFORM_MANIFEST_TEST.ts`
      and confirm all cases pass.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add machine/platforms.json scripts/lib/platform-health
git commit -m "feat: declare platform probes and capabilities"
git push origin HEAD
```

---

### Task 3: Detect runtime lifecycle without shelling through a shell

**Files:**

- Create: `scripts/lib/platform-health/types/ProbeResult.ts`
- Create: `scripts/lib/platform-health/types/PlatformRuntimeState.ts`
- Create: `scripts/lib/platform-health/findCommandOnPath.ts`
- Create: `scripts/lib/platform-health/findExistingPath.ts`
- Create: `scripts/lib/platform-health/detectPlatformRuntime.ts`
- Test: `scripts/lib/platform-health/FIND_COMMAND_ON_PATH_TEST.ts`
- Test: `scripts/lib/platform-health/DETECT_PLATFORM_RUNTIME_TEST.ts`

**Lifecycle algorithm:**

```text
runtime command or app exists -> active
otherwise any managed config path exists -> provisioned
otherwise -> unavailable
```

`findCommandOnPath` splits the injected `PATH`, checks executable file
permissions, and never runs `which`, `command -v`, or a shell.
`findExistingPath` expands only the explicit `$HOME` prefix using the injected
home directory.

- [ ] Write tests with a temporary executable, a non-executable file, a
      config-only platform, and an absent platform.
- [ ] Run both tests and confirm module-not-found failures.
- [ ] Implement the two probes and lifecycle classifier.
- [ ] Assert that a generated config directory alone produces `provisioned`, not
      `active`.
- [ ] Run
      `npx tsx --test scripts/lib/platform-health/FIND_COMMAND_ON_PATH_TEST.ts scripts/lib/platform-health/DETECT_PLATFORM_RUNTIME_TEST.ts`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/platform-health
git commit -m "feat: detect active and provisioned agent runtimes"
git push origin HEAD
```

---

### Task 4: Add static capability inspectors

**Files:**

- Create: `scripts/lib/platform-health/constants/CAPABILITY_STATUSES.ts`
- Create: `scripts/lib/platform-health/types/CapabilityStatus.ts`
- Create: `scripts/lib/platform-health/types/CapabilityHealth.ts`
- Create: `scripts/lib/platform-health/types/PlatformHealth.ts`
- Create: `scripts/lib/platform-health/inspectSkillCapability.ts`
- Create: `scripts/lib/platform-health/inspectRuleCapability.ts`
- Create: `scripts/lib/platform-health/inspectHookCapability.ts`
- Create: `scripts/lib/platform-health/inspectPluginCapability.ts`
- Create: `scripts/lib/platform-health/inspectMcpCapability.ts`
- Create: `scripts/lib/platform-health/inspectPlatform.ts`
- Test: `scripts/lib/platform-health/INSPECT_PLATFORM_TEST.ts`

**Static checks:**

- Skills: target directory exists, broken links are counted, and every
  production skill has a readable `SKILL.md`.
- Rules: every declared target exists and the generated source is current.
- Hooks: linked hook files exist and are executable where required.
- Plugins: declarations are readable; credentials and plugin caches are not
  traversed.
- MCP: parse the target-native configuration and compare only machine-owned
  server names and normalized non-secret fields.

- [ ] Write a fixture with one healthy capability, one broken symlink, one
      unsupported capability, and one unavailable platform.
- [ ] Run the test and confirm it fails before implementation.
- [ ] Implement one inspector per capability and a thin `inspectPlatform`
      composer.
- [ ] Ensure inspector detail strings contain counts and symbolic roots, not raw
      home paths.
- [ ] Run `npx tsx --test scripts/lib/platform-health/INSPECT_PLATFORM_TEST.ts`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/platform-health
git commit -m "feat: inspect managed agent capabilities"
git push origin HEAD
```

---

### Task 5: Add live probes for active clients

**Files:**

- Create: `scripts/lib/platform-health/types/LiveProbeDefinition.ts`
- Create: `scripts/lib/platform-health/types/LiveProbeResult.ts`
- Create: `scripts/lib/platform-health/constants/LIVE_PROBES.ts`
- Create: `scripts/lib/platform-health/runLiveProbe.ts`
- Create: `scripts/lib/platform-health/applyLiveProbe.ts`
- Test: `scripts/lib/platform-health/RUN_LIVE_PROBE_TEST.ts`

**Initial read-only probes:**

| Platform     | Command                                           |
| ------------ | ------------------------------------------------- |
| Claude       | `claude mcp list`                                 |
| Codex        | `codex login status` and `codex mcp list`         |
| Gemini CLI   | `gemini mcp list` and `gemini skills list`        |
| Cursor Agent | `cursor-agent status` and `cursor-agent mcp list` |

Probe definitions use argument arrays and `spawn`, never concatenated command
strings. Tests inject a fake executable that returns success, auth-required,
timeout, and failure outputs. Output parsers must match stable status markers
and retain the raw output only in memory.

- [ ] Write the process and status-mapping tests.
- [ ] Implement a timeout that sends `SIGTERM`, then `SIGKILL` after a short
      grace period.
- [ ] Map login failures to `auth-required`, startup or discovery failures to
      `failed`, and optional server failures to `degraded`.
- [ ] Run `npx tsx --test scripts/lib/platform-health/RUN_LIVE_PROBE_TEST.ts`.
- [ ] Run the four read-only probes manually and update only parser fixtures,
      never real config.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/lib/platform-health
git commit -m "feat: probe active agent clients"
git push origin HEAD
```

---

### Task 6: Expose a redacted doctor and make it the cross-platform gate

**Files:**

- Create: `scripts/lib/platform-health/redactHealthReport.ts`
- Create: `scripts/lib/platform-health/formatHealthMatrix.ts`
- Create: `scripts/lib/platform-health/healthExitCode.ts`
- Create: `scripts/commands/agentDoctor.ts`
- Create: `scripts/bin/run-agent-doctor.ts`
- Create: `scripts/lib/platform-health/REDACT_HEALTH_REPORT_TEST.ts`
- Create: `scripts/lib/platform-health/HEALTH_EXIT_CODE_TEST.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/ide-setup.md`

Add scripts:

```json
{
  "agents:doctor": "tsx scripts/bin/run-agent-doctor.ts",
  "agents:test": "tsx --test \"scripts/lib/platform-health/**/*_TEST.ts\""
}
```

Add `pnpm run agents:test` to `check:all` before `machine:test`.

- [ ] Write redaction tests containing API keys, bearer headers, home paths, and
      OAuth-shaped JSON.
- [ ] Write exit-code tests: unavailable optional platforms return 0; active
      required failures return 1; malformed manifests return 2.
- [ ] Implement the report composer, redactor, matrix formatter, and command.
- [ ] Run `pnpm run agents:doctor` and verify all 25 registry IDs appear once.
- [ ] Run `pnpm --silent run agents:doctor -- --json > /tmp/agents-doctor.json`
      and validate it with
      `node -e 'JSON.parse(require("node:fs").readFileSync("/tmp/agents-doctor.json", "utf8"))'`.
- [ ] Search the JSON for known secret prefixes and the literal home path;
      expect no matches.
- [ ] Document lifecycle semantics and the exact commands that were run.
- [ ] Run `pnpm run check:all && git diff --check`.
- [ ] Commit and push:

```bash
git add package.json README.md docs/ide-setup.md scripts/bin scripts/commands scripts/lib/platform-health
git commit -m "feat: add the cross-platform agent doctor"
git push origin HEAD
```

## Completion Gate

Run:

```bash
pnpm run check:all
pnpm run agents:doctor
pnpm run agents:doctor -- --json
pnpm run machine:diff -- --json
git status --short --branch
```

Expected: repository checks pass; the doctor emits 25 unique platform rows with
no secret values; the machine diff resolves the tracked instance without a flag;
the branch is clean and synced.
