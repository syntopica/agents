import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { isCodexActive } from './isCodexActive'

void test('an exact Codex process blocks mutation', async () => {
  const codexDir = await mkdtemp(join(tmpdir(), 'codex-activity-process-'))

  const activity = await isCodexActive(
    codexDir,
    '123 /usr/local/bin/codex app-server\n',
  )

  assert.equal(activity.active, true)
  assert.deepEqual(activity.reasons, ['Codex process is active'])
})

void test('a writer lock blocks mutation without a running process', async () => {
  const codexDir = await mkdtemp(join(tmpdir(), 'codex-activity-lock-'))
  const locksDir = join(codexDir, 'thread-writer-locks')
  await mkdir(locksDir)
  await writeFile(join(locksDir, 'session.lock'), '')

  const activity = await isCodexActive(codexDir, '')

  assert.equal(activity.active, true)
  assert.deepEqual(activity.reasons, ['Codex thread writer lock is active'])
})

void test('the persistent coordination lock does not block mutation', async () => {
  const codexDir = await mkdtemp(join(tmpdir(), 'codex-activity-coordination-'))
  const locksDir = join(codexDir, 'thread-writer-locks')
  await mkdir(locksDir)
  await writeFile(join(locksDir, '.coordination.lock'), '')

  const activity = await isCodexActive(codexDir, '')

  assert.equal(activity.active, false)
  assert.deepEqual(activity.reasons, [])
})

void test('similarly named tools do not create a false process match', async () => {
  const codexDir = await mkdtemp(join(tmpdir(), 'codex-activity-idle-'))

  const activity = await isCodexActive(
    codexDir,
    '123 /Applications/CodexBar.app/CodexBar\n',
  )

  assert.equal(activity.active, false)
})
