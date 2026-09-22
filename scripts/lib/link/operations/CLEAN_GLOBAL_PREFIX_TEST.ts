import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { cleanGlobalPrefix } from './cleanGlobalPrefix'

void test('an empty prefix removes nothing instead of wiping the directory', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clean-prefix-'))
  await fs.mkdir(path.join(dir, 'foreign-skill'))
  await fs.mkdir(path.join(dir, 'brp-old'))

  const removed = await cleanGlobalPrefix(dir, '')

  assert.deepEqual(removed, [])
  assert.deepEqual(
    (await fs.readdir(dir)).sort((a, b) => a.localeCompare(b)),
    ['brp-old', 'foreign-skill'],
  )
  await fs.rm(dir, { recursive: true, force: true })
})

void test('a named prefix removes only matching entries', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clean-prefix-'))
  await fs.mkdir(path.join(dir, 'foreign-skill'))
  await fs.mkdir(path.join(dir, 'brp-old'))

  const removed = await cleanGlobalPrefix(dir, 'brp-')

  assert.deepEqual(removed, ['brp-old'])
  assert.deepEqual(await fs.readdir(dir), ['foreign-skill'])
  await fs.rm(dir, { recursive: true, force: true })
})
