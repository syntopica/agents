import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createCodexSnapshot } from './createCodexSnapshot'
import { createRollout } from './fixtures/createRollout'
import { createSqliteDatabase } from './fixtures/createSqliteDatabase'
import { quarantineMalformedSessions } from './quarantineMalformedSessions'
import { readRolloutHeader } from './readRolloutHeader'
import { rebuildDerivedDatabase } from './rebuildDerivedDatabase'

void test('only the corrupt derived database family moves after snapshot verification', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-rebuild-'))
  const codexDir = join(root, 'codex')
  const backupsDir = join(root, 'backups')
  await mkdir(codexDir)
  await writeFile(join(codexDir, 'memories_1.sqlite'), 'corrupt')
  await writeFile(join(codexDir, 'memories_1.sqlite-wal'), 'wal')
  await writeFile(join(codexDir, 'memories_1.sqlite-shm'), 'shm')
  await createSqliteDatabase(join(codexDir, 'state_5.sqlite'))
  const snapshot = await createCodexSnapshot({
    codexDir,
    backupsDir,
    runId: 'repair-run',
    databaseNames: ['memories_1.sqlite'],
  })

  const result = await rebuildDerivedDatabase({
    codexDir,
    snapshotDir: snapshot.snapshotDir,
    processTable: '',
  })

  assert.equal(result.status, 'quarantined')
  assert.equal(result.entries.length, 3)
  await assert.rejects(access(join(codexDir, 'memories_1.sqlite')))
  await access(join(codexDir, 'state_5.sqlite'))
  const manifest = await readFile(
    join(snapshot.snapshotDir, 'quarantine-manifest.json'),
    'utf8',
  )
  assert.equal(manifest.includes('memories_1.sqlite-wal'), true)
})

void test('malformed sessions move while a valid session remains active', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-session-quarantine-'))
  const codexDir = join(root, 'codex')
  const snapshotDir = join(root, 'snapshot')
  await mkdir(join(codexDir, 'sessions'), { recursive: true })
  await mkdir(snapshotDir)
  const malformedSource = await createRollout('\n')
  const validSource = await createRollout(
    '{"type":"session_meta","payload":{"id":"valid-session"}}\n',
  )
  const malformedPath = join(codexDir, 'sessions', 'malformed.jsonl')
  const validPath = join(codexDir, 'sessions', 'valid.jsonl')
  await writeFile(malformedPath, await readFile(malformedSource))
  await writeFile(validPath, await readFile(validSource))
  const findings = await Promise.all([
    readRolloutHeader(malformedPath),
    readRolloutHeader(validPath),
  ])

  const result = await quarantineMalformedSessions({
    codexDir,
    snapshotDir,
    findings,
    processTable: '',
  })

  assert.equal(result.status, 'quarantined')
  assert.equal(result.entries.length, 1)
  await assert.rejects(access(malformedPath))
  await access(validPath)
})
