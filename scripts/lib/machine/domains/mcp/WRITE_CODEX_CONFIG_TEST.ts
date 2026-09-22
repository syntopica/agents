import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createTempConfigFile } from './fixtures/createTempConfigFile'
import { writeCodexConfig } from './writeCodexConfig'

void test('settings outside mcp_servers are preserved', async () => {
  const path = await createTempConfigFile(
    'config.toml',
    ['model = "gpt-5.6-sol"', 'model_reasoning_effort = "high"', ''].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "a"',
    ownedNames: [],
    renderedNames: ['a'],
  })

  const written = await readFile(path, 'utf8')
  assert.match(written, /model = "gpt-5\.6-sol"/)
  assert.match(written, /model_reasoning_effort = "high"/)
})

void test('a foreign server block survives', async () => {
  const path = await createTempConfigFile(
    'config.toml',
    ['[mcp_servers.foreign]', 'command = "keep-me"', ''].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "a"',
    ownedNames: [],
    renderedNames: ['a'],
  })

  const written = await readFile(path, 'utf8')
  assert.match(written, /\[mcp_servers\.foreign\]/)
  assert.match(written, /command = "keep-me"/)
})

void test('an owned block is replaced rather than duplicated', async () => {
  const path = await createTempConfigFile(
    'config.toml',
    ['[mcp_servers.a]', 'command = "old"', ''].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "new"',
    ownedNames: ['a'],
    renderedNames: ['a'],
  })

  const written = await readFile(path, 'utf8')
  assert.equal(written.match(/\[mcp_servers\.a\]/g)?.length, 1)
  assert.match(written, /command = "new"/)
  assert.equal(written.includes('command = "old"'), false)
})

void test('an owned sub-table is removed with its parent', async () => {
  const path = await createTempConfigFile(
    'config.toml',
    [
      '[mcp_servers.a]',
      'command = "old"',
      '',
      '[mcp_servers.a.env]',
      'K = "v"',
      '',
      '[sandbox]',
      'mode = "x"',
    ].join('\n'),
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "new"',
    ownedNames: ['a'],
    renderedNames: ['a'],
  })

  const written = await readFile(path, 'utf8')
  assert.equal(written.includes('K = "v"'), false)
  assert.match(written, /\[sandbox\]/)
})

void test('writing twice leaves an identical file', async () => {
  const path = await createTempConfigFile(
    'config.toml',
    'model = "gpt-5.6-sol"\n',
  )
  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "a"',
    ownedNames: [],
    renderedNames: ['a'],
  })
  const first = await readFile(path, 'utf8')

  await writeCodexConfig({
    path,
    toml: '[mcp_servers.a]\ncommand = "a"',
    ownedNames: ['a'],
    renderedNames: ['a'],
  })
  assert.equal(await readFile(path, 'utf8'), first)
})
