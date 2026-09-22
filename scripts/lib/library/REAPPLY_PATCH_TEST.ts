import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { reapplyPatch } from './reapplyPatch'

void test('an entry with no declared patch is reported, not silently skipped', async () => {
  const outcome = await reapplyPatch(
    'x',
    { state: 'forked' },
    '/nowhere',
    undefined,
  )
  assert.equal(outcome.kind, 'missing-patch')
})

void test('a declared patch that is not on disk is reported with its path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-patch-'))
  const outcome = await reapplyPatch(
    'x',
    { state: 'forked', patch: 'patches/x.patch', upstreamHash: 'abc' },
    dir,
    undefined,
  )
  assert.ok(outcome.kind === 'missing-patch')
  assert.match(outcome.path, /patches\/x\.patch/)
})

void test('an unchanged upstream needs no reapplication', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-patch-'))
  await mkdir(join(dir, 'patches'), { recursive: true })
  await writeFile(join(dir, 'patches', 'x.patch'), '')

  const outcome = await reapplyPatch(
    'x',
    { state: 'forked', patch: 'patches/x.patch', upstreamHash: 'abc' },
    dir,
    'abc',
  )
  assert.equal(outcome.kind, 'already-current')
})

void test('a patch that does not apply is a conflict, and the working copy is untouched', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-patch-'))
  await mkdir(join(dir, 'patches'), { recursive: true })
  await writeFile(
    join(dir, 'patches', 'x.patch'),
    'this is not a patch at all\n',
  )
  await writeFile(join(dir, 'target.md'), 'original\n')

  const outcome = await reapplyPatch(
    'x',
    { state: 'forked', patch: 'patches/x.patch', upstreamHash: 'abc' },
    dir,
    'def',
  )
  assert.equal(outcome.kind, 'conflict')

  const { readFile } = await import('node:fs/promises')
  assert.equal(await readFile(join(dir, 'target.md'), 'utf8'), 'original\n')
})
