# Skill Library Curation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the skill library four usability states with real provenance,
make the multi-IDE linker obey them, and produce the observe-and-propose half of
the learning loop from real transcripts.

**Architecture:** A declared manifest at `~/.agents/curation.json` is the
authority on what each skill is for; the linker fans out `adopted` and `forked`
only. The loop's deterministic stages - extracting real user turns, filtering
machine-written ones, counting which skills actually fired, and turning all of
that into proposals - live here as pure, tested functions. The classification
stage, which needs a model, is a delegated command configured by the user rather
than a dependency of this engine.

**Tech Stack:** TypeScript on Node (ES2024, ESM), `tsx`, `node:test` with
`node:assert/strict`, zero runtime dependencies.

**Spec:**
`docs/superpowers/specs/2026-08-18-skill-library-and-learning-loop-design.md`

## Global Constraints

- **Zero runtime dependencies.** `package.json` `dependencies` stays empty.
- **Atomic file rule, enforced by lint.** One exported unit per file; no hidden
  top-level declarations, no inline types in runtime files, constants and
  regexes each get their own file, test fixtures live outside the test that uses
  them. The machine engine was rewritten once for ignoring this - do not repeat
  it.
- Engine code under `scripts/`, never `src/`. `bin/` runners only call `main()`
  from `commands/`, which composes `lib/`.
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; omit
  optional properties rather than assigning `undefined`. No `any`, no non-null
  assertions.
- `import type` separately from value imports. Double quotes, no semicolons,
  arrow-function consts.
- Tests are `NAME_TEST.ts` beside their subject and never read `$HOME`;
  filesystem tests use `mkdtemp`.
- English in every artifact, ASCII punctuation only.
- **Curation never deletes a skill directory.** `sync-ai` rsyncs `~/.agents`
  without `--delete`, so removals reappear from another machine. State lives in
  the manifest.
- Run `pnpm run format && pnpm run lint:fix` before each commit, and
  `pnpm run check` before the last one.

---

### Task 1: Curation states and manifest types

**Files:**

- Create: `scripts/lib/library/constants/CURATION_STATES.ts`
- Create: `scripts/lib/library/types/CurationState.ts`
- Create: `scripts/lib/library/types/CurationEntry.ts`
- Create: `scripts/lib/library/types/CurationManifest.ts`
- Test: `scripts/lib/library/constants/CURATION_STATES_TEST.ts`

**Interfaces:**

- Produces: `CURATION_STATES` (readonly tuple), `CurationState`,
  `CurationEntry`, `CurationManifest`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { CURATION_STATES } from './CURATION_STATES'

void test('the four states are closed and ordered from most to least engaged', () => {
  assert.deepEqual(CURATION_STATES, [
    'adopted',
    'forked',
    'extracted',
    'parked',
  ])
})

void test('only adopted and forked are fanned out', () => {
  const fannedOut = CURATION_STATES.filter(
    (state) => state === 'adopted' || state === 'forked',
  )
  assert.deepEqual(fannedOut, ['adopted', 'forked'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/constants/CURATION_STATES_TEST.ts`
Expected: FAIL, cannot find module `./CURATION_STATES`.

- [ ] **Step 3: Write minimal implementation**

`CURATION_STATES.ts`:

```ts
export const CURATION_STATES = [
  'adopted',
  'forked',
  'extracted',
  'parked',
] as const
```

`CurationState.ts`:

```ts
import type { CURATION_STATES } from '../constants/CURATION_STATES'

export type CurationState = (typeof CURATION_STATES)[number]
```

`CurationEntry.ts`:

```ts
import type { CurationState } from './CurationState'

export interface CurationEntry {
  state: CurationState
  source?: string
  sourceUrl?: string
  skillPath?: string
  upstreamHash?: string
  licence?: string
  targets?: string[]
  triggers?: string[]
  patch?: string
  extractedInto?: string
  decidedAt?: string
  reason?: string
}
```

`CurationManifest.ts`:

```ts
import type { CurationEntry } from './CurationEntry'

export interface CurationManifest {
  version: number
  entries: Record<string, CurationEntry>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/constants/CURATION_STATES_TEST.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library
git commit -m "feat: add the four curation states and the library manifest types"
```

---

### Task 2: Manifest parsing and per-state invariants

Each state carries different obligations, and the parser is where they are
enforced rather than hoped for.

**Files:**

- Create: `scripts/lib/library/types/ManifestParseResult.ts`
- Create: `scripts/lib/library/collectEntryErrors.ts`
- Create: `scripts/lib/library/parseCurationManifest.ts`
- Test: `scripts/lib/library/PARSE_CURATION_MANIFEST_TEST.ts`

**Interfaces:**

- Consumes: Task 1 types.
- Produces:
  `collectEntryErrors(name: string, entry: unknown, errors: string[]) => void`,
  `parseCurationManifest(raw: unknown) => ManifestParseResult` where that type
  is
  `{ ok: true; manifest: CurationManifest } | { ok: false; errors: string[] }`.

Invariants: every entry has a known state; `forked` requires `patch` and
`upstreamHash`; `extracted` requires `extractedInto`; `parked` requires a
`reason`, because parking something without saying why is how a library rots.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCurationManifest } from './parseCurationManifest'

void test('a minimal adopted entry parses', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { 'frontend-design': { state: 'adopted' } },
  })
  assert.ok(result.ok)
})

void test('an unknown state is rejected and named', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'maybe' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('maybe')))
})

void test('a forked entry without a patch is rejected', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'forked', upstreamHash: 'abc' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('patch')))
})

void test('a forked entry without an upstream hash is rejected', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'forked', patch: 'patches/x.patch' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('upstreamHash')))
})

void test('an extracted entry must name what absorbed it', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'extracted' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('extractedInto')))
})

void test('a parked entry must carry a reason', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { x: { state: 'parked' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('reason')))
})

void test('a manifest without a version is rejected', () => {
  assert.ok(!parseCurationManifest({ entries: {} }).ok)
})

void test('every offending entry is reported, not just the first', () => {
  const result = parseCurationManifest({
    version: 1,
    entries: { a: { state: 'parked' }, b: { state: 'extracted' } },
  })
  assert.ok(!result.ok)
  assert.equal(result.errors.length, 2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/PARSE_CURATION_MANIFEST_TEST.ts`
Expected: FAIL, cannot find module `./parseCurationManifest`.

- [ ] **Step 3: Write minimal implementation**

`collectEntryErrors.ts`:

```ts
import { CURATION_STATES } from './constants/CURATION_STATES'

export const collectEntryErrors = (
  name: string,
  entry: unknown,
  errors: string[],
) => {
  if (typeof entry !== 'object' || entry === null) {
    errors.push(`${name}: entry must be an object`)
    return
  }

  const record = entry as Record<string, unknown>
  const state = record.state

  if (
    typeof state !== 'string' ||
    !(CURATION_STATES as readonly string[]).includes(state)
  ) {
    errors.push(`${name}: unknown state ${String(state)}`)
    return
  }

  if (state === 'forked') {
    if (typeof record.patch !== 'string')
      errors.push(`${name}: forked entries need a patch`)
    if (typeof record.upstreamHash !== 'string') {
      errors.push(`${name}: forked entries need an upstreamHash`)
    }
  }

  if (state === 'extracted' && typeof record.extractedInto !== 'string') {
    errors.push(`${name}: extracted entries need extractedInto`)
  }

  if (state === 'parked' && typeof record.reason !== 'string') {
    errors.push(`${name}: parked entries need a reason`)
  }
}
```

`parseCurationManifest.ts`:

```ts
import { collectEntryErrors } from './collectEntryErrors'
import type { CurationManifest } from './types/CurationManifest'
import type { ManifestParseResult } from './types/ManifestParseResult'

export const parseCurationManifest = (raw: unknown): ManifestParseResult => {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['manifest must be an object'] }
  }

  const record = raw as Record<string, unknown>

  if (typeof record.version !== 'number') {
    return { ok: false, errors: ['manifest needs a numeric version'] }
  }

  if (typeof record.entries !== 'object' || record.entries === null) {
    return { ok: false, errors: ['manifest.entries must be an object'] }
  }

  const errors: string[] = []
  for (const [name, entry] of Object.entries(
    record.entries as Record<string, unknown>,
  )) {
    collectEntryErrors(name, entry, errors)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, manifest: raw as CurationManifest }
}
```

`ManifestParseResult.ts`:

```ts
import type { CurationManifest } from './CurationManifest'

export type ManifestParseResult =
  { ok: true; manifest: CurationManifest } | { ok: false; errors: string[] }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/PARSE_CURATION_MANIFEST_TEST.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library
git commit -m "feat: enforce the obligations each curation state carries"
```

---

### Task 3: Seeding the manifest from the existing lock

The library already has provenance for 88 skills. Seeding reads
`.skill-lock.json` and produces a manifest where everything starts `parked` with
a stated reason, because a skill nobody has judged yet is exactly what `parked`
means. Our own bundles are seeded `adopted`.

**Files:**

- Create: `scripts/lib/library/types/LockEntry.ts`
- Create: `scripts/lib/library/seedEntryFromLock.ts`
- Create: `scripts/lib/library/seedManifestFromLock.ts`
- Test: `scripts/lib/library/SEED_MANIFEST_FROM_LOCK_TEST.ts`

**Interfaces:**

- Produces:
  `seedEntryFromLock(name: string, lock: LockEntry, ours: string[]) => CurationEntry`,
  `seedManifestFromLock(lock: Record<string, LockEntry>, ours: string[]) => CurationManifest`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { seedManifestFromLock } from './seedManifestFromLock'

const lock = {
  'algorithmic-art': {
    source: 'anthropics/skills',
    sourceUrl: 'https://github.com/anthropics/skills.git',
    skillPath: 'skills/algorithmic-art/SKILL.md',
    skillFolderHash: '4aef6bcad51d058ec32b1acb9da436851863e56e',
  },
}

void test('a vendored skill is seeded as parked with a stated reason', () => {
  const manifest = seedManifestFromLock(lock, [])
  const entry = manifest.entries['algorithmic-art']
  assert.equal(entry?.state, 'parked')
  assert.match(entry?.reason ?? '', /not yet judged/i)
})

void test('provenance is carried across verbatim', () => {
  const entry = seedManifestFromLock(lock, []).entries['algorithmic-art']
  assert.equal(entry?.source, 'anthropics/skills')
  assert.equal(entry?.upstreamHash, '4aef6bcad51d058ec32b1acb9da436851863e56e')
  assert.equal(entry?.skillPath, 'skills/algorithmic-art/SKILL.md')
})

void test('our own bundles are seeded adopted, not parked', () => {
  const manifest = seedManifestFromLock({ core: { source: '' } }, ['core'])
  assert.equal(manifest.entries['core']?.state, 'adopted')
})

void test('the manifest is versioned', () => {
  assert.equal(seedManifestFromLock(lock, []).version, 1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/SEED_MANIFEST_FROM_LOCK_TEST.ts`
Expected: FAIL, cannot find module `./seedManifestFromLock`.

- [ ] **Step 3: Write minimal implementation**

`LockEntry.ts`:

```ts
export interface LockEntry {
  source: string
  sourceUrl?: string
  skillPath?: string
  skillFolderHash?: string
}
```

`seedEntryFromLock.ts`:

```ts
import type { CurationEntry } from './types/CurationEntry'
import type { LockEntry } from './types/LockEntry'

export const seedEntryFromLock = (
  name: string,
  lock: LockEntry,
  ours: string[],
): CurationEntry => {
  const provenance = {
    ...(lock.source ? { source: lock.source } : {}),
    ...(lock.sourceUrl ? { sourceUrl: lock.sourceUrl } : {}),
    ...(lock.skillPath ? { skillPath: lock.skillPath } : {}),
    ...(lock.skillFolderHash ? { upstreamHash: lock.skillFolderHash } : {}),
  }

  if (ours.includes(name)) {
    return { state: 'adopted', ...provenance, reason: 'authored here' }
  }

  return {
    state: 'parked',
    ...provenance,
    reason: 'seeded from the lock, not yet judged against measured demand',
  }
}
```

`seedManifestFromLock.ts`:

```ts
import { seedEntryFromLock } from './seedEntryFromLock'
import type { CurationManifest } from './types/CurationManifest'
import type { LockEntry } from './types/LockEntry'

export const seedManifestFromLock = (
  lock: Record<string, LockEntry>,
  ours: string[],
): CurationManifest => {
  const entries: Record<string, ReturnType<typeof seedEntryFromLock>> = {}

  for (const [name, entry] of Object.entries(lock)) {
    entries[name] = seedEntryFromLock(name, entry, ours)
  }

  return { version: 1, entries }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/SEED_MANIFEST_FROM_LOCK_TEST.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library
git commit -m "feat: seed the curation manifest from the existing provenance lock"
```

---

### Task 4: Deciding what the linker fans out

**Files:**

- Create: `scripts/lib/library/isFannedOut.ts`
- Create: `scripts/lib/library/selectFannedOutSkills.ts`
- Test: `scripts/lib/library/SELECT_FANNED_OUT_SKILLS_TEST.ts`

**Interfaces:**

- Produces: `isFannedOut(entry: CurationEntry, target: string) => boolean`,
  `selectFannedOutSkills(manifest: CurationManifest, target: string) => string[]`.

An entry with no `targets` is fanned out to every target; one with `targets`
only to those listed. `parked` and `extracted` never fan out regardless of
`targets`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { selectFannedOutSkills } from './selectFannedOutSkills'
import type { CurationManifest } from './types/CurationManifest'

const manifest: CurationManifest = {
  version: 1,
  entries: {
    adoptedEverywhere: { state: 'adopted' },
    forkedOne: { state: 'forked', patch: 'p', upstreamHash: 'h' },
    parkedOne: { state: 'parked', reason: 'not needed' },
    extractedOne: { state: 'extracted', extractedInto: 'ours' },
    codexOnly: { state: 'adopted', targets: ['codex'] },
  },
}

void test('adopted and forked fan out, parked and extracted never do', () => {
  assert.deepEqual(selectFannedOutSkills(manifest, 'claude').sort(), [
    'adoptedEverywhere',
    'forkedOne',
  ])
})

void test('an entry restricted to one target is absent from the others', () => {
  assert.equal(
    selectFannedOutSkills(manifest, 'claude').includes('codexOnly'),
    false,
  )
  assert.equal(
    selectFannedOutSkills(manifest, 'codex').includes('codexOnly'),
    true,
  )
})

void test('an entry with no targets reaches every target', () => {
  assert.equal(
    selectFannedOutSkills(manifest, 'antigravity').includes(
      'adoptedEverywhere',
    ),
    true,
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/SELECT_FANNED_OUT_SKILLS_TEST.ts`
Expected: FAIL, cannot find module `./selectFannedOutSkills`.

- [ ] **Step 3: Write minimal implementation**

`isFannedOut.ts`:

```ts
import type { CurationEntry } from './types/CurationEntry'

export const isFannedOut = (entry: CurationEntry, target: string) => {
  if (entry.state !== 'adopted' && entry.state !== 'forked') {
    return false
  }

  return entry.targets === undefined || entry.targets.includes(target)
}
```

`selectFannedOutSkills.ts`:

```ts
import { isFannedOut } from './isFannedOut'
import type { CurationManifest } from './types/CurationManifest'

export const selectFannedOutSkills = (
  manifest: CurationManifest,
  target: string,
) =>
  Object.entries(manifest.entries)
    .filter(([, entry]) => isFannedOut(entry, target))
    .map(([name]) => name)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/SELECT_FANNED_OUT_SKILLS_TEST.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library
git commit -m "feat: fan out only the skills the manifest says are in use"
```

---

### Task 5: Excluding machine-written turns

The filter that changes the answer. Fixtures are the real injected prompts found
on 2026-08-18.

**Files:**

- Create: `scripts/lib/library/learning/constants/MACHINE_TURN_PATTERNS.ts`
- Create: `scripts/lib/library/learning/isMachineTurn.ts`
- Test: `scripts/lib/library/learning/IS_MACHINE_TURN_TEST.ts`

**Interfaces:**

- Produces: `MACHINE_TURN_PATTERNS` (readonly RegExp array),
  `isMachineTurn(text: string) => boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { isMachineTurn } from './isMachineTurn'

void test('the security-guidance hook review prompt is machine-written', () => {
  assert.equal(
    isMachineTurn(
      'Review this change for security vulnerabilities. Changed files (you may Read these...',
    ),
    true,
  )
})

void test('stop hook feedback is machine-written', () => {
  assert.equal(
    isMachineTurn(
      'Stop hook feedback: Verification gate FAILED: `pnpm run check`',
    ),
    true,
  )
})

void test('the structured output enforcer is machine-written', () => {
  assert.equal(
    isMachineTurn(
      '[structured-output-enforce] You MUST call the StructuredOutput tool',
    ),
    true,
  )
})

void test('a skill preamble is machine-written', () => {
  assert.equal(
    isMachineTurn(
      'Base directory for this skill: /Users/someone/.claude/plugins',
    ),
    true,
  )
})

void test('a system reminder block is machine-written', () => {
  assert.equal(
    isMachineTurn('<system-reminder>do the thing</system-reminder>'),
    true,
  )
})

void test('a real request that merely mentions security is kept', () => {
  assert.equal(
    isMachineTurn('revisa este script bash por seguridad antes de subirlo'),
    false,
  )
})

void test('a pasted screenshot is kept, because the screenshot is the request', () => {
  assert.equal(
    isMachineTurn('[Image: original 3456x2234, displayed at 2000x1293.'),
    false,
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/learning/IS_MACHINE_TURN_TEST.ts`
Expected: FAIL, cannot find module `./isMachineTurn`.

- [ ] **Step 3: Write minimal implementation**

`MACHINE_TURN_PATTERNS.ts`:

```ts
export const MACHINE_TURN_PATTERNS = [
  /^Review this change for security vulnerabilities\./,
  /^Stop hook feedback:/,
  /^\[structured-output-enforce\]/,
  /^Base directory for this skill:/,
  /^<[a-z-]+>/,
  /^Caveat: The messages below were generated/,
] as const
```

`isMachineTurn.ts`:

```ts
import { MACHINE_TURN_PATTERNS } from './constants/MACHINE_TURN_PATTERNS'

export const isMachineTurn = (text: string) =>
  MACHINE_TURN_PATTERNS.some((pattern) => pattern.test(text.trimStart()))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/learning/IS_MACHINE_TURN_TEST.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library/learning
git commit -m "feat: exclude machine-written turns from measured demand"
```

---

### Task 6: Reading real requests out of a transcript

**Files:**

- Create: `scripts/lib/library/learning/types/ObservedTurn.ts`
- Create: `scripts/lib/library/learning/extractTurnText.ts`
- Create: `scripts/lib/library/learning/readTranscriptTurns.ts`
- Test: `scripts/lib/library/learning/READ_TRANSCRIPT_TURNS_TEST.ts`

**Interfaces:**

- Consumes: `isMachineTurn` from Task 5.
- Produces: `ObservedTurn = { text: string; invokedSkill?: string }`,
  `extractTurnText(content: unknown) => string`,
  `readTranscriptTurns(contents: string) => ObservedTurn[]`.

A transcript is JSONL. User turns give demand; assistant `tool_use` blocks named
`Skill` give the invocation counts. Both come out of one pass so the
cross-reference has them aligned.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { readTranscriptTurns } from './readTranscriptTurns'

const line = (value: unknown) => JSON.stringify(value)

void test('a plain user turn is observed', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      message: { role: 'user', content: 'arregla el header en movil' },
    }),
  )
  assert.deepEqual(turns, [{ text: 'arregla el header en movil' }])
})

void test('text blocks are joined and non-text blocks ignored', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'haz esto' }, { type: 'image' }],
      },
    }),
  )
  assert.deepEqual(turns, [{ text: 'haz esto' }])
})

void test('a machine-written turn is dropped', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      message: { role: 'user', content: 'Stop hook feedback: gate FAILED' },
    }),
  )
  assert.deepEqual(turns, [])
})

void test('sidechain turns are dropped, because they are the agent talking to itself', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      isSidechain: true,
      message: { role: 'user', content: 'do it' },
    }),
  )
  assert.deepEqual(turns, [])
})

void test('a skill invocation is observed with its name', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            name: 'Skill',
            input: { skill: 'brp-todo-work' },
          },
        ],
      },
    }),
  )
  assert.deepEqual(turns, [{ text: '', invokedSkill: 'brp-todo-work' }])
})

void test('unparseable lines are skipped rather than throwing', () => {
  assert.deepEqual(readTranscriptTurns('{ not json\n'), [])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/learning/READ_TRANSCRIPT_TURNS_TEST.ts`
Expected: FAIL, cannot find module `./readTranscriptTurns`.

- [ ] **Step 3: Write minimal implementation**

`ObservedTurn.ts`:

```ts
export interface ObservedTurn {
  text: string
  invokedSkill?: string
}
```

`extractTurnText.ts`:

```ts
export const extractTurnText = (content: unknown) => {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .filter(
      (block): block is { type: 'text'; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        (block as Record<string, unknown>).type === 'text' &&
        typeof (block as Record<string, unknown>).text === 'string',
    )
    .map((block) => block.text)
    .join(' ')
}
```

`readTranscriptTurns.ts`:

```ts
import { extractTurnText } from './extractTurnText'
import { isMachineTurn } from './isMachineTurn'
import type { ObservedTurn } from './types/ObservedTurn'

export const readTranscriptTurns = (contents: string) => {
  const turns: ObservedTurn[] = []

  for (const line of contents.split('\n')) {
    if (line.trim() === '') continue

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }

    const message = parsed.message as
      { role?: string; content?: unknown } | undefined
    if (message === undefined) continue

    if (parsed.type === 'assistant' && Array.isArray(message.content)) {
      for (const block of message.content) {
        const record = block as Record<string, unknown>
        const input = record.input as { skill?: unknown } | undefined
        if (
          record.type === 'tool_use' &&
          record.name === 'Skill' &&
          typeof input?.skill === 'string'
        ) {
          turns.push({ text: '', invokedSkill: input.skill })
        }
      }
      continue
    }

    if (parsed.type !== 'user' || parsed.isSidechain === true) continue

    const text = extractTurnText(message.content).trim()
    if (text === '' || isMachineTurn(text)) continue

    turns.push({ text })
  }

  return turns
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/learning/READ_TRANSCRIPT_TURNS_TEST.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library/learning
git commit -m "feat: read real requests and skill invocations out of a transcript"
```

---

### Task 7: Turning coverage into proposals

**Files:**

- Create: `scripts/lib/library/learning/types/Procedure.ts`
- Create: `scripts/lib/library/learning/types/Proposal.ts`
- Create: `scripts/lib/library/learning/proposeForProcedure.ts`
- Create: `scripts/lib/library/learning/proposeChanges.ts`
- Test: `scripts/lib/library/learning/PROPOSE_CHANGES_TEST.ts`

**Interfaces:**

- Consumes: `CurationManifest`, `selectFannedOutSkills`.
- Produces:
  `Procedure = { name: string; requests: number; projects: number; covers?: string }`,
  `Proposal = { kind: "promote" | "fix-trigger" | "build" | "park"; skill?: string; procedure?: string; requests: number; why: string }`,
  `proposeChanges(input: { procedures: Procedure[]; manifest: CurationManifest; invocations: Record<string, number>; target: string; idleThreshold: number }) => Proposal[]`.

The rules, each matching one of the three measured failure modes: a procedure
whose covering skill exists but is not fanned out proposes `promote`; one whose
covering skill is fanned out but never fired proposes `fix-trigger`; one with no
covering skill proposes `build`; an adopted skill with zero invocations and no
procedure pointing at it proposes `park`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { proposeChanges } from './proposeChanges'
import type { CurationManifest } from '../types/CurationManifest'

const manifest: CurationManifest = {
  version: 1,
  entries: {
    'frontend-design': { state: 'parked', reason: 'not judged' },
    'team-communications': { state: 'adopted' },
    'old-thing': { state: 'adopted' },
  },
}

void test('a covering skill that is parked is proposed for promotion', () => {
  const proposals = proposeChanges({
    procedures: [
      {
        name: 'implement ui from screenshot',
        requests: 24,
        projects: 1,
        covers: 'frontend-design',
      },
    ],
    manifest,
    invocations: {},
    target: 'claude',
    idleThreshold: 0,
  })
  const promote = proposals.find((p) => p.kind === 'promote')
  assert.equal(promote?.skill, 'frontend-design')
  assert.equal(promote?.requests, 24)
})

void test('a covering skill that is visible but never fired is a trigger problem', () => {
  const proposals = proposeChanges({
    procedures: [
      {
        name: 'report status on task progress',
        requests: 42,
        projects: 1,
        covers: 'team-communications',
      },
    ],
    manifest,
    invocations: {},
    target: 'claude',
    idleThreshold: 0,
  })
  const fix = proposals.find((p) => p.kind === 'fix-trigger')
  assert.equal(fix?.skill, 'team-communications')
})

void test('a procedure nothing covers is a build candidate', () => {
  const proposals = proposeChanges({
    procedures: [{ name: 'read discord messages', requests: 8, projects: 4 }],
    manifest,
    invocations: {},
    target: 'claude',
    idleThreshold: 0,
  })
  assert.equal(
    proposals.find((p) => p.kind === 'build')?.procedure,
    'read discord messages',
  )
})

void test('an adopted skill nothing points at and nothing invoked is proposed for parking', () => {
  const proposals = proposeChanges({
    procedures: [],
    manifest,
    invocations: { 'team-communications': 3 },
    target: 'claude',
    idleThreshold: 0,
  })
  assert.deepEqual(
    proposals.filter((p) => p.kind === 'park').map((p) => p.skill),
    ['old-thing'],
  )
})

void test('proposals are ordered by measured volume, most first', () => {
  const proposals = proposeChanges({
    procedures: [
      { name: 'small', requests: 2, projects: 1 },
      { name: 'big', requests: 40, projects: 3 },
    ],
    manifest,
    invocations: { 'team-communications': 1, 'old-thing': 1 },
    target: 'claude',
    idleThreshold: 0,
  })
  assert.equal(proposals[0]?.procedure, 'big')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/lib/library/learning/PROPOSE_CHANGES_TEST.ts`
Expected: FAIL, cannot find module `./proposeChanges`.

- [ ] **Step 3: Write minimal implementation**

`Procedure.ts`, `Proposal.ts` as declared above, then `proposeForProcedure.ts`:

```ts
import type { CurationManifest } from '../types/CurationManifest'
import type { Procedure } from './types/Procedure'
import type { Proposal } from './types/Proposal'

export const proposeForProcedure = (
  procedure: Procedure,
  manifest: CurationManifest,
  fannedOut: string[],
  invocations: Record<string, number>,
): Proposal | undefined => {
  if (procedure.covers === undefined) {
    return {
      kind: 'build',
      procedure: procedure.name,
      requests: procedure.requests,
      why: `${String(procedure.requests)} requests across ${String(procedure.projects)} projects and nothing covers it`,
    }
  }

  const entry = manifest.entries[procedure.covers]
  if (entry === undefined) {
    return {
      kind: 'build',
      procedure: procedure.name,
      requests: procedure.requests,
      why: `covering skill ${procedure.covers} is not in the library`,
    }
  }

  if (!fannedOut.includes(procedure.covers)) {
    return {
      kind: 'promote',
      skill: procedure.covers,
      procedure: procedure.name,
      requests: procedure.requests,
      why: `covers ${String(procedure.requests)} requests but is ${entry.state}, so nothing can select it`,
    }
  }

  if ((invocations[procedure.covers] ?? 0) === 0) {
    return {
      kind: 'fix-trigger',
      skill: procedure.covers,
      procedure: procedure.name,
      requests: procedure.requests,
      why: `visible and covering ${String(procedure.requests)} requests, yet never invoked`,
    }
  }

  return undefined
}
```

`proposeChanges.ts` composes it, appends the park proposals, and sorts by
`requests` descending.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/lib/library/learning/PROPOSE_CHANGES_TEST.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/library/learning
git commit -m "feat: turn measured coverage into promote, fix-trigger, build and park proposals"
```

---

### Task 8: The commands

**Files:**

- Create: `scripts/commands/librarySeed.ts`
- Create: `scripts/commands/libraryObserve.ts`
- Create: `scripts/commands/libraryPropose.ts`
- Create: `scripts/bin/run-library-seed.ts`
- Create: `scripts/bin/run-library-observe.ts`
- Create: `scripts/bin/run-library-propose.ts`
- Modify: `package.json`

**Interfaces:**

- Consumes: everything above.

`library:seed` writes `curation.json` from the lock, refusing to overwrite an
existing manifest unless `--force`. `library:observe` walks the transcript
roots, writes observed turns and invocation counts to the library's `learning/`
directory, and skips transcripts whose mtime is unchanged since the last run.
`library:propose` reads a procedures file produced by the classification step
and prints proposals, `--json` included.

- [ ] **Step 1: Write the three commands following
      `scripts/commands/machineDiff.ts` for structure**

Each resolves paths from `os.homedir()`, takes `--library <path>` defaulting to
`~/.agents`, and prints through a formatter under `formatters/`.

- [ ] **Step 2: Add the package scripts**

```json
"library:seed": "tsx scripts/bin/run-library-seed.ts",
"library:observe": "tsx scripts/bin/run-library-observe.ts",
"library:propose": "tsx scripts/bin/run-library-propose.ts",
"library:test": "tsx --test \"scripts/lib/library/**/*_TEST.ts\""
```

- [ ] **Step 3: Add `library:test` to `check:all` after `machine:test`**

- [ ] **Step 4: Run the full check**

Run: `pnpm run check` Expected: PASS.

- [ ] **Step 5: Seed against the real library and read the result**

```bash
npx tsx scripts/bin/run-library-seed.ts --library ~/.agents --dry-run --json
```

Expected: 88 entries, our own bundles adopted, everything else parked with a
reason. Do not write the manifest for real until the output has been read.

- [ ] **Step 6: Commit**

```bash
git add scripts package.json
git commit -m "feat: add the library seed, observe and propose commands"
```

---

### Task 9: Prove the loop against the real corpus

**Files:**

- Create: `scripts/lib/library/learning/OBSERVE_INTEGRATION_TEST.ts`

- [ ] **Step 1: Write a test that runs the observer over a fabricated transcript
      directory**

Build two transcripts in a temp directory: one with a real request, a
machine-injected security prompt, and a skill invocation; one unchanged since a
recorded mtime. Assert the real request is counted once, the injected one never,
the invocation is attributed, and the unchanged transcript is skipped on the
second pass.

- [ ] **Step 2: Run it**

Run: `npx tsx --test scripts/lib/library/learning/OBSERVE_INTEGRATION_TEST.ts`
Expected: PASS.

- [ ] **Step 3: Run the observer over the real transcripts and sanity-check the
      totals**

Run: `npx tsx scripts/bin/run-library-observe.ts --json | head -30` Expected:
roughly 3,100 user turns before filtering and about 170 dropped as
machine-written, which is what the manual pass measured on 2026-08-18. A wildly
different number means the extraction is wrong, not that the corpus changed.

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/library/learning
git commit -m "test: prove the observer against the real transcript corpus"
```

---

## Self-review notes

**Spec coverage.** Section 4 (states and manifest) Tasks 1-3; section 4's
fan-out rule Task 4; section 6 observe stage Tasks 5-6; section 6
cross-reference and propose Task 7; commands Task 8; the corpus check Task 9.

**Deliberately deferred, and named in the spec rather than dropped:** the
classification stage, which is a delegated model command and arrives with its
own plan; trigger learning writing back into descriptions and router fixtures
(section 7); the patch reapplication path for `forked` entries (section 5); the
autonomy policy's two automatic actions (section 8); and rules, which the spec
places in the library but out of the first implementation.

**Known sharp edge.** `library:seed` starts everything `parked`, which means
that until promotions are made, the linker would fan out almost nothing. Seeding
must therefore be followed immediately by the promotions the measurements
already justify - the thirty procedures with a genuine invisible match - or the
library gets quieter before it gets better. That sequencing is a decision to
make in the open, not a default to run into.
