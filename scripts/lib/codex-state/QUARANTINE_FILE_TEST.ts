import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { hashFile } from './hashFile'
import { quarantineFile } from './quarantineFile'

void test('a quarantined file is moved with a verified hash and relative paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-quarantine-'))
  const codexDir = join(root, 'codex')
  const snapshotDir = join(root, 'snapshot')
  const sourcePath = join(codexDir, 'sessions', '2026', 'rollout.jsonl')
  await mkdir(join(codexDir, 'sessions', '2026'), { recursive: true })
  await mkdir(snapshotDir)
  await writeFile(sourcePath, 'malformed')
  const sha256 = await hashFile(sourcePath)

  const entry = await quarantineFile({ sourcePath, codexDir, snapshotDir })

  assert.equal(entry.originalRelativePath, 'sessions/2026/rollout.jsonl')
  assert.equal(
    entry.destinationRelativePath,
    'quarantine/sessions/2026/rollout.jsonl',
  )
  assert.equal(entry.sha256, sha256)
  await assert.rejects(access(sourcePath))
  assert.equal(
    await readFile(join(snapshotDir, entry.destinationRelativePath), 'utf8'),
    'malformed',
  )
})
