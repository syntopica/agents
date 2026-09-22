import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { createRecordingRunner } from '../../exec/fixtures/createRecordingRunner'
import { apply } from './apply'
import { createPluginsPaths } from './fixtures/createPluginsPaths'
import { createTempCacheDirectory } from './fixtures/createTempCacheDirectory'
import { pruneOrphanCacheDirectories } from './pruneOrphanCacheDirectories'

void test('install and remove shell out to the claude CLI on the shared tree', async () => {
  const { calls, run } = createRecordingRunner()

  const result = await apply({
    changes: [
      { operation: 'install', id: 'caveman@busirocket', detail: '1.0.0' },
      { operation: 'remove', id: 'old@busirocket', detail: '0.1.0' },
    ],
    paths: createPluginsPaths('/home/u'),
    run,
  })

  assert.equal(result.applied.length, 2)
  assert.deepEqual(calls.at(0)?.argv, [
    'claude',
    'plugin',
    'install',
    '--scope',
    'user',
    '--yes',
    'caveman@busirocket',
  ])
  assert.deepEqual(calls.at(1)?.argv, [
    'claude',
    'plugin',
    'uninstall',
    '--scope',
    'user',
    'old@busirocket',
  ])
  assert.equal(calls.at(0)?.env, undefined)
})

void test("enablement targets the profile's config directory", async () => {
  const { calls, run } = createRecordingRunner()

  const result = await apply({
    changes: [
      {
        operation: 'enable',
        id: 'caveman@busirocket',
        detail: 'claude-secondary is disabled',
        profile: 'claude-secondary',
      },
      {
        operation: 'disable',
        id: 'noisy@busirocket',
        detail: 'claude-personal is enabled',
        profile: 'claude-personal',
      },
    ],
    paths: createPluginsPaths('/home/u'),
    run,
  })

  assert.equal(result.applied.length, 2)
  assert.deepEqual(calls.at(0)?.env, {
    CLAUDE_CONFIG_DIR: join('/home/u', '.claude-secondary'),
  })
  assert.deepEqual(calls.at(1)?.env, {
    CLAUDE_CONFIG_DIR: join('/home/u', '.claude'),
  })
  assert.deepEqual(calls.at(1)?.argv, [
    'claude',
    'plugin',
    'disable',
    '--scope',
    'user',
    'noisy@busirocket',
  ])
})

void test('a pin is reported as manual, never executed', async () => {
  const { calls, run } = createRecordingRunner()

  const result = await apply({
    changes: [
      { operation: 'pin', id: 'caveman@busirocket', detail: '1.0.0 -> 1.2.0' },
    ],
    paths: createPluginsPaths('/home/u'),
    run,
  })

  assert.deepEqual(calls, [])
  assert.equal(result.manual.length, 1)
  assert.equal(result.applied.length, 0)
})

void test('a failing command lands in failed with its output', async () => {
  const { run } = createRecordingRunner(['install'])

  const result = await apply({
    changes: [
      { operation: 'install', id: 'caveman@busirocket', detail: '1.0.0' },
    ],
    paths: createPluginsPaths('/home/u'),
    run,
  })

  assert.equal(result.failed.length, 1)
  assert.equal(result.failed.at(0)?.error, 'command failed')
  assert.equal(result.applied.length, 0)
})

void test('prune removes only orphan cache directories', async () => {
  const cacheDir = await createTempCacheDirectory([
    ['busirocket', 'caveman', '1.0.0'],
    ['orphaned-marketplace', 'left', 'over'],
  ])

  const pruned = await pruneOrphanCacheDirectories({
    cacheDir,
    marketplaces: [{ name: 'busirocket', source: 'github:busirocket/plugins' }],
  })

  assert.deepEqual(pruned, [join(cacheDir, 'orphaned-marketplace')])
  assert.deepEqual(await readdir(cacheDir), ['busirocket'])
})
