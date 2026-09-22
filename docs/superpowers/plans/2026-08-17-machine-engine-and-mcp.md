# Machine Engine and MCP Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working `machine` CLI that captures, diffs, applies and rolls
back MCP server configuration across four agent config formats from one
declarative manifest.

**Architecture:** Seven domains will eventually share one contract - `read`,
`plan`, `apply`, `verify` - where `plan` is pure so it is testable without a
machine. This plan builds the shared engine (instance resolution, run snapshots,
ownership tracking, secret references, JSON output) plus the first domain,
`mcp`. The remaining six domains are separate plans that add a directory under
`domains/` and register it; nothing in this plan is MCP-specific outside
`domains/mcp/` and `renderers/`.

**Tech Stack:** TypeScript on Node (ES2024, ESM, `moduleResolution: Bundler`),
`tsx` as the runner, `node:test` with `node:assert/strict`, zero runtime
dependencies.

**Spec:** `docs/superpowers/specs/2026-08-17-machine-provisioning-design.md`

## Global Constraints

- **Zero runtime dependencies.** `package.json` has an empty `dependencies`
  block and it stays empty. No TOML library: the Codex renderer and reader are
  hand-written for the narrow shape used.
- **Atomic file rule.** One exported unit per file. No `utils.ts`, no private
  helper clusters. Every dependency is an explicit import.
- **Engine code lives under `scripts/`**, never `src/`. `tsconfig.json` includes
  only `scripts/**/*`; `src/` holds skill and rule content.
- **Layering, enforced by eslint-plugin-boundaries:** `scripts/bin/*` only calls
  `main()` from `scripts/commands/*`, which composes operations from
  `scripts/lib/*`.
- **TypeScript strictness:** `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`. Optional properties are omitted, never set to
  `undefined`. No `any`, no non-null assertions.
- **Import style:** `import type` separately from value imports
  (`@typescript-eslint/consistent-type-imports`,
  `fixStyle: separate-type-imports`).
- **Code style:** double quotes, no semicolons, arrow-function consts. Run
  `pnpm run format && pnpm run lint:fix` before each commit.
- **Tests sit beside their subject** as `NAME_TEST.ts` and never read `$HOME`.
  Every test that needs a filesystem uses a temp directory from
  `node:fs/promises` `mkdtemp`.
- **English in every artifact.** ASCII punctuation only: straight quotes, `-`
  not em dash.
- **No assistant attribution** in any commit message.
- **Status enum is closed:** `converged`, `changed`, `skipped`, `failed`,
  `needs-secret`. Nothing else may appear in JSON output.

---

### Task 1: Core types and the status enum

**Files:**

- Create: `scripts/lib/machine/types/MachineStatus.ts`
- Create: `scripts/lib/machine/types/DomainResult.ts`
- Create: `scripts/lib/machine/types/RunReport.ts`
- Test: `scripts/lib/machine/types/MACHINE_STATUS_TEST.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `MACHINE_STATUS` (readonly tuple), type `MachineStatus`, type
  `DomainResult = { domain: string; status: MachineStatus; changes: number; messages: string[] }`,
  type
  `RunReport = { runId: string; profile: string; domains: DomainResult[]; ok: boolean }`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { MACHINE_STATUS } from './MachineStatus'

void test('the status enum is closed and ordered from best to worst', () => {
  assert.deepEqual(MACHINE_STATUS, [
    'converged',
    'changed',
    'skipped',
    'needs-secret',
    'failed',
  ])
})

void test('every status is unique', () => {
  assert.equal(new Set(MACHINE_STATUS).size, MACHINE_STATUS.length)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/types/MACHINE_STATUS_TEST.ts` Expected:
FAIL, cannot find module `./MachineStatus`.

- [ ] **Step 3: Write minimal implementation**

`scripts/lib/machine/types/MachineStatus.ts`:

```ts
export const MACHINE_STATUS = [
  'converged',
  'changed',
  'skipped',
  'needs-secret',
  'failed',
] as const

export type MachineStatus = (typeof MACHINE_STATUS)[number]
```

`scripts/lib/machine/types/DomainResult.ts`:

```ts
import type { MachineStatus } from './MachineStatus'

export type DomainResult = {
  domain: string
  status: MachineStatus
  changes: number
  messages: string[]
}
```

`scripts/lib/machine/types/RunReport.ts`:

```ts
import type { DomainResult } from './DomainResult'

export type RunReport = {
  runId: string
  profile: string
  domains: DomainResult[]
  ok: boolean
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/types/MACHINE_STATUS_TEST.ts` Expected:
PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/types
git commit -m "feat: add the machine engine status enum and report types"
```

---

### Task 2: Instance directory resolution

**Files:**

- Create: `scripts/lib/machine/instance/resolveInstanceDir.ts`
- Test: `scripts/lib/machine/instance/RESOLVE_INSTANCE_DIR_TEST.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  `resolveInstanceDir(options: { flag?: string; env: NodeJS.ProcessEnv; home: string }) => string`.

Resolution order is flag, then `AGENTS_MACHINE_DIR`, then
`<home>/p/dotfiles/machine`. The function is pure: the caller passes
`process.env` and `os.homedir()`, so tests never read the real environment.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveInstanceDir } from './resolveInstanceDir'

void test('the explicit flag wins over everything', () => {
  const dir = resolveInstanceDir({
    flag: '/tmp/explicit',
    env: { AGENTS_MACHINE_DIR: '/tmp/from-env' },
    home: '/home/someone',
  })
  assert.equal(dir, '/tmp/explicit')
})

void test('the environment variable is used when no flag is given', () => {
  const dir = resolveInstanceDir({
    env: { AGENTS_MACHINE_DIR: '/tmp/from-env' },
    home: '/home/someone',
  })
  assert.equal(dir, '/tmp/from-env')
})

void test('it falls back to the dotfiles machine directory under home', () => {
  const dir = resolveInstanceDir({ env: {}, home: '/home/someone' })
  assert.equal(dir, '/home/someone/p/dotfiles/machine')
})

void test('an empty environment variable is treated as absent', () => {
  const dir = resolveInstanceDir({
    env: { AGENTS_MACHINE_DIR: '' },
    home: '/home/someone',
  })
  assert.equal(dir, '/home/someone/p/dotfiles/machine')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/instance/RESOLVE_INSTANCE_DIR_TEST.ts`
Expected: FAIL, cannot find module `./resolveInstanceDir`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { join } from 'node:path'

type ResolveInstanceDirOptions = {
  flag?: string
  env: NodeJS.ProcessEnv
  home: string
}

export const resolveInstanceDir = ({
  flag,
  env,
  home,
}: ResolveInstanceDirOptions) => {
  if (flag) {
    return flag
  }

  const fromEnv = env['AGENTS_MACHINE_DIR']
  if (fromEnv) {
    return fromEnv
  }

  return join(home, 'p', 'dotfiles', 'machine')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/instance/RESOLVE_INSTANCE_DIR_TEST.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/instance
git commit -m "feat: resolve the machine instance directory from flag, env or default"
```

---

### Task 3: Secret reference type and resolver

**Files:**

- Create: `scripts/lib/machine/secrets/SecretReference.ts`
- Create: `scripts/lib/machine/secrets/isSecretReference.ts`
- Create: `scripts/lib/machine/secrets/resolveReference.ts`
- Test: `scripts/lib/machine/secrets/RESOLVE_REFERENCE_TEST.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: type `SecretReference = { from_env: string }`,
  `isSecretReference(value: unknown) => value is SecretReference`,
  `resolveReference(reference: SecretReference, env: NodeJS.ProcessEnv) => { resolved: true; value: string } | { resolved: false; name: string }`.

An unresolved reference is a normal outcome, not a thrown error: the caller
reports `needs-secret` and keeps going.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { isSecretReference } from './isSecretReference'
import { resolveReference } from './resolveReference'

void test('a reference object is recognised', () => {
  assert.equal(isSecretReference({ from_env: 'TOKEN' }), true)
})

void test('a bare string is not a reference', () => {
  assert.equal(isSecretReference('ghp_something'), false)
})

void test('an object with the wrong shape is not a reference', () => {
  assert.equal(isSecretReference({ from_env: 12 }), false)
  assert.equal(isSecretReference({ value: 'TOKEN' }), false)
  assert.equal(isSecretReference(null), false)
})

void test('a present variable resolves to its value', () => {
  const result = resolveReference({ from_env: 'TOKEN' }, { TOKEN: 'abc' })
  assert.deepEqual(result, { resolved: true, value: 'abc' })
})

void test('a missing variable reports the name instead of throwing', () => {
  const result = resolveReference({ from_env: 'TOKEN' }, {})
  assert.deepEqual(result, { resolved: false, name: 'TOKEN' })
})

void test('an empty variable counts as missing', () => {
  const result = resolveReference({ from_env: 'TOKEN' }, { TOKEN: '' })
  assert.deepEqual(result, { resolved: false, name: 'TOKEN' })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/secrets/RESOLVE_REFERENCE_TEST.ts`
Expected: FAIL, cannot find module `./isSecretReference`.

- [ ] **Step 3: Write minimal implementation**

`SecretReference.ts`:

```ts
export type SecretReference = {
  from_env: string
}
```

`isSecretReference.ts`:

```ts
import type { SecretReference } from './SecretReference'

export const isSecretReference = (value: unknown): value is SecretReference => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return typeof candidate['from_env'] === 'string'
}
```

`resolveReference.ts`:

```ts
import type { SecretReference } from './SecretReference'

export type ResolvedReference =
  { resolved: true; value: string } | { resolved: false; name: string }

export const resolveReference = (
  reference: SecretReference,
  env: NodeJS.ProcessEnv,
): ResolvedReference => {
  const value = env[reference.from_env]
  if (value) {
    return { resolved: true, value }
  }

  return { resolved: false, name: reference.from_env }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/secrets/RESOLVE_REFERENCE_TEST.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/secrets
git commit -m "feat: add secret references that resolve from the environment"
```

---

### Task 4: The credential-literal validator

This is the task that closes the failure this whole design came from. On
2026-08-17 ten credentials were found sitting as literals inside `args` and
`env` of a config file that gets rsynced to a laptop and a VPS. The fixtures
below are the real shapes they took, with the values replaced.

**Files:**

- Create: `scripts/lib/machine/schemas/isAllowedLiteral.ts`
- Create: `scripts/lib/machine/schemas/findCredentialLiterals.ts`
- Test: `scripts/lib/machine/schemas/FIND_CREDENTIAL_LITERALS_TEST.ts`

**Interfaces:**

- Consumes: `isSecretReference` from Task 3.
- Produces:
  `findCredentialLiterals(server: { args?: unknown[]; env?: Record<string, unknown>; headers?: Record<string, unknown> }) => string[]`
  returning one human-readable finding per offending location, empty when clean.

A value passes when it is a `SecretReference`, or when it is a string on the
allow-list: a flag (starts with `-`), a bare transport word, a package or path
specifier, or a URL with no userinfo component. Anything else in `env`,
`headers`, or `args` is a finding.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { findCredentialLiterals } from './findCredentialLiterals'

void test('a clean stdio server produces no findings', () => {
  const findings = findCredentialLiterals({
    args: [
      '--from',
      'git+https://github.com/oraios/serena',
      'serena',
      'start-mcp-server',
    ],
  })
  assert.deepEqual(findings, [])
})

void test('a reference in env is accepted', () => {
  const findings = findCredentialLiterals({
    env: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
  })
  assert.deepEqual(findings, [])
})

void test('a literal token in env is rejected', () => {
  const findings = findCredentialLiterals({
    env: { GITHUB_TOKEN: 'ghp_0000000000000000000000000000000000' },
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /env\.GITHUB_TOKEN/)
})

void test('a literal in headers is rejected', () => {
  const findings = findCredentialLiterals({
    headers: { CONTEXT7_API_KEY: 'ctx7sk-0000000000' },
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /headers\.CONTEXT7_API_KEY/)
})

void test('a connection string with inline credentials in args is rejected', () => {
  const findings = findCredentialLiterals({
    args: [
      '-y',
      'mongodb-mcp-server',
      '--connectionString',
      'mongodb+srv://user:pass@cluster/',
      '--readOnly',
    ],
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /args\[3\]/)
})

void test('a bare high-entropy token as a positional argument is rejected', () => {
  const findings = findCredentialLiterals({
    args: [
      'mcp-remote',
      'https://api.browser-use.com/mcp',
      '--header',
      'X-Api-Key aBcD1234eFgH5678iJkL9012mNoP3456',
    ],
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /args\[3\]/)
})

void test('flags, transports, package names and clean urls are allowed', () => {
  const findings = findCredentialLiterals({
    args: [
      '-y',
      '--transport',
      'stdio',
      '@brave/brave-search-mcp-server',
      'https://mcp.context7.com/mcp',
    ],
  })
  assert.deepEqual(findings, [])
})

void test('every offending location is reported, not just the first', () => {
  const findings = findCredentialLiterals({
    env: {
      A: 'aBcD1234eFgH5678iJkL9012mNoP3456',
      B: 'qRsT7890uVwX1234yZaB5678cDeF9012',
    },
  })
  assert.equal(findings.length, 2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
`npx tsx --test scripts/lib/machine/schemas/FIND_CREDENTIAL_LITERALS_TEST.ts`
Expected: FAIL, cannot find module `./findCredentialLiterals`.

- [ ] **Step 3: Write minimal implementation**

`isAllowedLiteral.ts`:

```ts
const TRANSPORT_WORDS = new Set(['stdio', 'http', 'sse'])
const SUSPICIOUS_PREFIX =
  /^(ghp_|gho_|github_pat_|sk-|ctx7sk-|fc-|xox[baprs]-|eyJ)/
const USERINFO_URL = /^[a-z][a-z0-9+.-]*:\/\/[^/@\s]+@/i
const HIGH_ENTROPY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9_-]{24,}/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isAllowedLiteral = (value: string) => {
  if (
    SUSPICIOUS_PREFIX.test(value) ||
    USERINFO_URL.test(value) ||
    UUID.test(value)
  ) {
    return false
  }

  if (value.startsWith('-') || TRANSPORT_WORDS.has(value)) {
    return true
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return true
  }

  return !HIGH_ENTROPY.test(value)
}
```

`findCredentialLiterals.ts`:

```ts
import { isSecretReference } from '../secrets/isSecretReference'
import { isAllowedLiteral } from './isAllowedLiteral'

type ServerShape = {
  args?: unknown[]
  env?: Record<string, unknown>
  headers?: Record<string, unknown>
}

const checkValue = (location: string, value: unknown, findings: string[]) => {
  if (isSecretReference(value)) {
    return
  }

  if (typeof value !== 'string') {
    findings.push(`${location} must be a string or a { from_env } reference`)
    return
  }

  if (!isAllowedLiteral(value)) {
    findings.push(
      `${location} looks like a credential literal; use { from_env: NAME } instead`,
    )
  }
}

export const findCredentialLiterals = (server: ServerShape) => {
  const findings: string[] = []

  server.args?.forEach((value, index) => {
    checkValue(`args[${index}]`, value, findings)
  })

  for (const [key, value] of Object.entries(server.env ?? {})) {
    checkValue(`env.${key}`, value, findings)
  }

  for (const [key, value] of Object.entries(server.headers ?? {})) {
    checkValue(`headers.${key}`, value, findings)
  }

  return findings
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
`npx tsx --test scripts/lib/machine/schemas/FIND_CREDENTIAL_LITERALS_TEST.ts`
Expected: PASS, 8 tests.

If the connection-string case fails, check `USERINFO_URL` matches
`mongodb+srv://user:pass@cluster/` before the generic URL allow returns true -
order matters, the deny checks run first.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/schemas
git commit -m "feat: reject credential literals in MCP server definitions"
```

---

### Task 5: MCP manifest types and loader

**Files:**

- Create: `scripts/lib/machine/domains/mcp/McpManifest.ts`
- Create: `scripts/lib/machine/domains/mcp/parseMcpManifest.ts`
- Create: `examples/machine/mcp.json`
- Test: `scripts/lib/machine/domains/mcp/PARSE_MCP_MANIFEST_TEST.ts`

**Interfaces:**

- Consumes: `findCredentialLiterals` from Task 4.
- Produces: type
  `McpTarget = "claude-personal" | "claude-secondary" | "codex" | "gemini"`,
  type `McpServer`, type `McpManifest = { servers: Record<string, McpServer> }`,
  `parseMcpManifest(raw: unknown) => { ok: true; manifest: McpManifest } | { ok: false; errors: string[] }`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMcpManifest } from './parseMcpManifest'

void test('a valid stdio server parses', () => {
  const result = parseMcpManifest({
    servers: {
      serena: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'uvx',
        args: ['serena', 'start-mcp-server'],
      },
    },
  })
  assert.equal(result.ok, true)
})

void test('an http server without a url is rejected', () => {
  const result = parseMcpManifest({
    servers: { context7: { targets: ['codex'], transport: 'http' } },
  })
  assert.equal(result.ok, false)
  assert.equal(
    result.ok === false && result.errors.some((e) => e.includes('url')),
    true,
  )
})

void test('a stdio server carrying a url is rejected', () => {
  const result = parseMcpManifest({
    servers: {
      mixed: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'x',
        url: 'https://example.com',
      },
    },
  })
  assert.equal(result.ok, false)
})

void test('an unknown target is rejected and names the offender', () => {
  const result = parseMcpManifest({
    servers: { x: { targets: ['emacs'], transport: 'stdio', command: 'x' } },
  })
  assert.equal(result.ok, false)
  assert.equal(
    result.ok === false && result.errors.some((e) => e.includes('emacs')),
    true,
  )
})

void test('a credential literal fails validation through the manifest parser', () => {
  const result = parseMcpManifest({
    servers: {
      leaky: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'npx',
        env: { TOKEN: 'ghp_0000000000000000000000000000000000' },
      },
    },
  })
  assert.equal(result.ok, false)
  assert.equal(
    result.ok === false && result.errors.some((e) => e.includes('env.TOKEN')),
    true,
  )
})

void test('an empty targets list is rejected', () => {
  const result = parseMcpManifest({
    servers: { x: { targets: [], transport: 'stdio', command: 'x' } },
  })
  assert.equal(result.ok, false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/PARSE_MCP_MANIFEST_TEST.ts`
Expected: FAIL, cannot find module `./parseMcpManifest`.

- [ ] **Step 3: Write minimal implementation**

`McpManifest.ts`:

```ts
import type { SecretReference } from '../../secrets/SecretReference'

export const MCP_TARGETS = [
  'claude-personal',
  'claude-secondary',
  'codex',
  'gemini',
] as const

export type McpTarget = (typeof MCP_TARGETS)[number]

export type McpValue = string | SecretReference

export type McpOverride = {
  args_append?: string[]
}

export type McpServer = {
  targets: McpTarget[]
  transport: 'stdio' | 'http' | 'sse'
  command?: string
  args?: McpValue[]
  url?: string
  env?: Record<string, McpValue>
  headers?: Record<string, McpValue>
  disabled?: boolean
  target_overrides?: Partial<Record<McpTarget, McpOverride>>
}

export type McpManifest = {
  servers: Record<string, McpServer>
}
```

`parseMcpManifest.ts`:

```ts
import { findCredentialLiterals } from '../../schemas/findCredentialLiterals'
import { MCP_TARGETS } from './McpManifest'
import type { McpManifest, McpServer, McpTarget } from './McpManifest'

export type ParseResult =
  { ok: true; manifest: McpManifest } | { ok: false; errors: string[] }

const isTarget = (value: unknown): value is McpTarget =>
  typeof value === 'string' &&
  (MCP_TARGETS as readonly string[]).includes(value)

export const parseMcpManifest = (raw: unknown): ParseResult => {
  const errors: string[] = []

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['manifest must be an object'] }
  }

  const servers = (raw as Record<string, unknown>)['servers']
  if (typeof servers !== 'object' || servers === null) {
    return { ok: false, errors: ['manifest.servers must be an object'] }
  }

  for (const [name, value] of Object.entries(
    servers as Record<string, unknown>,
  )) {
    if (typeof value !== 'object' || value === null) {
      errors.push(`${name}: server must be an object`)
      continue
    }

    const server = value as Record<string, unknown>
    const targets = server['targets']

    if (!Array.isArray(targets) || targets.length === 0) {
      errors.push(`${name}: targets must be a non-empty array`)
    } else {
      for (const target of targets) {
        if (!isTarget(target)) {
          errors.push(`${name}: unknown target ${String(target)}`)
        }
      }
    }

    const transport = server['transport']
    if (transport === 'stdio') {
      if (typeof server['command'] !== 'string') {
        errors.push(`${name}: stdio transport needs a command`)
      }
      if (server['url'] !== undefined) {
        errors.push(`${name}: stdio transport must not carry a url`)
      }
    } else if (transport === 'http' || transport === 'sse') {
      if (typeof server['url'] !== 'string') {
        errors.push(`${name}: ${transport} transport needs a url`)
      }
      if (server['command'] !== undefined) {
        errors.push(`${name}: ${transport} transport must not carry a command`)
      }
    } else {
      errors.push(`${name}: transport must be stdio, http or sse`)
    }

    for (const finding of findCredentialLiterals(
      server as Parameters<typeof findCredentialLiterals>[0],
    )) {
      errors.push(`${name}: ${finding}`)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, manifest: raw as McpManifest }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/PARSE_MCP_MANIFEST_TEST.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the example manifest**

`examples/machine/mcp.json` - this is what the test suite renders against, so it
must exercise every shape: stdio, http with a header reference, and a target
override.

```json
{
  "servers": {
    "serena": {
      "targets": ["claude-personal", "claude-secondary", "codex"],
      "transport": "stdio",
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server"
      ],
      "target_overrides": {
        "codex": { "args_append": ["--context", "ide-assistant"] },
        "claude-personal": { "args_append": ["--context", "claude-code"] },
        "claude-secondary": { "args_append": ["--context", "claude-code"] }
      }
    },
    "context7": {
      "targets": ["claude-personal", "claude-secondary", "codex"],
      "transport": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": { "CONTEXT7_API_KEY": { "from_env": "CONTEXT7_API_KEY" } }
    },
    "codegraph": {
      "targets": ["claude-personal", "claude-secondary", "codex"],
      "transport": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/machine/domains/mcp examples/machine/mcp.json
git commit -m "feat: parse and validate the MCP manifest"
```

---

### Task 6: The Claude JSON renderer

**Files:**

- Create: `scripts/lib/machine/renderers/claude/renderClaudeServers.ts`
- Test: `scripts/lib/machine/renderers/claude/RENDER_CLAUDE_SERVERS_TEST.ts`

**Interfaces:**

- Consumes: `McpManifest`, `McpTarget` from Task 5; `resolveReference`,
  `isSecretReference` from Task 3.
- Produces:
  `renderClaudeServers(manifest: McpManifest, target: McpTarget, env: NodeJS.ProcessEnv) => { servers: Record<string, unknown>; missing: string[] }`.

`missing` lists the environment variable names that could not be resolved.
Servers needing a missing variable are omitted from `servers` rather than
emitted with a broken value.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { renderClaudeServers } from './renderClaudeServers'
import type { McpManifest } from '../../domains/mcp/McpManifest'

const manifest: McpManifest = {
  servers: {
    serena: {
      targets: ['claude-personal', 'codex'],
      transport: 'stdio',
      command: 'uvx',
      args: ['serena', 'start-mcp-server'],
      target_overrides: {
        'claude-personal': { args_append: ['--context', 'claude-code'] },
      },
    },
    context7: {
      targets: ['claude-personal'],
      transport: 'http',
      url: 'https://mcp.context7.com/mcp',
      headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
    },
    codexOnly: { targets: ['codex'], transport: 'stdio', command: 'x' },
  },
}

void test('only servers targeting this scope are rendered', () => {
  const { servers } = renderClaudeServers(manifest, 'claude-personal', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(Object.keys(servers).sort(), ['context7', 'serena'])
})

void test('the target override is appended to args', () => {
  const { servers } = renderClaudeServers(manifest, 'claude-personal', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(servers['serena'], {
    type: 'stdio',
    command: 'uvx',
    args: ['serena', 'start-mcp-server', '--context', 'claude-code'],
  })
})

void test('a resolved header is written as a value', () => {
  const { servers } = renderClaudeServers(manifest, 'claude-personal', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(servers['context7'], {
    type: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: { CONTEXT7_API_KEY: 'k' },
  })
})

void test('a server with an unresolved secret is omitted and reported', () => {
  const { servers, missing } = renderClaudeServers(
    manifest,
    'claude-personal',
    {},
  )
  assert.equal('context7' in servers, false)
  assert.deepEqual(missing, ['CONTEXT7_API_KEY'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
`npx tsx --test scripts/lib/machine/renderers/claude/RENDER_CLAUDE_SERVERS_TEST.ts`
Expected: FAIL, cannot find module `./renderClaudeServers`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { isSecretReference } from '../../secrets/isSecretReference'
import { resolveReference } from '../../secrets/resolveReference'
import type {
  McpManifest,
  McpTarget,
  McpValue,
} from '../../domains/mcp/McpManifest'

type ResolvedMap = { values: Record<string, string>; missing: string[] }

const resolveMap = (
  source: Record<string, McpValue>,
  env: NodeJS.ProcessEnv,
): ResolvedMap => {
  const values: Record<string, string> = {}
  const missing: string[] = []

  for (const [key, value] of Object.entries(source)) {
    if (!isSecretReference(value)) {
      values[key] = value
      continue
    }

    const resolved = resolveReference(value, env)
    if (resolved.resolved) {
      values[key] = resolved.value
    } else {
      missing.push(resolved.name)
    }
  }

  return { values, missing }
}

export const renderClaudeServers = (
  manifest: McpManifest,
  target: McpTarget,
  env: NodeJS.ProcessEnv,
) => {
  const servers: Record<string, unknown> = {}
  const missing: string[] = []

  for (const [name, server] of Object.entries(manifest.servers)) {
    if (!server.targets.includes(target)) {
      continue
    }

    const envMap = resolveMap(server.env ?? {}, env)
    const headerMap = resolveMap(server.headers ?? {}, env)
    const serverMissing = [...envMap.missing, ...headerMap.missing]

    if (serverMissing.length > 0) {
      missing.push(...serverMissing)
      continue
    }

    const appended = server.target_overrides?.[target]?.args_append ?? []

    if (server.transport === 'stdio') {
      const args = [
        ...(server.args ?? []).filter(
          (a): a is string => typeof a === 'string',
        ),
        ...appended,
      ]
      servers[name] = {
        type: 'stdio',
        command: server.command,
        ...(args.length > 0 ? { args } : {}),
        ...(Object.keys(envMap.values).length > 0
          ? { env: envMap.values }
          : {}),
      }
      continue
    }

    servers[name] = {
      type: server.transport,
      url: server.url,
      ...(Object.keys(headerMap.values).length > 0
        ? { headers: headerMap.values }
        : {}),
    }
  }

  return { servers, missing }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
`npx tsx --test scripts/lib/machine/renderers/claude/RENDER_CLAUDE_SERVERS_TEST.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/renderers/claude
git commit -m "feat: render MCP servers into the Claude config shape"
```

---

### Task 7: The Codex TOML renderer

There is no TOML dependency and there will not be one. The renderer emits the
narrow shape Codex needs: one `[mcp_servers.<name>]` table per server, with
string values and string arrays.

**Files:**

- Create: `scripts/lib/machine/renderers/codex/escapeTomlString.ts`
- Create: `scripts/lib/machine/renderers/codex/renderCodexServers.ts`
- Test: `scripts/lib/machine/renderers/codex/RENDER_CODEX_SERVERS_TEST.ts`

**Interfaces:**

- Consumes: the same manifest types and secret resolution as Task 6.
- Produces: `escapeTomlString(value: string) => string`,
  `renderCodexServers(manifest, env) => { toml: string; missing: string[] }`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { escapeTomlString } from './escapeTomlString'
import { renderCodexServers } from './renderCodexServers'
import type { McpManifest } from '../../domains/mcp/McpManifest'

void test('quotes and backslashes are escaped', () => {
  assert.equal(escapeTomlString('a"b\\c'), '"a\\"b\\\\c"')
})

void test('a stdio server becomes a table with a string array', () => {
  const manifest: McpManifest = {
    servers: {
      codegraph: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'codegraph',
        args: ['serve', '--mcp'],
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.equal(
    toml.trim(),
    [
      '[mcp_servers.codegraph]',
      'command = "codegraph"',
      'args = ["serve", "--mcp"]',
    ].join('\n'),
  )
})

void test('an http server is emitted natively, not through a shell bridge', () => {
  const manifest: McpManifest = {
    servers: {
      context7: {
        targets: ['codex'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(toml, /url = "https:\/\/mcp\.context7\.com\/mcp"/)
  assert.equal(toml.includes('mcp-remote'), false)
})

void test('env values are emitted in their own sub-table', () => {
  const manifest: McpManifest = {
    servers: {
      paperclip: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'paperclip',
        env: { PAPERCLIP_API_URL: 'http://127.0.0.1:3100' },
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(
    toml,
    /\[mcp_servers\.paperclip\.env\]\nPAPERCLIP_API_URL = "http:\/\/127\.0\.0\.1:3100"/,
  )
})

void test('servers not targeting codex are skipped', () => {
  const manifest: McpManifest = {
    servers: {
      onlyClaude: {
        targets: ['claude-personal'],
        transport: 'stdio',
        command: 'x',
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.equal(toml.trim(), '')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
`npx tsx --test scripts/lib/machine/renderers/codex/RENDER_CODEX_SERVERS_TEST.ts`
Expected: FAIL, cannot find module `./escapeTomlString`.

- [ ] **Step 3: Write minimal implementation**

`escapeTomlString.ts`:

```ts
export const escapeTomlString = (value: string) =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
```

`renderCodexServers.ts`:

```ts
import { isSecretReference } from '../../secrets/isSecretReference'
import { resolveReference } from '../../secrets/resolveReference'
import { escapeTomlString } from './escapeTomlString'
import type { McpManifest, McpValue } from '../../domains/mcp/McpManifest'

const resolveOne = (value: McpValue, env: NodeJS.ProcessEnv) => {
  if (!isSecretReference(value)) {
    return { value, missing: [] as string[] }
  }

  const resolved = resolveReference(value, env)
  return resolved.resolved
    ? { value: resolved.value, missing: [] as string[] }
    : { value: undefined, missing: [resolved.name] }
}

export const renderCodexServers = (
  manifest: McpManifest,
  env: NodeJS.ProcessEnv,
) => {
  const blocks: string[] = []
  const missing: string[] = []

  for (const [name, server] of Object.entries(manifest.servers)) {
    if (!server.targets.includes('codex')) {
      continue
    }

    const envEntries: string[] = []
    let serverMissing = false

    for (const [key, value] of Object.entries(server.env ?? {})) {
      const resolved = resolveOne(value, env)
      if (resolved.value === undefined) {
        missing.push(...resolved.missing)
        serverMissing = true
        continue
      }
      envEntries.push(`${key} = ${escapeTomlString(resolved.value)}`)
    }

    if (serverMissing) {
      continue
    }

    const lines = [`[mcp_servers.${name}]`]

    if (server.transport === 'stdio') {
      lines.push(`command = ${escapeTomlString(server.command ?? '')}`)
      const appended = server.target_overrides?.['codex']?.args_append ?? []
      const args = [
        ...(server.args ?? []).filter(
          (a): a is string => typeof a === 'string',
        ),
        ...appended,
      ]
      if (args.length > 0) {
        lines.push(`args = [${args.map(escapeTomlString).join(', ')}]`)
      }
    } else {
      lines.push(`url = ${escapeTomlString(server.url ?? '')}`)
    }

    if (envEntries.length > 0) {
      lines.push('', `[mcp_servers.${name}.env]`, ...envEntries)
    }

    blocks.push(lines.join('\n'))
  }

  return { toml: blocks.join('\n\n'), missing }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
`npx tsx --test scripts/lib/machine/renderers/codex/RENDER_CODEX_SERVERS_TEST.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/renderers/codex
git commit -m "feat: render MCP servers into native Codex TOML tables"
```

---

### Task 8: Reading the live machine

**Files:**

- Create: `scripts/lib/machine/domains/mcp/readClaudeServers.ts`
- Create: `scripts/lib/machine/domains/mcp/readCodexServers.ts`
- Create: `scripts/lib/machine/domains/mcp/read.ts`
- Test: `scripts/lib/machine/domains/mcp/READ_TEST.ts`

**Interfaces:**

- Consumes: `McpTarget` from Task 5.
- Produces:
  `readClaudeServers(configPath: string) => Promise<Record<string, unknown>>`,
  `readCodexServers(configPath: string) => Promise<Record<string, Record<string, string>>>`,
  `read(paths: Record<McpTarget, string>) => Promise<McpState>` where
  `McpState = { byTarget: Record<McpTarget, Record<string, unknown>> }`.

A missing or unparseable file reads as an empty record rather than throwing. The
Antigravity config on the reference machine is zero bytes; that must read as "no
servers", not as a crash.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readClaudeServers } from './readClaudeServers'
import { readCodexServers } from './readCodexServers'

const tempFile = async (name: string, contents: string) => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-read-'))
  const path = join(dir, name)
  await writeFile(path, contents)
  return path
}

void test('claude servers are read from mcpServers', async () => {
  const path = await tempFile(
    '.claude.json',
    JSON.stringify({ mcpServers: { a: { type: 'stdio' } } }),
  )
  assert.deepEqual(await readClaudeServers(path), { a: { type: 'stdio' } })
})

void test('a missing claude config reads as empty', async () => {
  assert.deepEqual(await readClaudeServers('/nonexistent/path.json'), {})
})

void test('a zero-byte config reads as empty instead of throwing', async () => {
  const path = await tempFile('mcp_config.json', '')
  assert.deepEqual(await readClaudeServers(path), {})
})

void test('codex tables are read into a record', async () => {
  const path = await tempFile(
    'config.toml',
    [
      'model = "gpt-5.6"',
      '',
      '[mcp_servers.codegraph]',
      'command = "codegraph"',
      'args = ["serve", "--mcp"]',
      '',
      '[mcp_servers.codegraph.env]',
      'FOO = "bar"',
      '',
      '[other_section]',
      'key = "value"',
    ].join('\n'),
  )
  const servers = await readCodexServers(path)
  assert.deepEqual(Object.keys(servers), ['codegraph'])
  assert.equal(servers['codegraph']?.['command'], '"codegraph"')
})

void test('sections after mcp_servers do not leak into the last server', async () => {
  const path = await tempFile(
    'config.toml',
    [
      '[mcp_servers.a]',
      'command = "a"',
      '',
      '[sandbox]',
      'mode = "workspace-write"',
    ].join('\n'),
  )
  const servers = await readCodexServers(path)
  assert.equal(servers['a']?.['mode'], undefined)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/READ_TEST.ts` Expected:
FAIL, cannot find module `./readClaudeServers`.

- [ ] **Step 3: Write minimal implementation**

`readClaudeServers.ts`:

```ts
import { promises as fs } from 'node:fs'

export const readClaudeServers = async (configPath: string) => {
  let contents: string
  try {
    contents = await fs.readFile(configPath, 'utf8')
  } catch {
    return {}
  }

  if (contents.trim() === '') {
    return {}
  }

  try {
    const parsed = JSON.parse(contents) as Record<string, unknown>
    const servers = parsed['mcpServers']
    if (typeof servers !== 'object' || servers === null) {
      return {}
    }
    return servers as Record<string, unknown>
  } catch {
    return {}
  }
}
```

`readCodexServers.ts`:

```ts
import { promises as fs } from 'node:fs'

const SECTION = /^\[mcp_servers\.([^\].]+)(?:\.([^\]]+))?\]$/
const KEY_VALUE = /^\s*([A-Za-z0-9_-]+)\s*=\s*(.+?)\s*$/

export const readCodexServers = async (configPath: string) => {
  let contents: string
  try {
    contents = await fs.readFile(configPath, 'utf8')
  } catch {
    return {}
  }

  const servers: Record<string, Record<string, string>> = {}
  let current: string | undefined

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('[')) {
      const match = SECTION.exec(trimmed)
      current = match?.[1]
      if (current && !servers[current]) {
        servers[current] = {}
      }
      continue
    }

    if (!current) {
      continue
    }

    const kv = KEY_VALUE.exec(trimmed)
    const target = servers[current]
    if (kv?.[1] && kv[2] !== undefined && target) {
      target[kv[1]] = kv[2]
    }
  }

  return servers
}
```

`read.ts`:

```ts
import { readClaudeServers } from './readClaudeServers'
import { readCodexServers } from './readCodexServers'
import type { McpTarget } from './McpManifest'

export type McpState = {
  byTarget: Record<McpTarget, Record<string, unknown>>
}

export const read = async (
  paths: Record<McpTarget, string>,
): Promise<McpState> => ({
  byTarget: {
    'claude-personal': await readClaudeServers(paths['claude-personal']),
    'claude-secondary': await readClaudeServers(paths['claude-secondary']),
    codex: await readCodexServers(paths.codex),
    gemini: await readClaudeServers(paths.gemini),
  },
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/READ_TEST.ts` Expected:
PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/domains/mcp
git commit -m "feat: read MCP servers from every live agent config"
```

---

### Task 9: The pure plan step

**Files:**

- Create: `scripts/lib/machine/domains/mcp/McpChange.ts`
- Create: `scripts/lib/machine/domains/mcp/plan.ts`
- Test: `scripts/lib/machine/domains/mcp/PLAN_TEST.ts`

**Interfaces:**

- Consumes: `McpManifest`, `McpTarget`, `McpState`, `renderClaudeServers`,
  `renderCodexServers`, and `readOwned` output shape from Task 10 - to avoid a
  cycle, `plan` takes owned names as a plain `Record<McpTarget, string[]>`
  argument rather than importing the ownership module.
- Produces: type
  `McpChange = { target: McpTarget; name: string; operation: "add" | "update" | "remove" }`,
  `plan(input: { manifest: McpManifest; state: McpState; owned: Record<McpTarget, string[]>; env: NodeJS.ProcessEnv }) => McpChange[]`.

The rule that makes repeated applies safe: a server present on the machine but
absent from the manifest is removed **only if this engine owns it**. Foreign
servers are left alone.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { plan } from './plan'
import type { McpManifest } from './McpManifest'
import type { McpState } from './read'

const emptyOwned = {
  'claude-personal': [],
  'claude-secondary': [],
  codex: [],
  gemini: [],
}
const emptyState: McpState = {
  byTarget: {
    'claude-personal': {},
    'claude-secondary': {},
    codex: {},
    gemini: {},
  },
}

const manifest: McpManifest = {
  servers: {
    serena: {
      targets: ['claude-personal'],
      transport: 'stdio',
      command: 'uvx',
    },
  },
}

void test('a server missing from the machine is added', () => {
  const changes = plan({
    manifest,
    state: emptyState,
    owned: emptyOwned,
    env: {},
  })
  assert.deepEqual(changes, [
    { target: 'claude-personal', name: 'serena', operation: 'add' },
  ])
})

void test('an identical server produces no change', () => {
  const state: McpState = {
    byTarget: {
      'claude-personal': { serena: { type: 'stdio', command: 'uvx' } },
      'claude-secondary': {},
      codex: {},
      gemini: {},
    },
  }
  const changes = plan({
    manifest,
    state,
    owned: { ...emptyOwned, 'claude-personal': ['serena'] },
    env: {},
  })
  assert.deepEqual(changes, [])
})

void test('a differing server is updated', () => {
  const state: McpState = {
    byTarget: {
      'claude-personal': { serena: { type: 'stdio', command: 'old-command' } },
      'claude-secondary': {},
      codex: {},
      gemini: {},
    },
  }
  const changes = plan({
    manifest,
    state,
    owned: { ...emptyOwned, 'claude-personal': ['serena'] },
    env: {},
  })
  assert.deepEqual(changes, [
    { target: 'claude-personal', name: 'serena', operation: 'update' },
  ])
})

void test('an owned server dropped from the manifest is removed', () => {
  const state: McpState = {
    byTarget: {
      'claude-personal': {
        serena: { type: 'stdio', command: 'uvx' },
        stale: { type: 'stdio' },
      },
      'claude-secondary': {},
      codex: {},
      gemini: {},
    },
  }
  const owned = { ...emptyOwned, 'claude-personal': ['serena', 'stale'] }
  const changes = plan({ manifest, state, owned, env: {} })
  assert.deepEqual(changes, [
    { target: 'claude-personal', name: 'stale', operation: 'remove' },
  ])
})

void test('a foreign server is never removed', () => {
  const state: McpState = {
    byTarget: {
      'claude-personal': {
        serena: { type: 'stdio', command: 'uvx' },
        someoneElse: { type: 'stdio' },
      },
      'claude-secondary': {},
      codex: {},
      gemini: {},
    },
  }
  const owned = { ...emptyOwned, 'claude-personal': ['serena'] }
  const changes = plan({ manifest, state, owned, env: {} })
  assert.deepEqual(changes, [])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/PLAN_TEST.ts` Expected:
FAIL, cannot find module `./plan`.

- [ ] **Step 3: Write minimal implementation**

`McpChange.ts`:

```ts
import type { McpTarget } from './McpManifest'

export type McpChange = {
  target: McpTarget
  name: string
  operation: 'add' | 'update' | 'remove'
}
```

`plan.ts`:

```ts
import { renderClaudeServers } from '../../renderers/claude/renderClaudeServers'
import { MCP_TARGETS } from './McpManifest'
import type { McpChange } from './McpChange'
import type { McpManifest, McpTarget } from './McpManifest'
import type { McpState } from './read'

type PlanInput = {
  manifest: McpManifest
  state: McpState
  owned: Record<McpTarget, string[]>
  env: NodeJS.ProcessEnv
}

const sameShape = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right)

export const plan = ({ manifest, state, owned, env }: PlanInput) => {
  const changes: McpChange[] = []

  for (const target of MCP_TARGETS) {
    const desired = renderClaudeServers(manifest, target, env).servers
    const actual = state.byTarget[target]
    const ownedHere = owned[target]

    for (const [name, value] of Object.entries(desired)) {
      const existing = actual[name]
      if (existing === undefined) {
        changes.push({ target, name, operation: 'add' })
        continue
      }
      if (!sameShape(existing, value)) {
        changes.push({ target, name, operation: 'update' })
      }
    }

    for (const name of Object.keys(actual)) {
      if (name in desired) {
        continue
      }
      if (ownedHere.includes(name)) {
        changes.push({ target, name, operation: 'remove' })
      }
    }
  }

  return changes
}
```

Note: `plan` compares against the Claude-shaped render for every target,
including Codex. That is deliberate for the diff - the comparison is over
normalized intent, not over serialized output. Codex serialization is the
renderer's job and is covered by Task 7's golden tests.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/PLAN_TEST.ts` Expected:
PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/domains/mcp
git commit -m "feat: plan MCP changes without touching the machine"
```

---

### Task 10: Ownership sidecar

**Files:**

- Create: `scripts/lib/machine/ownership/OwnedRecord.ts`
- Create: `scripts/lib/machine/ownership/readOwned.ts`
- Create: `scripts/lib/machine/ownership/writeOwned.ts`
- Test: `scripts/lib/machine/ownership/OWNED_TEST.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: type `OwnedRecord = Record<string, Record<string, string[]>>` keyed
  by domain then by target, `readOwned(path: string) => Promise<OwnedRecord>`,
  `writeOwned(path: string, record: OwnedRecord) => Promise<void>`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readOwned } from './readOwned'
import { writeOwned } from './writeOwned'

void test('a missing sidecar reads as an empty record', async () => {
  assert.deepEqual(await readOwned('/nonexistent/owned.json'), {})
})

void test('a written record round-trips', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-owned-'))
  const path = join(dir, 'owned.json')
  const record = { mcp: { 'claude-personal': ['serena', 'context7'] } }
  await writeOwned(path, record)
  assert.deepEqual(await readOwned(path), record)
})

void test('writing creates the parent directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-owned-'))
  const path = join(dir, 'nested', 'deeper', 'owned.json')
  await writeOwned(path, { mcp: { codex: ['a'] } })
  assert.deepEqual(await readOwned(path), { mcp: { codex: ['a'] } })
})

void test('a corrupt sidecar reads as empty rather than throwing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-owned-'))
  const path = join(dir, 'owned.json')
  await writeOwned(path, { mcp: { codex: ['a'] } })
  const { promises: fs } = await import('node:fs')
  await fs.writeFile(path, '{ not json')
  assert.deepEqual(await readOwned(path), {})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/ownership/OWNED_TEST.ts` Expected:
FAIL, cannot find module `./readOwned`.

- [ ] **Step 3: Write minimal implementation**

`OwnedRecord.ts`:

```ts
export type OwnedRecord = Record<string, Record<string, string[]>>
```

`readOwned.ts`:

```ts
import { promises as fs } from 'node:fs'
import type { OwnedRecord } from './OwnedRecord'

export const readOwned = async (path: string): Promise<OwnedRecord> => {
  try {
    const contents = await fs.readFile(path, 'utf8')
    return JSON.parse(contents) as OwnedRecord
  } catch {
    return {}
  }
}
```

`writeOwned.ts`:

```ts
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import type { OwnedRecord } from './OwnedRecord'

export const writeOwned = async (path: string, record: OwnedRecord) => {
  await fs.mkdir(dirname(path), { recursive: true })
  await fs.writeFile(path, `${JSON.stringify(record, null, 2)}\n`)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/ownership/OWNED_TEST.ts` Expected:
PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/ownership
git commit -m "feat: track which config keys the engine owns"
```

---

### Task 11: Run directories and snapshots

**Files:**

- Create: `scripts/lib/machine/runs/createRunId.ts`
- Create: `scripts/lib/machine/runs/createSnapshot.ts`
- Create: `scripts/lib/machine/runs/restoreSnapshot.ts`
- Create: `scripts/lib/machine/runs/listRuns.ts`
- Test: `scripts/lib/machine/runs/SNAPSHOT_TEST.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `createRunId(now: Date, random: () => number) => string`,
  `createSnapshot(input: { runDir: string; files: string[] }) => Promise<void>`,
  `restoreSnapshot(input: { runDir: string }) => Promise<string[]>` returning
  restored paths,
  `listRuns(rootDir: string) => Promise<{ runId: string; complete: boolean }[]>`.

A run directory holds `files/<encoded-path>` for each snapshotted file, a
`manifest.json` mapping encoded names back to absolute paths, and a `complete`
marker written only when the run finishes. A run without the marker was
interrupted and is still a valid rollback target.

`createRunId` takes `now` and `random` as arguments so tests are deterministic.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRunId } from './createRunId'
import { createSnapshot } from './createSnapshot'
import { restoreSnapshot } from './restoreSnapshot'
import { listRuns } from './listRuns'

void test('a run id is sortable and unique per call', () => {
  const id = createRunId(new Date('2026-08-17T22:04:05.000Z'), () => 0.5)
  assert.match(id, /^2026-08-17T22-04-05-[a-z0-9]+$/)
})

void test('a snapshot restores the original bytes', async () => {
  const work = await mkdtemp(join(tmpdir(), 'machine-run-'))
  const target = join(work, 'config.json')
  await writeFile(target, '{"before":true}')

  const runDir = join(work, 'runs', 'r1')
  await createSnapshot({ runDir, files: [target] })

  await writeFile(target, '{"after":true}')
  const restored = await restoreSnapshot({ runDir })

  assert.deepEqual(restored, [target])
  assert.equal(await readFile(target, 'utf8'), '{"before":true}')
})

void test('a file that did not exist is recorded and removed on restore', async () => {
  const work = await mkdtemp(join(tmpdir(), 'machine-run-'))
  const target = join(work, 'created-later.json')
  const runDir = join(work, 'runs', 'r1')

  await createSnapshot({ runDir, files: [target] })
  await writeFile(target, '{}')
  await restoreSnapshot({ runDir })

  await assert.rejects(readFile(target, 'utf8'))
})

void test('an interrupted run has no complete marker', async () => {
  const work = await mkdtemp(join(tmpdir(), 'machine-runs-'))
  await mkdir(join(work, '2026-08-17T22-04-05-abc'), { recursive: true })
  const runs = await listRuns(work)
  assert.deepEqual(runs, [
    { runId: '2026-08-17T22-04-05-abc', complete: false },
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/runs/SNAPSHOT_TEST.ts` Expected: FAIL,
cannot find module `./createRunId`.

- [ ] **Step 3: Write minimal implementation**

`createRunId.ts`:

```ts
export const createRunId = (now: Date, random: () => number) => {
  const stamp = now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace(/-\d{3}Z$/, '')
  const suffix = Math.floor(random() * 1e6).toString(36)
  return `${stamp}-${suffix}`
}
```

`createSnapshot.ts`:

```ts
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

type SnapshotEntry = { encoded: string; path: string; existed: boolean }

export const createSnapshot = async ({
  runDir,
  files,
}: {
  runDir: string
  files: string[]
}) => {
  await fs.mkdir(join(runDir, 'files'), { recursive: true })
  const entries: SnapshotEntry[] = []

  for (const [index, path] of files.entries()) {
    const encoded = `${index}-${path.replaceAll('/', '_')}`
    try {
      const contents = await fs.readFile(path)
      await fs.writeFile(join(runDir, 'files', encoded), contents)
      entries.push({ encoded, path, existed: true })
    } catch {
      entries.push({ encoded, path, existed: false })
    }
  }

  await fs.writeFile(
    join(runDir, 'manifest.json'),
    `${JSON.stringify(entries, null, 2)}\n`,
  )
}
```

`restoreSnapshot.ts`:

```ts
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

type SnapshotEntry = { encoded: string; path: string; existed: boolean }

export const restoreSnapshot = async ({ runDir }: { runDir: string }) => {
  const raw = await fs.readFile(join(runDir, 'manifest.json'), 'utf8')
  const entries = JSON.parse(raw) as SnapshotEntry[]
  const restored: string[] = []

  for (const entry of entries) {
    if (entry.existed) {
      const contents = await fs.readFile(join(runDir, 'files', entry.encoded))
      await fs.mkdir(join(entry.path, '..'), { recursive: true })
      await fs.writeFile(entry.path, contents)
    } else {
      await fs.rm(entry.path, { force: true })
    }
    restored.push(entry.path)
  }

  return restored
}
```

`listRuns.ts`:

```ts
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listRuns = async (rootDir: string) => {
  let names: string[]
  try {
    names = await fs.readdir(rootDir)
  } catch {
    return []
  }

  const runs = []
  for (const runId of names.sort()) {
    const complete = await fs
      .access(join(rootDir, runId, 'complete'))
      .then(() => true)
      .catch(() => false)
    runs.push({ runId, complete })
  }

  return runs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/runs/SNAPSHOT_TEST.ts` Expected: PASS,
4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/runs
git commit -m "feat: snapshot files before a run and restore them on rollback"
```

---

### Task 12: Applying MCP changes

**Files:**

- Create: `scripts/lib/machine/domains/mcp/writeClaudeConfig.ts`
- Create: `scripts/lib/machine/domains/mcp/apply.ts`
- Test: `scripts/lib/machine/domains/mcp/APPLY_TEST.ts`

**Interfaces:**

- Consumes: `renderClaudeServers` (Task 6), `readClaudeServers` (Task 8),
  `McpManifest` (Task 5).
- Produces:
  `writeClaudeConfig(input: { path: string; servers: Record<string, unknown>; ownedNames: string[] }) => Promise<string[]>`
  returning the names now owned, and
  `apply(input: { manifest: McpManifest; paths: Record<McpTarget, string>; owned: Record<McpTarget, string[]>; env: NodeJS.ProcessEnv }) => Promise<{ owned: Record<McpTarget, string[]>; missing: string[] }>`.

The merge rule, which is the whole point: read the existing file, keep every key
that is not `mcpServers`, and inside `mcpServers` keep every server this engine
does not own. Then write the desired servers over it.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeClaudeConfig } from './writeClaudeConfig'

const configWith = async (contents: unknown) => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-apply-'))
  const path = join(dir, '.claude.json')
  await writeFile(path, JSON.stringify(contents, null, 2))
  return path
}

void test('keys outside mcpServers survive the write', async () => {
  const path = await configWith({ theme: 'dark', mcpServers: {} })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })
  const written = JSON.parse(await readFile(path, 'utf8')) as Record<
    string,
    unknown
  >
  assert.equal(written['theme'], 'dark')
})

void test('a foreign server is preserved', async () => {
  const path = await configWith({ mcpServers: { foreign: { type: 'stdio' } } })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })
  const written = JSON.parse(await readFile(path, 'utf8')) as {
    mcpServers: Record<string, unknown>
  }
  assert.deepEqual(Object.keys(written.mcpServers).sort(), ['a', 'foreign'])
})

void test('a previously owned server that is no longer desired is removed', async () => {
  const path = await configWith({
    mcpServers: { stale: { type: 'stdio' }, foreign: { type: 'stdio' } },
  })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: ['stale'],
  })
  const written = JSON.parse(await readFile(path, 'utf8')) as {
    mcpServers: Record<string, unknown>
  }
  assert.deepEqual(Object.keys(written.mcpServers).sort(), ['a', 'foreign'])
})

void test('the returned ownership list is the servers just written', async () => {
  const path = await configWith({ mcpServers: {} })
  const owned = await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' }, b: { type: 'stdio' } },
    ownedNames: [],
  })
  assert.deepEqual(owned.sort(), ['a', 'b'])
})

void test('writing twice leaves an identical file', async () => {
  const path = await configWith({ mcpServers: {} })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })
  const first = await readFile(path, 'utf8')
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: ['a'],
  })
  assert.equal(await readFile(path, 'utf8'), first)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/APPLY_TEST.ts` Expected:
FAIL, cannot find module `./writeClaudeConfig`.

- [ ] **Step 3: Write minimal implementation**

`writeClaudeConfig.ts`:

```ts
import { promises as fs } from 'node:fs'

type WriteInput = {
  path: string
  servers: Record<string, unknown>
  ownedNames: string[]
}

export const writeClaudeConfig = async ({
  path,
  servers,
  ownedNames,
}: WriteInput) => {
  let existing: Record<string, unknown> = {}
  try {
    const contents = await fs.readFile(path, 'utf8')
    if (contents.trim() !== '') {
      existing = JSON.parse(contents) as Record<string, unknown>
    }
  } catch {
    existing = {}
  }

  const currentServers = (existing['mcpServers'] ?? {}) as Record<
    string,
    unknown
  >
  const preserved: Record<string, unknown> = {}

  for (const [name, value] of Object.entries(currentServers)) {
    if (!ownedNames.includes(name)) {
      preserved[name] = value
    }
  }

  const merged = { ...existing, mcpServers: { ...preserved, ...servers } }
  await fs.writeFile(path, `${JSON.stringify(merged, null, 2)}\n`)

  return Object.keys(servers)
}
```

`apply.ts`:

```ts
import { renderClaudeServers } from '../../renderers/claude/renderClaudeServers'
import { MCP_TARGETS } from './McpManifest'
import { writeClaudeConfig } from './writeClaudeConfig'
import type { McpManifest, McpTarget } from './McpManifest'

type ApplyInput = {
  manifest: McpManifest
  paths: Record<McpTarget, string>
  owned: Record<McpTarget, string[]>
  env: NodeJS.ProcessEnv
}

export const apply = async ({ manifest, paths, owned, env }: ApplyInput) => {
  const nextOwned: Record<string, string[]> = {}
  const missing: string[] = []

  for (const target of MCP_TARGETS) {
    if (target === 'codex') {
      nextOwned[target] = owned[target]
      continue
    }

    const rendered = renderClaudeServers(manifest, target, env)
    missing.push(...rendered.missing)
    nextOwned[target] = await writeClaudeConfig({
      path: paths[target],
      servers: rendered.servers,
      ownedNames: owned[target],
    })
  }

  return { owned: nextOwned as Record<McpTarget, string[]>, missing }
}
```

Codex is deliberately skipped in `apply` for now: its config is TOML and merging
into a hand-written TOML file safely needs the writer from the next task. The
`nextOwned` entry is carried through unchanged so ownership is not lost.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/APPLY_TEST.ts` Expected:
PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/machine/domains/mcp
git commit -m "feat: merge MCP servers into agent configs without dropping foreign keys"
```

---

### Task 13: Merging into the Codex TOML file

**Files:**

- Create: `scripts/lib/machine/domains/mcp/writeCodexConfig.ts`
- Modify: `scripts/lib/machine/domains/mcp/apply.ts` - replace the `continue`
  branch for codex
- Test: `scripts/lib/machine/domains/mcp/WRITE_CODEX_CONFIG_TEST.ts`

**Interfaces:**

- Consumes: `renderCodexServers` from Task 7.
- Produces:
  `writeCodexConfig(input: { path: string; toml: string; ownedNames: string[]; renderedNames: string[] }) => Promise<string[]>`.

The file is edited by line surgery, not reparsed and re-emitted: everything
outside `[mcp_servers.*]` blocks is preserved byte for byte, owned blocks are
dropped, foreign blocks stay, and the rendered TOML is appended.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeCodexConfig } from './writeCodexConfig'

const configWith = async (contents: string) => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-codex-'))
  const path = join(dir, 'config.toml')
  await writeFile(path, contents)
  return path
}

void test('settings outside mcp_servers are preserved byte for byte', async () => {
  const path = await configWith(
    ['model = "gpt-5.6-sol"', 'model_reasoning_effort = "high"', ''].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "a"',
    ownedNames: [],
    renderedNames: ['a'],
  })
  const written = await readFile(path, 'utf8')
  assert.match(written, /model = "gpt-5\.6-sol"/)
  assert.match(written, /model_reasoning_effort = "high"/)
})

void test('a foreign server block survives', async () => {
  const path = await configWith(
    ['[mcp_servers.foreign]', 'command = "keep-me"', ''].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "a"',
    ownedNames: [],
    renderedNames: ['a'],
  })
  const written = await readFile(path, 'utf8')
  assert.match(written, /\[mcp_servers\.foreign\]/)
  assert.match(written, /command = "keep-me"/)
})

void test('an owned block is replaced rather than duplicated', async () => {
  const path = await configWith(
    ['[mcp_servers.a]', 'command = "old"', ''].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "new"',
    ownedNames: ['a'],
    renderedNames: ['a'],
  })
  const written = await readFile(path, 'utf8')
  assert.equal(written.match(/\[mcp_servers\.a\]/g)?.length, 1)
  assert.match(written, /command = "new"/)
  assert.equal(written.includes('command = "old"'), false)
})

void test('an owned sub-table is removed with its parent', async () => {
  const path = await configWith(
    [
      '[mcp_servers.a]',
      'command = "old"',
      '',
      '[mcp_servers.a.env]',
      'K = "v"',
      '',
      '[sandbox]',
      'mode = "x"',
    ].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "new"',
    ownedNames: ['a'],
    renderedNames: ['a'],
  })
  const written = await readFile(path, 'utf8')
  assert.equal(written.includes('K = "v"'), false)
  assert.match(written, /\[sandbox\]/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/WRITE_CODEX_CONFIG_TEST.ts`
Expected: FAIL, cannot find module `./writeCodexConfig`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { promises as fs } from 'node:fs'

type WriteInput = {
  path: string
  toml: string
  ownedNames: string[]
  renderedNames: string[]
}

const SECTION = /^\[mcp_servers\.([^\].]+)(?:\.[^\]]+)?\]$/

export const writeCodexConfig = async ({
  path,
  toml,
  ownedNames,
  renderedNames,
}: WriteInput) => {
  let contents = ''
  try {
    contents = await fs.readFile(path, 'utf8')
  } catch {
    contents = ''
  }

  const drop = new Set([...ownedNames, ...renderedNames])
  const kept: string[] = []
  let dropping = false

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('[')) {
      const match = SECTION.exec(trimmed)
      dropping = match?.[1] !== undefined && drop.has(match[1])
    }

    if (!dropping) {
      kept.push(line)
    }
  }

  const body = kept
    .join('\n')
    .replace(/\n{3,}$/, '\n\n')
    .trimEnd()
  const next = toml.trim() === '' ? `${body}\n` : `${body}\n\n${toml.trim()}\n`
  await fs.writeFile(path, next)

  return renderedNames
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/WRITE_CODEX_CONFIG_TEST.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Wire Codex into apply**

In `apply.ts`, replace the codex `continue` branch with a call to
`renderCodexServers` plus `writeCodexConfig`, passing `renderedNames` as the
servers whose `targets` include `codex`.

- [ ] **Step 6: Run the whole MCP domain suite**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/*_TEST.ts` Expected: PASS,
all tests.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/machine/domains/mcp
git commit -m "feat: merge MCP servers into the Codex TOML config by line surgery"
```

---

### Task 14: The idempotency test

This is the requirement the spec makes non-negotiable for an agent operator:
apply, then apply again, and the second run must report everything converged
with zero changes.

**Files:**

- Create: `scripts/lib/machine/domains/mcp/IDEMPOTENCY_TEST.ts`

**Interfaces:**

- Consumes: `apply` (Tasks 12-13), `read` (Task 8), `plan` (Task 9), the example
  manifest (Task 5).

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from './apply'
import { parseMcpManifest } from './parseMcpManifest'
import { plan } from './plan'
import { read } from './read'
import type { McpTarget } from './McpManifest'

const setup = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-idem-'))
  const paths: Record<McpTarget, string> = {
    'claude-personal': join(dir, 'claude.json'),
    'claude-secondary': join(dir, 'secondary.json'),
    codex: join(dir, 'config.toml'),
    gemini: join(dir, 'gemini.json'),
  }
  await writeFile(
    paths['claude-personal'],
    JSON.stringify({ theme: 'dark', mcpServers: {} }),
  )
  await writeFile(paths['claude-secondary'], '{}')
  await writeFile(paths.codex, 'model = "gpt-5.6-sol"\n')
  await writeFile(paths.gemini, '')
  return { paths }
}

void test('a second apply changes nothing', async () => {
  const { paths } = await setup()
  const raw = JSON.parse(
    await readFile('examples/machine/mcp.json', 'utf8'),
  ) as unknown
  const parsed = parseMcpManifest(raw)
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return

  const env = { CONTEXT7_API_KEY: 'test-key' }
  const empty = {
    'claude-personal': [],
    'claude-secondary': [],
    codex: [],
    gemini: [],
  }

  const first = await apply({
    manifest: parsed.manifest,
    paths,
    owned: empty,
    env,
  })
  const afterFirst = await readFile(paths['claude-personal'], 'utf8')

  const second = await apply({
    manifest: parsed.manifest,
    paths,
    owned: first.owned,
    env,
  })
  assert.equal(await readFile(paths['claude-personal'], 'utf8'), afterFirst)

  const state = await read(paths)
  const changes = plan({
    manifest: parsed.manifest,
    state,
    owned: second.owned,
    env,
  })
  assert.deepEqual(changes, [])
})

void test('a foreign key added between runs is not disturbed', async () => {
  const { paths } = await setup()
  const raw = JSON.parse(
    await readFile('examples/machine/mcp.json', 'utf8'),
  ) as unknown
  const parsed = parseMcpManifest(raw)
  if (!parsed.ok) throw new Error('example manifest must be valid')

  const env = { CONTEXT7_API_KEY: 'test-key' }
  const empty = {
    'claude-personal': [],
    'claude-secondary': [],
    codex: [],
    gemini: [],
  }
  const first = await apply({
    manifest: parsed.manifest,
    paths,
    owned: empty,
    env,
  })

  const config = JSON.parse(
    await readFile(paths['claude-personal'], 'utf8'),
  ) as Record<string, unknown>
  const servers = config['mcpServers'] as Record<string, unknown>
  servers['injectedByAnotherTool'] = { type: 'stdio', command: 'x' }
  await writeFile(paths['claude-personal'], JSON.stringify(config, null, 2))

  await apply({ manifest: parsed.manifest, paths, owned: first.owned, env })

  const after = JSON.parse(
    await readFile(paths['claude-personal'], 'utf8'),
  ) as {
    mcpServers: Record<string, unknown>
  }
  assert.equal('injectedByAnotherTool' in after.mcpServers, true)
})
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npx tsx --test scripts/lib/machine/domains/mcp/IDEMPOTENCY_TEST.ts`
Expected: PASS if Tasks 12 and 13 are correct. If the second apply differs, the
bug is real and is in the merge: most likely key ordering in
`writeClaudeConfig`, since `{ ...preserved, ...servers }` reorders when a server
moves between the two groups. Fix by sorting the merged keys before writing.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/machine/domains/mcp/IDEMPOTENCY_TEST.ts
git commit -m "test: prove a repeated machine apply changes nothing"
```

---

### Task 15: The diff command with JSON output

**Files:**

- Create: `scripts/lib/machine/report/formatRunReport.ts`
- Create: `scripts/commands/machineDiff.ts`
- Create: `scripts/bin/run-machine-diff.ts`
- Test: `scripts/lib/machine/report/FORMAT_RUN_REPORT_TEST.ts`

**Interfaces:**

- Consumes: `RunReport` (Task 1), `plan` (Task 9), `read` (Task 8),
  `parseMcpManifest` (Task 5), `resolveInstanceDir` (Task 2), `readOwned` (Task
  10).
- Produces: `formatRunReport(report: RunReport, asJson: boolean) => string`, and
  a `main()` in `machineDiff.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { formatRunReport } from './formatRunReport'
import type { RunReport } from '../types/RunReport'

const report: RunReport = {
  runId: '2026-08-17T22-04-05-abc',
  profile: 'full',
  domains: [
    {
      domain: 'mcp',
      status: 'changed',
      changes: 3,
      messages: ['add serena to codex'],
    },
    { domain: 'plugins', status: 'converged', changes: 0, messages: [] },
  ],
  ok: true,
}

void test('json output is a single parseable object', () => {
  const parsed = JSON.parse(formatRunReport(report, true)) as RunReport
  assert.equal(parsed.runId, '2026-08-17T22-04-05-abc')
  assert.equal(parsed.domains.length, 2)
})

void test('human output names each domain and its status', () => {
  const text = formatRunReport(report, false)
  assert.match(text, /mcp\s+changed\s+3/)
  assert.match(text, /plugins\s+converged\s+0/)
})

void test('human output carries the messages', () => {
  assert.match(formatRunReport(report, false), /add serena to codex/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/machine/report/FORMAT_RUN_REPORT_TEST.ts`
Expected: FAIL, cannot find module `./formatRunReport`.

- [ ] **Step 3: Write minimal implementation**

`formatRunReport.ts`:

```ts
import type { RunReport } from '../types/RunReport'

export const formatRunReport = (report: RunReport, asJson: boolean) => {
  if (asJson) {
    return JSON.stringify(report, null, 2)
  }

  const lines = [`run ${report.runId} profile ${report.profile}`]

  for (const domain of report.domains) {
    lines.push(
      `  ${domain.domain.padEnd(10)} ${domain.status.padEnd(12)} ${domain.changes}`,
    )
    for (const message of domain.messages) {
      lines.push(`      ${message}`)
    }
  }

  return lines.join('\n')
}
```

`machineDiff.ts` reads the manifest from the resolved instance directory, reads
the live machine, plans, and prints. Paths come from `os.homedir()`:

```ts
import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseMcpManifest } from '../lib/machine/domains/mcp/parseMcpManifest'
import { plan } from '../lib/machine/domains/mcp/plan'
import { read } from '../lib/machine/domains/mcp/read'
import { resolveInstanceDir } from '../lib/machine/instance/resolveInstanceDir'
import { formatRunReport } from '../lib/machine/report/formatRunReport'
import { readOwned } from '../lib/machine/ownership/readOwned'
import type { McpTarget } from '../lib/machine/domains/mcp/McpManifest'
import type { RunReport } from '../lib/machine/types/RunReport'

const flagValue = (name: string) => {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

export const main = async () => {
  const home = homedir()
  const instanceFlag = flagValue('--instance')
  const instanceDir = resolveInstanceDir({
    ...(instanceFlag === undefined ? {} : { flag: instanceFlag }),
    env: process.env,
    home,
  })

  const raw = JSON.parse(
    await fs.readFile(join(instanceDir, 'mcp.json'), 'utf8'),
  ) as unknown
  const parsed = parseMcpManifest(raw)

  if (!parsed.ok) {
    const report: RunReport = {
      runId: 'diff',
      profile: 'n/a',
      domains: [
        {
          domain: 'mcp',
          status: 'failed',
          changes: 0,
          messages: parsed.errors,
        },
      ],
      ok: false,
    }
    console.log(formatRunReport(report, process.argv.includes('--json')))
    process.exitCode = 1
    return
  }

  const paths: Record<McpTarget, string> = {
    'claude-personal': join(home, '.claude.json'),
    'claude-secondary': join(home, '.claude-secondary', '.claude.json'),
    codex: join(home, '.codex', 'config.toml'),
    gemini: join(home, '.gemini', 'config', 'mcp_config.json'),
  }

  const owned = await readOwned(join(home, '.agents-machine', 'owned.json'))
  const ownedMcp = (owned['mcp'] ?? {}) as Record<McpTarget, string[]>
  const changes = plan({
    manifest: parsed.manifest,
    state: await read(paths),
    owned: {
      'claude-personal': ownedMcp['claude-personal'] ?? [],
      'claude-secondary': ownedMcp['claude-secondary'] ?? [],
      codex: ownedMcp.codex ?? [],
      gemini: ownedMcp.gemini ?? [],
    },
    env: process.env,
  })

  const report: RunReport = {
    runId: 'diff',
    profile: 'full',
    domains: [
      {
        domain: 'mcp',
        status: changes.length === 0 ? 'converged' : 'changed',
        changes: changes.length,
        messages: changes.map((c) => `${c.operation} ${c.name} on ${c.target}`),
      },
    ],
    ok: true,
  }

  console.log(formatRunReport(report, process.argv.includes('--json')))
}
```

`run-machine-diff.ts`:

```ts
import { main } from '../commands/machineDiff'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/machine/report/FORMAT_RUN_REPORT_TEST.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Try it against the example instance**

Run:
`npx tsx scripts/bin/run-machine-diff.ts --instance examples/machine --json`
Expected: valid JSON naming the servers that would be added. This reads the real
home config but writes nothing.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/machine/report scripts/commands/machineDiff.ts scripts/bin/run-machine-diff.ts
git commit -m "feat: add machine diff with machine-readable output"
```

---

### Task 16: The apply and rollback commands

**Files:**

- Create: `scripts/commands/machineApply.ts`
- Create: `scripts/commands/machineRollback.ts`
- Create: `scripts/bin/run-machine-apply.ts`
- Create: `scripts/bin/run-machine-rollback.ts`
- Modify: `package.json` - add the `machine:*` scripts

**Interfaces:**

- Consumes: everything above.
- Produces: `main()` in each command.

`machineApply` must, in this order: resolve the instance, parse the manifest,
create the run directory, snapshot every target path **before** writing, apply,
write the ownership sidecar, write the `complete` marker, and print the report.
A `needs-secret` status is set when `apply` returns a non-empty `missing` list.

- [ ] **Step 1: Write the apply command**

Follow the structure of `machineDiff.ts`. The snapshot call takes every path in
`paths` plus the ownership sidecar path, and happens before the first write:

```ts
const runId = createRunId(new Date(), Math.random)
const runDir = join(home, '.agents-machine', 'runs', runId)
await createSnapshot({ runDir, files: [...Object.values(paths), ownedPath] })

const result = await apply({
  manifest: parsed.manifest,
  paths,
  owned: currentOwned,
  env: process.env,
})

await writeOwned(ownedPath, { ...owned, mcp: result.owned })
await fs.writeFile(join(runDir, 'complete'), '')
```

- [ ] **Step 2: Write the rollback command**

```ts
const runsDir = join(homedir(), '.agents-machine', 'runs')
const runs = await listRuns(runsDir)
const requested = flagValue('--to') ?? runs.at(-1)?.runId
if (!requested) {
  console.error('no runs to roll back')
  process.exitCode = 1
  return
}
const restored = await restoreSnapshot({ runDir: join(runsDir, requested) })
```

Print a `RunReport` with domain `mcp`, status `changed`, and one message per
restored path.

- [ ] **Step 3: Add the package scripts**

In `package.json`:

```json
"machine:diff": "tsx scripts/bin/run-machine-diff.ts",
"machine:apply": "tsx scripts/bin/run-machine-apply.ts",
"machine:rollback": "tsx scripts/bin/run-machine-rollback.ts"
```

- [ ] **Step 4: Prove the round trip by hand against a scratch instance**

```bash
mkdir -p /tmp/machine-demo && cp examples/machine/mcp.json /tmp/machine-demo/
npx tsx scripts/bin/run-machine-diff.ts --instance /tmp/machine-demo --json
```

Expected: JSON listing the additions. Do not run `machine:apply` against the
real home yet; the first real apply happens after Task 17 wires the tests into
`check:all` and after a human has read the diff.

- [ ] **Step 5: Commit**

```bash
git add scripts/commands/machineApply.ts scripts/commands/machineRollback.ts scripts/bin package.json
git commit -m "feat: add machine apply and rollback with per-run snapshots"
```

---

### Task 17: Wire the suite into the repository checks

**Files:**

- Modify: `package.json` - add `machine:test` and include it in `check:all`

**Interfaces:**

- Consumes: every test file created above.

- [ ] **Step 1: Add the test script**

```json
"machine:test": "tsx --test scripts/lib/machine/**/*_TEST.ts"
```

- [ ] **Step 2: Add it to check:all**

Insert `pnpm run machine:test` into the `check:all` chain, after `skills:test`.

- [ ] **Step 3: Run the full check**

Run: `pnpm run check` Expected: PASS. If `type-check` complains about
`exactOptionalPropertyTypes`, the cause is an optional property being assigned
`undefined` explicitly - omit the key instead using the
`...(condition ? { key } : {})` spread already used in `renderClaudeServers`.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: run the machine engine tests as part of the repository checks"
```

---

## Self-review notes

**Spec coverage.** Sections 3 (engine/instance split) Task 2; 4 (domain
contract) Tasks 8, 9, 12; 6 (MCP schema and invariants) Tasks 4, 5; 7 (secrets)
Tasks 3, 6; 8 (ownership) Tasks 10, 12, 13; 9 (snapshots and rollback, tier 1)
Tasks 11, 16; 13 (agent-driven output and idempotency) Tasks 14, 15; 14
(testing) throughout.

**Deliberately deferred to later plans**, each named in the spec and not
silently dropped: `verify` for MCP (section 4 - there is nothing to poll for a
config file, it matters for services); rollback tiers 2 and 3 (section 9 - they
need the services and runtime domains to exist); profiles (section 11); the
`machine-setup` skill (section 13); the remaining six domains; and the Gemini
renderer, which currently reuses the Claude JSON shape because Antigravity's
config is `mcpServers`-shaped - if that proves wrong on contact, it becomes its
own renderer exactly like Codex.

**Known sharp edge.** Task 13 edits TOML by line surgery rather than parsing.
That is safe for the narrow shape the file has today and is covered by tests for
the foreign-block and sub-table cases, but it will mishandle a multi-line array
inside an `[mcp_servers.*]` block. No such array exists in the measured config.
If one appears, the fix is to extend the block scanner to track bracket depth,
not to add a TOML dependency.
