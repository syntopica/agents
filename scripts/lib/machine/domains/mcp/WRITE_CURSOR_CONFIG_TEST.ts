import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeCursorConfig } from './writeCursorConfig'

void test('Cursor config preserves foreign keys and is idempotent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cursor-config-'))
  const path = join(dir, 'mcp.json')
  await writeFile(
    path,
    `${JSON.stringify({ metadata: { owner: 'user' }, mcpServers: { foreign: { command: 'x' } } }, null, 2)}\n`,
  )

  await writeCursorConfig({
    path,
    servers: { serena: { command: 'serena' } },
    ownedNames: [],
  })
  const first = await readFile(path, 'utf8')
  const parsed = JSON.parse(first) as Record<string, unknown>
  assert.deepEqual(parsed['metadata'], { owner: 'user' })
  assert.deepEqual(parsed['mcpServers'], {
    foreign: { command: 'x' },
    serena: { command: 'serena' },
  })

  await writeCursorConfig({
    path,
    servers: { serena: { command: 'serena' } },
    ownedNames: ['serena'],
  })
  assert.equal(await readFile(path, 'utf8'), first)
})

void test('Cursor config removes stale owned servers and keeps foreign servers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cursor-config-stale-'))
  const path = join(dir, 'mcp.json')
  await writeFile(
    path,
    JSON.stringify({
      mcpServers: { stale: { command: 'old' }, foreign: { command: 'keep' } },
    }),
  )
  await writeCursorConfig({ path, servers: {}, ownedNames: ['stale'] })
  const parsed = JSON.parse(await readFile(path, 'utf8')) as {
    mcpServers: Record<string, unknown>
  }
  assert.deepEqual(parsed.mcpServers, { foreign: { command: 'keep' } })
})

void test('Cursor config rejects corrupt JSON', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cursor-config-invalid-'))
  const path = join(dir, 'mcp.json')
  await writeFile(path, '{ invalid')
  await assert.rejects(
    writeCursorConfig({ path, servers: {}, ownedNames: [] }),
    SyntaxError,
  )
})
