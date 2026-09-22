import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { appendQuarantineManifest } from './appendQuarantineManifest'
import { quarantineFile } from './quarantineFile'
import { restoreQuarantine } from './restoreQuarantine'

void test('quarantine restore is dry-run by default and refuses collisions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-quarantine-restore-'))
  const codexDir = join(root, 'codex')
  const snapshotDir = join(root, 'snapshot')
  const sourcePath = join(codexDir, 'sessions', 'broken.jsonl')
  await mkdir(join(codexDir, 'sessions'), { recursive: true })
  await mkdir(snapshotDir)
  await writeFile(sourcePath, 'broken')
  const entry = await quarantineFile({ sourcePath, codexDir, snapshotDir })
  await appendQuarantineManifest(snapshotDir, [entry])

  const planned = await restoreQuarantine({
    snapshotDir,
    codexDir,
    dryRun: true,
    processTable: '',
  })

  assert.equal(planned.status, 'planned')
  await assert.rejects(access(sourcePath))
  await writeFile(sourcePath, 'collision')
  const collision = await restoreQuarantine({
    snapshotDir,
    codexDir,
    dryRun: false,
    processTable: '',
  })
  assert.equal(collision.status, 'collision')
})

void test('a verified quarantine restores without overwriting', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-quarantine-restore-ok-'))
  const codexDir = join(root, 'codex')
  const snapshotDir = join(root, 'snapshot')
  const sourcePath = join(codexDir, 'memories_1.sqlite')
  await mkdir(codexDir)
  await mkdir(snapshotDir)
  await writeFile(sourcePath, 'database')
  const entry = await quarantineFile({ sourcePath, codexDir, snapshotDir })
  await appendQuarantineManifest(snapshotDir, [entry])

  const restored = await restoreQuarantine({
    snapshotDir,
    codexDir,
    dryRun: false,
    processTable: '',
  })

  assert.equal(restored.status, 'restored')
  await access(sourcePath)
  await assert.rejects(access(join(snapshotDir, entry.destinationRelativePath)))
})
