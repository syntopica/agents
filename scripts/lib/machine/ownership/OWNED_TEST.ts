import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readOwned } from './readOwned'
import { writeOwned } from './writeOwned'

void test('a missing sidecar reads as an empty record', async () => {
  assert.deepEqual(await readOwned('/nonexistent/owned.json'), {})
})

void test('a written record round-trips', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-owned-'))
  const path = join(dir, 'owned.json')
  const record = { mcp: { 'claude-personal': ['serena', 'context7'] } }

  await writeOwned(path, record)
  assert.deepEqual(await readOwned(path), record)
})

void test('writing creates the parent directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-owned-'))
  const path = join(dir, 'nested', 'deeper', 'owned.json')

  await writeOwned(path, { mcp: { codex: ['a'] } })
  assert.deepEqual(await readOwned(path), { mcp: { codex: ['a'] } })
})

void test('a corrupt sidecar reads as empty rather than throwing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-owned-'))
  const path = join(dir, 'owned.json')

  await writeOwned(path, { mcp: { codex: ['a'] } })
  await fs.writeFile(path, '{ not json')

  assert.deepEqual(await readOwned(path), {})
})
