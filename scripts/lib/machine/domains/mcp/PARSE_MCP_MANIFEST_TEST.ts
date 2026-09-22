import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMcpManifest } from './parseMcpManifest'

void test('a valid stdio server parses', () => {
  const result = parseMcpManifest({
    servers: {
      serena: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'uvx',
        args: ['serena', 'start-mcp-server'],
      },
    },
  })
  assert.equal(result.ok, true)
})

void test('an http server without a url is rejected', () => {
  const result = parseMcpManifest({
    servers: { context7: { targets: ['codex'], transport: 'http' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('url')))
})

void test('a stdio server carrying a url is rejected', () => {
  const result = parseMcpManifest({
    servers: {
      mixed: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'x',
        url: 'https://example.com',
      },
    },
  })
  assert.equal(result.ok, false)
})

void test('an unknown target is rejected and names the offender', () => {
  const result = parseMcpManifest({
    servers: { x: { targets: ['emacs'], transport: 'stdio', command: 'x' } },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('emacs')))
})

void test('a credential literal fails validation through the manifest parser', () => {
  const result = parseMcpManifest({
    servers: {
      leaky: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'npx',
        env: { TOKEN: 'ghp_0000000000000000000000000000000000' },
      },
    },
  })
  assert.ok(!result.ok)
  assert.ok(result.errors.some((error) => error.includes('env.TOKEN')))
})

void test('an empty targets list is rejected', () => {
  const result = parseMcpManifest({
    servers: { x: { targets: [], transport: 'stdio', command: 'x' } },
  })
  assert.equal(result.ok, false)
})

void test('a manifest that is not an object is rejected', () => {
  assert.equal(parseMcpManifest('nope').ok, false)
  assert.equal(parseMcpManifest(null).ok, false)
})

void test('a non-positive startup timeout is rejected', () => {
  const result = parseMcpManifest({
    servers: {
      serena: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'serena',
        startup_timeout_sec: 0,
      },
    },
  })
  assert.equal(result.ok, false)
})

void test('a non-boolean required flag is rejected', () => {
  const result = parseMcpManifest({
    servers: {
      serena: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'serena',
        required: 'yes',
      },
    },
  })
  assert.equal(result.ok, false)
})

void test('an unknown Codex tool approval mode is rejected', () => {
  const result = parseMcpManifest({
    servers: {
      memstore: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'memstore-mcp',
        default_tools_approval_mode: 'always',
      },
    },
  })
  assert.equal(result.ok, false)
})
