import assert from 'node:assert/strict'
import { access, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { applySessionArchive } from './applySessionArchive'
import { createSessionRollout } from './fixtures/createSessionRollout'
import { planSessionArchive } from './planSessionArchive'
import { restoreSessionArchive } from './restoreSessionArchive'

void test('archive planning respects the 90-day boundary, current month, and malformed dates', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-archive-plan-'))
  const sessionsDir = join(root, 'codex', 'sessions')
  const exactlyNinetyDays =
    '2026/05/20/rollout-2026-05-20T12-00-00-exactly-ninety-days.jsonl'
  const olderThanNinetyDays =
    '2026/05/20/rollout-2026-05-20T11-59-59-older-than-ninety-days.jsonl'
  const currentMonth =
    '2026/08/01/rollout-2026-08-01T00-00-00-current-month.jsonl'
  const malformed = '2026/05/20/rollout-invalid-timestamp.jsonl'
  await createSessionRollout(sessionsDir, exactlyNinetyDays)
  await createSessionRollout(sessionsDir, olderThanNinetyDays)
  await createSessionRollout(sessionsDir, currentMonth)
  await createSessionRollout(sessionsDir, malformed)

  const plan = await planSessionArchive(sessionsDir, {
    retentionDays: 90,
    now: new Date('2026-08-18T12:00:00.000Z'),
  })

  assert.deepEqual(
    plan.entries.map(({ relativePath }) => relativePath),
    [olderThanNinetyDays],
  )
  assert.deepEqual(plan.skippedMalformed, [malformed])
  assert.equal(plan.totalBytes > 0, true)
})

void test('the current calendar month is retained even with zero retention days', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-archive-current-'))
  const sessionsDir = join(root, 'codex', 'sessions')
  await createSessionRollout(
    sessionsDir,
    '2026/08/01/rollout-2026-08-01T00-00-00-current-month.jsonl',
  )

  const plan = await planSessionArchive(sessionsDir, {
    retentionDays: 0,
    now: new Date('2026-08-18T12:00:00.000Z'),
  })

  assert.equal(plan.entries.length, 0)
})

void test('archive moves are checksummed and restore refuses a destination collision', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-archive-apply-'))
  const codexDir = join(root, 'codex')
  const sessionsDir = join(codexDir, 'sessions')
  const archiveRoot = join(codexDir, 'session-archive')
  const relativePath = '2026/01/01/rollout-2026-01-01T00-00-00-old.jsonl'
  const sourcePath = await createSessionRollout(sessionsDir, relativePath)
  const plan = await planSessionArchive(sessionsDir, {
    retentionDays: 90,
    now: new Date('2026-08-18T12:00:00.000Z'),
  })

  const applied = await applySessionArchive(
    plan,
    archiveRoot,
    'archive-run',
    '',
  )

  assert.equal(applied.status, 'archived')
  await assert.rejects(access(sourcePath))
  await access(join(archiveRoot, 'archive-run', relativePath))
  await writeFile(sourcePath, 'collision')

  const restored = await restoreSessionArchive({
    runDir: join(archiveRoot, 'archive-run'),
    sessionsDir,
    dryRun: false,
    processTable: '',
  })

  assert.equal(restored.status, 'collision')
  assert.equal(restored.reasons.length, 1)
  await access(join(archiveRoot, 'archive-run', relativePath))
})

void test('restore dry-run leaves archived files untouched', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-archive-restore-dry-'))
  const codexDir = join(root, 'codex')
  const sessionsDir = join(codexDir, 'sessions')
  const archiveRoot = join(codexDir, 'session-archive')
  const relativePath = '2026/01/02/rollout-2026-01-02T00-00-00-old.jsonl'
  await createSessionRollout(sessionsDir, relativePath)
  const plan = await planSessionArchive(sessionsDir, {
    retentionDays: 90,
    now: new Date('2026-08-18T12:00:00.000Z'),
  })
  await applySessionArchive(plan, archiveRoot, 'dry-run', '')

  const restored = await restoreSessionArchive({
    runDir: join(archiveRoot, 'dry-run'),
    sessionsDir,
    dryRun: true,
    processTable: '',
  })

  assert.equal(restored.status, 'planned')
  await access(join(archiveRoot, 'dry-run', relativePath))
  await assert.rejects(access(join(sessionsDir, relativePath)))
})
