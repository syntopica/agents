import assert from 'node:assert/strict'
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createCodexSnapshot } from './createCodexSnapshot'
import { verifyCodexSnapshot } from './verifyCodexSnapshot'

void test('a database family is snapshotted with verified hashes and modes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-snapshot-'))
  const codexDir = join(root, 'codex')
  const backupsDir = join(root, 'backups')
  await mkdir(codexDir)
  await writeFile(join(codexDir, 'state.sqlite'), 'database')
  await writeFile(join(codexDir, 'state.sqlite-wal'), 'wal')
  await writeFile(join(codexDir, 'state.sqlite-shm'), 'shm')
  await chmod(join(codexDir, 'state.sqlite'), 0o640)

  const result = await createCodexSnapshot({
    codexDir,
    backupsDir,
    runId: 'run-001',
    databaseNames: ['state.sqlite'],
  })
  const verification = await verifyCodexSnapshot(result.snapshotDir)

  assert.equal(verification.ok, true)
  assert.equal(result.manifest.entries.length, 3)
  assert.deepEqual(
    result.manifest.entries.map(({ relativePath }) => relativePath),
    ['state.sqlite', 'state.sqlite-shm', 'state.sqlite-wal'],
  )
  assert.equal(result.manifest.entries[0]?.mode, 0o640)
  assert.equal(
    await readFile(join(result.snapshotDir, 'files', 'state.sqlite'), 'utf8'),
    'database',
  )
})

void test('snapshot creation fails closed when a source changes during copying', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-snapshot-race-'))
  const codexDir = join(root, 'codex')
  const backupsDir = join(root, 'backups')
  await mkdir(codexDir)
  const databasePath = join(codexDir, 'state.sqlite')
  await writeFile(databasePath, 'before')

  await assert.rejects(
    createCodexSnapshot({
      codexDir,
      backupsDir,
      runId: 'run-race',
      databaseNames: ['state.sqlite'],
      onFileCopied: async () => writeFile(databasePath, 'after-change'),
    }),
    /changed while snapshotting/,
  )
  await assert.rejects(access(join(backupsDir, 'run-race', 'manifest.json')))
})
