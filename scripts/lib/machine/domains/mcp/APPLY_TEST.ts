import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createTempConfigFile } from './fixtures/createTempConfigFile'
import { readClaudeServersFromFile } from './fixtures/readClaudeServersFromFile'
import { writeClaudeConfig } from './writeClaudeConfig'

export const configWith = async (contents: unknown) =>
  createTempConfigFile('.claude.json', JSON.stringify(contents, null, 2))

void test('keys outside mcpServers survive the write', async () => {
  const path = await configWith({ theme: 'dark', mcpServers: {} })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })

  const written = JSON.parse(await readFile(path, 'utf8')) as Record<
    string,
    unknown
  >
  assert.equal(written['theme'], 'dark')
})

void test('a foreign server is preserved', async () => {
  const path = await configWith({ mcpServers: { foreign: { type: 'stdio' } } })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })

  assert.deepEqual(
    Object.keys(await readClaudeServersFromFile(path)).toSorted((a, b) =>
      a.localeCompare(b),
    ),
    ['a', 'foreign'],
  )
})

void test('a previously owned server that is no longer desired is removed', async () => {
  const path = await configWith({
    mcpServers: { stale: { type: 'stdio' }, foreign: { type: 'stdio' } },
  })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: ['stale'],
  })

  assert.deepEqual(
    Object.keys(await readClaudeServersFromFile(path)).toSorted((a, b) =>
      a.localeCompare(b),
    ),
    ['a', 'foreign'],
  )
})

void test('the returned ownership list is the servers just written', async () => {
  const path = await configWith({ mcpServers: {} })
  const owned = await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' }, b: { type: 'stdio' } },
    ownedNames: [],
  })

  assert.deepEqual(
    owned.toSorted((a, b) => a.localeCompare(b)),
    ['a', 'b'],
  )
})

void test('writing twice leaves an identical file', async () => {
  const path = await configWith({ mcpServers: {} })
  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })
  const first = await readFile(path, 'utf8')

  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: ['a'],
  })
  assert.equal(await readFile(path, 'utf8'), first)
})

void test('a missing config file is created', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machine-apply-'))
  const path = join(dir, 'absent.json')

  await writeClaudeConfig({
    path,
    servers: { a: { type: 'stdio' } },
    ownedNames: [],
  })
  assert.deepEqual(Object.keys(await readClaudeServersFromFile(path)), ['a'])
})
