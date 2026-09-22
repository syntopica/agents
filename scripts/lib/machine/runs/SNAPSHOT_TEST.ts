import assert from 'node:assert/strict'
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createRunId } from './createRunId'
import { createSnapshot } from './createSnapshot'
import { listRuns } from './listRuns'
import { restoreSnapshot } from './restoreSnapshot'

void test('a run id is sortable and carries a suffix', () => {
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

void test('a snapshot restores directories and symbolic links', async () => {
  const work = await mkdtemp(join(tmpdir(), 'machine-run-tree-'))
  const source = join(work, 'source')
  const directory = join(work, 'directory')
  const link = join(work, 'link')
  await mkdir(source)
  await mkdir(directory)
  await writeFile(join(directory, 'before.txt'), 'before')
  await symlink(source, link)

  const runDir = join(work, 'runs', 'r1')
  await createSnapshot({ runDir, files: [directory, link] })
  await writeFile(join(directory, 'after.txt'), 'after')
  await rm(link)
  await writeFile(link, 'replacement')
  await restoreSnapshot({ runDir })

  assert.equal(await readFile(join(directory, 'before.txt'), 'utf8'), 'before')
  await assert.rejects(readFile(join(directory, 'after.txt'), 'utf8'))
  assert.equal((await lstat(link)).isSymbolicLink(), true)
  assert.equal(await readlink(link), source)
})

void test('an interrupted run has no complete marker', async () => {
  const work = await mkdtemp(join(tmpdir(), 'machine-runs-'))
  await mkdir(join(work, '2026-08-17T22-04-05-abc'), { recursive: true })

  assert.deepEqual(await listRuns(work), [
    { runId: '2026-08-17T22-04-05-abc', complete: false },
  ])
})

void test('a finished run is marked complete', async () => {
  const work = await mkdtemp(join(tmpdir(), 'machine-runs-'))
  const runDir = join(work, '2026-08-17T22-04-05-abc')
  await mkdir(runDir, { recursive: true })
  await writeFile(join(runDir, 'complete'), '')

  assert.deepEqual(await listRuns(work), [
    { runId: '2026-08-17T22-04-05-abc', complete: true },
  ])
})

void test('listing a missing runs directory returns nothing', async () => {
  assert.deepEqual(await listRuns('/nonexistent/runs'), [])
})
