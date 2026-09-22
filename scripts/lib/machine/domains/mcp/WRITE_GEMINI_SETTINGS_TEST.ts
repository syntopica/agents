import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeGeminiSettings } from './writeGeminiSettings'

void test('Gemini settings preserve foreign settings and MCP servers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gemini-settings-'))
  const path = join(dir, 'settings.json')
  await writeFile(
    path,
    `${JSON.stringify({ theme: 'dark', hooks: { BeforeTool: [] }, mcpServers: { foreign: { command: 'x' } } }, null, 2)}\n`,
  )

  await writeGeminiSettings({
    path,
    servers: { serena: { command: 'serena' } },
    ownedNames: [],
  })
  const first = await readFile(path, 'utf8')
  const parsed = JSON.parse(first) as Record<string, unknown>
  assert.equal(parsed['theme'], 'dark')
  assert.deepEqual(parsed['hooks'], { BeforeTool: [] })
  assert.deepEqual(parsed['mcpServers'], {
    foreign: { command: 'x' },
    serena: { command: 'serena' },
  })

  await writeGeminiSettings({
    path,
    servers: { serena: { command: 'serena' } },
    ownedNames: ['serena'],
  })
  assert.equal(await readFile(path, 'utf8'), first)
})

void test('Gemini settings remove only stale owned MCP servers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gemini-settings-stale-'))
  const path = join(dir, 'settings.json')
  await writeFile(
    path,
    JSON.stringify({
      mcpServers: { stale: { command: 'old' }, foreign: { command: 'keep' } },
    }),
  )

  const owned = await writeGeminiSettings({
    path,
    servers: {},
    ownedNames: ['stale'],
  })
  const parsed = JSON.parse(await readFile(path, 'utf8')) as {
    mcpServers: Record<string, unknown>
  }
  assert.deepEqual(owned, [])
  assert.deepEqual(parsed.mcpServers, { foreign: { command: 'keep' } })
})

void test('Gemini settings reject corrupt JSON', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gemini-settings-invalid-'))
  const path = join(dir, 'settings.json')
  await writeFile(path, '{ invalid')

  await assert.rejects(
    writeGeminiSettings({ path, servers: {}, ownedNames: [] }),
    SyntaxError,
  )
})
