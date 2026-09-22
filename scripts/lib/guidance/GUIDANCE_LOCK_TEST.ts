import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { acquireGuidanceLock } from './acquireGuidanceLock'
import { readGuidanceLockObservation } from './readGuidanceLockObservation'
import { reclaimGuidanceLock } from './reclaimGuidanceLock'

void test('an active PID-owned guidance lock is preserved', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-lock-active-'))
  const lockPath = join(root, 'lock')
  const contents = `${JSON.stringify({ pid: process.pid, runId: 'active' })}\n`
  await writeFile(lockPath, contents)
  await assert.rejects(
    acquireGuidanceLock(lockPath, 'contender', 1_000),
    /already active/u,
  )
  assert.equal(await readFile(lockPath, 'utf8'), contents)
})

void test('a dead PID-owned guidance lock is recovered and ownership-safe release removes it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-lock-stale-'))
  const lockPath = join(root, 'lock')
  await writeFile(
    lockPath,
    `${JSON.stringify({ pid: 2_147_483_647, runId: 'dead' })}\n`,
  )
  const release = await acquireGuidanceLock(lockPath, 'replacement', 1_000)
  assert.match(await readFile(lockPath, 'utf8'), /"runId":"replacement"/u)
  await release()
  await assert.rejects(readFile(lockPath), { code: 'ENOENT' })
})

void test('a stale legacy lock is recovered only after the safety window', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-lock-legacy-'))
  const lockPath = join(root, 'lock')
  await writeFile(lockPath, 'legacy-run-id')
  await assert.rejects(
    acquireGuidanceLock(lockPath, 'early', 1_000),
    /already active/u,
  )
  const old = new Date(Date.now() - 2_000)
  await utimes(lockPath, old, old)
  const release = await acquireGuidanceLock(lockPath, 'replacement', 1_000)
  await release()
})

void test('an invalid PID is treated as a legacy lock instead of a live process', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-lock-test-'))
  try {
    const lockPath = join(root, 'guidance.lock')
    await writeFile(
      lockPath,
      `${JSON.stringify({ pid: 0, runId: 'invalid' })}\n`,
      'utf8',
    )
    await utimes(lockPath, new Date(0), new Date(0))
    const release = await acquireGuidanceLock(lockPath, 'replacement', 1)
    await release()
    await assert.rejects(readFile(lockPath, 'utf8'), /ENOENT/u)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

void test('stale reclamation refuses a replacement active lock', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-lock-race-'))
  try {
    const lockPath = join(root, 'guidance.lock')
    const staleOwner = `${JSON.stringify({ pid: 2_147_483_647, runId: 'stale' })}\n`
    await writeFile(lockPath, staleOwner)
    const observed = await readGuidanceLockObservation(lockPath, 1)
    if (observed === undefined)
      throw new Error('stale lock observation is missing')
    await rm(lockPath)
    const activeOwner = `${JSON.stringify({ pid: process.pid, runId: 'replacement' })}\n`
    await writeFile(lockPath, activeOwner, { flag: 'wx' })
    const release = await reclaimGuidanceLock(
      lockPath,
      `${lockPath}.recovery`,
      observed,
      `${JSON.stringify({ pid: process.pid, runId: 'contender' })}\n`,
      1,
    )
    assert.equal(release, undefined)
    assert.equal(await readFile(lockPath, 'utf8'), activeOwner)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
