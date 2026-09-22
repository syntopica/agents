import assert from 'node:assert/strict'
import test from 'node:test'
import { createTempConfigFile as tempFile } from './fixtures/createTempConfigFile'
import { readClaudeServers } from './readClaudeServers'
import { readCodexServers } from './readCodexServers'

void test('claude servers are read from mcpServers', async () => {
  const path = await tempFile(
    '.claude.json',
    JSON.stringify({ mcpServers: { a: { type: 'stdio' } } }),
  )
  assert.deepEqual(await readClaudeServers(path), { a: { type: 'stdio' } })
})

void test('a missing claude config reads as empty', async () => {
  assert.deepEqual(await readClaudeServers('/nonexistent/path.json'), {})
})

void test('a zero-byte config reads as empty instead of throwing', async () => {
  const path = await tempFile('mcp_config.json', '')
  assert.deepEqual(await readClaudeServers(path), {})
})

void test('a corrupt config reads as empty instead of throwing', async () => {
  const path = await tempFile('broken.json', '{ not json')
  assert.deepEqual(await readClaudeServers(path), {})
})

void test('codex tables are read into a record', async () => {
  const path = await tempFile(
    'config.toml',
    [
      'model = "gpt-5.6"',
      '',
      '[mcp_servers.codegraph]',
      'command = "codegraph"',
      'args = ["serve", "--mcp"]',
      '',
      '[mcp_servers.codegraph.env]',
      'FOO = "bar"',
      '',
      '[other_section]',
      'key = "value"',
    ].join('\n'),
  )
  const servers = await readCodexServers(path)
  assert.deepEqual(Object.keys(servers), ['codegraph'])
  assert.equal(servers['codegraph']?.['command'], '"codegraph"')
  assert.equal(servers['codegraph']['env.FOO'], '"bar"')
})

void test('sections after mcp_servers do not leak into the last server', async () => {
  const path = await tempFile(
    'config.toml',
    [
      '[mcp_servers.a]',
      'command = "a"',
      '',
      '[sandbox]',
      'mode = "workspace-write"',
    ].join('\n'),
  )
  const servers = await readCodexServers(path)
  assert.equal(servers['a']?.['mode'], undefined)
})

void test('a missing codex config reads as empty', async () => {
  assert.deepEqual(await readCodexServers('/nonexistent/config.toml'), {})
})
