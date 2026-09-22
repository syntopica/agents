import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { removeStaleNamespaceEntries } from './removeStaleNamespaceEntries'

void test('a skill removed from the repo is pruned from its namespace', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-namespace-'))
  await fs.mkdir(path.join(dir, 'core', 'brp-docs'), { recursive: true })
  await fs.mkdir(path.join(dir, 'core', 'brp-plan'), { recursive: true })

  const removed = await removeStaleNamespaceEntries(dir, ['core/brp-docs'])

  assert.deepEqual(removed, [path.join('core', 'brp-plan')])
  assert.deepEqual(await fs.readdir(path.join(dir, 'core')), ['brp-docs'])
  await fs.rm(dir, { recursive: true, force: true })
})

void test('externally installed root-level skills are never touched', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-namespace-'))
  await fs.mkdir(path.join(dir, 'foreign-skill'), { recursive: true })
  await fs.mkdir(path.join(dir, 'core', 'brp-docs'), { recursive: true })

  const removed = await removeStaleNamespaceEntries(dir, ['core/brp-docs'])

  assert.deepEqual(removed, [])
  assert.deepEqual(
    (await fs.readdir(dir)).sort((a, b) => a.localeCompare(b)),
    ['core', 'foreign-skill'],
  )
  await fs.rm(dir, { recursive: true, force: true })
})

void test('flat skill names touch no namespace at all', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-namespace-'))
  await fs.mkdir(path.join(dir, 'foreign-skill'), { recursive: true })

  const removed = await removeStaleNamespaceEntries(dir, ['flat-skill'])

  assert.deepEqual(removed, [])
  assert.deepEqual(await fs.readdir(dir), ['foreign-skill'])
  await fs.rm(dir, { recursive: true, force: true })
})
