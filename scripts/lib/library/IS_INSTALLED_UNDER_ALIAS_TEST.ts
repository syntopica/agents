import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { isInstalledUnderAlias } from './isInstalledUnderAlias'

void test('an aliased entry present in the destination is not linked again', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alias-'))
  await mkdir(join(dir, 'brainstorming'))
  assert.equal(
    await isInstalledUnderAlias(
      {
        state: 'adopted',
        source: 'obra/superpowers',
        reason: 'test',
        aliases: { claude: 'brainstorming' },
      },
      'claude',
      dir,
    ),
    true,
  )
  await rm(dir, { recursive: true, force: true })
})

void test('an aliased entry absent from a fresh destination is still linked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alias-'))
  assert.equal(
    await isInstalledUnderAlias(
      {
        state: 'adopted',
        source: 'obra/superpowers',
        reason: 'test',
        aliases: { claude: 'brainstorming' },
      },
      'claude',
      dir,
    ),
    false,
  )
  await rm(dir, { recursive: true, force: true })
})

void test('an alias for another target, or none, does not skip the link', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alias-'))
  await mkdir(join(dir, 'superpowers-brainstorming'))
  assert.equal(
    await isInstalledUnderAlias(
      {
        state: 'adopted',
        source: 'obra/superpowers',
        reason: 'test',
        aliases: { codex: 'superpowers-brainstorming' },
      },
      'claude',
      dir,
    ),
    false,
  )
  assert.equal(
    await isInstalledUnderAlias(
      { state: 'adopted', source: 'obra/superpowers', reason: 'test' },
      'claude',
      dir,
    ),
    false,
  )
  assert.equal(await isInstalledUnderAlias(undefined, 'claude', dir), false)
  await rm(dir, { recursive: true, force: true })
})
